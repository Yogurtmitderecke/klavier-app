import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { TEXTE } from '../texte'

// Platzhalter für den Mikrofon-Test (Phase 2). Bewusst ohne Audio-Code (D-02).
export function MicPlaceholderScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titelRef.current?.focus()
  }, [])

  return (
    <>
      <header className="screen-header screen-header--unterseite">
        <BackButton />
        <h1 ref={titelRef} tabIndex={-1}>
          {TEXTE.mikrofonPlatzhalter.titel}
        </h1>
      </header>
      <p className="unterseite-text">{TEXTE.mikrofonPlatzhalter.text}</p>
    </>
  )
}
