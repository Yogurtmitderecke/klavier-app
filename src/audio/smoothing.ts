import { GATE_CLOSE_DB, GATE_OPEN_DB, HOLD_MS, MEDIAN_N } from './einstellungen'
import type { FrameAnalyse } from './pitchAnalysis'

// Was die Oberfläche anzeigen soll – nach Glättung.
export interface GeglaetteteAnzeige {
  // Angezeigte Note als MIDI-Zahl, null = keine Note („–“).
  midi: number | null
  // Geglättete Tonhöhe (Median) für Cent und Hz, null wenn keine Note.
  midiFloat: number | null
  // true, wenn der Ton verklungen ist und die letzte Note nur noch gedimmt stehen bleibt.
  gehalten: boolean
  // true, solange das Pegel-Tor offen ist (ein Ton klingt).
  torOffen: boolean
}

// So viele aufeinanderfolgende Frames müssen eine neue Note bestätigen.
const BESTAETIGUNG = 3
// Bei einem Sprung um genau eine Oktave (häufiger Erkennungsfehler) braucht es mehr Frames …
const BESTAETIGUNG_OKTAVE = 6
// … außer der Pegel ist um mindestens so viele dB gestiegen (dann wurde wohl wirklich neu angeschlagen).
const NEUANSCHLAG_DB = 6

function median(werte: number[]): number {
  const sortiert = [...werte].sort((a, b) => a - b)
  const mitte = Math.floor(sortiert.length / 2)
  return sortiert.length % 2 === 1 ? sortiert[mitte] : (sortiert[mitte - 1] + sortiert[mitte]) / 2
}

// Glättet die Roh-Schätzungen, damit ein gehaltener Ton ruhig stehen bleibt.
export class PitchSmoother {
  // Letzte gültige midiFloat-Werte (höchstens MEDIAN_N).
  private verlauf: number[] = []
  private aktuelleMidi: number | null = null
  private letzterMedian: number | null = null
  private kandidatMidi: number | null = null
  private kandidatZaehler = 0
  private kandidatStartDb = -Infinity
  private letzterGueltigerDb = -Infinity
  private torOffen = false
  private torZuSeit = 0
  private readonly jetzt: () => number

  constructor(jetzt: () => number = () => performance.now()) {
    this.jetzt = jetzt
  }

  reset(): void {
    this.verlauf = []
    this.aktuelleMidi = null
    this.letzterMedian = null
    this.kandidatMidi = null
    this.kandidatZaehler = 0
    this.kandidatStartDb = -Infinity
    this.letzterGueltigerDb = -Infinity
    this.torOffen = false
    this.torZuSeit = 0
  }

  push(a: FrameAnalyse): GeglaetteteAnzeige {
    this.aktualisiereTor(a.db)

    if (!this.torOffen) return this.ausgabeBeiGeschlossenemTor()

    // Nur gültige, endliche Schätzungen kommen in den Verlauf.
    // Ungültige Frames bei offenem Tor löschen nichts – die Note bleibt einfach stehen.
    if (a.valid && a.midiFloat !== null && Number.isFinite(a.midiFloat)) {
      this.verlauf.push(a.midiFloat)
      if (this.verlauf.length > MEDIAN_N) this.verlauf.shift()
      this.letzterMedian = median(this.verlauf)
      this.pruefeNotenwechsel(a)
      this.letzterGueltigerDb = a.db
    }

    return {
      midi: this.aktuelleMidi,
      midiFloat: this.ausgabeMidiFloat(),
      gehalten: false,
      torOffen: true,
    }
  }

  // Tor mit Hysterese: öffnet ab GATE_OPEN_DB, schließt erst unter GATE_CLOSE_DB.
  // Dazwischen bleibt es, wie es war – so flackert die Anzeige nicht, wenn ein Ton
  // genau an der Schwelle verklingt.
  private aktualisiereTor(db: number): void {
    if (!this.torOffen && db >= GATE_OPEN_DB) {
      this.torOffen = true
    } else if (this.torOffen && !(db >= GATE_CLOSE_DB)) {
      // !(db >= …) erfasst auch NaN.
      this.torOffen = false
      this.torZuSeit = this.jetzt()
      this.kandidatMidi = null
      this.kandidatZaehler = 0
    }
  }

  // Nach dem Verklingen bleibt die letzte Note HOLD_MS lang gedimmt stehen, danach „–“.
  private ausgabeBeiGeschlossenemTor(): GeglaetteteAnzeige {
    if (this.aktuelleMidi !== null && this.jetzt() - this.torZuSeit <= HOLD_MS) {
      return { midi: this.aktuelleMidi, midiFloat: this.ausgabeMidiFloat(), gehalten: true, torOffen: false }
    }
    this.aktuelleMidi = null
    this.verlauf = []
    this.letzterMedian = null
    return { midi: null, midiFloat: null, gehalten: false, torOffen: false }
  }

  // Eine neue Note wird erst übernommen, wenn mehrere Frames hintereinander sie bestätigen.
  // Oktavschutz: Ein Sprung um genau ±12 Halbtöne ist oft ein Erkennungsfehler (der Grundton
  // eines Klaviertons ist schwach), deshalb braucht er doppelt so viele Frames – außer der
  // Pegel ist deutlich gestiegen, dann wurde wahrscheinlich wirklich eine neue Taste angeschlagen.
  private pruefeNotenwechsel(a: FrameAnalyse): void {
    const roh = Math.round(a.midiFloat as number)
    if (roh === this.aktuelleMidi) {
      this.kandidatMidi = null
      this.kandidatZaehler = 0
      return
    }
    if (roh !== this.kandidatMidi) {
      this.kandidatMidi = roh
      this.kandidatZaehler = 0
      this.kandidatStartDb = this.letzterGueltigerDb
    }
    this.kandidatZaehler++

    let noetig = BESTAETIGUNG
    if (
      this.aktuelleMidi !== null &&
      Math.abs(roh - this.aktuelleMidi) === 12 &&
      !(a.db - this.kandidatStartDb >= NEUANSCHLAG_DB)
    ) {
      noetig = BESTAETIGUNG_OKTAVE
    }

    if (this.kandidatZaehler >= noetig) {
      this.aktuelleMidi = roh
      // Verlauf auf die übereinstimmenden Werte kürzen, damit der Median der neuen Note folgt.
      this.verlauf = this.verlauf.filter((m) => Math.round(m) === roh)
      this.letzterMedian = this.verlauf.length > 0 ? median(this.verlauf) : this.letzterMedian
      this.kandidatMidi = null
      this.kandidatZaehler = 0
    }
  }

  // Median nur über die Werte, die zur angezeigten Note passen (Ausreißer zählen nicht).
  private ausgabeMidiFloat(): number | null {
    if (this.aktuelleMidi === null) return null
    const passend = this.verlauf.filter((m) => Math.round(m) === this.aktuelleMidi)
    if (passend.length > 0) return median(passend)
    return this.letzterMedian
  }
}
