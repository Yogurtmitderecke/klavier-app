import { create } from 'zustand'

// Bildschirme der App. Umschalten nur über App-Zustand – kein Router,
// keine URL-/Hash-Änderung (D-03, wichtig für die Mikrofon-Erlaubnis auf dem iPad).
export type Screen = 'welcome' | 'overview' | 'mic-placeholder'

interface AppState {
  screen: Screen
  setScreen: (s: Screen) => void
  onStart: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'welcome',
  setScreen: (s) => set({ screen: s }),
  // Einziger Einstiegspunkt für die Nutzer-Geste „Start“ (D-02).
  // Phase 2 ergänzt hier den Audio-Start und die Mikrofon-Anfrage.
  // Aktuell wird nur zur Übersicht gewechselt.
  onStart: () => set({ screen: 'overview' }),
}))
