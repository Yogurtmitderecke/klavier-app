import { vi } from 'vitest'
import { AnalyserPitchSource } from './analyserPitchSource'

// Nur für Tests: falsche Audio-Bausteine für jsdom (kein echtes Mikrofon, kein AudioContext).
// Wird nie vom App-Code importiert.

export interface FakeAudioOptionen {
  // getUserMedia bleibt hängen, bis loeseGum() aufgerufen wird (Erlaubnis-Abfrage offen).
  gumHaengt?: boolean
}

export function erstelleFakeAudio(optionen: FakeAudioOptionen = {}) {
  // Gemeinsames Aufruf-Protokoll, um die Reihenfolge zu prüfen (resume vor getUserMedia).
  const protokoll: string[] = []
  let signal: Float32Array = new Float32Array(0)

  const track = {
    stop: vi.fn(() => {
      protokoll.push('track-stop')
    }),
    getSettings: () => ({ echoCancellation: false, sampleRate: 48000 }),
    label: 'iPad Mikrofon',
    readyState: 'live',
    muted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  }

  const quellKnoten = { connect: vi.fn(), disconnect: vi.fn() }
  const analyser = {
    fftSize: 2048,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatTimeDomainData: vi.fn((buf: Float32Array) => {
      buf.fill(0)
      buf.set(signal.subarray(0, buf.length))
    }),
  }
  const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }

  class FakeCtx {
    state: AudioContextState = 'suspended'
    sampleRate = 48000
    destination = {}
    resume = vi.fn(async () => {
      protokoll.push('resume')
      this.state = 'running'
    })
    suspend = vi.fn(async () => {
      protokoll.push('suspend')
      this.state = 'suspended'
    })
    // Darf nie aufgerufen werden: der gemeinsame Kontext wird nur pausiert.
    close = vi.fn(async () => {
      protokoll.push('close')
      this.state = 'closed'
    })
    createMediaStreamSource = vi.fn(() => quellKnoten)
    createAnalyser = vi.fn(() => analyser)
    createGain = vi.fn(() => gain)
  }
  const ctx = new FakeCtx()

  let loeseGumIntern: (() => void) | null = null
  const mediaDevices = {
    getUserMedia: vi.fn((): Promise<typeof stream> => {
      protokoll.push('gum-aufgerufen')
      if (optionen.gumHaengt) {
        return new Promise((resolve) => {
          loeseGumIntern = () => {
            protokoll.push('gum-resolved')
            resolve(stream)
          }
        })
      }
      return Promise.resolve().then(() => {
        protokoll.push('gum-resolved')
        return stream
      })
    }),
  }

  const quelle = new AnalyserPitchSource({
    mediaDevices: mediaDevices as unknown as Pick<MediaDevices, 'getUserMedia'>,
    holeKontext: () => ctx as unknown as AudioContext,
  })

  return {
    ctx,
    mediaDevices,
    track,
    stream,
    quellKnoten,
    analyser,
    gain,
    quelle,
    protokoll,
    setzeSignal(buf: Float32Array) {
      signal = buf
    },
    loeseGum() {
      loeseGumIntern?.()
    },
  }
}
