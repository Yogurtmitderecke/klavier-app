import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { erstelleMicController } from './micController'
import { erstelleFakeAudio, erstelleFakeRaf } from './testFakes'
import { HOLD_MS } from './einstellungen'
import { klavierTon, rauschen, sinus, stille } from './testSignale'
import { MIC_START_ZUSTAND, useMicStore } from '../state/micStore'

describe('micController – Mikrofon starten und stoppen (MIC-01)', () => {
  beforeEach(() => {
    useMicStore.setState({ ...MIC_START_ZUSTAND })
  })

  it('ruft resume() am AudioContext auf, bevor getUserMedia fertig ist', async () => {
    const fake = erstelleFakeAudio()
    const controller = erstelleMicController({ quelle: fake.quelle })

    await controller.start()

    const resumeIndex = fake.protokoll.indexOf('resume')
    const gumIndex = fake.protokoll.indexOf('gum-resolved')
    expect(resumeIndex).toBeGreaterThanOrEqual(0)
    expect(gumIndex).toBeGreaterThanOrEqual(0)
    expect(resumeIndex).toBeLessThan(gumIndex)
  })

  it('fordert das Mikrofon ohne Sprachverarbeitung an', async () => {
    const fake = erstelleFakeAudio()
    const controller = erstelleMicController({ quelle: fake.quelle })

    await controller.start()

    expect(fake.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
    expect(fake.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
      video: false,
    })
  })

  it('setzt nach dem Start den Status „laeuft“ und verbindet Quelle, Analyser und stumme Verstärkung', async () => {
    const fake = erstelleFakeAudio()
    const controller = erstelleMicController({ quelle: fake.quelle })

    await controller.start()

    expect(useMicStore.getState().status).toBe('laeuft')
    expect(fake.ctx.createMediaStreamSource).toHaveBeenCalledWith(fake.stream)
    expect(fake.quellKnoten.connect).toHaveBeenCalledWith(fake.analyser)
    expect(fake.analyser.fftSize).toBe(4096)
    expect(fake.analyser.connect).toHaveBeenCalledWith(fake.gain)
    expect(fake.gain.gain.value).toBe(0)
    expect(fake.gain.connect).toHaveBeenCalledWith(fake.ctx.destination)
    expect(fake.quelle.sampleRate).toBe(48000)
  })

  it('stoppt mit stop(„nutzer“) alle Spuren, trennt die Quelle und pausiert den Kontext, ohne ihn zu schließen', async () => {
    const fake = erstelleFakeAudio()
    const controller = erstelleMicController({ quelle: fake.quelle })
    await controller.start()

    controller.stop('nutzer')

    expect(fake.track.stop).toHaveBeenCalled()
    expect(fake.quellKnoten.disconnect).toHaveBeenCalled()
    expect(fake.ctx.suspend).toHaveBeenCalled()
    expect(fake.ctx.close).not.toHaveBeenCalled()
    expect(useMicStore.getState().status).toBe('gestoppt')

    expect(() => controller.stop('nutzer')).not.toThrow()
    expect(fake.ctx.close).not.toHaveBeenCalled()
  })

  it('gibt einen Stream sofort wieder frei, der erst nach stop(„verlassen“) ankommt', async () => {
    const fake = erstelleFakeAudio({ gumHaengt: true })
    const controller = erstelleMicController({ quelle: fake.quelle })

    const start = controller.start()
    controller.stop('verlassen')
    fake.loeseGum()
    await start

    expect(fake.track.stop).toHaveBeenCalled()
    expect(fake.ctx.createMediaStreamSource).not.toHaveBeenCalled()
    expect(useMicStore.getState().status).toBe('idle')
  })

  it('zeigt den Status „fehler“ mit Details, wenn die Erlaubnis verweigert wird', async () => {
    const fake = erstelleFakeAudio()
    fake.mediaDevices.getUserMedia.mockRejectedValueOnce(
      new DOMException('denied', 'NotAllowedError'),
    )
    const controller = erstelleMicController({ quelle: fake.quelle })

    await controller.start()

    expect(useMicStore.getState().status).toBe('fehler')
    expect(useMicStore.getState().fehlerDetails).toBe('NotAllowedError: denied')
  })
})

