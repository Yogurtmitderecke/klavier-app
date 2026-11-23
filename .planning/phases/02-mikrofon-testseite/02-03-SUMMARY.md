---
phase: 02-mikrofon-testseite
plan: 03
subsystem: audio + mic-test UI
tags: [pitch, smoothing, meters, tuner, MIC-03, MIC-05]
requires: ["02-02"]
provides:
  - "PitchSmoother (gate hysteresis, median, note-change confirmation, octave guard, 400 ms hold)"
  - "PegelBalken generic meter (role=meter)"
  - "CentAnzeige tuner bar with ±10-cent band"
affects: [src/audio/micController.ts, src/screens/MicTestScreen.tsx]
tech-stack:
  added: []
  patterns:
    - "Plain class with explicit private fields and injected jetzt() (erasableSyntaxOnly)"
    - "Every analysed frame goes through smoother.push(); only publishing is throttled to 15 Hz"
key-files:
  created:
    - src/audio/smoothing.ts
    - src/audio/smoothing.test.ts
    - src/components/PegelBalken.tsx
    - src/components/CentAnzeige.tsx
  modified:
    - src/audio/micController.ts
    - src/audio/micController.test.ts
    - src/screens/MicTestScreen.tsx
    - src/screens/MicTestScreen.test.tsx
    - src/texte.ts
    - src/styles/tokens.css
decisions:
  - "Note-change confirmation counts consecutive RAW rounded frames (as in RESEARCH Pattern 3), not the rounded median; the median only provides the displayed midiFloat/cents. Counting on the median would have delayed a C5 to the 5th frame, contradicting the plan's 'third C5 frame' behaviour."
  - "Octave-guard level rise is measured from the last valid frame before the candidate started to the current frame."
  - "Displayed midiFloat = median of ring values that round to the displayed note, so a single octave outlier never shifts cents."
  - "Tuner scale labels are placed at their true positions (0/40/50/60/100 %) with outer labels flush to the edges."
metrics:
  duration: "~10 min"
  completed: 2026-11-23
  tasks: 2
  files: 10
---

# Phase 2 Plan 03: Smoothing, Level/Clarity Meters and Tuner Bar Summary

A held piano A4 now stays "A4" steadily: `PitchSmoother` adds an RMS gate with hysteresis (−60/−66 dBFS), a 5-value median, 3-frame note-change confirmation, a 6-frame octave guard (waived on a ≥ 6 dB level rise) and a 400 ms dimmed hold. The Messkarte also shows a Lautstärke meter, an Erkennungssicherheit meter and a −50…+50-cent tuner bar with a grey ±10-cent band.

## Tasks

| # | Task | Commits |
|---|------|---------|
| 1 | TDD PitchSmoother: a simulated 2.4 s decaying A4 (144 frames, −20 → −50 dBFS, real pitchy) shows A4 on every frame from frame 3 on, with a cents spread ≤ 10 | 6e71991 (RED), a348ff7 (GREEN) |
| 2 | Wire the smoother into micController; add PegelBalken ×2, CentAnzeige, texts and CSS | 8d39f50 (RED), ed7b5c4 (GREEN) |

## Verification

- `npx vitest run src/audio/smoothing.test.ts`: 8/8 pass (held decaying A4, 880 Hz outlier at frame 70, A4→C5 at the 3rd frame, A4→A5 after 6 frames / after 3 when 7 dB louder, gate hysteresis at −63, close at −70, hold ≤ 400 ms then null, never-opened gate, reset)
- `npm run lint && npm test && npm run build`: lint clean, 66/66 tests, build OK
- Acceptance greps: no constructor parameter properties; `role="meter"` and `aria-valuetext` in both components; `--color-meter-band: #4A4E58` and `prefers-reduced-motion` in tokens.css; all three German labels in texte.ts
- D-05: the screen test asserts that no 'Timer', 'Kopieren' or 'Checkliste' text appears. No green/red colours added (the meter fill uses text-secondary, the needle uses the accent colour, the band is neutral grey).

## Deviations from Plan

### Interpretation choices

**1. [Rule 1 - Spec conflict] Candidate counting uses raw frames, not the median**
- **Found during:** Task 1
- **Issue:** The action text says the "rounded median" becomes the candidate. With a 5-value median plus 3-frame confirmation, though, a C5 would only appear at its 5th frame, which contradicts the behaviour "changes to 72 only from the third C5 frame on". RESEARCH Pattern 3 says "3 consecutive valid frames round to a new MIDI number".
- **Fix:** Counted consecutive raw rounded `midiFloat` values. The median ring still drives the displayed `midiFloat` (cents/Hz). On a switch, the ring is filtered to the agreeing values.
- **Commit:** a348ff7

**2. Test for the "≥ 6 dB louder" octave case uses +7 dB**
- I used +7 dB instead of exactly +6 dB so the test doesn't depend on floating-point rounding at the threshold. The implementation threshold is `≥ 6`.

Otherwise the plan was executed as written.

## Known Stubs

None. All meters and the tuner bar are wired to live store values and show '–' / no needle when idle.

## Threat Flags

None. T-02-08 is mitigated: only valid, finite `midiFloat` values enter the ring, meter fills are clamped to [0, 1], and −Infinity dB renders as 0 fill with the text 'sehr leise'. T-02-09 is mitigated: the 15 Hz publish throttle is unchanged, transitions are 66 ms, and reduced motion disables them.

## Self-Check: PASSED

- FOUND: src/audio/smoothing.ts, src/audio/smoothing.test.ts, src/components/PegelBalken.tsx, src/components/CentAnzeige.tsx
- FOUND commits: 6e71991, a348ff7, 8d39f50, ed7b5c4

## TDD Gate Compliance

Both tasks have a `test(...)` RED commit followed by a `feat(...)` GREEN commit.
