import { VERSION_LABEL } from '../config'

// Versions-Label oben rechts (nur Willkommen + Übersicht, nie am unteren Rand).
export function VersionLabel() {
  return <p className="version-label">{VERSION_LABEL}</p>
}
