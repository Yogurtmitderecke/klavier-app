---
phase: 1
slug: grundger-st-und-online-adresse
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `01-RESEARCH.md` → "## Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.1.1 + jsdom 31 + @testing-library/react 16.3.3 (+ @testing-library/dom 10.4.2) |
| **Config file** | none — Wave 0 adds `test: { environment: 'jsdom' }` to `vite.config.ts` |
| **Quick run command** | `npm test` (= `vitest run`) |
| **Full suite command** | `npm run lint && npm test && npm run build && grep -q '/klavier-app/assets/' dist/index.html` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run lint && npm test && npm run build`
- **Before `/gsd:verify-work`:** Full suite green locally and in GitHub Actions, post-deploy `curl` passes, manual iPad/piano checks confirmed
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

*Filled in by the planner/executor with concrete task IDs. Requirement-level map from research:*

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| DEPL-01 | Build output works under `/klavier-app/` | build smoke | `npm run build && grep -q '/klavier-app/assets/' dist/index.html` | ❌ W0 | ⬜ pending |
| DEPL-01 | Live HTTPS URL serves the app | post-deploy smoke | `curl -sf https://<owner>.github.io/klavier-app/ \| grep -q 'Klavier-App'` | ❌ (after checkpoint) | ⬜ pending |
| DEPL-02 | Warning shown iff `isSecureContext === false`, German text, HTTPS link | component | `npx vitest run src/screens/WelcomeScreen.test.tsx` | ❌ W0 | ⬜ pending |
| DEPL-02 | `isInsecureContext()` logic | unit | `npx vitest run src/lib/secureContext.test.ts` | ❌ W0 | ⬜ pending |
| DEPL-03 | `formatVersion` output (Berlin date, sha) | unit | `npx vitest run src/lib/version.test.ts` | ❌ W0 | ⬜ pending |
| DEPL-03 | Version label rendered top-right | component | `npx vitest run src/components/VersionLabel.test.tsx` | ❌ W0 | ⬜ pending |
| UI-01 | `lang="de"`, no template English | static | `grep -q 'lang="de"' index.html && ! grep -rqE 'Vite \+ React\|count is' index.html src` | ❌ W0 | ⬜ pending |
| UI-01 | Screens render German copy | component | `npx vitest run src/App.test.tsx` | ❌ W0 | ⬜ pending |
| UI-02 | No URL/hash change on navigation | component | in `App.test.tsx` (`window.location.href` unchanged) | ❌ W0 | ⬜ pending |
| UI-02 | Bottom free zone + viewport-fit | static | `grep -q 'calc(96px + env(safe-area-inset-bottom))' src/styles/tokens.css && grep -q 'viewport-fit=cover' index.html` | ❌ W0 | ⬜ pending |
| UI-03 | Vite logo / template assets replaced | static | `! grep -qi 'vite' public/favicon.svg` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install `vitest jsdom @testing-library/react @testing-library/dom`; add `"test": "vitest run"` script and `test.environment: 'jsdom'`
- [ ] `src/lib/secureContext.test.ts`, `src/lib/version.test.ts`
- [ ] `src/screens/WelcomeScreen.test.tsx`, `src/App.test.tsx`, `src/components/VersionLabel.test.tsx`
- [ ] CI steps in `.github/workflows/deploy.yml`: lint, test, `dist` base-path grep

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App opens on iPad Safari + laptop via HTTPS | DEPL-01 | Needs real devices | Open the GitHub Pages URL on both devices, see the start page |
| Warning on a real insecure origin | DEPL-02 (optional) | github.io always redirects to HTTPS | `npx vite preview --host`, open the laptop's LAN IP on the iPad |
| New deploy → new version label on iPad | DEPL-03 | Real deploy + device cache | Push a change, reload after ≤10 min, compare the label |
| Readable/tappable at ~60 cm, bottom edge free | UI-02 | Physical setup | Piano test (SC 5): iPad on the music stand, tap "Start" |
| Own name/design, nothing from flowkey | UI-03 | Visual judgement | User looks at the screens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
