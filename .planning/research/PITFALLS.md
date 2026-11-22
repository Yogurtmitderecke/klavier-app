# Pitfalls Research

**Domain:** Browser-based piano learning app (React/TS/Vite PWA) that listens to an ACOUSTIC piano through the iPad Safari microphone, with monophonic wait mode, falling notes, and sheet music
**Researched:** 2026-11-22
**Confidence:** MEDIUM overall. Acoustics and DSP facts are HIGH (textbook physics). The iOS/WebKit behaviour is MEDIUM: it comes from WebKit Bugzilla, Apple release notes and forums, and it changes between iOS releases, so it has to be re-tested on the user's own iPad. OSMD performance on iPad is LOW, because no benchmarks were found.

> Phase names below assume the roadmap structure implied by PROJECT.md:
> **P1 Setup/Hosting (HTTPS deploy)** → **P2 Mic test page + pitch detection** → **P3 Calibration** → **P4 Song model + MIDI import** → **P5 Falling notes + wait mode** → **P6 Sheet music view** → **P7 Practice tools (hands, tempo, loop, metronome, feedback)** → **P8 PWA/persistence/polish**. The roadmapper should adjust the numbers to match the final phases.

---

## Critical Pitfalls

### Pitfall 1: Browser "voice" processing destroys the piano signal (echoCancellation / noiseSuppression / autoGainControl)

**What goes wrong:**
`getUserMedia({audio: true})` turns on WebRTC voice processing by default. Noise suppression treats a sustained piano tone as stationary noise and fades it out within a few hundred ms. AGC pumps the level, so velocity-based onset detection breaks. Echo cancellation can band-limit or resample the signal. Users then see notes that are detected and drop out mid-sustain, wait mode that never triggers on soft notes, and repeated notes that get lost.

**Why it happens:**
The defaults are tuned for video calls. On iOS the situation is worse. A WebKit report (bug 311451, still open in the iOS 27 beta) says that even with `echoCancellation: false` the captured audio on iOS/iPadOS is degraded, including a lower sample rate. One report also says Safari rejects `echoCancellation: {exact: false}` with an OverconstrainedError.

**How to avoid:**
- Always request `{audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}}` as plain booleans (ideal), **not** `{exact: false}`, so Safari does not throw.
- After the stream starts, log `track.getSettings()` on the mic test page and show it in a debug panel. This shows what was actually applied.
- Do not rely on `voiceIsolation` or other newer constraints being honoured.
- Do not play metronome or reference tones through the iPad speaker while listening if you can avoid it. If you must (metronome), test whether it triggers false detections and whether the iOS echo-cancel path changes behaviour (bug 326286: crackling with EC on).

**Warning signs:**
A held note shows a confidence/clarity value that decays much faster than the audible decay. `getSettings()` reports `echoCancellation: true`. `sampleRate` in settings differs from `AudioContext.sampleRate`.

**Phase to address:** P2 (mic test page). This must be the first thing verified on the real iPad.

---

### Pitfall 2: Octave errors and "wrong note" from piano harmonics and inharmonicity

**What goes wrong:**
The detector reports C5 when C4 is played (octave up), or a fifth/twelfth above, especially in the bass and on soft notes. Autocorrelation methods (YIN, McLeod/pitchy) can also jump an octave down on very bright high notes. On a piano the upper partials are *stretched* (inharmonicity): partial n sits slightly above n·f0, more strongly in short bass strings and upright pianos. This weakens the periodicity that YIN/MPM rely on. In the low register the fundamental is often physically weaker than the 2nd and 3rd partials, and the small iPad MEMS mic and its high-pass filtering attenuate everything under about 80–100 Hz even further.

**Why it happens:**
Developers test with a sine wave, their voice, or a digital piano sample, and it works. A real upright 60 cm from an iPad behaves differently.

**How to avoid:**
- **Compare by pitch class first, then octave.** In wait mode, the expected note is known. The check should be "is the detected pitch the expected MIDI note, or exactly ±12/±19/±24 semitones from it, with good clarity?" Accept octave errors when the pitch class matches **and** no other plausible candidate exists. Make this a setting ("Oktavfehler tolerieren", on by default for the bass).
- Use **expected-note-guided detection**: in wait mode you only have to answer "is note X sounding?", which is much easier than "which note is sounding?". Add a second check that measures spectral energy at f0, 2f0 and 3f0 of the expected note (Goertzel or FFT bins, with stretch tolerance) next to pitchy's estimate.
- Limit the detection range to the piano's range and to the current song's range (± a few semitones).
- Use a clarity threshold (pitchy returns clarity 0–1). Start around 0.85–0.9, make it tunable in calibration, and log it.

**Warning signs:**
The mic test page shows the right note name but the wrong octave for notes below C3. The cents value jumps between two readings an octave apart. Detection works on a laptop with an external mic but not on the iPad.

**Phase to address:** P2 (show raw octave and clarity on the test page), P5 (pitch-class plus octave-tolerant matching in wait mode).

---

### Pitfall 3: Low bass notes need long analysis windows, which costs latency

