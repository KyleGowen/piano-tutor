import { useEffect, useRef, useState } from 'react';
import { frequencyOf } from '../lib/music';
import { audioContext } from './useMicrophone';

export function usePianoAudio() {
  const context = useRef<AudioContext | null>(null);
  const [error, setError] = useState('');
  const stop = () => {
    void context.current?.close().catch(() => {});
    context.current = null;
  };
  useEffect(() => stop, []);
  const play = async (notes: number[], together = false) => {
    stop();
    setError('');
    try {
      const ctx = audioContext();
      context.current = ctx;
      await ctx.resume();
      if (context.current !== ctx) return;
      notes.forEach((midi, index) => {
        const time = ctx.currentTime + 0.02 + (together ? 0 : index * 0.4);
        [1, 2, 3].forEach((harmonic, i) => {
          const oscillator = ctx.createOscillator(),
            gain = ctx.createGain();
          oscillator.frequency.value = frequencyOf(midi) * harmonic;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(
            0.12 / ((i + 1) ** 2 * (together ? notes.length : 1)),
            time + 0.008,
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.start(time);
          oscillator.stop(time + 1.25);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
      });
    } catch {
      setError('Audio could not start. Check your browser’s sound permission.');
    }
  };
  return { play, stop, error };
}
