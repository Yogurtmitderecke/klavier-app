import { create } from 'zustand'

// Bildschirme der App. Umschalten nur über App-Zustand – kein Router,
// keine URL-/Hash-Änderung (D-03, wichtig für die Mikrofon-Erlaubnis auf dem iPad).
export type Screen = 'welcome' | 'overview' | 'mic-test'

interface AppState {
  screen: Screen
  setScreen: (s: Screen) => void
  onStart: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'welcome',
  setScreen: (s) => set({ screen: s }),
  // „Start“ wechselt nur zur Übersicht – das Mikrofon wird ausschließlich
  // über „Mikrofon starten“ auf der Mikrofon-Test-Seite angefragt (Phase 2, D-01).
  onStart: () => set({ screen: 'overview' }),
}))
