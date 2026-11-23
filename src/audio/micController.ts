import type { PitchDetector } from 'pitchy'
import { AnalyserPitchSource } from './analyserPitchSource'
import { FFT_SIZE, GATE_OPEN_DB, PUBLISH_HZ } from './einstellungen'
import { internationalName, midiToNote } from './noteMath'
import { analysiereFrame, erstelleDetektor } from './pitchAnalysis'
import type { PitchSource } from './pitchSource'
import { MIC_START_ZUSTAND, useMicStore, type LiveWerte } from '../state/micStore'

// Warum gestoppt wird: Nutzer-Tipp, Seite verlassen oder App im Hintergrund.
export type StopGrund = 'nutzer' | 'verlassen' | 'hintergrund'

export interface MicController {
  start(): Promise<void>
  stop(grund: StopGrund): void
}

export interface MicControllerDeps {
  quelle?: PitchSource
  raf?: (cb: FrameRequestCallback) => number
  caf?: (id: number) => void
  jetzt?: () => number
}

function fehlerText(fehler: unknown): string {
  if (typeof fehler === 'object' && fehler !== null) {
    const f = fehler as { name?: unknown; message?: unknown }
    const name = typeof f.name === 'string' ? f.name : 'Fehler'
    const nachricht = typeof f.message === 'string' ? f.message : String(fehler)
    return `${name}: ${nachricht}`
  }
  return String(fehler)
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

  function frame(meineNummer: number): void {
    wartenderFrame = null
    if (meineNummer !== laufNummer) return
    quelle.readFrame(puffer)
    const a = analysiereFrame(puffer, quelle.sampleRate, holeDetektor(FFT_SIZE), jetzt)
    const t = jetzt()
    if (t - letzteVeroeffentlichung >= MIN_ABSTAND_MS) {
      letzteVeroeffentlichung = t
      // Vorläufig direkte Anzeige; Plan 03 ersetzt das durch die Glättung (PitchSmoother).
      const zeigeTon = a.valid && a.midiFloat !== null && a.db >= GATE_OPEN_DB
      const note = zeigeTon ? midiToNote(a.midiFloat as number) : null
      const live: LiveWerte = {
        notenLabel: note?.label ?? null,
        cents: note?.cents ?? null,
        hz: note ? a.hz : null,
        international: note ? internationalName(note.midi) : null,
        db: a.db,
        klarheit: a.clarity,
        gehalten: false,
      }
      useMicStore.setState({ live })
    }
    wartenderFrame = raf(() => frame(meineNummer))
  }

  async function start(): Promise<void> {
    const { status } = useMicStore.getState()
    if (status === 'startet' || status === 'laeuft') return
    const meineNummer = ++laufNummer
    useMicStore.setState({ status: 'startet', fehlerDetails: null })
    // Synchron aufrufen – kein await davor, sonst verliert iOS die Tipp-Geste (D-01).
    const p = quelle.start()
    try {
      await p
      if (meineNummer === laufNummer) {
        useMicStore.setState({ status: 'laeuft' })
        letzteVeroeffentlichung = -Infinity
        wartenderFrame = raf(() => frame(meineNummer))
      }
    } catch (fehler) {
      if (meineNummer === laufNummer) {
        useMicStore.setState({ status: 'fehler', fehlerDetails: fehlerText(fehler) })
      }
    }
  }

  function stop(grund: StopGrund): void {
    laufNummer++
    if (wartenderFrame !== null) {
      caf(wartenderFrame)
      wartenderFrame = null
    }
    quelle.stop()
    const status = grund === 'nutzer' ? 'gestoppt' : grund === 'verlassen' ? 'idle' : 'hintergrund'
    useMicStore.setState({ status, fehlerDetails: null, live: MIC_START_ZUSTAND.live })
  }

  return { start, stop }
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
