# Phase 2: Mikrofon-Testseite - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning

<domain>
## Phase Boundary

The existing "Mikrofon-Test" placeholder sub-page becomes a real microphone test page. After one tap on "Mikrofon starten", the page shows live what the app hears from the user's acoustic piano through the iPad microphone: note name + octave, deviation in cents, level and clarity, plus technical diagnostics (sample rate, mic constraint settings, AudioContext state). The phase ends with a structured test at the piano on the user's iPad (iPadOS 26.5.2) that answers the go/no-go question "does mic pitch detection work on this iPad with this piano?".

Requirements: MIC-01, MIC-02, MIC-03, MIC-04, MIC-05. Not in scope: onset/keystroke log (MIC-06), calibration (Phase 3), wait mode, falling notes.

</domain>

<decisions>
## Implementation Decisions

### Mikrofon-Start
- **D-01:** The microphone permission is requested **only** by a large **"Mikrofon starten"** button on the test page. The welcome screen's "Start" button stays as it is (no mic, no AudioContext). This **supersedes Phase 1 D-02** (which anticipated the mic request on the welcome Start tap). The AudioContext should still be created/resumed inside that same user tap (iOS gesture requirement).
- **D-02:** The button is a **Start/Stop toggle**: "Mikrofon starten" ↔ "Mikrofon stoppen". Stopping releases the mic (all MediaStream tracks stopped, so the iOS mic indicator disappears).
- **D-03:** Leaving the test page via **"‹ Zurück" stops the microphone**. On the next visit, the user taps "Mikrofon starten" again. (Keeps Phase 1 rules: no URL/hash change, Zurück top-left, nothing important at the bottom edge.)

### Test am Klavier
- **D-04:** The device test uses a **fixed German checklist** given by Claude in the plan's human-verify checkpoint (e.g. C2, C3, C4, held A4 ≥ 2 s at ~440 Hz ±10 cents, a high note around C6, a short fast note sequence). The user plays each item and reports in chat what the page showed.
- **D-05:** The app does **not** add test helpers (no hold timer, no copy button, no in-app checklist). The page only shows the live values; results are reported in chat.
- **D-06:** The checklist is run **twice**: once in a **Safari tab** and once **from the home-screen icon**. The plan includes a short German how-to for adding the app to the home screen (Share button → "Zum Home-Bildschirm").
- **D-07:** If the piano test shows the detection is not good enough (e.g. wrong low notes, unstable A4), **we stay in Phase 2 and improve** (e.g. A/B against YIN/pitchfinder, longer analysis window for the low register) until the checklist passes. Phase 3 only starts after a pass.

- **D-08:** **A4 pass criterion (decided after research):** the held A4 passes if the page shows "A4" for at least 2 s without flickering and the cents value stays within ±10 of its own average. The absolute deviation (e.g. +15 cents, from piano inharmonicity or tuning) is only recorded, not a failure; correcting it is Phase 3 calibration. This refines roadmap SC 4 ("~440 Hz ±10 cents").

### Claude's Discretion
- **Mic failure / denial handling:** user said "entscheide du". Leaning: clear German message on the test page explaining what went wrong, a short step-by-step for re-enabling the mic permission in Safari, and a "Nochmal versuchen" button. Must also cover "not a secure context" and "no mic available".
- **Note display:** user did not discuss. Claude decides naming (German convention, e.g. H instead of B; sharps vs. flats), octave notation (scientific, e.g. "A4", matches the roadmap's C2/C3/A4 wording), cent display (number and/or tuner-style indicator), sizes readable at ~60 cm.
- **Diagnostics panel:** user did not discuss. Claude decides layout (always visible vs. collapsible); must show sample rate, applied mic settings from `getSettings()` (echoCancellation / noiseSuppression / autoGainControl expected false), AudioContext state, and enough to diagnose iPad problems (MIC-04). Readable without remote debugging (no Mac available).
- Technical pipeline per CLAUDE.md stack: pitchy (MPM), AnalyserNode fftSize 4096 via rAF behind a `PitchSource` interface, voice processing off, RMS gate + clarity threshold + smoothing. Researcher should check window length for low notes and `getSettings()` behaviour on iPad Safari.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & requirements
- `CLAUDE.md` — Tech stack (pitchy 4.1.0, AnalyserNode-first, voice processing off, single AudioContext created on a tap, no hash routing), iOS mic pitfalls and WebKit bug list
- `.planning/ROADMAP.md` §"Phase 2: Mikrofon-Testseite" — goal, 5 success criteria, research flag (pitchy vs. YIN, window length for low notes, `getSettings()` on iPad)
- `.planning/REQUIREMENTS.md` — MIC-01..MIC-05
- `.planning/PROJECT.md` — core value (reliable mic detection is the whole point)
- `.planning/STATE.md` — user iPad runs iPadOS 26.5.2

### Prior phase
- `.planning/phases/01-grundger-st-und-online-adresse/01-CONTEXT.md` — screen-flow, navigation and layout decisions (D-02 superseded by this phase's D-01)
- `.planning/phases/01-grundger-st-und-online-adresse/01-UI-SPEC.md` — design tokens, sizes, copywriting conventions
- `.planning/phases/01-grundger-st-und-online-adresse/01-REVIEW.md` — open warnings WR-01 (placeholder SECURE_URL in local builds) and WR-02 (deploy job permissions)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/screens/MicPlaceholderScreen.tsx`: becomes the real test page (keeps BackButton top-left, no version label).
- `src/components/BackButton.tsx`: "‹ Zurück"; its handler is where the mic must be stopped (D-03).
- `src/state/appStore.ts`: Zustand `useAppStore` with `Screen` type incl. `'mic-placeholder'`; screen switching without URL changes.
- `src/texte.ts`: all German UI strings, grouped by screen (`TEXTE.willkommen.*`, `TEXTE.uebersicht.*`, …) — add a group for the mic test page.
- `src/lib/secureContext.ts` + `src/components/WarningBar.tsx`: secure-context detection and warning bar, reusable for "mic needs HTTPS" errors.
- `src/styles/tokens.css`: dark theme tokens, 24/32/56px type scale, 96px free bottom area.

### Established Patterns
- TDD with Vitest + jsdom + Testing Library (RED commit before GREEN); Web Audio / getUserMedia must be mocked in jsdom.
- Build-time globals via `vite.config.ts` read through `src/config.ts`.
- oxlint, TS 7 strict, no router, no hash changes.

### Integration Points
- Overview tile "Mikrofon-Test" → `'mic-placeholder'` screen (rename optional).
- Every push to `main` deploys to https://yogurtmitderecke.github.io/klavier-app/ (needed for the iPad test over HTTPS).

</code_context>

<specifics>
## Specific Ideas

- Test cases named by the roadmap: C2/C3 low notes must show the right note; held A4 stable ≥ 2 s at ~440 Hz (±10 cents); compare Safari tab vs. home-screen launch and record the result.
- The user is a non-programmer: all instructions at checkpoints in plain German, step by step.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-mikrofon-testseite*
*Context gathered: 2026-11-23*
