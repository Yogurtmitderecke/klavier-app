import { create } from 'zustand'

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

interface MicState {
  status: MicStatus
  // Technische Fehlerangabe „Name: Nachricht“, sonst null.
  fehlerDetails: string | null
}

export const MIC_START_ZUSTAND: MicState = { status: 'idle', fehlerDetails: null }

export const useMicStore = create<MicState>()(() => ({ ...MIC_START_ZUSTAND }))
