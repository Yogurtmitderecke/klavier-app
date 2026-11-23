# Phase 2: Mikrofon-Testseite - Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 37 (27 new incl. tests/helpers, 9 modified, 1 deleted)
**Analogs found:** 31 / 37 (6 have no real analog; use the RESEARCH.md patterns)

The codebase is small (Phase 1 only: 3 screens, 4 components, 2 lib modules, 1 store). Every analog below is in `src/`. There is **no** existing audio code, no class and no rAF loop, so the audio runtime files rely on RESEARCH.md Patterns 1–7 and borrow only conventions (injection via default params, German comments, `import type`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/audio/einstellungen.ts` | config (constants) | – | `src/config.ts` | role-match |
| `src/audio/noteMath.ts` | utility (pure) | transform | `src/lib/version.ts` | exact (pure fn + module-level `Intl` formatter) |
| `src/audio/noteMath.test.ts` | test | – | `src/lib/version.test.ts` | exact |
| `src/audio/pitchAnalysis.ts` | utility (pure) | transform (Float32Array → frame) | `src/lib/secureContext.ts` (injectable default param) | partial |
| `src/audio/pitchAnalysis.test.ts` | test | – | `src/lib/secureContext.test.ts` | role-match |
| `src/audio/smoothing.ts` | utility (stateful class) | transform/stream | none | no analog |
| `src/audio/smoothing.test.ts` | test | – | `src/lib/version.test.ts` | role-match |
| `src/audio/micErrors.ts` | utility (pure) | transform (Error → kind) | `src/lib/secureContext.ts` | exact |
| `src/audio/micErrors.test.ts` | test | – | `src/lib/secureContext.test.ts` | exact |
| `src/audio/pitchSource.ts` | types/interface | – | `src/components/Tile.tsx` lines 3-11 (interface style) | partial |
| `src/audio/analyserPitchSource.ts` | service (device I/O) | streaming | `src/lib/secureContext.ts` (DI via param only) | no real analog |
| `src/audio/analyserPitchSource.test.ts` | test (fakes) | – | `src/screens/WelcomeScreen.test.tsx` (global stubbing) | partial |
| `src/audio/micController.ts` | service/controller | event-driven (rAF) + pub to store | `src/state/appStore.ts` (store access) | no real analog |
| `src/audio/micController.test.ts` | test (fake timers/rAF) | – | `src/App.test.tsx` lines 68-84 (`vi.useFakeTimers`) | partial |
| `src/audio/testSignale.ts` | test utility | – | none | no analog |
| `src/audio/testFakes.ts` | test utility | – | RESEARCH.md "Fake audio deps for jsdom" | no analog |
| `src/state/micStore.ts` | store | pub-sub | `src/state/appStore.ts` | exact |
| `src/state/appStore.ts` (modify) | store | – | itself | – |
| `src/screens/MicTestScreen.tsx` | screen component | request-response + live subscribe | `src/screens/MicPlaceholderScreen.tsx` + `src/screens/WelcomeScreen.tsx` | exact |
| `src/screens/MicTestScreen.test.tsx` | component test | – | `src/screens/WelcomeScreen.test.tsx` + `src/App.test.tsx` lines 87-116 | exact |
| `src/screens/MicPlaceholderScreen.tsx` (delete) | – | – | – | – |
| `src/components/MicToggleButton.tsx` | component | request-response | `src/screens/WelcomeScreen.tsx` line 26-28 (`.btn-start`) + `src/components/BackButton.tsx` | role-match |
| `src/components/MicStatusText.tsx` | component | display | `src/screens/OverviewScreen.tsx` lines 72-79 (aria-live region) | role-match |
| `src/components/NotenAnzeige.tsx` | component | display | `src/components/VersionLabel.tsx` | role-match |
| `src/components/CentAnzeige.tsx` | component | display | `src/components/Tile.tsx` (props interface) | partial |
| `src/components/PegelBalken.tsx` | component | display | `src/components/Tile.tsx` (props interface + optional props) | partial |
| `src/components/MicHinweis.tsx` | component | display | `src/components/WarningBar.tsx` | exact |
| `src/components/MicFehler.tsx` | component | display | `src/components/WarningBar.tsx` | exact |
| `src/components/DiagnosePanel.tsx` | component | display | `src/components/VersionLabel.tsx` + `WarningBar.tsx` | role-match |
| `src/components/DiagnosePanel.test.tsx` | component test | – | `src/components/VersionLabel.test.tsx` | exact |
| `src/App.tsx` (modify) | root component | – | itself | – |
| `src/App.test.tsx` (modify) | test | – | itself lines 87-116 | – |
| `src/screens/OverviewScreen.tsx` (modify) | screen | – | itself lines 53-58 | – |
| `src/texte.ts` (modify) | config (strings) | – | itself | – |
| `src/styles/tokens.css` (modify) | styles | – | itself | – |
| `src/globals.d.ts` (modify) | types | – | itself | – |
| `package.json` (modify, pitchy@4.1.0 exact) | config | – | – | – |

## Pattern Assignments

### `src/audio/noteMath.ts` (utility, transform)

**Analog:** `src/lib/version.ts` (whole file, 13 lines)

Module-level `Intl` formatter created once, pure exported function, German header comment:
```typescript
// Formatiert das Versions-Label „Version 0.1.0 · 22.11.2026 · a1b2c3d“.
// Das Datum wird immer in Berliner Zeit gerechnet (CI läuft in UTC).
const datumFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
})

