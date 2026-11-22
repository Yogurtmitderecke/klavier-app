<!-- GSD:project-start source:PROJECT.md -->
## Project

**Klavier-App (Arbeitstitel)**

Eine eigene Klavier-Lern-App im Browser, mit der ich auf meinem **akustischen Klavier** bekannte, gemeinfreie Stücke lerne. Das iPad (oder der Laptop) steht auf dem Notenständer, hört über das Mikrofon zu und zeigt fallende Noten über einer Klaviatur oder klassische Notenschrift. Funktional ähnlich zu bekannten Klavier-Lern-Apps, aber mit eigenem Namen, eigenem Design und eigenen Inhalten. Persönliches Übungswerkzeug – nur für mich.

**Core Value:** **Die App hört über das Mikrofon zuverlässig, welchen Ton ich auf meinem akustischen Klavier spiele, und wartet im Warte-Modus, bis der richtige Ton kommt.** Ohne funktionierende Mikrofon-Erkennung ist die App für mich wertlos – es gibt bewusst keinen Ersatz-Modus ohne Zuhören.

### Constraints

- **Tech stack**: React + TypeScript + Vite — vom Nutzer vorgegeben
- **Audio**: Web Audio API + Tonhöhenerkennung (pitchy / YIN) — läuft komplett im Browser
- **Noten**: @tonejs/midi zum Einlesen; OpenSheetMusicDisplay oder VexFlow für Notenschrift — vom Nutzer vorgeschlagen
- **Speicherung**: Nur lokal im Browser (z. B. localStorage/IndexedDB) — kein Server, kein Login
- **Kompatibilität**: Muss in Safari auf dem iPad funktionieren (Mikrofon, Audio, PWA) — Hauptgerät
- **Hosting**: Kostenlos, mit HTTPS (Pflicht für Mikrofon-Zugriff im Browser)
- **Lizenz/Recht**: Nur gemeinfreie Stücke und frei lizenzierte Quellen; nichts von flowkey übernehmen
- **Vorgehen**: Kleine Phasen; Mikrofon-Erkennung früh als eigene Phase mit Testseite
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR (prescriptive)
- **Scaffold:** `npm create vite@latest` with the `react-ts` template. Today it gives React 19.3, Vite 8.3, TypeScript ~7.0 and oxlint. Keep those defaults.
- **Pitch detection (v1, single notes):** use **pitchy 4.1.0** (McLeod Pitch Method). Feed it raw mic samples with all browser voice processing turned **off**. Add your own layers on top: an RMS gate, onset detection, a clarity threshold, median smoothing and octave-error correction. In wait mode, **check the incoming sound against the note the app expects.** Don't rely on blind "what note is this?" detection alone.
- **Audio capture:** start with `getUserMedia` → `MediaStreamAudioSourceNode` → `AnalyserNode` (fftSize 4096), polled every animation frame. Hide it behind a `PitchSource` interface. Move to an AudioWorklet only if measurements show the need. AudioWorklet works on iOS Safari 14.5+.
- **Sheet music:** **OpenSheetMusicDisplay (OSMD) 3.0.x**, fed with **MusicXML**. Use MusicXML as the single source of truth for the built-in library. Uploaded MIDI files get falling notes only in v1.
- **MIDI:** **@tonejs/midi 2.0.28**.
- **Falling notes:** a plain **Canvas 2D** layer plus a DOM/SVG keyboard. No PixiJS.
- **Metronome / reference playback:** **Tone.js 15.1.x** (`Tone.getTransport()` plus a click synth or Sampler). Share **one** AudioContext with the mic.
- **Storage:** **Dexie 4.4.x** (IndexedDB) for uploaded files and progress. Settings go in localStorage through Zustand `persist`. Call `navigator.storage.persist()`.
- **State:** **Zustand 5.1.x**. No router library: switch screens with app state, not URL hash changes (see the PWA note).
- **PWA:** **vite-plugin-pwa 2.0.0** (Workbox 7.4), `registerType: 'autoUpdate'`.
- **Hosting:** **GitHub Pages via GitHub Actions** (free, HTTPS, never pauses). Alternative: Cloudflare (Workers static assets or Pages).
- **Chords (later):** first choice is **template/harmonic matching against the expected notes** (DSP, no ML). A second choice is a **Basic Pitch model via onnxruntime-web/TFJS**, as an experiment only. Do **not** use Magenta Onsets-and-Frames.
## Recommended Stack
### Core Technologies
| Technology | Version (verified 2026-11-22) | Purpose | Why Recommended | Confidence |
|------------|------------------------------|---------|-----------------|------------|
| React | 19.3.1 | UI | User-fixed. The current create-vite template ships it. | HIGH |
| TypeScript | ~7.0.2 | Types | The create-vite `react-ts` template now pins `typescript ~7.0.2` (the native Go compiler, so `tsc -b` is fast). Don't downgrade. | HIGH |
| Vite | 8.3.x | Dev server / bundler | User-fixed. Vite 8 uses Rolldown. All recommended plugins declare `vite ^8` peer support. | HIGH |
| @vitejs/plugin-react | 6.3.0 | React transform | Template default. Its peer dependency is `vite ^8`. | HIGH |
| Web Audio API (native) | n/a | Mic capture, analysis, playback | No library needed for capture. `getUserMedia` plus AnalyserNode/AudioWorklet are all supported in iPadOS Safari. | HIGH |
| pitchy | 4.1.0 (Jan 2024, MIT, ESM-only, one dependency: fft.js) | Monophonic pitch detection | Implements the McLeod Pitch Method (MPM). It returns `[pitchHz, clarity]`, and the clarity value is exactly what you need to reject noise and the decaying piano sustain. It's tiny and fast (a 4096-sample window takes well under 1 ms). Unchanged since 2024 because it's finished, not because it was abandoned. API: `PitchDetector.forFloat32Array(n)`, then `findPitch(buf, sampleRate)`. | HIGH (library) / MEDIUM (piano accuracy, must test) |
| OpenSheetMusicDisplay | 3.0.0 (released 2026-11-21, BSD-3) | Sheet music rendering + cursor | Renders **MusicXML** with automatic layout and has a built-in **cursor** (`osmd.cursor.next()`) that maps directly onto wait mode. It bundles VexFlow internally. 3.0 adds `osmd.destroy()`, which suits React unmounts. | HIGH (choice) / MEDIUM (3.0 is one day old) |
| @tonejs/midi | 2.0.28 | Parse uploaded `.mid` into notes (midi number, time, duration, track) | The de-facto standard and a stable format. No releases since 2022, which is fine because MIDI parsing is a solved problem. | HIGH |
| Tone.js | 15.1.22 (updated 2026-11-20) | Metronome scheduling, optional "listen to passage" playback | Its look-ahead Transport scheduling is sample-accurate. It handles tempo changes (30–100 %) and loops via `Transport.loop`/`loopStart`/`loopEnd`, so you don't have to rebuild that. | HIGH |
| vite-plugin-pwa | 2.0.0 | Manifest + service worker (Workbox 7.4.1) | The standard Vite PWA integration, with zero-config precaching of the built app and song files. Its peer range includes Vite 8. | HIGH |
| Dexie | 4.4.7 | IndexedDB wrapper | Stores uploaded MIDI/MusicXML as Blobs/ArrayBuffers, plus per-song progress. It gives you schema versioning (`db.version(n)`) and `useLiveQuery` through dexie-react-hooks 4.4.0. | HIGH |
| Zustand | 5.1.0 | App state (current song, mode, tempo, calibration) | Minimal boilerplate. The `persist` middleware puts small settings in localStorage. Fast state reads outside React matter for the audio loop. | HIGH |
### Supporting Libraries
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| dexie-react-hooks | 4.4.0 | `useLiveQuery` for song list / progress | From the storage phase onward | HIGH |
| @vite-pwa/assets-generator | 2.0.0 | Generates the iPad home-screen icons and apple-touch-icon from one SVG | PWA phase | HIGH |
| fft.js | (pulled in by pitchy) | Spectrum for the chord / expected-note matcher | Later chord phase. Usable directly for harmonic salience. | HIGH |
| pitchfinder | 2.3.4 | YIN / AMDF / Macleod alternatives | **Only** as an A/B comparison on the mic test page if MPM gives octave errors on the user's piano | MEDIUM |
| onnxruntime-web | 1.31.1 | Run an exported Basic Pitch (or other) ONNX model with the WebGPU/WASM backend | **Chord experiment only** (later milestone). WebGPU ships in iPadOS 26+. | MEDIUM |
| @spotify/basic-pitch | 1.0.1 (depends on @tensorflow/tfjs ^3.2, which is old) | Polyphonic note transcription | **Experiment only.** It processes fixed 2-second windows (43,844 samples at 22,050 Hz), so it isn't real-time by design. | MEDIUM (facts) / LOW (fitness) |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| oxlint 1.9x | Linting | The create-vite template default. Don't add typescript-eslint: typescript-eslint 8.73 peer-requires `typescript <6.1`, which is **incompatible with TS 7**. |
| Vitest 5.1.x | Unit tests | Most important for the pitch pipeline. Test it against synthetic sine/harmonic signals and against **recorded WAV fixtures of the user's own piano** (record once on the iPad, replay in tests). |
| Safari Web Inspector (Mac) or the Eruda/console overlay | Debugging on the iPad | Remote debugging needs a Mac. Without one, add an in-app debug panel (the mic test page doubles as this). |
| `vite --host` + `@vitejs/plugin-basic-ssl` or a tunnel | Testing on the iPad during development | The mic needs HTTPS. On the LAN, use a self-signed cert or simply deploy every commit to GitHub Pages and test there (simplest for a non-programmer). |
| MuseScore Studio 4 (free desktop app) | Authoring/cleaning the 4–5 library songs as MusicXML (`.mxl`/`.musicxml`) | Not an npm dependency, but this is how library content gets made. |
## Installation
# Scaffold (gives React 19.3, Vite 8.3, TS ~7.0, oxlint)
# Core
# PWA
# Dev / test
# LATER (chord experiment milestone only)
# npm install onnxruntime-web@^1.31.1        # preferred runtime for an ONNX export
# npm install @spotify/basic-pitch@1.0.1     # TFJS reference implementation
## Pitch Detection for an ACOUSTIC Piano on iPad Safari (core decision)
### What makes acoustic piano hard
### Verdict per approach
| Approach | Fit for this app | Why | Confidence |
|----------|------------------|-----|------------|
| **pitchy (MPM)** | **Recommended for v1** | A time-domain NSDF with a clarity output. Fewer octave errors than plain autocorrelation. Handles inharmonic partials reasonably, because it finds the waveform period rather than matching harmonic spacing. Fast enough to run 60×/s on an iPad. | MEDIUM (needs testing on the real piano) |
| YIN (pitchfinder) / pYIN | Fallback / A/B | YIN is roughly as good as MPM on single notes. pYIN (probabilistic, with HMM smoothing) is more robust, but there is no maintained JS package, so you'd have to port it. Not worth it for v1. | MEDIUM |
| CREPE (ml5 / TFJS) | Don't use | Trained mostly on monophonic vocals and instruments. A multi-MB model with GPU inference, for a problem MPM already solves on single piano notes. Adds latency and complexity. Whether ml5 1.x still exposes pitch detection could not be confirmed. | LOW-MEDIUM |
| Spotify Basic Pitch | Not for v1 (see the chord section) | Polyphonic and instrument-agnostic, but uses 2-second windows. | MEDIUM |
| Naive FFT peak / HPS | Don't use alone | Octave errors in the bass, and inharmonicity breaks HPS. | HIGH |
### The key design insight: verify the expected note, don't just guess the pitch
- **Blind MPM estimate:** pitch in Hz, converted to MIDI number plus a cents offset (after tuning calibration). Clarity must be at least about 0.85–0.9 and RMS must be above the calibrated noise floor.
- **Expected-note acceptance rule:** accept if the estimated MIDI number equals the target, **or** if it's off by exactly ±12 while the spectrum has strong energy at the target's f0 (octave-error forgiveness). It must also coincide with a fresh onset, and be stable for 2–3 consecutive frames (about 50–80 ms).
### Mic constraints (critical on iOS)
### Capture path: AnalyserNode first, AudioWorklet later
- **AudioWorklet** is supported on Safari 14.1+ and iOS Safari 14.5+ (caniuse, through iOS 27.x). HIGH.
- Still, **start with AnalyserNode** (`fftSize = 4096`, `getFloatTimeDomainData` in a `requestAnimationFrame` loop). It's the pattern pitchy's own demo uses, it avoids bundling a TS worklet module through Vite, and it sidesteps historic WebKit AudioWorklet capture bugs (e.g. bug 244203, which reported corrupted/missing samples). Downsides: analysis pauses while the main thread is blocked (e.g. during an OSMD re-render), and you only get about 60 analyses per second. Both are acceptable for wait mode.
- Put it behind a `PitchSource` interface so a later `AudioWorkletNode` version (loaded via `import url from './capture.worklet.ts?worker&url'`, then `ctx.audioWorklet.addModule(url)`) can replace it without touching the UI.
- **Never** use `ScriptProcessorNode` (deprecated).
### Single AudioContext, created on a user tap
## Polyphonic / Chord Detection — What's Realistically Possible (for the later milestone)
| # | Approach | How it works | Realism on iPad Safari | Latency | Recommendation |
|---|----------|--------------|------------------------|---------|----------------|
| 1 | **Expected-note template / harmonic matching** (DSP, no ML) | For each note in the expected chord, compute "harmonic salience": the summed spectral energy at its first ~6 partials, including an inharmonicity correction, from a long-window FFT (8192–16384) or Goertzel filters. Accept if **every** expected note clearly exceeds the noise floor right after an onset, and no strong *unexpected* note is present. Chroma (12 pitch classes) is a cheaper version that ignores octave. | **HIGH.** Pure JS, cheap, reuses fft.js. Works because the score says what *should* sound. | ~100–200 ms | **Do this first.** Most likely path to "both hands" in wait mode. Weak spots: bass notes a semitone apart (55 Hz vs 58 Hz needs very long windows, so use higher partials) and octave doublings (C3+C4 shares partials). |
| 2 | **Spotify Basic Pitch** (TFJS package, or the ONNX export via onnxruntime-web WebGPU/WASM) | A small CNN that outputs per-frame note/onset/contour posteriors for 88 notes. Instrument-agnostic. | **MEDIUM.** Runs in the browser. The npm package uses old tfjs 3.x. WebGPU exists on iPadOS 26+. | Model window is 2 s with 30 overlap frames, so it is **not designed for streaming**. Re-running a sliding 2 s window every ~250 ms gives roughly 0.3–1 s detection latency (estimate, unmeasured). | **Experiment-only spike.** Could serve as a "second opinion" verifier for approach 1. |
| 3 | Magenta **Onsets and Frames** (@magenta/music) | A piano-specific transcription model (MAESTRO) | **LOW.** The package hasn't been updated since 2022, is on tfjs 2.x-era code, has heavy weights and is batch-oriented. | Seconds | **Don't use.** |
| 4 | Research low-latency piano transcription models (e.g. 2025 arXiv "Minimum Latency Real-Time Piano Transcription") | Causal CNN/transformer variants | **LOW.** Would need your own ONNX conversion and benchmarking. The paper reports 128–320 ms delays for online systems, and accuracy drops when processing is strictly causal. | 128–320 ms (paper) | Only of academic interest for this project. |
## Sheet Music: OSMD vs VexFlow
| Criterion | OpenSheetMusicDisplay 3.0.0 | VexFlow 5.9.0 |
|-----------|----------------------------|---------------|
| Input | MusicXML (incl. compressed `.mxl`) | Programmatic API only (you place every note, beam, measure, line break yourself) |
| Layout/engraving | Automatic (system breaks, spacing, beams, two staves) | Manual, which means a lot of code for a full piece |
| Cursor for wait mode | Built-in (`cursor.show/next/reset`, iterator over voice entries) | None |
| Note data for falling notes | Readable from the parsed model / cursor iterator (halfTone, timestamps) | n/a |
| Maintenance | Very active (2.0 in Jun 2026, 2.3.1 in Nov 2026, 3.0 on 21 Nov 2026) | Active |
- **Library songs:** author them as MusicXML in MuseScore. Derive *both* the sheet view and the falling notes from the same MusicXML, so they can't disagree.
- **Uploaded MIDI:** falling notes + wait mode in v1. The sheet view shows "Für MIDI-Dateien nicht verfügbar – als MusicXML hochladen" ("Not available for MIDI files – upload as MusicXML"). Optionally allow MusicXML upload, which gets both views.
- Hand separation: MusicXML uses `<staff>` 1/2 (RH/LH). For MIDI, use the track or channel, with a "split at middle C" fallback.
## Falling Notes Rendering
- **Not SVG for the falling notes:** hundreds of DOM nodes moving every frame means layout/GC jank on iPad.
- **Not PixiJS 8.23:** WebGL/WebGPU scene graph, about 500 KB+, and a learning curve. Overkill here, and it competes with the audio loop. Only consider it if Canvas 2D measurably drops frames.
## Storage
| Data | Where | Why |
|------|-------|-----|
| Settings (A4 tuning offset, sensitivity/noise floor, view, tempo) | localStorage via Zustand `persist` | Small, synchronous, simple |
| Uploaded MIDI/MusicXML files (binary) | IndexedDB via Dexie (`songs` table, Blob) | localStorage can't store binary well and is capped at about 5 MB |
| Progress / hit rate per song and per run | IndexedDB via Dexie (`runs` table) | Grows over time; queryable later for statistics |
## PWA on iPad (vite-plugin-pwa 2.0.0)
- `registerType: 'autoUpdate'`. Precache the app shell and library songs (`globPatterns` incl. `**/*.{js,css,html,svg,png,mxl,musicxml,mid}`).
- Manifest: `display: 'standalone'`, `orientation: 'any'`, German `name`/`short_name`, plus an `apple-touch-icon` (iOS uses it for the home screen).
- **Mic permission in standalone mode:** home-screen web apps historically **re-prompt for the mic on each launch**, and older iOS re-prompted on **URL hash changes** (WebKit bugs 215884, 226620). Permission persistence for home-screen apps was still an open topic as of the last reports found. So: no hash routing, no URL changes while the mic is live (switch screens via app state), and keep a single, early "Mikrofon aktivieren" ("activate microphone") tap per session. MEDIUM-LOW (bug reports only), so **test early on the actual iPad, in both Safari tab and home-screen mode.**
- GitHub Pages sub-path: set Vite `base: '/klavier-app/'`. The PWA `scope`/`start_url` follow `base` automatically in vite-plugin-pwa, but check the generated manifest.
## Hosting (free, HTTPS)
| Option | Verdict | Notes | Confidence |
|--------|---------|-------|------------|
| **GitHub Pages + GitHub Actions** | **Recommended** | Free, HTTPS automatic, code and hosting in one account, never pauses. The official Vite docs have a ready-made `deploy.yml`. The only gotcha is the `base` sub-path (`https://<user>.github.io/klavier-app/`). | HIGH |
| Cloudflare (Workers static assets / Pages) | Good alternative | Free, fast, served at a root domain (`*.pages.dev` / `*.workers.dev`), so no base-path issue. Cloudflare now steers new projects to Workers static assets; Pages still works. Slightly more setup UI. | MEDIUM-HIGH |
| Vercel Hobby | OK | Free for personal, non-commercial use, which fits. Very easy Git import. | MEDIUM |
| Netlify Free | Least preferred | Since Sept 2025 new accounts are on a **300-credit/month** plan, and projects **pause** when credits run out. Unlikely to matter for a tiny static site, but it's a needless risk. | MEDIUM |
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| pitchy (MPM) | pitchfinder YIN | If MPM shows persistent octave errors on the user's piano in the A/B test on the mic test page |
| AnalyserNode capture | AudioWorklet capture | If detection gaps appear during UI work (OSMD rendering) or you need every sample for onset detection |
| OSMD | VexFlow 5.9 directly | Only for tiny custom notation widgets |
| Canvas 2D | PixiJS 8.23 | Only if profiling shows Canvas 2D dropping frames |
| Tone.js | Hand-written look-ahead scheduler ("A Tale of Two Clocks" pattern) | If bundle size matters or Tone's context handling conflicts with mic setup. About 80 lines of code. |
| Dexie | idb-keyval 6.3.0 | If storage stays at "a few blobs plus one progress object". Simpler, but no schema migrations. |
| GitHub Pages | Cloudflare | If the `base` sub-path causes PWA/scope trouble, or you want a nicer URL |
| Expected-note harmonic matching (chords) | Basic Pitch via onnxruntime-web | If DSP matching can't reliably separate dense LH voicings; accept the ~0.5–1 s latency |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `echoCancellation/noiseSuppression/autoGainControl: true` (the browser defaults!) | Suppresses and pumps sustained piano tones; crackle/quiet-output bugs on iOS | Set all three to `false` explicitly |
| ScriptProcessorNode | Deprecated, runs on the main thread, glitchy | AnalyserNode (v1) or AudioWorklet |
| Hard-coded 44100 sample rate | iOS often runs at 48 kHz, and track settings can disagree with the context | `audioContext.sampleRate` at runtime |
| Naive FFT-peak / HPS pitch detection | Octave errors on weak piano fundamentals; inharmonicity breaks HPS | MPM (pitchy) + expected-note check |
| CREPE / ml5 for single notes | Heavy model, latency, no gain over MPM for piano single notes | pitchy |
| @magenta/music (Onsets & Frames) | Unmaintained since 2022, old tfjs, heavy, batch-only | Harmonic matching; Basic Pitch as an experiment |
| Converting MIDI to sheet music in the browser | Unsolved quality problem (quantisation, spelling, voices) | MusicXML as the source; MIDI gets falling notes only |
| typescript-eslint (current 8.73) | Peer-requires TS < 6.1, so it conflicts with the template's TS 7 | oxlint (template default) |
| Hash-based routing (`HashRouter`, `#/song/1`) | Can trigger repeated mic-permission prompts in iOS standalone mode | State-based screen switching (Zustand) |
| Separate AudioContexts for mic and metronome | iOS session conflicts, resume/gesture problems, double latency | One shared context; `Tone.setContext(ctx)` |
| SVG/DOM elements for falling notes | Per-frame layout jank on iPad | Canvas 2D |
| Netlify Free for new accounts | Credit model; site pauses when credits run out | GitHub Pages |
## Stack Patterns by Variant
- Same stack. Desktop Safari/Chrome mics are usually better in the bass, so you can lower the noise gate.
- Raise the window to 8192 samples for the low register only (the score tells you the expected range), and/or accept octave-shifted estimates when the spectrum confirms the target's f0 or 2nd partial.
- Add a `ChordVerifier` next to the `PitchVerifier`. Both consume the same audio frames and expose `matches(expectedNotes[]) → {ok, perNote}`. Start with harmonic salience (fft.js). Benchmark Basic Pitch ONNX only after that.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite@8.3.x | @vitejs/plugin-react@6.3.0 | plugin-react 6 peer-requires `vite ^8` |
| vite@8.3.x | vite-plugin-pwa@2.0.0 | Peer: `vite ^3 … ^8`; needs `workbox-build`/`workbox-window ^7.4.1` (installed as dependencies) |
| typescript@~7.0.2 | oxlint | OK. **Not** typescript-eslint 8.73 (`typescript <6.1`). |
| opensheetmusicdisplay@3.0.0 | React 19 | 3.0 bundles VexFlow internally and adds `destroy()` for unmount. No longer patches `Array.prototype` (good). `load()` now always rejects on failure, so wrap it in try/catch. |
| tone@15.1.22 | Shared native AudioContext | Depends on standardized-audio-context; use `Tone.setContext()` with your own context |
| @spotify/basic-pitch@1.0.1 | @tensorflow/tfjs ^3.2 | Old tfjs line; would conflict with tfjs 4.22 if both were installed. Prefer an ONNX export with onnxruntime-web 1.31. |
| pitchy@4.1.0 | ESM bundlers (Vite) | ESM-only; fine in Vite, and also inside an AudioWorklet if bundled |
| AudioWorklet | iOS Safari ≥ 14.5 | caniuse: supported through iOS 27.x |
| WebGPU (onnxruntime-web) | iPadOS 26+ | Only relevant for the ML chord experiment |
## Sources
- npm registry (`npm view`, 2026-11-22): react 19.3.1, vite 8.3.8, typescript 7.0.2, create-vite 9.3.4 react-ts template (TS ~7.0.2, oxlint), pitchy 4.1.0, @tonejs/midi 2.0.28, opensheetmusicdisplay 3.0.0 / 2.3.1, vexflow 5.9.0, tone 15.1.22, dexie 4.4.7, dexie-react-hooks 4.4.0, idb 8.0.4, idb-keyval 6.3.0, zustand 5.1.0, vite-plugin-pwa 2.0.0 (peers), @vitejs/plugin-react 6.3.0 (peers), pixi.js 8.23.0, @spotify/basic-pitch 1.0.1 (deps), onnxruntime-web 1.31.1, @magenta/music 1.23.1 (last modified 2022), pitchfinder 2.3.4, typescript-eslint 8.73.0 (peers): HIGH
- [OSMD GitHub releases](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/releases): 3.0.0 breaking changes, bundled VexFlow, destroy(), cursor fixes: HIGH
- [pitchy README](https://raw.githubusercontent.com/ianprime0509/pitchy/main/README.md): MPM algorithm, API, ESM-only: HIGH
- [Basic Pitch inference.ts](https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/src/inference.ts): 22,050 Hz, 2 s windows, 30-frame overlap: HIGH
- [caniuse AudioWorklet](https://caniuse.com/mdn-api_audioworklet): Safari 14.1+, iOS 14.5+: HIGH
- WebKit bugs: [244203](https://bugs.webkit.org/show_bug.cgi?id=244203) (AudioWorklet capture / sample-rate mismatch), [311451](https://bugs.webkit.org/show_bug.cgi?id=311451) (degraded audio with mic on iOS 26.4), [326286](https://bugs.webkit.org/show_bug.cgi?id=326286) (echoCancellation crackle, iOS 27), [218012](https://bugs.webkit.org/show_bug.cgi?id=218012) / [262759](https://bugs.webkit.org/show_bug.cgi?id=262759) (play-and-record volume), [215884](https://bugs.webkit.org/show_bug.cgi?id=215884) / [226620](https://bugs.webkit.org/show_bug.cgi?id=226620) / [204467](https://bugs.webkit.org/show_bug.cgi?id=204467) (standalone permission prompts): MEDIUM
- [web.dev: WebGPU supported in major browsers](https://web.dev/blog/webgpu-supported-major-browsers) and [Safari 26 release notes](https://developer.apple.com/tutorials/data/documentation/safari-release-notes/safari-26-release-notes.md): WebGPU on iPadOS 26: HIGH
- [arXiv 2509.07586, Minimum-latency real-time piano transcription](https://arxiv.org/abs/2509.07586v1): 128–320 ms online latency: MEDIUM
- [Magenta Onsets and Frames](https://magenta.tensorflow.org/onsets-frames): background: MEDIUM
- [Cloudflare: migrate from Pages to Workers static assets](https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/), [Cloudflare blog: Pages and Workers converging](https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/): MEDIUM-HIGH
- [Netlify credit-based pricing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [Netlify pricing update changelog](https://www.netlify.com/changelog/netlify-pricing-update-introducing-credit-based-plans/): MEDIUM
- Training data (unverified this session, so check during implementation): Safari 7-day storage eviction and its home-screen exemption; `navigator.audioSession` availability (Safari 16.4+); Vite `?worker&url` worklet loading pattern; whether ml5 1.x still has pitchDetection: LOW-MEDIUM
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
