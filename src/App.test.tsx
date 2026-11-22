import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { useAppStore } from './state/appStore'

describe('Start-Ablauf', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'welcome' })
  })

  afterEach(() => {
    cleanup()
  })

  it('zeigt den Willkommensbildschirm mit Titel und Start-Knopf', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Klavier-App')
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
  })

  it('wechselt nach Tippen auf Start zur Übersicht, ohne die URL zu ändern', () => {
    render(<App />)
    const hrefVorher = window.location.href

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Was möchtest du tun?')
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
    expect(window.location.href).toBe(hrefVorher)
  })
})

describe('Übersicht mit Kacheln', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'welcome' })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  function zurUebersicht() {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  }

  it('zeigt genau 3 Kacheln mit den richtigen Titeln', () => {
    zurUebersicht()
    const kacheln = document.querySelectorAll('button.tile')
    expect(kacheln.length).toBe(3)
    const titel = Array.from(kacheln).map((k) => k.querySelector('.tile-titel')?.textContent)
    expect(titel).toEqual(['Mikrofon-Test', 'Stücke üben', 'Einstellungen'])
  })

  it('markiert „Stücke üben“ und „Einstellungen“ als gesperrt mit „kommt bald“', () => {
    zurUebersicht()
    for (const name of [/Stücke üben/, /Einstellungen/]) {
      const kachel = screen.getByRole('button', { name })
      expect(kachel.getAttribute('aria-disabled')).toBe('true')
      expect(kachel.hasAttribute('disabled')).toBe(false)
      expect(kachel.textContent).toContain('kommt bald')
    }
    const mikro = screen.getByRole('button', { name: /Mikrofon-Test/ })
    expect(mikro.getAttribute('aria-disabled')).toBeNull()
  })

  it('zeigt beim Tippen auf eine gesperrte Kachel 3 s lang einen Hinweis und navigiert nicht', () => {
    vi.useFakeTimers()
    zurUebersicht()

    fireEvent.click(screen.getByRole('button', { name: /Stücke üben/ }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Was möchtest du tun?')
    const region = document.querySelector('[aria-live="polite"]')
    expect(region).not.toBeNull()
    expect(region?.textContent).toContain('Dieser Bereich kommt bald.')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(region?.textContent ?? '').not.toContain('Dieser Bereich kommt bald.')
  })
})
