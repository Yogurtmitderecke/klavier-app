---
phase: 02-mikrofon-testseite
plan: 04
subsystem: audio + mic-test UI
tags: [mic-errors, startart, hints, background-stop, MIC-01]
requires: ["02-03"]
provides:
  - "MicFehlerArt + classifyMicError + fehlerText (src/audio/micErrors.ts)"
  - "Startart + ermittleStartart (src/lib/startart.ts)"
  - "PitchSource.zugangMoeglich(), MicController.pruefeZugang()"
  - "micStore.fehlerArt / micStore.hinweis"
  - "MicFehler (role=alert) and MicHinweis (role=status) components"
  - "--color-warning-text token for plan 05"
affects: [src/audio/micController.ts, src/screens/MicTestScreen.tsx, src/state/micStore.ts]
tech-stack:
  added: []
  patterns:
    - "Defensive name read from unknown errors, string-literal union instead of enum (erasableSyntaxOnly)"
    - "Injectable window-like parameter with optional matchMedia call (jsdom-safe)"
    - "Hint state written to the store only on change (no per-frame setState)"
    - "Screen content slot chosen via a JSX variable (no nested component, so no remount at 15 Hz)"
key-files:
  created:
    - src/audio/micErrors.ts
    - src/audio/micErrors.test.ts
    - src/lib/startart.ts
    - src/lib/startart.test.ts
    - src/components/MicFehler.tsx
    - src/components/MicHinweis.tsx
  modified:
    - src/globals.d.ts
    - src/audio/pitchSource.ts
    - src/audio/analyserPitchSource.ts
    - src/audio/micController.ts
    - src/audio/micController.test.ts
    - src/audio/testFakes.ts
    - src/state/micStore.ts
    - src/screens/MicTestScreen.tsx
    - src/screens/MicTestScreen.test.tsx
    - src/texte.ts
    - src/styles/tokens.css
decisions:
  - "visibilitychange/pagehide only stop the mic when status is 'laeuft' or 'startet'; otherwise backgrounding an idle, insecure or failed page would overwrite the WarningBar/error help with a misleading 'gestoppt, weil im Hintergrund' status."
  - "The hint is recomputed every frame: keinSignal (exact zeros > KEIN_SIGNAL_MS) beats angehalten (kontextStatus() !== 'running'). So 'angehalten' also appears if the context drops out of 'running' mid-run (e.g. Safari 'interrupted'), not only right after start."
  - "AnalyserPitchSource reads mediaDevices from the option or globalThis.navigator?.mediaDevices, so zugangMoeglich() is safe in jsdom and on insecure origins."
  - "MicFehler falls back to 'unbekannt' if status is 'fehler' but fehlerArt is missing."
metrics:
  duration: "~15 min"
  completed: 2026-11-23
  tasks: 2
  files: 17
---

# Phase 2 Plan 04: Mic Error Help, Hints and Background Stop Summary

When the microphone can't start, the Mikrofon-Test page now explains why in German, with numbered steps, and the toggle button becomes "Nochmal versuchen". This covers permission denied (with the iOS 26.5.2 "close Safari / restart the iPad" step), no mic found, mic busy, an unknown error and no HTTPS. Two non-fatal hints are shown when the mic delivers only zeros or the audio context stays suspended. The mic stops when the app goes to the background or the page is hidden.

## What was built

- **micErrors.ts**: `classifyMicError` maps NotAllowedError/SecurityError to `verweigert`, NotFoundError/OverconstrainedError to `keinMikrofon`, NotReadableError/AbortError to `belegt`, `UnsicherError` to `unsicher`, and everything else to `unbekannt`. `fehlerText` returns the raw `Name: Nachricht`.
- **startart.ts**: `ermittleStartart()` returns `homescreen` when `navigator.standalone === true` or when `(display-mode: standalone)` matches, otherwise `safari`.
- **globals.d.ts**: a `Navigator` augmentation adds `standalone?` and `audioSession?`.
- **AnalyserPitchSource**: has a new `isSecureContext` option and a `zugangMoeglich()` method. `start()` throws `UnsicherError` before it creates or resumes a context.
- **micController**:
  - New `pruefeZugang()`.
  - The catch block classifies the error, setting status `unsicher`, or status `fehler` together with `fehlerArt`/`fehlerDetails`.
  - New hints `keinSignal`/`angehalten`, driven by `KEIN_SIGNAL_MS`.
  - `start()` and `stop()` clear `fehlerArt`, `fehlerDetails` and `hinweis`.
- **MicFehler / MicHinweis**: German copy taken word for word from the UI-SPEC and stored in `TEXTE.mikrofonTest.fehler` / `.hinweis`. The Safari-only step lives in `schrittSafari` and is left out in home-screen mode. There is no button inside the box.
- **MicTestScreen**:
  - On mount, `pruefeZugang()` runs. If access isn't possible, the page shows the unchanged Phase 1 `WarningBar` and no toggle button.
  - A hint slot sits between the control row and the content.
  - The content slot shows the WarningBar, MicFehler or the Messkarte, depending on state.
  - `visibilitychange`/`pagehide` listeners are removed on cleanup.
- **tokens.css**: adds `--color-warning-text: #FF8A75` plus the `.mic-fehler` and `.mic-hinweis` box styles.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 RED | 5350e3f | test(02-04): failing tests for mic error kinds and launch mode |
| 1 GREEN | 98491a5 | feat(02-04): mic error kinds and launch-mode detection |
| 2 RED | 2e1d3e5 | test(02-04): failing tests for mic error and hint paths |
| 2 GREEN | fec9464 | feat(02-04): German mic error help, hints and background stop |

## Verification

- `npm run lint`: 0 issues
- `npm test`: 12 files, 91 tests passed. 14 of these tests are new in Task 2 and 11 in Task 1.
- `npm run build`: OK

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Background/pagehide stop guarded by status**
- **Found during:** Task 2
- **Issue:** Calling `stop('hintergrund')` unconditionally on `visibilitychange` would change an idle page to "Mikrofon gestoppt, weil die App im Hintergrund war." and would also replace the WarningBar or error help after the user switched apps.
- **Fix:** Both listeners only stop when the status is `laeuft` or `startet`. Unmount cleanup still always calls `stop('verlassen')`.
- **Files modified:** src/screens/MicTestScreen.tsx
- **Commit:** fec9464

### Notes

- `src/App.test.tsx` already installed a fake controller in the `Mikrofon-Test` describe block's `beforeEach` (added in plan 01/02), so it needed no change. `src/components/MicToggleButton.tsx` already labels `hintergrund` as "Mikrofon starten" and needed no change either.
- `testFakes.ts` gained `ohneMediaDevices` and `resumeHaengt` as planned. It was committed with the RED tests because those tests depend on it.

## TDD Gate Compliance

Both tasks have a `test(...)` RED commit followed by a `feat(...)` GREEN commit. Each RED run failed as expected: Task 1 failed with missing modules, and Task 2 had 14 failing tests while all existing tests still passed. No refactor commits were needed.

## Known Stubs

None. The `unbekannt` intro points to the "Fehlerdetails" diagnostics row, which plan 05 (DiagnosePanel) adds. `fehlerDetails` is already stored for it.

## Threat Flags

None. No new network endpoints, storage or trust boundaries. Error strings are rendered as React text nodes only (T-02-14), `getUserMedia` is never called on an insecure origin (T-02-11), and backgrounding or pagehide stops all tracks (T-02-12).

## Self-Check: PASSED

- All 6 created files exist on disk.
- Commits 5350e3f, 98491a5, 2e1d3e5 and fec9464 are present in `git log`.
