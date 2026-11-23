---
phase: 2
slug: mikrofon-testseite
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-11-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.1.1 + jsdom 31.0.1 + @testing-library/react 16.3.3 (already installed) |
| **Config file** | `vite.config.ts` → `test: { environment: 'jsdom' }` (exists) |
| **Quick run command** | `npx vitest run src/audio` (or the touched test file) |
| **Full suite command** | `npm run lint && npm test && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/audio` (or the touched test file)
- **After every plan wave:** Run `npm run lint && npm test && npm run build`
- **Before `/gsd:verify-work`:** Full suite green locally and in GitHub Actions, deploy visible on the iPad, both checklist passes (Safari tab + home screen) reported by the user
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

Filled from the plans' `<automated>` verify commands (all prefixed with `cd C:/Users/konra/Documents/Claude/klavier-app &&`). Full gate = `npm run lint && npm test && npm run build`.

| Task ID | Plan | Wave | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|----------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | MIC-01 | RED: start/stop tests fail before implementation | unit + component (fakes) | `! npx vitest run src/audio/micController.test.ts src/screens/MicTestScreen.test.tsx` (must fail) | ❌ W0 (created by this task) | ⬜ pending |
| 02-01-T2 | 01 | 1 | MIC-01 | ctx.resume() before gUM; EC/NS/AGC false, video false; stop() idempotent | unit (fakes) | `npx vitest run src/audio/micController.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-T3 | 01 | 1 | MIC-01 / D-02 / D-03 | Toggle "Mikrofon starten" ↔ "Mikrofon stoppen"; Zurück/unmount stop tracks; no URL change | component | full gate | ❌ W0 | ⬜ pending |
| 02-02-T1 | 02 | 2 | MIC-02 | pitchy legitimacy (human checkpoint) | registry check | `npm view pitchy@4.1.0 version \| grep -q '^4.1.0$'` | n/a | ⬜ pending |
| 02-02-T2 | 02 | 2 | MIC-02 / MIC-03 | Note math (A4, C4, B4/H4, C2, A0, C8, cents boundary); analyzeFrame on synthetic C2–C6; RMS/dBFS correct, noise and silence → valid:false | unit (real pitchy) | `npm ls pitchy fft.js \| grep -q 'pitchy@4.1.0' && npx vitest run src/audio/noteMath.test.ts src/audio/pitchAnalysis.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-T3 | 02 | 2 | MIC-02 | Live note display, rAF loop, 15 Hz publish | component | full gate | ✅ (from 02-01) | ⬜ pending |
| 02-03-T1 | 03 | 3 | MIC-05 / MIC-03 | 2.4 s decaying A4 → A4 every frame after warm-up; cents spread ≤ 10; one octave outlier ignored | unit | `npx vitest run src/audio/smoothing.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-T2 | 03 | 3 | MIC-03 / MIC-05 | Level, clarity, tuner bar wired to smoother | component | full gate | ✅ | ⬜ pending |
| 02-04-T1 | 04 | 4 | MIC-01 | Error names → verweigert / keinMikrofon / belegt / unsicher / unbekannt; launch mode | unit | `npx vitest run src/audio/micErrors.test.ts src/lib/startart.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-T2 | 04 | 4 | MIC-01 / D-03 | German error box + retry, insecure path, hints, background/pagehide stop | unit + component | full gate | ✅ | ⬜ pending |
| 02-05-T1 | 05 | 5 | MIC-04 | Diagnostics rows: sampleRate, EC "aus", NS/AGC "nicht gemeldet", ctx state, Startart | unit + component | `npx vitest run src/audio/diagnoseZeilen.test.ts src/components/DiagnosePanel.test.tsx` | ❌ W0 | ⬜ pending |
| 02-05-T2 | 05 | 5 | MIC-04 | Live diagnostics collected and shown | component | full gate | ✅ | ⬜ pending |
| 02-06-T1 | 06 | 6 | all | Release 0.3.0 deployed; live bundle contains version, commit, "Mikrofon stoppen" | deploy check | `grep -q '"version": "0.3.0"' package.json && … curl live bundle …` (see plan 02-06) | n/a | ⬜ pending |
| 02-06-T2 | 06 | 6 | MIC-01…05 | Piano checklist, Safari tab (human) | manual + regression | `npx vitest run src/audio src/screens/MicTestScreen.test.tsx` | ✅ | ⬜ pending |
| 02-06-T3 | 06 | 6 | SC 5 | Piano checklist, home screen (human); result recorded | manual + doc check | `grep -q "Klavier-Test" .planning/STATE.md` | ✅ | ⬜ pending |

Sampling continuity: every auto task has an automated command; no 3 consecutive tasks lack one.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/audio/testSignale.ts` — deterministic synthetic signal generator (no `Math.random`)
- [ ] `src/audio/testFakes.ts` — shared fake AudioContext / mediaDevices / tracks
- [ ] `src/audio/noteMath.test.ts`, `pitchAnalysis.test.ts`, `smoothing.test.ts`, `micErrors.test.ts`, `micController.test.ts`
- [ ] `src/screens/MicTestScreen.test.tsx`, `src/components/DiagnosePanel.test.tsx`
- [ ] Update `src/App.test.tsx` (placeholder text and "kommt bald" badge on the Mikrofon-Test tile)
- No framework install needed (pitchy is a runtime dependency, gated by a human legitimacy checkpoint).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mic starts in iPad Safari after permission prompt | MIC-01 | Needs real iPad + permission UI | Tap "Mikrofon starten" on the live HTTPS site |
| Correct notes C2, C3, C4, C6; fast sequence | MIC-02, MIC-03 | Needs real acoustic piano + iPad mic | German checklist in the human-verify checkpoint |
| Held A4 stays "A4" ≥ 2 s, cents stable | MIC-05 | Real piano decay/inharmonicity | Hold A4, read note + cents for ≥ 2 s |
| Diagnostics plausible on device (sample rate, EC aus, Startart) | MIC-04 | Real WebKit behaviour | Read diagnostics panel |
| Same checklist from home-screen icon | SC 5 | Standalone mode behaviour | Add to home screen, repeat checklist |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
