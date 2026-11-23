import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DiagnosePanel } from './DiagnosePanel'
import type { Diagnose } from '../audio/diagnoseZeilen'

const DIAGNOSE: Diagnose = {
  kontextStatus: 'running',
  abtastrateApp: 48000,
  abtastrateMikro: 44100,
  echo: false,
  rausch: undefined,
  autoPegel: undefined,
  einstellbar: ['echoCancellation'],
  mikrofonName: 'iPad Mikrofon',
  spur: 'aktiv',
  audioSitzung: null,
  letztesEreignis: null,
  startart: 'safari',
  appVersion: 'Version 0.2.0 · 23.11.2026 · abc1234',
  fensterGroesse: 4096,
  analysenProSek: 60,
  analyseMs: 0.4,
  fehlerDetails: null,
  mikLaeuft: true,
}

describe('DiagnosePanel (MIC-04)', () => {
  afterEach(() => {
    cleanup()
  })

  it('zeigt Überschrift „Diagnose“ und 16 Zeilen als dt/dd', () => {
    const { container } = render(<DiagnosePanel diagnose={DIAGNOSE} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Diagnose')
    const dl = container.querySelector('dl')
    expect(dl).not.toBeNull()
    expect(dl?.querySelectorAll('dt').length).toBe(16)
    expect(dl?.querySelectorAll('dd').length).toBe(16)
  })

  it('zeigt Filter- und Abtastraten-Werte und markiert Probleme mit Klasse und Text', () => {
    const { container } = render(<DiagnosePanel diagnose={DIAGNOSE} />)
    const text = container.textContent ?? ''
    expect(text).toContain('aus ✓')
    expect(text).toContain('nicht gemeldet')
    expect(text).toContain('≠')
    const probleme = Array.from(container.querySelectorAll('dd.diag-problem'))
    expect(probleme.length).toBe(1)
    expect(probleme[0].textContent).toContain('≠')
  })

  it('hat keinen Knopf (D-05: nur Anzeige)', () => {
    const { container } = render(<DiagnosePanel diagnose={DIAGNOSE} />)
    expect(container.querySelector('button')).toBeNull()
  })
})
