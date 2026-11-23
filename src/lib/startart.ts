// Wie die App geöffnet wurde: im Safari-Tab oder als App vom Home-Bildschirm.
export type Startart = 'safari' | 'homescreen'

export interface StartartFenster {
  navigator: { standalone?: boolean }
  matchMedia?: (q: string) => { matches: boolean }
}

// navigator.standalone ist Safari-spezifisch; display-mode deckt andere Browser ab.
// matchMedia wird optional aufgerufen – jsdom kennt es nicht.
export function ermittleStartart(win: StartartFenster = window): Startart {
  if (win.navigator.standalone === true) return 'homescreen'
  if (win.matchMedia?.('(display-mode: standalone)').matches === true) return 'homescreen'
  return 'safari'
}
