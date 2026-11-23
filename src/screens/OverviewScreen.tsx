import { useEffect, useRef, useState } from 'react'
import { Tile } from '../components/Tile'
import { VersionLabel } from '../components/VersionLabel'
import { useAppStore } from '../state/appStore'
import { TEXTE } from '../texte'

// Hinweis bleibt insgesamt 3 s; in den letzten 300 ms blendet er aus.
const HINWEIS_DAUER_MS = 3000
const AUSBLENDEN_MS = 300

type HinweisPhase = 'aus' | 'sichtbar' | 'ausblenden'

export function OverviewScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const titelRef = useRef<HTMLHeadingElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [hinweis, setHinweis] = useState<HinweisPhase>('aus')

  function timerLoeschen() {
    for (const t of timerRef.current) clearTimeout(t)
    timerRef.current = []
  }

  useEffect(() => {
    titelRef.current?.focus()
    return timerLoeschen
  }, [])

  // Gesperrte Kachel: nicht navigieren, sondern 3 s lang den Hinweis zeigen (D-05).
  function zeigeKommtBald() {
    timerLoeschen()
    setHinweis('sichtbar')
    timerRef.current = [
      setTimeout(() => setHinweis('ausblenden'), HINWEIS_DAUER_MS - AUSBLENDEN_MS),
      setTimeout(() => {
        setHinweis('aus')
        timerRef.current = []
      }, HINWEIS_DAUER_MS),
    ]
  }

  const { kacheln } = TEXTE.uebersicht

  return (
    <>
      <header className="screen-header">
        <h1 ref={titelRef} tabIndex={-1}>
          {TEXTE.uebersicht.uebersichtTitel}
        </h1>
        <VersionLabel />
      </header>
      <div className="tiles">
        <Tile
          titel={kacheln.mikrofonTest.titel}
          beschreibung={kacheln.mikrofonTest.beschreibung}
          onClick={() => setScreen('mic-test')}
        />
        <Tile
          titel={kacheln.stueckeUeben.titel}
          beschreibung={kacheln.stueckeUeben.beschreibung}
          gesperrt
          onClick={zeigeKommtBald}
        />
        <Tile
          titel={kacheln.einstellungen.titel}
          beschreibung={kacheln.einstellungen.beschreibung}
          gesperrt
          onClick={zeigeKommtBald}
        />
      </div>
      {/* Immer vorhandene Live-Region, 24px unter der Kachelreihe – nie am unteren Rand. */}
      <div className="kommt-bald-hinweis" aria-live="polite">
        {hinweis !== 'aus' && (
          <p className={hinweis === 'ausblenden' ? 'ausblenden' : undefined}>
            {TEXTE.uebersicht.kommtBaldHinweis}
          </p>
        )}
      </div>
    </>
  )
}
