import { describe, expect, it } from 'vitest'
import {
  formatCent,
  formatDb,
  formatHz,
  formatKlarheit,
  hzToMidiFloat,
  internationalName,
  midiToNote,
} from './noteMath'

function labelVonHz(hz: number): string {
  return midiToNote(hzToMidiFloat(hz)).label
}

describe('hzToMidiFloat / midiToNote', () => {
  it('440 Hz ist MIDI 69 = A4 mit 0 Cent', () => {
    expect(hzToMidiFloat(440)).toBe(69)
    const n = midiToNote(hzToMidiFloat(440))
    expect(n.label).toBe('A4')
    expect(n.midi).toBe(69)
    expect(n.oktave).toBe(4)
    expect(n.cents).toBe(0)
  })

  it('benennt Töne deutsch mit wissenschaftlicher Oktave', () => {
    expect(labelVonHz(261.63)).toBe('C4')
    expect(labelVonHz(466.16)).toBe('B4')
    expect(labelVonHz(493.88)).toBe('H4')
    expect(labelVonHz(65.41)).toBe('C2')
    expect(labelVonHz(27.5)).toBe('A0')
    expect(labelVonHz(4186)).toBe('C8')
    expect(labelVonHz(415.3)).toBe('Gis4')
  })

  it('berücksichtigt einen anderen Kammerton', () => {
    expect(hzToMidiFloat(442, 442)).toBe(69)
  })

  it('rechnet Cent als Abweichung zur nächsten Note', () => {
    expect(midiToNote(69.2).cents).toBe(20)
    const tiefer = midiToNote(68.8)
    expect(tiefer.label).toBe('A4')
    expect(tiefer.cents).toBe(-20)
    expect(midiToNote(69.49)).toMatchObject({ label: 'A4', cents: 49 })
    expect(midiToNote(69.51)).toMatchObject({ label: 'B4', cents: -49 })
  })

  it('hält Cent immer im Bereich −50 bis +50', () => {
    for (let m = 21; m <= 108; m += 0.037) {
      const c = midiToNote(m).cents
      expect(c).toBeGreaterThanOrEqual(-50)
      expect(c).toBeLessThanOrEqual(50)
    }
  })
})

describe('internationalName', () => {
  it('nutzt ♯ und das englische B für H', () => {
    expect(internationalName(68)).toBe('G♯4')
    expect(internationalName(70)).toBe('A♯4')
    expect(internationalName(71)).toBe('B4')
    expect(internationalName(69)).toBe('A4')
  })
})

describe('Formatierer', () => {
  it('formatCent mit Vorzeichen und echtem Minuszeichen', () => {
    expect(formatCent(3)).toBe('+3 Cent')
    expect(formatCent(-7)).toBe('−7 Cent')
    expect(formatCent(0)).toBe('0 Cent')
    expect(formatCent(null)).toBe('– Cent')
  })

  it('formatHz mit einer Nachkommastelle und deutschem Komma', () => {
    expect(formatHz(440.27)).toBe('440,3 Hz')
    expect(formatHz(440)).toBe('440,0 Hz')
    expect(formatHz(null)).toBe('– Hz')
  })

  it('formatDb ganzzahlig, sehr leise unterhalb der Anzeige-Untergrenze', () => {
    expect(formatDb(-32.4)).toBe('−32 dB')
    expect(formatDb(-95)).toBe('sehr leise')
    expect(formatDb(-Infinity)).toBe('sehr leise')
    expect(formatDb(null)).toBe('–')
  })

  it('formatKlarheit mit zwei Nachkommastellen', () => {
    expect(formatKlarheit(0.973)).toBe('0,97')
    expect(formatKlarheit(null)).toBe('–')
  })
})
