# Phase 1: Grundgerüst und Online-Adresse - Research

**Researched:** 2026-11-22
**Domain:** Vite + React + TS scaffold, static deploy to GitHub Pages via Actions, secure-context detection, build-time version stamping, large-type iPad-landscape UI shell
**Confidence:** HIGH (stack, deploy workflow, scaffold behaviour verified in this session); MEDIUM for iPad-specific caching and display behaviour (must be checked on the device)

## Summary

This phase is a standard pattern: scaffold with the `create-vite` `react-ts` template, add a tiny state-switched UI with three screens, stamp a version string at build time through Vite `define`, and deploy `dist/` to GitHub Pages using the official Vite workflow (`actions/upload-pages-artifact` plus `actions/deploy-pages`). Nothing here is novel. The risk sits in the edges: the repo is **not empty** (`.planning/`, `.claude/`, `CLAUDE.md`, `.git`), the local branch is `master` while the workflow and the GitHub default are `main`, GitHub Pages serves HTML with `Cache-Control: max-age=600`, and github.io always redirects HTTP to HTTPS, so the "no HTTPS" warning **cannot be seen on the deployed site** and has to be tested over the LAN or in unit tests.

**PWA / service worker does NOT belong in this phase.** The roadmap puts vite-plugin-pwa in Phase 11, and CONTEXT.md scopes Phase 1 to "no mic, audio, songs or settings". Leaving the service worker out makes DEPL-03 simpler: with no SW, a new deploy reaches the iPad as soon as Safari's HTTP cache for `index.html` expires (at most about 10 minutes on GitHub Pages) or on a reload. Vite's content-hashed asset filenames do the rest.

The user is a non-programmer, and `gh` CLI is not installed. Creating the GitHub account and repo, enabling Pages (Source: GitHub Actions), and the first `git push` login through Git Credential Manager must be **human-action checkpoints with German step-by-step text**.

**Primary recommendation:** Scaffold `react-ts` into a scratch folder and copy the files into the repo root (never `--overwrite`). Add Zustand plus Vitest (jsdom and Testing Library), set `base: '/klavier-app/'` and `define` for `__APP_VERSION__`, `__BUILD_DATE__`, `__GIT_SHA__` and `__SECURE_URL__`, rename the branch to `main`, and use Vite's official `deploy.yml` with added `lint`/`test` steps and a `dist` base-path check before upload.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Screen flow
- **D-01:** The app opens on a **welcome screen** with the title "Klavier-App" and one large **"Start"** button. Tapping Start leads to the overview with the tiles.
- **D-02:** The Start tap is the app's single user gesture per session. From Phase 2 onward, this tap will also create and resume the shared AudioContext and request the microphone. Build it so that hook can be added later, for example with a `onStart` handler in one place. Do NOT request the mic in Phase 1.
- **D-03:** Screens switch through app state (Zustand or simple React state). No router and no URL or hash changes, because they can trigger repeated mic prompts in iOS standalone mode.

#### Overview tiles
- **D-04:** Exactly **3 large tiles**: "Mikrofon-Test", "Stücke üben", "Einstellungen". (Calibration will later live under Einstellungen or Mikrofon-Test, not as its own tile.)
- **D-05:** Tiles that aren't built yet are shown **greyed out with the label "kommt bald"**. Tapping them does nothing, or shows a short "kommt bald" note. In Phase 1, all three tiles may be placeholders. Claude may open a simple placeholder sub-page for "Mikrofon-Test" if that helps demonstrate navigation.

#### Navigation
- **D-06:** Sub-pages have a large **"Zurück"** button in the **top left**, always in the same spot. Nothing important sits at the bottom edge, because the music-stand ledge covers it.

#### HTTPS warning (DEPL-02)
- **D-07:** If `window.isSecureContext` is false, show a **prominent warning bar on the welcome screen, directly above the Start button**. It says in plain German why the microphone won't work there and links to the correct secure address (the GitHub Pages HTTPS URL). The app otherwise stays usable, so this is not a blocking error page.

### Claude's Discretion
The user chose not to discuss the following. Claude decides sensibly and documents the choices in the plan.
- **Look & colours:** calm, plain, our own design (nothing resembling flowkey). Light or dark is Claude's choice, with high contrast. Sizes must work at about 60 cm in landscape on the iPad: body text ≥ about 24 px, buttons and tiles with large touch targets (≥ about 64 px tall). Keep the bottom screen edge free.
- **Version number format and position:** for example a semantic version from `package.json`, optionally plus a short commit hash or build date injected at build time. Show it small but readable, e.g. on the welcome screen or in a corner, not at the bottom edge. It must change on each deploy so the user can tell that an update arrived.
- **GitHub setup:** repo name `klavier-app` (Vite `base: '/klavier-app/'`), public repo (free GitHub Pages; acceptable because all content is self-made), and a deploy workflow based on the official Vite GitHub Pages `deploy.yml`. The planner must include a clear German step-by-step checkpoint for the user (non-programmer): create or log into the GitHub account, create the repo, enable Pages, and push. The user's GitHub account status was not discussed, so the plan must handle both cases.
- **iPadOS version:** STATE.md lists it as an open question. Ask the user during the Phase 1 test step at the piano (Settings → General → Info), and record the answer in STATE.md.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within the phase scope.

