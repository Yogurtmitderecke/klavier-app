---
phase: 01-grundger-st-und-online-adresse
plan: 03
subsystem: deployment
tags: [github-pages, github-actions, ci, https]
requires:
  - "01-01: vite base '/klavier-app/', GITHUB_REPOSITORY_OWNER-driven __SECURE_URL__, lint/test/build scripts"
  - "01-02: version label baking the git short hash into the bundle"
provides:
  - ".github/workflows/deploy.yml: lint + test + build + base-path gate, then deploy to GitHub Pages on every push to main"
  - "Public repo https://github.com/Yogurtmitderecke/klavier-app (origin, main tracks origin/main)"
  - "Live URL https://yogurtmitderecke.github.io/klavier-app/"
affects: [01-05]
tech-stack:
  added: []
  patterns: [official Vite GitHub Pages workflow with SHA-pinned actions, minimal permissions]
key-files:
  created: [.github/workflows/deploy.yml]
  modified: []
decisions:
  - "Hosting on GitHub Pages under user Yogurtmitderecke; Pages source = GitHub Actions"
  - "User accepted that code, CLAUDE.md and .planning/ are public (Task 2 Teil D: ok)"
metrics:
  duration: "~15 min (incl. human GitHub setup)"
  completed: 2026-11-23
  tasks: 3
  files: 1
---

# Phase 1 Plan 03: GitHub Pages Deploy Summary

The app is now live over HTTPS at https://yogurtmitderecke.github.io/klavier-app/. Every push to `main` runs lint, tests, build and a base-path check in GitHub Actions and then deploys automatically.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Official Vite Pages workflow with lint/test/base-path gates | 6110c58 | 5 actions SHA-pinned; permissions contents:read, pages:write, id-token:write; validated locally (npm ci, lint, test, build, base-path grep) |
| 2 | GitHub account, empty repo, Pages source (human-action) | — | User: Yogurtmitderecke, "Pages auf GitHub Actions: ja", "Projektplan öffentlich: ok". API check: `private: false`, `size: 0`, default branch main |
| 3 | First push, green deploy, live smoke test | — (no file changes) | Pushed by orchestrator from primary checkout; Git Credential Manager auth succeeded |

## Deployment record (plan 05 compares against this)

- **Live URL:** https://yogurtmitderecke.github.io/klavier-app/
- **Pushed commit (PUSHED = origin/main):** ae9f87a
- **Deployed semver:** 0.1.0
- **Actions run:** https://github.com/Yogurtmitderecke/klavier-app/actions/runs/45190368727 (conclusion: success)

## Smoke test results

- Live HTML contains `Klavier-App` and `/klavier-app/assets/index-B36E-DKR.js`
- Live JS bundle contains the pushed short hash `ae9f87a` (version label shows the deployed commit)
- Live JS bundle contains `https://yogurtmitderecke.github.io/klavier-app/` (SECURE_URL lowercased from GITHUB_REPOSITORY_OWNER)
- `http://yogurtmitderecke.github.io/klavier-app/` answers `301 Moved Permanently` (HTTPS enforced)
- `.claude/settings.local.json` and `.gsd/` are git-ignored; no `.claude/` files tracked

## Deviations

- Task 1 ran in a worktree executor; Tasks 2–3 were completed by the orchestrator in the primary checkout (push must come from the real `main`). Plan 04 had already been merged before the push, so the first deploy already includes the tiles, Zurück sub-page and HTTPS warning.

## Self-Check: PASSED
