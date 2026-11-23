// Alle Konstanten der Mikrofon-Erkennung – genau einmal hier definiert.
// Bewusst KEINE Abtastrate: sie kommt immer zur Laufzeit aus audioContext.sampleRate.

// Fenstergröße des AnalyserNode in Samples (Zeitbereich pro Analyse).
export const FFT_SIZE = 4096
// Tiefste erkannte Frequenz in Hz (knapp unter A0 = 27,5 Hz).
export const FREQ_MIN = 26
// Höchste erkannte Frequenz in Hz (knapp über C8 = 4186 Hz).
export const FREQ_MAX = 4400
// Mindest-Klarheit der Tonhöhenschätzung (0..1), darunter gilt sie als Rauschen.
export const CLARITY_MIN = 0.9
// Pegel in dBFS, ab dem das Tor öffnet (ein Ton beginnt).
export const GATE_OPEN_DB = -60
// Pegel in dBFS, unter dem das Tor wieder schließt (Hysterese).
export const GATE_CLOSE_DB = -66
// Anzahl Schätzungen für die Median-Glättung.
export const MEDIAN_N = 5
// So lange in ms bleibt die zuletzt erkannte Note nach dem Verklingen stehen.
export const HOLD_MS = 400
// So oft pro Sekunde werden Messwerte an die Oberfläche gemeldet.
export const PUBLISH_HZ = 15
// Nach so vielen ms ohne Signal erscheint der Hinweis „kein Signal“.
export const KEIN_SIGNAL_MS = 1500
// Untergrenze der Pegelanzeige in dBFS (Stille).
export const PEGEL_MIN_DB = -90
