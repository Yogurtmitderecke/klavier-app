import type { QuellenDiagnose } from './pitchSource'
import { TEXTE } from '../texte'

// Vollständige Diagnose für die Anzeige: Quelle + App-Werte + Controller-Messungen.
export interface Diagnose extends QuellenDiagnose {
  startart: 'safari' | 'homescreen'
  appVersion: string
  fensterGroesse: number
  analysenProSek: number | null
  analyseMs: number | null
  fehlerDetails: string | null
  mikLaeuft: boolean
}

export interface DiagnoseZeile {
  label: string
  wert: string
  // Problemwerte tragen immer auch eine Text-Markierung (✗, AN, ≠) – nie nur Farbe.
  problem: boolean
}

// Unter dieser Analyse-Rate wird die Erkennung träge.
const MIN_ANALYSEN_PRO_SEK = 20

const ganzzahl = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const eineNachkommastelle = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const L = TEXTE.mikrofonTest.diagnose.zeilen
const W = TEXTE.mikrofonTest.diagnose.werte

function hz(rate: number): string {
  return `${ganzzahl.format(rate)} Hz`
}

function filterWert(wert: boolean | undefined | null): { wert: string; problem: boolean } {
  if (wert === null) return { wert: W.leer, problem: false }
  // undefined = von Safari nicht gemeldet – erwartet, kein Problem (Pitfall 2).
  if (wert === undefined) return { wert: W.nichtGemeldet, problem: false }
  return wert ? { wert: W.an, problem: true } : { wert: W.aus, problem: false }
}

function filterName(schluessel: string): string {
  const namen: Record<string, string> = W.filterNamen
  return namen[schluessel] ?? schluessel
}

// Baut aus dem Diagnose-Schnappschuss genau 16 Anzeigezeilen (Reihenfolge laut UI-SPEC).
export function diagnoseZeilen(d: Diagnose): DiagnoseZeile[] {
  const z = (label: string, wert: string, problem = false): DiagnoseZeile => ({
    label,
    wert,
    problem,
  })
  // Lief das Mikrofon schon einmal? Dann heißt ein fehlender Wert „nicht gemeldet“.
  const liefSchon = d.abtastrateApp !== null

  const status =
    d.kontextStatus === null
      ? z(L.audioStatus, W.leer)
      : z(
          L.audioStatus,
          W.status[d.kontextStatus],
          d.kontextStatus === 'interrupted' || (d.kontextStatus === 'suspended' && d.mikLaeuft),
        )

  let mikro: DiagnoseZeile
  if (d.abtastrateMikro === null || d.abtastrateMikro === undefined) {
    mikro = z(L.abtastrateMikro, liefSchon ? W.nichtGemeldet : W.leer)
  } else if (d.abtastrateApp !== null && d.abtastrateMikro !== d.abtastrateApp) {
    mikro = z(L.abtastrateMikro, `${hz(d.abtastrateMikro)} ${W.rateUngleich}`, true)
  } else {
    mikro = z(L.abtastrateMikro, hz(d.abtastrateMikro))
  }

  const echo = filterWert(d.echo)
  const rausch = filterWert(d.rausch)
  const autoPegel = filterWert(d.autoPegel)

  const einstellbar =
    d.einstellbar === null
      ? W.leer
      : d.einstellbar.length === 0
        ? W.keine
        : d.einstellbar.map(filterName).join(', ')

  const mikrofon =
    d.mikrofonName === null ? W.leer : d.mikrofonName === '' ? W.ohneNamen : d.mikrofonName

  const spur =
    d.spur === null
      ? z(L.spur, W.leer)
      : d.spur === 'aktiv'
        ? z(L.spur, W.aktiv)
        : z(L.spur, d.spur === 'stumm' ? W.stumm : W.beendet, true)

  const fenster =
    d.abtastrateApp === null || d.abtastrateApp <= 0
      ? W.leer
      : `${ganzzahl.format(d.fensterGroesse)} ${W.werte} = ${Math.round(
          (d.fensterGroesse / d.abtastrateApp) * 1000,
        )} ms`

  let analysen: DiagnoseZeile
  if (d.analysenProSek === null) {
    analysen = z(L.analysenProSek, W.leer)
  } else {
    const dauer =
      d.analyseMs === null || !Number.isFinite(d.analyseMs)
        ? ''
        : ` (je ${eineNachkommastelle.format(d.analyseMs)} ms)`
    const zuLangsam = d.analysenProSek < MIN_ANALYSEN_PRO_SEK
    analysen = z(
      L.analysenProSek,
      `${ganzzahl.format(d.analysenProSek)}${dauer}${zuLangsam ? ' ✗' : ''}`,
      zuLangsam,
    )
  }

  return [
    z(L.startart, d.startart === 'homescreen' ? W.homescreen : W.safari),
    z(L.appVersion, d.appVersion),
    status,
    z(L.abtastrateApp, d.abtastrateApp === null ? W.leer : hz(d.abtastrateApp)),
    mikro,
    z(L.echo, echo.wert, echo.problem),
    z(L.rausch, rausch.wert, rausch.problem),
    z(L.autoPegel, autoPegel.wert, autoPegel.problem),
    z(L.einstellbar, einstellbar),
    z(L.mikrofon, mikrofon),
    spur,
    z(L.audioSitzung, d.audioSitzung ?? W.leer),
    z(L.analysefenster, fenster),
    analysen,
    z(
      L.letztesEreignis,
      d.letztesEreignis === null ? W.leer : `${d.letztesEreignis.zeit} – ${d.letztesEreignis.text}`,
    ),
    d.fehlerDetails === null || d.fehlerDetails === ''
      ? z(L.fehlerDetails, W.leer)
      : z(L.fehlerDetails, d.fehlerDetails, true),
  ]
}
