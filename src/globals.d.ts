// Build-Zeit-Konstanten, gesetzt über `define` in vite.config.ts
declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string // ISO-Zeitstempel
declare const __GIT_SHA__: string // 7 Zeichen oder 'dev'
declare const __SECURE_URL__: string // https://<owner>.github.io/klavier-app/

// Safari-Erweiterungen von navigator (nicht im Standard-DOM-Typ enthalten):
// standalone = als App vom Home-Bildschirm gestartet; audioSession ab Safari 16.4.
interface Navigator {
  standalone?: boolean
  audioSession?: { type: string }
}
