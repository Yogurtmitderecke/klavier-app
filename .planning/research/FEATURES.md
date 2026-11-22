# Feature Research

**Domain:** Browser-based piano practice tool for an **acoustic piano** (microphone listening, wait mode, falling notes + sheet music), single user, local-only, German UI, iPad/Safari on the music stand
**Researched:** 2026-11-22
**Confidence:** MEDIUM overall (competitor features: MEDIUM, from vendor pages and reviews; Mutopia licenses: HIGH, checked on the individual piece pages; legal interpretation: MEDIUM, this is not legal advice)

> **Clean-room note:** Competitor features are described only in generic terms ("wait mode", "loop", "hands separately"). These are common ideas in the whole category. Synthesia, PianoBooster, the open-source app Sightread and others all have them. No names, designs, songs or arrangements from flowkey or any other commercial app are referenced or should be used.

---

## Feature Landscape

### What the category looks like (generic survey)

| Product type | Input | Core loop | Relevant takeaway for us |
|---|---|---|---|
| Subscription "learn piano" apps (Simply Piano, Skoove, the app we are not copying) | Microphone **or** MIDI | Courses and video lessons, song library, a step that waits for each note, a play-in-time step, hands separately, slow tempo, loop | Mic-based acoustic piano support is standard in this category. Vendors themselves say to tune the piano to A=440 and **use headphones so the app's own audio doesn't reach the mic** (Simply Piano help centre). |
| Synthesia (falling-notes "game") | **MIDI only** (no acoustic listening) | Falling notes over keyboard, "melody practice" that waits for the correct note, pick one hand while the app plays the other, loop by clicking the timeline, auto-restart the loop after N errors, finger-number hints on falling blocks | The clearest reference for the falling-notes plus wait-mode UX. Its loop-restart-after-N-errors and finger hints are good ideas to adapt generically. |
| Piano Marvel | Mostly MIDI. Microphone mode is newer, iOS only, described by the vendor as "first phase" | Method courses, practice/play modes, standardized sight-reading test | Even a large vendor treats acoustic listening as hard and still improving. That supports our "monophonic first" decision. |
| Open source: Sightread (GPL-3.0, web), PianoBooster, Neothesia | MIDI only | Falling notes, wait mode, MIDI upload stored in browser storage, built-in library of **public-domain** pieces only | Same "PD library + own MIDI upload + browser storage" model as ours. **None of them do acoustic mic input**, so that is our real point of difference. GPL code must not be copied into a non-GPL project. Use it as inspiration only. |

**Key insight:** For our user, "table stakes" are not set by the subscription apps (courses, gamification). They are set by what a **practice tool** needs to be usable at the piano: reliable listening, wait mode, the two views, tempo/loop/hands, and an iPad that doesn't fall asleep. Everything course-like or social is out of scope.

---

### Table Stakes (Users Expect These)

Without these the tool isn't usable at the piano. Grouped by area. Complexity is for a solo React/TS build.

