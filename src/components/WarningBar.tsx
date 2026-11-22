import { SECURE_URL } from '../config'
import { TEXTE } from '../texte'

// Hinweis bei fehlendem HTTPS (D-07). Blockiert nichts – Start funktioniert weiter.
// Linkziel und sichtbarer Text sind beide SECURE_URL, damit die Adresse lesbar bleibt.
export function WarningBar() {
  return (
    <div role="alert" className="warning-bar">
      <p>
        <strong>{TEXTE.warnung.titel}</strong> {TEXTE.warnung.text}
      </p>
      <a className="warning-bar-link" href={SECURE_URL}>
        {SECURE_URL}
      </a>
    </div>
  )
}
