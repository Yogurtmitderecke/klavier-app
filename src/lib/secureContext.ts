// Prüft, ob die Seite NICHT sicher verbunden ist (kein HTTPS → kein Mikrofon).
// Bewusst isSecureContext statt location.protocol: localhost gilt auch über http als sicher.
export function isInsecureContext(win: Pick<Window, 'isSecureContext'> = window): boolean {
  return win.isSecureContext === false
}
