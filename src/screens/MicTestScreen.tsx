import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { MicStatusText } from '../components/MicStatusText'
import { MicToggleButton } from '../components/MicToggleButton'
import { NotenAnzeige } from '../components/NotenAnzeige'
import { holeMicController } from '../audio/micController'
import { CentAnzeige } from '../components/CentAnzeige'
import { PegelBalken } from '../components/PegelBalken'
import { CLARITY_MIN, GATE_OPEN_DB, PEGEL_MIN_DB } from '../audio/einstellungen'
import { formatCent, formatDb, formatHz, formatKlarheit } from '../audio/noteMath'
import { useMicStore } from '../state/micStore'
import { TEXTE } from '../texte'

// Pegel (dBFS) → Füllung 0..1 zwischen PEGEL_MIN_DB und 0 dB; −Infinity (Stille) = 0, null = keine Füllung.
function pegelAnteil(db: number | null): number | null {
  if (db === null || Number.isNaN(db)) return null
  if (!Number.isFinite(db)) return 0
  return Math.min(1, Math.max(0, (db - PEGEL_MIN_DB) / -PEGEL_MIN_DB))
}

// Mikrofon-Test: Mikrofon per Tipp starten/stoppen; beim Verlassen wird es freigegeben (D-03).
export function MicTestScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)
  // Ein Selektor pro Feld: nur geänderte Werte lösen ein neues Rendern aus.
  const notenLabel = useMicStore((s) => s.live.notenLabel)
  const cents = useMicStore((s) => s.live.cents)
  const hz = useMicStore((s) => s.live.hz)
  const international = useMicStore((s) => s.live.international)
  const gehalten = useMicStore((s) => s.live.gehalten)
  const db = useMicStore((s) => s.live.db)
  const klarheit = useMicStore((s) => s.live.klarheit)
  const status = useMicStore((s) => s.status)
  // Messbalken zeigen nur bei laufendem Mikrofon Live-Werte, sonst „–“.
  const laeuft = status === 'laeuft'
  const dbAnzeige = laeuft ? db : null
  const klarheitAnzeige = laeuft ? klarheit : null

  useEffect(() => {
    titelRef.current?.focus()
    // Seite verlassen (z. B. „‹ Zurück“) gibt das Mikrofon frei. stop() ist idempotent,
    // daher auch unter React StrictMode (doppeltes Mount/Unmount) unbedenklich.
    return () => {
      holeMicController().stop('verlassen')
    }
  }, [])

  return (
    <div className="mic-test">
      <div className="mic-test-links">
        <header className="screen-header screen-header--unterseite">
          <BackButton />
          <h1 ref={titelRef} tabIndex={-1}>
            {TEXTE.mikrofonTest.titel}
          </h1>
        </header>
        <div className="mic-steuerung">
          <MicToggleButton />
          <MicStatusText />
        </div>
        {/* Immer sichtbar, damit beim Start nichts springt. */}
        <section className="messkarte" aria-label={TEXTE.mikrofonTest.messkarte.abschnitt}>
          <NotenAnzeige
            label={notenLabel}
            centsText={formatCent(cents)}
            hzText={formatHz(hz)}
            internationalText={`${TEXTE.mikrofonTest.messkarte.internationalPrefix}${
              international ?? TEXTE.mikrofonTest.messkarte.platzhalter
            }`}
            gehalten={gehalten}
          />
          <CentAnzeige cents={cents} centsText={formatCent(cents)} gehalten={gehalten} />
          <div className="messkarte-pegel">
            <PegelBalken
              label={TEXTE.mikrofonTest.messkarte.pegel.lautstaerke}
              wertText={formatDb(dbAnzeige)}
              anteil={pegelAnteil(dbAnzeige)}
              schwelleAnteil={(GATE_OPEN_DB - PEGEL_MIN_DB) / -PEGEL_MIN_DB}
              min={PEGEL_MIN_DB}
              max={0}
              wert={dbAnzeige}
            />
            <PegelBalken
              label={TEXTE.mikrofonTest.messkarte.pegel.klarheit}
              wertText={formatKlarheit(klarheitAnzeige)}
              anteil={klarheitAnzeige}
              schwelleAnteil={CLARITY_MIN}
              min={0}
              max={1}
              wert={klarheitAnzeige}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
