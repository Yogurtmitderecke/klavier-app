---
phase: 01-grundger-st-und-online-adresse
plan: 02
subsystem: app-shell
tags: [version-label, build-info, favicon, branding]
requires:
  - "01-01: __APP_VERSION__/__BUILD_DATE__/__GIT_SHA__/__SECURE_URL__ define globals, tokens.css, Welcome/Overview screens"
provides:
  - "formatVersion(semver, isoDate, sha) in src/lib/version.ts (de-DE, Europe/Berlin)"
  - "VERSION_LABEL and SECURE_URL constants in src/config.ts (plan 04 uses SECURE_URL)"
  - "VersionLabel component (top-right on welcome and overview)"
  - "Own favicon.svg in the Ebenholz palette"
affects: [01-03, 01-04, 01-05]
tech-stack:
  added: []
  patterns: [build-time globals read only through src/config.ts, Intl.DateTimeFormat with fixed time zone]
key-files:
  created: [src/lib/version.ts, src/lib/version.test.ts, src/config.ts, src/components/VersionLabel.tsx, src/components/VersionLabel.test.tsx]
  modified: [src/screens/WelcomeScreen.tsx, src/screens/OverviewScreen.tsx, src/styles/tokens.css, public/favicon.svg]
decisions:
  - "Version label is absolutely positioned top-right relative to .app (position: relative) on the welcome screen; inside the overview .screen-header it is a static flex item with margin-left: auto, so it can never overlap the h1 (header row also got flex-wrap for narrow widths)"
  - "Date formatter is created once at module level (Intl.DateTimeFormat de-DE, timeZone Europe/Berlin)"
metrics:
  duration: "~4 min"
  completed: 2026-11-22
  tasks: 2
  files: 9
---

# Phase 1 Plan 02: Version Label and Own Icon Summary

Each build now shows "Version 0.1.0 · DD.MM.YYYY · sha" in the top-right corner of the welcome and overview screens. The date is taken in Berlin time and the git short hash is baked in at build time. The template Vite logo is gone; the app now has its own piano-key icon in the Ebenholz palette.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Version label slice (RED) | 0503423 | RED confirmed: both new test files failed on unresolved `./version` / `./VersionLabel` |
| 1 | Version label slice (GREEN) | ddcfe46 | 5/5 tests pass (2 formatVersion, 1 VersionLabel, 2 existing App tests) |
| 2 | Own icon (UI-03) | 39284b8 | 64x64 SVG: #16181D rounded square, #F2EFE8 keys, one #E8A33D key, two black keys |

## Verification

- `npm test`: 3 files, 5 tests passed
- `npm run lint`: exit 0
- `npm run build`: exit 0; `dist/index.html` references `/klavier-app/assets/`; `cmp public/favicon.svg dist/favicon.svg` is identical
- Grep gates: `timeZone: 'Europe/Berlin'` and `de-DE` in version.ts; `formatVersion(__APP_VERSION__, __BUILD_DATE__, __GIT_SHA__)` and `export const SECURE_URL = __SECURE_URL__` in config.ts; `<VersionLabel` in both screens; `.version-label` rule has `var(--font-label)`, `tabular-nums`, `safe-area-inset-top` and no `bottom:`
- favicon.svg has no case-insensitive `vite`; public/icons.svg and src/assets/ do not exist; index.html favicon link unchanged (`image/svg+xml`)

## TDD Gate Compliance

RED `test(01-02)` 0503423 came before GREEN `feat(01-02)` ddcfe46. No refactor was needed.

## Deviations from Plan

None in substance. One layout detail was left to the executor: on the overview the label sits in the header row as a flex item, not absolutely positioned, so it shares the row with the h1 without overlapping it. The plan allowed this ("flex with the label on the right"). Its position (24px + safe area from the top, 32px + safe area from the right) matches the welcome screen because the `.app` padding provides the same offsets.

## Known Stubs

None added by this plan. In local builds, SECURE_URL still uses the `<benutzername>` placeholder from plan 01; CI (plan 03) sets the real owner.

## Self-Check: PASSED

- FOUND: src/lib/version.ts, src/lib/version.test.ts, src/config.ts, src/components/VersionLabel.tsx, src/components/VersionLabel.test.tsx, public/favicon.svg
- FOUND: 0503423, ddcfe46, 39284b8 in git log
