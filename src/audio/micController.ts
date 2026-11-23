import { AnalyserPitchSource } from './analyserPitchSource'
import type { PitchSource } from './pitchSource'
import { useMicStore } from '../state/micStore'

// Warum gestoppt wird: Nutzer-Tipp, Seite verlassen oder App im Hintergrund.
export type StopGrund = 'nutzer' | 'verlassen' | 'hintergrund'

export interface MicController {
  start(): Promise<void>
  stop(grund: StopGrund): void
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

// Steuert Start/Stopp des Mikrofons und schreibt den Zustand in den micStore.
export function erstelleMicController({
  quelle = new AnalyserPitchSource(),
}: { quelle?: PitchSource } = {}): MicController {
  // Zählt Läufe; ein Stopp während des Startens macht den laufenden Start ungültig.
  let laufNummer = 0

  async function start(): Promise<void> {
    const { status } = useMicStore.getState()
    if (status === 'startet' || status === 'laeuft') return
    const meineNummer = ++laufNummer
    useMicStore.setState({ status: 'startet', fehlerDetails: null })
    // Synchron aufrufen – kein await davor, sonst verliert iOS die Tipp-Geste (D-01).
    const p = quelle.start()
    try {
      await p
      if (meineNummer === laufNummer) useMicStore.setState({ status: 'laeuft' })
    } catch (fehler) {
      if (meineNummer === laufNummer) {
        useMicStore.setState({ status: 'fehler', fehlerDetails: fehlerText(fehler) })
      }
    }
  }

  function stop(grund: StopGrund): void {
    laufNummer++
    quelle.stop()
    const status = grund === 'nutzer' ? 'gestoppt' : grund === 'verlassen' ? 'idle' : 'hintergrund'
    useMicStore.setState({ status, fehlerDetails: null })
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
