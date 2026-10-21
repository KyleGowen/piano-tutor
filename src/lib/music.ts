export type Clef = 'treble' | 'bass';
export type ClefChoice = Clef | 'both';
export type Quality = 'major' | 'minor';
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURALS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const mod = (n: number, base = 12) => ((n % base) + base) % base;
export const pretty = (note: string) => note.replaceAll('#', '♯').replaceAll('b', '♭');
export const pitchClass = (name: string) =>
  mod(
    NATURALS[name[0]] +
      (name.slice(1).match(/#/g)?.length ?? 0) -
      (name.slice(1).match(/b/g)?.length ?? 0),
  );
export function midiOf(note: string): number {
  const parts = /^([A-G](?:#|b)*)(-?\d+)$/.exec(note);
  if (!parts) throw new Error(`Invalid note: ${note}`);
  // Keep octave displacement for B-sharp and C-flat spellings.
  const name = parts[1];
  return (
    (Number(parts[2]) + 1) * 12 +
    NATURALS[name[0]] +
    (name.match(/#/g)?.length ?? 0) -
    (name.match(/b/g)?.length ?? 0)
  );
}
export const noteName = (midi: number) =>
  `${['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][mod(midi)]}${Math.floor(midi / 12) - 1}`;
export const withoutOctave = (note: string) => note.replace(/-?\d+$/, '');
export const frequencyOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export interface KeySignature {
  major: string;
  minor: string;
  fifths: number;
}
export const CIRCLE: KeySignature[][] = [
  [{ major: 'C', minor: 'A', fifths: 0 }],
  [{ major: 'G', minor: 'E', fifths: 1 }],
  [{ major: 'D', minor: 'B', fifths: 2 }],
  [{ major: 'A', minor: 'F#', fifths: 3 }],
  [{ major: 'E', minor: 'C#', fifths: 4 }],
  [
    { major: 'B', minor: 'G#', fifths: 5 },
    { major: 'Cb', minor: 'Ab', fifths: -7 },
  ],
  [
    { major: 'F#', minor: 'D#', fifths: 6 },
    { major: 'Gb', minor: 'Eb', fifths: -6 },
  ],
  [
    { major: 'Db', minor: 'Bb', fifths: -5 },
    { major: 'C#', minor: 'A#', fifths: 7 },
  ],
  [{ major: 'Ab', minor: 'F', fifths: -4 }],
  [{ major: 'Eb', minor: 'C', fifths: -3 }],
  [{ major: 'Bb', minor: 'G', fifths: -2 }],
  [{ major: 'F', minor: 'D', fifths: -1 }],
];
export function scaleOf(root: string, quality: Quality): string[] {
  const steps = quality === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
  return steps.map((step, index) => {
    const letter = LETTERS[mod(LETTERS.indexOf(root[0]) + index, 7)];
    let diff = mod(pitchClass(root) + step - NATURALS[letter]);
    if (diff > 6) diff -= 12;
    return letter + (diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff));
  });
}
export const triadOf = (root: string, quality: Quality) =>
  scaleOf(root, quality).filter((_, i) => [0, 2, 4].includes(i));
export const signatureLabel = (fifths: number) =>
  fifths === 0
    ? 'No sharps or flats'
    : `${Math.abs(fifths)} ${fifths > 0 ? 'sharp' : 'flat'}${Math.abs(fifths) === 1 ? '' : 's'}`;
export const signatureNotes = (fifths: number) =>
  (fifths > 0
    ? ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']
    : ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']
  ).slice(0, Math.abs(fifths));
export const LEVELS = [
  { name: 'Find your bearings', detail: 'Three familiar notes', short: 'Landmarks' },
  { name: 'Read the staff', detail: 'Lines and spaces', short: 'The staff' },
  { name: 'Go a little further', detail: 'Add ledger lines', short: 'Ledger lines' },
  { name: 'Meet the accidentals', detail: 'Sharps and flats', short: 'Accidentals' },
  { name: 'Bring notes together', detail: 'Simple three-note chords', short: 'Triads' },
];
export interface Challenge {
  clef: Clef;
  notes: string[];
  id: string;
}
const pick = <T>(values: T[], random: () => number) => values[Math.floor(random() * values.length)];
export function createChallenge(
  level: number,
  clefChoice: ClefChoice,
  previous = '',
  random = Math.random,
): Challenge {
  let result: Challenge;
  let retries = 0;
  do {
    const clef = clefChoice === 'both' ? pick<Clef>(['treble', 'bass'], random) : clefChoice;
    let notes: string[];
    if (level === 5) {
      const [root, quality] = pick<[string, Quality]>(
        [
          ['C', 'major'],
          ['D', 'minor'],
          ['E', 'minor'],
          ['F', 'major'],
          ['G', 'major'],
          ['A', 'minor'],
        ],
        random,
      );
      const octave = clef === 'treble' ? 4 : 2;
      notes = triadOf(root, quality).map(
        (name) =>
          `${name}${octave + (LETTERS.indexOf(name[0]) < LETTERS.indexOf(root[0]) ? 1 : 0)}`,
      );
    } else {
      const pool =
        level === 1
          ? clef === 'treble'
            ? ['C4', 'E4', 'G4']
            : ['C3', 'E3', 'G3']
          : level === 2
            ? clef === 'treble'
              ? ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
              : ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3']
            : clef === 'treble'
              ? [
                  'A3',
                  'B3',
                  'C4',
                  'D4',
                  'E4',
                  'F4',
                  'G4',
                  'A4',
                  'B4',
                  'C5',
                  'D5',
                  'E5',
                  'F5',
                  'G5',
                  'A5',
                  'B5',
                  'C6',
                ]
              : [
                  'C2',
                  'D2',
                  'E2',
                  'F2',
                  'G2',
                  'A2',
                  'B2',
                  'C3',
                  'D3',
                  'E3',
                  'F3',
                  'G3',
                  'A3',
                  'B3',
                  'C4',
                  'D4',
                  'E4',
                ];
      let note = pick(pool, random);
      if (level === 4) note = note[0] + pick(['', '#', 'b'], random) + note.slice(1);
      notes = [note];
    }
    result = { clef, notes, id: `${clef}:${notes.join('-')}` };
  } while (result.id === previous && ++retries < 20);
  return result;
}
export function staffHint(note: string, clef: Clef): string {
  const positionIndex =
    Number(note.match(/\d+$/)![0]) * 7 + LETTERS.indexOf(note[0]) - (clef === 'treble' ? 30 : 18);
  const distance = positionIndex < 0 ? -positionIndex : positionIndex - 8;
  const side = positionIndex < 0 ? 'below' : 'above';
  const position =
    positionIndex >= 0 && positionIndex <= 8
      ? `${positionIndex % 2 === 0 ? 'line' : 'space'} ${Math.floor(positionIndex / 2) + 1} from the bottom`
      : distance === 1
        ? `the space just ${side} the staff`
        : distance % 2 === 0
          ? `ledger line ${distance / 2} ${side} the staff`
          : `the space beyond ledger line ${Math.floor(distance / 2)} ${side} the staff`;
  const accidental = note.includes('#')
    ? ' The sharp raises it one semitone.'
    : note.includes('b')
      ? ' The flat lowers it one semitone.'
      : '';
  return `${pretty(note)} is on ${position}.${accidental}`;
}

export interface Progress {
  level: number;
  fast: number;
}
export function advanceProgress(
  progress: Progress,
  firstTry: boolean,
  seconds: number,
  hinted: boolean,
): Progress {
  const fast =
    firstTry && !hinted && seconds <= (progress.level === 5 ? 12 : 6) ? progress.fast + 1 : 0;
  return fast >= 5 && progress.level < 5
    ? { level: progress.level + 1, fast: 0 }
    : { ...progress, fast: Math.min(fast, 5) };
}
