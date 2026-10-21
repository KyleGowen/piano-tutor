import { describe, expect, it } from 'vitest';
import { detectPitch, NoteGate } from '../../src/lib/pitch';
import { frequencyOf } from '../../src/lib/music';
import { BeatClock, clampBpm, tapTempo } from '../../src/lib/rhythm';

describe('single-note pitch detection', () => {
  for (const sampleRate of [44100, 48000]) {
    it(`recognizes B1–C♯6, including harmonic-rich piano-like tones at ${sampleRate} Hz`, () => {
      for (let midi = 35; midi <= 85; midi++) {
        for (const harmonic of [false, true]) {
          const frequency = frequencyOf(midi);
          const buffer = Float32Array.from({ length: 4096 }, (_, i) => {
            const phase = (2 * Math.PI * frequency * i) / sampleRate;
            return harmonic
              ? 0.22 * Math.sin(phase) + 0.32 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase)
              : 0.4 * Math.sin(phase);
          });
          const result = detectPitch(buffer, sampleRate);
          expect(result?.midi, `MIDI ${midi}, harmonic ${harmonic}`).toBe(midi);
          expect(Math.abs(result!.cents)).toBeLessThan(8);
        }
      }
    });
  }
  it('ignores silence, quiet input and unpitched noise', () => {
    expect(detectPitch(new Float32Array(4096), 48000)).toBeNull();
    expect(
      detectPitch(
        Float32Array.from({ length: 4096 }, (_, i) => 0.001 * Math.sin(i)),
        48000,
      ),
    ).toBeNull();
    let seed = 123;
    const noise = Float32Array.from({ length: 4096 }, () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.8;
    });
    expect(detectPitch(noise, 48000)).toBeNull();
  });
  it('requires a stable attack and a release before reusing the same note', () => {
    const gate = new NoteGate();
    expect(gate.update(60, 0)).toBeNull();
    expect(gate.update(60, 80)).toBeNull();
    expect(gate.update(60, 120)).toBe(60);
    expect(gate.update(60, 900)).toBeNull();
    gate.update(null, 1000);
    gate.update(null, 1200);
    expect(gate.update(60, 1250)).toBeNull();
    expect(gate.update(60, 1400)).toBe(60);
    gate.update(64, 1500);
    expect(gate.update(64, 1650)).toBe(64);
  });
});
describe('rhythm', () => {
  it('measures tap tempo, rejects outliers, and bounds the tempo', () => {
    expect(tapTempo([0, 500])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 3000, 6000, 9000])).toBe(20);
    expect(tapTempo([0, 250, 500, 750])).toBe(240);
    expect(tapTempo([0, 500, 1000, 1100, 1600])).toBe(120);
    expect(clampBpm(999)).toBe(240);
    expect(clampBpm(1)).toBe(20);
  });
  it('schedules against the audio clock with stable spacing and accents', () => {
    const clock = new BeatClock();
    clock.start(0, 120);
    const clicks = [];
    for (let t = 0; t < 3; t += 0.025) clicks.push(...clock.schedule(t, 120, 4));
    expect(clicks.map((c) => c.beat)).toEqual([0, 1, 2, 3, 0, 1, 2]);
    for (let i = 1; i < clicks.length; i++)
      expect(clicks[i].time - clicks[i - 1].time).toBeCloseTo(0.5, 8);
    expect(clicks.filter((c) => c.accent).map((c) => c.beat)).toEqual([0, 0]);
  });
  it('changes tempo immediately and does not burst after a background stall', () => {
    const clock = new BeatClock();
    clock.start(0, 20);
    clock.schedule(0, 20, 4);
    clock.schedule(0.1, 240, 4);
    expect(clock.next).toBeCloseTo(0.29);
    expect(clock.schedule(60, 240, 4)).toHaveLength(1);
  });
});