**Also binding: `01-UI-SPEC.md` (status: approved).** It fixes the tokens (colours, 20/24/32/56 px type, spacing), screen layouts, the 96 px + safe-area bottom free zone, the copy (all German strings), the version format `Version {semver} · {DD.MM.YYYY} · {shorthash}` top-right, and `SECURE_URL` from one constant. The planner must reference it directly and not re-derive the design.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPL-01 | Open the app via an HTTPS address (free hosting) on iPad and laptop | Official Vite GitHub Pages workflow (verified YAML below), `base: '/klavier-app/'`, branch `main`, Pages Source = GitHub Actions (human checkpoint). github.io enforces HTTPS (HTTP returns 301 to HTTPS, verified). |
| DEPL-02 | Understandable German message when opened without HTTPS | `window.isSecureContext` (MDN). localhost/127.0.0.1 count as secure, so test via a LAN IP (`vite preview --host`) plus unit tests that stub `isSecureContext=false`. The deployed site never shows it, because of the HTTPS redirect. |
| DEPL-03 | Visible version number to see that an update arrived | Vite `define` with semver from `npm_package_version`, build date (Europe/Berlin) and `GITHUB_SHA` short hash. No SW in this phase. GitHub Pages `max-age=600` means the update shows within ≤10 min or after a reload. |
| UI-01 | Whole UI in German | `<html lang="de">`, all strings in `src/texte.ts` (per UI-SPEC), template English removed, grep check for leftover template strings |
| UI-02 | Readable and tappable at 60 cm, landscape, bottom edge free | UI-SPEC tokens. `viewport-fit=cover`, `env(safe-area-inset-*)`, `min-height: 100dvh`, `padding-bottom: calc(96px + env(safe-area-inset-bottom))`. Manual check at the piano. |
| UI-03 | Own name and design, nothing from flowkey | UI-SPEC "Ebenholz" dark palette, own favicon SVG (replace the Vite logo), remove template assets |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack is fixed: React + TypeScript + Vite through `npm create vite@latest` `react-ts`. **Keep template defaults** (React 19.3, Vite 8.3, TS ~7.0, oxlint).
- **No typescript-eslint** (peer `typescript <6.1` conflicts with TS 7). Lint with oxlint only.
- **State: Zustand 5.1.x. No router library, no hash routing**: switch screens via app state.
- **Hosting: GitHub Pages via GitHub Actions**, Vite `base: '/klavier-app/'`.
- Unit tests: **Vitest 5.1.x**.
- Storage is local only. No server, no login (nothing to store in Phase 1).
- Must work in **Safari on the iPad** (main device).
- Licence: nothing from flowkey. Own name and design.
- Small phases. Do not pull mic/audio work into Phase 1 (CONTEXT also forbids it).
- One shared AudioContext created on a user tap, later. Phase 1 only provides the `onStart()` hook.
- GSD workflow: edits happen inside GSD execute-phase (this is planned phase work).
- Git: commit/push only inside the workflow. Don't commit secrets such as `.claude/settings.local.json`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Screen switching (welcome / overview / mic placeholder) | Browser / Client (Zustand store) | — | D-03: no URL changes. Pure client state. |
| Secure-context detection + warning | Browser / Client | — | `window.isSecureContext` is only knowable at runtime in the browser |
| Version string | Build (Vite `define` in CI) | Browser (display) | Must be baked into the bundle at build time so each deploy differs |
| `SECURE_URL` | Build (derive from `GITHUB_REPOSITORY_OWNER`) | Browser (link) | Avoids hard-coding the not-yet-known GitHub username |
| HTTPS, hosting, caching | CDN / Static (GitHub Pages) | — | GitHub Pages terminates TLS, enforces HTTPS, sets `max-age=600` |
| Build + deploy pipeline | CI (GitHub Actions) | — | Official `deploy-pages` flow |
| Layout / readability | Browser (CSS tokens) | — | UI-SPEC tokens in one CSS file |

There is no API, database or SSR tier in this project.

## Standard Stack

### Core
| Library | Version (npm, 2026-11-22) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| create-vite (`react-ts` template) | 9.3.4 | Scaffold | User-fixed. The template ships `react ^19.3.1`, `vite ^8.3.6`, `typescript ~7.0.2`, `@vitejs/plugin-react ^6.1.2`, `oxlint ^1.90.0`, `@types/node ^24.19.2` [VERIFIED: npm pack create-vite@9.3.4, template package.json] |
| react / react-dom | 19.3.1 | UI | Template default [VERIFIED: npm registry] |
| vite | 8.3.8 | Bundler / dev server | Template default [VERIFIED: npm registry] |
| typescript | 7.0.2 (`~7.0.2`) | Types, `tsc -b` in `build` | Template default [VERIFIED: npm registry] |
| zustand | 5.1.0 | `screen` state (and later app state) | CLAUDE.md prescribes it. Peers `react >=18` [VERIFIED: npm registry] |

### Supporting (dev)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 5.1.1 | Unit/component tests | Peer `vite ^6.4 \|\| ^7 \|\| ^8`, node `^22.12 \|\| ^24 \|\| >=26` [VERIFIED: npm registry] |
| jsdom | 31.0.1 | DOM environment for component tests | `test.environment: 'jsdom'`. Node `^22.22.2 \|\| ^24.15 \|\| >=26` [VERIFIED: npm registry] |
| @testing-library/react | 16.3.3 | Render/query components | Peers react 18/19 and `@testing-library/dom ^10` [VERIFIED: npm registry] |
| @testing-library/dom | 10.4.2 | Required peer of RTL | Must be installed explicitly [VERIFIED: npm registry] |
| @testing-library/user-event | 14.6.13 | Simulate taps/clicks | Optional. `fireEvent.click` is enough for Phase 1 |