#### A. Listening (Core Value)

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| **Mic test page** (live note name + octave + cents + level meter) | Without it there is no way to trust or debug detection. PROJECT.md asks for it as an early phase. | LOW–MEDIUM | Show: detected note (German naming, see below), octave, cents bar, input level, "clarity/confidence" value. Doubles as the calibration screen. |
| **Monophonic pitch detection on acoustic piano** | The Core Value | HIGH | Pitch detection with YIN/MPM (e.g. pitchy). Piano partials, octave errors and long decay are the hard parts. See PITFALLS. |
| **Note-onset detection (new attack vs. ringing note)** | Wait mode has to tell a *repeated* note (Für Elise E–D#–E–D#–E, Bach prelude patterns repeat in every bar) from the previous note still ringing. Pitch alone can't do this. | MEDIUM–HIGH | Use an energy/spectral-flux onset plus the pitch. "Correct" = new onset **and** expected pitch. Often missed in naive designs. **Flag for deeper research.** |
| **Mic start flow with user gesture** ("Zuhören starten" button) | Safari only allows mic/AudioContext after a tap. Over HTTPS only. | LOW | Also handle the permission being denied, the AudioContext being suspended after the app comes back to the foreground, and the iPad lock screen. |
| **Calibration: tuning offset** | The user's piano may not be at A=440. Vendors also tell users to tune to 440. We can do better by measuring. | LOW–MEDIUM | "Play an A" (or a few keys) → store a global cents offset (e.g. −30…+30 ct). Apply the offset before mapping to MIDI note. |
| **Calibration: sensitivity / noise gate** | Room noise, talking and a fridge cause false triggers | LOW | Slider for minimum level and minimum clarity. A "be quiet for 3 s" ambient measurement is a nice addition. |

#### B. Practice core

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| **Wait mode** (notes stop until the correct pitch is heard, then advance) | Standard in Synthesia, PianoBooster, Sightread and the mic-based apps. Our V1 success criterion. | MEDIUM (logic), HIGH together with detection | Monophonic first. Events are grouped by onset time. In V1 each group must have exactly one note for the active hand. |
| **Falling-notes view over an 88-key (or zoomed) keyboard** | The category's signature view | MEDIUM | Canvas rendering. Highlight the target key and colour the hit key green or red. Zoom to the piece's range (most of our pieces fit in about 3–4 octaves), which matters on an iPad from 60 cm. |
| **Sheet-music view with a cursor/highlight on the current note** | The user is a returning learner. Reading notation is a stated goal. | MEDIUM–HIGH | OSMD has a built-in cursor that can step through notes. Keeping the cursor in sync with the wait-mode index is the main work. |
| **Switch between the views** | PROJECT.md | LOW (if both views share one note model) | Needs **one shared timeline/note model** (see dependencies). |
| **Hands separately: right / left / both** | Universal practice feature | LOW–MEDIUM | Needs hand info per note (MusicXML staff or MIDI track). **Monophonic implication:** in "both" mode V1 can only wait on one line. Define "both" as "wait for the right hand, show the left hand" until chord detection exists. Flag this to the user. |
| **Tempo control (~30–100 %)** | Universal | LOW | Only matters outside wait mode (play-through/preview) and for the metronome. In wait mode tempo affects only scroll animation and how far ahead notes appear. |
| **Loop over selected bars** | Universal (Synthesia: click timeline to loop) | MEDIUM | Choose start and end bar. In wait mode the loop simply jumps back to the start index. Needs bar numbers in the note model (MusicXML has them; MIDI needs time signature plus ticks). |
| **Metronome** | PROJECT.md, common | LOW–MEDIUM | **Conflict:** an audible click goes into the mic. Default to a **visual** metronome (flashing beat) and an optional audible click that the detector ignores for ~50 ms after each click. Recommend headphones. |
| **Feedback: green correct, red wrong + accuracy per run** | Universal | LOW | In wait mode "accuracy" = correct notes ÷ (correct + wrong attempts). Don't grade rhythm in wait mode. Show the heard wrong note in red on the keyboard so the user sees *what* they played. |
| **Song library (4–5 PD pieces) + "own MIDI" upload** | PROJECT.md | MEDIUM | Library songs ideally as MusicXML (both views). Uploaded MIDI → falling notes reliably. Sheet music from arbitrary MIDI is lossy (see anti-features). |
| **Position control**: restart, previous/next bar, tap a bar to jump | Expected in any player | LOW–MEDIUM | Large touch targets |
| **Local progress** (last position, best accuracy, last tempo per song, calibration) | PROJECT.md | LOW | IndexedDB or localStorage. Also persist calibration. Recommend `navigator.storage.persist()` so Safari doesn't evict the data. |

#### C. iPad / usability on the music stand

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| **German UI, large type, readable at ~60 cm, big touch targets** | PROJECT.md | LOW | One user, so hard-code German strings. No i18n framework needed. |
| **German note names (C D E F G A H, Cis/Dis/Fis…, B = B♭)** | A German learner expects "H", not "B". Showing "B" for H would be confusing and wrong. | LOW | Setting: German (default) / international. Octave as C4 or as Helmholtz notation (c′). Decide once. |
| **Screen stays awake during practice** | The iPad dims or locks mid-piece, which is unusable | LOW | Screen Wake Lock API. Safari has partial support from 16.4. It is fixed for home-screen web apps from **iOS/iPadOS 18.4** (HIGH: Safari 18.4 release notes). Re-request on `visibilitychange`. |
| **PWA install (home screen, full screen, offline)** | PROJECT.md | LOW–MEDIUM | Manifest + service worker. Mic permission in a standalone PWA may be asked again more often. Test early. |
| **Landscape layout** | The iPad sits sideways on the stand | LOW | Design landscape-first |
| **Count-in / "ready" state before notes start** | The user needs time to get hands onto the keys after tapping | LOW | In wait mode nothing moves until the first correct note, which works as a natural count-in |

---

### Differentiators (Competitive Advantage)

These match the Core Value: listening you can trust on a real acoustic piano. Pick a few. Don't try to win on everything.

| Feature | Value Proposition | Complexity | Notes |
|---|---|---|---|
| **"What I hear" indicator always visible while practising** (small note + confidence readout) | The biggest frustration with mic apps is "it didn't register and I don't know why". Showing what was heard turns a detection miss into something the user can see and fix. | LOW (reuses the test page) | Strongly recommended. Cheap, and builds trust. |
| **Auto-tuning calibration** (play 3–5 keys across the range → app measures the piano's offset, maybe per register) | Commercial apps just say "tune to 440". Measuring the real piano is better for a home instrument. | MEDIUM | Start with one global offset. Per-register offsets (stretch tuning) are a v1.x refinement. |
| **Octave-tolerance option** ("accept the right note name in the wrong octave") | Pitch detectors on piano often jump an octave because of strong harmonics. An optional tolerant mode saves frustration while detection is tuned. | LOW | Off by default. Useful as a fallback during calibration problems. |
| **Hit-confirmation tuning** (required stable frames / min. confidence, adjustable) | Trade-off between fast response and false positives. Visible as a simple "schnell ↔ sicher" slider. | LOW–MEDIUM | Same parameters as the test page |
| **Problem-spot tracking**: count wrong attempts per bar, highlight the worst bars, one tap "loop this bar" | Turns the accuracy number into a practice plan. Fits a returning learner. | MEDIUM | Needs bar mapping and stored per-bar error counts. Close to "statistics", which is out of scope for V1, so this is v1.x. |
| **Auto-restart loop after N errors / step-up tempo after a clean loop** | Proven practice technique (Synthesia has loop-restart after N errors) | LOW–MEDIUM | Generic idea. Add after loop works. |
| **Combined view** (sheet music on top, small falling notes/keyboard below) | Helps move from falling notes to reading notation | MEDIUM–HIGH | Needs both renderers to follow the same index. Do it after the toggle works. |
| **Finger numbers** (from MusicXML `<fingering>`) | Returning learners benefit. Synthesia shows finger hints on blocks. | LOW in OSMD (renders automatically), MEDIUM on falling notes | Only works if our own arrangements include fingerings. Never copy fingerings from protected editions. |
| **Note-name labels on falling notes and keys** (German, toggle) | Helps with slow note reading | LOW | |
| **Simplified melody track per song** (right-hand-only edition next to the original) | Lets wait mode work on pieces whose texture is not monophonic | MEDIUM (content work) | Done in authoring, not in code. See the content section. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| **Backing track / app plays the other hand through the speaker while listening** | Commercial apps do it, and it sounds nice | The speaker output goes into the iPad mic → false detections. Vendors themselves tell users to wear headphones. | V1: silence while listening. Later: an optional "play other hand" only with a headphones warning, or only in a non-listening preview mode. |
| **Polyphonic / chord detection in V1** | "Both hands" practice | Unreliable in the browser on an acoustic piano. Already out of scope. | Monophonic wait mode. "Both" = wait on the RH, display the LH. Research chord detection later as its own phase (PROJECT.md asks for an explanation first). |
| **Score following / automatic tempo tracking** | Feels magical | Hard, fragile, explicitly out of scope | Wait mode |
| **Rhythm/timing scoring** | Commercial apps grade timing | In wait mode there is no reference timing. Mic latency on iPad makes timing scores misleading. | Grade pitch accuracy only. Maybe add timing later in a separate "play-through" mode. |
| **Perfect sheet music from any uploaded MIDI** | "Upload MIDI, see notation" | MIDI → notation needs quantization, voice separation, spelling of accidentals and hand split. It is a research problem, and results look wrong for real-performance MIDI. | V1: uploaded **MIDI → falling notes only**. Uploaded **MusicXML → both views**. Maybe later: a simple notation view for quantized, single-track MIDI with a "may look wrong" note. |
| **Gamification** (XP, streaks, levels, rewards) | Every commercial app has it | Adds no value for a single self-motivated user, and adds a lot of UI work | Simple per-song best accuracy plus "last practised" |
| **Course/lesson system, video lessons** | Category standard | Content production is huge and not the goal | Small curated PD library + own MIDI/MusicXML |
| **Accounts, cloud sync, sharing** | Category standard | Out of scope. Needs a server. Privacy cost. | Local IndexedDB + optional **JSON export/import** of progress as a backup |
| **Scraping or importing arrangements from MuseScore.com or app catalogues** | "There are thousands of arrangements" | Arrangements are protected works of the arranger. Site terms restrict downloading. Legal risk, and it breaks the project's principle. | Own arrangements of PD works (see below) |
| **MIDI keyboard support** | Easy to add and more reliable | Explicitly out of scope. It would weaken the focus on making the mic work. | None (by design) |
| **Practice statistics dashboard, daily goals** | Motivating | Out of scope for V1 | Problem-spot tracking (v1.x) covers the useful part |

---

## Feature Dependencies

```
HTTPS hosting
    └──required by──> Mic access (getUserMedia) ──> Mic test page
                                                   └──> Pitch detection + calibration (offset, noise gate)
                                                          └──> Onset detection (repeated notes)
                                                                 └──> WAIT MODE  <── Unified note model
                                                                        ├──> Green/red feedback + accuracy
                                                                        ├──> Loop over bars ──> Auto-restart loop / tempo step-up
                                                                        └──> Problem-spot tracking (v1.x)

Song content (MusicXML / MIDI)
    └──> Parser ──> Unified note model (pitch, start, duration, hand/staff, bar no., index)
                       ├──> Falling-notes view (canvas + keyboard)
                       ├──> Sheet view (OSMD cursor)  ──requires──> MusicXML source
                       ├──> Hands separately (needs hand/staff per note)
                       └──> Tempo control, metronome (needs tempo/time signature)

View toggle ──requires──> Both views driven by the same note index
Combined view ──requires──> View toggle working

Audible metronome ──conflicts──> Mic detection (gate or visual metronome)
Backing track / other-hand playback ──conflicts──> Mic detection
"Both hands" wait mode ──requires──> Polyphonic detection (deferred)
Arbitrary MIDI upload ──conflicts (partially)──> Sheet view (lossy conversion)
Wake Lock + PWA ──enhance──> everything on iPad
```

### Dependency Notes

- **Wait mode requires onset detection, not only pitch:** repeated same-pitch notes are common in the target pieces (Für Elise E–D♯ alternation, the Bach prelude's repeated half-bar pattern). Without an onset signal, a ringing note would "confirm" the next identical note at once.
- **Both views require one shared note model:** if the falling view reads MIDI and the sheet view reads MusicXML, keeping them in sync becomes a constant fight. Recommendation: **MusicXML is the source of truth for library songs.** Build the note model from it and use OSMD for rendering. MIDI uploads build the same model through @tonejs/midi but have no sheet view.
- **Hands separately requires hand info:** MusicXML staff 1/2 = RH/LH (reliable). MIDI: one track per hand only if the file was made that way. Otherwise split by pitch (e.g. middle C) as a fallback setting.
- **Loop requires bar numbers:** native in MusicXML. MIDI needs computation from time-signature events and ticks.
- **Metronome conflicts with listening:** visual by default.
- **Problem-spot tracking requires loop + per-bar data**, so it comes after both.

---

## Content: Legally obtaining the 4 pieces

### Findings per piece (Mutopia Project, verified on each piece page)

| Piece | Mutopia entry | License | Files | Source edition | Usable as-is? |
|---|---|---|---|---|---|
| **Für Elise, WoO 59** (piano) | id **931**, Mutopia-2015/08/18-931 | **Public Domain** (CC "no rights reserved" mark) | .ly, .mid, PDF | Breitkopf & Härtel 1888 | **Yes.** Full piece, so we cut the opening (A section) and simplify. |
| **Bach WTC I, Prelude 1 C major, BWV 846** (harpsichord/piano) | id **5**, Mutopia-2011/09/12-5 | **Public Domain** | .ly, .mid, PDF, PNG | unknown | **Yes** |
| **Satie, Gymnopédie No. 1** (piano) | id **37**, Mutopia-2014/12/14-37 | **Public Domain** | .ly, .mid, PDF | Dover edition (reprint of the PD original) | **Yes** |
| **Beethoven Sonata Op. 27 No. 2 "Moonlight"** (piano) | id **276**, Mutopia-2007/02/11-276 | **CC BY-SA 2.5** | zipped .ly, zipped .mid, PDF | Berners 1908, ed. Winterberger | **With obligations** (see below). Better: self-transcribe the opening. |

URLs (verified):
- Für Elise: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931 (MIDI: https://www.mutopiaproject.org/ftp/BeethovenLv/WoO59/fur_Elise_WoO59/fur_Elise_WoO59.mid)
- BWV 846: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5 (MIDI: https://www.mutopiaproject.org/ftp/BachJS/BWV846/wtk1-prelude1/wtk1-prelude1.mid)
- Gymnopédie 1: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37 (MIDI: https://www.mutopiaproject.org/ftp/SatieE/gymnopedie_1/gymnopedie_1.mid)
- Moonlight: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=276
- License definitions: https://www.mutopiaproject.org/legal.html

**Important:** Mutopia has **full original scores, not "simple arrangements"**, and gives **LilyPond (.ly) + MIDI**, not MusicXML. There is no clean, reliable path from LilyPond to MusicXML. So the practical route for every piece is **making our own simplified version** (see workflow).

### Attribution obligations

| License | Obligation | What we do |
|---|---|---|
| **Public Domain (Mutopia PD mark)** | None legally | Still credit voluntarily in an "Über / Quellen" screen: "Based on Mutopia Project edition #931 (Public Domain)". Good practice, no cost. |
| **CC BY 2.5–4.0** | Credit the author/maintainer, name the license and link to it, say if changes were made | Credits screen plus a metadata field in each song file |
| **CC BY-SA (e.g. Moonlight #276, 2.5)** | As CC BY, **plus** any adaptation (a simplified arrangement made *from that file*) must be released under the same or a compatible BY-SA license | Workable for a private tool, but our simplified file would itself become BY-SA. **Recommendation:** avoid this by transcribing the opening ourselves from a PD source (e.g. a pre-1900 edition scan on IMSLP marked PD). The first movement opening (RH triplets over bass octaves, melody from bar 5) is short and easy to enter by hand. |

Mutopia's legal page doesn't say whether the license also covers the generated MIDI files. Treat the MIDI like the score, with the same license (safe assumption). (MEDIUM)

### Other sources, assessed

| Source | Verdict | Why |
|---|---|---|
| **IMSLP** | **Use only as a reference for reading, then type it in ourselves** | The *compositions* are PD. Files are marked per copyright regime (Canada/EU/US). Scans of **old (pre-~1925) editions** are generally safe as a reference. **Modern editions** can be protected: in Germany, *wissenschaftliche Ausgaben* (critical/scholarly editions, §70 UrhG) are protected for 25 years. Editorial fingerings and notes can be protected expression. Rule: take only the notes of the original composition from an old edition, and don't copy modern editorial additions. (MEDIUM, not legal advice) |
| **MuseScore.com user uploads** | **Avoid** | Licenses vary per upload. Many arrangements are "all rights reserved" by the arranger. The site's terms restrict downloads. The exception is CC0 projects like OpenScore, but none were verified for these 4 pieces. (LOW confidence that suitable CC0 versions exist) |
| **Mutopia** | **Primary source** | Clear per-piece license. 3 of 4 target pieces are Public Domain. |
| **Self-transcribing from PD originals** | **Best option for the simple versions** | We own our arrangement and can choose CC0 or keep it private. It has no third-party obligations, and the content is exactly what the app needs (RH melody track, hand split, fingerings). |

### Recommended content workflow

1. Get the PD Mutopia MIDI/PDF (or an old IMSLP scan) as a **reference only**.
2. Write our own **simplified version** in **MuseScore 4 (free desktop app)**: e.g. Für Elise bars 1–~22, Bach prelude bars 1–~11, Gymnopédie bars 1–~21, Moonlight bars 1–~9. Use 2 staves (RH/LH) and optionally fingerings.
3. Export **MusicXML (.mxl or .musicxml) = source of truth** for the app. Export MIDI too if needed.
4. Put the source and license in the song metadata. Show an "Über / Quellen" screen.

### Fit with monophonic wait mode (important for content design)

| Piece | Monophonic-friendly? | Note |
|---|---|---|
| Für Elise opening | **Very good.** RH melody is single-line. LH broken chords are also single notes in sequence. | Repeated E–D♯ needs onset detection. **Best V1 target (matches the success criterion).** |
| Bach Prelude C major | **Good if done as a single-line sequence.** It is broken chords throughout. | The original has held notes (LH tied half notes) that overlap the next notes and keep ringing. Our version should present it as one note stream. Same pattern twice per bar → onset detection needed. |
| Gymnopédie No. 1 | **RH melody: very good.** LH is bass + chord (polyphonic). | V1: RH only. LH chords are for later. |
| Moonlight 1st mvt opening | **Triplet arpeggios = monophonic stream**, but the melody from bar 5 sits on top of the triplets (2 voices in the RH) and the LH has octaves | V1: just the triplet stream, or just the melody. Octaves are tricky for the detector. Sustained-pedal ringing in this piece is a stress test. |

---

## MVP Definition

### Launch With (v1)

- [ ] Mic test page (note, octave, cents, level, confidence), German note names. Risk is cleared first.
- [ ] Calibration: tuning offset + noise gate/sensitivity, persisted. Needed on a real home piano.
- [ ] Onset-aware monophonic detection. Without it repeated notes break wait mode.
- [ ] Unified note model from MusicXML (library) and MIDI (upload). Both views depend on it.
- [ ] Falling-notes view + keyboard with green/red feedback. Core view.
- [ ] Wait mode (monophonic, RH or chosen hand). Core Value and V1 success criterion.
- [ ] Sheet view (OSMD) with cursor + toggle. Stated requirement.
- [ ] Hands separately (R / L / "both" = wait on RH, show LH). Stated requirement.
- [ ] Tempo slider, loop over bars, visual metronome. Stated requirement.
- [ ] Accuracy per run. Stated requirement.
- [ ] Library: Für Elise opening (own simplified MusicXML from PD source) first, then the other 3. Success criterion.
- [ ] MIDI upload (falling view only). Stated requirement.
- [ ] Local progress + calibration in IndexedDB. Stated requirement.
- [ ] PWA + Wake Lock + landscape, large-type German UI. iPad on the music stand.
- [ ] "Über / Quellen" credits screen. Attribution hygiene.
- [ ] German hosting guide (HTTPS). Stated requirement.

### Add After Validation (v1.x)

- [ ] Always-visible "what I hear" indicator in practice. Add as soon as wait mode exists, maybe already in v1.
- [ ] Octave-tolerance toggle and a "schnell ↔ sicher" slider. Add if detection misses are frequent.
- [ ] Problem-spot tracking per bar + "loop this bar". Add once loop is used regularly.
- [ ] Auto-restart loop after N errors, tempo step-up. Add once loop is stable.
- [ ] Finger numbers on falling notes. Add once own arrangements include fingerings.
- [ ] MusicXML upload (both views). Low effort, since the parser already exists.
- [ ] JSON export/import of progress (backup). Add before the first time Safari clears storage.
- [ ] Optional audible metronome with detector gating. Add if the visual one isn't enough.

### Future Consideration (v2+)

- [ ] Chord / two-hand detection. Needs its own research phase (PROJECT.md).
- [ ] Combined sheet + falling view.
- [ ] Per-register tuning calibration.
- [ ] Play-through mode with timing feedback.
- [ ] Other-hand playback (headphones only).
- [ ] Statistics and daily goals (explicitly later).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Mic test page | HIGH | LOW | P1 |
| Pitch detection + calibration | HIGH | HIGH | P1 |
| Onset detection (repeated notes) | HIGH | MEDIUM | P1 |
| Wait mode (mono) | HIGH | MEDIUM | P1 |
| Unified note model (MusicXML/MIDI) | HIGH (enabler) | MEDIUM | P1 |
| Falling notes + keyboard | HIGH | MEDIUM | P1 |
| Sheet view + cursor + toggle | HIGH | MEDIUM–HIGH | P1 |
| Hands separately | HIGH | LOW–MEDIUM | P1 |
| Tempo / loop / visual metronome | MEDIUM–HIGH | MEDIUM | P1 |
| Green/red + accuracy | HIGH | LOW | P1 |
| Wake Lock, PWA, landscape, large German UI | HIGH (iPad) | LOW–MEDIUM | P1 |
| German note names (H, Cis…) | MEDIUM | LOW | P1 |
| Own simplified PD arrangements (content) | HIGH | MEDIUM (manual work) | P1 |
| MIDI upload (falling only) | MEDIUM | LOW–MEDIUM | P1 |
| Local progress | MEDIUM | LOW | P1 |
| "What I hear" indicator | HIGH | LOW | P2 (early) |
| Octave tolerance / speed–safety slider | MEDIUM | LOW | P2 |
| Problem-spot tracking | MEDIUM | MEDIUM | P2 |
| Auto-loop-restart / tempo step-up | MEDIUM | LOW–MEDIUM | P2 |
| Finger numbers | MEDIUM | LOW–MEDIUM | P2 |
| Progress export/import | MEDIUM | LOW | P2 |
| Combined view | MEDIUM | MEDIUM–HIGH | P3 |
| Chord detection | HIGH (future) | HIGH | P3 (research first) |
| Backing track / other-hand playback | LOW | MEDIUM + conflicts | P3 / avoid |

---

## Competitor Feature Analysis (generic)

| Feature | Subscription mic apps | Synthesia / OSS (Sightread, PianoBooster) | Our Approach |
|---|---|---|---|
| Acoustic piano input | Yes (mic), vendor advice: headphones, tune to 440 | **No**, MIDI only | Mic only, plus measured tuning offset and a visible "what I hear" readout |
| Wait for correct note | Yes (lesson step) | Yes ("melody practice" / wait mode) | Yes, monophonic, onset-aware |
| Falling notes | Some | Core view | Yes |
| Sheet music | Yes (often simplified) | Synthesia: limited. Sightread: beta | Yes (OSMD), first-class |
| Hands separately | Yes | Yes (app plays the other hand) | Yes, but the other hand is **shown, not played** (mic conflict) |
| Loop | Yes | Yes, click timeline. Auto-restart after N errors | Bar-based loop, auto-restart in v1.x |
| Finger hints | Varies | Yes (optional per file) | From our own MusicXML, v1.x |
| Content | Licensed catalogue + courses | User MIDI. Sightread: PD library + upload | 4–5 own simplified PD arrangements + MIDI/MusicXML upload |
| Accounts/cloud | Yes | Sightread: optional sharing | None, local only |
| Gamification/courses | Heavy | Light scoring | None |

---

## Sources

- Mutopia piece pages (HIGH, verified 2026-11-22): [Für Elise #931](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931), [BWV 846 Prelude #5](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=5), [Gymnopédie 1 #37](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37), [Moonlight #276](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=276), [Mutopia legal/licenses](https://www.mutopiaproject.org/legal.html)
- [Simply Piano help: improving acoustic note recognition](https://piano-help.hellosimply.com/en/articles/6210583-ways-to-improve-note-recognition-in-simply-piano-for-ios-acoustic-piano) (MEDIUM: headphones, A=440)
- [Synthesia App Store page](https://apps.apple.com/us/app/synthesia/id579518445), [Synthesia guide: assign hands](https://www.synthesiagame.com/support/guide/assignHands), [Synthesia finger hints wiki](https://github.com/Synthesia-LLC/metadata-editor/wiki/Finger%20Hints) (MEDIUM)
- [Sightread (GPL-3.0) repo](https://github.com/huytd/sightread), [Sightread on AlternativeTo](https://alternativeto.net/software/sightread/about) (MEDIUM: MIDI-only wait mode, PD library, local MIDI upload)
- [Piano Marvel microphone assessment](https://pianomarvel.com/en/feature/microphone-assessment), [Piano Marvel with acoustic piano](https://pianomarvel.com/article/how-to-use-piano-marvel-with-an-acoustic-piano) (MEDIUM: mic mode iOS-only, "first phase")
- Skoove reviews: [pianodreamers](https://www.pianodreamers.com/skoove-review/), [Skoove vs Simply Piano](https://www.skoove.com/blog/skoove-vs-simply-piano) (LOW–MEDIUM: mic/USB/Bluetooth input)
- [Safari 18.4 release notes (Wake Lock fix for Home Screen web apps)](https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes), [caniuse Wake Lock](https://caniuse.com/wake-lock), [WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545) (HIGH)
- German UrhG §70 (scholarly editions, 25 years): from training knowledge, MEDIUM. Verify if editions other than pre-1925 ones are used.

---
*Feature research for: acoustic-piano practice PWA (mic + wait mode)*
*Researched: 2026-11-22*
