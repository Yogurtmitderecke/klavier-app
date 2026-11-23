import { useMicStore, type MicStatus } from '../state/micStore'
import { TEXTE } from '../texte'

const { status: S } = TEXTE.mikrofonTest

// Statustext je Mikrofon-Zustand; „laeuft“ hängt davon ab, ob gerade ein Ton erkannt wird.
const STATUS_TEXT: Record<Exclude<MicStatus, 'laeuft'>, string> = {
  idle: S.idle,
  startet: S.startet,
  gestoppt: S.gestoppt,
  hintergrund: S.hintergrund,
  fehler: S.fehler,
  unsicher: S.unsicher,
}

// Immer vorhandene Live-Region neben dem Knopf, damit Änderungen vorgelesen werden.
export function MicStatusText() {
  const status = useMicStore((s) => s.status)
  const hatTon = useMicStore((s) => s.live.notenLabel !== null)
  const text =
    status === 'laeuft' ? (hatTon ? S.laeuftMitTon : S.laeuftOhneTon) : STATUS_TEXT[status]
  return (
    <p className="mic-status" aria-live="polite">
      {text}
    </p>
  )
}
