import { useLayoutEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura';
import type { Clef } from '../lib/music';

export function Staff({
  notes,
  clef = 'treble',
  signature,
  reveal = false,
}: {
  notes: string[];
  clef?: Clef;
  signature?: string;
  reveal?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = '';
    const renderer = new Renderer(host.current, Renderer.Backends.SVG);
    renderer.resize(500, 230);
    const context = renderer.getContext();
    context.setFillStyle('currentColor');
    context.setStrokeStyle('currentColor');
    const stave = new Stave(45, 55, 410).addClef(clef);
    if (signature) stave.addKeySignature(signature);
    stave.setContext(context).draw();
    if (notes.length) {
      const keys = notes.map((note) =>
        note.replace(
          /([A-G])([#b]*)(\d+)/,
          (_, letter, accidental, octave) => `${letter.toLowerCase()}${accidental}/${octave}`,
        ),
      );
      const chord = new StaveNote({ keys, clef, duration: 'q', autoStem: true });
      notes.forEach((note, i) => {
        const accidental = note.match(/[#b]+/);
        if (accidental) chord.addModifier(new Accidental(accidental[0]), i);
      });
      const voice = new Voice({ numBeats: 1, beatValue: 4 }).addTickables([chord]);
      new Formatter().joinVoices([voice]).format([voice], 220);
      chord.setXShift(140);
      voice.draw(context, stave);
    }
    const svg = host.current.querySelector('svg');
    svg?.setAttribute('aria-hidden', 'true');
    svg?.setAttribute('viewBox', '0 0 500 230');
    svg?.removeAttribute('width');
    svg?.removeAttribute('height');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = 'auto';
    }
  }, [notes.join(','), clef, signature]);
  return (
    <div className="staff-wrap">
      <div
        className="staff"
        ref={host}
        role="img"
        aria-label={
          reveal
            ? `${clef} staff: ${notes.join(', ')}`
            : `${clef} staff exercise. Identify the displayed ${notes.length > 1 ? 'notes' : 'note'}.`
        }
      />
    </div>
  );
}