**Deliberately NOT added:** `@testing-library/jest-dom` (8.0.0 was published 2026-11-19, three days ago, and changed its peers to `vitest >=5 <6`. It's too fresh, and plain `expect(...).toBeTruthy()` / `textContent` assertions are sufficient). Also not added: vite-plugin-pwa (Phase 11), any router, any UI kit, any web font.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand for `screen` | `useState` in `App` | D-03 allows either. Zustand is recommended because CLAUDE.md fixes it and Phase 2's audio loop needs out-of-React reads. It costs one tiny store. |
| jsdom | happy-dom 21.0.4 | Faster but less standard. No reason to deviate. |
| GitHub Pages | Cloudflare Pages | Only if the `base` sub-path causes problems. Not expected. |

**Installation (after copying the scaffold into the repo root):**
```bash
npm install
npm install zustand@^5.1.0
npm install -D vitest@^5.1.1 jsdom@^31.0.1 @testing-library/react@^16.3.3 @testing-library/dom@^10.4.2
```

## Package Legitimacy Audit

slopcheck could **not** be run: `pip install slopcheck` was denied by the environment's permission classifier. Per protocol, packages beyond the user-fixed template are tagged `[ASSUMED]` for legitimacy. All of them are long-established, well-known packages from official orgs with no postinstall scripts (checked via `npm view <pkg> scripts.postinstall`, all empty).

| Package | Registry | Age | Source Repo | Postinstall | slopcheck | Disposition |
|---------|----------|-----|-------------|-------------|-----------|-------------|
| create-vite / vite / react / typescript / @vitejs/plugin-react / oxlint | npm | years | vitejs/vite, facebook/react, microsoft/typescript, oxc-project | n/a (template) | not run | Approved (user-fixed via CLAUDE.md) |
| zustand | npm | 6+ yrs | github.com/pmndrs/zustand | none | not run | Approved [ASSUMED] (named in CLAUDE.md) |
| vitest | npm | 4+ yrs | github.com/vitest-dev/vitest | none | not run | Approved [ASSUMED] (named in CLAUDE.md) |
| jsdom | npm | 10+ yrs | github.com/jsdom/jsdom | none | not run | Approved [ASSUMED] |
| @testing-library/react, @testing-library/dom | npm | 5+ yrs | github.com/testing-library | none | not run | Approved [ASSUMED] |
| @testing-library/jest-dom 8.0.0 | npm | 3 days (this major) | github.com/testing-library/jest-dom | none | not run | Not used (too fresh, not needed) |

**Packages removed due to [SLOP]:** none. **Flagged [SUS]:** none. Because slopcheck was unavailable, the planner may add one `checkpoint:human-verify` before `npm install` of the dev test packages, or accept them on the basis of CLAUDE.md naming Vitest and Zustand explicitly.

## Architecture Patterns

### System Architecture Diagram

```
 git push (main) ──► GitHub Actions: checkout → setup-node(lts) → npm ci → lint → test → build
                                                                              │
                     vite.config.ts define: __APP_VERSION__ (package.json),   │
                     __BUILD_DATE__ (now, Europe/Berlin), __GIT_SHA__         │
                     (GITHUB_SHA[0..7]), __SECURE_URL__ (GITHUB_REPOSITORY_OWNER)
                                                                              ▼
                              check dist/index.html uses /klavier-app/assets/ → upload-pages-artifact → deploy-pages
                                                                              │
                                                                              ▼
           https://<owner>.github.io/klavier-app/  (HTTPS enforced; index.html Cache-Control: max-age=600)
                                                                              │
  iPad Safari / laptop ──HTTP──► 301 ──► HTTPS ──► index.html ──► hashed JS/CSS
                                                                              │
                                                                              ▼
                     main.tsx → <App/> reads useAppStore.screen
                         ├─ 'welcome'  → Title, [WarningBar if !isSecureContext], Start → onStart() → setScreen('overview')
                         ├─ 'overview' → 3 Tiles (Mikrofon-Test → 'mic-placeholder'; others → "kommt bald" note)
                         └─ 'mic-placeholder' → BackButton → 'overview'
                     VersionLabel (top-right, welcome + overview)

  LAN test path (DEPL-02): laptop `vite preview --host` → iPad opens http://<LAN-IP>:4173/klavier-app/ → isSecureContext=false → WarningBar
```

### Recommended Project Structure
```
.github/workflows/deploy.yml   # official Vite Pages workflow + lint/test/dist check
index.html                     # lang="de", title, viewport-fit=cover, noscript text
public/favicon.svg             # OWN icon (replace Vite logo); delete public/icons.svg
vite.config.ts                 # base, define, test{environment:'jsdom'}
src/
├── main.tsx                   # template entry (imports styles/tokens.css)
├── App.tsx                    # screen switch only
├── config.ts                  # SECURE_URL, VERSION_LABEL (read from define globals)
├── texte.ts                   # all German UI strings (UI-SPEC copy table)
├── globals.d.ts               # declare const __APP_VERSION__ etc.
├── state/appStore.ts          # Zustand: screen, setScreen, onStart()
├── lib/
│   ├── secureContext.ts       # isInsecure(win) – pure, testable
│   └── version.ts             # formatVersion(semver, isoDate, sha) – pure, testable
├── styles/tokens.css          # UI-SPEC custom properties + global rules
├── components/                # Button, Tile, BackButton, WarningBar, VersionLabel
└── screens/                   # WelcomeScreen, OverviewScreen, MicPlaceholderScreen
```
This matches the "app shell" layer of `.planning/research/ARCHITECTURE.md`. `src/audio/` etc. come in later phases. Delete the template's `App.css`, `index.css` (or turn it into the tokens file) and `src/assets/*`.

### Pattern 1: Scaffold into a non-empty repo (copy, never `--overwrite`)
**What:** `create-vite --overwrite` deletes **everything in the target except `.git`** [VERIFIED: create-vite 9.3.4 `dist/index.js`, function removes every entry `!== '.git'`]. That would wipe `.planning/`, `.claude/` and `CLAUDE.md`.
**Do instead:**
```bash
# in the scratchpad/temp dir, NOT in the repo
npm create vite@9.3.4 scaffold -- --template react-ts --no-interactive
# create-vite renames _gitignore → .gitignore and _oxlintrc.json → .oxlintrc.json during scaffold
# then copy scaffold/* and scaffold/.gitignore, scaffold/.oxlintrc.json into the repo root
```
Change `package.json` `"name"` to `"klavier-app"`, `"version"` to `"0.1.0"`, and add `"test": "vitest run"`. Append to `.gitignore`: `.claude/settings.local.json` (CLAUDE.md: don't commit secrets). Whether the rest of `.claude/` and `.planning/` go into the **public** repo is an open question (see below).

### Pattern 2: Build-time version + secure URL via `define`
```ts
/// <reference types="vitest/config" />
// vite.config.ts  — Source: vitest.dev/config (reference + `test` key), vite.dev/config/shared-options#define
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'

function gitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short=7 HEAD').toString().trim() } catch { return 'dev' }
}
const owner = (process.env.GITHUB_REPOSITORY_OWNER ?? '<benutzername>').toLowerCase()

export default defineConfig({
  base: '/klavier-app/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __SECURE_URL__: JSON.stringify(`https://${owner}.github.io/klavier-app/`),
  },
  test: { environment: 'jsdom' },
})
```
```ts
// src/globals.d.ts
declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string
declare const __GIT_SHA__: string
declare const __SECURE_URL__: string
```
```ts
// src/lib/version.ts — pure, unit-tested
export function formatVersion(semver: string, isoDate: string, sha: string): string {
  const d = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' })
    .format(new Date(isoDate))            // "22.11.2026"
  return `Version ${semver} · ${d} · ${sha}`
}
```
Notes:
- `npm_package_version` is set by npm when the build runs via `npm run build`, both locally and in CI [ASSUMED, standard npm behaviour]. The alternative is `import pkg from './package.json' with { type: 'json' }` in vite.config.ts.
- The CI runner is in UTC. Format the date with `timeZone: 'Europe/Berlin'` so a late-evening deploy doesn't show tomorrow's or yesterday's date.
- The **sha makes every deploy distinct** even if semver isn't bumped. That satisfies DEPL-03 without the user having to bump versions.
- Vitest uses the same vite config, so the `define` globals also exist in tests [CITED: vitest.dev/config, "Vite options such as `define` apply"; put `define` top-level, not inside `test`].
- `tsconfig.node.json` includes only `vite.config.ts` with `types: ["node"]`, so `node:child_process` and `process` type-check. `src/globals.d.ts` is covered by `tsconfig.app.json` `include: ["src"]`.

### Pattern 3: Secure-context check (pure + injectable)
```ts
// src/lib/secureContext.ts
export function isInsecureContext(win: Pick<Window, 'isSecureContext'> = window): boolean {
  return win.isSecureContext === false
}
```
- MDN: `localhost`, `127.0.0.0/8`, `::1`, `*.localhost` and `file:` are "potentially trustworthy" [CITED: developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts]. So `npm run dev` on the laptop **never** shows the warning. Only a LAN IP over HTTP (iPad → `http://192.168.x.x:4173/klavier-app/`) does.
- `navigator.mediaDevices` is undefined in insecure contexts [ASSUMED: training knowledge, consistent with PITFALLS.md warning sign]. Phase 1 keys off `isSecureContext` only (D-07). Phase 2 will additionally guard `navigator.mediaDevices?.getUserMedia`.
- Render the WarningBar only when `isInsecureContext()` is true; it never blocks Start (D-07).

