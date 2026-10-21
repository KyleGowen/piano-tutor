import { useEffect, useRef, useState } from 'react';
import { Hand, Minus, Pause, Play, Plus, RotateCcw, Volume2 } from 'lucide-react';
import { Button, Field, PageTitle } from '../components/ui';
import { audioContext } from '../hooks/useMicrophone';
import { BeatClock, clampBpm, tapTempo } from '../lib/rhythm';
import { readSetting, saveSetting } from '../lib/storage';

export function Metronome() {
  const [bpm, setBpm] = useState(() => clampBpm(Number(readSetting('bpm', 80))));
  const [draftBpm, setDraftBpm] = useState(String(bpm));
  const [running, setRunning] = useState(false);
  const [beats, setBeats] = useState(4);
  const [accent, setAccent] = useState(true);
  const [volume, setVolume] = useState(65);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [taps, setTaps] = useState<number[]>([]);
  const [error, setError] = useState('');
  const settings = useRef({ bpm, beats, accent, volume });
  settings.current = { bpm, beats, accent, volume };
  const resources = useRef<{
    context?: AudioContext;
    interval?: ReturnType<typeof setInterval>;
    timers: ReturnType<typeof setTimeout>[];
    bus?: GainNode;
  }>({ timers: [] });
  const generation = useRef(0);
  const tapping = tapTempo(taps);
  const release = () => {
    generation.current++;
    clearInterval(resources.current.interval);
    resources.current.timers.forEach(clearTimeout);
    void resources.current.context?.close().catch(() => {});
    resources.current = { timers: [] };
  };
  const stop = () => {
    release();
    setRunning(false);
    setActiveBeat(-1);
  };
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      release();
    };
  }, []);
  useEffect(() => {
    saveSetting('bpm', bpm);
    setDraftBpm(String(bpm));
  }, [bpm]);
  useEffect(() => {
    const { context, bus } = resources.current;
    if (context && bus) bus.gain.setTargetAtTime(volume / 100, context.currentTime, 0.015);
  }, [volume]);
  const start = async () => {
    release();
    setError('');
    const request = generation.current;
    try {
      const context = audioContext();
      resources.current.context = context;
      await context.resume();
      if (generation.current !== request) return;
      const bus = context.createGain();
      bus.gain.value = settings.current.volume / 100;
      bus.connect(context.destination);
      resources.current.bus = bus;
      const clock = new BeatClock();
      clock.start(context.currentTime, settings.current.bpm);
      const schedule = () => {
        const current = settings.current;
        clock.schedule(context.currentTime, current.bpm, current.beats).forEach((click) => {
          const oscillator = context.createOscillator(),
            gain = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = current.accent && click.accent ? 1300 : 850;
          gain.gain.setValueAtTime(0, click.time);
          gain.gain.linearRampToValueAtTime(0.65, click.time + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.001, click.time + 0.045);
          oscillator.connect(gain);
          gain.connect(bus);
          oscillator.start(click.time);
          oscillator.stop(click.time + 0.05);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
          const timer = setTimeout(
            () => {
              setActiveBeat(click.beat);
              resources.current.timers = resources.current.timers.filter((t) => t !== timer);
            },
            Math.max(0, (click.time - context.currentTime) * 1000),
          );
          resources.current.timers.push(timer);
        });
      };
      schedule();
      resources.current.interval = setInterval(schedule, 25);
      setRunning(true);
    } catch {
      release();
      setRunning(false);
      setError('Could not start audio. Allow sound in your browser, then try again.');
    }
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.code !== 'Space' ||
        event.repeat ||
        (event.target as HTMLElement).closest('input,select,button')
      )
        return;
      event.preventDefault();
      if (running) stop();
      else void start();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  const tap = () => {
    const now = performance.now();
    setTaps((previous) => {
      if (!previous.length || now - previous[previous.length - 1] > 3500) return [now];
      if (now - previous[previous.length - 1] < 180) return previous;
      return [...previous.slice(-8), now];
    });
  };
  return (
    <>
      <PageTitle
        eyebrow="FIND YOUR RHYTHM"
        title="Make time for music."
        description="A steady pulse. A little more confidence."
      />
      <div className="practice-layout">
        <section className={`card metronome-card ${running ? 'is-running' : ''}`}>
          <div className="card-top">
            <span className="badge">
              <span className={`small-dot ${running ? 'pulse' : ''}`} />
              {running ? 'Keeping time' : 'Ready when you are'}
            </span>
            <span className="muted small">20–240 BPM</span>
          </div>
          <div className="tempo-dial">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <circle className="dial-circle" cx="150" cy="150" r="137" />
              {Array.from({ length: 60 }, (_, i) => (
                <line
                  key={i}
                  x1="150"
                  y1={i % 5 === 0 ? 17 : 21}
                  x2="150"
                  y2="26"
                  transform={`rotate(${i * 6} 150 150)`}
                  className={i % 5 === 0 ? 'dial-tick major' : 'dial-tick'}
                />
              ))}
            </svg>
            <div className="tempo-value">
              <label htmlFor="bpm" className="sr-only">
                Beats per minute
              </label>
              <input
                id="bpm"
                aria-label="Beats per minute"
                type="number"
                min="20"
                max="240"
                value={draftBpm}
                onChange={(e) => {
                  setDraftBpm(e.target.value);
                  const value = Number(e.target.value);
                  if (value >= 20 && value <= 240) setBpm(Math.round(value));
                }}
                onBlur={() => {
                  const value = clampBpm(Number(draftBpm));
                  setBpm(value);
                  setDraftBpm(String(value));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
              <span>BEATS PER MINUTE</span>
              <p>
                {bpm < 60
                  ? 'Largo'
                  : bpm < 76
                    ? 'Adagio'
                    : bpm < 108
                      ? 'Andante'
                      : bpm < 120
                        ? 'Moderato'
                        : bpm < 168
                          ? 'Allegro'
                          : 'Presto'}
              </p>
            </div>
          </div>
          <div className="tempo-adjust">
            <Button
              variant="outline"
              size="icon"
              aria-label="Decrease tempo"
              onClick={() => setBpm((b) => clampBpm(b - 1))}
            >
              <Minus size={18} />
            </Button>
            <input
              aria-label="Tempo slider"
              type="range"
              min="20"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Increase tempo"
              onClick={() => setBpm((b) => clampBpm(b + 1))}
            >
              <Plus size={18} />
            </Button>
          </div>
          <div className="beat-lights" aria-label={`Beat ${activeBeat + 1} of ${beats}`}>
            {Array.from({ length: beats }, (_, i) => (
              <span
                key={i}
                className={`${i === activeBeat ? 'lit' : ''} ${accent && i === 0 ? 'downbeat' : ''}`}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <Button className="start-metronome" onClick={running ? stop : start}>
            {running ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {running ? 'Pause' : 'Start metronome'}
          </Button>
          <p className="keyboard-tip">Space to {running ? 'pause' : 'start'}</p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
        </section>
        <aside className="practice-aside">
          <section className="card settings-card">
            <h3>Your rhythm</h3>
            <Field label="Beats per bar">
              <div className="beat-select">
                {[2, 3, 4, 6].map((value) => (
                  <button
                    key={value}
                    aria-label={`${value} beats per bar`}
                    aria-pressed={beats === value}
                    className={beats === value ? 'selected' : ''}
                    onClick={() => setBeats(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
            <label className="switch-row">
              <span>
                Accent first beat<small>Hear where each bar begins</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={accent}
                onChange={(e) => setAccent(e.target.checked)}
              />
            </label>
            <Field label="Volume">
              <div className="volume-row">
                <Volume2 size={17} />
                <input
                  aria-label="Metronome volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
                <span>{volume}%</span>
              </div>
            </Field>
          </section>
          <section className="card tap-card">
            <div className="row-between">
              <h3>Find a tempo</h3>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Reset tap tempo"
                onClick={() => setTaps([])}
              >
                <RotateCcw size={14} />
              </Button>
            </div>
            <p className="muted small">Tap along to the beat you hear.</p>
            <button className="tap-pad" onClick={tap}>
              <Hand size={25} />
              <strong>Tap tempo</strong>
              <span>
                {taps.length < 3
                  ? taps.length
                    ? `${3 - taps.length} more taps…`
                    : 'At least 3 taps'
                  : `${taps.length} taps`}
              </span>
            </button>
            <div className="tap-result">
              <strong aria-live="polite">
                {tapping ?? '—'} <span>BPM</span>
              </strong>
              <Button
                variant="outline"
                size="small"
                disabled={tapping === null}
                onClick={() => {
                  if (tapping) setBpm(tapping);
                }}
              >
                Use tempo
              </Button>
            </div>
          </section>
          <p className="aside-tip">Begin slowly. Let accuracy lead the way.</p>
        </aside>
      </div>
    </>
  );
}
