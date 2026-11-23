---
phase: 01-grundger-st-und-online-adresse
verified: 2026-11-23T15:30:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
---

# Phase 1: Grundgerüst und Online-Adresse Verification Report

**Phase Goal:** Der Nutzer kann die (noch fast leere) App über eine sichere HTTPS-Adresse auf dem iPad und dem Laptop öffnen; die Oberfläche ist deutsch, groß und gut lesbar.
**Status:** passed
**Re-verification:** No, initial verification

## Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|---|---|---|
| 1 | HTTPS-Adresse zeigt Startseite auf iPad und Laptop | VERIFIED | `curl` of https://yogurtmitderecke.github.io/klavier-app/ returns the HTML (lang="de", `/klavier-app/assets/...` base paths correct). 01-05-SUMMARY records iPad and laptop both showing the welcome screen. |
| 2 | Alles Deutsch, groß/lesbar, unten frei, eigener Name/Design | VERIFIED | `src/texte.ts` holds all strings in German. `tokens.css` has body 24px, heading 32px, display 56px, and `padding-bottom: calc(96px + env(safe-area-inset-bottom))`. Name "Klavier-App" with its own dark/amber palette. No "flowkey" in `src`. User confirmed readability, tiles, free bottom edge and design on the iPad (01-05). |
| 3 | Ohne HTTPS: verständliche deutsche Meldung | VERIFIED | `secureContext.ts` (`isSecureContext === false`), `WarningBar.tsx` and the `warnung` texts in `texte.ts`. Covered by `WelcomeScreen.test.tsx` and `secureContext.test.ts`. 13/13 vitest tests pass in my own run. The LAN device test was skipped, which is acceptable. |
| 4 | Versionsnummer sichtbar; iPad zeigt nach Änderung die neue | VERIFIED | `VersionLabel.tsx` renders `VERSION_LABEL`. The live bundle contains "0.2.0" and "4f96cca". The user saw 0.1.0 · ae9f87a, then 0.2.0 · 4f96cca, on the iPad. |
| 5 | Piano test: Text aus Spielposition lesbar | VERIFIED (human, done) | Recorded in 01-05-SUMMARY: "Lesbar aus Spielposition: ja", iPadOS 26.5.2. |

**Score:** 5/5

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| DEPL-01 | SATISFIED | Live GitHub Pages URL serves the app. `deploy.yml` builds and deploys it. |
| DEPL-02 | SATISFIED | WarningBar plus tests. |
| DEPL-03 | SATISFIED | VersionLabel, live in the deployed bundle. |
| UI-01 | SATISFIED | All strings in `texte.ts`, German. |
| UI-02 | SATISFIED | Large type tokens, bottom padding, user device test. |
| UI-03 | SATISFIED | Own name and palette. No flowkey content. |

All 6 IDs are mapped to Phase 1 in REQUIREMENTS.md and marked Complete. No orphaned requirements (DEPL-04 belongs to Phase 11).

## Anti-Patterns

No TBD/FIXME/XXX markers in `src`, `index.html` or `vite.config.ts`. Lint and tests pass (per the review and my own test run).

## Code Review Warnings (non-blocking)

- **WR-01** (placeholder `<benutzername>` in SECURE_URL for local builds): The deployed bundle contains the real URL `yogurtmitderecke.github.io/klavier-app/`, so the production goal is unaffected. It only matters for local LAN HTTP testing, which the user skipped. It is a quality issue and not a blocker. Recommended fix: hard-code the real owner as the fallback.
- **WR-02** (deploy job holds `pages: write` and `id-token: write` while running `npm ci` and tests): This is a hardening concern and does not prevent the goal. Recommended: split into build and deploy jobs.

Both can be fixed in a later quick task.

## Human Verification Required

None. The device tests were already completed in plan 01-05.

## Gaps Summary

No gaps. The phase goal is achieved: the app is live over HTTPS, German, large and readable, and shows its version. This was confirmed on the iPad and the laptop.

---

_Verified: 2026-11-23_
_Verifier: Claude (gsd-verifier)_