**What goes wrong:**
A0 is 27.5 Hz (period about 36 ms). C2 is 65 Hz (about 15 ms). YIN/MPM need at least 2 periods inside the window, and in practice 3–4 for stability. At 48 kHz a 2048-sample window (about 43 ms) is the minimum for C2, and the bottom octave needs 4096 or more (about 85 ms). A 1024 window, the typical tutorial default, simply cannot see notes below roughly G2. A 4096+ window applied to the treble, though, adds noticeable lag and smears fast passages.

**Why it happens:**
Copying a tuner example with `fftSize = 2048` or smaller and testing only the melody range.

**How to avoid:**
- Choose the window from the expected note in wait mode: a larger window for expected notes below about C3, a small one (1024–2048) above. Or run two detectors in parallel.
- V1 is right hand/melody first, so most notes are above C4. Document that left-hand bass detection is a separate, harder problem. Test it explicitly before "Hände getrennt: links" is promised to work.
- Use `AudioWorklet` with a ring buffer and a hop of 256–512 samples, so the update rate is independent of window length.

**Warning signs:**
Notes below C3 are "never detected" or detected late (over 150 ms). The left-hand-only mode feels broken.

**Phase to address:** P2 (test page must include a bass test: C2, C3 with readings), P7 (left-hand mode acceptance test).

---

### Pitfall 4: Repeated notes and sustain. The piano keeps ringing, so the app cannot tell a new strike from the old note

**What goes wrong:**
In wait mode, *Für Elise* starts E5–D#5–E5–D#5–E5. If the next expected note equals the currently ringing note (or the previous note is still ringing), the detector sees "E5 present" continuously. It either advances immediately without the user playing (false positive), or it never registers the second strike. The reverse case: the previous note still rings, so pitchy reports the *old* note while the new one is attacked, and the app marks a correct note red.

**Why it happens:**
Pitch detection answers "what is sounding?", not "what was just played?". A piano has a long decay (seconds), and the room adds reverb.

**How to avoid:**
- **Onset detection is mandatory, not optional.** Only accept a pitch as "played" if it comes with an onset: an RMS/energy rise above the recent level (for example +6 dB within 30–50 ms), or a spectral-flux peak. Require a new onset for every expected note, including repeated ones.
- After an onset, wait a short settle time (about 30–60 ms, because the hammer attack is noisy and inharmonic) before reading the pitch. Take the dominant pitch across a few frames (median of 3–5).
- Ignore detections of the *previous* expected note during a short grace window, so the ringing note is not marked "wrong".
- Debounce: one onset gives at most one note event.

**Warning signs:**
Repeated-note passages skip ahead or stall. Wrong-note (red) flashes appear right after correct notes. The hit rate is lower in legato passages.

**Phase to address:** P2 (test page shows an onset indicator next to the pitch), P5 (wait-mode state machine built on onset plus pitch events, never on raw pitch).

---

### Pitfall 5: Sustain pedal, sympathetic resonance and room noise create "ghost" pitches

**What goes wrong:**
With the sustain pedal down, all strings are undamped and earlier notes keep ringing. Strings whose partials match the played note resonate sympathetically (octave, fifth). The detector picks up a mixture, and clarity drops. Also: talking, a TV, a dishwasher hum (50 Hz mains harmonics in Germany: 100/150 Hz), or the user saying "so" can count as notes. Pieces in the library like Gymnopédie, the Moonlight Sonata and the Bach Prelude are *written* for heavy pedal.

**Why it happens:**
The project tests notes one at a time, without pedal, in a quiet room.

**How to avoid:**
- Calibration step: measure the room noise floor for 2–3 s and set the onset/RMS threshold above it. Make sensitivity a slider (already in requirements).
- In wait mode, use expected-note-guided matching (Pitfall 2) combined with onset (Pitfall 4). Ringing notes without a new onset are then ignored automatically.
- Add a hint text in German: "Beim Üben im Warte-Modus Pedal sparsam verwenden" (use the pedal sparingly in wait mode). This is a legitimate UX recommendation, not a cop-out.
- Test explicitly with the pedal held through a whole Gymnopédie phrase.

**Warning signs:**
Wait mode advances on notes that were not played. The hit rate collapses on pedalled pieces only.

**Phase to address:** P3 (calibration: noise floor, sensitivity), P5 (acceptance test with pedal).

---

### Pitfall 6: getUserMedia/AudioContext lifecycle on iOS: user gesture, "suspended", "interrupted", backgrounding, screen lock

**What goes wrong:**
- `AudioContext` created on page load starts as `suspended` and produces silence. It must be created or `resume()`d inside a tap handler.
- iOS has a (now spec-adopted) `"interrupted"` state. It is entered on phone calls, Siri, other apps playing audio, lock screen, or switching apps. Several WebKit bugs (273511, 283419, 276016) report contexts stuck in `interrupted`, and `resume()` does not always clear it.
- Mic capture stops or mutes when Safari/PWA goes to the background or the screen locks (bug 226620). Tracks can `end` after long background periods (bug 204681). A 2026 report (bug 319706) describes capture not recovering after a media-services reset.
- The iPad on the music stand will auto-lock after 2–5 minutes of no touches while the user plays. Then the mic stops, and the user returns to a dead app.

