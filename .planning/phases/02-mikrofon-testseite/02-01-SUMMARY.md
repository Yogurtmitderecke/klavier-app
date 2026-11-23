---
phase: 02-mikrofon-testseite
plan: 01
subsystem: audio-capture
tags: [web-audio, getUserMedia, zustand, ios-safari, tdd]
requires: []
provides:
  - PitchSource interface (src/audio/pitchSource.ts)
  - AnalyserPitchSource (getUserMedia -> MediaStreamSource -> Analyser(4096) -> Gain(0) -> destination)
  - shared AudioContext singleton holeAudioKontext()
  - micController (erstelleMicController / holeMicController / setzeMicController)
  - micStore (MicStatus, MIC_START_ZUSTAND, useMicStore)
  - phase constants in src/audio/einstellungen.ts
  - MicTestScreen with MicToggleButton + MicStatusText
  - test fakes erstelleFakeAudio() for jsdom
affects: [02-02, 02-03, 02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns:
    - "Injectable audio deps (mediaDevices, holeKontext) so tests use fakes, no global patching"
    - "startNummer/laufNummer counters make stop() invalidate a pending start (late stream released)"
    - "Store holds plain status data only; audio objects live in the source/controller"
key-files:
  created:
    - src/audio/einstellungen.ts
    - src/audio/pitchSource.ts
    - src/audio/audioKontext.ts
    - src/audio/analyserPitchSource.ts
    - src/audio/micController.ts
    - src/audio/testFakes.ts
    - src/audio/micController.test.ts
    - src/state/micStore.ts
    - src/screens/MicTestScreen.tsx
    - src/screens/MicTestScreen.test.tsx
    - src/components/MicToggleButton.tsx
    - src/components/MicStatusText.tsx
  modified:
    - src/state/appStore.ts
    - src/App.tsx
    - src/App.test.tsx
    - src/screens/OverviewScreen.tsx
    - src/texte.ts
    - src/styles/tokens.css
  deleted:
    - src/screens/MicPlaceholderScreen.tsx
decisions:
  - "ctx.resume() is called synchronously inside start() before awaiting getUserMedia; resume is retried once after the stream arrives if the context is still not running"
  - "stop() also disconnects the silent gain node and keeps the ctx reference (sampleRate/kontextStatus stay readable after stop)"
  - "A stop() during start (Zurück while the permission prompt is open) leaves status as set by stop ('idle'), and the late stream's tracks are stopped without wiring the graph"
metrics:
  duration: ~10min
  completed: 2026-11-23
  tasks: 3
  files: 19
---

# Phase 2 Plan 01: Mikrofon starten/stoppen Summary

One tap on "Mikrofon starten" resumes the single shared AudioContext and then opens the mic with echoCancellation, noiseSuppression and autoGainControl all off. Capture runs through an AnalyserPitchSource (fftSize 4096) behind the `PitchSource` interface. One toggle button and a live status text drive it, and both "Mikrofon stoppen" and "‹ Zurück" fully release the mic.

## Tasks

| # | Name | Commit |
|---|------|--------|
| 1 | RED: failing tests for the start/stop slice (fakes, no real audio) | e31362e |
| 2 | GREEN audio: constants, PitchSource, AudioContext, AnalyserPitchSource, micController, micStore | c94166f |
| 3 | GREEN UI: MicTestScreen, toggle, status, screen rename, placeholder and badge removed | 31e5e26 |

## Verification

- `npm run lint`: clean
- `npm test`: 7 files, 22 tests pass. The tests cover resume-before-gUM ordering, the exact constraints, graph wiring, idempotent stop without close(), release of a late stream, NotAllowedError details, UI toggle, release on unmount, unchanged href, and that opening the page never calls getUserMedia
- `npm run build`: succeeds
- Acceptance greps: no `close()` call in analyserPitchSource, no `44100`, no `enum`, no `await` in MicToggleButton, no `badge` in OverviewScreen, no `mic-placeholder` / `mikrofonPlatzhalter` left

## Deviations from Plan

### Minor adjustments

**1. [Rule 2 - Hardening] Silent gain node is disconnected on stop**
- The plan only named `source.disconnect()`. The source now also disconnects the Gain(0) node, so no orphaned graph is left between start/stop cycles.
- Commit: c94166f

**2. Comment wording in MicToggleButton**
- The acceptance criterion forbids the string `await` anywhere in the file, so the German comment now says "nichts Asynchrones davor" instead.
- Commit: 31e5e26

**3. App.test also installs a fake controller**
- App.test uses `setzeMicController` with fakes and asserts that `getUserMedia` is never called when the page opens or when the user leaves via Zurück (threat T-02-02).
- Commit: e31362e

## TDD Gate Compliance

The RED commit `test(02-01)` (e31362e) comes before the GREEN commits `feat(02-01)` (c94166f, 31e5e26). The RED run failed because the modules did not exist yet.

## Known Stubs

- `MicStatusText` always shows `laeuftOhneTon` while running. `laeuftMitTon` is defined in texte.ts but not used until the pitch display (plan 02) exists. This is intentional per the plan.
- `MicToggleButton` returns null for status `'unsicher'`. Plan 04 fills in the insecure-context handling.

## Threat Flags

None. No new surface beyond the plan's threat model, and src/audio contains no network or storage code.

## Self-Check: PASSED

- All created files exist, and MicPlaceholderScreen.tsx was removed
- Commits e31362e, c94166f and 31e5e26 are present in git log
