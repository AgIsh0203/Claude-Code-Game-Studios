# /gamedev-prototype — Phase 2: Load Concept Context

> Part of `/gamedev-prototype`. `SKILL.md` names when to read this file; the settings it
> resolved and the rules under its later headings still apply here.

## Phase 2: Load Concept Context

Read `docs/GDD.md` — or `docs/GDD.md`, the one-page brief
that replaces it at `rigor: minimal` — if either exists. Read it by section: find the
headings you need with the Grep tool (pattern `^#`, content mode) and Read those
ranges with offset and limit. Extract:
- Core fantasy (what the player is supposed to feel)
- Core loop (the moment-to-moment action being tested)

Determine the engine and language in use: read `engine.name` and
`engine.language` from `.claude/ccgs/project.yaml`. For each field, if its key is absent or
empty (including when `.claude/ccgs/project.yaml` has no `engine:` block), fall back to
`CLAUDE.md` and `.claude/docs/technical-preferences.md`. Treat a
`[TO BE CONFIGURED]` value as not set.

---
