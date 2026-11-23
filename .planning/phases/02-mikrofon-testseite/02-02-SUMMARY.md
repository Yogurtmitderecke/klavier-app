---
phase: 02-mikrofon-testseite
plan: 02
subsystem: pitch-detection
tags: [pitchy, mpm, web-audio, requestAnimationFrame, zustand, tdd]
requires:
  - 02-01 (PitchSource, AnalyserPitchSource, micController, micStore, testFakes)
provides:
  - pitchy 4.1.0 runtime dependency (exact pin)
  - src/audio/noteMath.ts (hzToMidiFloat, midiToNote, internationalName, formatCent, formatHz, formatDb, formatKlarheit, NAMEN)
  - src/audio/pitchAnalysis.ts (berechnePegel, erstelleDetektor, analysiereFrame, FrameAnalyse)
  - src/audio/testSignale.ts (sinus, klavierTon, rauschen, stille; test-only)
  - erstelleFakeRaf() in src/audio/testFakes.ts
  - micStore LiveWerte + live field
  - rAF analysis loop with 15 Hz publish in micController
  - NotenAnzeige component inside the Messkarte section
affects: [02-03, 02-04, 02-05, 02-06]
tech-stack:
  added:
    - pitchy@4.1.0 (+ transitive fft.js@4.0.4)
  patterns:
    - "Detector cached per window size at module level; one Float32Array buffer per controller"
    - "Analysis every animation frame, store writes throttled to 1000/PUBLISH_HZ ms"
    - "Injectable raf/caf/jetzt so tests drive frames with a manual clock"
key-files:
  created:
    - src/audio/noteMath.ts
    - src/audio/noteMath.test.ts
    - src/audio/pitchAnalysis.ts
    - src/audio/pitchAnalysis.test.ts
    - src/audio/testSignale.ts
    - src/components/NotenAnzeige.tsx
  modified:
    - package.json
    - package-lock.json
    - src/audio/micController.ts
    - src/audio/micController.test.ts
    - src/audio/testFakes.ts
    - src/state/micStore.ts
    - src/screens/MicTestScreen.tsx
    - src/screens/MicTestScreen.test.tsx
    - src/components/MicStatusText.tsx
    - src/texte.ts
    - src/styles/tokens.css
decisions:
  - "German note names use sharps (Cis, Dis, Fis, Gis) plus B for pitch class 10 and H for 11; the international line uses ♯ and English B for H"
  - "formatHz uses no thousands grouping (4186,0 Hz rather than 4.186,0 Hz)"
  - "Temporary direct display: a note shows when analysis is valid and db >= GATE_OPEN_DB; plan 03 replaces this with the smoother"
  - "stop() resets live values to MIC_START_ZUSTAND.live in the same setState as the status"
metrics:
  duration: ~12min
  completed: 2026-11-23
  tasks: 3
  files: 17
---

# Phase 2 Plan 02: Gehörten Ton live anzeigen Summary

The test page now shows the detected note live in large type, for example "A4", "Gis4", "B4" (466 Hz) or "H4" (494 Hz). Next to it are the signed cents ("+3 Cent", "−7 Cent" with U+2212), the frequency ("440,3 Hz") and "international: A4". Detection uses pitchy 4.1.0 (MPM) with the runtime sample rate. Analysis runs every animation frame, and the store is updated at most 15 times per second.

## Tasks

| # | Name | Commit |
|---|------|--------|
| 1 | Legitimacy checkpoint for pitchy (blocking-human) | user approved, see below |
| 2a | Install pitchy 4.1.0 (exact pin) | bba8e90 |
| 2b | RED: note math + pitch analysis tests, test signals | 5c151a9 |
| 2c | GREEN: noteMath + pitchAnalysis | 037f20f |
| 3a | RED: live note loop tests + fake rAF | 4431920 |
| 3b | GREEN: rAF loop, LiveWerte, NotenAnzeige, Messkarte, status text | 96732ea |

## Checkpoint: package legitimacy (Task 1)

The user was shown the `npm view` facts: pitchy@4.1.0 is MIT, comes from github.com/ianprime0509/pitchy, has one maintainer, was published 2024-01-04, has no install scripts and only one dependency (fft.js ^4.0.4, MIT, no dependencies, no install scripts).
**User answer: "ok – installieren"** (approved through the session's question dialog). Nothing was installed before that answer.

After installing, the checks matched:
- `npm ls pitchy fft.js` shows `pitchy@4.1.0` and `fft.js@4.0.4`.
- package.json pins `"pitchy": "4.1.0"` with no caret.
- The package-lock integrity for pitchy is `sha512-E8nQ8svBroGSMcc3qu2KvLHIuRYAIfrSkqDKWhjgj3WizseqWQXjQ+Q5t4g1CU73R5Euk+DAinyNFDK+KZw7zA==`, the same value shown to the user.

## Verification

- `npm run lint` is clean. `npm test` passes 9 files and 53 tests. `npm run build` succeeds.
- Real pitchy detects sine tones at C2/C3/C4/A4/C6 at 48 kHz with |cents| ≤ 1, and A4 also at 44.1 kHz.
- Piano-like tones (B 0.0004, fundamental at 0.1, noise 0.01) for C2 to C6 give the correct MIDI note with |cents| ≤ 20.
- Silence and white noise (0.05) both return invalid with midiFloat null. A sine at 0.2 measures −16.99 dBFS.
- Controller with fake rAF: A4 appears after 10 frames. There are at most 16 live publishes in 60 frames. stop cancels the pending frame and resets the live values. Silence shows no note.
- Screen: placeholders `–`, `– Cent`, `– Hz` and `international: –` while idle. A running A4 shows `A4`, `440,0 Hz`, `international: A4` and the status "Mikrofon läuft."
- Acceptance greps: there is no `Math.random` in testSignale and no `minVolumeDecibels` in pitchAnalysis. NotenAnzeige contains no `aria-live`. The detector is created in exactly one place (`holeDetektor`), outside the frame function.

## Deviations from Plan

**1. [Process] pitchy install committed separately**
- Instead of bundling package.json and the lockfile into the RED test commit, they got their own `chore(02-02)` commit (bba8e90), so the approved dependency change can be audited on its own.

**2. [Rule 2 - Hardening] NaN/Infinity guard covers clarity too**
- analysiereFrame treats a non-finite hz or clarity as invalid and reports both as 0. formatDb returns `–` for NaN. This is threat T-02-05.

**3. [Rule 2 - Hardening] Run-number guard in the frame callback**
- A frame callback from an earlier run returns right away if `laufNummer` has changed. A late frame after stop or restart can therefore never publish stale values, even if caf was missed.

## TDD Gate Compliance

- Task 2: RED `test(02-02)` 5c151a9 (modules missing) came before GREEN `feat(02-02)` 037f20f.
- Task 3: RED `test(02-02)` 4431920 (4 tests failing) came before GREEN `feat(02-02)` 96732ea.

## Known Stubs

- `LiveWerte.gehalten` is always `false`. Plan 03 adds hold time and smoothing (PitchSmoother), as the plan intends.
- `live.db` and `live.klarheit` are published but not shown yet. Plan 03 adds the level and clarity bars.

## Threat Flags

None. The only new surface is the npm dependency, and the T-02-SC checkpoint already covers it. Audio is analysed in memory only, with no storage or network.

## Self-Check: PASSED

- All created files exist: noteMath.ts, pitchAnalysis.ts, testSignale.ts, NotenAnzeige.tsx and the tests.
- Commits bba8e90, 5c151a9, 037f20f, 4431920 and 96732ea are present in git log.
