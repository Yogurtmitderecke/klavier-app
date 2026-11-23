import { describe, expect, it } from 'vitest'
import { classifyMicError, fehlerText } from './micErrors'

describe('classifyMicError – Fehlerarten beim Mikrofon-Start', () => {
  it('ordnet verweigerte Erlaubnis als „verweigert“ ein', () => {
    expect(classifyMicError(new DOMException('x', 'NotAllowedError'))).toBe('verweigert')
    expect(classifyMicError(new DOMException('x', 'SecurityError'))).toBe('verweigert')
  })

  it('ordnet fehlendes Mikrofon als „keinMikrofon“ ein', () => {
    expect(classifyMicError(new DOMException('x', 'NotFoundError'))).toBe('keinMikrofon')
    expect(classifyMicError(new DOMException('x', 'OverconstrainedError'))).toBe('keinMikrofon')
  })

  it('ordnet ein belegtes Mikrofon als „belegt“ ein', () => {
    expect(classifyMicError(new DOMException('x', 'NotReadableError'))).toBe('belegt')
    expect(classifyMicError(new DOMException('x', 'AbortError'))).toBe('belegt')
  })

  it('ordnet alles andere als „unbekannt“ ein', () => {
    expect(classifyMicError(new DOMException('x', 'InvalidStateError'))).toBe('unbekannt')
    expect(classifyMicError(new Error('x'))).toBe('unbekannt')
    expect(classifyMicError(null)).toBe('unbekannt')
    expect(classifyMicError('string')).toBe('unbekannt')
  })

  it('ordnet einen UnsicherError als „unsicher“ ein', () => {
    expect(classifyMicError({ name: 'UnsicherError' })).toBe('unsicher')
  })
})

describe('fehlerText – technische Fehlerangabe', () => {
  it('liefert „Name: Nachricht“', () => {
    expect(fehlerText(new DOMException('denied', 'NotAllowedError'))).toBe(
      'NotAllowedError: denied',
    )
  })

  it('liefert „unbekannt“ ohne Fehlerobjekt', () => {
    expect(fehlerText(null)).toBe('unbekannt')
  })
})
