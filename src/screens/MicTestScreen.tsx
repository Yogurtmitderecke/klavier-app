import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { MicFehler } from '../components/MicFehler'
import { MicHinweis } from '../components/MicHinweis'
import { MicStatusText } from '../components/MicStatusText'
import { MicToggleButton } from '../components/MicToggleButton'
import { NotenAnzeige } from '../components/NotenAnzeige'
import { WarningBar } from '../components/WarningBar'
import { holeMicController } from '../audio/micController'
import type { MicFehlerArt } from '../audio/micErrors'
import { CentAnzeige } from '../components/CentAnzeige'
import { PegelBalken } from '../components/PegelBalken'
import { CLARITY_MIN, GATE_OPEN_DB, PEGEL_MIN_DB } from '../audio/einstellungen'
import { formatCent, formatDb, formatHz, formatKlarheit } from '../audio/noteMath'
import { ermittleStartart } from '../lib/startart'
import { useMicStore } from '../state/micStore'
import { TEXTE } from '../texte'

// Pegel (dBFS) → Füllung 0..1 zwischen PEGEL_MIN_DB und 0 dB; −Infinity (Stille) = 0, null = keine Füllung.
function pegelAnteil(db: number | null): number | null {
  if (db === null || Number.isNaN(db)) return null
  if (!Number.isFinite(db)) return 0
  return Math.min(1, Math.max(0, (db - PEGEL_MIN_DB) / -PEGEL_MIN_DB))
}

// Im Fehlerzustand ist 'unsicher' ausgeschlossen (eigener Status); fehlt die Art, gilt „unbekannt“.
function sichtbareFehlerArt(art: MicFehlerArt | null): Exclude<MicFehlerArt, 'unsicher'> {
  return art === null || art === 'unsicher' ? 'unbekannt' : art
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
  const fehlerArt = useMicStore((s) => s.fehlerArt)
  const hinweis = useMicStore((s) => s.hinweis)
  // Messbalken zeigen nur bei laufendem Mikrofon Live-Werte, sonst „–“.
  const laeuft = status === 'laeuft'
  const dbAnzeige = laeuft ? db : null
  const klarheitAnzeige = laeuft ? klarheit : null

  useEffect(() => {
    titelRef.current?.focus()
    // Vor jedem Tipp prüfen: ohne HTTPS/getUserMedia gleich Warnung statt Knopf.
    holeMicController().pruefeZugang()

    // Nur ein laufendes oder startendes Mikrofon muss freigegeben werden; sonst
    // bleiben die Warnung ohne HTTPS oder die Fehlerhilfe stehen.
    function mikrofonAktiv(): boolean {
      const { status: s } = useMicStore.getState()
      return s === 'laeuft' || s === 'startet'
    }
    // App im Hintergrund: Mikrofon aus (Datenschutz, D-03). Keine URL-Änderung.
    function beiSichtbarkeit() {
      if (document.visibilityState === 'hidden' && mikrofonAktiv()) {
        holeMicController().stop('hintergrund')
      }
    }
    function beiPagehide() {
      if (mikrofonAktiv()) holeMicController().stop('verlassen')
    }
    document.addEventListener('visibilitychange', beiSichtbarkeit)
    window.addEventListener('pagehide', beiPagehide)

    // Seite verlassen (z. B. „‹ Zurück“) gibt das Mikrofon frei. stop() ist idempotent,
    // daher auch unter React StrictMode (doppeltes Mount/Unmount) unbedenklich.
    return () => {
      document.removeEventListener('visibilitychange', beiSichtbarkeit)
      window.removeEventListener('pagehide', beiPagehide)
      holeMicController().stop('verlassen')
    }
  }, [])

  // Inhaltsbereich: Warnung ohne HTTPS, Fehlerhilfe oder die Messkarte.
  // Die Messkarte steht in allen anderen Zuständen, damit beim Start nichts springt.
  let inhalt
  if (status === 'unsicher') {
    inhalt = <WarningBar />
  } else if (status === 'fehler') {
    inhalt = <MicFehler art={sichtbareFehlerArt(fehlerArt)} startart={ermittleStartart()} />
  } else {
    inhalt = (
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
    )
  }

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
        {/* Höchstens ein Hinweis zugleich, zwischen Knopfzeile und Inhalt. */}
        {hinweis !== null && <MicHinweis art={hinweis} />}
        {inhalt}
      </div>
    </div>
  )
}
