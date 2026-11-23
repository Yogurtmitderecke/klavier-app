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

describe('MicTestScreen – Pegel, Erkennungssicherheit und Stimmgerät (MIC-03, D-08)', () => {
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

  function meter(name: string): Element {
    const alle = Array.from(document.querySelectorAll('[role="meter"]'))
    const treffer = alle.find((m) => m.getAttribute('aria-label') === name)
    if (treffer === undefined) throw new Error(`Kein Messbalken „${name}“`)
    return treffer
  }

  it('zeigt im Ruhezustand Lautstärke und Erkennungssicherheit mit „–“ und keine Nadel', () => {
    render(<MicTestScreen />)
    expect(meter('Lautstärke').getAttribute('aria-valuetext')).toBe('–')
    expect(meter('Erkennungssicherheit').getAttribute('aria-valuetext')).toBe('–')
    expect(meter('Lautstärke').textContent).toContain('–')
    const tuner = meter('Abweichung in Cent')
    expect(tuner.querySelector('.tuner-nadel')).toBeNull()
  })

  it('zeigt bei einem A4 (Sinus, Amplitude 0,2) Pegel, Klarheit und die Stimmgerät-Nadel', async () => {
    fake.setzeSignal(sinus(440, 4096, 48000, 0.2))
    render(<MicTestScreen />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    act(() => {
      uhr.schritt(10)
    })

    expect(meter('Lautstärke').getAttribute('aria-valuetext')).toBe('−17 dB')
    expect(meter('Erkennungssicherheit').getAttribute('aria-valuetext')).toMatch(/^[01],\d\d$/)
    const tuner = meter('Abweichung in Cent')
    expect(tuner.querySelector('.tuner-nadel')).not.toBeNull()
    expect(tuner.querySelector('.tuner-band')).not.toBeNull()
    expect(tuner.querySelector('.tuner-mitte')).not.toBeNull()
  })

  it('enthält keinen Timer, keinen Kopieren-Knopf und keine Checkliste (D-05)', async () => {
    fake.setzeSignal(sinus(440, 4096, 48000, 0.2))
    render(<MicTestScreen />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    act(() => {
      uhr.schritt(10)
    })
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/Timer|Kopieren|Checkliste/)
  })
})

describe('MicTestScreen – Fehler, ohne HTTPS und Hintergrund (MIC-01)', () => {
  let fake: ReturnType<typeof erstelleFakeAudio>
  let uhr: ReturnType<typeof erstelleFakeRaf>
  const secureUrspruenglich = Object.getOwnPropertyDescriptor(window, 'isSecureContext')

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
    if (secureUrspruenglich) {
      Object.defineProperty(window, 'isSecureContext', secureUrspruenglich)
    } else {
      delete (window as { isSecureContext?: boolean }).isSecureContext
    }
    delete (navigator as { standalone?: boolean }).standalone
    delete (document as { visibilityState?: string }).visibilityState
  })

  async function starteMitVerweigerung() {
    fake.mediaDevices.getUserMedia.mockRejectedValueOnce(
      new DOMException('denied', 'NotAllowedError'),
    )
    render(<MicTestScreen />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
  }

  it('zeigt bei verweigerter Erlaubnis eine Hilfe mit Schritten und „Nochmal versuchen“', async () => {
    const hrefVorher = window.location.href
    await starteMitVerweigerung()

    const box = screen.getByRole('alert')
    expect(box.textContent).toContain('Die App darf das Mikrofon nicht benutzen.')
    const liste = box.querySelector('ol')
    expect(liste).not.toBeNull()
    expect(liste?.textContent).toContain('Website-Einstellungen')
    expect(liste?.textContent).toContain('starte das iPad neu')
    expect(box.querySelector('button')).toBeNull()
    expect(screen.getByRole('button', { name: 'Nochmal versuchen' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Gehörter Ton' })).toBeNull()
    expect(window.location.href).toBe(hrefVorher)
  })

  it('lässt den Safari-Schritt weg, wenn die App vom Home-Bildschirm gestartet wurde', async () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    await starteMitVerweigerung()

    const liste = screen.getByRole('alert').querySelector('ol')
    expect(liste?.textContent).not.toContain('Website-Einstellungen')
    expect(liste?.textContent).toContain('starte das iPad neu')
  })

  it('zeigt ohne HTTPS die Warnung, keinen Start-Knopf und den passenden Status', () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })
    render(<MicTestScreen />)

    expect(document.body.textContent).toContain('Achtung: Diese Seite ist nicht sicher verbunden.')
    expect(screen.queryByRole('button', { name: 'Mikrofon starten' })).toBeNull()
    expect(document.querySelector('.mic-status')?.textContent).toBe(
      'Ohne HTTPS geht das Mikrofon nicht.',
    )
    expect(fake.mediaDevices.getUserMedia).not.toHaveBeenCalled()
  })

  it('stoppt das Mikrofon, wenn die App in den Hintergrund geht', async () => {
    render(<MicTestScreen />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    expect(fake.track.stop).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(fake.track.stop).toHaveBeenCalled()
    expect(document.querySelector('.mic-status')?.textContent).toBe(
      'Mikrofon gestoppt, weil die App im Hintergrund war.',
    )
    expect(screen.getByRole('button', { name: 'Mikrofon starten' })).toBeTruthy()
  })

  it('stoppt das Mikrofon bei pagehide', async () => {
    render(<MicTestScreen />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    expect(fake.track.stop).toHaveBeenCalled()
  })

  it('zeigt den Hinweis „keine Daten“ bei anhaltender exakter Stille', async () => {
    render(<MicTestScreen />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mikrofon starten' }))
    })
    act(() => {
      uhr.schritt(100)
    })

    const hinweis = screen.getByRole('status')
    expect(hinweis.textContent).toContain('Das Mikrofon liefert keine Daten.')
  })
})
