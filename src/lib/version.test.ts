import { describe, expect, it } from 'vitest'
import { formatVersion } from './version'

describe('formatVersion', () => {
  it('rechnet in Berliner Zeit (später UTC-Abend ist dort schon der nächste Tag)', () => {
    expect(formatVersion('0.1.0', '2026-11-22T23:30:00Z', 'a1b2c3d')).toBe(
      'Version 0.1.0 · 23.11.2026 · a1b2c3d',
    )
  })

  it('bleibt in der Sommerzeit am selben Tag', () => {
    expect(formatVersion('1.2.3', '2026-06-30T21:59:00Z', 'dev')).toBe(
      'Version 1.2.3 · 30.06.2026 · dev',
    )
  })
})
