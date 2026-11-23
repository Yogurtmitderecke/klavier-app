---
phase: 02-mikrofon-testseite
plan: 05
subsystem: audio + mic-test UI
tags: [diagnostics, MIC-04, layout]
requires: ["02-04"]
provides:
  - "QuellenDiagnose + PitchSource.diagnose() / beiAenderung() (src/audio/pitchSource.ts)"
  - "Diagnose, DiagnoseZeile, diagnoseZeilen() – 16 display rows (src/audio/diagnoseZeilen.ts)"
  - "DiagnosePanel component (src/components/DiagnosePanel.tsx)"
  - "micStore.diagnose + LEERE_DIAGNOSE"
  - "Two-column .mic-test layout from 1100px"
affects: [src/audio/analyserPitchSource.ts, src/audio/micController.ts, src/screens/MicTestScreen.tsx, src/state/micStore.ts, src/styles/tokens.css]
tech-stack:
  added: []
  patterns:
    - "Pure row builder in .ts plus a purely presentational component that reads no store"
    - "undefined (not reported) kept distinct from null (never ran) and false/true"
    - "All track/ctx listeners collected in an unsubscribe list and removed in stop()"
    - "Diagnostics published at most once per second from the loop, otherwise only on discrete events"
key-files:
  created:
    - src/audio/diagnoseZeilen.ts
    - src/audio/diagnoseZeilen.test.ts
    - src/components/DiagnosePanel.tsx
    - src/components/DiagnosePanel.test.tsx
  modified:
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
  - "The change callback is a PitchSource method beiAenderung(cb) instead of a constructor option. The controller receives an already-built source (the fakes build it, and so does the default parameter), so it can only subscribe afterwards."
  - "abtastrateMikro is typed number | undefined | null, like the filter flags. A run where Safari does not report the rate shows 'nicht gemeldet', and a source that never ran shows '–'."
  - "Analysefenster shows '–' until the app sample rate is known, because the ms value needs it."
  - "The Audio-Status row only flags 'suspended' as a problem while the mic is meant to be running (mikLaeuft). After a user stop it is normal."
  - "After stop() the track listeners are removed first, then spur is set to null, and analysenProSek/analyseMs reset to null. The other device values (rates, filters, name) stay visible."
  - "The dl rows are wrapped in div.diagnose-zeile with display: contents, so dt/dd stay direct grid cells (valid HTML for dl)."
metrics:
  duration: "~20 min"
  completed: 2026-11-23
  tasks: 2
  files: 14
---

# Phase 2 Plan 05: Diagnose Panel Summary

The Mikrofon-Test page now has an always-visible "Diagnose" panel with 16 rows. It shows launch mode, app version, audio state, app and mic sample rates, the three voice filters (`aus ✓` / `nicht gemeldet` / `AN ✗`), which filters are adjustable, the mic name, track state, audio session, analysis window, analyses per second with their duration, the last track or context event and the raw error details. From 1100px wide it sits in a right-hand column next to the live values, so one landscape iPad screenshot captures everything.

## What was built

- **pitchSource.ts**: new `QuellenDiagnose` type. `PitchSource` gains `diagnose()` and `beiAenderung(cb)`.
- **AnalyserPitchSource**:
  - After the audio graph is connected, it reads `track.getSettings()`. It keeps `undefined` as undefined and never coerces it to true or false (Pitfall 2).
  - It reads `getSupportedConstraints()` and keeps only the three filter keys.
  - It records the track label and the track state (`aktiv`, `stumm` or `beendet`).
  - It registers `mute`, `unmute` and `ended` on the track and `statechange` on the context. Each one stores `letztesEreignis` with a de-DE `HH:MM:SS` time and calls the change callback.
  - `stop()` removes every listener before stopping the tracks.
  - `kontextStatus`, `abtastrateApp` and `audioSitzung` are read live on each `diagnose()` call. `audioSitzung` comes from an injectable option that defaults to `navigator.audioSession?.type`.
- **diagnoseZeilen.ts**: a pure builder for the 16 rows. Numbers are grouped de-DE (`48.000 Hz`, `4.096 Werte = 85 ms`, `60 (je 0,4 ms)`). It flags these as problems:
  - a sample-rate mismatch (`≠ App – Tonhöhe kann falsch sein`)
  - a filter that is on (`AN ✗`)
  - a muted or ended track (`✗`)
  - `interrupted`, or `suspended` while the mic should be running
  - fewer than 20 analyses per second (` ✗`)
  - any error details
