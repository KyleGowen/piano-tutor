# Current state

Last updated: 2026-10-21.

- Stage: first functional local application implemented from Kyle's specification.
- Features: adaptive staff reader (treble/bass/both; five levels), circle reference
  and signature/chord quizzes, 20–240 BPM metronome with tap tempo, microphone
  note input, responsive layouts, and light/dark themes.
- Implementation: React/TypeScript/Vite with embedded VexFlow notation fonts;
  static Node launcher and optional local HTTPS. No hosted service, accounts,
  recordings, analytics, or runtime external requests.
- Start: `npm ci`, `npm run build`, `npm start`; Mac double-click launcher included.
  Local app uses HTTP 5173; optional HTTPS 5443 supports phone microphone access.
  See [README](../../README.md) for device trust and operating instructions.
- Microphone boundary: single notes, including arpeggiated chord tones. Staff
  exercises enforce exact octave; circle chord exercises accept any octave.
  Simultaneous chord recognition is outside this implementation.
- Private state: theme, BPM, and selected staff level stay in this browser's
  local storage. Session counters are ephemeral. No family data is committed.
- Approval: Kyle selected this implementation and authorized committing and
  pushing it on 2026-10-21. Source, tests, launch instructions, and project
  documentation form the approved application baseline. Recover it from this
  repository using the steps above; generate local certificates on each host.
  The app remains locally hosted, with no public deployment.

## Verification

- Strict TypeScript/production build and 11 unit checks passed. Music tests cover
  all 15 conventional signatures, relative natural-minor scales, triad spellings,
  progression, and generated exercises. Audio tests cover B1–C♯6 at 44.1/48 kHz,
  harmonic-rich signals, noise rejection, attack gating, and metronome scheduling.
- All 24 browser checks passed across desktop Chromium, mobile Chromium, and
  mobile WebKit (iPhone viewport), including synthetic audio through the browser,
  octave rejection, canceled-permission cleanup, tap tempo, quizzes, responsive
  themes, and no external runtime asset requests. The WebKit fixture shadows the
  navigator mediaDevices getter so it cannot request a physical microphone.
- [Desktop preview](../screenshots/piano-tutor.png) was visually reviewed;
  phone screenshots were also inspected. The fixed notation dimensions found
  during initial testing were corrected before the final successful suite.
- npm dependency audit: zero known vulnerabilities after compatible patches.
- HTTP and HTTPS home-network endpoints returned 200; HTTPS was verified against
  the generated project CA without disabling certificate validation. Certificate
  names and chain verified. Private certificate files are ignored by Git.
  Static-file boundary checks rejected private keys, source, Git paths, traversal,
  and POST requests; only the intended public certificate route was accessible.
- No real acoustic-piano session or physical-phone microphone test has occurred.
  Synthetic tests do not establish performance in a particular room or device.

Next action: install/trust the public local CA on a phone, open the printed HTTPS
address, and try a short practice session at the piano. Device trust is manual;
no system or phone trust settings were changed. Keep the host computer awake.

Initialization provenance remains pinned to AgentOS commit
`83b7bb6c03bd7ad620017428266db62d295dcc9a`; no governance refresh or AgentOS mutation
was performed during application development. Initialization was published in
Piano Tutor commit `2119a0f0ea36c117d4ecd60611dd8d50b15edbf2`.
