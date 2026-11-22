import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
