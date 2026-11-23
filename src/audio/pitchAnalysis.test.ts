import { describe, expect, it } from 'vitest'
import { midiToNote } from './noteMath'
import { analysiereFrame, berechnePegel, erstelleDetektor } from './pitchAnalysis'
import { klavierTon, rauschen, sinus, stille } from './testSignale'

const N = 4096
const SR = 48000

// Tonhöhen der Prüfliste (C2, C3, C4, A4, C6) mit erwarteter MIDI-Nummer.
const TOENE: Array<[string, number, number]> = [
  ['C2', 65.406, 36],
  ['C3', 130.813, 48],
  ['C4', 261.626, 60],
  ['A4', 440, 69],
  ['C6', 1046.502, 84],
]

describe('analysiereFrame mit Sinustönen', () => {
  const detektor = erstelleDetektor(N)

  for (const [name, hz, midi] of TOENE) {
    it(`erkennt ${name} als Sinus bei 48 kHz`, () => {
      const a = analysiereFrame(sinus(hz, N, SR), SR, detektor)
      expect(a.valid).toBe(true)
      expect(a.midiFloat).not.toBeNull()
      const note = midiToNote(a.midiFloat as number)
      expect(note.midi).toBe(midi)
      expect(Math.abs(note.cents)).toBeLessThanOrEqual(1)
    })
  }

  it('nutzt die übergebene Abtastrate (44,1 kHz)', () => {
    const a = analysiereFrame(sinus(440, N, 44100), 44100, detektor)
    expect(a.valid).toBe(true)
    expect(midiToNote(a.midiFloat as number).midi).toBe(69)
  })

  it('misst die Analysedauer mit der übergebenen Uhr', () => {
    let t = 100
    const a = analysiereFrame(sinus(440, N, SR), SR, detektor, () => (t += 2))
    expect(a.dauerMs).toBe(2)
  })
})

describe('analysiereFrame mit klavierähnlichen Tönen', () => {
  const detektor = erstelleDetektor(N)

  for (const [name, hz, midi] of TOENE) {
    it(`erkennt ${name} trotz schwachem Grundton und Inharmonizität`, () => {
      const buf = klavierTon(hz, N, SR, { B: 0.0004, grundAmp: 0.1, rauschen: 0.01 })
      const a = analysiereFrame(buf, SR, detektor)
      expect(a.valid).toBe(true)
      const note = midiToNote(a.midiFloat as number)
      expect(note.midi).toBe(midi)
      expect(Math.abs(note.cents)).toBeLessThanOrEqual(20)
    })
  }
})

describe('berechnePegel und Stille/Rauschen', () => {
  const detektor = erstelleDetektor(N)

  it('berechnet RMS in dBFS', () => {
    const { rms, db } = berechnePegel(sinus(440, N, SR, 0.2))
    expect(rms).toBeCloseTo(0.2 / Math.SQRT2, 3)
    expect(db).toBeCloseTo(-16.99, 1)
  })

  it('Stille ergibt −Infinity dB und keinen gültigen Ton', () => {
    expect(berechnePegel(stille(N)).db).toBe(-Infinity)
    const a = analysiereFrame(stille(N), SR, detektor)
    expect(a.valid).toBe(false)
    expect(a.midiFloat).toBeNull()
  })

  it('Rauschen ergibt keinen gültigen Ton', () => {
    const a = analysiereFrame(rauschen(N, 0.05), SR, detektor)
    expect(a.valid).toBe(false)
    expect(a.midiFloat).toBeNull()
  })
})
