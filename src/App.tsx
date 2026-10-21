import { useEffect, useRef, useState } from 'react';
import {
  CircleHelp,
  CircleDot,
  Music2,
  Moon,
  Sun,
  Timer,
  X,
  Wifi,
  LockKeyhole,
  Piano,
} from 'lucide-react';
import { StaffReader } from './pages/StaffReader';
import { CircleOfFifths } from './pages/CircleOfFifths';
import { Metronome } from './pages/Metronome';
import { Button } from './components/ui';
import { readSetting, saveSetting } from './lib/storage';
import './styles.css';

type Page = 'staff' | 'circle' | 'metronome';
const pages = [
  { id: 'staff' as Page, label: 'Staff Reader', short: 'Staff', icon: Music2 },
  { id: 'circle' as Page, label: 'Circle of Fifths', short: 'Circle', icon: CircleDot },
  { id: 'metronome' as Page, label: 'Metronome', short: 'Tempo', icon: Timer },
];
const currentPage = (): Page =>
  ['staff', 'circle', 'metronome'].includes(location.hash.slice(1))
    ? (location.hash.slice(1) as Page)
    : 'staff';
export default function App() {
  const [page, setPage] = useState(currentPage);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readSetting<string>('theme', '');
    return saved === 'light' || saved === 'dark'
      ? saved
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  });
  const [help, setHelp] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveSetting('theme', theme);
  }, [theme]);
  useEffect(() => {
    const change = () => {
      setPage(currentPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#staff" aria-label="Piano Tutor home">
          <span className="brand-mark">
            <Piano size={23} />
          </span>
          <span>
            Piano<span className="brand-light">Tutor</span>
            <small>ROOM TO GROW</small>
          </span>
        </a>
        <div className="nav-label">YOUR PRACTICE SPACE</div>
        <nav aria-label="Main navigation">
          {pages.map(({ id, label, short, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-label={label}
              title={label}
              className={`nav-item ${page === id ? 'active' : ''}`}
              aria-current={page === id ? 'page' : undefined}
            >
              <Icon size={19} />
              <span className="desktop-label">{label}</span>
              <span className="mobile-label">{short}</span>
              {page === id && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>♪</span>
            <p>
              A little practice.
              <br />A little progress.
            </p>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={17} /> Connection help
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            Your practice space <span>/</span>{' '}
            <strong>{pages.find((p) => p.id === page)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-status">
              <span className="small-dot" /> Local & private
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <Button
              className="mobile-help"
              variant="ghost"
              size="icon"
              aria-label="Connection help"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={18} />
            </Button>
          </div>
        </header>
        <main id="main" key={page}>
          {page === 'staff' ? (
            <StaffReader />
          ) : page === 'circle' ? (
            <CircleOfFifths />
          ) : (
            <Metronome />
          )}
          <footer className="page-footer">
            <span>Made for the joy of learning.</span>
            <span>
              One note at a time <span className="footer-note">♩</span>
            </span>
          </footer>
        </main>
      </div>
      {help && <Help onClose={() => setHelp(false)} />}
    </div>
  );
}
function Help({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="help-dialog card"
      aria-labelledby="help-title"
      onCancel={onClose}
    >
      <div className="row-between">
        <h2 id="help-title">At home with your piano.</h2>
        <Button
          autoFocus
          variant="ghost"
          size="icon"
          aria-label="Close connection help"
          onClick={onClose}
        >
          <X size={19} />
        </Button>
      </div>
      <div className="help-section">
        <Wifi size={22} />
        <div>
          <h3>Same Wi-Fi. Any device.</h3>
          <p>
            Keep this computer running and open the network address printed when the app starts on
            your phone or tablet.
          </p>
        </div>
      </div>
      <div className="help-section">
        <MicHelp />
        <div>
          <h3>Playing with your microphone</h3>
          <p>
            On this computer, use localhost. On other devices, use the HTTPS address and trust the
            Piano Tutor certificate first. The README has the one-time setup steps.
          </p>
          <details className="phone-setup">
            <summary>Set up this phone</summary>
            <ol>
              <li>Run the HTTPS setup on the computer, as described in the README.</li>
              <li>
                <a href="/setup/piano-tutor-root.cer">Download your Piano Tutor certificate</a>.
              </li>
              <li>
                On iPhone, install it in Settings → General → VPN &amp; Device Management, then
                enable Piano Tutor in General → About → Certificate Trust Settings.
              </li>
              <li>
                On Android, install it under Security → Encryption &amp; credentials → Install a CA
                certificate.
              </li>
              <li>
                Open the HTTPS network address printed on the computer, then enable the microphone.
              </li>
            </ol>
          </details>
          <p>
            Play one note at a time with the pedal up. For chords, play the notes separately. The
            staff checks the exact octave; chord practice accepts any octave.
          </p>
        </div>
      </div>
      <div className="help-section">
        <LockKeyhole size={22} />
        <div>
          <h3>Just between you and your piano.</h3>
          <p>
            Audio is processed here, never recorded or uploaded. Only your theme, tempo, and staff
            level are saved in this browser. Session scores disappear when you leave.
          </p>
        </div>
      </div>
      <p className="help-footnote">
        A practice companion to your teacher’s lessons. Keep this page visible while using audio.
      </p>
    </dialog>
  );
}
function MicHelp() {
  return <Music2 size={22} />;
}
