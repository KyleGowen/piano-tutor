# Learning proposals

This is Piano Tutor's default permitted destination for compact, sanitized
learning proposals. Read relevant entries before related work and check for
reusable learning after meaningful runs. Proposals below are not implementation
or governance authorization.

When warranted, record: date and run evidence; observed reusable signal; proposed
change and its single owning source; verification approach; evidence count or
retrospective; and status (`proposed`, `reviewed`, `promoted`, or `declined`).
Routine success with no new reusable delta requires no entry.

Follow [.agentos/global-rules.md](../../.agentos/global-rules.md): promotion needs
generalizable, source-grounded evidence from two runs or a retrospective after
three meaningful runs, with the reviewed high-impact-failure exception. A proposal
does not grant authority to edit agents, skills, code, permissions, or safety rules.
Keep only compact evidence pointers, never private application data or raw content.

## 2026-10-21 — Verify notation at its rendered size

- Evidence: initial desktop/mobile browser checks exposed notation extending
  beyond its card. VexFlow set inline pixel dimensions even after SVG width/height
  attributes were removed. Explicit fluid inline dimensions corrected the crop;
  screenshots and overflow assertions then passed.
- Proposed change: when introducing or changing engraving/rendering components,
  retain a narrow-phone and desktop rendered-layout check in the owning component's
  verification procedure. A viewBox alone does not establish responsiveness.
- Owning source if promoted: Piano Tutor's component verification guidance; no
  AgentOS or global policy changes are proposed.
- Evidence count: one implementation run with before/after browser evidence.
  Status: **proposed**; no governance or skill rule was promoted.
