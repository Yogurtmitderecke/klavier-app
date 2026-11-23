import { create } from 'zustand'
import type { Diagnose } from '../audio/diagnoseZeilen'
import { FFT_SIZE } from '../audio/einstellungen'
import type { MicFehlerArt } from '../audio/micErrors'
import { VERSION_LABEL } from '../config'

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
  // Diagnose-Tafel (MIC-04): höchstens einmal pro Sekunde plus bei Ereignissen aktualisiert.
  diagnose: Diagnose
}

// Vor dem ersten Start: nur Startart, Version und Fenstergröße sind bekannt.
export const LEERE_DIAGNOSE: Diagnose = {
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
  startart: 'safari',
  appVersion: VERSION_LABEL,
  fensterGroesse: FFT_SIZE,
  analysenProSek: null,
  analyseMs: null,
  fehlerDetails: null,
  mikLaeuft: false,
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
  diagnose: LEERE_DIAGNOSE,
}

export const useMicStore = create<MicState>()(() => ({ ...MIC_START_ZUSTAND }))
