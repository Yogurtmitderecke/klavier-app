import { holeAudioKontext } from './audioKontext'
import { FFT_SIZE } from './einstellungen'
import { isInsecureContext } from '../lib/secureContext'
import type { KontextStatus, PitchSource, QuellenDiagnose } from './pitchSource'
import { TEXTE } from '../texte'

type MediaDevicesTeil = Pick<MediaDevices, 'getUserMedia'> &
  Partial<Pick<MediaDevices, 'getSupportedConstraints'>>

export interface AnalyserPitchSourceOptionen {
  // Standard: navigator.mediaDevices (erst beim Start gelesen – jsdom hat keins).
  mediaDevices?: MediaDevicesTeil
  // Standard: der gemeinsame AudioContext der App.
  holeKontext?: () => AudioContext
  // Standard: sicher, solange window.isSecureContext nicht ausdrücklich false ist.
  isSecureContext?: () => boolean
  // Standard: navigator.audioSession?.type (Safari 16.4+), sonst null.
  audioSitzung?: () => string | null
}

// Die drei Sprachfilter, deren Einstellbarkeit die Diagnose zeigt.
const FILTER_SCHLUESSEL = ['echoCancellation', 'noiseSuppression', 'autoGainControl'] as const

const uhrzeit = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const EREIGNIS = TEXTE.mikrofonTest.diagnose.werte.ereignis

function leereDiagnose(): QuellenDiagnose {
  return {
    kontextStatus: null,
    abtastrateApp: null,
    abtastrateMikro: null,
    echo: null,
    rausch: null,
    autoPegel: null,
    einstellbar: null,
    mikrofonName: null,
    spur: null,
    audioSitzung: null,
    letztesEreignis: null,
  }
}

function standardAudioSitzung(): string | null {
  return globalThis.navigator?.audioSession?.type ?? null
}

// Aufnahme: getUserMedia → MediaStreamSource → AnalyserNode(FFT_SIZE) → Gain(0) → destination.
// Der stumme Gain-Zweig hält den Graphen in WebKit aktiv, ohne etwas hörbar auszugeben.
export class AnalyserPitchSource implements PitchSource {
  private readonly mediaDevicesOption: MediaDevicesTeil | undefined
  private readonly holeKontext: () => AudioContext
  private readonly istSicher: () => boolean
  private readonly leseAudioSitzung: () => string | null
  // Gerätewerte des letzten Laufs (bleiben nach stop() für die Diagnose stehen).
  private schnappschuss: QuellenDiagnose = leereDiagnose()
  private rueckruf: (() => void) | null = null
  // Registrierte Hörer, damit stop() alle wieder entfernen kann (T-02-17).
  private abmelden: (() => void)[] = []
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private quelle: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private stumm: GainNode | null = null
  // Zählt Starts/Stopps; ändert er sich während des Wartens, ist der Start überholt.
  private startNummer = 0

  constructor(optionen: AnalyserPitchSourceOptionen = {}) {
    this.mediaDevicesOption = optionen.mediaDevices
    this.holeKontext = optionen.holeKontext ?? (() => holeAudioKontext())
    this.istSicher = optionen.isSecureContext ?? (() => !isInsecureContext())
    this.leseAudioSitzung = optionen.audioSitzung ?? standardAudioSitzung
  }

  // Option oder navigator.mediaDevices – jsdom und unsichere Seiten haben keins.
  private mediaDevices(): MediaDevicesTeil | undefined {
    return this.mediaDevicesOption ?? globalThis.navigator?.mediaDevices
  }

  diagnose(): QuellenDiagnose {
    return {
      ...this.schnappschuss,
      // Live gelesen: der Kontext-Zustand ändert sich auch ohne laufendes Mikrofon.
      kontextStatus: this.kontextStatus(),
      abtastrateApp: this.ctx?.sampleRate ?? null,
      audioSitzung: this.leseAudioSitzung(),
    }
  }

  beiAenderung(cb: (() => void) | null): void {
    this.rueckruf = cb
  }

  private ereignis(text: string): void {
    this.schnappschuss.letztesEreignis = { zeit: uhrzeit.format(new Date()), text }
    this.rueckruf?.()
  }

