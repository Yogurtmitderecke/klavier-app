import { PEGEL_MIN_DB } from './einstellungen'

// Deutsche Notennamen: Kreuz-Schreibweise (Cis, Dis, Fis, Gis), B = B♭ (Tonklasse 10), H (Tonklasse 11).
export const NAMEN = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'] as const

// Internationale (englische) Namen mit ♯; das deutsche H heißt hier B.
const NAMEN_INTERNATIONAL = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const

// Echtes Minuszeichen (U+2212) statt Bindestrich.
const MINUS = '−'
const PLATZHALTER = '–'

const hzFormat = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false,
})
const klarheitFormat = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const dbFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0, useGrouping: false })

export interface Note {
  midi: number
  name: string
  oktave: number
  cents: number
  label: string
}

// Frequenz → MIDI-Zahl mit Nachkommastellen; a4 ist der Kammerton (Phase 3 übergibt den kalibrierten Wert).
export function hzToMidiFloat(hz: number, a4 = 440): number {
  return 69 + 12 * Math.log2(hz / a4)
}

function tonklasse(midi: number): number {
  return ((midi % 12) + 12) % 12
}

// Nächste Note plus Abweichung in Cent (immer zwischen −50 und +50).
export function midiToNote(midiFloat: number): Note {
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100) + 0 // +0 macht aus −0 eine 0
  const name = NAMEN[tonklasse(midi)]
  const oktave = Math.floor(midi / 12) - 1
  return { midi, name, oktave, cents, label: `${name}${oktave}` }
}

export function internationalName(midi: number): string {
  return `${NAMEN_INTERNATIONAL[tonklasse(midi)]}${Math.floor(midi / 12) - 1}`
}

function mitMinus(text: string): string {
  return text.replace('-', MINUS)
}

export function formatCent(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return `${PLATZHALTER} Cent`
  const c = Math.round(cents) + 0
  if (c > 0) return `+${c} Cent`
  if (c < 0) return `${MINUS}${Math.abs(c)} Cent`
  return '0 Cent'
}

export function formatHz(hz: number | null): string {
  if (hz === null || !Number.isFinite(hz)) return `${PLATZHALTER} Hz`
  return `${hzFormat.format(hz)} Hz`
}

export function formatDb(db: number | null): string {
  if (db === null || Number.isNaN(db)) return PLATZHALTER
  if (!Number.isFinite(db) || db < PEGEL_MIN_DB) return 'sehr leise'
  return `${mitMinus(dbFormat.format(Math.round(db) + 0))} dB`
}

export function formatKlarheit(k: number | null): string {
  if (k === null || !Number.isFinite(k)) return PLATZHALTER
  return klarheitFormat.format(k)
}
