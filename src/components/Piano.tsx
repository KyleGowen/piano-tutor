import { mod } from '../lib/music';

export function Piano({ notes = [], labels = false }: { notes?: number[]; labels?: boolean }) {
  const whites = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
  const blacks = [
    { n: 1, x: 1 },
    { n: 3, x: 2 },
    { n: 6, x: 4 },
    { n: 8, x: 5 },
    { n: 10, x: 6 },
    { n: 13, x: 8 },
    { n: 15, x: 9 },
    { n: 18, x: 11 },
    { n: 20, x: 12 },
    { n: 22, x: 13 },
  ];
  return (
    <div className="piano" aria-hidden="true">
      <div className="white-keys">
        {whites.map((n, i) => (
          <div key={n} className={`white-key ${notes.some((m) => mod(m) === mod(n)) ? 'lit' : ''}`}>
            {labels && <span>{['C', 'D', 'E', 'F', 'G', 'A', 'B'][i % 7]}</span>}
          </div>
        ))}
      </div>
      {blacks.map(({ n, x }) => (
        <div
          key={n}
          className={`black-key ${notes.some((m) => mod(m) === mod(n)) ? 'lit' : ''}`}
          style={{ left: `${(x / 14) * 100}%` }}
        />
      ))}
    </div>
  );
}
