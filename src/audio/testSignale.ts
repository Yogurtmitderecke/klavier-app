// Nur für Tests: deterministische Testsignale (Sinus, klavierähnlicher Ton, Rauschen, Stille).
// Bewusst ohne Zufallsfunktion des Browsers – jeder Testlauf erzeugt exakt dieselben Samples.

// Einfacher linearer Kongruenzgenerator; liefert Werte in [−1, 1).
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0
    return (s / 2 ** 32) * 2 - 1
  }
}

// Reiner Sinuston der Frequenz f (Hz), n Samples bei Abtastrate sr.
export function sinus(f: number, n: number, sr: number, amp = 0.2): Float32Array {
  const buf = new Float32Array(n)
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin((2 * Math.PI * f * i) / sr)
  return buf
}

export interface KlavierOptionen {
  // Inharmonizität der steifen Saite.
  B?: number
  // Amplitude des Grundtons (relativ; Obertöne haben 1/k).
  grundAmp?: number
  // Anzahl Teiltöne.
  teiltoene?: number
  // Amplitude des deterministischen Rauschens.
  rauschen?: number
  // Gesamtlautstärke.
  amp?: number
}

// Klavierähnlicher Ton: Teiltöne k·f0·√(1 + B·k²), Amplitude 1/k (Grundton grundAmp).
export function klavierTon(
  f0: number,
  n: number,
  sr: number,
  { B = 0.0003, grundAmp = 1, teiltoene = 10, rauschen: rauschAmp = 0, amp = 0.2 }: KlavierOptionen = {},
): Float32Array {
  const buf = new Float32Array(n)
  for (let k = 1; k <= teiltoene; k++) {
    const fk = k * f0 * Math.sqrt(1 + B * k * k)
    if (fk > sr / 2) break
    const a = (k === 1 ? grundAmp : 1 / k) * amp
    for (let i = 0; i < n; i++) buf[i] += a * Math.sin((2 * Math.PI * fk * i) / sr)
  }
  if (rauschAmp > 0) {
    const zufall = lcg(12345)
    for (let i = 0; i < n; i++) buf[i] += rauschAmp * zufall()
  }
  return buf
}

// Weißes Rauschen (deterministisch).
export function rauschen(n: number, amp: number, seed = 12345): Float32Array {
  const buf = new Float32Array(n)
  const zufall = lcg(seed)
  for (let i = 0; i < n; i++) buf[i] = amp * zufall()
  return buf
}

// Digitale Stille.
export function stille(n: number): Float32Array {
  return new Float32Array(n)
}