### Pattern 4: State-based screens with a single Start hook
```ts
// src/state/appStore.ts
import { create } from 'zustand'
export type Screen = 'welcome' | 'overview' | 'mic-placeholder'
type AppState = { screen: Screen; setScreen: (s: Screen) => void; onStart: () => void }
export const useAppStore = create<AppState>()((set) => ({
  screen: 'welcome',
  setScreen: (screen) => set({ screen }),
  // D-02: single user-gesture entry point. Phase 2 adds AudioContext create/resume + getUserMedia HERE.
  onStart: () => set({ screen: 'overview' }),
}))
```
No `history.pushState`, no `location.hash`, no router (D-03). For focus management (UI-SPEC), each screen focuses its `<h1 tabIndex={-1}>` in a `useEffect` on mount.

### Pattern 5: iPad landscape layout shell
```css
/* src/styles/tokens.css (excerpt; all values from 01-UI-SPEC.md) */
html { -webkit-text-size-adjust: 100%; background: var(--color-bg); }
.app {
  min-height: 100dvh;                       /* Safari 15.4+; fall back to 100vh before it */
  box-sizing: border-box;
  padding: calc(24px + env(safe-area-inset-top)) calc(32px + env(safe-area-inset-right))
           calc(96px + env(safe-area-inset-bottom)) calc(32px + env(safe-area-inset-left));
}
button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
```
`env(safe-area-inset-*)` returns non-zero values only with `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. In a normal Safari tab on iPad, the insets are usually 0 and the browser toolbar eats vertical space (landscape is roughly 1180×~740 CSS px usable on an 11" iPad) [ASSUMED]. The fixed 96 px bottom free zone keeps D-06 true either way.

### Pattern 6: Deploy workflow (official Vite sample, extended)
Verified verbatim from `vitejs/vite/docs/guide/static-deploy-github-pages.yaml` (main branch, fetched 2026-11-22) [VERIFIED: raw.githubusercontent.com]:
```yaml
name: Deploy static content to Pages
on:
  push:
    branches: ['main']
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: 'pages'
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      - name: Set up Node
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      # --- added for this project ---
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      # ------------------------------
      - name: Build
        run: npm run build
      # --- added: fail if base path is wrong (blank page on Pages) ---
      - name: Check base path
        run: grep -q '/klavier-app/assets/' dist/index.html
      - name: Setup Pages
        uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5
