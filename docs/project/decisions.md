# Durable decisions

Source: Kyle's explicit initialization request, 2026-10-21.

- Piano Tutor is an independent personal/family repository for a browser-based
  piano-practice app. AgentOS tracks only a sanitized summary and routing.
- Piano Tutor owns its detailed requirements, architecture, implementation,
  operating procedures, and memory. AgentOS contributes only scoped general
  guidance with pinned source provenance and deliberate refresh.
- GPT-6 Astra is the intended development tool; no application AI requirement
  follows from that preference.
- Application development follows initialization. Framework, hosting, storage,
  authentication, MIDI/microphone support, curriculum, and other product choices
  remain undecided.
- Family identities, recordings, practice records, and other private application
  data stay out of AgentOS tracking and committed documentation.

Read before making durable choices. Add approved decisions with date, reason,
source, and any superseded decision; do not turn proposals into decisions silently.

## Application task — 2026-10-21

Source: Kyle's explicit application specification and build request in this chat.
This supersedes the initialization-only/undecided application scope above.

- Build a locally launchable browser app for auxiliary piano homework; the human
  teacher remains the instructional authority. Desktop and mobile layouts are
  required, with minimal text/color and both light and dark themes.
- The feature scope is a configurable 20–240 BPM metronome with tap tempo; adaptive
  treble/bass staff exercises; and a circle-of-fifths reference plus major/minor
  signature and chord practice. Buttons and microphone input are both required.
- Home-network access is required; public internet hosting is not. No external
  application AI service or user-account system was requested.
- Implementation choices made under the build request: React/TypeScript/Vite,
  VexFlow for engraving, local Web Audio synthesis/detection, and a static Node
  launcher. These are implementation choices, not a claim that Kyle specified a
  framework. The reusable button follows the shadcn composition pattern and
  Radix supplies accessible tab interactions; styling uses project CSS tokens.
- Microphone chords use individually played tones. This limitation is visible in
  the UI and README; simultaneous polyphonic recognition is not claimed.
- Browser microphone security requires localhost or trusted HTTPS. A dedicated,
  ignored local CA/server-certificate setup supports phones without a public
  service. Installing/trusting the public certificate remains a user device action.
- Store only theme, tempo, and chosen staff level in local browser storage; use
  ephemeral session statistics. Never record, persist, or transmit microphone
  audio. No family identities, profiles, or synchronized practice records.

## Implementation approval — 2026-10-21

Source: Kyle's explicit follow-up, “I love it commit and push.”

- Kyle approved the delivered application, including the implementation choices
  and documented microphone behavior above, and authorized publishing the scoped
  source, tests, launcher, preview, and project documentation to this repository.
- Certificate private keys, installed dependencies, build output, and test-run
  artifacts remain local and excluded from Git.
