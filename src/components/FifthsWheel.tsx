import { CIRCLE, pretty, type Quality } from '../lib/music';

const point = (radius: number, angle: number) => ({
  x: 240 + radius * Math.sin((angle * Math.PI) / 180),
  y: 240 - radius * Math.cos((angle * Math.PI) / 180),
});
function wedge(inner: number, outer: number, angle: number) {
  const a = point(outer, angle - 15),
    b = point(outer, angle + 15),
    c = point(inner, angle + 15),
    d = point(inner, angle - 15);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
}
export function FifthsWheel({
  selected,
  quality,
  alternative,
  onSelect,
  showSignatures = true,
}: {
  selected: number;
  quality: Quality;
  alternative: number;
  showSignatures?: boolean;
  onSelect: (index: number, quality: Quality) => void;
}) {
  return (
    <svg
      className="fifths-wheel"
      viewBox="0 0 480 480"
      role="group"
      aria-label="Interactive circle of fifths"
    >
      {CIRCLE.map((options, index) => {
        const key = options[index === selected ? alternative : 0];
        const major = point(186, index * 30),
          minor = point(130, index * 30),
          count = point(225, index * 30);
        return (
          <g key={index}>
            {(['major', 'minor'] as Quality[]).map((q) => (
              <g
                key={q}
                role="button"
                tabIndex={0}
                aria-label={`${pretty(key[q])} ${q}`}
                aria-pressed={selected === index && quality === q}
                onClick={() => onSelect(index, q)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(index, q);
                  }
                }}
                className={`wheel-key ${selected === index && quality === q ? 'selected' : ''}`}
              >
                <path
                  d={wedge(q === 'major' ? 158 : 100, q === 'major' ? 212 : 158, index * 30)}
                  className={q === 'major' ? 'major-wedge' : 'minor-wedge'}
                />
                <text
                  x={q === 'major' ? major.x : minor.x}
                  y={q === 'major' ? major.y : minor.y}
                  className={q === 'major' ? 'major-label' : 'minor-label'}
                >
                  {pretty(key[q])}
                  {q === 'minor' ? 'm' : ''}
                </text>
              </g>
            ))}
            {showSignatures && (
              <text x={count.x} y={count.y} className="signature-count">
                {key.fifths ? `${Math.abs(key.fifths)}${key.fifths > 0 ? '♯' : '♭'}` : '♮'}
              </text>
            )}
          </g>
        );
      })}
      <text x="240" y="227" className="wheel-center-title">
        Circle
      </text>
      <text x="240" y="254" className="wheel-center-title">
        of fifths
      </text>
      <text x="240" y="280" className="wheel-center-sub">
        EXPLORE THE KEYS
      </text>
    </svg>
  );
}
