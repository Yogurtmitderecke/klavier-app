import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { MicStatusText } from '../components/MicStatusText'
import { MicToggleButton } from '../components/MicToggleButton'
import { NotenAnzeige } from '../components/NotenAnzeige'
import { holeMicController } from '../audio/micController'
import { formatCent, formatHz } from '../audio/noteMath'
import { useMicStore } from '../state/micStore'
import { TEXTE } from '../texte'

// Mikrofon-Test: Mikrofon per Tipp starten/stoppen; beim Verlassen wird es freigegeben (D-03).
export function MicTestScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)
  // Ein Selektor pro Feld: nur geänderte Werte lösen ein neues Rendern aus.
  const notenLabel = useMicStore((s) => s.live.notenLabel)
  const cents = useMicStore((s) => s.live.cents)
  const hz = useMicStore((s) => s.live.hz)
  const international = useMicStore((s) => s.live.international)
  const gehalten = useMicStore((s) => s.live.gehalten)

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
        </section>
      </div>
    </div>
  )
}
