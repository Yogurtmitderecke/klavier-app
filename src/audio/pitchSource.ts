// Zustand des AudioContext; Safari kennt zusätzlich 'interrupted' (z. B. Anruf, Siri).
export type KontextStatus = AudioContextState | 'interrupted'

// Abstraktion der Audio-Aufnahme. Heute AnalyserNode, später evtl. AudioWorklet –
// die Oberfläche bleibt dabei unverändert.
export interface PitchSource {
  /** Öffnet das Mikrofon. Ruft ctx.resume() synchron auf, BEVOR auf getUserMedia gewartet wird (iOS-Geste). */
  start(): Promise<void>
  /** Idempotent: stoppt alle Spuren, trennt den Graphen und pausiert den Kontext – schließt ihn nie. */
  stop(): void
  /** Schreibt die aktuellen Zeitbereichs-Samples in buf (Länge FFT_SIZE). */
  readFrame(buf: Float32Array): void
  /** Abtastrate des Kontexts zur Laufzeit; 0 vor dem ersten Start. */
  readonly sampleRate: number
  /** Aktueller Kontext-Zustand oder null, wenn noch kein Kontext existiert. */
  kontextStatus(): KontextStatus | null
  /** false ohne HTTPS oder ohne getUserMedia – dann kann das Mikrofon gar nicht starten. */
  zugangMoeglich(): boolean
}
