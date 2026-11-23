import type { MicHinweisArt } from '../state/micStore'
import { TEXTE } from '../texte'

interface MicHinweisProps {
  art: MicHinweisArt
}

// Nicht-fataler Hinweis, solange die Bedingung besteht (z. B. keine Daten vom Mikrofon).
export function MicHinweis({ art }: MicHinweisProps) {
  const t = TEXTE.mikrofonTest.hinweis[art]
  return (
    <div role="status" aria-live="polite" className="mic-hinweis">
      <p>
        <strong>{t.titel}</strong> {t.text}
      </p>
    </div>
  )
}