```
Keep the SHA pins as they are. `npm ci` needs a committed `package-lock.json`.

### Anti-Patterns to Avoid
- **`create-vite --overwrite` in the repo root:** deletes `.planning/`, `.claude/`, `CLAUDE.md`.
- **Hash/URL routing or `react-router`:** violates D-03 and CLAUDE.md.
- **Adding vite-plugin-pwa / a service worker now:** a stale-SW cache would make DEPL-03 confusing ("new version doesn't show"). It belongs to Phase 11.
- **Hard-coding the GitHub username in components:** use `__SECURE_URL__` → `config.ts`.
- **Requesting the mic or creating an AudioContext in `onStart`:** Phase 2 only.
- **Using `--no-interactive` without `--template`:** fails or picks defaults. Always pass `--template react-ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deploy to Pages | gh-pages branch push scripts, `peaceiris/actions-gh-pages` | Official `actions/upload-pages-artifact` + `actions/deploy-pages` (Vite sample) | Officially documented, OIDC-based, no tokens to manage |
| Version stamping | Manual edit of a version constant per deploy | `define` with git sha + build date from CI env | Changes automatically every deploy |
| Asset URLs under sub-path | Manual `/klavier-app/` prefixes | Vite `base` (rewrites built asset URLs and `index.html` references) [CITED: vite.dev/guide/build#public-base-path]; `import.meta.env.BASE_URL` in code | Prevents blank-page 404s |
| HTTPS / certificate | Anything | GitHub Pages (automatic, HTTPS enforced) | Verified: `http://pages.github.com/` → 301 to `https://` |
| Cache busting of JS/CSS | Query-string hacks | Vite content-hashed filenames (default) | Only `index.html` is unhashed; it expires in ≤10 min |
| Secure-context detection | Checking `location.protocol === 'https:'` | `window.isSecureContext` | Protocol check is wrong for localhost (secure over http) |

**Key insight:** Everything in this phase has an official, boring solution. The only custom code is the UI shell, two pure helpers and one Zustand store.

## Runtime State Inventory

Not a rename/refactor phase, so this section is omitted. (Greenfield. The only pre-existing state is the git repo on branch `master` with 9 commits and no remote, verified via `git branch -a` / `git remote -v`.)

## Common Pitfalls

### Pitfall 1: Branch mismatch (`master` locally vs `main` in workflow)
**What goes wrong:** The workflow triggers on `main`. The local repo is on `master` (verified). If pushed as `master`, the deploy never runs, and the `github-pages` environment's default protection rule only allows the default branch.
**How to avoid:** Run `git branch -M main` before the first push, then `git push -u origin main`. Create the GitHub repo **empty** (no README, no .gitignore, no licence) so the first push doesn't conflict.
**Warning signs:** The Actions tab shows no run after push, or "Branch 'master' is not allowed to deploy to github-pages".

### Pitfall 2: Pages not enabled / wrong source
**What goes wrong:** `actions/configure-pages` fails with "Get Pages site failed" if Pages isn't enabled with Source = **GitHub Actions**. The default `GITHUB_TOKEN` cannot enable Pages itself [ASSUMED: configure-pages' `enablement` input needs a PAT].
**How to avoid:** In the human checkpoint, set Settings → Pages → Build and deployment → Source: **GitHub Actions** [CITED: vite.dev/guide/static-deploy]. If the first run failed because of ordering, re-run it (Actions → run → "Re-run all jobs") or trigger `workflow_dispatch`.

### Pitfall 3: Blank page on GitHub Pages (wrong `base`)
**What goes wrong:** Without `base: '/klavier-app/'`, `index.html` references `/assets/…`, which returns 404 under the project sub-path.
**How to avoid:** Set `base`, and keep the CI `grep` check on `dist/index.html`. The repo name must be exactly `klavier-app`. If the user picks another name, change `base` and the `__SECURE_URL__` path.

