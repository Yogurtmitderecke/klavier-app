// Formatiert das Versions-Label „Version 0.1.0 · 22.11.2026 · a1b2c3d“.
// Das Datum wird immer in Berliner Zeit gerechnet (CI läuft in UTC).
const datumFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
})

export function formatVersion(semver: string, isoDate: string, sha: string): string {
  const datum = datumFormat.format(new Date(isoDate))
  return `Version ${semver} · ${datum} · ${sha}`
}