  // Liest, was das Gerät wirklich geliefert hat. undefined bleibt undefined – nie zu true/false
  // umdeuten (Safari meldet die Filter oft gar nicht, Pitfall 2).
  private erfasseGeraet(stream: MediaStream, ctx: AudioContext): void {
    const track = stream.getAudioTracks()[0]
    const settings: MediaTrackSettings = track !== undefined ? track.getSettings() : {}
    const unterstuetzt = this.mediaDevices()?.getSupportedConstraints?.() as
      | Record<string, boolean | undefined>
      | undefined
    this.schnappschuss = {
      ...this.schnappschuss,
      abtastrateMikro: settings.sampleRate,
      echo: settings.echoCancellation as boolean | undefined,
      rausch: settings.noiseSuppression,
      autoPegel: settings.autoGainControl,
      einstellbar:
        unterstuetzt === undefined ? null : FILTER_SCHLUESSEL.filter((k) => unterstuetzt[k] === true),
      mikrofonName: track?.label ?? null,
      spur:
        track === undefined
          ? null
          : track.readyState === 'ended'
            ? 'beendet'
            : track.muted
              ? 'stumm'
              : 'aktiv',
    }

    if (track !== undefined) {
      const beiStumm = () => {
        this.schnappschuss.spur = 'stumm'
        this.ereignis(EREIGNIS.stumm)
      }
      const beiAktiv = () => {
        this.schnappschuss.spur = 'aktiv'
        this.ereignis(EREIGNIS.aktiv)
      }
      const beiEnde = () => {
        this.schnappschuss.spur = 'beendet'
        this.ereignis(EREIGNIS.beendet)
      }
      track.addEventListener('mute', beiStumm)
      track.addEventListener('unmute', beiAktiv)
      track.addEventListener('ended', beiEnde)
      this.abmelden.push(() => {
        track.removeEventListener('mute', beiStumm)
        track.removeEventListener('unmute', beiAktiv)
        track.removeEventListener('ended', beiEnde)
      })
    }

    const beiStatus = () => {
      this.ereignis(`${EREIGNIS.status}${ctx.state}`)
    }
    ctx.addEventListener?.('statechange', beiStatus)
    this.abmelden.push(() => ctx.removeEventListener?.('statechange', beiStatus))
  }

  zugangMoeglich(): boolean {
    return this.istSicher() && typeof this.mediaDevices()?.getUserMedia === 'function'
  }

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 0
  }

  kontextStatus(): KontextStatus | null {
    return (this.ctx?.state as KontextStatus | undefined) ?? null
  }

  async start(): Promise<void> {
    // Ohne HTTPS oder getUserMedia gar nicht erst anfangen – auch keinen Kontext anlegen.
    if (!this.zugangMoeglich()) {
      const fehler = new Error('Kein sicherer Zugang zum Mikrofon (HTTPS/getUserMedia fehlt).')
      fehler.name = 'UnsicherError'
      throw fehler
    }
    const meineNummer = ++this.startNummer
    const ctx = this.holeKontext()
    this.ctx = ctx
    // iOS: resume() muss synchron in der Tipp-Geste laufen – also VOR jedem await (D-01).
    const fortgesetzt = ctx.resume()

    // zugangMoeglich() hat oben bereits geprüft, dass es existiert.
    const mediaDevices = this.mediaDevices() as Pick<MediaDevices, 'getUserMedia'>
    // Sprachverarbeitung ausdrücklich aus: sie dämpft und „pumpt“ Klaviertöne (MIC-01).
    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
      video: false,
    })

    if (meineNummer !== this.startNummer) {
      // Während der Erlaubnis-Abfrage wurde gestoppt: Stream sofort wieder freigeben.
      for (const track of stream.getTracks()) track.stop()
      return
    }

    await fortgesetzt.catch(() => {})
    if (ctx.state !== 'running') {
      await ctx.resume().catch(() => {})
    }

    if (meineNummer !== this.startNummer) {
      for (const track of stream.getTracks()) track.stop()
      return
    }

    const quelle = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    const stumm = ctx.createGain()
    stumm.gain.value = 0
    quelle.connect(analyser)
    analyser.connect(stumm)
    stumm.connect(ctx.destination)

    this.stream = stream
    this.quelle = quelle
    this.analyser = analyser
    this.stumm = stumm
    this.erfasseGeraet(stream, ctx)
  }

  stop(): void {
    // Idempotent: auch ohne laufendes Mikrofon gefahrlos aufrufbar.
    this.startNummer++
    // Erst alle Hörer entfernen, dann stoppen – sonst meldet das eigene Stoppen Ereignisse.
    for (const ab of this.abmelden) ab()
    this.abmelden = []
    // Die Spur ist nach dem Stopp weg; die übrigen Gerätewerte bleiben sichtbar.
    this.schnappschuss.spur = null
    this.quelle?.disconnect()
    this.stumm?.disconnect()
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop()
    }
    this.stream = null
    this.quelle = null
    this.analyser = null
    this.stumm = null
    // Nur pausieren, nie schließen: der Kontext wird von der ganzen App geteilt.
    this.ctx?.suspend().catch(() => {})
  }

  readFrame(buf: Float32Array): void {
    this.analyser?.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>)
  }
}
