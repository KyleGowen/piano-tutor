import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch, NoteGate, type Pitch } from '../lib/pitch';

export function audioContext() {
  const Constructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Constructor)
    throw new Error('This browser does not support audio. Try Safari, Chrome, or Firefox.');
  return new Constructor();
}
export function useMicrophone(onNote: (midi: number) => void) {
  const callback = useRef(onNote);
  callback.current = onNote;
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening' | 'error'>('idle');
  const [error, setError] = useState('');
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const generation = useRef(0);
  const resource = useRef<{
    stream?: MediaStream;
    context?: AudioContext;
    timer?: ReturnType<typeof setTimeout>;
  }>({});
  const release = useCallback(() => {
    generation.current++;
    clearTimeout(resource.current.timer);
    resource.current.stream?.getTracks().forEach((track) => track.stop());
    void resource.current.context?.close().catch(() => {});
    resource.current = {};
  }, []);
  const stop = useCallback(() => {
    release();
    setStatus('idle');
    setPitch(null);
  }, [release]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      release();
    };
  }, [release, stop]);
  const start = async () => {
    release();
    setError('');
    setPitch(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError(
        'Microphone needs a secure connection. On this computer, use localhost. On a phone, open the trusted HTTPS address. See Connection help.',
      );
      return;
    }
    setStatus('requesting');
    const request = generation.current;
    try {
      const context = audioContext();
      resource.current.context = context;
      await context.resume();
      if (request !== generation.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      if (request !== generation.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      resource.current.stream = stream;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser); // No destination: microphone sound is never played back or recorded.
      const buffer = new Float32Array(analyser.fftSize);
      const gate = new NoteGate();
      stream.getAudioTracks().forEach((track) => track.addEventListener('ended', stop));
      setStatus('listening');
      const tick = () => {
        if (request !== generation.current) return;
        analyser.getFloatTimeDomainData(buffer);
        const detected = detectPitch(buffer, context.sampleRate);
        setPitch(detected);
        const attack = gate.update(detected?.midi ?? null, performance.now());
        if (attack !== null) callback.current(attack);
        resource.current.timer = setTimeout(tick, 45);
      };
      tick();
    } catch (cause) {
      if (request !== generation.current) return;
      release();
      setStatus('error');
      const name = cause instanceof DOMException ? cause.name : '';
      setError(
        name === 'NotAllowedError'
          ? 'Microphone permission was declined. Allow it in your browser’s site settings, then try again.'
          : name === 'NotFoundError'
            ? 'No microphone found. Connect one or use the note buttons.'
            : 'The microphone could not start. Check that another app is not using it, then try again.',
      );
    }
  };
  return { status, error, pitch, start, stop };
}
