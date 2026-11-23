import { create } from 'zustand'
import type { MicFehlerArt } from '../audio/micErrors'

// Nicht-fatale Hinweise während das Mikrofon läuft (höchstens einer zugleich).
export type MicHinweisArt = 'keinSignal' | 'angehalten'

// Zustände des Mikrofons für die Oberfläche. Nur einfache Daten –
// niemals AudioContext- oder Stream-Objekte im Store.
export type MicStatus =
  | 'idle'
  | 'startet'
  | 'laeuft'
  | 'gestoppt'
  | 'hintergrund'
  | 'fehler'
  | 'unsicher'

// Live-Messwerte, höchstens PUBLISH_HZ-mal pro Sekunde aktualisiert.
export interface LiveWerte {
  // Deutscher Notenname mit Oktave (z. B. „Gis4“), null wenn kein Ton erkannt.
  notenLabel: string | null
  cents: number | null
  hz: number | null
  // Internationaler Name (z. B. „G♯4“).
  international: string | null
  // Pegel in dBFS (−Infinity bei Stille).
  db: number | null
  // Rohe Klarheit von pitchy (0..1).
  klarheit: number | null
  // Note wird nach dem Verklingen noch gehalten (ab Plan 03).
  gehalten: boolean
}

interface MicState {
  status: MicStatus
  // Technische Fehlerangabe „Name: Nachricht“, sonst null.
  fehlerDetails: string | null
  // Art des Start-Fehlers für die deutsche Hilfe, sonst null.
  fehlerArt: MicFehlerArt | null
  // Aktiver Hinweis (Vorrang: keinSignal vor angehalten), sonst null.
  hinweis: MicHinweisArt | null
  live: LiveWerte
}

const LEERE_LIVE_WERTE: LiveWerte = {
  notenLabel: null,
  cents: null,
  hz: null,
  international: null,
  db: null,
  klarheit: null,
  gehalten: false,
}

export const MIC_START_ZUSTAND: MicState = {
  status: 'idle',
  fehlerDetails: null,
  fehlerArt: null,
  hinweis: null,
  live: LEERE_LIVE_WERTE,
}

export const useMicStore = create<MicState>()(() => ({ ...MIC_START_ZUSTAND }))
