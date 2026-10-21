import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CircleHelp, Keyboard, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { Button, Field, PageTitle, Segmented } from '../components/ui';
import { Staff } from '../components/Staff';
import { Microphone } from '../components/Microphone';
import { Piano } from '../components/Piano';
import {
  advanceProgress,
  createChallenge,
  LETTERS,
  LEVELS,
  midiOf,
  pretty,
  staffHint,
  withoutOctave,
  type ClefChoice,
} from '../lib/music';
import { readSetting, saveSetting } from '../lib/storage';

export function StaffReader() {
  const [clef, setClef] = useState<ClefChoice>('treble');
  const [level, setLevel] = useState(() => {
    const saved = readSetting('level', 1);
    return Number.isInteger(saved) && saved >= 1 && saved <= 5 ? saved : 1;
  });
  const [auto, setAuto] = useState(true);
  const [challenge, setChallenge] = useState(() => createChallenge(level, clef));
  const [input, setInput] = useState<'buttons' | 'microphone'>('buttons');
  const [accidental, setAccidental] = useState('');
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fast, setFast] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });
  const started = useRef(performance.now());
  const firstTry = useRef(true);
  const locked = useRef(false);
  const foundRef = useRef<string[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const next = (nextLevel = level, nextClef = clef) => {
    clearTimeout(timeout.current);
    locked.current = false;
    foundRef.current = [];
    setChallenge((previous) => createChallenge(nextLevel, nextClef, previous.id));
    setFound([]);
    setWrong(null);
    setHint(false);
    setComplete(false);
    setAccidental('');
    firstTry.current = true;
    started.current = performance.now();
  };
  useEffect(() => () => clearTimeout(timeout.current), []);
  useEffect(() => saveSetting('level', level), [level]);
  const answer = (value: string | number) => {
    if (locked.current) return;
    const match = challenge.notes.find((note) =>
      typeof value === 'number' ? midiOf(note) === value : withoutOctave(note) === value,
    );
    if (match && foundRef.current.includes(match)) return;
    if (!match) {
      firstTry.current = false;
      setWrong(String(value));
      setFeedback(
        typeof value === 'number'
          ? 'Try again. Check the note and its octave.'
          : `Not quite. Look at the note’s line or space${level === 4 ? ' and its accidental' : ''}.`,
      );
      return;
    }
    const updated = [...foundRef.current, match];
    foundRef.current = updated;
    setFound(updated);
    setWrong(null);
    if (updated.length < challenge.notes.length) {
      setFeedback('That’s one. Find the remaining notes.');
      return;
    }
    locked.current = true;
    setComplete(true);
    setStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (firstTry.current && !hint ? 1 : 0),
      streak: firstTry.current && !hint ? s.streak + 1 : 0,
    }));
    const progress = advanceProgress(
      { level, fast },
      firstTry.current,
      (performance.now() - started.current) / 1000,
      hint,
    );
    const nextLevel = auto ? progress.level : level;
    setFast(auto ? progress.fast : 0);
    setFeedback(
      nextLevel > level
        ? `Lovely work. Ready for level ${nextLevel}!`
        : `${challenge.notes.map(pretty).join(' · ')}. Nicely done.`,
    );
    timeout.current = setTimeout(() => {
      setLevel(nextLevel);
      next(nextLevel);
      setFeedback('');
    }, 1050);
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        input !== 'buttons' ||
        (event.target as HTMLElement).closest('input,select,button,[role="tab"]')
      )
        return;
      if (/^[a-g]$/i.test(event.key)) answer(event.key.toUpperCase() + accidental);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  const changeLevel = (value: number) => {
    setLevel(value);
    setFast(0);
    setFeedback('');
    next(value);
  };
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE PRACTICE, EVERY DAY"
        title="Find your note."
        description="Get comfortable with the staff, one note at a time."
      />
      <div className="practice-layout">
        <section className="card exercise-card" aria-label="Staff reading exercise">
          <div className="card-top">
            <span className="badge">
              <span className="small-dot" />{' '}
              {challenge.clef === 'treble' ? 'Treble clef' : 'Bass clef'}
            </span>
            <span className="muted small">
              Level {level} · {LEVELS[level - 1].short}
            </span>
          </div>
          <div className="exercise-prompt">
            <h2>{level === 5 ? 'Which notes make this chord?' : 'What note is this?'}</h2>
            <p>
              {level === 5
                ? 'Choose all three, in any order.'
                : input === 'buttons'
                  ? 'Choose a note below.'
                  : 'Play the note on your piano.'}
            </p>
          </div>
          <Staff notes={challenge.notes} clef={challenge.clef} reveal={hint || complete} />
          <div
            className={`feedback ${complete ? 'success' : wrong ? 'incorrect' : ''}`}
            role="status"
            aria-live="polite"
          >
            {complete && <Check size={17} />}{' '}
            {feedback ||
              (hint
                ? challenge.notes.map((note) => staffHint(note, challenge.clef)).join(' ')
                : 'Take your time. You’ve got this.')}
          </div>
          <div className="answer-area">
            <Segmented
              value={input}
              onChange={setInput}
              label="Answer input"
              options={[
                {
                  value: 'buttons',
                  label: (
                    <>
                      <Keyboard size={15} /> Note buttons
                    </>
                  ),
                },
                {
                  value: 'microphone',
                  label: (
                    <>
                      <Mic size={15} /> My piano
                    </>
                  ),
                },
              ]}
            />
            {input === 'buttons' ? (
              <>
                {level === 4 && (
                  <Segmented
                    label="Accidental"
                    value={accidental}
                    onChange={setAccidental}
                    options={[
                      { value: 'b', label: '♭ Flat' },
                      { value: '', label: '♮ Natural' },
                      { value: '#', label: '♯ Sharp' },
                    ]}
                  />
                )}
                <div className="note-buttons">
                  {LETTERS.map((letter) => {
                    const value = letter + accidental,
                      correct = found.some((note) => withoutOctave(note) === value);
                    return (
                      <button
                        key={letter}
                        className={`note-button ${correct ? 'correct' : ''} ${wrong === value ? 'wrong' : ''} ${hint && challenge.notes.some((note) => withoutOctave(note) === value) ? 'hinted' : ''}`}
                        disabled={complete || correct}
                        onClick={() => answer(value)}
                        aria-label={`Answer ${pretty(value)}`}
                      >
                        {pretty(value)}
                        {correct && <Check size={13} />}
                      </button>
                    );
                  })}
                </div>
                <p className="keyboard-tip">You can also use A–G on your keyboard.</p>
              </>
            ) : (
              <Microphone onNote={answer} exactOctave chord={level === 5} />
            )}
          </div>
          <div className="exercise-footer">
            <Button
              variant="ghost"
              size="small"
              disabled={complete}
              onClick={() => {
                setHint(true);
                firstTry.current = false;
                setFeedback(
                  challenge.notes.map((note) => staffHint(note, challenge.clef)).join(' '),
                );
              }}
            >
              <CircleHelp size={15} /> A little hint
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setFast(0);
                next();
                setFeedback('');
              }}
            >
              Skip <ArrowRight size={15} />
            </Button>
          </div>
        </section>
        <aside className="practice-aside">
          <section className="card settings-card">
            <h3>Your practice</h3>
            <Field label="Clef">
              <Segmented
                value={clef}
                onChange={(value) => {
                  setClef(value);
                  setFast(0);
                  next(level, value);
                  setFeedback('');
                }}
                label="Clef"
                options={[
                  { value: 'treble', label: 'Treble' },
                  { value: 'bass', label: 'Bass' },
                  { value: 'both', label: 'Both' },
                ]}
              />
            </Field>
            <Field label="Difficulty">
              <select
                aria-label="Difficulty"
                value={level}
                onChange={(e) => changeLevel(Number(e.target.value))}
              >
                {LEVELS.map((item, index) => (
                  <option value={index + 1} key={item.short}>
                    {index + 1} · {item.short}
                  </option>
                ))}
              </select>
              <p className="field-note">{LEVELS[level - 1].detail}</p>
            </Field>
            <label className="switch-row">
              <span>
                Grow with me<small>Step up when you’re ready</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={auto}
                onChange={(e) => {
                  setAuto(e.target.checked);
                  setFast(0);
                }}
              />
            </label>
            {auto && (
              <div className="growth">
                <div className="growth-bars" aria-label={`${fast} of 5 fluent answers`}>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span key={n} className={n < fast ? 'filled' : ''} />
                  ))}
                </div>
                <p>
                  {level === 5
                    ? 'Keep building confidence.'
                    : '5 fluent, first-try answers unlock the next level.'}
                </p>
              </div>
            )}
          </section>
          <section className="card session-card">
            <div className="row-between">
              <h3>This session</h3>
              <Sparkles size={17} />
            </div>
            <div className="session-stats">
              <div>
                <strong>{stats.total}</strong>
                <span>completed</span>
              </div>
              <div>
                <strong>
                  {stats.total ? `${Math.round((stats.correct / stats.total) * 100)}%` : '—'}
                </strong>
                <span>first try</span>
              </div>
              <div>
                <strong>{stats.streak}</strong>
                <span>in a row</span>
              </div>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setStats({ correct: 0, total: 0, streak: 0 });
                changeLevel(1);
              }}
            >
              <RotateCcw size={13} /> Start fresh
            </button>
          </section>
          <div className="quiet-tip">
            <Piano notes={hint || complete ? challenge.notes.map(midiOf) : []} />
            <p>Small steps. Steady progress.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
