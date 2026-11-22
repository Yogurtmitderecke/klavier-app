# Architecture Research

**Domain:** Browser piano-learning app (acoustic piano via microphone, falling notes + sheet music, wait mode, local-only PWA)
**Researched:** 2026-11-22
**Confidence:** MEDIUM-HIGH. The Web Audio and pitch-detection patterns are established and well documented. Syncing the sheet-music cursor with OSMD is MEDIUM: the API exists, but OSMD has no official "follow playback" feature, so we have to build that ourselves.

---

## Standard Architecture

The core idea: **keep three worlds separate.**
1. **Real-time world** (audio, detection, clock, canvas drawing). Runs outside React. It uses mutable objects and loops (`requestAnimationFrame`, `setInterval`, audio-thread callbacks).
2. **Domain world** (song model, practice engine, scoring). Pure TypeScript with no browser APIs, so it can be unit-tested.
3. **UI world** (React). Menus, settings, library, and the low-frequency status display. It only *subscribes* to coarse state changes (for example "step changed", "pass finished"). It never re-renders per audio frame.

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         UI LAYER (React, low frequency)                   │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Library  │ │ Practice  │ │ Mic-Test / │ │ Settings │ │ Results     │  │
│  │ page     │ │ page/HUD  │ │ Calibration│ │ page     │ │ (per pass)  │  │
│  └────┬─────┘ └─────┬─────┘ └─────┬──────┘ └────┬─────┘ └──────┬──────┘  │
│       │   useSyncExternalStore (coarse snapshots only)          │         │
├───────┴─────────────┴─────────────┴─────────────┴───────────────┴─────────┤
│                    VIEW LAYER (imperative, per frame)                     │
│  ┌──────────────────────────┐   ┌────────────────────────────────────┐    │
│  │ FallingNotesRenderer     │   │ SheetMusicView (OSMD wrapper)      │    │
│  │ <canvas>, rAF, reads     │   │ cursor moved on step/tick change,  │    │
│  │ playhead each frame      │   │ note colouring, auto-scroll        │    │
│  └────────────▲─────────────┘   └──────────────────▲─────────────────┘    │
│               │ reads playhead (tick) + note states │                     │
├───────────────┴─────────────────────────────────────┴─────────────────────┤
│                    DOMAIN LAYER (pure TS, testable)                       │
│  ┌──────────────┐   ┌──────────────────────────────┐   ┌──────────────┐   │
│  │ Song model   │──▶│ PracticeEngine (state machine)│──▶│ Scorer       │   │
│  │ + TimeMap    │   │ wait / play, loop, tempo,    │   │ hits/misses  │   │
│  │ (ticks↔sec)  │   │ hand filter, owns Transport  │   │ per pass     │   │
│  └──────▲───────┘   └──────▲───────────────▲───────┘   └──────────────┘   │
│         │                  │ NoteEvents    │ clock                        │
│  ┌──────┴───────┐   ┌──────┴───────┐ ┌─────┴────────┐                     │
│  │ Importers    │   │ NoteTracker  │ │ Transport /  │──▶ Metronome        │
│  │ MIDI,MusicXML│   │ (onset,      │ │ Playhead     │    (lookahead       │
│  └──────────────┘   │ stability,   │ │ clock        │     scheduler)      │
│                     │ debounce)    │ └──────────────┘                     │
├─────────────────────┴──────▲───────┴──────────────────────────────────────┤
│                    AUDIO LAYER (Web Audio, real-time)                     │
│  getUserMedia ─▶ MediaStreamSource ─▶ (HighPass) ─▶ AnalyserNode          │
│                                       or AudioWorklet ring buffer         │
│                  ─▶ PitchDetector (pitchy/McLeod) ─▶ PitchFrame stream    │
│  Calibration applied here: tuning offset (cents), noise gate, clarity min │
├───────────────────────────────────────────────────────────────────────────┤
│                    PERSISTENCE LAYER                                      │
│  ┌────────────────┐  ┌──────────────────────┐  ┌────────────────────┐     │
│  │ settings       │  │ user songs (MIDI     │  │ progress (best     │     │
│  │ (localStorage) │  │ blobs, IndexedDB)    │  │ score per song/    │     │
│  └────────────────┘  └──────────────────────┘  │ loop, IndexedDB)   │     │
│                                                 └────────────────────┘     │
└───────────────────────────────────────────────────────────────────────────┘
```

**Data direction is one-way:** Audio → PitchFrames → NoteTracker → NoteEvents → PracticeEngine → (Playhead + note states) → Renderers. React reads snapshots. It never pushes data back into the audio path, except to change settings and send commands (start, stop, setTempo, setLoop).

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **AudioEngine** | Owns the single `AudioContext`. Unlocks it on a user gesture, opens the mic, builds the node graph, and tears it down. | Singleton class. `getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}})`, `ctx.resume()` inside a tap handler. |
| **PitchDetector** | Turns a buffer of samples into `{hz, clarity, rms, time}`. | `pitchy` (McLeod). `PitchDetector.forFloat32Array(N)` + `findPitch(buf, sampleRate)` returns `[hz, clarity]`. Start with `AnalyserNode.getFloatTimeDomainData` polled about every 20–30 ms. Keep it behind an interface so it can move into an AudioWorklet later. |
| **Calibration** | Applies the tuning offset in cents, the noise gate (RMS threshold in dB), the minimum clarity, and the allowed note range (A0–C8, or narrower). | A pure function `hz → {midi, cents}` that uses `a4 = 440 * 2^(offsetCents/1200)`. Parameters come from the settings store. |
| **NoteTracker** | Turns noisy PitchFrames into discrete `NoteOn(midi, time)` / `NoteOff` events, using onset detection, a stability window, debounce, and an octave-error guard. | A small state machine (see Pattern 3). Plain TS with no DOM, so it can be unit-tested with recorded frame arrays. |
| **Song model + Importers** | One internal format for every source. | `@tonejs/midi` → Song. MusicXML → Song (own parser or OSMD iteration, see Pattern 5). |
| **TimeMap** | Converts between ticks and seconds using the tempo map and the tempo-scale factor. Also converts ticks to measure numbers. | A precomputed array of tempo segments with binary search. |
| **Transport / Playhead** | Holds the single source of truth for "where are we": `currentTick`. It advances with the clock (in play mode) or jumps to the next step (in wait mode). | A mutable object plus a tiny emitter. Driven by `AudioContext.currentTime` (not `Date.now()`) so the metronome stays in sync. |
| **PracticeEngine** | A state machine: idle → countIn → waiting/playing → passComplete. Handles wait mode, loop region, hand filter, and tempo. Decides what counts as a hit or a miss. | A hand-written reducer-style class, or XState if preferred. Consumes NoteEvents and clock ticks, and emits step changes and note-state changes. |
| **Scorer** | Counts hits, wrong notes, and per-note result colours. Produces the accuracy % for each pass. | A pure class whose results are attached to the pass. |
| **Metronome** | Click sound plus count-in, sample-accurate, following the tempo scale. | The "Tale of Two Clocks" lookahead scheduler: a `setInterval` of about 25 ms that schedules `OscillatorNode` clicks about 100 ms ahead on `ctx.currentTime`. |
| **FallingNotesRenderer** | Draws the keyboard and falling bars on a `<canvas>`. Reads the playhead and note states every frame. | An imperative class mounted from a React `useEffect`. Uses `requestAnimationFrame` and `devicePixelRatio` scaling. |
| **SheetMusicView** | Renders MusicXML with OSMD. Moves the cursor to the current step, colours notes green or red, and auto-scrolls. | OSMD wrapper. The cursor moves only on *step changes* (a few per second), never per frame. |
| **Persistence** | Settings, user-uploaded files, and progress. | Settings go in `localStorage` (small, synchronous). Songs and progress go in IndexedDB via `idb-keyval` or `idb`. Call `navigator.storage.persist()`. |
| **UI store** | Coarse app state for React: current page, selected song, engine status, last results. | Zustand, or a hand-written store + `useSyncExternalStore`. |

---

## Recommended Project Structure

```
src/
├── audio/                    # REAL-TIME, no React
│   ├── AudioEngine.ts        # AudioContext lifecycle, mic, unlock on gesture
│   ├── PitchSource.ts        # interface + AnalyserNode impl (worklet impl later)
│   ├── pitch.ts              # hz <-> midi/cents, A4 offset (pure)
│   ├── NoteTracker.ts        # frames -> NoteOn/NoteOff (pure, tested)
│   └── Metronome.ts          # lookahead scheduler
├── song/                     # DOMAIN: data model
│   ├── types.ts              # Song, NoteEvent, Track, Measure, TempoEvent
│   ├── TimeMap.ts            # ticks <-> seconds, tick -> measure
│   ├── importMidi.ts         # @tonejs/midi -> Song
│   ├── importMusicXml.ts     # MusicXML -> Song
│   └── steps.ts              # group notes into "steps" (same onset tick)
├── practice/                 # DOMAIN: logic, pure TS
│   ├── Transport.ts          # playhead tick, play/pause, tempo scale
│   ├── PracticeEngine.ts     # state machine: wait/play/loop/hands
│   ├── Scorer.ts
│   └── __tests__/            # replay recorded NoteEvents against songs
├── render/                   # VIEW: imperative renderers
│   ├── FallingNotesRenderer.ts
│   ├── keyboardLayout.ts     # midi -> x/width (white/black keys)
│   └── SheetMusicView.ts     # OSMD wrapper + step<->cursor map
├── storage/
│   ├── settings.ts           # localStorage, versioned schema
│   └── db.ts                 # IndexedDB: userSongs, progress
├── state/
│   └── appStore.ts           # coarse UI state (zustand / external store)
├── ui/                       # React components, German copy
│   ├── pages/  (MicTest, Calibration, Library, Practice, Settings)
│   ├── components/
│   └── hooks/  (useEngineSnapshot, useCanvasRenderer)
├── content/songs/            # bundled public-domain MusicXML (+ metadata.json)
└── main.tsx
```

### Structure Rationale

- **audio/, song/, practice/ have zero React imports.** That is what keeps the hot path out of React's render cycle, and it lets Vitest test the hard logic (NoteTracker, PracticeEngine) without a browser.
- **render/ is imperative.** React mounts a `<canvas>` or `<div>` and hands the element to a renderer class. The renderer runs its own loop.
- **content/songs/ ships MusicXML, not MIDI**, because only MusicXML gives us both sheet music *and* notes from one file (see Pattern 5).

---

## Architectural Patterns

### Pattern 1: Real-time core outside React ("engine + snapshot")

**What:** Audio, detection, transport, and rendering live in plain TS objects created once per session (for example in a module-level singleton or a `useRef`). React subscribes to a **coarse snapshot** that changes only on meaningful events: status, current step index, last detected note (throttled to about 10 Hz for the mic page), and pass results.
**When to use:** Always in this app. A 60 Hz `setState` from the pitch loop re-renders the tree and causes jank, which is especially noticeable on an iPad.
**Trade-offs:** Slightly more boilerplate (a subscribe/getSnapshot pair), but performance is predictable.

```typescript
// practice/engineStore.ts
type Snapshot = { status: 'idle'|'countIn'|'waiting'|'playing'|'done'; stepIndex: number; hits: number; misses: number };
class EngineStore {
  private snap: Snapshot = { status: 'idle', stepIndex: 0, hits: 0, misses: 0 };
  private listeners = new Set<() => void>();
  subscribe = (l: () => void) => (this.listeners.add(l), () => this.listeners.delete(l));
  getSnapshot = () => this.snap;
  set(p: Partial<Snapshot>) { this.snap = { ...this.snap, ...p }; this.listeners.forEach(l => l()); }
}
// React: const s = useSyncExternalStore(store.subscribe, store.getSnapshot);
```

The canvas renderer does **not** use this store. It reads `transport.currentTick` and `engine.noteStates` directly in its own rAF loop.

### Pattern 2: Pluggable pitch source (start simple, AudioWorklet optional)

**What:** `interface PitchSource { start(): void; stop(): void; onFrame(cb: (f: PitchFrame) => void): void }`.
- **v1 implementation: AnalyserNode polling.** Use `fftSize = 2048` (about 46 ms at 44.1 kHz; 4096 gives better accuracy for low bass notes), `getFloatTimeDomainData` → `pitchy.findPitch` in a `setInterval(…, 20)` on the main thread. This is the simplest option, it is known to work in iOS Safari, and the CPU cost is small for one detector.
- **v2 (only if needed): AudioWorklet.** The worklet collects 128-sample render quanta into a ring buffer and posts windows (or results) to the main thread via `port.postMessage`. Benefit: no gaps when the main thread is busy (for example while OSMD renders). Cost: worklet module loading in Vite (`new URL('./worklet.ts', import.meta.url)`) and bundling pitchy into the worklet scope.
**Trade-offs:** The polled Analyser can miss frames during heavy main-thread work (OSMD layout). In wait mode that is acceptable, because the user is holding a note anyway.

```typescript
type PitchFrame = { t: number /* ctx.currentTime */; hz: number; clarity: number; rmsDb: number };
```

### Pattern 3: NoteTracker, from frames to note events (onset, stability, debounce)

This is the most important piece for the app's core value. Raw pitch on an acoustic piano jumps around: the attack transient, octave errors from strong 2nd harmonics, sympathetic resonance, and the sustain pedal smearing notes.

**Rules (all thresholds live in Calibration and can be tuned on the Mic-Test page):**
1. **Gate:** drop a frame if `rmsDb < noiseGateDb` or `clarity < minClarity` (start around 0.85–0.9).
2. **Quantize:** `midi = round(69 + 12*log2(hz/a4))`, where `a4` includes the tuning offset. Keep `cents` for display.
3. **Onset:** an RMS rise of more than X dB within about 50 ms marks a new attack. This lets a *repeated* identical note count again, which is essential for repeated notes such as the E–D# trill in Für Elise.
4. **Stability:** emit `NoteOn(midi)` only after the same midi is seen in K consecutive frames (K≈2–3, about 40–80 ms), with stable frames counted since the last onset.
5. **Debounce / re-arm:** after emitting midi m, don't emit m again until a new onset is detected *or* the note has been absent for at least 150 ms.
6. **Octave guard (optional, phase 2+):** if the expected note is E5 and the detector says E4 or E6 with high stability, the engine can accept it as the right pitch class at the wrong octave, or treat it as a configurable "near miss". Start strict and log these cases on the mic page.
7. **NoteOff:** emitted when the frame is gated for at least 100 ms or a different stable note appears. Wait mode only needs NoteOn; scoring "held long enough" is optional.

The engine can pass a hint `expectedMidi` to the tracker. The tracker still reports what it hears, but the stability requirement can be lowered (for example K=2) when the heard note equals the expected one. That makes the app feel responsive without accepting wrong notes.

### Pattern 4: Unified Song model in ticks

```typescript
// song/types.ts
export interface Song {
  id: string; title: string; composer?: string;
  ppq: number;                       // ticks per quarter, e.g. 480 (normalize all imports to this)
  tempos: { tick: number; bpm: number }[];
  timeSignatures: { tick: number; num: number; den: number }[];
  measures: { index: number; startTick: number; endTick: number }[]; // for loop UI
  notes: SongNote[];                 // sorted by startTick, then midi
  source: { kind: 'musicxml' | 'midi'; hasSheet: boolean };
}
export interface SongNote {
  id: number;                        // stable index, used by renderers & scorer
  midi: number;                      // 21..108
  startTick: number; durationTicks: number;
  hand: 'R' | 'L';                   // from staff (MusicXML) or track/channel/split-point (MIDI)
  measureIndex: number;
  sheetRef?: { stepIndex: number };  // link to OSMD cursor step (MusicXML only)
}
// derived once:
export interface Step { index: number; tick: number; noteIds: number[] }  // notes with same onset
```

- **Ticks are the primary unit, seconds are derived** through TimeMap × tempoScale. The tempo slider never mutates the song.
- **Steps** (notes grouped by onset tick, after applying the hand filter) are the unit of wait mode. In v1 (single voice), a step must contain exactly one note to wait for. For a multi-note step, the engine waits for the *highest* note of the selected hand (melody), or the user picks "right hand only". This keeps chords from blocking progress.
- **Hand assignment:** MusicXML uses `<staff>` 1 → R and 2 → L, which is reliable. MIDI uses track 0 → R and track 1 → L when there are two tracks. Otherwise it falls back to a split point (for example midi ≥ 60 → R) that the user can change in the upload dialog.

### Pattern 5: One timeline, two views (falling notes + sheet music)

**Key decision: the shared cursor is `currentTick` in the Transport, and both views are projections of it.**

- **Falling notes:** `y = (note.startTick - currentTick) * pixelsPerTick`, evaluated every frame. In play mode `currentTick` advances smoothly. In wait mode it advances to `step.tick` and stops, so the bars "stand still". It can glide to the step tick over about 120 ms for a smooth look.
- **Sheet music (OSMD):** OSMD's cursor is *discrete*. It steps between voice entries via `cursor.next()` / `previous()` / `reset()`, and its position is `cursor.Iterator.currentTimeStamp`, a Fraction measured in **whole notes**. So:
  1. After `osmd.render()`, walk the cursor once from `reset()` to `EndReached` and record `cursorStepIndex → tick = timestamp.RealValue * 4 * ppq` (plus, optionally, the graphical notes under the cursor via `cursor.GNotesUnderCursor()` for colouring). Then `reset()`.
  2. Map each `SongNote` to the cursor step with the same tick. This is the `sheetRef.stepIndex`.
  3. When the transport's step changes, move the OSMD cursor forward with `next()` (or `reset()` + n×`next()` for loops and seeks; pieces are short, so O(n) is fine). Scroll the cursor element into view.
  4. **Update OSMD only on step change, never per animation frame.** OSMD is DOM/SVG-heavy.
- **Single source for both views:** library songs are **MusicXML**. The Song model is derived from the *same* MusicXML that OSMD renders, so ticks line up exactly. Uploaded **MIDI files have no notation information** (no beaming, spelling, or voices), so OSMD cannot render them. For MIDI uploads, sheet view should be disabled with a clear German note ("Notenansicht nur für MusicXML-Stücke"). Generating notation from MIDI (quantising with VexFlow) is a rabbit hole and should not be in v1.
- **Repeats:** OSMD's cursor and iterator can follow repeats differently than a naive XML parse does. **Recommendation:** bundled songs are authored *without* repeat signs (written out), so the two timelines cannot drift. Flag this for phase research.
- **Grace notes, ties, and tied notes in the cursor:** tied continuation notes must not become separate wait steps. Merge ties in the importer.

### Pattern 6: PracticeEngine as an explicit state machine

```
            start()                 count-in done
  idle ───────────────▶ countIn ─────────────────────┐
   ▲                                                 ▼
   │ stop()                       ┌──────────── waiting (wait mode) ◀──┐
   │                              │  correct NoteOn for step           │ next step exists
   │                              ▼                                    │
   │                          advance ──────────────────────────────────┘
   │                              │ last step of loop/song
   │                              ▼
   └──────────────────────── passComplete ──(loop enabled)──▶ countIn
