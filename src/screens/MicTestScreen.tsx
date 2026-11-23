import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { MicStatusText } from '../components/MicStatusText'
import { MicToggleButton } from '../components/MicToggleButton'
import { holeMicController } from '../audio/micController'
import { TEXTE } from '../texte'

// Mikrofon-Test: Mikrofon per Tipp starten/stoppen; beim Verlassen wird es freigegeben (D-03).
export function MicTestScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)

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
      </div>
    </div>
  )
}