### Pitfall 4: "The iPad still shows the old version"
**What goes wrong:** GitHub Pages sends `Cache-Control: max-age=600` for HTML [VERIFIED: `curl -I https://pages.github.com/`]. Safari may show the old `index.html`, and so the old version label, for up to 10 minutes. The Actions build itself also takes about 1–2 minutes.
**How to avoid:** In the German instructions: "Nach dem Hochladen ca. 2 Minuten warten, bis der grüne Haken bei GitHub → Actions erscheint. Dann in Safari die Seite neu laden (Pfeil-Symbol in der Adresszeile). Zeigt sie noch die alte Version, ein paar Minuten warten und erneut laden." No service worker exists in Phase 1, so nothing else can pin an old version. Don't try `<meta http-equiv>` cache hacks: browsers ignore them for HTTP caching [ASSUMED].

### Pitfall 5: The HTTPS warning can't be demonstrated on the real address
**What goes wrong:** github.io redirects HTTP to HTTPS (verified 301), and `localhost` is a secure context, so neither shows the warning. A verifier might wrongly mark DEPL-02 as failing.
**How to avoid:** (a) Automated: a Vitest component test renders `WelcomeScreen` with `isSecureContext` stubbed `false` and asserts the German text and link, and that it's absent when `true`. (b) Manual (optional, needs the same Wi-Fi): laptop runs `npm run build && npx vite preview --host`; the iPad opens `http://<laptop-IP>:4173/klavier-app/`. Windows Firewall will ask to allow Node; that is a human action. If this is too fiddly for the user, an equivalent laptop-only check is opening `http://<own-LAN-IP>:4173/klavier-app/` in the laptop browser (a LAN IP is also not secure).

### Pitfall 6: Git push authentication on Windows
**What goes wrong:** `gh` is not installed (verified). An agent cannot create the GitHub repo or log in.
**How to avoid:** The user creates the repo in the browser. The agent then runs `git remote add origin https://github.com/<user>/klavier-app.git` and `git push -u origin main`. Git for Windows' Credential Manager opens a browser login window, which the user completes [ASSUMED: GCM bundled with Git for Windows 2.56]. This is a `checkpoint:human-action`.

### Pitfall 7: Public repo exposes planning files
**What goes wrong:** A public repo publishes `.planning/`, `CLAUDE.md` and `.claude/` (GSD tooling, possibly `settings.local.json`).
**How to avoid:** Always ignore `.claude/settings.local.json`. Ask the user whether `.planning/` may be public; it contains no secrets, but it does contain the user's plans. See Open Questions.

### Pitfall 8: TS 7 + `tsc -b` strictness breaks the build in CI
**What goes wrong:** The template enables `noUnusedLocals`/`noUnusedParameters`/`erasableSyntaxOnly`. Leftover template imports or `enum`s fail `npm run build`.
**How to avoid:** Use string-literal unions instead of `enum`. Run `npm run build` locally (the executor) before every push.

### Pitfall 9: Leftover template content (UI-01/UI-03)
**What goes wrong:** "Vite + React", the Vite/React logos, `lang="en"`, `favicon.svg` (Vite logo) and `icons.svg` stay in.
**How to avoid:** Delete `src/assets/*`, `public/icons.svg` and `App.css`, and replace `public/favicon.svg` with an own simple icon. Automated grep: no `Vite`, `React`, `count is` or `lang="en"` in `index.html` or `src/**/*.tsx` user-visible strings.

## Code Examples

### Component test for DEPL-02 (no jest-dom needed)
```tsx
// src/screens/WelcomeScreen.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { WelcomeScreen } from './WelcomeScreen'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('WelcomeScreen HTTPS-Warnung', () => {
  it('zeigt die Warnung ohne sichere Verbindung', () => {
    vi.stubGlobal('isSecureContext', false)
    render(<WelcomeScreen />)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('nicht sicher verbunden')
    expect(alert.querySelector('a')?.getAttribute('href')).toMatch(/^https:\/\/.+\/klavier-app\/$/)
  })
  it('zeigt keine Warnung bei HTTPS', () => {
    vi.stubGlobal('isSecureContext', true)
    render(<WelcomeScreen />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
```
In the jsdom environment `globalThis === window`, so `vi.stubGlobal('isSecureContext', …)` affects `window.isSecureContext` [ASSUMED. If jsdom defines it as a non-writable getter, call `isInsecureContext({ isSecureContext: false })` directly or pass a prop/injected checker instead].

