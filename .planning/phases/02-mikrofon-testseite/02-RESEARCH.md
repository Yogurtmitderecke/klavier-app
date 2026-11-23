# Phase 2: Mikrofon-Testseite - Research

**Researched:** 2026-11-23
**Domain:** Browser microphone capture on iPadOS 26 Safari (Web Audio, getUserMedia), monophonic pitch detection (pitchy/MPM) for an acoustic piano, live diagnostics UI in React 19
**Confidence:** MEDIUM-HIGH for the code and library facts; MEDIUM for iPad-specific behaviour, which only the piano test on the device can confirm

## Summary

This phase replaces the `MicPlaceholderScreen` with a real test page. One tap on "Mikrofon starten" creates and resumes a single `AudioContext` inside the tap, requests the mic with voice processing turned off, and runs `MediaStreamAudioSourceNode → AnalyserNode(fftSize 4096)`. A `requestAnimationFrame` loop reads it, and pitchy 4.1.0 (McLeod Pitch Method) analyses each frame. On top of pitchy sit our own layers: an RMS gate with hysteresis, a frequency-range gate, a clarity threshold, median smoothing and a light octave-jump guard. The page shows the German note name with octave, cents, a level bar, clarity and an always-visible diagnostics panel. Stop, Zurück and unmount all stop every track.

I ran pitchy against synthetic piano-like signals in this session (48 kHz, real pitchy 4.1.0 code). **A 4096-sample window (85 ms) is already enough for C2 and even A0**, including when the fundamental is very weak or missing. So 8192 is not needed for the checklist. Keep the window size as one configurable constant, because it is the first improvement lever if D-07 applies. The more important finding is that **piano inharmonicity biases MPM sharp**. The bias is +2 to +4 cents when the upper partials are weak, but reaches +13 to +25 cents when they are strong (B = 0.0003–0.0006, 1/k spectrum). So the A4 reading can drift a few cents while the bright attack decays. And a piano that is simply not at 440 Hz reads off-centre even when detection is perfect. The plan should define the A4 criterion as stability (spread) plus a recorded absolute value. Absolute tuning offset belongs to Phase 3 calibration.

MDN browser-compat-data says Safari (including iOS) supports **only `echoCancellation`** among the voice-processing constraints. `autoGainControl` and `noiseSuppression` are listed as `version_added: false` for both `applyConstraints` and `getSupportedConstraints`. Expect `getSettings()` on the iPad to report `echoCancellation: false` and leave the other two **undefined**. The diagnostics panel must show that as "nicht gemeldet" ("not reported"), not as a failure. Still send all three constraints as `false`, because they are harmless if ignored. Another directly relevant finding: WebKit bug 319706 reports getUserMedia failing with `NotAllowedError: No AVAudioSessionCaptureDevice` **on iOS 26.5.2**, the user's exact version, even when permission was granted. Reloading does not help; quitting Safari completely or restarting the iPad does. The German "Zugriff verweigert" ("access denied") message must therefore include "Safari ganz schließen / iPad neu starten" ("quit Safari completely / restart the iPad") as a step.

**Primary recommendation:** Split the work into pure, unit-testable modules (`noteMath`, `pitchAnalysis`, `smoothing`, `micErrors`) plus one injectable `AnalyserPitchSource` behind a `PitchSource` interface, and keep a small Zustand `micStore` for UI state. Test everything with synthetic signals and fake `mediaDevices`/`AudioContext` in jsdom. Add pitchy 4.1.0 only after a blocking human legitimacy checkpoint. End with the two-pass piano checklist (Safari tab, then home screen).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Mikrofon-Start
- **D-01:** The microphone permission is requested **only** by a large **"Mikrofon starten"** button on the test page. The welcome screen's "Start" button stays as it is (no mic, no AudioContext). This **supersedes Phase 1 D-02** (which anticipated the mic request on the welcome Start tap). The AudioContext should still be created/resumed inside that same user tap (iOS gesture requirement).
- **D-02:** The button is a **Start/Stop toggle**: "Mikrofon starten" ↔ "Mikrofon stoppen". Stopping releases the mic (all MediaStream tracks stopped, so the iOS mic indicator disappears).
- **D-03:** Leaving the test page via **"‹ Zurück" stops the microphone**. On the next visit, the user taps "Mikrofon starten" again. (Keeps Phase 1 rules: no URL/hash change, Zurück top-left, nothing important at the bottom edge.)

#### Test am Klavier
- **D-04:** The device test uses a **fixed German checklist** given by Claude in the plan's human-verify checkpoint (e.g. C2, C3, C4, held A4 ≥ 2 s at ~440 Hz ±10 cents, a high note around C6, a short fast note sequence). The user plays each item and reports in chat what the page showed.
- **D-05:** The app does **not** add test helpers (no hold timer, no copy button, no in-app checklist). The page only shows the live values; results are reported in chat.
- **D-06:** The checklist is run **twice**: once in a **Safari tab** and once **from the home-screen icon**. The plan includes a short German how-to for adding the app to the home screen (Share button → "Zum Home-Bildschirm").
- **D-07:** If the piano test shows the detection is not good enough (e.g. wrong low notes, unstable A4), **we stay in Phase 2 and improve** (e.g. A/B against YIN/pitchfinder, longer analysis window for the low register) until the checklist passes. Phase 3 only starts after a pass.

