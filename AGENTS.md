# Piano Tutor project guidance

Piano Tutor is an independent personal/family project. This repository owns its
requirements, architecture, implementation, operating procedures, and memory.

## Start here

1. Read [README.md](README.md) for the supplied project facts and scope.
2. Read [.agentos/global-rules.md](.agentos/global-rules.md) and its
   [provenance and refresh policy](.agentos/inheritance.json).
3. Read [current state](docs/project/state.md) and
   [durable decisions](docs/project/decisions.md) before meaningful work.
4. Read [learning proposals](docs/project/learning-proposals.md) when relevant
   to the task; check for a reusable learning delta after meaningful runs.

Platform rules and explicit user instructions retain precedence. Project-local
requirements and procedures take precedence over the applicable inherited
defaults. The `.agentos/` files are a traceable cache of committed AgentOS
guidance, not an independent policy authority. Do not silently refresh or
rewrite governance during ordinary development.

## Boundaries

- Initialization only until Kyle supplies the application task. Do not infer a
  framework, hosting, storage, authentication, input method, or curriculum.
- GPT-6 Astra is Kyle's intended development tool; it does not imply AI in the
  application or authorize changing account/model settings.
- Keep this repository independent of AgentOS and all other projects. AgentOS
  tracks a sanitized summary and routes detailed work here.
- Keep family identities, recordings, practice records, and other private
  application data out of committed documentation and AgentOS tracking. Do not
  commit credentials or raw private content.
- Inheritance grants no credentials, permissions, tools, automations, access
  to unrelated memories, or authority to act in another project.
- Future specialized agents must define their context/state allowlist,
  canonical sources, permitted learning destination, and mutation boundary.
  Future executable skills must include a `Post-Run Learning` section. Follow
  the inherited evidence and review requirements before promoting learning.

## Continuity

Update `docs/project/state.md` after meaningful work or a project shift: keep
the current stage, next action, blockers, and evidence compact. Record approved
durable choices and reasons in `docs/project/decisions.md`. Record warranted
learning proposals only in `docs/project/learning-proposals.md`; proposals do
not authorize implementation. Commit and push scoped documentation when the
task authorizes it so another machine can recover the same context. Chat history
and generated model memory are recall aids, not authoritative project state.
