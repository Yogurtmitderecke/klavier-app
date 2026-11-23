import { useMicStore, type MicStatus } from '../state/micStore'
import { TEXTE } from '../texte'

const { status: S } = TEXTE.mikrofonTest

// Statustext je Mikrofon-Zustand. „laeuft“ zeigt vorerst immer den Hinweis ohne Ton.
const STATUS_TEXT: Record<MicStatus, string> = {
  idle: S.idle,
  startet: S.startet,
  laeuft: S.laeuftOhneTon,
  gestoppt: S.gestoppt,
  hintergrund: S.hintergrund,
  fehler: S.fehler,
  unsicher: S.unsicher,
}

// Immer vorhandene Live-Region neben dem Knopf, damit Änderungen vorgelesen werden.
export function MicStatusText() {
  const status = useMicStore((s) => s.status)
  return (
    <p className="mic-status" aria-live="polite">
      {STATUS_TEXT[status]}
    </p>
  )
}
