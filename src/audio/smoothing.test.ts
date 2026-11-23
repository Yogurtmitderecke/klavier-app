import { describe, expect, it } from 'vitest'
import { HOLD_MS } from './einstellungen'
import { analysiereFrame, berechnePegel, erstelleDetektor, type FrameAnalyse } from './pitchAnalysis'
import { PitchSmoother, type GeglaetteteAnzeige } from './smoothing'
import { klavierTon } from './testSignale'

const N = 4096
const SR = 48000
const FRAME_MS = 16.7
const detektor = erstelleDetektor(N)

// Klavierähnliches Fenster mit genau dem gewünschten Pegel (dBFS).
// Die Amplitude wird aus dem eigenen RMS des Tons berechnet, damit der Test nicht von Teiltonsummen abhängt.
function frame(f0: number, zielDb: number, rauschen = 0): FrameAnalyse {
  const referenz = klavierTon(f0, N, SR, { B: 0.0004, amp: 1 })
  const { rms } = berechnePegel(referenz)
  const amp = 10 ** (zielDb / 20) / rms
  const buf = klavierTon(f0, N, SR, { B: 0.0004, amp, rauschen })
  return analysiereFrame(buf, SR, detektor)
}

// Ein Fenster nur mit einem bestimmten Pegel, ohne gültige Tonhöhe.
function leiseFrame(db: number): FrameAnalyse {
  return { rms: 10 ** (db / 20), db, hz: 0, clarity: 0, valid: false, midiFloat: null, dauerMs: 0 }
}

function erstelleSmoother(): { smoother: PitchSmoother; setzeZeit: (t: number) => void } {
  let t = 0
  const smoother = new PitchSmoother(() => t)
  return { smoother, setzeZeit: (neu) => (t = neu) }
}

function spiele(frames: FrameAnalyse[]): GeglaetteteAnzeige[] {
  const { smoother, setzeZeit } = erstelleSmoother()
  return frames.map((a, i) => {
    setzeZeit(i * FRAME_MS)
    return smoother.push(a)
  })
}

describe('PitchSmoother', () => {
  it('zeigt ein gehaltenes, verklingendes A4 (2,4 s, −20 → −50 dBFS) stabil als A4', () => {
    const anzahl = 144
    const pegel = (i: number) => -20 + (-30 * i) / (anzahl - 1)
    const frames = Array.from({ length: anzahl }, (_, i) => frame(440, pegel(i), 0.0005))
    const aus = spiele(frames)
    for (let i = 3; i < anzahl; i++) expect(aus[i].midi, `Frame ${i}`).toBe(69)
    const cents = aus.slice(3).map((g) => ((g.midiFloat as number) - 69) * 100)
    expect(Math.max(...cents) - Math.min(...cents)).toBeLessThanOrEqual(10)
  })

  it('lässt sich von einem einzelnen Oktav-Ausreißer (880 Hz) nicht beirren', () => {
    const frames = Array.from({ length: 144 }, (_, i) =>
      i === 70 ? frame(880, -30, 0.0005) : frame(440, -30, 0.0005),
    )
    const aus = spiele(frames)
    for (let i = 70; i <= 75; i++) expect(aus[i].midi, `Frame ${i}`).toBe(69)
  })

  it('wechselt von A4 zu C5 erst ab dem dritten C5-Frame', () => {
    const frames = [
      ...Array.from({ length: 10 }, () => frame(440, -30)),
      ...Array.from({ length: 10 }, () => frame(523.25, -30)),
    ]
    const aus = spiele(frames)
    expect(aus[9].midi).toBe(69)
    expect(aus[10].midi).toBe(69)
    expect(aus[11].midi).toBe(69)
    for (let i = 12; i < 20; i++) expect(aus[i].midi, `Frame ${i}`).toBe(72)
  })

  it('verlangt für einen Oktavsprung bei gleichem Pegel 6 übereinstimmende Frames', () => {
    const frames = [
      ...Array.from({ length: 10 }, () => frame(440, -30)),
      ...Array.from({ length: 10 }, () => frame(880, -30)),
    ]
    const aus = spiele(frames)
    for (let i = 10; i < 15; i++) expect(aus[i].midi, `Frame ${i}`).toBe(69)
    for (let i = 15; i < 20; i++) expect(aus[i].midi, `Frame ${i}`).toBe(81)
  })

  it('wechselt bei einem deutlich lauteren Oktavsprung (≥ 6 dB) schon nach 3 Frames', () => {
    const frames = [
      ...Array.from({ length: 10 }, () => frame(440, -30)),
      ...Array.from({ length: 10 }, () => frame(880, -23)),
    ]
    const aus = spiele(frames)
    expect(aus[10].midi).toBe(69)
    expect(aus[11].midi).toBe(69)
    for (let i = 12; i < 20; i++) expect(aus[i].midi, `Frame ${i}`).toBe(81)
  })

  it('hält das Tor mit Hysterese offen und zeigt die letzte Note danach noch 400 ms gedimmt', () => {
    const { smoother, setzeZeit } = erstelleSmoother()
    let t = 0
    const schritt = (a: FrameAnalyse) => {
      setzeZeit(t)
      const g = smoother.push(a)
      t += FRAME_MS
      return g
    }
    for (let i = 0; i < 5; i++) schritt(frame(440, -30))
    // −63 dBFS liegt zwischen Öffnen (−60) und Schließen (−66): Tor bleibt offen.
    const mitte = schritt(leiseFrame(-63))
    expect(mitte.torOffen).toBe(true)
    expect(mitte.midi).toBe(69)
    expect(mitte.gehalten).toBe(false)
    // −70 dBFS schließt das Tor; die Note bleibt gedimmt stehen.
    const zuZeit = t
    const zu = schritt(leiseFrame(-70))
    expect(zu.torOffen).toBe(false)
    expect(zu.midi).toBe(69)
    expect(zu.gehalten).toBe(true)
    t = zuZeit + HOLD_MS - 10
    const nochGehalten = schritt(leiseFrame(-70))
    expect(nochGehalten.midi).toBe(69)
    expect(nochGehalten.gehalten).toBe(true)
    t = zuZeit + HOLD_MS + 20
    const vorbei = schritt(leiseFrame(-70))
    expect(vorbei.midi).toBeNull()
    expect(vorbei.gehalten).toBe(false)
  })

  it('öffnet das Tor bei −63 dBFS nicht, wenn es vorher nie offen war', () => {
    const aus = spiele([frame(440, -63)])
    expect(aus[0].torOffen).toBe(false)
    expect(aus[0].midi).toBeNull()
  })

  it('vergisst nach reset() alles', () => {
    const { smoother } = erstelleSmoother()
    for (let i = 0; i < 5; i++) smoother.push(frame(440, -30))
    smoother.reset()
    const g = smoother.push(leiseFrame(-70))
    expect(g.midi).toBeNull()
    expect(g.torOffen).toBe(false)
  })
})
