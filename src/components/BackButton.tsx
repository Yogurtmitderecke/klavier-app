import { useAppStore } from '../state/appStore'
import { TEXTE } from '../texte'

// Fester Zurück-Knopf oben links für ALLE Unterseiten aller Phasen (D-06):
// 64px hoch, mindestens 160px breit, führt zur Übersicht – ohne URL-Änderung.
export function BackButton() {
  const setScreen = useAppStore((s) => s.setScreen)
  return (
    <button type="button" className="btn-back" onClick={() => setScreen('overview')}>
      {TEXTE.zurueck}
    </button>
  )
}
