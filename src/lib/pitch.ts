export interface Pitch {
  midi: number;
  frequency: number;
  cents: number;
  clarity: number;
}

/** YIN difference function with cumulative normalization and parabolic refinement.
 * A single fundamental only: chord exercises deliberately use separate notes.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): Pitch | null {
  let energy = 0;
  for (const sample of buffer) energy += sample * sample;
  if (Math.sqrt(energy / buffer.length) < 0.008) return null;
  const size = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / 60));
  const difference = new Float32Array(size);
  const window = Math.floor(buffer.length / 2);
  for (let tau = 1; tau < size; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }
  let running = 0;
  for (let tau = 1; tau < size; tau++) {
    running += difference[tau];
    difference[tau] = running ? (difference[tau] * tau) / running : 1;
  }
  let candidate = -1;
  for (let tau = Math.floor(sampleRate / 1200); tau < size - 1; tau++) {
    if (difference[tau] < 0.12) {
      while (tau + 1 < size - 1 && difference[tau + 1] < difference[tau]) tau++;
      candidate = tau;
      break;
    }
  }
  if (candidate < 1) return null;
  const a = difference[candidate - 1],
    b = difference[candidate],
    c = difference[candidate + 1];
  const denominator = 2 * (2 * b - a - c);
  const refined = candidate + (denominator ? (c - a) / denominator : 0);
  const frequency = sampleRate / refined;
  const floatingMidi = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(floatingMidi);
  const cents = (floatingMidi - midi) * 100;
  if (midi < 35 || midi > 85 || Math.abs(cents) > 40) return null;
  return { midi, frequency, cents, clarity: 1 - b };
}

/** Debounce attacks so a held note cannot answer several flashcards. */
export class NoteGate {
  private candidate: number | null = null;
  private since = 0;
  private latched: number | null = null;
  private silentSince: number | null = null;
  update(midi: number | null, now: number): number | null {
    if (midi === null) {
      this.candidate = null;
      this.silentSince ??= now;
      if (now - this.silentSince > 180) this.latched = null;
      return null;
    }
    this.silentSince = null;
    if (midi !== this.candidate) {
      this.candidate = midi;
      this.since = now;
      return null;
    }
    if (now - this.since < 110 || this.latched === midi) return null;
    this.latched = midi;
    return midi;
  }
}