describe('micController – Ton live anzeigen (MIC-02)', () => {
  beforeEach(() => {
    useMicStore.setState({ ...MIC_START_ZUSTAND })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function starteMitSignal(signal: Float32Array) {
    const fake = erstelleFakeAudio()
    const uhr = erstelleFakeRaf()
    fake.setzeSignal(signal)
    const controller = erstelleMicController({
      quelle: fake.quelle,
      raf: uhr.raf,
      caf: uhr.caf,
      jetzt: uhr.jetzt,
    })
    await controller.start()
    return { fake, uhr, controller }
  }

  it('zeigt bei einem 440-Hz-Ton nach wenigen Frames A4 mit Cent und Hz', async () => {
    const { uhr } = await starteMitSignal(sinus(440, 4096, 48000))

    uhr.schritt(10)

    const { live } = useMicStore.getState()
    expect(live.notenLabel).toBe('A4')
    expect(live.international).toBe('A4')
    expect(Math.abs(live.cents ?? 99)).toBeLessThanOrEqual(1)
    expect(live.hz).toBeCloseTo(440, 0)
    expect(live.gehalten).toBe(false)
  })

  it('meldet Live-Werte höchstens 15-mal pro Sekunde an den Store', async () => {
    const { uhr } = await starteMitSignal(sinus(440, 4096, 48000))
    const spion = vi.spyOn(useMicStore, 'setState')

    uhr.schritt(60)

    const liveAufrufe = spion.mock.calls.filter(
      ([arg]) => typeof arg === 'object' && arg !== null && 'live' in arg,
    )
    expect(liveAufrufe.length).toBeGreaterThan(0)
    expect(liveAufrufe.length).toBeLessThanOrEqual(16)
  })

  it('bricht beim Stoppen den wartenden Frame ab und setzt die Live-Werte zurück', async () => {
    const { uhr, controller } = await starteMitSignal(sinus(440, 4096, 48000))
    uhr.schritt(10)
    expect(useMicStore.getState().live.notenLabel).toBe('A4')

    controller.stop('nutzer')

    expect(uhr.caf).toHaveBeenCalled()
    expect(uhr.wartend()).toBe(0)
    expect(useMicStore.getState().live).toEqual(MIC_START_ZUSTAND.live)
  })

  it('zeigt bei Stille keinen Ton', async () => {
    const { uhr } = await starteMitSignal(stille(4096))

    uhr.schritt(10)

    const { live } = useMicStore.getState()
    expect(live.notenLabel).toBeNull()
    expect(live.cents).toBeNull()
    expect(live.db === null || live.db === -Infinity).toBe(true)
  })
})

describe('micController – geglättete Anzeige und Messwerte (MIC-03, MIC-05)', () => {
  beforeEach(() => {
    useMicStore.setState({ ...MIC_START_ZUSTAND })
  })

  async function starteMitSignal(signal: Float32Array) {
    const fake = erstelleFakeAudio()
    const uhr = erstelleFakeRaf()
    fake.setzeSignal(signal)
    const controller = erstelleMicController({
      quelle: fake.quelle,
      raf: uhr.raf,
      caf: uhr.caf,
      jetzt: uhr.jetzt,
    })
    await controller.start()
    return { fake, uhr, controller }
  }

  it('hält nach dem Verklingen die letzte Note gedimmt und zeigt nach über 400 ms „–“', async () => {
    const { fake, uhr } = await starteMitSignal(klavierTon(440, 4096, 48000, { amp: 0.1 }))
    uhr.schritt(20)
    expect(useMicStore.getState().live.notenLabel).toBe('A4')
    expect(useMicStore.getState().live.gehalten).toBe(false)

    fake.setzeSignal(stille(4096))
    uhr.schritt(6)
    expect(useMicStore.getState().live.notenLabel).toBe('A4')
    expect(useMicStore.getState().live.gehalten).toBe(true)

    uhr.schritt(Math.ceil(HOLD_MS / 16.7) + 6)
    expect(useMicStore.getState().live.notenLabel).toBeNull()
    expect(useMicStore.getState().live.gehalten).toBe(false)
  })

  it('meldet Pegel und Klarheit roh, auch wenn kein Ton gültig ist', async () => {
    const { uhr } = await starteMitSignal(rauschen(4096, 0.1))
    uhr.schritt(10)
    const { live } = useMicStore.getState()
    expect(live.notenLabel).toBeNull()
    expect(typeof live.db).toBe('number')
    expect(Number.isFinite(live.db)).toBe(true)
    expect(typeof live.klarheit).toBe('number')
  })
})
