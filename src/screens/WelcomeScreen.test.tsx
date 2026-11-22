import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WelcomeScreen } from './WelcomeScreen'
import { useAppStore } from '../state/appStore'

// jsdom liefert isSecureContext über einen Getter; defineProperty ist robuster als stubGlobal.
const urspruenglich = Object.getOwnPropertyDescriptor(window, 'isSecureContext')

function setzeSecureContext(wert: boolean) {
  Object.defineProperty(window, 'isSecureContext', { value: wert, configurable: true })
}

describe('WelcomeScreen – Warnung ohne HTTPS (DEPL-02)', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'welcome' })
  })

  afterEach(() => {
    cleanup()
    useAppStore.setState({ screen: 'welcome' })
    if (urspruenglich) {
      Object.defineProperty(window, 'isSecureContext', urspruenglich)
    } else {
      delete (window as { isSecureContext?: boolean }).isSecureContext
    }
  })

  it('zeigt ohne sichere Verbindung eine deutsche Warnung mit sicherer Adresse über dem Start-Knopf', () => {
    setzeSecureContext(false)
    render(<WelcomeScreen />)

    const warnung = screen.getByRole('alert')
    expect(warnung.textContent).toContain('nicht sicher verbunden')
    expect(warnung.textContent).toContain('Mikrofon')

    const link = warnung.querySelector('a')
    expect(link).not.toBeNull()
    const href = link?.getAttribute('href') ?? ''
    expect(href).toMatch(/^https:\/\/.+\/klavier-app\/$/)
    expect(link?.textContent).toBe(href)

    const start = screen.getByRole('button', { name: 'Start' })
    // Warnung steht im DOM vor (also über) dem Start-Knopf.
    expect(warnung.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    fireEvent.click(start)
    expect(useAppStore.getState().screen).toBe('overview')
  })

  it('zeigt bei sicherer Verbindung keine Warnung', () => {
    setzeSecureContext(true)
    render(<WelcomeScreen />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
