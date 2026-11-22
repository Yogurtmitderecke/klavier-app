---
phase: 01-grundger-st-und-online-adresse
plan: 04
subsystem: app-shell
tags: [overview-tiles, back-button, sub-page, https-warning, accessibility]
requires:
  - "01-01: appStore (Screen incl. 'mic-placeholder', setScreen, onStart), tokens.css, Welcome/Overview screens"
  - "01-02: SECURE_URL in src/config.ts, VersionLabel"
provides:
  - "Tile component (enabled / aria-disabled + 'kommt bald' badge)"
  - "BackButton component: fixed top-left contract for all later sub-pages (64px high, min 160px wide, setScreen('overview'))"
  - "WarningBar component (role=alert, link = SECURE_URL)"
  - "isInsecureContext(win) helper in src/lib/secureContext.ts"
  - "MicPlaceholderScreen (Phase 2 replaces its body with the real mic test)"
affects: [01-05, phase-02]
tech-stack:
  added: []
  patterns:
    - "Sub-page layout: .screen-header.screen-header--unterseite with BackButton first, h1 24px to the right, focus h1 on mount"
    - "Greyed features: <button aria-disabled='true'> plus inline aria-live='polite' note, never the disabled attribute"
    - "Runtime environment checks as pure helpers taking a Pick<Window, ...> argument for testability"
key-files:
  created:
    - src/components/Tile.tsx
    - src/components/BackButton.tsx
    - src/components/WarningBar.tsx
    - src/screens/MicPlaceholderScreen.tsx
    - src/lib/secureContext.ts
    - src/lib/secureContext.test.ts
    - src/screens/WelcomeScreen.test.tsx
  modified:
    - src/texte.ts
    - src/styles/tokens.css
    - src/App.tsx
    - src/App.test.tsx
    - src/screens/OverviewScreen.tsx
    - src/screens/WelcomeScreen.tsx
decisions:
  - "TEXTE grows by screen: TEXTE.uebersicht.kacheln.*, kommtBald, kommtBaldHinweis; TEXTE.zurueck (shared by all sub-pages); TEXTE.mikrofonPlatzhalter.*; TEXTE.warnung.*"
  - "Tile takes a separate `badge` prop so the tappable Mikrofon-Test tile shows 'kommt bald' on the normal surface (UI-SPEC tile contract) while gesperrt tiles always show it"
  - "Inline note fades out in the last 300 ms of its 3 s lifetime (phase 'ausblenden' sets opacity 0), then the text is removed; under prefers-reduced-motion it simply disappears at 3 s"
  - "App.tsx switches screens with three explicit conditionals instead of a ternary fallback"
metrics:
  duration: "~5 min"
  completed: 2026-11-22
  tasks: 3
  files: 13
---

# Phase 1 Plan 04: Overview Tiles, Zurück Sub-Page and No-HTTPS Warning Summary

The overview now has three big tiles. "Mikrofon-Test" opens a placeholder sub-page with a large "‹ Zurück" button at the top left. "Stücke üben" and "Einstellungen" are greyed out: tapping them shows "Dieser Bereich kommt bald." for 3 s. If the page is opened without HTTPS, a German warning appears directly above Start and links to the secure address. None of these steps change the URL or hash.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Overview tiles (RED) | 6064b6c | 3 new tests failed (no `.tile` buttons yet) |
| 1 | Overview tiles (GREEN) | 72c97f5 | Tile, OverviewScreen grid, note timer, tile CSS |
| 2 | Mikrofon-Test placeholder (RED) | 5ab691b | Flow test failed (fallback still rendered the overview) |
| 2 | Mikrofon-Test placeholder (GREEN) | 4412ba2 | BackButton, MicPlaceholderScreen, App switch |
| 3 | No-HTTPS warning (RED) | df144fb | secureContext module missing; the insecure-case alert test failed (the secure-case negative test passed trivially, as expected) |
| 3 | No-HTTPS warning (GREEN) | b3915a1 | isInsecureContext, WarningBar, WelcomeScreen integration |

## Verification

- `npm test`: 5 files, 13 tests pass
- `npm run lint`: 0 problems; `npm run build`: OK; `dist/index.html` references `/klavier-app/assets/`
- `src` has no `getUserMedia`, `new AudioContext`, `location.hash`, `pushState`, `react-router` or `dangerouslySetInnerHTML`
- No `github.io` literal in src/components or src/screens. The URL comes only from SECURE_URL.
- MicPlaceholderScreen does not render VersionLabel

## Deviations from Plan

None. The plan was executed as written. Small choices within its scope are listed under decisions: the `badge` prop and the 300 ms fade inside the 3 s window.

## Threat Model Coverage

- T-01-12: WarningBar href and visible text both come from SECURE_URL. No input is interpolated.
- T-01-13: All strings are static React text nodes. No dangerouslySetInnerHTML.
- T-01-14: MicPlaceholderScreen has no audio code (grep gate is clean).
- T-01-15: The note timers are cleared on re-tap and on unmount.

## Known Stubs

- MicPlaceholderScreen is an intentional placeholder (D-05). Phase 2 replaces its body with the real microphone test.
- The "Stücke üben" and "Einstellungen" tiles are intentionally gated with "kommt bald" (D-05). Later phases build them.

## Self-Check: PASSED

- FOUND: src/components/Tile.tsx, src/components/BackButton.tsx, src/components/WarningBar.tsx, src/screens/MicPlaceholderScreen.tsx, src/lib/secureContext.ts, src/lib/secureContext.test.ts, src/screens/WelcomeScreen.test.tsx
- FOUND commits: 6064b6c, 72c97f5, 5ab691b, 4412ba2, df144fb, b3915a1
