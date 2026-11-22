import { useEffect, useRef } from 'react'
import { TEXTE } from '../texte'

export function OverviewScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titelRef.current?.focus()
  }, [])

  return (
    <header className="screen-header">
      <h1 ref={titelRef} tabIndex={-1}>
        {TEXTE.uebersicht.uebersichtTitel}
      </h1>
    </header>
  )
}
