---
phase: 2
slug: mikrofon-testseite
status: draft
nyquist_compliant: false
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

To be filled by the planner per task. Requirement → test map from RESEARCH.md:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| MIC-01 | `start()` resumes AudioContext before awaiting gUM; constraints EC/NS/AGC `false`, `video:false` | unit (fakes) | `npx vitest run src/audio/micController.test.ts` | ❌ W0 | ⬜ pending |
| MIC-01 | Error names → German error kinds (verweigert / keinMikrofon / belegt / unsicher / unbekannt) | unit | `npx vitest run src/audio/micErrors.test.ts` | ❌ W0 | ⬜ pending |
| MIC-01 | Tap "Mikrofon starten" → "Mikrofon stoppen"; denial shows German help + "Nochmal versuchen"; no URL change | component | `npx vitest run src/screens/MicTestScreen.test.tsx` | ❌ W0 | ⬜ pending |
| MIC-01 / D-02 / D-03 | Stop button, "‹ Zurück" and unmount stop every track; `stop()` idempotent | component + unit | same | ❌ W0 | ⬜ pending |
| MIC-02 | Note math: 440→A4 0 c; 261.63→C4; 466.16→B4; 493.88→H4; 65.41→C2; 27.5→A0; 4186→C8; cents sign/±50 boundary | unit | `npx vitest run src/audio/noteMath.test.ts` | ❌ W0 | ⬜ pending |
| MIC-02 | `analyzeFrame` on synthetic sine + piano-like signals (C2, C3, C4, A4, C6) → correct MIDI | unit (real pitchy) | `npx vitest run src/audio/pitchAnalysis.test.ts` | ❌ W0 | ⬜ pending |
| MIC-03 | RMS/dBFS correct; noise and silence → `valid:false` | unit | same | ❌ W0 | ⬜ pending |
| MIC-04 | Diagnostics render sampleRate, EC "aus", NS/AGC "nicht gemeldet", ctx state, Startart | component | `npx vitest run src/components/DiagnosePanel.test.tsx` | ❌ W0 | ⬜ pending |
| MIC-05 | 2.4 s simulated decaying A4 through analysis + smoother → A4 every frame after warm-up; cents spread ≤ 10; one octave outlier ignored | unit | `npx vitest run src/audio/smoothing.test.ts` | ❌ W0 | ⬜ pending |

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
