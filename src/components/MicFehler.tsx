import type { MicFehlerArt } from '../audio/micErrors'
import type { Startart } from '../lib/startart'
import { TEXTE } from '../texte'

interface MicFehlerProps {
  art: Exclude<MicFehlerArt, 'unsicher'>
  startart: Startart
}

// Deutsche Hilfe je Fehlerart mit nummerierten Schritten. Ersetzt die Messkarte.
// Kein Knopf hier drin: „Nochmal versuchen“ ist der Mikrofon-Knopf darüber.
// Alle Texte sind React-Textknoten – Browser-Meldungen können kein Markup einschleusen.
export function MicFehler({ art, startart }: MicFehlerProps) {
  const t = TEXTE.mikrofonTest.fehler[art]
  const schritte: readonly string[] =
    art === 'verweigert' && startart === 'safari'
      ? [TEXTE.mikrofonTest.fehler.verweigert.schrittSafari, ...t.schritte]
      : t.schritte

  return (
    <div role="alert" className="mic-fehler">
      <p className="mic-fehler-titel">{t.titel}</p>
      <p>{t.intro}</p>
      <ol>
        {schritte.map((schritt) => (
          <li key={schritt}>{schritt}</li>
        ))}
      </ol>
    </div>
  )
}