```

- **Inputs:** `NoteEvent`s from the NoteTracker, the clock (in play mode), and commands (`start`, `stop`, `setTempoScale`, `setLoop(fromMeasure, toMeasure)`, `setHands('R'|'L'|'both')`, `setMode('wait'|'play')`).
- **Wait-mode rule:** NoteOn(midi) with `midi ∈ expectedStep` counts as a hit: mark the note green and advance. Any other NoteOn counts as a wrong note: flash red on the key and the note, count a miss, and don't advance. Ignore NoteOns within about 80 ms after advancing (decay of the previous note) unless they come with a fresh onset.
- **Hand filter:** non-selected-hand notes are drawn dimmed and are never waited for.
- **Loop region:** the measure range is mapped to `[startTick, endTick)` via `song.measures`. On pass complete, reset the scorer for that pass, persist the result, and restart from the loop start.
- **Tempo scale (30–100%):** only affects TimeMap → seconds (falling speed in play mode, metronome interval). In wait mode the visual scroll speed between steps is fixed.
- **Outputs:** `transport.currentTick`, the `noteStates: Map<noteId, 'pending'|'hit'|'miss'|'skipped'>`, and coarse snapshots for React.
- **Pure and deterministic:** write unit tests that feed recorded NoteEvent sequences against a Song.

### Pattern 7: Metronome with a lookahead scheduler

Use Chris Wilson's "A Tale of Two Clocks" pattern. A `setInterval` (25 ms) wakes up and schedules every click whose time falls within the next 100 ms on `audioCtx.currentTime`, using a short `OscillatorNode` or `AudioBufferSourceNode` with an envelope. The beat grid comes from TimeMap (song time signature + tempo × tempoScale). In wait mode, the metronome is normally off or runs freely as a pulse; it is not tied to steps.
**Caveat:** clicks are picked up by the mic. Use a high-pitched or noisy click (a short noise burst or 2–3 kHz woodblock) and briefly mute detection for about 30 ms around scheduled clicks, so the click doesn't produce pitch frames. With headphones there is no issue.

### Pattern 8: Persistence with versioned schemas

- `localStorage['klavier.settings.v1']`: `{ a4OffsetCents, noiseGateDb, minClarity, stabilityFrames, view, tempoScale, hands, … }`. Validate on load (for example with zod) and fall back to defaults.
- IndexedDB stores: `userSongs` (raw MIDI/MusicXML `ArrayBuffer` plus metadata) and `progress` (`{songId, loopKey, date, accuracy, durationMs}`). Store raw files, not the parsed Song, and re-import on load, so importer fixes apply retroactively.
- Call `navigator.storage.persist()` on first use. On iOS, an installed PWA's storage is less likely to be evicted than a plain Safari tab's.

---

## Data Flow

### Live note detection (hot path, about 50 Hz)

```
Mic ─▶ MediaStreamSource ─▶ BiquadFilter(highpass ~25 Hz) ─▶ AnalyserNode
   [poll 20 ms] getFloatTimeDomainData(buf)
        ─▶ rms(buf) ─▶ noise gate ─▶ pitchy.findPitch(buf, sr) ─▶ [hz, clarity]
        ─▶ Calibration(hz, a4Offset) ─▶ PitchFrame{midi, cents, clarity, rmsDb, t}
        ─▶ NoteTracker ─▶ NoteOn/NoteOff
        ─▶ PracticeEngine.onNote() ─▶ transport.currentTick, noteStates
              ├─▶ FallingNotesRenderer (reads every rAF)
              ├─▶ SheetMusicView (on step change only)
              └─▶ EngineStore.set() ─▶ React HUD (status, accuracy)