**Why it happens:**
Desktop Chrome forgives all of this, and developers test there.

**How to avoid:**
- Single "Start / Zuhören starten" button that creates the AudioContext, calls `getUserMedia`, and `resume()`s, all in the same gesture handler.
- Build an **audio-session supervisor**: listen to `audioContext.onstatechange`, `track.onended`, `track.onmute/onunmute`, and `document.visibilitychange`. When the state is not `running` or the track has ended, show a large German overlay "Mikrofon pausiert – tippen zum Fortsetzen" (mic paused, tap to resume). On tap: stop old tracks, close the old context if needed, and **recreate both** context and stream. Do not just call `resume()`.
- **Screen Wake Lock** (`navigator.wakeLock.request('screen')`) is supported in Safari since 16.4. In Home Screen web apps (standalone PWA) it was broken until **iOS/iPadOS 18.4** (fixed per Safari 18.4 release notes). Re-request the lock on every `visibilitychange` back to visible, because it is released automatically. Make the iPad's minimum supported OS ≥ 18.4, or fall back to an instruction ("Automatische Sperre: Nie" in Settings).
- Show a persistent "Mikrofon aktiv" indicator so a silent failure is visible.

**Warning signs:**
"Works the first time, dead after I answered a message." The app is silent after the screen locked. `audioContext.state` logs show `interrupted`.

**Phase to address:** P2 (start-button pattern, state display on test page), P5/P8 (supervisor plus wake lock; must be tested in a real practice session of 15+ minutes).

---

### Pitfall 7: HTTPS and the "test on the iPad" loop

**What goes wrong:**
`navigator.mediaDevices` is `undefined` on `http://192.168.x.x:5173`. Only `localhost` and HTTPS are secure contexts. The non-programmer user cannot test the Vite dev server on the iPad, so iPad testing is postponed until "deploy later", and the core risk is discovered late.

**How to avoid:**
- Set up free HTTPS hosting (GitHub Pages, Cloudflare Pages or Netlify) with auto-deploy from git in **the very first phase**. Every phase then ends with "open URL on iPad, test at the piano".
- For local dev on the iPad: `vite --host` plus `@vitejs/plugin-basic-ssl` (self-signed, needs a tap-through warning) or a tunnel. Document this in the German guide.
- Check for `window.isSecureContext` and show a clear German error message instead of a crash.
- Vite `base` path must match the hosting subpath (GitHub Pages: `/repo-name/`). Otherwise assets, the manifest and the service worker 404.

**Warning signs:**
`TypeError: undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')`. A blank page on GitHub Pages.

**Phase to address:** P1.

---

### Pitfall 8: PWA standalone mode microphone quirks on iPadOS

**What goes wrong:**
In Home Screen (standalone) mode, iOS has a long history of not persisting camera/mic permission. WebKit bug 215884: permission is revoked on hash changes and not kept across sessions. Bug 252465: the stream stops working in PWA mode only. Bug 185448: getUserMedia was historically missing in standalone. Recent reports (2024–2025) still describe repeated prompts. One commenter claims iOS 18 fixed some of this, which is unverified. Also: a hash-based router (`#/song/1`) can trigger re-prompts or revocation.

**How to avoid:**
- Use path-based routing or in-memory state for navigation. Avoid changing `location.hash` while the mic is live.
- Request the mic **once** per session and keep the same stream alive across views. Do not stop and restart getUserMedia per song or page.
- Treat a permission prompt on every launch as expected iOS behaviour. Do not try to "fix" it, and explain it in the German guide.
- Test the exact flow in both Safari tab and installed-PWA mode before declaring PWA done. If standalone is broken on the user's iOS version, the fallback is "use it as a Safari tab in fullscreen/Reader-free mode". Decide this early.

**Warning signs:**
Works in a Safari tab, fails or re-prompts after "Zum Home-Bildschirm". The mic is silent after navigating between songs.

**Phase to address:** P2 (single long-lived stream architecture), P8 (PWA install test).

---

### Pitfall 9: Sample-rate assumptions (48 kHz vs 44.1 kHz vs "whatever iOS gives you")

**What goes wrong:**
The code hardcodes 44100 for converting frequency to MIDI note, or creates `new AudioContext({sampleRate: 44100})` while the iPad hardware runs at 48000. iOS has had bugs where the context and mic rates mismatch, which causes pitch to be off by about 1.5 semitones (48/44.1 = +147 cents), or distorted/crackling input. Bug 311451 also reports reduced capture sample rate on iOS.

**How to avoid:**
- Never pass `sampleRate` to the AudioContext constructor. Always read `audioContext.sampleRate` and pass it to pitchy (`findPitch(buffer, sampleRate)`).
- On the test page, display the context sample rate and `track.getSettings().sampleRate`.
- Validation: play A4 (440 Hz) from a tuner app or a tuned piano. The test page must show A4 within about ±10 cents. A constant offset of about 147 cents means a sample-rate bug, not a detuned piano.

