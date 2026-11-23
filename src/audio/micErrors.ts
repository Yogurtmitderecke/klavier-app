// Arten, wie der Mikrofon-Start scheitern kann – jede bekommt eine eigene deutsche Hilfe.
export type MicFehlerArt = 'unsicher' | 'verweigert' | 'keinMikrofon' | 'belegt' | 'unbekannt'

// Liest den Namen defensiv aus einem beliebigen Fehlerwert.
function fehlerName(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const name = (err as { name?: unknown }).name
  return typeof name === 'string' ? name : null
}

// Ordnet einen Fehler aus getUserMedia (bzw. der Quelle) einer Fehlerart zu.
export function classifyMicError(err: unknown): MicFehlerArt {
  switch (fehlerName(err)) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'verweigert'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'keinMikrofon'
    case 'NotReadableError':
    case 'AbortError':
      return 'belegt'
    // Wird von AnalyserPitchSource geworfen, wenn kein HTTPS oder kein getUserMedia da ist.
    case 'UnsicherError':
      return 'unsicher'
    default:
      return 'unbekannt'
  }
}

// Rohe, unübersetzte Fehlerangabe „Name: Nachricht“ für die Diagnose.
export function fehlerText(err: unknown): string {
  const name = fehlerName(err)
  if (name === null) return 'unbekannt'
  const nachricht = (err as { message?: unknown }).message
  return `${name}: ${typeof nachricht === 'string' ? nachricht : ''}`
}