```

### Play-mode clock

```
rAF tick ─▶ transport.update(ctx.currentTime) ─▶ currentTick = TimeMap.secondsToTick((now - startTime) * tempoScale)
         ─▶ engine checks passed notes (miss if not played within window)
         ─▶ renderers read currentTick
Metronome scheduler (25 ms interval) ─▶ reads same TimeMap + tempoScale ─▶ schedules clicks on ctx time
```

### Song loading

```
Bundled MusicXML / uploaded file (IndexedDB)
   ─▶ importer ─▶ Song (ticks) ─▶ steps.ts ─▶ Step[]
   ─▶ (MusicXML only) OSMD.load + render ─▶ walk cursor ─▶ stepIndex↔tick map ─▶ attach sheetRef
```

### Settings / commands (cold path)

```
React UI ─▶ settings store (persist to localStorage) ─▶ Calibration params / engine commands
```

---

## Suggested Build Order (testable at the piano after every phase)

Dependencies determine the order: the audio layer and NoteTracker are needed by everything, while the Song model and renderers can be built without the mic. The order below puts the riskiest part (detection on iPad Safari) first, and every phase ends with something to try at the piano.

| # | Phase | Builds | Testable at the piano |
|---|-------|--------|-----------------------|
| 0 | **Skeleton + HTTPS deploy** | Vite/React/TS app, routing, German big-font layout, deploy to free HTTPS host (needed for the mic on iPad) | Open the URL on the iPad. "Start" button works. |
| 1 | **Mic test page** | AudioEngine (gesture unlock, raw mic constraints), AnalyserNode + pitchy, `pitch.ts`, display of note name, octave, cents, clarity, and level meter (throttled to about 10 Hz in React) | Play single keys and see "E5 +6 ct". Find out which octaves are reliable on this piano. **Go/no-go for the whole project.** |
| 2 | **Calibration + NoteTracker** | Tuning offset (with a "play A4 to set" button), noise gate, minimum clarity, stability frames; NoteTracker with onset/repeat handling; event log on the mic page; settings in localStorage | Play repeated notes (E-E-E) and fast alternations (E–D#) and check that each one appears once in the log. Talk in the room and check that nothing triggers. |
| 3 | **Song model + falling notes (no mic)** | Song types, TimeMap, MusicXML importer for one bundled piece, steps, FallingNotesRenderer with keyboard, play mode only with the transport clock | Watch Für Elise fall at 50% tempo. Check visually that it matches the score. |
| 4 | **Wait mode (core value)** | PracticeEngine (waiting state, single voice, right hand), mic → tracker → engine, green/red feedback | **Play Für Elise opening in wait mode.** This meets the V1 success criterion in an early version. |
| 5 | **Sheet-music view + shared cursor** | OSMD wrapper, cursor step↔tick map, view toggle, cursor follows the wait-mode step, note colouring | Same piece, but read from the notation, with the cursor advancing as you play. |
| 6 | **Practice controls** | Hand filter, loop region by measures, tempo slider, metronome (lookahead scheduler + click muting) with count-in, accuracy per pass | Loop bars 1–4 of the left hand at 60%. |
| 7 | **Library + persistence** | 4–5 bundled MusicXML pieces, library page, IndexedDB progress (best accuracy per song/loop), MIDI upload (falling notes only) | Pick a song, practise, reload, and see your progress. Upload your own MIDI. |
| 8 | **PWA + polish + deployment guide** | Manifest, icons, service worker (vite-plugin-pwa), iOS install instructions, German HTTPS deploy guide | Install on the iPad home screen and practise offline. Check that the mic still works in standalone mode. |

**Ordering notes:**
- Phases 1–2 must come before any UI investment. If detection on this piano or iPad is not good enough, the thresholds and NoteTracker design change, and nothing else matters (per the Core Value).
- Phase 3 doesn't need the mic, so it can overlap with tuning phase 2.
- Wait mode (4) comes **before** sheet music (5). It delivers the core value sooner, and OSMD integration is the second-riskiest piece.
- The PWA comes last, but test **mic access in standalone PWA mode on iOS** briefly in phase 1 or 2 (add a minimal manifest early). iOS standalone web apps have historically had their own getUserMedia quirks.

---

## Scaling Considerations

This is a single-user app, so "scale" means **song length and device performance**, not user count.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Short pieces (≤ 200 notes) | Linear scans are fine. Re-walking the OSMD cursor for a seek is fine. |
| Longer pieces (1000+ notes) | Falling-notes renderer: binary-search the visible window by tick instead of drawing all notes. OSMD seek: keep the precomputed step map and move relative to the current position. |
| Older iPads | Lower canvas resolution (cap `devicePixelRatio` at 2), and move pitch detection into an AudioWorklet if OSMD rendering causes detection gaps. |

### Scaling Priorities
1. **First bottleneck:** main-thread contention. OSMD render/scroll and pitch polling compete with each other. Fix: never re-render OSMD during practice; only move the cursor. Use the AudioWorklet pitch source if needed.
2. **Second bottleneck:** canvas overdraw on high-DPI iPads. Fix: visible-window culling and a static keyboard layer on a second canvas.

---

## Anti-Patterns

### Anti-Pattern 1: Pitch results in React state at audio rate
**What people do:** `setPitch(hz)` inside the detection loop.
**Why it's wrong:** 50–60 re-renders per second of the practice page cause jank on the iPad, and audio-thread timing then depends on React scheduling.
**Do this instead:** Mutable engine objects. React gets throttled or coarse snapshots via `useSyncExternalStore`. The canvas reads directly.

### Anti-Pattern 2: Treating every detected frame as a played note
**What people do:** `if (detectedMidi === expected) advance()`.
**Why it's wrong:** The tail of the previous note (sustain, reverb) or one octave-error frame triggers false advances. Repeated notes never re-trigger.
**Do this instead:** NoteTracker with gate, stability window, onset-based re-arm, and a post-advance refractory window.

### Anti-Pattern 3: Seconds as the song's primary unit
**What people do:** Store `note.time` in seconds (which is what `@tonejs/midi` exposes by default) and scale on the fly.
**Why it's wrong:** Loops by measure, tempo scaling, OSMD sync, and measure numbers all become fragile floating-point work.
**Do this instead:** Ticks (normalised PPQ) as the primary unit. Seconds come only from TimeMap × tempoScale.

### Anti-Pattern 4: Two separate clocks for the two views
**What people do:** Let OSMD's cursor and the canvas each keep their own position.
**Why it's wrong:** They drift apart, and loops and seeks need double logic.
**Do this instead:** One `Transport.currentTick` and one step index. Both views project from it.

### Anti-Pattern 5: Using `setTimeout` for metronome clicks
**Why it's wrong:** Main-thread timers jitter by tens of ms, which is audible.
**Do this instead:** The lookahead scheduler on `AudioContext.currentTime`.

### Anti-Pattern 6: Browser audio processing left on
**What people do:** `getUserMedia({audio: true})`.
**Why it's wrong:** Echo cancellation, noise suppression, and AGC are designed for speech. They can suppress sustained piano tones and pump the level, which breaks the noise gate.
**Do this instead:** Explicitly set `echoCancellation:false, noiseSuppression:false, autoGainControl:false`, and check `track.getSettings()` on the mic page to see what the browser actually applied.

### Anti-Pattern 7: Creating multiple AudioContexts / creating it on page load
**Why it's wrong:** iOS Safari starts contexts suspended, limits their number, and requires a user gesture.
**Do this instead:** One context, created and resumed inside the first "Start" tap. Handle the `interrupted`/`suspended` state (phone call, app switch) with a German "Tippen zum Fortsetzen" overlay.

---

## Integration Points

### External Libraries

| Library | Integration Pattern | Notes |
|---------|---------------------|-------|
| pitchy (McLeod) | `PitchDetector.forFloat32Array(n)`, then `findPitch(buf, sr)` → `[hz, clarity]` | ESM-only. Input length must equal the constructed size. Returns 0/0 below its volume threshold. Fits AnalyserNode or a worklet. |
| @tonejs/midi | `new Midi(arrayBuffer)` → tracks/notes with `ticks`, `durationTicks`, `midi`, `header.ppq`, `header.tempos` | Normalise to the internal PPQ. Use ticks, not `time`. |
| OpenSheetMusicDisplay | `load(xml)` → `render()`. `cursor.show()`, `next()`, `reset()`, `Iterator.currentTimeStamp` (Fraction, whole notes), `GNotesUnderCursor()` | No built-in playback sync, so we build the step map ourselves. Heavy DOM work: render once per song/zoom. Coloring notes may require re-render or direct SVG styling, so verify in phase 5. |
| vite-plugin-pwa | Manifest + Workbox service worker | Bundle MusicXML into the precache for offline use. |
| idb / idb-keyval | IndexedDB wrapper | Tiny, promise-based. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| PitchSource → NoteTracker | Callback per frame (`PitchFrame`) | Same thread in v1. `postMessage` if moved to a worklet. |
| NoteTracker → PracticeEngine | Event emitter (`NoteOn/NoteOff`) | The engine can push `expectedMidi` back as a hint (the only backward edge). |
| PracticeEngine → Transport | Direct method calls (`seekToTick`, `play`, `pause`) | The engine owns the transport. |
| Transport/Engine → Renderers | Renderers **pull** state each frame (canvas) or subscribe to `stepChanged` (OSMD) | Avoids push storms. |
| Engine → React | `useSyncExternalStore` on coarse snapshot | Throttle the mic page display to about 10 Hz. |
| React → Engine/Settings | Command methods | Settings changes apply live to Calibration params. |
| Storage ↔ everything | Async load at startup, write on change or pass end | Never called from the hot path. |

---

## Sources

- pitchy README/API (forFloat32Array, findPitch → [pitch, clarity], minVolume, McLeod method): https://github.com/ianprime0509/pitchy, https://www.npmjs.com/package/pitchy, https://cdn.jsdelivr.net/npm/pitchy@4.1.0/index.d.ts (HIGH)
- OSMD Cursor / MusicPartManagerIterator type declarations (`Iterator`, `currentTimeStamp: Fraction`, `next/previous/reset`): https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.9.7/build/dist/src/OpenSheetMusicDisplay/Cursor.d.ts, https://opensheetmusicdisplay.github.io/classdoc/classes/MusicPartManagerIterator.html (HIGH for API existence)
- OSMD wiki "Exploring the Demo" (cursor usage, `GNotesUnderCursor`, `EngravingRules.GNote`): https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/wiki/Exploring-the-Demo (MEDIUM)
- OSMD issue #1263, play/pause cursor not built in, sync must be custom: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/1263 (MEDIUM)
- Chris Wilson, "A Tale of Two Clocks" lookahead scheduling: https://web.dev/articles/audio-scheduling (HIGH, established pattern; from training knowledge, not re-fetched)
- React `useSyncExternalStore` for external mutable stores: https://react.dev/reference/react/useSyncExternalStore (HIGH, training knowledge)
- getUserMedia audio constraints (echoCancellation/noiseSuppression/autoGainControl) and iOS Safari gesture/HTTPS requirements: MDN MediaTrackConstraints (HIGH for constraints). iOS standalone-PWA mic behaviour is MEDIUM/LOW and must be verified on device in phase 1–2.

---
*Architecture research for: browser piano-learning app with acoustic-piano mic input*
*Researched: 2026-11-22*
