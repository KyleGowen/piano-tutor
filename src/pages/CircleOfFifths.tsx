import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Keyboard, Mic, Shuffle, Volume2 } from 'lucide-react';
import { Button, Field, PageTitle, Segmented } from '../components/ui';
import { FifthsWheel } from '../components/FifthsWheel';
import { Staff } from '../components/Staff';
import { Piano } from '../components/Piano';
import { Microphone } from '../components/Microphone';
import {
  CIRCLE,
  mod,
  pitchClass,
  pretty,
  scaleOf,
  signatureLabel,
  signatureNotes,
  triadOf,
  type Quality,
} from '../lib/music';
import { usePianoAudio } from '../hooks/usePianoAudio';

export function CircleOfFifths() {
  const [mode, setMode] = useState<'reference' | 'quiz'>('reference');
  const [index, setIndex] = useState(0);
  const [quality, setQuality] = useState<Quality>('major');
  const [alternative, setAlternative] = useState(0);
  const [quiz, setQuiz] = useState<'signature' | 'chord'>('signature');
  const [scope, setScope] = useState(3);
  const [input, setInput] = useState<'buttons' | 'microphone'>('buttons');
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const [count, setCount] = useState(0);
  const accepted = useRef<string[]>([]);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sound = usePianoAudio();
  const key = CIRCLE[index][alternative],
    root = key[quality];
  const scale = scaleOf(root, quality),
    chord = triadOf(root, quality);
  const chordMidi = chord.map(
    (note) => 60 + pitchClass(root) + mod(pitchClass(note) - pitchClass(root)),
  );
  const scaleMidi = [
    ...scale.map((note) => 60 + pitchClass(root) + mod(pitchClass(note) - pitchClass(root))),
    72 + pitchClass(root),
  ];
  const reset = () => {
    clearTimeout(timer.current);
    locked.current = false;
    accepted.current = [];
    setFound([]);
    setWrong(null);
    setMessage('');
    setSolved(false);
    sound.stop();
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const select = (nextIndex: number, nextQuality: Quality) => {
    reset();
    if (nextIndex !== index) setAlternative(0);
    setIndex(nextIndex);
    setQuality(nextQuality);
  };
  const next = () => {
    const pool =
      scope === 3 ? [0, 1, 11] : scope === 7 ? [0, 1, 2, 3, 9, 10, 11] : CIRCLE.map((_, i) => i);
    const candidates = pool.filter((i) => i !== index);
    reset();
    setAlternative(0);
    setIndex(candidates[Math.floor(Math.random() * candidates.length)]);
  };
  const choices = useMemo(() => {
    const offsets = [
      key.fifths,
      ...Array.from({ length: 15 }, (_, i) => i - 7)
        .filter((f) => f !== key.fifths)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    ];
    return offsets.sort(() => Math.random() - 0.5);
  }, [key.fifths, quiz, mode]);
  const noteChoices = (
    key.fifths >= 0
      ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  ).map((n) => chord.find((tone) => pitchClass(tone) === pitchClass(n)) ?? n);
  const finish = () => {
    locked.current = true;
    setSolved(true);
    setWrong(null);
    setCount((c) => c + 1);
    setMessage(
      quiz === 'signature'
        ? `${signatureLabel(key.fifths)}. Nicely done.`
        : `${chord.map(pretty).join(' · ')}. That’s the chord.`,
    );
    timer.current = setTimeout(next, 1500);
  };
  const answerNote = (value: string | number) => {
    if (locked.current) return;
    const match = chord.find((n) =>
      typeof value === 'number' ? pitchClass(n) === mod(value) : n === value,
    );
    if (!match) {
      setWrong(String(value));
      setMessage('Try again. A triad uses the 1st, 3rd, and 5th notes of its scale.');
      return;
    }
    if (accepted.current.includes(match)) return;
    accepted.current = [...accepted.current, match];
    setFound(accepted.current);
    setWrong(null);
    setMessage('Good. Keep going.');
    if (accepted.current.length === 3) finish();
  };
  return (
    <>
      <PageTitle
        eyebrow="CONNECT THE NOTES"
        title="Every key has a home."
        description="Explore the circle. Get to know the keys."
      />
      <div className="circle-toolbar">
        <Segmented
          label="Circle mode"
          value={mode}
          onChange={(value) => {
            reset();
            setMode(value);
            if (value === 'quiz') {
              setIndex(0);
              setAlternative(0);
            }
          }}
          options={[
            { value: 'reference', label: 'Explore' },
            { value: 'quiz', label: 'Practice' },
          ]}
        />
        <span className="muted small">Major outside · Minor inside</span>
      </div>
      <div className="circle-layout">
        <section className="card wheel-card">
          <div className="card-top">
            <span className="badge">
              {mode === 'quiz' ? 'Find the highlighted key' : 'Tap a key to explore'}
            </span>
            <span className="muted small">♯ → &nbsp; ← ♭</span>
          </div>
          <FifthsWheel
            selected={index}
            quality={quality}
            alternative={alternative}
            onSelect={select}
            showSignatures={mode === 'reference'}
          />
          <div className="wheel-footer">
            <span className="legend-dot" /> Relative keys share a signature.
          </div>
        </section>
        <div className="key-column">
          <section className="card key-card">
            <div className="row-between">
              <p className="eyebrow">{mode === 'reference' ? 'GET TO KNOW' : 'YOUR CHALLENGE'}</p>
              <Segmented
                label="Key quality"
                value={quality}
                onChange={(value) => select(index, value)}
                options={[
                  { value: 'major', label: 'Major' },
                  { value: 'minor', label: 'Minor' },
                ]}
              />
            </div>
            <h2 className="key-title">
              {pretty(root)} <span>{quality}</span>
            </h2>
            {CIRCLE[index].length > 1 && (
              <button
                className="text-button enharmonic"
                onClick={() => {
                  reset();
                  setAlternative((a) => 1 - a);
                }}
              >
                <Shuffle size={13} /> Use {pretty(CIRCLE[index][1 - alternative][quality])} spelling
              </button>
            )}
            {mode === 'reference' ? (
              <>
                <p className="key-signature">
                  {signatureLabel(key.fifths)}
                  {key.fifths !== 0 && (
                    <span>{signatureNotes(key.fifths).map(pretty).join(' · ')}</span>
                  )}
                </p>
                <div className="signature-staff">
                  <Staff notes={[]} signature={key.major} />
                </div>
                <Field label={quality === 'minor' ? 'Natural minor scale' : 'Major scale'}>
                  <div className="scale-notes">
                    {scale.map((note, n) => (
                      <span key={note} className={[0, 2, 4].includes(n) ? 'chord-tone' : ''}>
                        {pretty(note)}
                      </span>
                    ))}
                  </div>
                </Field>
                <div className="chord-description">
                  <span>Tonic chord</span>
                  <strong>{chord.map(pretty).join(' · ')}</strong>
                </div>
                <div className="audio-actions">
                  <Button variant="outline" size="small" onClick={() => sound.play(scaleMidi)}>
                    <Volume2 size={15} /> Hear scale
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => sound.play(chordMidi, true)}
                  >
                    <Volume2 size={15} /> Hear chord
                  </Button>
                </div>
                {sound.error && (
                  <p role="alert" className="error-message">
                    {sound.error}
                  </p>
                )}
                <p className="relative-key">
                  Relative {quality === 'major' ? 'minor' : 'major'}{' '}
                  <strong>
                    {pretty(key[quality === 'major' ? 'minor' : 'major'])}{' '}
                    {quality === 'major' ? 'minor' : 'major'}
                  </strong>
                </p>
              </>
            ) : (
              <>
                <Field label="Practice">
                  <select
                    aria-label="Quiz exercise"
                    value={quiz}
                    onChange={(e) => {
                      reset();
                      setQuiz(e.target.value as typeof quiz);
                    }}
                  >
                    <option value="signature">Key signatures</option>
                    <option value="chord">Build the chord</option>
                  </select>
                </Field>
                <p className="quiz-prompt">
                  {quiz === 'signature'
                    ? 'Which key signature belongs here?'
                    : input === 'buttons'
                      ? 'Choose the three notes in this chord.'
                      : 'Play the three chord tones, one at a time.'}
                </p>
                {quiz === 'signature' ? (
                  <div className="signature-answers">
                    {choices.map((f) => (
                      <button
                        key={f}
                        disabled={solved}
                        className={`choice-button ${wrong === String(f) ? 'wrong' : ''} ${solved && f === key.fifths ? 'correct' : ''}`}
                        onClick={() => {
                          if (locked.current) return;
                          if (f === key.fifths) finish();
                          else {
                            setWrong(String(f));
                            setMessage(
                              'Not quite. Count the steps from C major / A minor: clockwise adds sharps, counterclockwise adds flats.',
                            );
                          }
                        }}
                      >
                        {signatureLabel(f)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <Segmented
                      label="Chord answer input"
                      value={input}
                      onChange={setInput}
                      options={[
                        {
                          value: 'buttons',
                          label: (
                            <>
                              <Keyboard size={14} /> Notes
                            </>
                          ),
                        },
                        {
                          value: 'microphone',
                          label: (
                            <>
                              <Mic size={14} /> My piano
                            </>
                          ),
                        },
                      ]}
                    />
                    <div className="chord-progress" aria-label={`${found.length} of 3 chord notes`}>
                      {[0, 1, 2].map((n) => (
                        <span key={n} className={found[n] ? 'found' : ''}>
                          {found[n] ? pretty(found[n]) : '·'}
                        </span>
                      ))}
                    </div>
                    {input === 'buttons' ? (
                      <div className="chord-answers">
                        {noteChoices.map((note) => (
                          <button
                            key={note}
                            className={`note-button ${found.includes(note) ? 'correct' : ''} ${wrong === note ? 'wrong' : ''}`}
                            disabled={solved || found.includes(note)}
                            onClick={() => answerNote(note)}
                            aria-label={`Chord note ${pretty(note)}`}
                          >
                            {pretty(note)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Microphone onNote={answerNote} chord />
                    )}
                  </>
                )}
                <div
                  className={`feedback ${solved ? 'success' : wrong ? 'incorrect' : ''}`}
                  role="status"
                >
                  {solved && <Check size={15} />}{' '}
                  {message || 'Make the connection, at your own pace.'}
                </div>
                <div className="row-between">
                  <span className="muted small">{count} completed</span>
                  <Button variant="ghost" size="small" onClick={next}>
                    Next key <ArrowRight size={15} />
                  </Button>
                </div>
              </>
            )}
          </section>
          {mode === 'quiz' ? (
            <section className="card compact-card">
              <Field label="Practice range">
                <select
                  aria-label="Practice range"
                  value={scope}
                  onChange={(e) => {
                    reset();
                    setScope(Number(e.target.value));
                    setIndex(0);
                    setAlternative(0);
                  }}
                >
                  <option value={3}>Start small · C, G, F + relative minors</option>
                  <option value={7}>Build confidence · up to 3 ♯ / ♭</option>
                  <option value={12}>All 12 keys</option>
                </select>
              </Field>
            </section>
          ) : (
            <div className="quiet-tip">
              <Piano notes={chordMidi} labels />
              <p>Highlighted notes make the tonic chord.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
