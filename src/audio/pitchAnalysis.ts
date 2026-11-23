import { PitchDetector } from 'pitchy'
import { CLARITY_MIN, FFT_SIZE, FREQ_MAX, FREQ_MIN } from './einstellungen'
import { hzToMidiFloat } from './noteMath'

// Ergebnis der Analyse eines Zeitfensters.
export interface FrameAnalyse {
  rms: number
  // Pegel in dBFS; −Infinity bei digitaler Stille.
  db: number
  // Rohe Schätzung von pitchy (auch wenn ungültig).
  hz: number
  // Rohe Klarheit von pitchy (0..1).
  clarity: number
  // Tonhöhe im erlaubten Bereich und klar genug.
  valid: boolean
  midiFloat: number | null
  // Rechenzeit von findPitch in ms.
  dauerMs: number
}

// RMS und Pegel in dBFS – selbst gerechnet, nicht über pitchys minVolume-Einstellung.
export function berechnePegel(buf: Float32Array): { rms: number; db: number } {
  let summe = 0
  for (let i = 0; i < buf.length; i++) summe += buf[i] * buf[i]
  const rms = buf.length > 0 ? Math.sqrt(summe / buf.length) : 0
  const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity
  return { rms, db }
}

// Einmal pro Fenstergröße erzeugen und wiederverwenden – nie pro Frame.
// Lautstärke- und Klarheits-Schwellen von pitchy bleiben bewusst auf Standard.
export function erstelleDetektor(n: number = FFT_SIZE): PitchDetector<Float32Array> {
  return PitchDetector.forFloat32Array(n)
}

// Analysiert ein Zeitfenster. sampleRate kommt immer zur Laufzeit aus dem AudioContext.
export function analysiereFrame(
  buf: Float32Array,
  sampleRate: number,
  detektor: PitchDetector<Float32Array>,
  jetzt: () => number = () => performance.now(),
): FrameAnalyse {
  const { rms, db } = berechnePegel(buf)
  const t0 = jetzt()
  const [hzRoh, clarityRoh] = detektor.findPitch(buf, sampleRate)
  const dauerMs = jetzt() - t0
  const hz = Number.isFinite(hzRoh) ? hzRoh : 0
  const clarity = Number.isFinite(clarityRoh) ? clarityRoh : 0
  const valid =
    Number.isFinite(hzRoh) &&
    Number.isFinite(clarityRoh) &&
    hz >= FREQ_MIN &&
    hz <= FREQ_MAX &&
    clarity >= CLARITY_MIN
  return { rms, db, hz, clarity, valid, midiFloat: valid ? hzToMidiFloat(hz) : null, dauerMs }
}
