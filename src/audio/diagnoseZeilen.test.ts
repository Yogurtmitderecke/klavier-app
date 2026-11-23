import { describe, expect, it } from 'vitest'
import { diagnoseZeilen, type Diagnose, type DiagnoseZeile } from './diagnoseZeilen'

const VOR_START: Diagnose = {
  kontextStatus: null,
  abtastrateApp: null,
  abtastrateMikro: null,
  echo: null,
  rausch: null,
  autoPegel: null,
  einstellbar: null,
  mikrofonName: null,
  spur: null,
  audioSitzung: null,
  letztesEreignis: null,
  startart: 'safari',
  appVersion: 'Version 0.2.0 · 23.11.2026 · abc1234',
  fensterGroesse: 4096,
  analysenProSek: null,
  analyseMs: null,
  fehlerDetails: null,
  mikLaeuft: false,
}

const LAEUFT: Diagnose = {
  ...VOR_START,
  kontextStatus: 'running',
  abtastrateApp: 48000,
  abtastrateMikro: 48000,
  echo: false,
  rausch: undefined,
  autoPegel: undefined,
  einstellbar: ['echoCancellation'],
  mikrofonName: 'iPad Mikrofon',
  spur: 'aktiv',
  audioSitzung: 'auto',
  analysenProSek: 60,
  analyseMs: 0.4,
  mikLaeuft: true,
}

function zeile(zeilen: DiagnoseZeile[], label: string): DiagnoseZeile {
  const z = zeilen.find((r) => r.label === label)
  if (z === undefined) throw new Error(`Keine Zeile „${label}“`)
  return z
}

