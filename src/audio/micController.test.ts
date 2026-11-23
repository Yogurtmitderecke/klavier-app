import { beforeEach, describe, expect, it } from 'vitest'
import { erstelleMicController } from './micController'
import { erstelleFakeAudio } from './testFakes'
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
