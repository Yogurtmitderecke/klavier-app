import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { VersionLabel } from './VersionLabel'

describe('VersionLabel', () => {
  afterEach(() => {
    cleanup()
  })

  it('zeigt "Version x.y.z · TT.MM.JJJJ · sha"', () => {
    const { container } = render(<VersionLabel />)
    const el = container.querySelector('.version-label')
    expect(el).not.toBeNull()
    expect(el?.textContent ?? '').toMatch(/^Version \d+\.\d+\.\d+ · \d{2}\.\d{2}\.\d{4} · \S+$/)
  })
})
