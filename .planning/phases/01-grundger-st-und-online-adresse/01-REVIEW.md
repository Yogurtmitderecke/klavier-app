---
phase: 01-grundger-st-und-online-adresse
reviewed: 2026-11-23T15:15:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - .github/workflows/deploy.yml
  - .gitignore
  - .oxlintrc.json
  - index.html
  - package.json
  - public/favicon.svg
  - src/App.test.tsx
  - src/App.tsx
  - src/components/BackButton.tsx
  - src/components/Tile.tsx
  - src/components/VersionLabel.test.tsx
  - src/components/VersionLabel.tsx
  - src/components/WarningBar.tsx
  - src/config.ts
  - src/globals.d.ts
  - src/lib/secureContext.test.ts
  - src/lib/secureContext.ts
  - src/lib/version.test.ts
  - src/lib/version.ts
  - src/main.tsx
  - src/screens/MicPlaceholderScreen.tsx
  - src/screens/OverviewScreen.tsx
  - src/screens/WelcomeScreen.test.tsx
  - src/screens/WelcomeScreen.tsx
  - src/state/appStore.ts
  - src/styles/tokens.css
  - src/texte.ts
  - tsconfig.app.json
  - tsconfig.json
  - tsconfig.node.json
  - vite.config.ts
findings:
  critical: 0
  warning: 2
  info: 6
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-11-23T15:15:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Phase 1 is a small scaffold: three screens switched through state with no router, a version label, an HTTPS warning and a GitHub Pages deploy. The core logic is sound. Screen switching never touches the URL. Timers in `OverviewScreen` are cleared on unmount and before each new hint. The Berlin-time date formatting is correct and tested. Verified locally:
- `oxlint` reports nothing and `vitest run` passes (13/13).
- The built `dist/index.html` rewrites both the favicon and the assets to `/klavier-app/`.
- TS 7 enables `strict` by default, so leaving `"strict"` out of `tsconfig.app.json` is not a gap.

No blockers. There are two warnings:
1. The HTTPS warning links to a placeholder address in the one situation where it is likely to appear (LAN dev over HTTP).
2. The deploy job runs `npm ci` while holding Pages-deploy/OIDC permissions.

## Warnings

### WR-01: HTTPS warning links to `https://<benutzername>.github.io/klavier-app/` outside CI, which is exactly when it appears

**File:** `vite.config.ts:21`, `vite.config.ts:31` (consumed in `src/components/WarningBar.tsx:12-13`, asserted in `src/screens/WelcomeScreen.test.tsx:39`)
**Issue:** `owner` falls back to the literal `'<benutzername>'` whenever `GITHUB_REPOSITORY_OWNER` is unset, which is every local `vite`, `vite build` and `vite preview` run.

On GitHub Pages the site is always HTTPS (Pages enforces it), so `isInsecureContext()` is effectively never true in production. The realistic trigger for the warning is local iPad testing over the LAN (`vite --host`, plain HTTP). That is the dev build, which renders a link to `https://<benutzername>.github.io/klavier-app/`: an invalid hostname that cannot be opened. The feature fails in the only scenario where it matters.

The test regex `/^https:\/\/.+\/klavier-app\/$/` accepts the placeholder, so nothing catches it.
**Fix:** Hard-code the real owner as the fallback (or read it from `git remote get-url origin`), and make the test reject the placeholder:
```ts
// vite.config.ts
const owner = (process.env.GITHUB_REPOSITORY_OWNER ?? 'konra-github-login').toLowerCase()
// or derive it:
// const owner = /github\.com[:/]([^/]+)\//.exec(execSync('git remote get-url origin').toString())?.[1] ?? ...
```
```ts
// WelcomeScreen.test.tsx
expect(href).toMatch(/^https:\/\/[a-z0-9-]+\.github\.io\/klavier-app\/$/)
```

### WR-02: Dependency install, lint, test and build run in the job that holds `pages: write` + `id-token: write`

**File:** `.github/workflows/deploy.yml:11-14`, `.github/workflows/deploy.yml:21-55`
**Issue:** Everything runs in a single `deploy` job with workflow-level `pages: write` and `id-token: write`. Any install script from a (transitive) dev dependency in `npm ci`, and any code executed by vitest or oxlint, can read `ACTIONS_ID_TOKEN_REQUEST_TOKEN`/`URL`. With those it can mint an OIDC token and publish arbitrary content to the Pages site.

GitHub's own Pages starter workflows split this into a `build` job (read-only) and a `deploy` job (`needs: build`) for exactly this reason. Because the app requests microphone access, a hijacked origin matters more than for a static brochure page.
**Fix:** Split the jobs and scope the permissions per job:
```yaml
permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - checkout / setup-node / npm ci / lint / test / build / check base path
      - uses: actions/upload-pages-artifact@<sha>
        with: { path: './dist' }
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@<sha>
        id: deployment
```
(`configure-pages` can stay in `build`. Optionally add `--ignore-scripts` to `npm ci`, since no current dependency needs install scripts.)

## Info

### IN-01: `cancel-in-progress: true` can cancel a Pages deployment mid-flight

**File:** `.github/workflows/deploy.yml:16-18`
**Issue:** Two quick pushes cancel the first run even while `deploy-pages` is running. GitHub's Pages starter uses `cancel-in-progress: false` and notes that production deployments should be allowed to finish.
**Fix:** Set `cancel-in-progress: false`. Once WR-02 is applied, the concurrency group can also move to the `deploy` job only.

### IN-02: `node-version: lts/*` is not reproducible

**File:** `.github/workflows/deploy.yml:32`
**Issue:** The CI Node major changes silently when a new LTS is released, while the actions are carefully SHA-pinned. A Node major bump can break `npm ci` or the build without any repo change.
**Fix:** Pin a major (for example `node-version: 24`) or add a `.nvmrc` and use `node-version-file: .nvmrc`.

### IN-03: `execSync` in `gitSha()` leaks git stderr to the console

**File:** `vite.config.ts:15`
**Issue:** Outside a git checkout (for example a zip download), `git` prints `fatal: not a git repository` to the terminal before the `'dev'` fallback is used. The default `stdio` inherits stderr.
**Fix:** `execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })`.

### IN-04: The "kommt bald" hint is not re-announced on a repeated tap

**File:** `src/screens/OverviewScreen.tsx:30-40`, `src/screens/OverviewScreen.tsx:73-79`
**Issue:** If the hint is already visible (`'sichtbar'`), tapping a locked tile again changes neither the text nor the node, so screen readers (VoiceOver) announce nothing. A tap during `'ausblenden'` only removes the class. Visually the timer is restarted correctly, so this is only an accessibility issue.
**Fix:** Force a remount on each tap, for example with a counter key: `<p key={hinweisZaehler} ...>` incremented in `zeigeKommtBald`.

### IN-05: `.gitignore` does not cover `.env`

**File:** `.gitignore:13`
**Issue:** `*.local` covers `.env.local` but not `.env` / `.env.production`. There are no secrets yet, but later phases might add env files.
**Fix:** Add `.env` and `.env.*` with `!.env.example`.

### IN-06: Inconsistent import extension

**File:** `src/main.tsx:4`
**Issue:** `import App from './App.tsx'` uses an extension while every other import in `src/` omits it. This is harmless (`allowImportingTsExtensions` is on), but inconsistent.
**Fix:** `import App from './App'`.

---

_Reviewed: 2026-11-23T15:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
