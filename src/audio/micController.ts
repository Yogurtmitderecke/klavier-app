import type { PitchDetector } from 'pitchy'
import { AnalyserPitchSource } from './analyserPitchSource'
import { FFT_SIZE, KEIN_SIGNAL_MS, PUBLISH_HZ } from './einstellungen'
import { classifyMicError, fehlerText } from './micErrors'
import { internationalName, midiToNote } from './noteMath'
import { analysiereFrame, erstelleDetektor, type FrameAnalyse } from './pitchAnalysis'
import type { PitchSource } from './pitchSource'
import { PitchSmoother, type GeglaetteteAnzeige } from './smoothing'
import {
  MIC_START_ZUSTAND,
  useMicStore,
  type LiveWerte,
  type MicHinweisArt,
} from '../state/micStore'

// Warum gestoppt wird: Nutzer-Tipp, Seite verlassen oder App im Hintergrund.
export type StopGrund = 'nutzer' | 'verlassen' | 'hintergrund'

export interface MicController {
  start(): Promise<void>
  stop(grund: StopGrund): void
  /** Prüft vor jedem Tipp, ob das Mikrofon überhaupt starten kann; sonst Status 'unsicher'. */
  pruefeZugang(): boolean
}

export interface MicControllerDeps {
  quelle?: PitchSource
  raf?: (cb: FrameRequestCallback) => number
  caf?: (id: number) => void
  jetzt?: () => number
}

// Setzt den Hinweis nur bei Änderung – kein Store-Update pro Frame.
function setzeHinweis(hinweis: MicHinweisArt | null): void {
  if (useMicStore.getState().hinweis !== hinweis) useMicStore.setState({ hinweis })
}

// Ein Detektor pro Fenstergröße, einmal erzeugt und wiederverwendet (nie pro Frame).
const detektorCache = new Map<number, PitchDetector<Float32Array>>()

function holeDetektor(n: number): PitchDetector<Float32Array> {
  let d = detektorCache.get(n)
  if (d === undefined) {
    d = erstelleDetektor(n)
    detektorCache.set(n, d)
  }
  return d
}

const MIN_ABSTAND_MS = 1000 / PUBLISH_HZ

