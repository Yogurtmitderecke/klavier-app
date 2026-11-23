import { describe, expect, it } from 'vitest'
import { ermittleStartart } from './startart'

describe('ermittleStartart – Safari-Tab oder Home-Bildschirm', () => {
  it('erkennt den Home-Bildschirm über navigator.standalone', () => {
    expect(ermittleStartart({ navigator: { standalone: true } })).toBe('homescreen')
  })

  it('erkennt den Home-Bildschirm über display-mode: standalone', () => {
    const matchMedia = (q: string) => ({ matches: q === '(display-mode: standalone)' })
    expect(ermittleStartart({ navigator: {}, matchMedia })).toBe('homescreen')
  })

  it('liefert „safari“ ohne standalone und ohne matchMedia', () => {
    expect(ermittleStartart({ navigator: {} })).toBe('safari')
  })

  it('liefert „safari“, wenn matchMedia nicht passt', () => {
    expect(ermittleStartart({ navigator: { standalone: false }, matchMedia: () => ({ matches: false }) })).toBe(
      'safari',
    )
  })
})
