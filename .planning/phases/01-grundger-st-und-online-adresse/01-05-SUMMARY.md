---
phase: 01-grundger-st-und-online-adresse
plan: 05
subsystem: release
tags: [release, device-test, ipad, update-visibility]
requires:
  - "01-03: live GitHub Pages deploy (0.1.0 · ae9f87a)"
  - "01-04: tiles, Zurück sub-page, HTTPS warning"
provides:
  - "Version 0.2.0 live at https://yogurtmitderecke.github.io/klavier-app/"
  - "Device test on the real iPad at the piano passed; iPadOS version recorded (26.5.2)"
affects: [02]
tech-stack:
  added: []
  patterns: [semver bump per user-visible release so the version label visibly changes]
key-files:
  created: []
  modified: [package.json, package-lock.json, .planning/STATE.md]
decisions:
  - "User's iPad runs iPadOS 26.5.2 (relevant for mic/AudioWorklet/WebGPU decisions in later phases)"
metrics:
  duration: "~15 min (incl. human device tests)"
  completed: 2026-11-23
  tasks: 3
  files: 3
---

# Phase 1 Plan 05: Release 0.2.0 and Device Test Summary

The complete Phase 1 app shipped as version 0.2.0. The user confirmed on the real iPad at the piano that the update arrived, that everything is readable and easy to tap from the playing position, and that it works on the laptop too.

## Tasks

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | First look on iPad and laptop (human-verify) | — | iPad: Startseite ja, "Version 0.1.0 · 22.11.2026 · ae9f87a"; Laptop: ja |
| 2 | Bump to 0.2.0, push, wait for deploy, confirm live | 4f96cca | Local gate (npm ci, lint, 13/13 tests, build, base-path grep) passed; Actions run success; live bundle contains "0.2.0" and "4f96cca" |
| 3 | Piano test (human-verify) | — | All checks passed (see below) |

## User answers

- **Before (Task 1):** Version 0.1.0 · 22.11.2026 · ae9f87a (iPad Safari), laptop shows the welcome screen
- **After (Task 3):** Update ja (0.2.0 · 23.11.2026 · 4f96cca)
- Lesbar aus Spielposition: ja
- Kacheln: ok · Zurück: ok · unten frei (Notenständer-Leiste): ja · Design (Deutsch, eigene Optik): ok · Laptop: ok
- Optional LAN test of the no-HTTPS warning: skipped (covered by automated tests)
- **iPadOS:** 26.5.2

## Deviations

- Executed inline by the orchestrator (checkpoint-heavy plan; push must come from the primary checkout).

## Self-Check: PASSED
