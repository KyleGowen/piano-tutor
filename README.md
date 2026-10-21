# Piano Tutor

A private, locally hosted practice companion for a family learning piano.
Use it alongside your human teacher's lessons, on a computer, tablet, or phone.

## Start practicing

Requires Node.js **20.19+ or 22.12+** (Node 22 LTS recommended) and npm.

```sh
npm ci
npm run build
npm start
```

Open **http://localhost:5173** on this computer. Keep the terminal running.
Press Ctrl+C to stop. On a Mac, you can also double-click
**Start Piano Tutor.command**; it builds and starts the app.

For another device, join the same home Wi-Fi and open the `Home network`
address printed by the launcher. Buttons, reference audio, and the metronome
work over ordinary HTTP. **Phone microphone input needs the HTTPS setup below.**
No internet connection is needed after dependencies are installed and the app
is built. All fonts, icons, notation, and audio processing are local.

## What you can practice

- **Staff Reader:** treble, bass, or both; five levels from landmarks to triads.
  Click note buttons, type A–G, or use the microphone. At the accidentals level,
  choose natural, sharp, or flat first. Correct answers advance automatically.
  Wrong answers stay on the card; hints explain the position and illuminate
  matching buttons. “Grow with me” advances after five consecutive unhinted,
  first-try answers within six seconds each (12 seconds for triads). It never
  forces you down a level. Choose a level manually or use “Start fresh.”
- **Circle of Fifths:** major and relative natural minor keys, key signatures,
  scales, tonic triads, and audible reference tones. Select either ring.
  Enharmonic alternatives include B/C♭, F♯/G♭, and D♭/C♯. Practice key signatures
  or build a tonic chord using note buttons or your piano. Start with three keys,
  expand to seven, or use all twelve. Signature counts are hidden in practice.
- **Metronome:** 20–240 BPM, live tempo adjustment, tap-to-measure with an explicit
  “Use tempo” button, 2/3/4/6 beats per bar, first-beat accent, volume, and a
  visual pulse. The tempo is the rate of each click. “6 beats” means six equal
  clicks per bar, not a dotted-quarter compound-time setting.

Light/dark themes follow the device initially and can be changed at any time.

## Microphone on a phone or tablet

Browsers allow microphone access on `localhost` or trusted HTTPS, but not an
ordinary HTTP home-network IP. This is a browser requirement, not an app setting.
See [MDN's microphone documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

One-time setup on the computer (requires OpenSSL, already available on macOS):

```sh
npm run setup:https
npm start
```

If the server was already running, stop it first and restart after certificate
generation. The launcher now prints both HTTP on port 5173 and HTTPS on 5443.
The setup creates a **dedicated Piano Tutor local certificate authority** and a
server certificate for this computer's current local addresses. It does not
change trust settings on any device.

1. On the phone, open `http://YOUR-COMPUTER-IP:5173/setup/piano-tutor-root.cer`
   to download this app's **public** certificate. Use the IP the launcher prints.
2. Install and trust **Piano Tutor Local CA** on that device:
   - **iPhone/iPad:** install the downloaded profile in Settings → General →
     VPN & Device Management. Then Settings → General → About → Certificate
     Trust Settings → enable full trust for Piano Tutor Local CA.
     [Apple's instructions](https://support.apple.com/en-us/102390).
   - **Android:** Settings → Security & privacy → More security settings →
     Encryption & credentials → Install a certificate → CA certificate. Select
     the downloaded file. Menu names vary by manufacturer.
     [Google's instructions](https://support.google.com/pixelphone/answer/2844832).
3. Open `https://YOUR-COMPUTER-IP:5443` in Safari or Chrome. It should load
   without a certificate warning. Choose **My piano → Enable microphone** and
   allow microphone access.

Trust only the certificate generated in your own checkout. Keep `.certs/`
private and never share `root-key.pem` or `server-key.pem`; only the `.cer` file
is intended for devices. Neither keys nor certificates are committed. The local
server exposes only the public `.cer`, never either private key. Remove the
Piano Tutor CA from your device's settings when you no longer use it.

If the computer's IP changes or its one-year server certificate expires, run
`npm run setup:https` again and restart. It reuses the CA, so devices do not need
to trust a new root. A router DHCP reservation can keep the local IP stable.

## Getting good microphone results

Play **one note at a time**, with the sustain pedal up. Place the device near
the piano and keep the room quiet. Staff exercises require the exact displayed
octave. Chord exercises accept any octave; play the chord tones separately,
lifting between notes. Simultaneous chord recognition is not implemented.

Detection covers B1–C♯6, including all staff exercises. It uses a stable-pitch
gate so a held note cannot solve consecutive cards. Acoustic pianos, room noise,
speaker volume, and phone microphones can affect detection. If it struggles,
lift the key, let the sound decay, and try again; note buttons always remain
available. Reference sounds are synthesized tones, not sampled piano audio.

The microphone and metronome stop when leaving their screen or hiding the tab.
Keep the app visible while practicing; background/lock-screen playback is not
promised. Audio is processed in memory, never recorded, stored, or uploaded.

## Home-network troubleshooting

- Keep the computer awake and both devices on the same network. Guest Wi-Fi
  sometimes isolates devices. Allow Node through the computer firewall for
  the private network if the operating system asks.
- Choose the Wi-Fi/LAN address, not an address belonging to a VPN.
- Do not forward these ports on the router. There is no internet hosting,
  authentication service, or public relay. The static launcher rejects clients
  outside private/loopback/link-local address ranges; your router/firewall still
  owns network isolation. It serves only built app files and the public CA.
- If a port is occupied, stop the other instance or use
  `PORT=5174 HTTPS_PORT=5444 npm start`.
- On the computer, use `localhost`, not the LAN HTTP address, for the mic.
- Clear only this site's browser storage to reset saved settings. The app stores
  theme, BPM, and staff level; session scores are in memory and are not synced.

## Development and verification

React + TypeScript + Vite; local static Node launcher; VexFlow with embedded
Bravura notation fonts; shadcn-style composable Button and Radix tab controls.
Web Audio schedules metronome clicks ahead on the audio clock, rather than
using timer callbacks as the beat clock. See [Web Audio scheduling](https://web.dev/articles/audio-scheduling).
The microphone uses a YIN fundamental-frequency estimator and stable-attack
gate. There are no accounts, backend APIs, AI services, analytics, or uploads.

```sh
npm run dev            # developer hot reload on :5173; stop npm start first
npm test               # music, pitch, debounce, progression, and timing checks
npm run build          # strict TypeScript check and production build
npx playwright install webkit  # one-time test-browser setup
npm run test:browser   # app must be running; installed Chrome + Playwright WebKit
```

Browser checks exercise desktop and mobile viewports, light/dark layouts,
staff and circle quizzes, metronome controls, local runtime assets, microphone
permission errors, synthetic audio input, and stream cleanup. Synthetic audio
tests are not a substitute for an acoustic piano/real-phone acceptance session.
See [current state](docs/project/state.md) for the latest evidence and limits.

## Project authority and continuity

Start with [AGENTS.md](AGENTS.md). This repository owns its requirements,
implementation, operating procedures, and project state. AgentOS carries only
a sanitized summary; its inherited guidance is pinned and is not silently refreshed.

- [Current state](docs/project/state.md)
- [Durable decisions](docs/project/decisions.md)
- [Learning proposals](docs/project/learning-proposals.md)
- [Inherited guidance](.agentos/global-rules.md) and [provenance](.agentos/inheritance.json)

Family identities, recordings, practice records, and credentials do not belong
in committed documentation or AgentOS tracking.