export function formatVersion(semver: string, isoDate: string, sha: string): string {
  const datum = datumFormat.format(new Date(isoDate))
  return `Version ${semver} · ${datum} · ${sha}`
}
```
Apply: `const hzFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })` at module level; same for clarity (2 decimals) and sample-rate grouping (`48.000`). Then pure `hzToMidiFloat(hz, a4 = 440)`, `midiToNote(midiFloat)` (RESEARCH Pattern 4), plus formatters `formatCent` (U+2212 minus), `formatHz`, `formatDb`, `formatKlarheit`, `internationalName`. Explicit return types like `formatVersion(...): string`.

---

### `src/audio/noteMath.test.ts`, `smoothing.test.ts` (tests)

**Analog:** `src/lib/version.test.ts` (whole file)
```typescript
import { describe, expect, it } from 'vitest'
import { formatVersion } from './version'

describe('formatVersion', () => {
  it('rechnet in Berliner Zeit (später UTC-Abend ist dort schon der nächste Tag)', () => {
    expect(formatVersion('0.1.0', '2026-11-22T23:30:00Z', 'a1b2c3d')).toBe(
      'Version 0.1.0 · 23.11.2026 · a1b2c3d',
    )
  })
```
Conventions: explicit `vitest` imports (no globals), test file colocated next to source, `describe` = function name, `it` titles in German full sentences. For `PitchSmoother` inject `now()` and drive a frame sequence (RESEARCH Pattern 3 / Validation MIC-05).

---

### `src/audio/micErrors.ts` (utility, Error → kind)

**Analog:** `src/lib/secureContext.ts` (whole file)
```typescript
// Prüft, ob die Seite NICHT sicher verbunden ist (kein HTTPS → kein Mikrofon).
// Bewusst isSecureContext statt location.protocol: localhost gilt auch über http als sicher.
export function isInsecureContext(win: Pick<Window, 'isSecureContext'> = window): boolean {
  return win.isSecureContext === false
}
```
Apply:
- Reuse `isInsecureContext()` directly for kind `unsicher` (do not duplicate the check). Add the `!navigator.mediaDevices?.getUserMedia` condition in a sibling function with the same injectable-default-param style, e.g. `kannMikrofonNutzen(win: Pick<Window, 'isSecureContext'> & { navigator: Pick<Navigator, 'mediaDevices'> } = window)`.
- Kind as string-literal union, NOT `enum` (`erasableSyntaxOnly`): `export type MicFehlerArt = 'unsicher' | 'verweigert' | 'keinMikrofon' | 'belegt' | 'unbekannt'` (mirrors `export type Screen = ...` in `appStore.ts` line 5).
- `classifyMicError(err: unknown): MicFehlerArt` switches on `(err as { name?: string })?.name` per RESEARCH Pattern 5 table.

### `src/audio/micErrors.test.ts`, `pitchAnalysis.test.ts`

**Analog:** `src/lib/secureContext.test.ts` — pass plain fake objects into the injectable parameter rather than patching globals:
```typescript
expect(isInsecureContext({ isSecureContext: false })).toBe(true)
```
For errors: `classifyMicError(new DOMException('denied', 'NotAllowedError'))` (DOMException exists in jsdom, RESEARCH Pitfall 8). For `analyzeFrame`, use real pitchy + `testSignale.ts`; tolerances per RESEARCH "Experiment results".

---

### `src/audio/einstellungen.ts` (config constants)

**Analog:** `src/config.ts`
```typescript
// Einzige Quelle für Build-Zeit-Werte (gesetzt über `define` in vite.config.ts).
export const VERSION_LABEL = formatVersion(__APP_VERSION__, __BUILD_DATE__, __GIT_SHA__)

// Sichere HTTPS-Adresse der App – nirgends sonst hart codieren.
export const SECURE_URL = __SECURE_URL__
```
Apply: one German comment per constant explaining why ("Einzige Quelle für …", "nirgends sonst hart codieren"). `FFT_SIZE = 4096`, `FREQ_MIN = 26`, `FREQ_MAX = 4400`, `CLARITY_MIN = 0.9`, `GATE_OPEN_DB = -60`, `GATE_CLOSE_DB = -66`, `MEDIAN_N = 5`, `HOLD_MS = 400`, `PUBLISH_HZ = 15`, `KEIN_SIGNAL_MS = 1500` (RESEARCH Pattern 2 table). No sample-rate constant.

---

### `src/audio/pitchSource.ts` (interface + types)

**Analog:** `src/components/Tile.tsx` lines 3-11 (interface with JSDoc'd optional fields)
```typescript
interface TileProps {
  titel: string
  beschreibung: string
  /** Gesperrte Kachel: ausgegraut, aria-disabled (bleibt fokussierbar). */
  gesperrt?: boolean
  ...
}
```
Apply: `export interface PitchSource { start(): Promise<void>; stop(): void; readFrame(buf: Float32Array): void; readonly sampleRate: number; diagnose(): Diagnose }` plus `export interface Diagnose {...}` and `export interface Frame {...}`, German JSDoc per field. Consumers must use `import type { PitchSource } from './pitchSource'` (`verbatimModuleSyntax`).

---

### `src/audio/smoothing.ts` (stateful class) — NO ANALOG

No class exists in the codebase. Follow RESEARCH Pattern 3. Constraint from `tsconfig.app.json` line 22 (`"erasableSyntaxOnly": true`): explicit field declarations, **no constructor parameter properties**:
```typescript
export class PitchSmoother {
  private verlauf: number[] = []
  private readonly jetzt: () => number
  constructor(jetzt: () => number = () => performance.now()) {
    this.jetzt = jetzt
  }
}
```
`noUnusedLocals/noUnusedParameters` (lines 20-21) also apply.

---

### `src/audio/analyserPitchSource.ts` (device I/O, streaming) — NO REAL ANALOG

Only borrowable convention: dependency injection through a defaulted parameter (as `isInsecureContext(win = window)`). Inject `{ mediaDevices, createContext, isSecureContext }` via constructor options object. Body: RESEARCH Pattern 1 (sync `resume()` before `await getUserMedia`, constraints EC/NS/AGC `false`, `channelCount: 1`, `video: false`, `Gain(0) → destination`) and Pattern 7 (idempotent `stop()`, `ctx.suspend()`, never `close()`, never a hard-coded sample rate).

### `src/audio/micController.ts` (rAF loop + store publish) — NO REAL ANALOG

Module-level singleton (audio objects never in React/Zustand state, RESEARCH Pattern 7). Writes to the store outside React via `useMicStore.setState(...)` / `useMicStore.getState()` (the same API `App.test.tsx` line 8 uses: `useAppStore.setState({ screen: 'welcome' })`). Throttle publish to ~15 Hz; inject `requestAnimationFrame`/`now` for tests.

### `src/audio/micController.test.ts`, `analyserPitchSource.test.ts`

**Analog for timers:** `src/App.test.tsx` lines 68-84
```typescript
vi.useFakeTimers()
...
act(() => {
  vi.advanceTimersByTime(3000)
})
```
plus `vi.useRealTimers()` in `afterEach` (line 40). **Analog for global patching (only if unavoidable):** `src/screens/WelcomeScreen.test.tsx` lines 6-26 (save descriptor, `Object.defineProperty`, restore in `afterEach`). Preferred: inject fakes from `src/audio/testFakes.ts` (RESEARCH "Fake audio deps for jsdom"). Order assertion: `ctx.resume` called before the `getUserMedia` promise resolves.

---

### `src/state/micStore.ts` (store, pub-sub)

**Analog:** `src/state/appStore.ts` (whole file)
```typescript
import { create } from 'zustand'

// Bildschirme der App. Umschalten nur über App-Zustand – kein Router,
// keine URL-/Hash-Änderung (D-03, wichtig für die Mikrofon-Erlaubnis auf dem iPad).
export type Screen = 'welcome' | 'overview' | 'mic-placeholder'

interface AppState {
  screen: Screen
  setScreen: (s: Screen) => void
  onStart: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'welcome',
  setScreen: (s) => set({ screen: s }),
  ...
}))
```
Apply: `export type MicStatus = 'idle' | 'startet' | 'laeuft' | 'gestoppt' | 'hintergrund' | 'fehler' | 'unsicher'` (string union, no enum); `interface MicState { status; fehlerArt: MicFehlerArt | null; fehlerDetails: string | null; hinweis: 'keinSignal' | 'angehalten' | null; live: {...}; diagnose: Diagnose }`; `create<MicState>()((set) => ({...}))` curried form. Only plain serialisable data; no AudioContext/stream. Tests reset with `useMicStore.setState(...)` in `beforeEach`, like `App.test.tsx` line 8.

### `src/state/appStore.ts` (modify)
- Line 5: `'mic-placeholder'` → `'mic-test'`.
- Lines 16-18: delete the stale comment "Phase 2 ergänzt hier den Audio-Start und die Mikrofon-Anfrage" (superseded by D-01). Keep `onStart: () => set({ screen: 'overview' })`.

---

### `src/screens/MicTestScreen.tsx` (screen)

**Analog 1:** `src/screens/MicPlaceholderScreen.tsx` (whole file) — header, focus-on-mount, BackButton:
```typescript
import { useEffect, useRef } from 'react'
import { BackButton } from '../components/BackButton'
import { TEXTE } from '../texte'

