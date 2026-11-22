import { TEXTE } from '../texte'

interface TileProps {
  titel: string
  beschreibung: string
  /** Gesperrte Kachel: ausgegraut, aria-disabled (bleibt fokussierbar). */
  gesperrt?: boolean
  /** Badge „kommt bald“ zeigen (gesperrte Kacheln zeigen es immer). */
  badge?: boolean
  onClick: () => void
}

// Große Kachel der Übersicht. Echter <button>; gesperrte Kacheln nutzen
// aria-disabled statt `disabled`, damit der Hinweis angesagt werden kann.
export function Tile({ titel, beschreibung, gesperrt = false, badge = false, onClick }: TileProps) {
  const zeigeBadge = gesperrt || badge
  return (
    <button
      type="button"
      className={gesperrt ? 'tile tile--gesperrt' : 'tile'}
      aria-disabled={gesperrt ? 'true' : undefined}
      onClick={onClick}
    >
      {zeigeBadge && <span className="tile-badge">{TEXTE.uebersicht.kommtBald}</span>}
      <span className="tile-titel">{titel}</span>
      <span className="tile-beschreibung">{beschreibung}</span>
    </button>
  )
}
