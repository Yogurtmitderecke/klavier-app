import { formatVersion } from './lib/version'

// Einzige Quelle für Build-Zeit-Werte (gesetzt über `define` in vite.config.ts).
export const VERSION_LABEL = formatVersion(__APP_VERSION__, __BUILD_DATE__, __GIT_SHA__)

// Sichere HTTPS-Adresse der App – nirgends sonst hart codieren.
export const SECURE_URL = __SECURE_URL__
