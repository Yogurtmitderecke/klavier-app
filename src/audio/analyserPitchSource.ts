import { holeAudioKontext } from './audioKontext'
import { FFT_SIZE } from './einstellungen'
import type { KontextStatus, PitchSource } from './pitchSource'

export interface AnalyserPitchSourceOptionen {
  // Standard: navigator.mediaDevices (erst beim Start gelesen – jsdom hat keins).
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>
  // Standard: der gemeinsame AudioContext der App.
  holeKontext?: () => AudioContext
}

// Aufnahme: getUserMedia → MediaStreamSource → AnalyserNode(FFT_SIZE) → Gain(0) → destination.
// Der stumme Gain-Zweig hält den Graphen in WebKit aktiv, ohne etwas hörbar auszugeben.
export class AnalyserPitchSource implements PitchSource {
  private readonly mediaDevicesOption: Pick<MediaDevices, 'getUserMedia'> | undefined
  private readonly holeKontext: () => AudioContext
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
  }

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 0
  }

  kontextStatus(): KontextStatus | null {
    return (this.ctx?.state as KontextStatus | undefined) ?? null
  }

  async start(): Promise<void> {
    const meineNummer = ++this.startNummer
    const ctx = this.holeKontext()
    this.ctx = ctx
    // iOS: resume() muss synchron in der Tipp-Geste laufen – also VOR jedem await (D-01).
    const fortgesetzt = ctx.resume()

    const mediaDevices = this.mediaDevicesOption ?? navigator.mediaDevices
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
  }

  stop(): void {
    // Idempotent: auch ohne laufendes Mikrofon gefahrlos aufrufbar.
    this.startNummer++
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
