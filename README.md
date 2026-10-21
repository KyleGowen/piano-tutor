# Piano Tutor

A browser-based web app to help Kyle's family practice piano.

Repository: [KyleGowen/piano-tutor](https://github.com/KyleGowen/piano-tutor).

**Stage:** project initialization; application development pending. Kyle will
specify and build the application in a subsequent task. GPT-6 Astra is the
intended development tool, not a requirement to integrate AI into the app.

Framework, hosting, storage, authentication, MIDI/microphone support, curriculum,
and other product choices remain undecided. No application is scaffolded and no
application dependencies, services, or deployment are established here.

## Project authority and continuity

Start with [AGENTS.md](AGENTS.md). The authoritative project files are:

| File | Read / update purpose |
|---|---|
| [Current state](docs/project/state.md) | Read at session start; update after meaningful work with the next action and evidence. |
| [Durable decisions](docs/project/decisions.md) | Read before making choices; update when Kyle supplies or approves a durable decision. |
| [Learning proposals](docs/project/learning-proposals.md) | Consult relevant proposals; add compact reusable lessons after meaningful runs when warranted. |
| [Inherited guidance](.agentos/global-rules.md) | Read before meaningful work; refresh only through a deliberate reviewed change. |
| [Inheritance provenance](.agentos/inheritance.json) | Exact AgentOS revision, sources, scope, verification date, and refresh procedure. |

Piano Tutor owns detailed requirements, implementation, operating procedures,
and memory. AgentOS maintains summary-level tracking in
[`os/context/current-projects.md`](https://github.com/KyleGowen/AgentOS/blob/main/os/context/current-projects.md)
and [`os/context/agentos-inheritance-registry.md`](https://github.com/KyleGowen/AgentOS/blob/main/os/context/agentos-inheritance-registry.md);
its playbook table is generated from the registry. This is an independent
personal project, not an AgentOS coursework project.

The checked-in inheritance cache works on other machines without a local
AgentOS checkout. It carries guidance only. Family identities, recordings,
practice records, credentials, and other private application data do not belong
in committed documentation or AgentOS tracking.
