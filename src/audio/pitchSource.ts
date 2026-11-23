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
  /** Diagnose-Schnappschuss; Gerätewerte des letzten Laufs bleiben nach stop() stehen. */
  diagnose(): QuellenDiagnose
  /** Rückruf bei Spur- oder Kontext-Ereignissen (stumm, beendet, statechange); null meldet ab. */
  beiAenderung(cb: (() => void) | null): void
}

// Was das Gerät der App wirklich geliefert hat (MIC-04).
// null = Mikrofon lief noch nie; undefined = vom Browser nicht gemeldet (Safari, Pitfall 2).
export interface QuellenDiagnose {
  kontextStatus: KontextStatus | null
  abtastrateApp: number | null
  abtastrateMikro: number | undefined | null
  echo: boolean | undefined | null
  rausch: boolean | undefined | null
  autoPegel: boolean | undefined | null
  // Filter (echoCancellation/noiseSuppression/autoGainControl), die getSupportedConstraints() meldet.
  einstellbar: string[] | null
  mikrofonName: string | null
  spur: 'aktiv' | 'stumm' | 'beendet' | null
  audioSitzung: string | null
  // zeit als 'HH:MM:SS' (de-DE).
  letztesEreignis: { zeit: string; text: string } | null
}
