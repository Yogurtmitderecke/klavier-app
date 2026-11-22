# Project Research Summary

**Project:** Klavier-App (Arbeitstitel)
**Domain:** Browser-based piano practice PWA that listens to an acoustic piano through the microphone (iPad Safari first, single user, local-only, German UI)
**Researched:** 2026-11-22
**Confidence:** MEDIUM (library and architecture choices are solid; pitch detection on the user's real piano and iPad Safari behaviour can only be confirmed by testing on the device)

## Executive Summary

This is a personal practice tool in the category of falling-notes / wait-mode piano apps. Unlike Synthesia and the open-source apps (all MIDI-only), it listens to an acoustic piano through the iPad microphone — both the point of the project and its main risk. Experts build this as three separate worlds: a real-time world outside React (audio capture, pitch detection, clock, canvas drawing), a pure-TypeScript domain world (song model in ticks, PracticeEngine state machine, scorer, NoteTracker), and a thin React UI that only reads coarse snapshots. One shared timeline (`Transport.currentTick`) drives both the falling-notes canvas and the OSMD sheet view.

Recommended approach: pitchy (McLeod pitch method) with all browser voice processing disabled, wrapped in our own gate, onset detection, stability window and calibration. In wait mode the app knows which note it expects, so the question changes from "which note is this?" to "is the expected note sounding, with a fresh onset?". That defuses most acoustic-piano problems (octave errors, ringing notes, pedal, repeated notes). Content is self-set MusicXML (MuseScore) for the 4–5 library songs, so sheet music and falling notes come from one source and licensing is clean. Uploaded MIDI gets falling notes only in v1. Hosting is GitHub Pages with HTTPS, set up in phase 1 so every later phase can be tested on the iPad at the piano.

Key risks and mitigations:
1. iOS voice processing, sample-rate mismatch and the AudioContext/permission lifecycle can silently break detection → verify on the real iPad on the very first mic page (`getSettings()`, sample-rate readout).
2. Raw "pitch equals expected" logic fails on repeated notes (Für Elise E–D#–E) → onset detection is mandatory before wait mode.
3. OSMD/sheet sync and MIDI quirks → design the song model (ticks, steps, hands, pickup) before any view.
4. "Public domain" ≠ "free edition" → only self-set versions, sources recorded.
5. iPad screen lock and PWA mic quirks → supervisor, wake lock, early standalone-mode testing.

## Key Findings

### Recommended Stack

Standard `npm create vite@latest` react-ts scaffold (React 19.3, Vite 8.3, TypeScript ~7.0, oxlint; do not add typescript-eslint — conflicts with TS 7). Details in `STACK.md`.

- **pitchy 4.1.0 (MPM):** monophonic pitch + clarity, behind a `PitchSource` interface (pitchfinder YIN as A/B fallback).
- **Web Audio (AnalyserNode, fftSize 4096):** capture in v1, AudioWorklet as later swap-in. One shared AudioContext created on a tap. `echoCancellation/noiseSuppression/autoGainControl: false` as plain booleans. Always read `audioContext.sampleRate`.
- **OpenSheetMusicDisplay 3.0.0 (pin exact; fallback 2.3.1):** MusicXML rendering with built-in cursor. Render once per song.
- **@tonejs/midi 2.0.28:** parse uploaded MIDI (ticks/PPQ, not seconds).
- **Canvas 2D + DOM/SVG keyboard** for falling notes. No PixiJS.
- **Tone.js 15.1.x or hand-written lookahead scheduler** for metronome/transport on the shared AudioContext.
- **Dexie 4.4.x + Zustand 5.1.x:** IndexedDB for uploads/progress, localStorage `persist` for settings. State-based screen switching, no hash router.
- **vite-plugin-pwa 2.0.0 + @vite-pwa/assets-generator.**
- **GitHub Pages via GitHub Actions** (set Vite `base`). Cloudflare fallback; avoid Netlify Free.
- **Vitest + MuseScore 4 (authoring):** synthetic signals + WAV fixtures from the user's piano.

### Expected Features

**Must have (v1):** mic test page (German note name, octave, cents, clarity, level, sample rate, `getSettings()`); calibration (tuning offset capped ~±60 ct, noise floor, sensitivity, persisted); onset-aware monophonic detection; unified note model (MusicXML library, MIDI uploads); falling notes + keyboard with green/red feedback (colour + symbol); wait mode (monophonic) + accuracy per run — V1 success criterion with Für Elise; OSMD sheet view with cursor + view toggle; hands R/L/"both" (v1: wait for RH, show LH); tempo 30–100 %, loop over bars, visual metronome; 4–5 self-set PD songs; MIDI upload (falling notes only); local progress; PWA, wake lock, landscape-first, large German UI (readable at 60 cm), German note names (H, Cis, …), credits screen, German hosting guide.

**Should have:** always-visible "what I hear" readout; measured tuning calibration; octave-tolerance toggle and "schnell/sicher" slider; problem-spot tracking per bar; auto-restart loop after N errors; finger numbers; MusicXML upload; JSON backup export/import; optional audible metronome with click gating.

**Defer (v2+):** chord / two-hand detection; combined sheet + falling view; per-register tuning; timing feedback; other-hand playback (headphones only); statistics and daily goals.

**Anti-features:** backing track/speaker playback while listening, score following, rhythm grading, MIDI-to-notation, gamification, accounts, scraping MuseScore.com, MIDI keyboard support.

### Architecture Approach

Real-time core outside React, pure-TS domain layer, React subscribing only to coarse snapshots (`useSyncExternalStore`). One-way flow: Audio → PitchFrames → NoteTracker → NoteEvents → PracticeEngine → Transport/noteStates → renderers. Song model in ticks (seconds via TimeMap × tempoScale). Wait mode operates on "steps" (notes grouped by onset). Both views project from the same `currentTick`/step index; OSMD moves only on step change via a precomputed cursor-step→tick map. Details in `ARCHITECTURE.md`.

**Major components:**
1. AudioEngine + PitchSource (single AudioContext, mic stream, supervisor for suspended/interrupted/ended)
2. Calibration + NoteTracker (hz→midi/cents with offset, gate, clarity, onset, stability, debounce, optional `expectedMidi` hint)
3. Song model + importers + TimeMap + steps
4. PracticeEngine (idle, countIn, waiting, passComplete) + Scorer
5. FallingNotesRenderer (canvas, rAF) and SheetMusicView (OSMD wrapper)
6. Metronome (lookahead, visual by default) and Persistence

### Critical Pitfalls

Full list of 16 in `PITFALLS.md`. Decisive ones:
1. **Voice processing & sample-rate mismatch (P1, P9)** — plain-boolean constraints, never hard-code sample rate; constant ~147 ct offset = sample-rate bug.
2. **Octave errors, weak bass, window length (P2, P3)** — expected-note-guided matching (accept ±12 when f0 energy confirms), clarity threshold, longer window for low notes; test C2/C3 before promising left-hand mode.
3. **Repeated notes, sustain, pedal (P4, P5)** — wait mode on onset+pitch events, grace window after advance, noise-floor calibration, pedal test.
4. **iOS lifecycle (P6, P8)** — context + `getUserMedia` in one tap; supervise `statechange`/`ended`/`visibilitychange`; rebuild on tap; re-request wake lock (standalone needs iPadOS 18.4+); no hash routing.
5. **Song model & view sync (P11, P12)** — tick model first (hands, pickup, tempo map, tie merging); bundled songs without repeat signs; sync OSMD via timestamp map.
6. **Licensing (P14)** — only self-set versions from PD originals, source + licence per song.

## Implications for Roadmap

Reconciled into 11 small phases (fine granularity), each ending with something testable at the acoustic piano on the iPad.

### Phase 1: Skeleton + HTTPS deploy
Vite/React/TS app with large-type German shell, state-based screens, GitHub Actions → GitHub Pages (correct `base`), `isSecureContext` check with German error, visible version number. **Piano test:** open URL on iPad, tap "Start". Avoids P7.

### Phase 2: Mic test page (go/no-go)
AudioEngine (tap-to-start, one AudioContext, raw-mic constraints), AnalyserNode 4096 + pitchy behind `PitchSource`, hz→midi/cents with German names, live note/octave/cents, clarity, level meter, sample rate, `getSettings()`, context state, simple onset indicator; minimal manifest to try standalone mode. **Piano test:** single keys incl. C2/C3; held note detected ≥2 s; A4 ≈ 440 ±10 ct; Safari tab and home-screen. Avoids P1, P9, P6, P8.

### Phase 3: Calibration
"Play A to set" tuning offset (capped), 3 s noise-floor measurement, sensitivity + min-clarity sliders, persisted (Zustand), ±40–50 ct tolerance. **Piano test:** talking/background noise don't trigger; offset stable. Avoids P10, P5.

### Phase 4: Onset detection + NoteTracker
Pure TS, unit-testable with WAV fixtures. Gate, quantize, onset, stability K=2–3, debounce/re-arm, refractory window, optional octave guard, `expectedMidi` hint, event log on mic page. **Piano test:** E-E-E and E-D#-E-D#-E log exactly one event per strike; strike→feedback < ~100 ms for ≥C4. Avoids P4, P2, P16.

### Phase 5: Song model + MusicXML import + first self-set piece
`Song`/`SongNote`/`Step` in ticks, TimeMap, MusicXML importer (staff 1/2 = R/L, tie merging, pickup, measures), steps by onset with defined V1 rule for multi-note steps, Für Elise opening authored in MuseScore (no repeat signs, source/licence metadata), Vitest tests, debug note list. **Piano test:** debug list matches printed score. Avoids P11, P12, P14.

### Phase 6: Falling notes + keyboard (no mic)
Canvas 2D rAF renderer (DPR ≤2), keyboard zoomed to song range, German labels toggle, Transport clock in play mode, "what I hear" strip. **Piano test:** watch Für Elise fall at 50 %. Avoids P13, P15 (keep bottom 10 % free).

### Phase 7: Wait mode (V1 success criterion)
PracticeEngine waiting state (RH, one step at a time), mic→tracker→engine, `expectedMidi` hint, pitch-class/octave-tolerant matching, green/red + symbol, mild wrong-note feedback, accuracy per run, large "Nochmal/Weiter" buttons. **Piano test:** whole Für Elise opening without false advance or stall; repeat with pedal. Avoids P4, P5, P2.

### Phase 8: Sheet-music view (OSMD) + shared cursor
OSMD wrapper (render once, `destroy()`, try/catch), cursor-step→tick map, cursor follows wait-mode step, note colouring, view toggle keeping position, zoom 2–3 systems. **Piano test:** same piece from notation, cursor in sync through rests/ties. Avoids P12, P13, P15.

### Phase 9: Practice tools
Hands R/L/"both" (wait for R, show L dimmed), tempo 30–100 % (scroll speed + metronome only), loop over bars, visual metronome (optional click with ~30 ms detection gating), restart/prev/next bar. **Piano test:** loop bars 1–4 LH at 60 %. Avoids P3, P16, P15.

### Phase 10: Library, MIDI upload, persistence
Remaining 3 self-set pieces, library page + credits/sources screen, Dexie (uploads, progress, last position), `navigator.storage.persist()`, MIDI upload with hand-assignment dialog (track guess, split at middle C, pickup offset), 1 MB cap, falling notes only with German hint on sheet tab, JSON backup export/import. **Piano test:** progress persists across reload; own MIDI works. Avoids P11, P14.

### Phase 11: PWA, lifecycle supervisor, wake lock, German hosting guide
vite-plugin-pwa (autoUpdate, precache MusicXML), iPad icons, audio-session supervisor ("Mikrofon pausiert – tippen zum Fortsetzen"), wake lock on `visibilitychange`, "Mikrofon aktiv" indicator, German step-by-step hosting guide for non-programmers. **Piano test:** install on iPad; 15-min session without auto-lock; lock/unlock recovers with one tap; offline load; update arrives. Avoids P6, P8, stale SW cache.

### Phase Ordering Rationale
- Risk first: phases 1–4 clear the go/no-go for the Core Value.
- Model before views: phase 5 precedes 6 and 8.
- Core value before polish: wait mode (7) before sheet music (8) and tools (9).
- Phases 5/6 need no mic and can overlap with tuning in 3/4.
- PWA last, probed early via minimal manifest in phase 2.

### Decisions Resolved by Research
- Bundled songs: self-set MusicXML from PD originals; avoid the CC BY-SA Mutopia Moonlight file — transcribe from a pre-1925 edition.
- Uploaded MIDI: falling notes only in v1; sheet tab shows "Notenansicht nur für MusicXML-Stücke". MusicXML upload is a cheap v1.x add.
- Metronome: visual by default; audible click optional with gating.
- "Both hands" in v1: wait for RH, show LH.
- Note names: German by default (H, B = B♭, Cis, Dis, Fis…), international toggle.
- Tempo in wait mode: scroll speed and metronome only; pitch-only grading.
- No router library, no speaker output while listening, no ScriptProcessorNode.

### Later: Polyphonic / Chord Options (user asked for explanation; not v1)
Blind chord recognition is unreliable in a browser with an acoustic piano. Because the app knows which chord should come, it can check whether those notes are sounding — realistic.
1. **Expected-note harmonic matching (own DSP) — do first.** Sum energy at ~6 partials per expected note (inharmonicity-corrected) from a long FFT (8192–16384) or Goertzel filters; accept if all expected notes clearly exceed the noise floor after an onset and no strong unexpected note is present. Pure JS, ~100–200 ms latency. Weak: semitone-apart bass notes, octave doublings. MEDIUM confidence.
2. **Spotify Basic Pitch via onnxruntime-web — experiment only.** 2 s windows, ~0.3–1 s latency (estimate). WebGPU only on iPadOS 26+.
3. **Not recommended:** Magenta Onsets-and-Frames (unmaintained), research low-latency models.
Suggested v2 phase "Akkorde per Erwartungsabgleich": spike on mic page with recorded chords, then wire into wait mode for "both hands".

### Research Flags
Needs research: Phase 2 (pitchy vs YIN on real piano, bass window, `getSettings()`), Phase 4 (onset thresholds, acceptance rule, fixtures), Phase 8 (OSMD 3.0 cursor, colouring, repeats), Phase 11 (iPadOS version, standalone mic permission).
Standard patterns: Phases 1, 3, 5, 6, 7, 9, 10.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Versions verified against npm 2026-11-22. OSMD 3.0.0 is one day old (pin, fallback 2.3.1). |
| Features | MEDIUM | Competitor info from vendor pages/reviews; Mutopia licences verified per piece; §70 UrhG reading not legal advice. |
| Architecture | MEDIUM-HIGH | Established patterns; OSMD cursor sync is custom work. |
| Pitfalls | MEDIUM | iOS/WebKit behaviour changes per release; OSMD iPad perf unbenchmarked. |

**Overall confidence:** MEDIUM

### Gaps to Address
- Real-piano detection quality — record fixtures in phases 2 and 4; thresholds are starting values.
- Bass range (< C3) on iPad mic — decide end of phase 4 whether LH mode is promised or "experimentell".
- User's iPadOS version — ask in phase 1.
- Standalone-PWA mic behaviour — test in phase 2, decide in phase 11.
- OSMD cursor with repeats/colouring — verify in phase 8.
- No Mac for Safari Web Inspector? → mic page doubles as in-app debug panel with ring-buffered log.
- Authoring workload — Für Elise first (phase 5), others in phase 10.
- Public repo — bundled files publicly downloadable; acceptable with self-set versions.

## Sources
- **Primary (HIGH):** npm registry (2026-11-22); OSMD GitHub releases; pitchy README; caniuse AudioWorklet & Wake Lock; Safari 18.4 release notes; Mutopia piece pages (931, 5, 37, 276) and legal page; Basic Pitch `inference.ts`.
- **Secondary (MEDIUM):** WebKit Bugzilla (244203, 311451, 326286, 273511, 283419, 215884, 226620, 252465, 204681, 319706); vendor help pages (generic features only); Cloudflare/Netlify pricing; IMSLP PD policy; arXiv 2509.07586.
- **Tertiary (LOW):** Safari storage eviction, `navigator.audioSession`, worklet bundling pattern, DSP thresholds, OSMD iPad perf, ml5 status.

---
*Research completed: 2026-11-22*
*Ready for roadmap: yes*