describe('diagnoseZeilen (MIC-04)', () => {
  it('liefert genau 16 Zeilen in der festen Reihenfolge', () => {
    expect(diagnoseZeilen(VOR_START).map((z) => z.label)).toEqual([
      'Startart',
      'App-Version',
      'Audio-Status',
      'Abtastrate App',
      'Abtastrate Mikro',
      'Echo-Filter',
      'Rausch-Filter',
      'Auto-Pegel',
      'Einstellbar',
      'Mikrofon',
      'Mikrofon-Spur',
      'Audio-Sitzung',
      'Analysefenster',
      'Analysen/Sek.',
      'Letztes Ereignis',
      'Fehlerdetails',
    ])
  })

  it('zeigt vor dem Start Startart und Version, sonst „–“ und keine Probleme', () => {
    const zeilen = diagnoseZeilen(VOR_START)
    expect(zeile(zeilen, 'Startart').wert).toBe('Safari-Tab')
    expect(zeile(zeilen, 'App-Version').wert).toBe('Version 0.2.0 · 23.11.2026 · abc1234')
    for (const z of zeilen.slice(2)) expect(z.wert).toBe('–')
    expect(zeilen.some((z) => z.problem)).toBe(false)
  })

  it('zeigt Filter als „aus ✓“, „nicht gemeldet“ (kein Problem) oder „AN ✗“ (Problem)', () => {
    const zeilen = diagnoseZeilen({ ...LAEUFT, autoPegel: true })
    expect(zeile(zeilen, 'Echo-Filter')).toEqual({ label: 'Echo-Filter', wert: 'aus ✓', problem: false })
    expect(zeile(zeilen, 'Rausch-Filter').wert).toBe('nicht gemeldet')
    expect(zeile(zeilen, 'Rausch-Filter').problem).toBe(false)
    expect(zeile(zeilen, 'Auto-Pegel').wert).toBe('AN ✗')
    expect(zeile(zeilen, 'Auto-Pegel').problem).toBe(true)
  })

  it('formatiert Abtastraten deutsch und warnt bei abweichender Mikro-Rate', () => {
    let zeilen = diagnoseZeilen(LAEUFT)
    expect(zeile(zeilen, 'Abtastrate App').wert).toBe('48.000 Hz')
    expect(zeile(zeilen, 'Abtastrate Mikro').wert).toBe('48.000 Hz')
    expect(zeile(zeilen, 'Abtastrate Mikro').problem).toBe(false)

    zeilen = diagnoseZeilen({ ...LAEUFT, abtastrateMikro: 44100 })
    expect(zeile(zeilen, 'Abtastrate Mikro').wert).toBe('44.100 Hz ≠ App – Tonhöhe kann falsch sein')
    expect(zeile(zeilen, 'Abtastrate Mikro').problem).toBe(true)

    expect(zeile(diagnoseZeilen({ ...LAEUFT, abtastrateMikro: undefined }), 'Abtastrate Mikro').wert).toBe(
      'nicht gemeldet',
    )
    expect(zeile(diagnoseZeilen({ ...LAEUFT, abtastrateMikro: null }), 'Abtastrate Mikro').wert).toBe(
      'nicht gemeldet',
    )
  })

  it('übersetzt den Audio-Status und markiert unterbrochen bzw. angehalten bei laufendem Mikrofon', () => {
    expect(zeile(diagnoseZeilen(LAEUFT), 'Audio-Status')).toEqual({
      label: 'Audio-Status',
      wert: 'läuft (running)',
      problem: false,
    })
    const angehalten = zeile(diagnoseZeilen({ ...LAEUFT, kontextStatus: 'suspended' }), 'Audio-Status')
    expect(angehalten.wert).toBe('angehalten (suspended)')
    expect(angehalten.problem).toBe(true)
    const gestoppt = zeile(
      diagnoseZeilen({ ...LAEUFT, kontextStatus: 'suspended', mikLaeuft: false }),
      'Audio-Status',
    )
    expect(gestoppt.problem).toBe(false)
    const unterbrochen = zeile(diagnoseZeilen({ ...LAEUFT, kontextStatus: 'interrupted' }), 'Audio-Status')
    expect(unterbrochen.wert).toBe('unterbrochen (interrupted)')
    expect(unterbrochen.problem).toBe(true)
    expect(zeile(diagnoseZeilen({ ...LAEUFT, kontextStatus: 'closed' }), 'Audio-Status').wert).toBe(
      'geschlossen (closed)',
    )
  })

  it('listet einstellbare Filter oder „keine“', () => {
    expect(zeile(diagnoseZeilen(LAEUFT), 'Einstellbar').wert).toBe('Echo-Filter')
    expect(
      zeile(
        diagnoseZeilen({
          ...LAEUFT,
          einstellbar: ['echoCancellation', 'noiseSuppression', 'autoGainControl'],
        }),
        'Einstellbar',
      ).wert,
    ).toBe('Echo-Filter, Rausch-Filter, Auto-Pegel')
    expect(zeile(diagnoseZeilen({ ...LAEUFT, einstellbar: [] }), 'Einstellbar').wert).toBe('keine')
  })

  it('zeigt Mikrofon-Name und Spur-Zustand', () => {
    expect(zeile(diagnoseZeilen(LAEUFT), 'Mikrofon').wert).toBe('iPad Mikrofon')
    expect(zeile(diagnoseZeilen({ ...LAEUFT, mikrofonName: '' }), 'Mikrofon').wert).toBe('ohne Namen')
    expect(zeile(diagnoseZeilen(LAEUFT), 'Mikrofon-Spur')).toEqual({
      label: 'Mikrofon-Spur',
      wert: 'aktiv',
      problem: false,
    })
    expect(zeile(diagnoseZeilen({ ...LAEUFT, spur: 'stumm' }), 'Mikrofon-Spur')).toEqual({
      label: 'Mikrofon-Spur',
      wert: 'aktiv, aber stumm ✗',
      problem: true,
    })
    expect(zeile(diagnoseZeilen({ ...LAEUFT, spur: 'beendet' }), 'Mikrofon-Spur')).toEqual({
      label: 'Mikrofon-Spur',
      wert: 'beendet ✗',
      problem: true,
    })
  })

  it('zeigt Audio-Sitzung, Analysefenster und Analysen pro Sekunde', () => {
    const zeilen = diagnoseZeilen(LAEUFT)
    expect(zeile(zeilen, 'Audio-Sitzung').wert).toBe('auto')
    expect(zeile(zeilen, 'Analysefenster').wert).toBe('4.096 Werte = 85 ms')
    expect(zeile(zeilen, 'Analysen/Sek.')).toEqual({
      label: 'Analysen/Sek.',
      wert: '60 (je 0,4 ms)',
      problem: false,
    })
    const langsam = zeile(diagnoseZeilen({ ...LAEUFT, analysenProSek: 12 }), 'Analysen/Sek.')
    expect(langsam.wert.endsWith(' ✗')).toBe(true)
    expect(langsam.problem).toBe(true)
  })

  it('zeigt das letzte Ereignis mit Uhrzeit', () => {
    const z = zeile(
      diagnoseZeilen({ ...LAEUFT, letztesEreignis: { zeit: '14:32:05', text: 'Spur stumm' } }),
      'Letztes Ereignis',
    )
    expect(z.wert).toBe('14:32:05 – Spur stumm')
  })

  it('zeigt Home-Bildschirm und rohe Fehlerdetails als Problem', () => {
    const zeilen = diagnoseZeilen({
      ...VOR_START,
      startart: 'homescreen',
      fehlerDetails: 'NotAllowedError: denied',
    })
    expect(zeile(zeilen, 'Startart').wert).toBe('Home-Bildschirm')
    expect(zeile(zeilen, 'Fehlerdetails')).toEqual({
      label: 'Fehlerdetails',
      wert: 'NotAllowedError: denied',
      problem: true,
    })
  })
})
