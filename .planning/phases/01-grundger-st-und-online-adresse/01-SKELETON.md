# Walking Skeleton — Klavier-App (Arbeitstitel)

**Phase:** 1
**Generated:** 2026-11-22

## Capability Proven End-to-End

The user opens `https://<user>.github.io/klavier-app/` in iPad Safari, sees a German, large-type welcome screen with a build version label, taps "Start" and lands on the overview. Every push to `main` is linted, tested, built and redeployed over HTTPS automatically.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.3 + TypeScript ~7.0 + Vite 8.3, scaffolded from `create-vite@9.3.4` `react-ts`, template defaults kept (oxlint, `tsc -b && vite build`) | User-fixed stack (CLAUDE.md). No typescript-eslint (peer conflict with TS 7). |
| Screen navigation | Zustand 5.1 store `useAppStore` with `screen: 'welcome' \| 'overview' \| 'mic-placeholder'`; no router, no URL/hash changes ever | D-03: URL/hash changes can re-trigger iOS mic permission prompts in standalone mode. Later phases extend the `Screen` union instead of adding routes. |
| User-gesture entry point | `useAppStore.onStart()` is the ONE place the "Start" tap lands | D-02: Phase 2 adds the shared AudioContext creation/resume and the mic request inside `onStart()`; no other component may start audio. |
| Data layer | **None in Phase 1.** Static app, no server, no database, no login. | Project constraint: local-only storage. The skeleton's "real data read/write" is intentionally empty; the first persistence arrives in Phase 3 (Zustand `persist` -> localStorage for calibration) and Phase 10 (Dexie 4.4 / IndexedDB for uploads and progress). |
| Auth | None (personal tool, no accounts) | PROJECT.md: no server, no login. |
| Build-time metadata | Vite `define`: `__APP_VERSION__` (package.json), `__BUILD_DATE__` (ISO), `__GIT_SHA__` (GITHUB_SHA[0..7] / git / `dev`), `__SECURE_URL__` (`https://${GITHUB_REPOSITORY_OWNER}.github.io/klavier-app/`); exposed via `src/config.ts` (`VERSION_LABEL`, `SECURE_URL`) | DEPL-03: label changes on every deploy without manual bumps; no hard-coded GitHub username. |
| Deployment target | GitHub Pages via GitHub Actions (official Vite `deploy.yml`, SHA-pinned actions) at `https://<user>.github.io/klavier-app/`, Vite `base: '/klavier-app/'`, branch `main` | Free, HTTPS enforced (mic requirement), never pauses. CI gates: `npm ci` -> lint -> test -> build -> base-path grep -> deploy. |
| Caching / PWA | No service worker in Phase 1; GitHub Pages `max-age=600` + Vite hashed assets | Keeps "new version arrived" simple. vite-plugin-pwa comes in Phase 11. |
| Styling | Plain CSS, one `src/styles/tokens.css` with all UI-SPEC custom properties (`--space-*`, `--font-*`, `--color-*`), dark "Ebenholz" palette, system font stack | UI-SPEC: reused by every later phase; no component library, no web font. |
| Layout contract | `.app` root: `min-height: 100dvh`, `padding-bottom: calc(96px + env(safe-area-inset-bottom))` (bottom free zone), `viewport-fit=cover`; min touch target 64px; body text 24px | UI-02 / D-06: music-stand ledge covers the bottom edge; readable at ~60 cm. |
| Sub-page navigation | `BackButton` ("‹ Zurück") fixed top-left, 64px high, min 160px wide, on every sub-page | D-06: same spot in all later phases. |
| Copy | All German UI strings in `src/texte.ts` (`TEXTE` object), informal "du", German quotes „…“ | UI-01; one place for tone and later reuse. |
| Testing | Vitest 5.1 + jsdom 31 + @testing-library/react 16.3 (+ dom 10.4), `npm test` = `vitest run`; no jest-dom | Pure helpers + component flow tests; same Vite config so `define` globals exist in tests. |
| Directory layout | `src/state/` (Zustand stores), `src/lib/` (pure, unit-tested helpers), `src/components/` (Button-level UI: Tile, BackButton, WarningBar, VersionLabel), `src/screens/` (one file per screen), `src/styles/tokens.css`, `src/texte.ts`, `src/config.ts`, `src/globals.d.ts`. Later: `src/audio/` (Phase 2+), `src/song/` (Phase 5+). | Matches `.planning/research/ARCHITECTURE.md` app-shell layer. |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner) — plan 01
- [x] Routing — state-based screen switching (no URL router, by design D-03) — plans 01, 04
- [x] Database — N/A: static app without server/DB; no persistence needed in Phase 1 (documented deviation, see Data layer)
- [x] UI — "Start" button wired to the store action `onStart()`; tiles and "Zurück" wired to `setScreen` — plans 01, 04
- [x] Deployment — GitHub Pages over HTTPS via Actions on every push to `main` — plan 03, re-verified with an update in plan 05

## Out of Scope (Deferred to Later Slices)

- Microphone, AudioContext, pitch detection (Phase 2)
- Calibration and any persisted settings (Phase 3)
- Songs, falling notes, wait mode, sheet music (Phases 5–8)
- IndexedDB/Dexie, MIDI upload, progress storage (Phase 10)
- PWA manifest, service worker, home-screen install, offline (Phase 11)
- German hosting guide for non-programmers (DEPL-04, Phase 11)
- Light theme, icons library, screen-transition animations

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Mikrofon-Test tile becomes live — `onStart()` creates the shared AudioContext and requests the mic; test page shows note, cents, level, clarity
- Phase 3: Calibration (tuning offset, noise floor, sensitivity) persisted via Zustand `persist`
- Phase 4: Onset detection — exactly one event per key strike
- Phase 5: Für Elise (Anfang) as self-authored MusicXML + note list
- Phase 6: Falling notes (Canvas 2D) over a zoomed keyboard + "Was ich höre"
- Phase 7: Wait mode with hit marking and score (v1 goal)
- Phase 8: Sheet music (OSMD) with cursor and view toggle
- Phase 9: Practice tools (hands, tempo, metronome, loop, jump)
- Phase 10: Library, MIDI upload, local progress (Dexie)
- Phase 11: PWA install, offline, mic resume, German hosting guide
