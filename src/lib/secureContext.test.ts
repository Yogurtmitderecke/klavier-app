import { describe, expect, it } from 'vitest'
import { isInsecureContext } from './secureContext'

describe('isInsecureContext', () => {
  it('ist true, wenn die Seite nicht sicher verbunden ist', () => {
    expect(isInsecureContext({ isSecureContext: false })).toBe(true)
  })

  it('ist false bei sicherer Verbindung (HTTPS oder localhost)', () => {
    expect(isInsecureContext({ isSecureContext: true })).toBe(false)
  })
})