### Version unit test
```ts
import { expect, it } from 'vitest'
import { formatVersion } from './version'
it('formatiert Version, Datum (Berlin) und Hash', () => {
  expect(formatVersion('0.1.0', '2026-11-22T23:30:00Z', 'a1b2c3d')).toBe('Version 0.1.0 · 23.11.2026 · a1b2c3d')
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gh-pages` branch + `peaceiris/actions-gh-pages` | `actions/deploy-pages` with Pages Source = "GitHub Actions" | 2022+ (now the Vite docs default) | No `gh-pages` branch; Settings source must be "GitHub Actions" |
| ESLint + typescript-eslint in template | oxlint in the create-vite template | create-vite 9.x | Don't add typescript-eslint (TS 7 conflict) |
| `src/vite-env.d.ts` | `"types": ["vite/client"]` in `tsconfig.app.json` | Current template | Put own globals in `src/globals.d.ts` |
| `100vh` on iOS | `100dvh` | Safari 15.4 | Correct height with the dynamic toolbar |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npm_package_version` is available during `npm run build` | Pattern 2 | Version shows `0.0.0`. Fix: import package.json in vite.config |
| A2 | `navigator.mediaDevices` is undefined in insecure contexts | Pattern 3 | None for Phase 1 (keyed on `isSecureContext`) |
| A3 | Usable iPad landscape viewport is about 1180×740 in a Safari tab | Pattern 5 | Layout tighter than expected. The UI-SPEC sizes still fit, check on device |
| A4 | `configure-pages` cannot enable Pages with the default token | Pitfall 2 | None. The human enables Pages anyway |
| A5 | `<meta http-equiv>` cache hints are ignored by Safari for HTTP caching | Pitfall 4 | None. Not used |
| A6 | Git Credential Manager is bundled and opens a browser login | Pitfall 6 | The user needs a PAT instead. Give German fallback steps |
| A7 | `vi.stubGlobal('isSecureContext', false)` works in jsdom 31 | Code Examples | Test fails. Use the injectable `isInsecureContext(win)` / prop instead |
| A8 | Package legitimacy of zustand/vitest/jsdom/RTL (slopcheck not run) | Package audit | Very low. All are long-standing official packages |

## Open Questions (RESOLVED)

1. **GitHub username / account status**
   - Known: the repo name is `klavier-app`, public.
   - Unclear: whether the user has an account, and the username (needed for the URL).
   - Recommendation: the human checkpoint covers both "Konto anlegen" and "einloggen". `__SECURE_URL__` comes from `GITHUB_REPOSITORY_OWNER` in CI, so the code needs no username. The local fallback shows the placeholder `<benutzername>`.
   - **RESOLVED:** Plan 01-03 Task 2 (human-action checkpoint, Teil A) has the user create or log into the account and reply with the username; Task 3 uses it for the remote and the live URL.
2. **What goes into the public repo?**
   - Known: `.planning/`, `CLAUDE.md` and `.claude/` exist locally and are untracked or tracked (`.claude/` is untracked).
   - Recommendation: commit `.planning/` and `CLAUDE.md` (the GSD workflow relies on them), ignore `.claude/settings.local.json` and ask the user about the rest of `.claude/` in the GitHub checkpoint. Low risk either way.
   - **RESOLVED:** Plan 01-03 Task 2 Teil D asks the user to approve the public contents (stop if "nicht ok"); plan 01-01 Task 2 adds `.claude/settings.local.json` to `.gitignore` and `.claude/` is never staged.
3. **iPadOS version** — ask at the piano test (Einstellungen → Allgemein → Info → Softwareversion) and record it in STATE.md (per CONTEXT).
   - **RESOLVED:** Plan 01-05 Task 3 (piano-test checkpoint, Teil D) asks for the iPadOS version; plan 01-05 output records it in STATE.md.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scaffold, build, tests | ✓ | 26.13.1 (meets vite `>=22.12`, jsdom `>=26`) | — |
| npm | install | ✓ | 11.20.0 | — |
| git | commit/push | ✓ | 2.56.0.windows.4 | — |
| gh CLI | repo creation | ✗ | — | User creates repo in the browser (human checkpoint) |
| GitHub account + repo + Pages enabled | DEPL-01 | unknown | — | **Blocking human action**, no automated fallback |
| iPad with Safari | SC 1, 2, 5 | user-owned | iPadOS version unknown | Laptop browser for partial checks |
| Same Wi-Fi + Windows Firewall allowance | optional DEPL-02 LAN demo | unknown | — | Vitest component test covers DEPL-02 |

**Missing, no fallback:** GitHub account/repo/Pages setup (human-action checkpoint).
**Missing, with fallback:** `gh` CLI, replaced by the browser UI plus `git push` via Credential Manager.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 5.1.1 + jsdom 31 + @testing-library/react 16.3.3 |
| Config file | none yet. `test: { environment: 'jsdom' }` in `vite.config.ts` (Wave 0) |
| Quick run command | `npm test` (= `vitest run`) |
| Full suite command | `npm run lint && npm test && npm run build && grep -q '/klavier-app/assets/' dist/index.html` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPL-01 | Build output works under `/klavier-app/` | build smoke | `npm run build && grep -q '/klavier-app/assets/' dist/index.html` | ❌ Wave 0 (CI step) |
| DEPL-01 | Live HTTPS URL serves the app | smoke (post-deploy) | `curl -sf https://<owner>.github.io/klavier-app/ \| grep -q 'Klavier-App'` | ❌ (run after the human checkpoint) |
| DEPL-01 | Opens on iPad Safari + laptop | manual | Human: open URL on both devices | manual-only (needs devices) |
| DEPL-02 | Warning shown iff `isSecureContext === false`; German text; HTTPS link | component | `npx vitest run src/screens/WelcomeScreen.test.tsx` | ❌ Wave 0 |
| DEPL-02 | `isInsecureContext()` logic | unit | `npx vitest run src/lib/secureContext.test.ts` | ❌ Wave 0 |
| DEPL-02 | Warning on a real insecure origin | manual (optional) | `npx vite preview --host`, open via LAN IP | manual-only |
| DEPL-03 | `formatVersion` output (Berlin date, sha) | unit | `npx vitest run src/lib/version.test.ts` | ❌ Wave 0 |
| DEPL-03 | Version label rendered top-right on welcome + overview | component | `npx vitest run src/components/VersionLabel.test.tsx` | ❌ Wave 0 |
| DEPL-03 | New deploy → new label on iPad | manual | Human: push a change, reload after ≤10 min, compare label | manual-only |
| UI-01 | `lang="de"`, German title, no template English | static check | `grep -q 'lang="de"' index.html && ! grep -rqE 'Vite \+ React\|count is' index.html src` | ❌ Wave 0 |
| UI-01 | Screens render German copy from `texte.ts` | component | `npx vitest run src/App.test.tsx` (Start → overview → Mikrofon-Test → Zurück flow; asserts "Was möchtest du tun?", "kommt bald", "‹ Zurück") | ❌ Wave 0 |
| UI-02 | No URL/hash change on navigation (D-03) | component | in `App.test.tsx`: `window.location.href` is unchanged after the flow | ❌ Wave 0 |
| UI-02 | Bottom free zone + sizes in CSS | static check | `grep -q 'calc(96px + env(safe-area-inset-bottom))' src/styles/tokens.css && grep -q 'viewport-fit=cover' index.html` | ❌ Wave 0 |
| UI-02 | Readable/tappable at 60 cm, bottom edge free | manual | Piano test (SC 5) | manual-only (physical) |
| UI-03 | Own name/design, Vite logo replaced | static + manual | `! grep -q 'vite' public/favicon.svg` (or check the file hash differs from the template); human visual check | partial |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run lint && npm test && npm run build`
- **Phase gate:** the full suite is green locally and in GitHub Actions (green check), the post-deploy `curl` passes, and the manual iPad/piano checks (SC 1, 2, 4, 5) are confirmed by the user before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Install `vitest jsdom @testing-library/react @testing-library/dom`. Add the `"test": "vitest run"` script and `test.environment: 'jsdom'`.
- [ ] `src/lib/secureContext.test.ts`, `src/lib/version.test.ts`
- [ ] `src/screens/WelcomeScreen.test.tsx`, `src/App.test.tsx`, `src/components/VersionLabel.test.tsx`
- [ ] CI steps: lint, test, and the `dist` base-path grep in `deploy.yml`

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No login (by design) |
| V3 Session Management | no | — |
| V4 Access Control | no | Static public site |
| V5 Input Validation | no (no inputs in Phase 1) | — |
| V6 Cryptography | no | TLS provided by GitHub Pages |
| V14 Configuration / supply chain | yes | `npm ci` with a committed lockfile, SHA-pinned actions (as in the Vite sample), minimal `permissions:` (`contents: read, pages: write, id-token: write`), no secrets in the repo, `.claude/settings.local.json` ignored |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Compromised / typosquatted npm package | Tampering | Only template packages plus long-established ones; lockfile; no postinstall scripts (checked) |
| Mutable action tags hijacked | Tampering | Keep commit-SHA pins from the Vite sample |
| Leaking local settings in a public repo | Information disclosure | `.gitignore` for `.claude/settings.local.json`; review `git status` before the first push |
| WarningBar link pointing somewhere else | Spoofing | URL built from `GITHUB_REPOSITORY_OWNER` at build time; rendered as plain text plus `href`, no user input |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`, 2026-11-22): create-vite 9.3.4, vite 8.3.8, react 19.3.1, typescript 7.0.2, @vitejs/plugin-react 6.3.0, zustand 5.1.0, vitest 5.1.1 (peers/engines), jsdom 31.0.1 (engines), @testing-library/react 16.3.3 (peers), @testing-library/dom 10.4.2, @testing-library/jest-dom 8.0.0 (published 2026-11-19), oxlint 1.94.0, postinstall scripts (none)
- create-vite 9.3.4 tarball: `template-react-ts` files, `--overwrite` removes all but `.git`, `_gitignore` → `.gitignore` renaming
- https://raw.githubusercontent.com/vitejs/vite/main/docs/guide/static-deploy-github-pages.yaml: exact workflow with SHA-pinned action versions
- https://vite.dev/guide/static-deploy: base path rule, Settings → Pages → Source: GitHub Actions
- https://vitest.dev/config/: `/// <reference types="vitest/config" />`, `test` key in vite.config, `define` applies (v5.1.1)
- https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts: potentially trustworthy origins, `window.isSecureContext`
- `curl -I https://pages.github.com/` → `Cache-Control: max-age=600`; `curl -I http://pages.github.com/` → 301 to https
- Local env probes: node 26.13.1, npm 11.20.0, git 2.56.0, gh missing, branch `master`, no remote

### Secondary (MEDIUM confidence)
- https://vite.dev/guide/build#public-base-path: base rewriting of asset references in HTML (from training plus consistent docs; verified indirectly via the CI grep check)
- `.planning/research/PITFALLS.md`, `SUMMARY.md`, `ARCHITECTURE.md` (project research, same date)

### Tertiary (LOW confidence)
- iPad Safari usable viewport dimensions, GCM login flow, `vi.stubGlobal` against jsdom's `isSecureContext` (see the Assumptions Log)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. All versions from the registry, template contents inspected.
- Architecture: HIGH. Trivial state-switched shell, official deploy workflow fetched verbatim.
- Pitfalls: HIGH for the scaffold/branch/base/caching facts (verified); MEDIUM for iPad display specifics.

**Research date:** 2026-11-22
**Valid until:** 2026-12-22 (GitHub Actions major versions and create-vite templates move monthly; re-check the action SHAs if planning is delayed)