// Steuert Start/Stopp des Mikrofons, analysiert jeden Frame und meldet
// gedrosselte Live-Werte an den micStore.
export function erstelleMicController({
  quelle = new AnalyserPitchSource(),
  raf = (cb) => window.requestAnimationFrame(cb),
  caf = (id) => window.cancelAnimationFrame(id),
  jetzt = () => performance.now(),
}: MicControllerDeps = {}): MicController {
  // Zählt Läufe; ein Stopp während des Startens macht den laufenden Start ungültig.
  let laufNummer = 0
  let wartenderFrame: number | null = null
  let letzteVeroeffentlichung = -Infinity
  // Ein Puffer für alle Frames – keine Allokation pro Frame.
  const puffer = new Float32Array(FFT_SIZE)
  // Glättung: Tor mit Hysterese, Median, Notenwechsel-Bestätigung, Oktavschutz, Nachhalten.
  const smoother = new PitchSmoother(jetzt)
  let letzteGueltigeHz: number | null = null
  // Seit wann alle Samples exakt 0 sind (null = es kommt Signal).
  let nullSeit: number | null = null

  // Baut die Live-Werte: Note aus der Glättung, Pegel und Klarheit roh.
  function liveWerte(g: GeglaetteteAnzeige, a: FrameAnalyse): LiveWerte {
    if (g.midi === null) {
      return {
        notenLabel: null,
        cents: null,
        hz: null,
        international: null,
        db: a.db,
        klarheit: a.clarity,
        gehalten: false,
      }
    }
    const note = midiToNote(g.midiFloat ?? g.midi)
    const hz = g.midiFloat !== null ? 440 * 2 ** ((g.midiFloat - 69) / 12) : letzteGueltigeHz
    return {
      notenLabel: note.label,
      cents: g.midiFloat !== null ? note.cents : null,
      hz,
      international: internationalName(g.midi),
      db: a.db,
      klarheit: a.clarity,
      gehalten: g.gehalten,
    }
  }

  function frame(meineNummer: number): void {
    wartenderFrame = null
    if (meineNummer !== laufNummer) return
    quelle.readFrame(puffer)
    const a = analysiereFrame(puffer, quelle.sampleRate, holeDetektor(FFT_SIZE), jetzt)
    // Jeder Frame geht durch die Glättung – auch die, die nicht veröffentlicht werden.
    const g = smoother.push(a)
    if (a.valid) letzteGueltigeHz = a.hz
    const t = jetzt()
    // Exakte Nullen (nicht bloß leise) heißen: das Mikrofon liefert gar nichts.
    if (a.rms === 0) {
      if (nullSeit === null) nullSeit = t
    } else {
      nullSeit = null
    }
    const keinSignal = nullSeit !== null && t - nullSeit > KEIN_SIGNAL_MS
    const angehalten = quelle.kontextStatus() !== 'running'
    // Höchstens ein Hinweis zugleich; „keinSignal“ hat Vorrang.
    setzeHinweis(keinSignal ? 'keinSignal' : angehalten ? 'angehalten' : null)
    if (t - letzteVeroeffentlichung >= MIN_ABSTAND_MS) {
      letzteVeroeffentlichung = t
      useMicStore.setState({ live: liveWerte(g, a) })
    }
    wartenderFrame = raf(() => frame(meineNummer))
  }

  async function start(): Promise<void> {
    const { status } = useMicStore.getState()
    if (status === 'startet' || status === 'laeuft') return
    const meineNummer = ++laufNummer
    useMicStore.setState({ status: 'startet', fehlerDetails: null, fehlerArt: null, hinweis: null })
    nullSeit = null
    // Synchron aufrufen – kein await davor, sonst verliert iOS die Tipp-Geste (D-01).
    const p = quelle.start()
    try {
      await p
      if (meineNummer === laufNummer) {
        // Läuft der Kontext auch nach dem zweiten resume() nicht, hilft nur Stopp + Start.
        const hinweis = quelle.kontextStatus() !== 'running' ? 'angehalten' : null
        useMicStore.setState({ status: 'laeuft', hinweis })
        letzteVeroeffentlichung = -Infinity
        smoother.reset()
        letzteGueltigeHz = null
        wartenderFrame = raf(() => frame(meineNummer))
      }
    } catch (fehler) {
      if (meineNummer === laufNummer) {
        const art = classifyMicError(fehler)
        if (art === 'unsicher') {
          useMicStore.setState({ status: 'unsicher' })
        } else {
          useMicStore.setState({
            status: 'fehler',
            fehlerArt: art,
            fehlerDetails: fehlerText(fehler),
          })
        }
      }
    }
  }

  function pruefeZugang(): boolean {
    if (quelle.zugangMoeglich()) return true
    useMicStore.setState({ status: 'unsicher' })
    return false
  }

  function stop(grund: StopGrund): void {
    laufNummer++
    if (wartenderFrame !== null) {
      caf(wartenderFrame)
      wartenderFrame = null
    }
    quelle.stop()
    smoother.reset()
    letzteGueltigeHz = null
    nullSeit = null
    const status = grund === 'nutzer' ? 'gestoppt' : grund === 'verlassen' ? 'idle' : 'hintergrund'
    useMicStore.setState({
      status,
      fehlerDetails: null,
      fehlerArt: null,
      hinweis: null,
      live: MIC_START_ZUSTAND.live,
    })
  }

  return { start, stop, pruefeZugang }
}

let aktiv: MicController | null = null

// Der App-weite Controller – entsteht erst beim ersten Zugriff.
export function holeMicController(): MicController {
  if (aktiv === null) aktiv = erstelleMicController()
  return aktiv
}

// Nur für Tests: ersetzt den App-weiten Controller (z. B. mit falschen Audio-Bausteinen).
export function setzeMicController(c: MicController): void {
  aktiv = c
}
