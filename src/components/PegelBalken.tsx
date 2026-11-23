interface PegelBalkenProps {
  /** Name des Messwerts (z. B. „Lautstärke“); auch aria-label. */
  label: string
  /** Angezeigter Wert als Text (z. B. „−32 dB“ oder „0,97“); auch aria-valuetext. */
  wertText: string
  /** Füllung als Anteil 0..1; null = keine Füllung (kein Messwert). */
  anteil: number | null
  /** Lage der Schwellen-Markierung als Anteil 0..1. */
  schwelleAnteil: number
  /** Kleinster möglicher Wert (aria-valuemin). */
  min: number
  /** Größter möglicher Wert (aria-valuemax). */
  max: number
  /** Aktueller Rohwert (aria-valuenow); null = keiner. */
  wert: number | null
}

function begrenze(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.min(1, Math.max(0, x))
}

// Waagrechter Messbalken mit Schwellen-Markierung. Bewusst keine Grün/Rot-Farben (Phase 7).
export function PegelBalken({ label, wertText, anteil, schwelleAnteil, min, max, wert }: PegelBalkenProps) {
  const zeigeWert = wert !== null && Number.isFinite(wert)
  return (
    <div
      className="pegel"
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={zeigeWert ? wert : undefined}
      aria-valuetext={wertText}
    >
      <div className="pegel-kopf">
        <span className="pegel-name">{label}</span>
        <span className="pegel-wert">{wertText}</span>
      </div>
      <div className="pegel-spur">
        {anteil !== null && (
          <div className="pegel-fuellung" style={{ width: `${begrenze(anteil) * 100}%` }} />
        )}
        <div className="pegel-schwelle" style={{ left: `${begrenze(schwelleAnteil) * 100}%` }} />
      </div>
    </div>
  )
}
