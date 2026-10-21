import { Mic, MicOff, AudioLines } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { noteName } from '../lib/music';
import { Button } from './ui';

export function Microphone({
  onNote,
  chord = false,
  exactOctave = false,
}: {
  onNote: (midi: number) => void;
  chord?: boolean;
  exactOctave?: boolean;
}) {
  const mic = useMicrophone(onNote);
  const active = mic.status === 'listening',
    pending = mic.status === 'requesting';
  return (
    <div className="mic-panel">
      <div className={`listening-display ${active ? 'active' : ''}`}>
        <AudioLines size={24} />
        <strong>
          {active
            ? mic.pitch
              ? noteName(mic.pitch.midi)
              : 'Listening…'
            : pending
              ? 'Allow microphone…'
              : 'Play your piano'}
        </strong>
        {active && mic.pitch && (
          <span>
            {Math.round(mic.pitch.cents) > 0 ? '+' : ''}
            {Math.round(mic.pitch.cents)}¢
          </span>
        )}
      </div>
      <p>
        {chord
          ? 'Play each chord tone separately, lifting between notes.'
          : exactOctave
            ? 'Play one note in the octave shown on the staff.'
            : 'Play one note at a time.'}{' '}
        Keep the sustain pedal up.
      </p>
      <Button
        variant={active || pending ? 'outline' : 'default'}
        onClick={active || pending ? mic.stop : mic.start}
      >
        {active || pending ? <MicOff size={16} /> : <Mic size={16} />}{' '}
        {active ? 'Stop listening' : pending ? 'Cancel' : 'Enable microphone'}
      </Button>
      {mic.error && (
        <p role="alert" className="error-message">
          {mic.error}
        </p>
      )}
      <small>Audio stays on this device. Nothing is recorded.</small>
    </div>
  );
}