export function MicPlaceholderScreen() {
  const titelRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titelRef.current?.focus()
  }, [])

  return (
    <>
      <header className="screen-header screen-header--unterseite">
        <BackButton />
        <h1 ref={titelRef} tabIndex={-1}>
          {TEXTE.mikrofonPlatzhalter.titel}
        </h1>
      </header>
      ...
```
**Analog 2:** `src/screens/WelcomeScreen.tsx` lines 9-12, 25 — insecure check at render + `WarningBar`:
```typescript
const onStart = useAppStore((s) => s.onStart)
// Ohne HTTPS: Warnung direkt über dem Start-Knopf (D-07 / DEPL-02).
const unsicher = isInsecureContext()
...
{unsicher && <WarningBar />}
```
**Analog 3:** `src/screens/OverviewScreen.tsx` lines 24-27 — effect cleanup returned from the mount effect:
```typescript
useEffect(() => {
  titelRef.current?.focus()
  return timerLoeschen
}, [])
```
Apply: in the mount effect, focus the h1, add `pagehide` + `visibilitychange` listeners, and return a cleanup that removes them and calls `micController.stop()` (covers "‹ Zurück" without touching `BackButton`, D-03; must be idempotent because `<StrictMode>` in `main.tsx` line 7 runs cleanup once on mount). Store selectors one field each: `useMicStore((s) => s.status)`. Named export `export function MicTestScreen()` (all screens use named exports; only `App` is default). Root wrapper class e.g. `mic-test` for the 3fr/2fr grid from the UI-SPEC.

### `src/screens/MicTestScreen.test.tsx`

**Analog:** `src/screens/WelcomeScreen.test.tsx` (whole file) + `src/App.test.tsx` lines 96-115
```typescript
const urspruenglich = Object.getOwnPropertyDescriptor(window, 'isSecureContext')
function setzeSecureContext(wert: boolean) {
  Object.defineProperty(window, 'isSecureContext', { value: wert, configurable: true })
}
...
afterEach(() => {
  cleanup()
  useAppStore.setState({ screen: 'welcome' })
  if (urspruenglich) {
    Object.defineProperty(window, 'isSecureContext', urspruenglich)
  } else {
    delete (window as { isSecureContext?: boolean }).isSecureContext
  }
})
```
URL-unchanged assertion (App.test.tsx lines 98, 109):
```typescript
const hrefVorher = window.location.href
...
expect(window.location.href).toBe(hrefVorher)
```
Query by role + German name: `screen.getByRole('button', { name: 'Mikrofon starten' })`, `screen.getByRole('alert')`. jsdom `isSecureContext` is undefined → counts as secure (same as Phase 1). Async start: `await act(async () => { fireEvent.click(...) })`.

---

### `src/components/MicToggleButton.tsx` (component, request-response)

**Analogs:** `src/screens/WelcomeScreen.tsx` lines 26-28 and `src/components/BackButton.tsx`
```typescript
<button type="button" className="btn-start" onClick={onStart}>
  {TEXTE.willkommen.start}
</button>
```
```typescript
export function BackButton() {
  const setScreen = useAppStore((s) => s.setScreen)
  return (
    <button type="button" className="btn-back" onClick={() => setScreen('overview')}>
      {TEXTE.zurueck}
    </button>
  )
}
```
Apply: `type="button"`, className switches between an accent variant (copy `.btn-start` CSS, tokens.css lines 76-111, but `min-width: 320px` + `padding: 0 32px` instead of fixed `width`) and a surface variant (copy `.btn-back` CSS, lines 305-342). `disabled` while `startet`. onClick must call `micController.start()` **synchronously** (no `await` before it inside the handler).

### `src/components/MicHinweis.tsx`, `src/components/MicFehler.tsx` (display boxes)

**Analog:** `src/components/WarningBar.tsx` (whole file)
```typescript
import { SECURE_URL } from '../config'
import { TEXTE } from '../texte'

// Hinweis bei fehlendem HTTPS (D-07). Blockiert nichts – Start funktioniert weiter.
export function WarningBar() {
  return (
    <div role="alert" className="warning-bar">
      <p>
        <strong>{TEXTE.warnung.titel}</strong> {TEXTE.warnung.text}
      </p>
      ...
    </div>
  )
}
```
CSS analog: `.warning-bar` tokens.css lines 353-374 (padding 24px, 4px left border `--color-warning`, radius 12px, `--color-warning-surface`). `MicFehler`: `role="alert"`, props `{ art: MicFehlerArt; startart: 'safari' | 'homescreen' }`, title/intro/`<ol>` from `TEXTE.mikrofonTest.fehler[art]`; omit step 1 for `verweigert` in home-screen mode. `MicHinweis`: `role="status" aria-live="polite"`, padding 16px variant. `WarningBar` itself is reused unchanged for `unsicher`.

### `src/components/MicStatusText.tsx`

**Analog:** `src/screens/OverviewScreen.tsx` lines 72-79 — always-present live region whose content changes:
```typescript
<div className="kommt-bald-hinweis" aria-live="polite">
  {hinweis !== 'aus' && (
    <p ...>{TEXTE.uebersicht.kommtBaldHinweis}</p>
  )}
</div>
```
CSS analog `.kommt-bald-hinweis p` (tokens.css lines 259-267: body size, text-secondary).

### `src/components/NotenAnzeige.tsx`, `CentAnzeige.tsx`, `PegelBalken.tsx`

**Analogs:** `src/components/VersionLabel.tsx` (tiny presentational, named export, one-line German comment) and `src/components/Tile.tsx` lines 3-15 (props `interface XProps` with JSDoc, destructured params with defaults):
```typescript
export function Tile({ titel, beschreibung, gesperrt = false, badge = false, onClick }: TileProps) {
  const zeigeBadge = gesperrt || badge
  return (
    <button
      type="button"
      className={gesperrt ? 'tile tile--gesperrt' : 'tile'}
      aria-disabled={gesperrt ? 'true' : undefined}
```
Apply the same conditional-className + conditional-aria pattern for states (e.g. `className={gehalten ? 'note note--gehalten' : 'note'}`, needle hidden). `PegelBalken` props: `{ label, wertText, anteil: number | null, schwelle: number, min, max, wert }` with `role="meter"` + `aria-valuemin/max/now/valuetext`. Components receive formatted values as props (formatting lives in `noteMath.ts`); only the screen reads the store. `font-variant-numeric: tabular-nums` as in `.version-label` (tokens.css line 166).

### `src/components/DiagnosePanel.tsx` + test

**Analogs:** `src/components/VersionLabel.tsx` (reads `VERSION_LABEL` from `src/config.ts` — reuse that constant for row "App-Version", do not re-call `formatVersion`) and `src/components/VersionLabel.test.tsx`:
```typescript
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
```
Apply: render `<DiagnosePanel diagnose={...} />` with a plain props object (pure presentational, easy to test without the store); assert dt/dd text (`aus ✓`, `nicht gemeldet`, `≠`). Startart detection uses `navigator.standalone` (declare in `globals.d.ts`) and `window.matchMedia?.(...)` (optional call; jsdom has no matchMedia).

---

### `src/App.tsx` (modify)
Lines 2 and 14: replace import/usage with `MicTestScreen` and `screen === 'mic-test'`.

### `src/App.test.tsx` (modify)
Lines 87-116 (`describe('Mikrofon-Test-Platzhalter')`): replace the placeholder-text assertion (lines 106-108) with idle status text „Das Mikrofon ist aus. Tippe auf „Mikrofon starten“.“ and the "Mikrofon starten" button; keep the no-`.version-label` (line 105) and URL-unchanged checks. Line 64-65 test still valid (Mikrofon-Test tile not `aria-disabled`); add assertion that the tile no longer contains "kommt bald".

### `src/screens/OverviewScreen.tsx` (modify)
Lines 53-58: remove the `badge` prop and change `setScreen('mic-placeholder')` → `setScreen('mic-test')`.

### `src/texte.ts` (modify)
Lines 35-38: replace `mikrofonPlatzhalter` with `mikrofonTest: { titel, knopf: { starten, startet, stoppen, nochmal }, status: {...}, messkarte: {...}, hinweis: {...}, fehler: { verweigert: { titel, intro, schritte: [...] }, ... }, diagnose: { titel, zeilen: {...}, werte: {...} } }`. Keep header comment conventions (line 1-2: „…“ quotes, real –), keep `as const` (line 39). Safari menu-path steps as separate strings (assumption A4, easy to correct).

### `src/styles/tokens.css` (modify)
- Add to `:root` (after line 16 / line 31): `--font-anzeige: 120px;`, `--color-meter-band: #4A4E58;`, `--color-warning-text: #FF8A75;`.
- New rule blocks follow the existing order: base rule → `:active` → `@media (hover: hover)` → `:focus-visible` → `@media (prefers-reduced-motion: reduce)` (see `.btn-back` lines 305-342). Section comments in German (`/* Unterseiten: … */`). Breakpoints 1100px / 600px like the existing `@media (max-width: 720px)` block (lines 273-282).

### `src/globals.d.ts` (modify)
Append `interface Navigator { standalone?: boolean; audioSession?: { type: string } }` (global augmentation; file is a script, not a module, so plain `interface Navigator` merges). Keep the one-line German comment style.

## Shared Patterns

### German strings only via `TEXTE`
**Source:** `src/texte.ts`; used in every component (`BackButton.tsx` line 10, `WarningBar.tsx` line 10)
**Apply to:** all new components/screens. No literal German in TSX.

### Store access
**Source:** `src/components/BackButton.tsx` line 7, `src/screens/WelcomeScreen.tsx` line 9
```typescript
const setScreen = useAppStore((s) => s.setScreen)
```
**Apply to:** `MicTestScreen` (one selector per field). Outside React (`micController`): `useMicStore.getState()` / `useMicStore.setState()`.

### Secure-context check
**Source:** `src/lib/secureContext.ts` line 3-5 (`=== false`, not falsy)
**Apply to:** `micErrors.ts` / `analyserPitchSource.ts` / `MicTestScreen.tsx`.

### Focus h1 on mount + effect cleanup
**Source:** `src/screens/OverviewScreen.tsx` lines 15, 24-27, 47-49
**Apply to:** `MicTestScreen.tsx` (cleanup calls `micController.stop()`).

### No URL change
**Source:** `src/App.tsx` line 6 comment, `src/App.test.tsx` lines 23/29
**Apply to:** every new screen test asserts `window.location.href` unchanged after start/stop/error/back.

### TS strictness
**Source:** `tsconfig.app.json` lines 14, 20-22 — `verbatimModuleSyntax` (`import type`), `noUnusedLocals/Parameters`, `erasableSyntaxOnly` (no `enum`, no parameter properties, no namespaces). Linting via oxlint (`.oxlintrc.json`: `react/rules-of-hooks` error, `react/only-export-components` warn — keep non-component helpers out of `.tsx` component files).

### Tests
**Source:** all `*.test.ts(x)` — colocated, explicit `vitest` imports, `cleanup()` in `afterEach`, German `it` titles, store reset via `setState` in `beforeEach`. jsdom environment from `vite.config.ts` lines 33-35.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/audio/analyserPitchSource.ts` | service | streaming (mic) | No Web Audio code exists; use RESEARCH Patterns 1, 7 |
| `src/audio/micController.ts` | controller | event-driven (rAF) | No loop/singleton controller exists; use RESEARCH architecture diagram + Pattern 7 |
| `src/audio/smoothing.ts` | utility (class) | stream transform | No classes in codebase; RESEARCH Pattern 3 + `erasableSyntaxOnly` |
| `src/audio/pitchAnalysis.ts` | utility | transform | Only DI style borrowed; body from RESEARCH Pattern 2 (pitchy, created once) |
| `src/audio/testSignale.ts` | test util | – | RESEARCH "Synthetic piano-like test signal" (deterministic LCG, no `Math.random`) |
| `src/audio/testFakes.ts` | test util | – | RESEARCH "Fake audio deps for jsdom" |

## Metadata

**Analog search scope:** `src/**` (all 26 tracked source files), `vite.config.ts`, `tsconfig.app.json`, `package.json`, `.oxlintrc.json`
**Files scanned:** 31
**Pattern extraction date:** 2026-11-23