**Warning signs:**
All notes are consistently about +1.5 semitones (or -1.5) off. Calibration "fixes" an offset that is suspiciously close to 147 cents.

**Phase to address:** P2.

---

### Pitfall 10: Calibration that hides bugs, or tuning-offset logic that breaks note matching

**What goes wrong:**
The piano is globally flat (for example A4 = 435 Hz, -20 cents), and individual notes are stretched (pianos are tuned with stretched octaves, so high treble is +10 to +30 cents and deep bass is -10 to -30 cents relative to equal temperament). Rounding to the nearest semitone at ±50 cents then flips notes near the boundary. Worse: a sample-rate bug (Pitfall 9) gets "calibrated away" on one device and reappears on the laptop.

**How to avoid:**
- Calibrate a **global reference A** (play A4, or any few notes, and average the cent offset). Store it per device in localStorage.
- Match notes with a tolerance window (±40–50 cents after offset) **plus** the expected-note guidance. Never require ±10 cents accuracy for "correct".
- Cap the calibration offset at about ±60 cents and warn above that ("Klavier sehr verstimmt oder technisches Problem", piano badly out of tune or a technical problem).

**Phase to address:** P3.

---

### Pitfall 11: MIDI file quirks break the song model (hands, tempo, pickup, overlaps)

