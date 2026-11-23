import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MicTestScreen } from './MicTestScreen'
import { erstelleMicController, setzeMicController } from '../audio/micController'
import { erstelleFakeAudio, erstelleFakeRaf } from '../audio/testFakes'
import { sinus } from '../audio/testSignale'
import { useAppStore } from '../state/appStore'
import { MIC_START_ZUSTAND, useMicStore } from '../state/micStore'

describe('MicTestScreen – Mikrofon starten und stoppen', () => {
  let fake: ReturnType<typeof erstelleFakeAudio>
  let uhr: ReturnType<typeof erstelleFakeRaf>

  beforeEach(() => {
    fake = erstelleFakeAudio()
    uhr = erstelleFakeRaf()
    setzeMicController(
      erstelleMicController({ quelle: fake.quelle, raf: uhr.raf, caf: uhr.caf, jetzt: uhr.jetzt }),
    )
    useAppStore.setState({ screen: 'mic-test' })
    useMicStore.setState({ ...MIC_START_ZUSTAND })
  })

  afterEach(() => {
    cleanup()
  })

  it('zeigt Titel, Start-Knopf und den Hinweis, dass das Mikrofon aus ist', () => {
    render(<MicTestScreen />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mikrofon-Test')
    expect(screen.getByRole('button', { name: 'Mikrofon starten' })).toBeTruthy()
    expect(document.body.textContent).toContain(
      'Das Mikrofon ist aus. Tippe auf „Mikrofon starten“.',
    )
  })

  it('startet und stoppt das Mikrofon mit demselben Knopf, ohne die URL zu ändern', async () => {
    render(<MicTestScreen />)
    const hrefVorher = window.location.href

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })

    expect(screen.getByRole('button', { name: 'Mikrofon stoppen' })).toBeTruthy()
    expect(document.body.textContent).toContain('Mikrofon läuft – spiel einen Ton.')
    expect(window.location.href).toBe(hrefVorher)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon stoppen' }))
    })

    expect(screen.getByRole('button', { name: 'Mikrofon starten' })).toBeTruthy()
    expect(document.body.textContent).toContain('Mikrofon gestoppt. Es hört nichts mehr.')
    expect(fake.track.stop).toHaveBeenCalled()
    expect(window.location.href).toBe(hrefVorher)
  })

  it('gibt das Mikrofon frei, wenn die Seite verlassen wird', async () => {
    render(<MicTestScreen />)
    const hrefVorher = window.location.href

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    expect(fake.track.stop).not.toHaveBeenCalled()

    cleanup()

    expect(fake.track.stop).toHaveBeenCalled()
    expect(fake.ctx.close).not.toHaveBeenCalled()
    expect(useMicStore.getState().status).toBe('idle')
    expect(window.location.href).toBe(hrefVorher)
  })
})

describe('MicTestScreen – gehörter Ton (MIC-02)', () => {
  let fake: ReturnType<typeof erstelleFakeAudio>
  let uhr: ReturnType<typeof erstelleFakeRaf>

  beforeEach(() => {
    fake = erstelleFakeAudio()
    uhr = erstelleFakeRaf()
    setzeMicController(
      erstelleMicController({ quelle: fake.quelle, raf: uhr.raf, caf: uhr.caf, jetzt: uhr.jetzt }),
    )
    useAppStore.setState({ screen: 'mic-test' })
    useMicStore.setState({ ...MIC_START_ZUSTAND })
  })

  afterEach(() => {
    cleanup()
  })

  it('zeigt vor dem Start Platzhalter in der Messkarte', () => {
    render(<MicTestScreen />)
    const karte = screen.getByRole('region', { name: 'Gehörter Ton' })
    expect(karte.querySelector('.note')?.textContent).toBe('–')
    expect(karte.textContent).toContain('– Cent')
    expect(karte.textContent).toContain('– Hz')
    expect(karte.textContent).toContain('international: –')
  })

  it('zeigt bei einem gespielten A4 Notenname, Hz und internationalen Namen live', async () => {
    fake.setzeSignal(sinus(440, 4096, 48000))
    render(<MicTestScreen />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    act(() => {
      uhr.schritt(10)
    })

    const karte = screen.getByRole('region', { name: 'Gehörter Ton' })
    expect(karte.querySelector('.note')?.textContent).toBe('A4')
    expect(karte.textContent).toContain('440,0 Hz')
    expect(karte.textContent).toContain('0 Cent')
    expect(karte.textContent).toContain('international: A4')
    expect(document.querySelector('.mic-status')?.textContent).toBe('Mikrofon läuft.')
  })
})