- **DiagnosePanel.tsx**: a `<section aria-labelledby>` with an `<h2>` and a `<dl>`. Problem values get the `diag-problem` class. It has no button and reads no store.
- **micStore**: `diagnose` starts from `LEERE_DIAGNOSE`, which already includes `VERSION_LABEL`, `FFT_SIZE` and startart `safari`.
- **micController**:
  - Counts analyses in a 1-second window and keeps the last `dauerMs`.
  - `veroeffentlicheDiagnose()` runs once per second from the loop. It also runs on `pruefeZugang()` (so the panel is filled before start), on start success (where it also subscribes `beiAenderung`), on start error and on stop.
- **MicTestScreen**: `<DiagnosePanel>` is the second child of `.mic-test` and is rendered in every state, including errors and no HTTPS.
- **tokens.css**:
  - `.diagnose` panel styles: surface background, 16px radius, 24px padding, 32px heading, 20px grid rows. Problem values use `--color-warning-text`.
  - From `min-width: 1100px`, the page is a `minmax(0, 3fr) minmax(0, 2fr)` grid with `align-items: start`.
  - Nothing is fixed or sticky.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 RED | a0ac68d | test(02-05): failing tests for diagnostics rows and panel |
| 1 GREEN | 2619069 | feat(02-05): diagnostics rows and panel |
| 2 RED | 5fbab09 | test(02-05): failing tests for live diagnostics |
| 2 GREEN | 010896b | feat(02-05): live diagnostics panel beside the measurements |

## Verification

- `npm run lint`: 0 issues
- `npm test`: 14 files, 113 tests passed (22 new: 10 row tests, 3 panel tests, 7 controller tests, 2 screen tests)
- `npm run build`: OK
- The acceptance greps all match: `getSettings()`, `getSupportedConstraints`, `'statechange'`, `'mute'`, `'ended'`, `removeEventListener`, `<DiagnosePanel`, `min-width: 1100px`, `minmax(0, 3fr) minmax(0, 2fr)` and `.diag-problem`. No `position: fixed/sticky` was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Change callback as a method instead of a constructor option**
- **Found during:** Task 2
- **Issue:** The controller receives the `PitchSource` already built, from the test fakes or from the default parameter, so it could not pass an `onAenderung` constructor option.
- **Fix:** Added `beiAenderung(cb | null)` to the `PitchSource` interface. The controller subscribes after a successful start and unsubscribes in `stop()`.
- **Files modified:** src/audio/pitchSource.ts, src/audio/analyserPitchSource.ts, src/audio/micController.ts
- **Commit:** 010896b

**2. [Rule 1 - Bug] `abtastrateMikro` can be undefined**
- **Found during:** Task 1
- **Issue:** The planned type `number | null` cannot express "the mic ran but Safari did not report a rate", yet the plan's behaviour requires `nicht gemeldet` for that case.
- **Fix:** Widened the type to `number | undefined | null`, the same as the filter flags.
- **Commit:** a0ac68d

### Notes

- The `PitchSource` interface methods were added in Task 2 rather than Task 1, so each commit type-checks. Task 1 only added the `QuellenDiagnose` type.
- The worktree started at a different base and was reset to `51a1348` as the startup check instructed, before any work began.

## TDD Gate Compliance

Both tasks have a `test(...)` RED commit followed by a `feat(...)` GREEN commit. Task 1's RED run failed because the modules were missing. Task 2's RED run had 9 failing tests while the other 104 passed. No refactor commits were needed.

## Known Stubs

None.

## Threat Flags

None. All browser-provided strings (mic label, error message, audio session type) are rendered as React text nodes (T-02-16), and long strings wrap via `overflow-wrap: anywhere`. All listeners are removed in `stop()`, and the panel is republished at most once per second plus on discrete events (T-02-17). Nothing is stored or sent anywhere (T-02-15).

## Self-Check: PASSED

- src/audio/diagnoseZeilen.ts, src/audio/diagnoseZeilen.test.ts, src/components/DiagnosePanel.tsx and src/components/DiagnosePanel.test.tsx exist.
- Commits a0ac68d, 2619069, 5fbab09 and 010896b are present in `git log`.