**What goes wrong:**
- **Hands:** Some MIDI files put the right hand and left hand in separate *tracks* (Type 1, most common from notation software). Others use one track with two *channels*, or one track and one channel with everything mixed (Type 0, or exported from a recording). "Track 0 = right hand" is an assumption that fails often. Track 0 in Type 1 files is frequently a tempo/meta-only track with zero notes.
- **Tempo maps:** Multiple tempo changes (ritardando at the end of a section, fermatas encoded as tempo drops). Code that uses only `header.tempos[0]` drifts out of sync. @tonejs/midi gives notes `time` in seconds already resolved through the tempo map *and* `ticks`. Use ticks/PPQ for musical position (bars, loops, the wait-mode sequence) and seconds only for playback/falling speed.
- **Pickup measures (Auftakt):** *Für Elise* starts with an upbeat (E–D#). MIDI has no notion of a pickup. Bar numbers computed as `ticks / ticksPerBar` are then off by one or shifted, and "loop bars 1–4" selects the wrong notes. The sheet music view (MusicXML) does have the pickup, so the two views disagree.
- **Time signature changes** mid-piece break bar computation.
- **Overlapping notes / same-pitch overlaps:** Note-on before the previous same-pitch note-off. Zero-length notes. Note-on with velocity 0 as note-off (handled by the parser, but watch exported data). Chords where notes start a few ticks apart (humanised or recorded MIDI), so the "monophonic" melody appears to have 3 notes at almost the same time.
- **Ornaments/grace notes** and trills in recorded MIDI become dozens of tiny notes that make wait mode unplayable.
- **Velocity-0 or very short notes,** and drum channel 10, if someone uploads a general MIDI file.

**How to avoid:**
- Build an internal **song model** (own TypeScript type): a list of note events with `{midi, startTick, durationTicks, hand: 'R'|'L', measureIndex, beat}`, plus a tempo map and a time-signature map. Both MIDI and bundled songs convert into this. All views and wait mode consume only this model.
- **Hand-assignment UI on import:** show the tracks/channels with note counts and pitch range, auto-guess (higher average pitch = right hand), and let the user confirm. Fallback for single-track files: split at a pitch (default C4/middle C), adjustable.
- Quantize/group onsets within a small tolerance (for example 1/32 note or 30 ms) into one "step" for wait mode. A step containing multiple notes for the selected hand gets a defined rule in V1 (for example "highest note = melody, others ignored").
- Pickup handling: store a `pickupTicks` offset per song (editable on import) so bar numbers match the score.
- For the bundled library, hand-author songs as **MusicXML (or own JSON)** where hand, measure and pickup are explicit, and derive everything else from it. Do not use random MIDI downloads.

**Warning signs:**
"Right hand" mode shows no notes, or bass notes. Loop over bars 1–4 starts mid-phrase. The falling notes drift relative to the metronome. Wait mode demands three notes at once in a melody.

**Phase to address:** P4 (song model plus import). This must come before views, because both views and wait mode depend on it.

---

### Pitfall 12: Two rendering views that are not driven by one timeline (OSMD cursor sync)

**What goes wrong:**
Falling notes are positioned by seconds from @tonejs/midi. OSMD's cursor steps through *its own* MusicXML-derived voice entries (`cursor.next()`), which include rests, tied notes, grace notes and both staves. Mapping "wait-mode step 17" to "OSMD cursor position" by counting `next()` calls desyncs as soon as rests, ties, chords or the other hand's notes exist. Switching views then loses the position. With MIDI-only uploads there is no MusicXML at all, so the score view must be *generated*, and generating readable notation from MIDI (quantisation, spelling D# vs Eb, beaming, voices) is a hard problem in its own right.

**How to avoid:**
- One source of truth: the song model's step index plus musical time (ticks/beats). Each view maps from it.
- For OSMD: walk the cursor once after load and build a lookup table `musicalTimestamp → cursor state` (via `cursor.Iterator.currentTimeStamp` / `currentVoiceEntries`). Then jump by timestamp, not by counting steps. Hide the built-in cursor and draw your own highlight if needed.
- Scope decision for V1: **sheet music view only for songs that have MusicXML** (bundled library). For uploaded MIDI, show only falling notes. Leave MIDI-to-notation as a later or optional feature. This avoids a rabbit hole.
- VexFlow alone means building layout yourself (line breaks, spacing, systems). For a non-programmer project, OSMD (which uses VexFlow internally) is the pragmatic choice.

**Warning signs:**
The cursor is one or two notes ahead or behind after the first rest. Toggling views resets to the start. Loop markers do not line up with the score.

**Phase to address:** P4 (model includes musical timestamps), P6 (timestamp lookup table).

---

### Pitfall 13: OSMD/VexFlow and falling-notes rendering are too slow on the iPad, and the main thread blocks audio analysis

**What goes wrong:**
- `osmd.render()` re-lays out the whole score. Calling it on every state change, every resize, or every React re-render freezes the iPad for hundreds of ms to seconds. During that time, pitch analysis on the main thread stalls, notes are missed, and wait mode "does not hear".
- Falling notes implemented as hundreds of React components/DOM nodes, updated via `setState` at 60 fps, cause jank on the iPad.
- `cursor.next()` combined with `scrollIntoView` every step causes layout thrash.

**How to avoid:**
- **Run pitch/onset detection in an AudioWorklet** (or at least keep analysis independent of React). Post only small events (`{type:'onset', midi, clarity, time}`) to the main thread. Then UI stalls cannot cause missed notes.
- Render OSMD **once** per song load and zoom level. Wrap it in a component that never re-renders (ref plus `useEffect` with stable deps). Re-render only on explicit resize (debounced) and orientation change.
- Draw falling notes on a single `<canvas>` with a `requestAnimationFrame` loop that reads from a ref/store, not React state.
- Keep the bundled scores short (simple versions, 16–32 bars), as already planned.
- Profile on the real iPad early (Safari Web Inspector via Mac, or at least an on-screen FPS/analysis-rate counter if no Mac is available).

**Warning signs:**
The analysis rate (frames per second shown on the debug panel) drops when the score is visible. Notes are missed only in sheet-music view. Rotation takes over 1 s.

**Phase to address:** P2 (worklet architecture), P5 (canvas falling notes), P6 (render-once OSMD).

---

### Pitfall 14: "Public domain" sheet music that is not actually free (edition and arrangement rights)

**What goes wrong:**
The *composition* (Beethoven, Bach, Satie †1925) is public domain. A specific **edition** may not be. Germany (§70 UrhG) protects scholarly/critical editions (wissenschaftliche Ausgaben, for example Henle/Bärenreiter Urtext) for 25 years after publication. §71 covers editiones principes of unpublished works. UK typographical arrangement rights run 25 years. Simplified "easy" arrangements are new copyrighted works of the arranger. MIDI files on random websites are often transcriptions/sequences with their own claimed copyright or unclear origin. Scanned IMSLP files are fine for *viewing*, but IMSLP applies the 25-year/Germany rule only voluntarily and gives no guarantee. Also: OSMD's own demo files and MuseScore.com community scores are under varying licences. MuseScore.com scores are user uploads, often with arrangement copyright.

For a strictly private, never-published tool this risk is small. But the guide puts the app on public HTTPS hosting, so the bundled files become publicly downloadable from a public GitHub repo or Pages site. That is distribution.

**How to avoid:**
- **Self-set the simplified versions** (own MusicXML/JSON written from the PD original melody). This is the cleanest route and already preferred in PROJECT.md. Your own simplification of a PD work is your own work.
- If you use sources, use only clearly licensed ones: **Mutopia Project** (each piece states its licence: PD or CC BY/BY-SA). Record the licence and source URL per song in a `SOURCES.md`/metadata field. Avoid MuseScore.com uploads and anonymous MIDI sites.
- Do not copy fingerings, dynamics or editorial markings from a modern Urtext edition. Those are the protected parts.
- Keep the user's uploaded MIDI files local only (IndexedDB). Never bundle them into the deployed repo.
- Consider a private repo plus a hosting provider that deploys from private repos (Cloudflare Pages/Netlify), or accept that the bundled files are public.

**Warning signs:**
A song file whose origin is "found it on the internet". MusicXML containing a `<rights>` or `<creator type="arranger">` element naming someone else.

**Phase to address:** P4 (library content creation, with source/licence metadata per song).

---

### Pitfall 15: UI not readable or usable from 60 cm on a music stand, with hands on the keys

**What goes wrong:**
Developers design at arm's length on a laptop. At 60 cm on an iPad (about 10–11"), small fonts (under about 18 px), thin noteheads, low-contrast colours and tiny tap targets fail. The sheet music at default OSMD zoom shows 6+ systems per page, so notes are tiny. Red/green as the only feedback signal fails for colour-vision deficiency (about 8% of men) and in bright daylight. The user has to *touch* the iPad to resume, loop or toggle, which interrupts playing. iPad landscape vs portrait on a music stand changes everything, and the stand's ledge can cover the bottom of the screen (where the virtual keyboard sits in falling-notes view).

**How to avoid:**
- Base font ≥ 20–24 px for controls and ≥ 32 px for the current note name. Tap targets ≥ 60 px. High contrast, with a dark theme option.
- Feedback = colour **plus** shape/symbol/animation (check mark / cross, or note glow vs shake). Use a colour-blind-safe pair (for example blue/orange) as an option.
- OSMD: set `zoom` so that only 2–3 systems are visible, or render a "current system only" mode. Test the readability of the actual noteheads at 60 cm.
- Keep the bottom about 10% of the screen free of critical content (music stand ledge). Lock or design for **landscape** first.
- Minimise touches during play: wait mode advances by sound, the loop restarts automatically, and large "Nochmal" / "Weiter" buttons appear only between runs.
- Test literally: iPad on the music stand, sitting at the piano, every phase.

**Warning signs:**
The user leans forward to read. Accidental taps. The keyboard view is hidden behind the stand ledge.

**Phase to address:** P5 (falling notes layout), P6 (score zoom), P7 (feedback design). A **"60 cm check"** must be part of every UI phase's acceptance criteria.

---

### Pitfall 16: Latency budget not designed, so wait mode feels sluggish

**What goes wrong:**
End-to-end latency = acoustic travel (about 2 ms) + iOS input buffering (about 10–20 ms) + analysis window (43–85 ms) + onset settle (30–60 ms) + median over frames (+20–40 ms) + `ScriptProcessorNode` or main-thread polling (`setInterval`/rAF on an `AnalyserNode` adds 16–100 ms and jitters) + React render. This easily exceeds 200 ms, and the user feels "the app is slow / doesn't hear me".

**How to avoid:**
- Use an AudioWorklet (not ScriptProcessorNode, which is deprecated and runs on the main thread). A hop of 256–512 samples (about 5–10 ms).
- Target: under about 100 ms from key strike to green feedback for notes ≥ C4. Measure it on the test page (record onset timestamp vs feedback timestamp; or film with the iPad's camera at 240 fps).
- For wait mode, latency matters less than reliability. Do not shrink windows so far that octave errors increase. Tune for correctness first.
- If a metronome is played through the speaker, schedule it with `AudioContext.currentTime` (lookahead scheduling), never `setInterval`, and make sure the mic does not detect the click as notes (the click has no stable pitch, but an onset detector will fire, so gate onsets near scheduled clicks).

**Phase to address:** P2 (architecture), P7 (metronome scheduling plus click gating).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Pitch detection on main thread via `AnalyserNode.getFloatTimeDomainData` in rAF | Fast to build, works in every tutorial | Stalls during OSMD render; rate tied to screen refresh; missed onsets | OK for the very first P2 prototype; move to AudioWorklet before wait mode (P5) |
| Wait mode compares raw "current pitch == expected" | Trivial | Fails on repeated notes, ringing notes, pedal (Pitfall 4/5) | Never for V1 success criterion (*Für Elise* has repeated E5) |
| Using MIDI files as the bundled library format | No authoring needed | No pickup, no hand info, no score view, licence unclear | Never for bundled songs; OK for user uploads |
| `track 0 = right hand` | Zero UI | Breaks most real-world files | Only for self-authored files |
| Storing progress in `localStorage` keyed by file name | Simple | Name collisions; iOS may evict storage of unused sites (~7 days without interaction for Safari tabs; installed PWAs are treated differently) | OK in V1 if you call `navigator.storage.persist()` and offer JSON export |
| Hardcoded sample rate 44100 | — | 147-cent errors on 48 kHz iPads | Never |
| React state for each falling note | Familiar | Jank on iPad | Only for under about 30 visible notes; prefer canvas |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| getUserMedia (iOS) | `{echoCancellation: {exact:false}}` → OverconstrainedError; or default constraints → voice processing | Plain `false` booleans for all three; verify via `getSettings()` |
| AudioContext (iOS) | Create on load; only handle `suspended` | Create in tap handler; handle `interrupted`; recreate on failure |
| pitchy | Ignore `clarity`; pass wrong sample rate; tiny buffer | Use clarity threshold; `audioContext.sampleRate`; window sized for the lowest expected note |
| @tonejs/midi | Use `note.time` (seconds) for bar logic; assume track 0 has notes; only `tempos[0]` | Use `ticks`/`header.ppq` for musical position; filter empty tracks; respect full tempo/time-signature maps |
| OSMD | Re-render on every React update; count `cursor.next()` steps | Render once; build a timestamp→cursor map; own highlight overlay |
| Wake Lock | Request once at start | Re-request on every `visibilitychange` → visible; needs iPadOS ≥ 18.4 in standalone PWA |
| Vite + GitHub Pages | Wrong `base`, service worker scope wrong | Set `base`; use `vite-plugin-pwa` with matching scope; test the deployed URL on iPad |
| Service worker | Aggressive caching → iPad stuck on old version after deploy | `registerType: 'prompt'` or autoUpdate with a visible version number in the UI |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| OSMD full render on resize/rotation | 1–3 s freeze on iPad | Debounce, render once, short scores | Scores over about 30 bars or frequent re-renders |
| DOM-based falling notes | Stutter, battery drain | Single canvas, rAF loop | Over about 50 simultaneous elements on older iPads |
| Large analysis window at small hop on main thread | UI lag, warm iPad | AudioWorklet, adaptive window | 4096 window at 256 hop on main thread |
| Unbounded debug logging of pitch frames | Memory grows, Safari reloads tab | Ring-buffer logs, debug flag | Practice sessions over about 10 min |
| Safari tab memory limits | Tab reloads silently, mic lost | Keep assets small, no huge sample libraries | Hundreds of MB of audio samples (do not bundle a full piano sample set; use a small synth for reference tones) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recording/storing mic audio "for debugging" | Private room audio persisted or uploaded | Never persist raw audio; analysis only in memory; say so in the UI |
| Committing uploaded user MIDI or personal progress exports to the public repo | Personal data and possibly copyrighted files published | `.gitignore`, uploads only in IndexedDB |
| Parsing arbitrary uploaded files without limits | Huge/malformed MIDI hangs the tab | File size cap (for example 1 MB), try/catch with a German error message |
| Third-party analytics/CDN scripts | Leak usage; break offline PWA | Bundle everything; no trackers |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent mic failure | User plays, nothing happens, blames themselves | Always-visible level meter plus "Mikrofon aktiv" state; big overlay on failure |
| Marking ringing/previous notes as wrong (red) | Frustration, discouraging for a returning learner | Grace window; only judge after an onset; in wait mode, wrong notes are mild feedback, never blocking |
| Requiring a touch to continue | Hands leave the keys | Sound-driven progression; auto-loop |
| Technical English error messages | Non-programmer stuck | All messages in German, with a concrete action ("Einstellungen → Safari → Mikrofon → Erlauben") |
| Too-strict pitch tolerance | Correct notes rejected on a slightly detuned piano | Calibration plus ±40–50 cent tolerance |
| Red/green only | Colour-blind/daylight unreadable | Colour plus symbol |
| Tempo slider affecting wait mode confusingly | Unclear what "50%" means when the app waits anyway | Tempo applies to the falling speed / metronome; explain in the UI |

## "Looks Done But Isn't" Checklist

- [ ] **Mic test page:** Tested on the *real iPad* via HTTPS, at the piano, at 60 cm. It shows note, octave, cents, clarity, level meter, sample rate, `getSettings()` and AudioContext state. Bass C2/C3 tested.
- [ ] **Pitch detection:** A held note stays detected for at least 2 s (proves no noise suppression). Repeated notes (E5 E5 E5) register 3 separate onsets.
- [ ] **Calibration:** Noise floor measured. Tuning offset stored per device and capped. A sample-rate bug ruled out (no constant ~147 cent offset).
- [ ] **Wait mode:** Complete *Für Elise* opening (repeated E–D# figure) played without false advance or stall. Also tested with pedal.
- [ ] **Lifecycle:** Lock screen → unlock → app recovers mic with one tap. Switch apps → back → recovers. A 15-minute session without auto-lock (wake lock works in the installed PWA).
- [ ] **PWA:** Installed to the Home Screen, mic works, permission behaviour documented, offline load works, the update after redeploy reaches the iPad.
- [ ] **MIDI import:** Tested with Type 0 file, Type 1 file with empty tempo track, file with tempo changes, file with pickup. Hand assignment confirmable.
- [ ] **Score view:** The cursor stays in sync through rests, ties and the other hand's notes. View toggle preserves position. Readable at 60 cm.
- [ ] **Library:** Each bundled song has a source and licence recorded. No arranger/rights metadata from third parties.
- [ ] **Storage:** `navigator.storage.persist()` requested. Progress survives app restart and about 2 weeks without use (or export exists).
- [ ] **Laptop path:** Also works in desktop Safari/Chrome (secondary device).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS voice processing cannot be disabled on the user's iOS version | MEDIUM | Raise tolerance, rely more on expected-note spectral matching and onset; recommend an external USB/Lightning mic (class-compliant, which bypasses some processing); document it |
| Pitchy too unreliable on piano | MEDIUM | Swap the algorithm behind the detector interface (YIN with stretch-tolerant harmonic check, or expected-note Goertzel bank). Keep the detector behind an interface from P2 |
| Wait mode built on raw pitch | MEDIUM | Insert onset layer between detector and wait-mode state machine; requires an event-based interface |
| MIDI-centric model without ticks/measures | HIGH | Rewrite of the song model and all views. Avoid by doing P4 right |
| OSMD sync by step counting | MEDIUM | Build a timestamp map; replace cursor logic |
| Standalone PWA mic broken on current iPadOS | LOW | Use as a Safari tab; keep PWA for icon/offline only |
| Licensed content shipped publicly | LOW–MEDIUM | Remove the file, purge from git history, replace with a self-set version |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 7 HTTPS / iPad test loop | P1 | Deployed URL opens on iPad; `isSecureContext` true |
| 1 Voice processing constraints | P2 | `getSettings()` shows all false; held note stays detected ≥ 2 s |
| 9 Sample rate | P2 | A4 reads 440 ±10 cents from a reference |
| 6 AudioContext/gesture/interrupted | P2 (basic), P8 (supervisor plus wake lock) | Lock/unlock and app-switch recovery test; 15-min session |
| 13 Worklet / main-thread independence | P2 (architecture) | Analysis rate stable while UI is busy |
| 16 Latency | P2, P7 | Measured strike→feedback under about 100 ms (≥ C4) |
| 2 Octave errors / inharmonicity | P2 (visibility), P5 (tolerant matching) | Bass and treble test notes; wait mode accepts correct notes |
| 3 Bass window length | P2, P7 (left hand) | C2/C3 detected; left-hand mode test |
| 4 Repeated notes / sustain | P2 (onset display), P5 | *Für Elise* E–D#–E repeats work |
| 5 Pedal / resonance / noise | P3, P5 | Pedal test on Gymnopédie; talking does not advance |
| 10 Calibration | P3 | Offset capped and stored; tolerance applied |
| 11 MIDI quirks | P4 | Test file matrix (Type 0/1, tempo, pickup) |
| 14 Licensing | P4 | Source/licence per song recorded |
| 12 View sync | P4 (model), P6 | Cursor sync through rests/ties; toggle keeps position |
| 13 OSMD/canvas performance | P5, P6 | No freeze over 200 ms on iPad; analysis rate unaffected |
| 15 60 cm readability | P5, P6, P7 (every UI phase) | Music-stand test by the user |
| 8 PWA standalone mic | P2 (long-lived stream), P8 | Install and test in standalone mode |

## Sources

- WebKit bug 311451: iOS capture degraded even with echoCancellation false (open into the iOS 27 beta): https://bugs.webkit.org/show_bug.cgi?id=311451 (MEDIUM)
- WebKit bug 326286: crackling playback with EC-enabled mic stream, iOS 27: https://bugs.webkit.org/show_bug.cgi?id=326286 (MEDIUM)
- WebKit bug 192932, "Can not disable audio processing (lowpass)": https://bugs.webkit.org/show_bug.cgi?id=192932 (MEDIUM)
- Apple Developer Forums, Safari enables echo cancellation by default: https://developer.apple.com/forums/thread/832452 (MEDIUM)
- discuss-webrtc, sustained-tone loudness reduction, and Safari OverconstrainedError with `exact:false`: https://groups.google.com/g/discuss-webrtc/c/PDZYMzAI-_Y (LOW)
- AudioContext "interrupted" state: WebKit bugs 273511, 283419, 276016, 206695: https://bugs.webkit.org/show_bug.cgi?id=273511, https://bugs.webkit.org/show_bug.cgi?id=283419, https://bugs.webkit.org/show_bug.cgi?id=276016 ; W3C TAG review #1069 (added to spec): https://tag-github-bot.w3.org/gh/w3ctag/design-reviews/1069 (MEDIUM)
- Mic capture stopping in background / after media-services reset: https://bugs.webkit.org/show_bug.cgi?id=226620, https://bugs.webkit.org/show_bug.cgi?id=204681, https://bugs.webkit.org/show_bug.cgi?id=319706 (MEDIUM)
- PWA standalone getUserMedia permission issues: https://bugs.webkit.org/show_bug.cgi?id=215884, https://bugs.webkit.org/show_bug.cgi?id=185448, https://bugs.webkit.org/show_bug.cgi?id=252465, https://bugs.webkit.org/show_bug.cgi?id=273938, https://developer.apple.com/forums/thread/788518 (MEDIUM)
- Screen Wake Lock fixed for Home Screen Web Apps in Safari 18.4: https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes ; https://bugs.webkit.org/show_bug.cgi?id=254545 ; https://caniuse.com/wake-lock (HIGH)
- IMSLP public-domain policy (25-year rule for critical/Urtext editions, Germany §70 UrhG): https://imslp.org/wiki/Public_domain ; https://forums.imslp.eu/viewtopic.php?p=37143 (MEDIUM; statute details should be checked against the German UrhG text)
- OSMD source (Cursor.ts, batch rendering in d.ts): https://app.unpkg.com/opensheetmusicdisplay@2.0.0/files/build/dist/src/OpenSheetMusicDisplay/OpenSheetMusicDisplay.d.ts (LOW for iPad performance; no benchmarks found)
- Piano acoustics (inharmonicity, stretched tuning, weak bass fundamentals), YIN/MPM window requirements, onset detection: standard DSP/acoustics knowledge (HIGH for the physics; specific thresholds such as clarity 0.85–0.9 and +6 dB onset are starting values to tune, LOW)
- MIDI Type 0/1 structure, @tonejs/midi `ticks`/`time`/`header.ppq`/`tempos`: library knowledge (MEDIUM; verify API names against current @tonejs/midi docs in P4)

---
*Pitfalls research for: browser-based acoustic-piano learning app (iPad Safari, microphone pitch detection)*
*Researched: 2026-11-22*
