import { TEXTE } from '../texte'

// Lage der Skalenbeschriftungen −50, −10, 0, +10, +50 in Prozent der Balkenbreite.
const SKALA_LAGE = [0, 40, 50, 60, 100] as const

interface CentAnzeigeProps {
  /** Abweichung in Cent (−50..+50); null = kein Ton, dann keine Nadel. */
  cents: number | null
  /** Abweichung als Text (z. B. „+3 Cent“); auch aria-valuetext. */
  centsText: string
  /** Note wird nach dem Verklingen nur noch gehalten – Nadel halb durchsichtig. */
  gehalten: boolean
}

// Stimmgerät-Balken von −50 bis +50 Cent: graues ±10-Cent-Band, Mittellinie und Nadel (D-08).
export function CentAnzeige({ cents, centsText, gehalten }: CentAnzeigeProps) {
  const texte = TEXTE.mikrofonTest.messkarte.tuner
  const zeigeNadel = cents !== null && Number.isFinite(cents)
  const lage = zeigeNadel ? Math.min(1, Math.max(0, ((cents as number) + 50) / 100)) * 100 : 50
  return (
    <div
      className="tuner-block"
      role="meter"
      aria-label={texte.label}
      aria-valuemin={-50}
      aria-valuemax={50}
      aria-valuenow={zeigeNadel ? (cents as number) : undefined}
      aria-valuetext={centsText}
    >
      <div className="tuner">
        <div className="tuner-band" />
        <div className="tuner-mitte" />
        {zeigeNadel && (
          <div
            className={gehalten ? 'tuner-nadel tuner-nadel--gehalten' : 'tuner-nadel'}
            style={{ left: `${lage}%` }}
          />
        )}
      </div>
      <div className="tuner-skala" aria-hidden="true">
        {texte.skala.map((s, i) => (
          <span key={s} className="tuner-skala-wert" style={{ left: `${SKALA_LAGE[i]}%` }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
