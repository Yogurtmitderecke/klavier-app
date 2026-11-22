import { useEffect, useRef } from 'react'
import { useAppStore } from '../state/appStore'
import { TEXTE } from '../texte'

export function WelcomeScreen() {
  const onStart = useAppStore((s) => s.onStart)
  const titelRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titelRef.current?.focus()
  }, [])

  return (
    <div className="welcome">
      <h1 ref={titelRef} tabIndex={-1}>
        {TEXTE.willkommen.appTitel}
      </h1>
      <p className="untertitel">{TEXTE.willkommen.untertitel}</p>
      <button type="button" className="btn-start" onClick={onStart}>
        {TEXTE.willkommen.start}
      </button>
    </div>
  )
}
