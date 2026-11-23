import { TEXTE } from '../texte'

interface NotenAnzeigeProps {
  /** Deutscher Notenname mit Oktave (z. B. „A4“); null = kein Ton. */
  label: string | null
  centsText: string
  hzText: string
  internationalText: string
  /** Note wird nach dem Verklingen noch gehalten (gedimmt, ab Plan 03). */
  gehalten?: boolean
}

// Große Notenanzeige (120px) mit Cent, Hz und internationalem Namen daneben.
// Bewusst keine Live-Region: 15 Aktualisierungen pro Sekunde würden VoiceOver überfluten.
export function NotenAnzeige({
  label,
  centsText,
  hzText,
  internationalText,
  gehalten = false,
}: NotenAnzeigeProps) {
  const leer = label === null
  const notenKlasse = leer ? 'note note--leer' : gehalten ? 'note note--gehalten' : 'note'
  return (
    <div className={leer ? 'noten-zeile noten-zeile--leer' : 'noten-zeile'}>
      <span className={notenKlasse}>{leer ? TEXTE.mikrofonTest.messkarte.platzhalter : label}</span>
      <div className={gehalten ? 'noten-details noten-details--gehalten' : 'noten-details'}>
        <span className="note-cents">{centsText}</span>
        <span className="note-hz">{hzText}</span>
        <span className="note-international">{internationalText}</span>
      </div>
    </div>
  )
}
