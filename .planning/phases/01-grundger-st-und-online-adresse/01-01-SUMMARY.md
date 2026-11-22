---
phase: 01-grundger-st-und-online-adresse
plan: 01
subsystem: app-shell
tags: [vite, react, typescript, zustand, vitest, walking-skeleton, ui-tokens]
requires: []
provides:
  - "useAppStore (Screen union welcome|overview|mic-placeholder, setScreen, onStart)"
  - "TEXTE German string module (src/texte.ts)"
  - "UI-SPEC design tokens + .app shell with bottom free zone (src/styles/tokens.css)"
  - "Build-time globals __APP_VERSION__, __BUILD_DATE__, __GIT_SHA__, __SECURE_URL__"
  - "Vitest + jsdom + Testing Library test infra"
affects: [01-02, 01-03, 01-04, 01-05]
tech-stack:
  added: [react 19.3, vite 8.3, typescript ~7.0, oxlint 1.9x, zustand ^5.1.0, vitest ^5.1.1, jsdom ^31.0.1, "@testing-library/react ^16.3.3", "@testing-library/dom ^10.4.2"]
  patterns: [state-based screen switching (no router), single Start gesture hook, CSS custom-property tokens, build-time define globals]
key-files:
  created: [package.json, package-lock.json, .gitignore, .oxlintrc.json, index.html, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, public/favicon.svg, src/main.tsx, src/App.tsx, src/App.test.tsx, src/globals.d.ts, src/texte.ts, src/state/appStore.ts, src/styles/tokens.css, src/screens/WelcomeScreen.tsx, src/screens/OverviewScreen.tsx]
  modified: []
decisions:
  - "Scaffolded create-vite 9.3.4 react-ts in a scratch dir and copied selected files (never --overwrite) to protect .planning/, .claude/, CLAUDE.md"
  - "__APP_VERSION__ read from package.json via readFileSync (npm_package_version unset under npx vitest)"
  - "TEXTE grouped by screen (willkommen.*, uebersicht.*) so plan 04 can add tile/back/warning groups"
  - "oxlint ignorePatterns exclude .claude/, .gsd/, .planning/, dist/ so lint only covers app code"
  - "Local branch renamed master -> main"
metrics:
  duration: "~5 min"
  completed: 2026-11-22
  tasks: 3
  files: 19
---

# Phase 1 Plan 01: Scaffold + Welcome-to-Overview Walking Skeleton Summary

Vite 8 / React 19 / TS 7 app scaffolded into the repo root (copied in, planning files kept), with a German welcome screen whose single Start button switches to the overview through a Zustand store. There is no router and no URL change. The UI-SPEC tokens and the 96px + safe-area bottom free zone live in one CSS file, and Vitest covers the flow end to end.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Package legitimacy check (zustand, vitest, jsdom, @testing-library/react, @testing-library/dom) | n/a | blocking-human checkpoint; the orchestrator showed it to the user, who replied **"approved"** before any install |
| 2 | Scaffold, test infra, branch to main, failing Start-flow test (RED) | 8f74fc3 | RED confirmed: vitest failed on unresolved `./state/appStore` |
| 3 | Welcome screen, Start to overview, tokens, bottom free zone (GREEN) | a304efd | 2/2 tests pass; lint and build pass; dist references `/klavier-app/assets/` |

## Verification

- `npm test`: 2 passed (title + Start button; Start leads to "Was möchtest du tun?", Start button gone, `location.href` unchanged)
- `npm run lint`: exit 0, no findings
- `npm run build`: exit 0; `dist/index.html` references `/klavier-app/assets/`
- Grep gates: `lang="de"`, `viewport-fit=cover`, `calc(96px + env(safe-area-inset-bottom))` present. No template English. No `getUserMedia`, `new AudioContext`, `location.hash`, `pushState` or `react-router` in src. No `enum`.
- `git branch --show-current`: main. `git ls-files .claude` is empty. package-lock.json is committed.
- src/App.css, src/index.css and src/assets/ do not exist

## TDD Gate Compliance

RED `test(01-01)` 8f74fc3 came before GREEN `feat(01-01)` a304efd. No refactor commit was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] oxlint scanned local tooling directories**
- **Found during:** Task 3
- **Issue:** `oxlint` with no paths linted `.claude/get-shit-done/**` (GSD tooling JS) and printed warnings unrelated to the app. In CI those directories don't exist, but locally the output was noisy and could turn into errors.
- **Fix:** Added `ignorePatterns: [".claude/**", ".gsd/**", ".planning/**", "dist/**"]` to `.oxlintrc.json`.
- **Files modified:** .oxlintrc.json
- **Commit:** a304efd

**2. [Orchestrator instruction] `.gsd/` added to .gitignore**
- Added alongside `.claude/settings.local.json` so the untracked tooling dir is never committed by accident. Commit 8f74fc3.

## Known Stubs

- `src/screens/OverviewScreen.tsx` renders only the header. This is intentional: plan 04 adds the tiles.
- `__SECURE_URL__` falls back to `https://<benutzername>.github.io/klavier-app/` when `GITHUB_REPOSITORY_OWNER` is unset (local builds). This is intentional: CI (plan 03) supplies the real owner.
- `'mic-placeholder'` screen falls back to OverviewScreen in App.tsx until plan 04.

## Self-Check: PASSED

- FOUND: all 19 key files (verified with ls/test after build)
- FOUND: 8f74fc3, a304efd in git log
