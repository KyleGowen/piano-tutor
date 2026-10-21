import { describe, expect, it } from 'vitest';
import {
  advanceProgress,
  CIRCLE,
  createChallenge,
  midiOf,
  mod,
  pitchClass,
  scaleOf,
  signatureNotes,
  triadOf,
} from '../../src/lib/music';

describe('music theory', () => {
  it('spells all 15 major and relative natural-minor signatures correctly', () => {
    for (const key of CIRCLE.flat()) {
      for (const quality of ['major', 'minor'] as const) {
        const scale = scaleOf(key[quality], quality);
        expect(new Set(scale.map((n) => n[0])).size).toBe(7);
        expect(scale.filter((n) => n.length > 1).sort()).toEqual(signatureNotes(key.fifths).sort());
        const intervals = scale.map((n) => mod(pitchClass(n) - pitchClass(key[quality])));
        expect(intervals).toEqual(
          quality === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10],
        );
        expect(
          triadOf(key[quality], quality).map((n) => mod(pitchClass(n) - pitchClass(key[quality]))),
        ).toEqual(quality === 'major' ? [0, 4, 7] : [0, 3, 7]);
      }
    }
  });
  it('retains enharmonic spellings and correct octave boundaries', () => {
    expect(scaleOf('C#', 'major')).toEqual(['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#']);
    expect(scaleOf('Cb', 'major')).toEqual(['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb']);
    expect(midiOf('B#3')).toBe(60);
    expect(midiOf('Cb4')).toBe(59);
    expect(midiOf('A4')).toBe(69);
  });
  it('generates playable, appropriately sized challenges at each level', () => {
    for (const clef of ['treble', 'bass', 'both'] as const) {
      for (let level = 1; level <= 5; level++) {
        for (let seed = 1; seed <= 100; seed++) {
          let state = seed;
          const random = () => {
            state = (state * 16807) % 2147483647;
            return state / 2147483647;
          };
          const challenge = createChallenge(level, clef, '', random);
          expect(challenge.notes).toHaveLength(level === 5 ? 3 : 1);
          for (const note of challenge.notes) {
            expect(midiOf(note)).toBeGreaterThanOrEqual(35);
            expect(midiOf(note)).toBeLessThanOrEqual(85);
          }
          if (level === 5) expect(new Set(challenge.notes.map((n) => mod(midiOf(n)))).size).toBe(3);
          if (level < 4) expect(challenge.notes.every((n) => !/[#b]/.test(n))).toBe(true);
        }
      }
    }
  });
  it('only advances after five fast, independent answers', () => {
    expect(advanceProgress({ level: 1, fast: 4 }, true, 5.9, false)).toEqual({ level: 2, fast: 0 });
    for (const [first, seconds, hinted] of [
      [false, 1, false],
      [true, 7, false],
      [true, 1, true],
    ] as const) {
      expect(advanceProgress({ level: 2, fast: 4 }, first, seconds, hinted)).toEqual({
        level: 2,
        fast: 0,
      });
    }
    expect(advanceProgress({ level: 5, fast: 4 }, true, 10, false)).toEqual({ level: 5, fast: 5 });
  });
});
