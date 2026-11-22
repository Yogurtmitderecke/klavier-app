/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Version direkt aus package.json lesen (npm_package_version fehlt unter `npx vitest`).
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

function gitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

const owner = (process.env.GITHUB_REPOSITORY_OWNER ?? '<benutzername>').toLowerCase()

// https://vite.dev/config/
export default defineConfig({
  base: '/klavier-app/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __SECURE_URL__: JSON.stringify(`https://${owner}.github.io/klavier-app/`),
  },
  test: {
    environment: 'jsdom',
  },
})
