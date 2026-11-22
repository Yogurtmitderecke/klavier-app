import { useEffect, useRef } from 'react'
import { VersionLabel } from '../components/VersionLabel'
import { WarningBar } from '../components/WarningBar'
import { isInsecureContext } from '../lib/secureContext'
import { useAppStore } from '../state/appStore'
import { TEXTE } from '../texte'

export function WelcomeScreen() {
  const onStart = useAppStore((s) => s.onStart)
  const titelRef = useRef<HTMLHeadingElement>(null)
  // Ohne HTTPS: Warnung direkt über dem Start-Knopf (D-07 / DEPL-02).
  const unsicher = isInsecureContext()

  useEffect(() => {
    titelRef.current?.focus()
  }, [])

  return (
    <div className="welcome">
      <VersionLabel />
      <h1 ref={titelRef} tabIndex={-1}>
        {TEXTE.willkommen.appTitel}
      </h1>
      <p className="untertitel">{TEXTE.willkommen.untertitel}</p>
      {unsicher && <WarningBar />}
      <button type="button" className="btn-start" onClick={onStart}>
        {TEXTE.willkommen.start}
      </button>
    </div>
  )
}