### Claude's Discretion
- **Mic failure / denial handling:** user said "entscheide du". Leaning: clear German message on the test page explaining what went wrong, a short step-by-step for re-enabling the mic permission in Safari, and a "Nochmal versuchen" button. Must also cover "not a secure context" and "no mic available".
- **Note display:** user did not discuss. Claude decides naming (German convention, e.g. H instead of B; sharps vs. flats), octave notation (scientific, e.g. "A4", matches the roadmap's C2/C3/A4 wording), cent display (number and/or tuner-style indicator), sizes readable at ~60 cm.
- **Diagnostics panel:** user did not discuss. Claude decides layout (always visible vs. collapsible); must show sample rate, applied mic settings from `getSettings()` (echoCancellation / noiseSuppression / autoGainControl expected false), AudioContext state, and enough to diagnose iPad problems (MIC-04). Readable without remote debugging (no Mac available).
- Technical pipeline per CLAUDE.md stack: pitchy (MPM), AnalyserNode fftSize 4096 via rAF behind a `PitchSource` interface, voice processing off, RMS gate + clarity threshold + smoothing. Researcher should check window length for low notes and `getSettings()` behaviour on iPad Safari.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

(Also explicitly out of scope per CONTEXT domain: onset/keystroke log (MIC-06), calibration (Phase 3), wait mode, falling notes.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIC-01 | Start the mic with one tap (works in iPad Safari) | Tap sequence: sync `new AudioContext()` + `resume()`, then `getUserMedia` with explicit constraints (Pattern 1). Error taxonomy with German texts (Pattern 5). Secure-context check reused from `src/lib/secureContext.ts`. iOS 26.5.2 NotAllowedError bug (Pitfall 4). |
| MIC-02 | Live note name + octave and cents | `noteMath.ts` (German names, scientific octave, cents in [−50, +50)), pitchy `findPitch`, median smoothing (Patterns 2–4). Synthetic-signal experiment results (Code Examples). |
| MIC-03 | Live level and clarity | RMS → dBFS computed by us, not via pitchy's `minVolumeDecibels` (Pitfall 6). Clarity = pitchy's second return value; shown raw. |
| MIC-04 | Diagnostics: sample rate, mic settings, audio status | `ctx.sampleRate`, `track.getSettings()` (EC only reported on Safari, Pitfall 2), `getSupportedConstraints()`, `ctx.state` incl. WebKit `interrupted`, track `readyState`/`muted`/`label`, `navigator.audioSession?.type`, launch mode (Safari tab vs home screen), dead-signal detector (Pattern 6). |
| MIC-05 | Held tone stable ≥ 2 s (voice filters off) | Constraints off; RMS gate with hysteresis; median + octave-jump guard + hold time; testable via a simulated 2.4 s decaying-A4 frame sequence (Validation). Inharmonicity drift caveat (Pitfall 1). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack is fixed: React 19.3 + TypeScript ~7.0 + Vite 8; oxlint (no typescript-eslint); Vitest; Zustand 5.1.
- Pitch detection: **pitchy 4.1.0** (MPM). Raw mic samples with **echoCancellation/noiseSuppression/autoGainControl all `false`**. Add our own RMS gate, clarity threshold, median smoothing and octave-error correction on top.
- Capture: `getUserMedia → MediaStreamAudioSourceNode → AnalyserNode (fftSize 4096)` polled per rAF, **behind a `PitchSource` interface**. AudioWorklet only if measurements show the need. **Never ScriptProcessorNode.**
- **Never hard-code 44100.** Use `audioContext.sampleRate` at runtime.
- **One shared AudioContext**, created/resumed on a user tap (later phases share it with Tone.js).
- **No hash routing, no URL changes**: switch screens through Zustand state only.
- Storage only local. Not needed in this phase: nothing is persisted.
- Must work in iPad Safari (and the home-screen app). HTTPS is required (GitHub Pages).
- Only free/own content; nothing from flowkey.
- GSD workflow: file edits only via GSD commands (the planner/executor handle this).
- `tsconfig.app.json`: `erasableSyntaxOnly` (**no `enum`, no class parameter properties**), `verbatimModuleSyntax` (use `import type`), `noUnusedLocals/Parameters`.
- Established conventions: all UI strings in `src/texte.ts` (German, informal "du", „…“ quotes, real en dash); design tokens in `src/styles/tokens.css`; TDD (RED commit before GREEN); `<StrictMode>` is on in `main.tsx`, so effects run mount→cleanup→mount in dev.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mic permission + capture (getUserMedia, AudioContext) | Browser / Client (`src/audio/analyserPitchSource.ts`) | — | Static site, no server. Everything runs in Safari |
| Pitch analysis (pitchy, RMS, gates) | Browser / Client, pure TS module (`src/audio/pitchAnalysis.ts`) | — | Pure functions over `Float32Array`, so they are unit-testable without a mic |
| Smoothing / stability / octave guard | Browser / Client, pure TS (`src/audio/smoothing.ts`) | — | Stateful but deterministic, testable with frame sequences |
| Note naming + cents | Browser / Client, pure TS (`src/audio/noteMath.ts`) | — | Pure math |
| Run loop (rAF) + publishing to UI | Browser / Client (`src/audio/micController.ts`) | Zustand store | Keeps audio objects out of React state |
| UI state (status, error kind, live values, diagnostics) | Zustand `micStore` | React components | Fast reads outside React; screen switching already in `appStore` |
| Rendering test page | React (`MicTestScreen` + small display components) | CSS tokens | Presentation only |
| HTTPS / secure context | CDN / Static (GitHub Pages) | Client check `isSecureContext` | Already done in Phase 1 |
| Persistence | — (none this phase) | — | Calibration and storage come in Phase 3 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pitchy | 4.1.0 (published 2024-01-04, MIT, ESM-only, ships `index.d.ts`) | MPM pitch detection: `PitchDetector.forFloat32Array(n).findPitch(buf, sr) → [hz, clarity]` | Prescribed by CLAUDE.md. Inspected in this session: default clarity threshold k = 0.9, returns `[0, 0]` for silence or no key maxima [VERIFIED: npm registry + package source] |
| fft.js | 4.0.4 (transitive via pitchy) | FFT used internally by pitchy | Not imported directly in this phase [VERIFIED: npm registry] |
| Web Audio API + MediaDevices (native) | iPadOS 26 Safari | Capture/analysis | `AudioContext` (iOS 14.5+), `AnalyserNode.getFloatTimeDomainData` (iOS 14.5+), `getUserMedia`/`getSettings` (iOS 11+), `navigator.audioSession` (iOS 16.4+) [VERIFIED: @mdn/browser-compat-data 8.1.10] |
| zustand | 5.1.0 (already installed) | `micStore` | Already in the project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pitchfinder | 2.3.4 | YIN A/B comparison | **Only** if the piano test fails (D-07 loop). Do not install in the first plan [VERIFIED: npm registry, version only] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AnalyserNode + rAF | AudioWorklet | Every sample, no main-thread gaps, but more complexity, Vite worklet bundling and WebKit worklet capture bug 244203. Not needed for a test page |
| pitchy MPM | pitchfinder YIN | D-07 lever only |
| 4096 window | 8192 window | Only if real low notes fail. Synthetic tests show 4096 handles A0–C2 |

**Installation:**
```bash
npm install pitchy@4.1.0 --save-exact
```
(Pin it exactly, since the package is finished and a silent future major would be unwelcome.)

## Package Legitimacy Audit

slopcheck could **not** be run: there is no Python on this machine (`python` is only the Microsoft Store alias, and `pip` is missing). Per protocol, the new package is tagged `[ASSUMED]` for legitimacy and gated behind a human checkpoint, the same pattern as Phase 1.

| Package | Registry | Age | Downloads | Source Repo | Postinstall | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-------------|-----------|-------------|
| pitchy | npm | created 2018-02-12; 4.1.0 from 2024-01-04 | 54,180 / week (2026-11-16..22) | github.com/ianprime0509/pitchy (single maintainer ianprime0509) | none (only build/test/prepack scripts) | not run | Approved [ASSUMED]: named in CLAUDE.md. **Planner: add `checkpoint:human-verify` before `npm install`** |
| fft.js (transitive) | npm | created 2017-03-02; 4.0.4 | 921,123 / week | github.com/indutny/fft.js | none | not run | Approved [ASSUMED] (comes with pitchy) |

**Packages removed due to [SLOP]:** none. **Flagged [SUS]:** none.
The human-verify checkpoint should show the user, in German: the npm page https://www.npmjs.com/package/pitchy, the GitHub repo link, the weekly downloads, and "keine Installations-Skripte" ("no install scripts"), and ask for "ok". After install, `npm ls pitchy fft.js` must show exactly 4.1.0 and 4.0.4.

## Architecture Patterns

### System Architecture Diagram

```
 [Tap "Mikrofon starten"] ──► micController.start()
        │  (synchronously inside the tap)
        ├─► getOrCreateAudioContext()  ──► ctx.resume()   (no await before this!)
        ├─► isSecureContext? / mediaDevices present? ──no──► error kind "unsicher"
        └─► await getUserMedia({audio:{EC/NS/AGC:false, channelCount:1}})
                 │ reject ─► classifyMicError(err) ─► micStore.status='fehler' ─► German message + "Nochmal versuchen"
                 ▼ resolve
       MediaStream ─► ctx.createMediaStreamSource ─► AnalyserNode(fftSize 4096) ─► Gain(0) ─► ctx.destination
                 │                                        │
                 │ track.getSettings(), label,            │ every rAF: getFloatTimeDomainData(buf)
                 │ getSupportedConstraints()              ▼
                 ▼                               analyzeFrame(buf, ctx.sampleRate)
        diagnostics snapshot                     ├─ RMS → dBFS (level)
                                                 ├─ gate: RMS hysteresis? ──closed──► "kein Ton"
                                                 ├─ pitchy.findPitch → [hz, clarity]
                                                 ├─ range gate 26–4400 Hz, clarity ≥ threshold
                                                 ▼
                                         PitchSmoother.push(frame)
                                         ├─ median(midiFloat, last 5)
                                         ├─ note change needs 3 agreeing frames; ±12 jumps need 6 (octave guard)
                                         └─ hold last note 400 ms after gate closes, then "–"
                                                 ▼
                              micStore.set(...) throttled to ~15 Hz ──► React: NoteDisplay / CentsMeter /
                                                                         LevelBar / ClarityBar / DiagnosticsPanel
 [Tap "Mikrofon stoppen" | "‹ Zurück" | unmount | pagehide] ──► micController.stop():
        cancel rAF, source.disconnect(), all tracks.stop(), ctx.suspend()  (idempotent)
```

### Recommended Project Structure
```
src/
├── audio/
│   ├── einstellungen.ts        # constants: FFT_SIZE=4096, CLARITY_MIN, GATE_OPEN_DB, GATE_CLOSE_DB, MEDIAN_N, HOLD_MS, FREQ_MIN/MAX
│   ├── noteMath.ts (+ .test)   # hzToMidiFloat, midiToNote (German names), cents, German number formatting
│   ├── pitchAnalysis.ts (+ .test)  # analyzeFrame(buf, sr, detector) → {rms, db, hz, clarity, valid}
│   ├── smoothing.ts (+ .test)  # PitchSmoother class (no parameter properties!)
│   ├── micErrors.ts (+ .test)  # classifyMicError(err) → MicFehlerArt
│   ├── pitchSource.ts          # interface PitchSource + types (Diagnose, Frame)
│   ├── analyserPitchSource.ts (+ .test)  # real impl with injectable deps (mediaDevices, AudioContext ctor)
│   ├── micController.ts (+ .test)        # rAF loop, throttled publish, start/stop orchestration
│   └── testSignale.ts          # synthetic sine / piano-like generator (used only by tests)
├── state/micStore.ts           # Zustand: status, fehler, live values, diagnose
├── screens/MicTestScreen.tsx (+ .test)   # replaces MicPlaceholderScreen
└── components/ NotenAnzeige.tsx, CentAnzeige.tsx, PegelBalken.tsx, DiagnosePanel.tsx, MicFehler.tsx
```
Rename `Screen` `'mic-placeholder'` → `'mic-test'` (optional, recommended). Remove the "kommt bald" badge from the Mikrofon-Test tile (`badge` prop in `OverviewScreen.tsx`), and update `App.test.tsx`'s placeholder test, which asserts the old placeholder text.

### Pattern 1: Start sequence inside the tap (MIC-01)
**What:** Create and resume the AudioContext **synchronously** in the click handler before any `await`, then request the mic.
**Why:** iOS requires a user gesture for `resume()`. User activation may expire while the permission prompt is open (the user can take seconds). BCD notes: "New audio contexts are suspended until resume() is called via user action" [VERIFIED: BCD AudioContext note].
```typescript
// Sketch – deps injected so tests can pass fakes
async start(): Promise<void> {
  if (!this.deps.isSecureContext() || !this.deps.mediaDevices?.getUserMedia) throw fehler('unsicher')
  const ctx = this.getOrCreateContext()            // new AudioContext({ latencyHint: 'interactive' }) – NO sampleRate option
  const resumed = ctx.resume()                     // started synchronously in the gesture
  const stream = await this.deps.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    video: false,
  })
  await resumed.catch(() => {})
  if (ctx.state !== 'running') await ctx.resume().catch(() => {}) // 2nd try: capture is now active
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser(); analyser.fftSize = FFT_SIZE
  const silent = ctx.createGain(); silent.gain.value = 0
  source.connect(analyser); analyser.connect(silent); silent.connect(ctx.destination)
}
```
- Use plain `false` values, **not** `{ exact: false }`. Unsupported constraints are ignored, and `exact` invites `OverconstrainedError` [ASSUMED: standard MediaStream constraint semantics].
- Connecting via `Gain(0)` to `destination` keeps the graph "pulled" on all engines without audible feedback. Whether WebKit needs it is unconfirmed, but it is cheap insurance [ASSUMED].
- If `ctx.state` is still not `'running'` after the second resume, show the status in the diagnostics and the German hint "Tippe noch einmal auf „Mikrofon starten“" ("Tap 'Mikrofon starten' again").

### Pattern 2: Pure frame analysis (MIC-02, MIC-03)
```typescript
import { PitchDetector } from 'pitchy'
const detector = PitchDetector.forFloat32Array(FFT_SIZE) // create ONCE; input length must equal FFT_SIZE
// leave detector.minVolumeDecibels untouched (see Pitfall 6) – our own RMS gate is authoritative
export function analyzeFrame(buf: Float32Array, sampleRate: number, d = detector) {
  let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  const rms = Math.sqrt(sum / buf.length)
  const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity
  const [hz, clarity] = d.findPitch(buf, sampleRate)
  const valid = hz >= FREQ_MIN && hz <= FREQ_MAX && clarity >= CLARITY_MIN
  return { rms, db, hz, clarity, valid }
}
```
Recommended starting constants (all in `einstellungen.ts`, all shown live so the piano test produces real numbers for Phase 3):
| Constant | Start value | Reason |
|----------|-------------|--------|
| `FFT_SIZE` | 4096 | 85 ms at 48 kHz. Synthetic tests detect A0–C8 correctly (C8 with a weak fundamental gives a sub-octave error, irrelevant here) |
| `FREQ_MIN` / `FREQ_MAX` | 26 Hz / 4400 Hz | Piano range A0 27.5 Hz … C8 4186 Hz. Pure noise gave `[11.7 Hz, clarity 0.835]` in the experiment, which the range gate rejects |
| `CLARITY_MIN` | 0.9 | Noise reached 0.835. Bright synthetic piano tones were 0.92–1.0. Lower to 0.85 if the piano test shows dropouts (D-07 lever). Always display the raw clarity |
| `GATE_OPEN_DB` / `GATE_CLOSE_DB` | −60 / −66 dBFS | Hysteresis prevents flicker while a held note decays. Real values are unknown until the piano test, so the level bar shows dBFS [ASSUMED values] |
| `MEDIAN_N` | 5 frames (~83 ms at 60 fps) | Removes single-frame outliers |
| `HOLD_MS` | 400 | Keeps the last note visible (dimmed) briefly after the gate closes |

### Pattern 3: Smoothing + octave guard (MIC-05)
- Keep a ring of the last `MEDIAN_N` valid `midiFloat` values. The displayed value is their median. Cents are `(median − round(median)) × 100`.
- The displayed note changes only after **3 consecutive** valid frames round to a new MIDI number. If the new number differs from the current one by **exactly ±12**, require **6** frames, unless the level rose by ≥ 6 dB (a likely new key press). This is the light "octave-error correction" for blind detection. Expected-note checking comes in later phases.
- Invalid frames do not clear the note immediately. After `HOLD_MS` without valid frames, show "–".
- Write it as a plain class with explicit fields (`erasableSyntaxOnly` forbids constructor parameter properties). Inject `now()` for tests.

### Pattern 4: German note naming + cents (MIC-02)
```typescript
// Scientific octave (C4 = middle C = MIDI 60, A4 = MIDI 69). German pitch-class names, sharps.
const NAMEN = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'] as const
export const hzToMidiFloat = (hz: number, a4 = 440) => 69 + 12 * Math.log2(hz / a4)
export function midiToNote(midiFloat: number) {
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)          // −50 … +50
  const name = NAMEN[((midi % 12) + 12) % 12]
  const oktave = Math.floor(midi / 12) - 1
  return { midi, name, oktave, cents, label: `${name}${oktave}` }
}
```
- German convention: **H** = B natural (MIDI 71 is "H4") and **B** = B♭ (MIDI 70 is "B4"). Use sharps (Cis/Dis/Fis/Gis), but use "B" rather than "Ais" for pitch class 10, as German musicians say [ASSUMED: common usage]. To avoid any "B" ambiguity, show a small secondary line with frequency and the international name, e.g. `A4 · 440,3 Hz`.
- The `a4` parameter is in the signature now (default 440), so Phase 3 calibration only has to pass a value.
- German number formatting: `new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })` for Hz (`440,3 Hz`). Cents as signed integers with a real minus sign: `+3 Cent`, `−7 Cent` (U+2212).
- Cents display: a big number plus a horizontal tuner bar from −50 to +50 with a centre mark and a visible ±10-cent band (this directly supports the A4 check). Exact sizes and colours belong to the Phase 2 UI-SPEC. Note: Phase 1 tokens only have 20/24/32/56 px, so a note display readable at 60 cm needs a new, larger "Anzeige" size (e.g. ~120 px), and the UI-SPEC must declare it.

### Pattern 5: Error taxonomy (Claude's discretion)
| Detected | Kind (`MicFehlerArt`) | German message gist | Action |
|----------|----------------------|---------------------|--------|
| `isSecureContext === false` or `navigator.mediaDevices` undefined | `unsicher` | Reuse Phase 1 warning text + `SECURE_URL` link | Link to HTTPS address |
| `NotAllowedError`, `SecurityError` | `verweigert` | "Die App darf das Mikrofon nicht benutzen." ("The app isn't allowed to use the microphone.") Steps: (1) in Safari, open the page menu (the icon left of or in the address field) → "Website-Einstellungen" → Mikrofon → "Erlauben" or "Fragen"; (2) or Einstellungen → Apps → Safari → Mikrofon → "Fragen"; (3) **if that doesn't help: quit Safari completely (swipe it away in the app switcher) or restart the iPad** (iOS 26 bug 319706) | "Nochmal versuchen" |
| `NotFoundError`, `OverconstrainedError` | `keinMikrofon` | "Es wurde kein Mikrofon gefunden." ("No microphone was found.") | "Nochmal versuchen" |
| `NotReadableError`, `AbortError` | `belegt` | "Das Mikrofon wird gerade von einer anderen App benutzt (z. B. Telefonat, FaceTime, Sprachmemos)." ("Another app is using the microphone right now, e.g. a call, FaceTime or Voice Memos.") Close it, then try again | "Nochmal versuchen" |
| `InvalidStateError` or anything else | `unbekannt` | Generic message; show `err.name: err.message` in the diagnostics | "Nochmal versuchen" |
| Running, but samples are all exactly 0 for > 1.5 s | warning `keinSignal` (not fatal) | "Das Mikrofon liefert keine Daten. Kopfhörer/AirPods trennen und neu starten." ("The microphone isn't delivering any data. Disconnect headphones/AirPods and start again.") | Shown in diagnostics |

The exact Safari menu wording on iPadOS 26 is **[ASSUMED]**: no official Apple page found. Have the user confirm or correct it during the piano checkpoint (and, if possible, provoke the denied state once in a private tab). Keep the instruction text short and put it in `texte.ts` so it is easy to correct.

### Pattern 6: Diagnostics panel (MIC-04)
Always visible (no collapsing, because there is no Mac for debugging and screenshots must show everything), in a compact label-size column. Rows (German labels):
- **Abtastrate (AudioContext):** `ctx.sampleRate` Hz. **Mikrofon meldet:** `settings.sampleRate ?? "nicht gemeldet"`. If both exist and differ, warn "Abtastraten verschieden – Tonhöhe kann falsch sein" ("Sample rates differ – pitch may be wrong"). A 44.1 k vs 48 k mismatch would be ±147 cents.
- **Echounterdrückung / Rauschunterdrückung / Automatische Lautstärke:** each `false → "aus ✓"`, `true → "AN ✗"`, `undefined → "nicht gemeldet"`. Next to it, "unterstützt: ja/nein" from `navigator.mediaDevices.getSupportedConstraints()`.
- **Audio-Status:** `ctx.state` raw (`running`, `suspended`, `closed`, and WebKit's non-standard `interrupted`). **Mikrofon-Spur:** `track.readyState`, `muted`, `label`. **Audio-Sitzung:** `navigator.audioSession?.type ?? "–"`.
- **Startart:** "Home-Bildschirm" if `navigator.standalone === true || matchMedia?.('(display-mode: standalone)').matches`, else "Safari-Tab". This directly records SC-5. `navigator.standalone` is not in TS's DOM lib, so declare it in `globals.d.ts`.
- **Analysefenster:** `FFT_SIZE` samples = `FFT_SIZE / sampleRate × 1000` ms. **Bildrate:** measured analyses per second. **Analysezeit:** last `findPitch` duration in ms.
- **App-Version** (reuse `formatVersion`), so screenshots identify the build.
- Optional: listen to `track` `ended`/`mute`/`unmute` and `ctx` `statechange`, and log the last event plus a time in one row ("Letztes Ereignis").

### Pattern 7: Stop / cleanup (D-02, D-03)
- `stop()` must be **idempotent**: cancel rAF, `source.disconnect()`, `stream.getTracks().forEach(t => t.stop())`, then `ctx.suspend()`. Do not `close()`: CLAUDE.md wants one shared context for later phases. Recreate the context only if `state === 'closed'`.
- Call `stop()` from the `MicTestScreen` `useEffect` cleanup. That covers "‹ Zurück" and any other screen switch without touching the shared `BackButton`. Also call it on `pagehide`. StrictMode runs the cleanup once on mount, so `stop()` must not throw when nothing is running.
- Keep audio objects (`AudioContext`, stream, nodes, detector) in a module-level controller, **never** in React state or Zustand (no serialization, no re-renders).

### Anti-Patterns to Avoid
- `await` anything before `new AudioContext()`/`resume()` in the tap handler.
- Passing `{ sampleRate: 44100 }` (or any rate) to `new AudioContext`, or using a constant rate in `findPitch`.
- Calling `setState` 60×/s for every frame: publish to the store at about 15 Hz; analysis still runs every frame.
- Creating a new `PitchDetector` per frame. It allocates FFT buffers, so create it once per window size.
- Treating `undefined` NS/AGC in `getSettings()` as "on". Safari doesn't report them (Pitfall 2).
- Changing the URL/hash while the mic is live (CLAUDE.md, WebKit 215884).
- Putting the mic start into `onStart()` of the welcome screen (superseded by D-01). Remove the stale comment in `appStore.ts` that promises it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pitch estimation | Own autocorrelation / FFT peak / HPS | pitchy `PitchDetector` | NSDF + key maxima + parabolic refinement already handle the hard parts. Naive FFT gives octave errors on piano |
| FFT | Own FFT | fft.js (via pitchy) | Already bundled |
| Permission state UI | Polling `navigator.permissions` | Try `getUserMedia` and classify the error | Permissions API support for `'microphone'` on Safari is inconsistent. The gUM result is the ground truth |
| Number formatting | String concatenation with `.` | `Intl.NumberFormat('de-DE')` | Decimal comma, consistent rounding |

**Key insight:** the hard, risky part is **iOS audio-session behaviour**, not the maths. Spend the effort on diagnostics visibility and error paths, not on custom DSP.

## Common Pitfalls

### Pitfall 1: Inharmonicity makes MPM read sharp, and the A4 criterion is misread
**What goes wrong:** A4 shows +10…+20 cents right after the attack and drifts towards +2…+4 as it decays. Or the piano itself is tuned to, say, 443 Hz. Either way the "±10 cents at 440 Hz" check fails even though detection works.
**Evidence (this session, pitchy 4.1.0, 48 kHz, 4096):** A4 bias vs inharmonicity B and partial roll-off: B=0.0003 → +13.3 c (1/k), +1.8 c (1/k²); B=0.0006 → +23.5 c (1/k), +3.1 c (1/k²); B=0.001 → +26.5 c (1/k), +4.2 c (1/k²). With B=0 the bias is 0.0 c. [VERIFIED: local experiment with synthetic signals; real piano spectra unknown]
**How to avoid:** In the checklist, define A4 success as (a) the note stays "A4" for ≥ 2 s without flicker, (b) cents stay within a ±10-cent band **around its own average**, and (c) record the absolute Hz/cents shown (offset correction is Phase 3, KAL-01). Optional D-07 lever: a `BiquadFilterNode` low-pass (e.g. 4–5 kHz) before the analyser reduces the influence of upper partials.
**Warning signs:** Cents show a steady drift in one direction during a held note, rather than jumping.

### Pitfall 2: `getSettings()` on Safari doesn't report NS/AGC
**What goes wrong:** The diagnostics show "autoGainControl: undefined" and someone concludes voice processing is on.
**Facts:** BCD marks `autoGainControl` and `noiseSuppression` as unsupported (`version_added: false`) in Safari and iOS Safari, for both `applyConstraints` and `getSupportedConstraints`. `echoCancellation` is supported (constraint since 11, supported-constraints since iOS 13.4). `sampleRate` is in `getSupportedConstraints` since 18.6 [VERIFIED: @mdn/browser-compat-data 8.1.10]. Bug reports suggest `echoCancellation` is the one switch Safari honours, and that it effectively controls the whole voice-processing unit [CITED: bugs.webkit.org/show_bug.cgi?id=311451 reporter's understanding, not an engineer statement].
**How to avoid:** Show "nicht gemeldet" for `undefined`. The pass criterion for SC-3 is `echoCancellation === false` reported, plus a stable held tone (MIC-05).

### Pitfall 3: Sample-rate mismatch → wrong pitch
**What goes wrong:** If the context runs at 48 kHz but the captured data is effectively 44.1 kHz (or the other way round), every note is off by about 1.5 semitones.
**Facts:** WebKit bug 244203 includes an iOS report where track settings said 44.1 kHz and the AudioContext said 48 kHz. It's an AudioWorklet bug report and old (iOS 15) [CITED: bugs.webkit.org/show_bug.cgi?id=244203].
**How to avoid:** Show both rates in the diagnostics with a mismatch warning. The held-A4 test would expose it at once (A4 would show as about G4/Gis4 or Ais4/H4). D-07 lever: create the AudioContext **after** `getUserMedia` resolves (capture active), then resume.

### Pitfall 4: iOS 26 "NotAllowedError: No AVAudioSessionCaptureDevice" despite permission
**Facts:** WebKit bug 319706 (P1, Critical) was reported on **iOS 26.5.2** / Safari 26.3–26.6. After an audiomxd media-services reset, audio capture fails permanently with `NotAllowedError`, and reloading does not help. Quitting Safari or restarting the device does. A fix landed on the Safari 26 branch on 2026-09-08. Whether it shipped in a 26.x update the user has is unknown [CITED: bugs.webkit.org/show_bug.cgi?id=319706].
**How to avoid:** Put "Safari ganz schließen / iPad neu starten" in the `verweigert` steps, and show `err.message` in the diagnostics (that is how the user can tell this case apart).

### Pitfall 5: Home-screen mode re-prompts or behaves differently
**Facts:** Historic WebKit bugs (215884, 226620, 204467) document permission prompts in standalone mode on every launch or on hash changes. In Sept 2024 a WebKit reply suggested persistent mic permission for home-screen apps was still not available. Nothing iOS-26-specific was found [CITED: bugs.webkit.org/show_bug.cgi?id=215884 + lists.webkit.org 2024-09]. Since iOS/iPadOS 26, **every** site added via "Zum Home-Bildschirm" opens as a web app by default (toggle "Als Web-App öffnen"), even without a manifest. Phase 11 adds the manifest [CITED: heise.de/-10749652, macrumors iOS 26 Safari guide].
**How to avoid:** The checklist expects a possible prompt on each home-screen launch and records it (that counts as acceptable for Phase 2, and PWA-02 decides later). The German how-to: Safari → Teilen-Symbol (□↑) → „Zum Home-Bildschirm“ → make sure „Als Web-App öffnen“ is on → „Hinzufügen“. The diagnostics row "Startart" proves which mode was tested.

### Pitfall 6: pitchy's `minVolumeDecibels` uses `10^(dB/10)` on RMS
**What goes wrong:** Setting `detector.minVolumeDecibels = -40` actually gates at RMS 1e-4, which is −80 dBFS, not −40 dBFS. [VERIFIED: pitchy 4.1.0 source, `set minVolumeDecibels`: `this._maxInputAmplitude * 10 ** (db / 10)` compared against RMS]
**How to avoid:** Leave pitchy's volume gate at its default (0 = off). Compute RMS ourselves (we need it for the level bar anyway) and gate with `20·log10`.

### Pitfall 7: Clarity ≠ clarity threshold
pitchy's `clarityThreshold` (k, default 0.9) chooses **which NSDF peak** is taken. Raising it towards 1 favours later peaks, which risks sub-octave errors. The returned `clarity` is the NSDF height at the chosen peak. Keep `k` at 0.9 and apply our own `CLARITY_MIN` to the returned value [VERIFIED: pitchy source].

### Pitfall 8: jsdom has no audio APIs
In jsdom 31, `AudioContext` and `navigator.mediaDevices` are undefined, `window.isSecureContext` is undefined, and `window.matchMedia` is undefined [VERIFIED: local probe]. Code must guard `matchMedia?.`, treat `isSecureContext === false` (not falsy) as insecure (as Phase 1 already does), and get audio objects through injected dependencies. `DOMException` exists, so tests can create `new DOMException('x', 'NotAllowedError')`.

### Pitfall 9: Bluetooth headphones/AirPods hijack the input
WebKit bug 212653: an AnalyserNode fed from a Bluetooth headset input reported wrong or zero data, while the built-in mic worked [CITED: search result summary of webkit bug 212653, LOW-MEDIUM]. Show `track.label` in the diagnostics. The checklist says to disconnect Bluetooth headphones first.

### Pitfall 10: rAF stops in the background; WebKit `interrupted` state
When the screen locks or the app switches, rAF pauses and `ctx.state` may become `interrupted` (WebKit-specific). Phase 2 only **shows** this. Automatic resume is PWA-03 (Phase 11). When `visibilitychange` → hidden, calling `stop()` is acceptable and simplest (the user taps start again).

## Code Examples

### Synthetic piano-like test signal (for Vitest)
```typescript
// Source: pattern used in this session's pitchy experiment
export function klavierTon(f0: number, n: number, sr: number,
  { B = 0.0003, grundAmp = 1, teiltoene = 10, rauschen = 0, amp = 0.2 } = {}): Float32Array {
  const buf = new Float32Array(n)
  for (let k = 1; k <= teiltoene; k++) {
    const fk = k * f0 * Math.sqrt(1 + B * k * k)        // stiff-string inharmonicity
    if (fk > sr / 2) break
    const a = (k === 1 ? grundAmp : 1 / k) * amp
    for (let i = 0; i < n; i++) buf[i] += a * Math.sin((2 * Math.PI * fk * i) / sr)
  }
  // deterministic noise for reproducible tests (no Math.random): simple LCG
  let s = 12345
  for (let i = 0; i < n && rauschen > 0; i++) { s = (s * 1103515245 + 12345) >>> 0; buf[i] += rauschen * ((s / 2 ** 32) * 2 - 1) }
  return buf
}
```

### Experiment results to anchor test expectations (pitchy 4.1.0, sr 48000, window 4096)
| Signal | Detected | Clarity |
|--------|----------|---------|
| Sine A0…C8 | exact note, 0 c | 1.00 |
| Piano-like (B 0.0004, 1/k), C2 / C3 / A4 / C6 | correct note, +12…+13 c | 0.99 |
| Weak fundamental (0.1×) + noise, C2 / C3 | correct note, +14…+15 c | 0.98 |
| C2 with **no** fundamental | 36.05–36.14 MIDI (correct) | 0.98–1.00 |
| A4 with 3072 of 4096 samples silence first (onset in window) | 443.6 Hz | 0.94 |
| White noise 0.05 | 11.7 Hz | 0.835 → rejected by range gate |
| Silence | `[0, 0]` | — |
| `findPitch` time | 0.17 ms (4096), 0.35 ms (8192) on desktop Node | — |

Test assertions should use tolerances (correct MIDI number; cents within ±20 for B > 0 signals, ±1 for pure sines), not exact cents.

### Fake audio deps for jsdom
```typescript
// Inject into AnalyserPitchSource/micController; no global patching needed
const track = { stop: vi.fn(), getSettings: () => ({ echoCancellation: false, sampleRate: 48000 }),
  label: 'iPad Mikrofon', readyState: 'live', muted: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
const mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(stream),
  getSupportedConstraints: () => ({ echoCancellation: true, sampleRate: true }) }
class FakeCtx { state = 'suspended'; sampleRate = 48000; destination = {}
  resume = vi.fn(async () => { this.state = 'running' }); suspend = vi.fn(async () => { this.state = 'suspended' })
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }))
  createAnalyser = vi.fn(() => ({ fftSize: 2048, connect: vi.fn(), getFloatTimeDomainData: vi.fn() }))
  createGain = vi.fn(() => ({ gain: { value: 1 }, connect: vi.fn() })) }
// Denial: mediaDevices.getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
// Order check: expect(ctx.resume).toHaveBeenCalled() BEFORE the getUserMedia promise resolves
```
Note: class field declarations like `state = 'suspended'` are fine under `erasableSyntaxOnly`. Constructor parameter properties are not. Tests may live in `.test.ts` files, which `tsconfig.app.json` also type-checks (`include: ["src"]`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `webkitAudioContext` | Unprefixed `AudioContext` | Safari 14.1 / iOS 14.5 | No prefix fallback needed on iPadOS 26 |
| `ScriptProcessorNode` | AnalyserNode (polling) / AudioWorklet | deprecated | Never use SPN |
| iOS home-screen icon = bookmark unless the site has a manifest | Every "Zum Home-Bildschirm" opens as web app by default | iOS/iPadOS 26 | Standalone test possible before the Phase 11 manifest |
| — | `navigator.audioSession.type` | Safari 16.4 | Show it in diagnostics; leave it on `auto` in Phase 2 |

**Deprecated/outdated:** `getByteTimeDomainData` precision (use the float version); old advice to pass `{ mandatory: { googEchoCancellation } }`, which is Chrome-legacy only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | pitchy/fft.js legitimacy (slopcheck not run) | Package audit | Very low. Long-lived, 54k/921k weekly downloads, no install scripts. Gated by a human checkpoint |
| A2 | Gate values −60/−66 dBFS, clarity 0.9 are good starting points for an upright at ~60 cm with AGC off | Pattern 2 | Notes drop out or noise shows notes. All values are visible and tunable, which is the D-07 loop |
| A3 | `Gain(0) → destination` is harmless and helps keep the graph processing on WebKit | Pattern 1 | None if unnecessary |
| A4 | Exact iPadOS 26 Safari menu path for per-site mic permission ("Website-Einstellungen" / Einstellungen → Apps → Safari → Mikrofon) | Pattern 5 | User gets wrong steps. Verify during the checkpoint, text lives in `texte.ts` |
| A5 | German usage "B" (not "Ais") for pitch class 10 | Pattern 4 | Cosmetic. A secondary Hz line removes the ambiguity |
| A6 | iPad hardware/context sample rate is 48 kHz | Pitfall 3 | None. Code uses the runtime value and shows it |
| A7 | Plain `false` constraints never cause OverconstrainedError on Safari | Pattern 1 | Start fails. The error path shows it; fallback `{ audio: { echoCancellation: false } }` |
| A8 | Creating the AudioContext before getUserMedia yields a correct sample rate on iPadOS 26 | Pattern 1 / Pitfall 3 | Pitch shifted ~1.5 semitones. Diagnostics plus A4 test catch it; lever: create after gUM |
| A9 | Real piano spectra roll off steeply enough that the inharmonicity bias stays ≲ 10 c in the sustain | Pitfall 1 | A4 cents read high. Criterion defined relative to its own average; low-pass lever |

## Open Questions (RESOLVED)

1. **How to judge "A4 at ~440 Hz ±10 cents" when the piano may not be at 440?**
   - Known: the detection bias plus piano tuning can both shift the absolute value; calibration is Phase 3.
   - Recommendation: the checklist item passes if the note stays A4 ≥ 2 s and the cents stay inside a ±10 band around their own mean. Record the absolute value. Flag it as "Stimmung weicht ab" (tuning is off) if |mean| > 10 c, and treat that as information for Phase 3, not a Phase 2 failure. The planner should state this explicitly in the checkpoint.
   - RESOLVED: CONTEXT D-08 (A4 pass criterion) + plan 02-06 Task 2 checkpoint (relative ±10 c band, absolute mean only recorded, "Stimmung weicht ab" if |mean| > 10).
2. **Should a window-size switch (4096/8192) be in the diagnostics panel?**
   - D-05 forbids test helpers, but a diagnostic switch would save redeploy cycles in the D-07 loop.
   - Recommendation: not in the first plan. Keep `FFT_SIZE` as one constant and add a switch only if the piano test fails in the bass.
   - RESOLVED: deferred per recommendation; plans keep one `FFT_SIZE = 4096` constant (plan 02-01) and add no switch (D-05).
3. **Note naming vs. KOMF-02 (v2: German names with a toggle).**
   - Recommendation: German names now (CONTEXT asks for it) plus the international name/Hz in the secondary line. The toggle stays v2.
   - RESOLVED: plan 02-02 (noteMath German names incl. B/H, NotenAnzeige secondary line 'international: …' + Hz); the toggle stays v2 (KOMF-02).
4. **Stop on `visibilitychange: hidden`?** Recommendation: yes (simplest, and it releases the mic indicator). Phase 11 builds the proper "pausiert – tippen zum Fortsetzen".
   - RESOLVED: plan 02-04 Task 2 (visibilitychange → hidden stops the mic via stop('hintergrund'); pagehide stops it too).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | build, tests | ✓ | Node 26.13.1 | — |
| Vitest + jsdom + RTL | tests | ✓ | vitest 5.1.1, jsdom 31.0.1 | — |
| npm registry access | pitchy install | ✓ | — | — |
| Python / pip (slopcheck) | legitimacy check | ✗ | — | Human-verify checkpoint (Phase 1 pattern) |
| iPad (iPadOS 26.5.2, Safari) + acoustic piano | SC 1, 4, 5 | user-owned | 26.5.2 | none: manual checkpoint is mandatory |
| GitHub Pages deploy (HTTPS) | iPad test | ✓ (Phase 1) | — | — |
| Mac / Web Inspector | debugging | ✗ | — | In-app diagnostics panel (this phase) |

**Missing, no fallback:** none for the build. Device testing is a human checkpoint.
**Missing, with fallback:** slopcheck → human checkpoint; Mac → diagnostics panel.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 5.1.1 + jsdom 31.0.1 + @testing-library/react 16.3.3 (already installed) |
| Config file | `vite.config.ts` → `test: { environment: 'jsdom' }` (exists) |
| Quick run command | `npx vitest run src/audio` |
| Full suite command | `npm run lint && npm test && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIC-01 | `start()` calls `ctx.resume()` before awaiting gUM; constraints EC/NS/AGC `false`, `video:false` | unit (fakes) | `npx vitest run src/audio/micController.test.ts` | ❌ Wave 0 |
| MIC-01 | Error names → kinds (`NotAllowedError`→verweigert, `NotFoundError`→keinMikrofon, `NotReadableError`→belegt, insecure→unsicher, other→unbekannt) | unit | `npx vitest run src/audio/micErrors.test.ts` | ❌ Wave 0 |
| MIC-01 | Screen: tap "Mikrofon starten" → button becomes "Mikrofon stoppen"; denial shows German message + "Nochmal versuchen"; no URL change | component | `npx vitest run src/screens/MicTestScreen.test.tsx` | ❌ Wave 0 |
| MIC-01/D-02/D-03 | Stop button, "‹ Zurück" and unmount all call `track.stop()` on every track; `stop()` idempotent (StrictMode) | component + unit | same as above | ❌ Wave 0 |
| MIC-02 | `hzToMidiFloat`/`midiToNote`: 440→A4 0 c; 261.63→C4; 466.16→B4; 493.88→H4; 65.41→C2; 27.5→A0; 4186→C8; ±cents sign and ±50 boundary; German number formatting | unit | `npx vitest run src/audio/noteMath.test.ts` | ❌ Wave 0 |
| MIC-02 | `analyzeFrame` on synthetic sine + piano-like (weak fundamental, noise) for C2, C3, C4, A4, C6 → correct MIDI, cents tolerance | unit (real pitchy) | `npx vitest run src/audio/pitchAnalysis.test.ts` | ❌ Wave 0 |
| MIC-03 | RMS/dBFS correct (sine amp 0.2 → −16.99 dBFS); noise → `valid:false`; silence → `valid:false`, db `-Infinity` | unit | same | ❌ Wave 0 |
| MIC-04 | Diagnostics render sampleRate, EC "aus", NS/AGC "nicht gemeldet" for undefined, ctx state, Startart, mismatch warning | component | `npx vitest run src/components/DiagnosePanel.test.tsx` | ❌ Wave 0 |
| MIC-05 | 2.4 s simulated A4 frame sequence (hop ≈ 800 samples, exponential decay −20→−50 dBFS, small noise) through `analyzeFrame` + `PitchSmoother` → displayed note A4 on every frame after the first 3; cents spread ≤ 10; one injected octave-outlier frame does not change the note | unit | `npx vitest run src/audio/smoothing.test.ts` | ❌ Wave 0 |
| MIC-01..05 on device | Checklist C2, C3, C4, A4 hold ≥ 2 s, C6, fast sequence; Safari tab AND home screen | manual (human-verify) | — | manual-only (needs iPad + piano) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/audio` (or the touched test file)
- **Per wave merge:** `npm run lint && npm test && npm run build`
- **Phase gate:** full suite green locally and in GitHub Actions, deploy visible on the iPad (version label/diagnostics version row), then both checklist passes reported by the user before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `src/audio/testSignale.ts`: deterministic synthetic signal generator (no `Math.random`)
- [ ] `src/audio/noteMath.test.ts`, `pitchAnalysis.test.ts`, `smoothing.test.ts`, `micErrors.test.ts`, `micController.test.ts`
- [ ] `src/screens/MicTestScreen.test.tsx`, `src/components/DiagnosePanel.test.tsx`
- [ ] Update `src/App.test.tsx` (the placeholder test asserts the old text and the "kommt bald" badge behaviour)
- [ ] Shared fake audio deps helper (e.g. `src/audio/testFakes.ts`)
- No framework install needed.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no accounts |
| V3 Session Management | no | — |
| V4 Access Control | partly | Browser permission model for the mic. Request only on an explicit tap (D-01); release on stop/leave |
| V5 Input Validation | minimal | Audio samples are numeric. Guard NaN/Infinity (`db = -Infinity` on silence; `hz = 0`) before display |
| V6 Cryptography | no | HTTPS via GitHub Pages (Phase 1) |
| V8 Data Protection / Privacy | yes | Audio is analysed in memory only: never recorded, stored or transmitted. No analytics. The mic indicator must disappear after stop (D-02) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Mic left running after leaving the page | Information disclosure (privacy) | Idempotent `stop()` on button, unmount, `pagehide`/hidden. Test asserts `track.stop()` |
| Supply-chain (new npm dep) | Tampering | Exact pin `pitchy@4.1.0`, lockfile, human legitimacy checkpoint, no install scripts |
| Insecure origin | Spoofing/Info disclosure | `isSecureContext` check → `unsicher` message with HTTPS link |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`, 2026-11-23): pitchy 4.1.0 (deps, exports, scripts, maintainers, created 2018-02-12), fft.js 4.0.4, pitchfinder 2.3.4; npm downloads API (pitchy 54,180/wk, fft.js 921,123/wk)
- pitchy 4.1.0 package source (`npm pack`, `index.js`/`index.d.ts`): defaults (k = 0.9, minVolume 0), the `minVolumeDecibels` formula, the NSDF/key-maximum logic, `[0, 0]` return
- @mdn/browser-compat-data 8.1.10 (`data.json`): Safari/iOS support for AudioContext, getFloatTimeDomainData, getSettings, applyConstraints (EC yes; AGC/NS/channelCount no), getSupportedConstraints (EC 13.4, sampleRate 18.6), navigator.audioSession 16.4
- Local experiment in this session (pitchy 4.1.0 on synthetic signals at 48 kHz): window sizes, inharmonicity bias, missing fundamental, onset in window, noise, timing
- Local jsdom 31 probe: no AudioContext/mediaDevices/matchMedia/isSecureContext
- [pitchy README](https://raw.githubusercontent.com/ianprime0509/pitchy/main/README.md)

### Secondary (MEDIUM confidence)
- [WebKit 319706](https://bugs.webkit.org/show_bug.cgi?id=319706): iOS 26.5.2 NotAllowedError "No AVAudioSessionCaptureDevice", workaround: quit Safari / restart
- [WebKit 311451](https://bugs.webkit.org/show_bug.cgi?id=311451): degraded audio with mic on iOS 26.4; reporter believes EC is the only honoured constraint
- [WebKit 244203](https://bugs.webkit.org/show_bug.cgi?id=244203): sample-rate mismatch report (track 44.1 k vs ctx 48 k on iOS)
- [WebKit 215884](https://bugs.webkit.org/show_bug.cgi?id=215884) and the [2024-09 webkit-unassigned thread](https://lists.webkit.org/pipermail/webkit-unassigned/2024-September/1183557.html): standalone permission prompts
- [WebKit 179411](https://bugs.webkit.org/show_bug.cgi?id=179411): constraints historically ignored on iOS
- [heise: iOS/iPadOS 26 web-app behaviour on the home screen](https://heise.de/-10749652), [MacRumors iOS 26 Safari guide](https://www.macrumors.com/guide/ios-26-safari-features/): "Als Web-App öffnen" default

### Tertiary (LOW confidence)
- [WebKit 212653](https://auto-bugs.webkit.org/show_bug.cgi?id=212653) / [WebKit 180522](https://bugs.webkit.org/show_bug.cgi?id=180522): AnalyserNode zero data (Bluetooth input / old iOS)
- [Apple Community DE](https://communities.apple.com/de/thread/256357164): mic settings paths (unconfirmed for iPadOS 26 Safari per-site menu)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. pitchy is verified on the registry and its source was inspected; it's prescribed by CLAUDE.md.
- Architecture: HIGH. Standard Web Audio pattern; testability via injection is proven in Phase 1 conventions.
- Pitch behaviour: MEDIUM. Synthetic experiments are solid, but real piano spectra and iPad mic response are only knowable at the device test.
- iOS specifics: MEDIUM. BCD is authoritative for API support; standalone and permission behaviour rest on bug reports.

**Research date:** 2026-11-23
**Valid until:** 2026-12-23 (iOS/WebKit behaviour moves fast. Re-check if the iPad gets an iPadOS update before the test.)
