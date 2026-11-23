import { holeMicController } from '../audio/micController'
import { useMicStore } from '../state/micStore'
import { TEXTE } from '../texte'

// Ein einziger Knopf an fester Stelle: Mikrofon starten ↔ stoppen (D-01, D-02).
export function MicToggleButton() {
  const status = useMicStore((s) => s.status)
  const { knopf } = TEXTE.mikrofonTest

  // Ohne HTTPS gibt es keinen Knopf; Warnung und Statustext erklären es.
  if (status === 'unsicher') return null

  const laeuft = status === 'laeuft'
  const startet = status === 'startet'
  const beschriftung = laeuft
    ? knopf.stoppen
    : startet
      ? knopf.startet
      : status === 'fehler'
        ? knopf.nochmal
        : knopf.starten

  function beimTippen() {
    if (laeuft) {
      holeMicController().stop('nutzer')
      return
    }
    // Synchron in der Tipp-Geste starten – nichts Asynchrones davor (iOS, D-01).
    void holeMicController().start()
  }

  return (
    <button
      type="button"
      className={laeuft ? 'btn-mic btn-mic--flaeche' : 'btn-mic btn-mic--akzent'}
      disabled={startet}
      onClick={beimTippen}
    >
      {beschriftung}
    </button>
  )
}
