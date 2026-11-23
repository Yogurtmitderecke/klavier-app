// Ein einziger, gemeinsamer AudioContext für die ganze App (Mikrofon, später Metronom
// über Tone.setContext). Er entsteht erst beim ersten Tippen und wird nur neu erzeugt,
// falls er geschlossen wurde. Keine feste Abtastrate – das Gerät bestimmt sie.
let kontext: AudioContext | null = null

export function holeAudioKontext(
  erzeuge: () => AudioContext = () => new AudioContext({ latencyHint: 'interactive' }),
): AudioContext {
  if (kontext === null || kontext.state === 'closed') {
    kontext = erzeuge()
  }
  return kontext
}
