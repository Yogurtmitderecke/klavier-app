# Phase 1: Grundgerüst und Online-Adresse - Context

**Gathered:** 2026-11-22
**Status:** Ready for planning

<domain>
## Phase Boundary

A nearly empty German app built with Vite + React + TypeScript, deployed via GitHub Actions to GitHub Pages over HTTPS, and reachable on iPad Safari and the laptop. The phase delivers:
- a welcome screen with a large "Start" button,
- an overview with 3 large tiles (placeholders for later areas),
- a German warning when the page runs without HTTPS (`isSecureContext`),
- a visible version number.

No microphone, audio, songs or settings logic yet. Those belong to Phases 2+.

Requirements: DEPL-01, DEPL-02, DEPL-03, UI-01, UI-02, UI-03.

</domain>

<decisions>
## Implementation Decisions

### Screen flow
- **D-01:** The app opens on a **welcome screen** with the title "Klavier-App" and one large **"Start"** button. Tapping Start leads to the overview with the tiles.
- **D-02:** The Start tap is the app's single user gesture per session. From Phase 2 onward, this tap will also create and resume the shared AudioContext and request the microphone. Build it so that hook can be added later, for example with a `onStart` handler in one place. Do NOT request the mic in Phase 1.
- **D-03:** Screens switch through app state (Zustand or simple React state). No router and no URL or hash changes, because they can trigger repeated mic prompts in iOS standalone mode.

### Overview tiles
- **D-04:** Exactly **3 large tiles**: "Mikrofon-Test", "Stücke üben", "Einstellungen". (Calibration will later live under Einstellungen or Mikrofon-Test, not as its own tile.)
- **D-05:** Tiles that aren't built yet are shown **greyed out with the label "kommt bald"**. Tapping them does nothing, or shows a short "kommt bald" note. In Phase 1, all three tiles may be placeholders. Claude may open a simple placeholder sub-page for "Mikrofon-Test" if that helps demonstrate navigation.

### Navigation
- **D-06:** Sub-pages have a large **"Zurück"** button in the **top left**, always in the same spot. Nothing important sits at the bottom edge, because the music-stand ledge covers it.

### HTTPS warning (DEPL-02)
- **D-07:** If `window.isSecureContext` is false, show a **prominent warning bar on the welcome screen, directly above the Start button**. It says in plain German why the microphone won't work there and links to the correct secure address (the GitHub Pages HTTPS URL). The app otherwise stays usable, so this is not a blocking error page.

### Claude's Discretion
The user chose not to discuss the following. Claude decides sensibly and documents the choices in the plan.
- **Look & colours:** calm, plain, our own design (nothing resembling flowkey). Light or dark is Claude's choice, with high contrast. Sizes must work at about 60 cm in landscape on the iPad: body text ≥ about 24 px, buttons and tiles with large touch targets (≥ about 64 px tall). Keep the bottom screen edge free.
- **Version number format and position:** for example a semantic version from `package.json`, optionally plus a short commit hash or build date injected at build time. Show it small but readable, e.g. on the welcome screen or in a corner, not at the bottom edge. It must change on each deploy so the user can tell that an update arrived.
- **GitHub setup:** repo name `klavier-app` (Vite `base: '/klavier-app/'`), public repo (free GitHub Pages; acceptable because all content is self-made), and a deploy workflow based on the official Vite GitHub Pages `deploy.yml`. The planner must include a clear German step-by-step checkpoint for the user (non-programmer): create or log into the GitHub account, create the repo, enable Pages, and push. The user's GitHub account status was not discussed, so the plan must handle both cases.
- **iPadOS version:** STATE.md lists it as an open question. Ask the user during the Phase 1 test step at the piano (Settings → General → Info), and record the answer in STATE.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md`: vision, constraints, and the "non-programmer, explain in German" context
- `.planning/REQUIREMENTS.md`: DEPL-01..03, UI-01..03 wording
- `.planning/ROADMAP.md` § "Phase 1: Grundgerüst und Online-Adresse": goal and the 5 success criteria

### Research
- `.planning/research/SUMMARY.md` § "Phase 1: Skeleton + HTTPS deploy": state-based screens, `base`, `isSecureContext`, version number
- `.planning/research/STACK.md`: exact versions (React 19.3, Vite 8.3, TS ~7.0, oxlint, Zustand 5.1), GitHub Pages and `base` notes
- `.planning/research/PITFALLS.md`: P7 (hash routing / URL changes leading to repeated mic prompts) and the other iPad pitfalls
- `.planning/research/ARCHITECTURE.md`: intended module layout for the app shell
- `CLAUDE.md`: Technology Stack (prescriptive TL;DR, "What NOT to Use")

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None. This is a greenfield project, and only `.planning/` and `.claude/` exist. Scaffold with `npm create vite@latest` (react-ts template) and keep its defaults (React 19.3, Vite 8.3, TS ~7.0, oxlint).

### Established Patterns
- None yet. This phase establishes them: state-based screen switching, the German UI text, large-type design tokens, and the Start-gesture hook.

### Integration Points
- The Start button handler is the future entry point for AudioContext and mic setup (Phase 2).
- The tile overview is the future home of the Mikrofon-Test (Phase 2), Stücke üben (Phases 5–10) and Einstellungen (Phases 3/9).

</code_context>

<specifics>
## Specific Ideas

- Flow: Begrüßung (title + big "Start") → Übersicht (3 tiles) → sub-page with "Zurück" top left.
- The HTTPS warning sits directly above the Start button and includes the correct HTTPS link.
- Piano test (ROADMAP SC 5): put the iPad on the music stand, open the address, tap "Start", and check that the text is readable from the playing position.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

</deferred>

---

*Phase: 01-grundgerüst-und-online-adresse*
*Context gathered: 2026-11-22*
