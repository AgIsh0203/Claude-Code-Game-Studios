# ProjectI fork of Claude Code Game Studios

A fork of [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
(`upstream`), run as a **local Claude Code plugin** for ProjectI ("Squirrel Wheels",
`D:\Games-Unreal\ProjectI`) instead of being copied into the game's repo.

- Branch `projecti`, based on the `v1.2.0` tag.
- The plugin root is this repo's `.claude/` folder (upstream's layout is unchanged, so
  upstream merges stay clean): `.claude/.claude-plugin/plugin.json` (plugin `ccgs`) and
  `.claude/hooks/hooks.json` (the hooks ProjectI's settings.json used to register).
- `.claude-plugin/marketplace.json` at the repo root is the local marketplace `ccgs-local`.
- Claude Code reads the plugin straight from this folder: edits take effect at the next
  session start (or `/reload-plugins`). Skills and agents are named `ccgs:<name>`.
- Installed for ProjectI only: `claude plugin install ccgs@ccgs-local --scope project`
  (ProjectI's `.claude/settings.json` has `"enabledPlugins": {"ccgs@ccgs-local": true}`).
  Other projects don't see it unless installed there too.

## What stays in the project

Per-project files never move here: `.claude/ccgs/` (project.yaml, stage, session state
and logs), `.claude/rules/`, `.claude/agent-memory/`, `.claude/docs/projecti-layout.md`,
`.claude/docs/technical-preferences.md`, `.claude/hooks/projecti-guard.js` and the
settings files.

## The two layers on `projecti`

1. **ProjectI adaptations** (1 Nov, from ProjectI commit `9093aec`): skills, agents and docs
   pointed at ProjectI's own docs, Trello and Unreal layout; `code-review` and `prototype`
   renamed `gamedev-code-review` and `gamedev-prototype`.
2. **Plugin relocation** (5 Nov): `plugin-tools/relocate.js` rewrites the framework's
   `.claude/<skills|scripts|docs|hooks|agents>` paths to this folder's absolute path, and
   `.claude/ccgs/studio-tests` to `<repo>/studio-tests`. It also makes the helpers find
   the project from `$CLAUDE_PROJECT_DIR` or `git rev-parse --show-toplevel` (they used
   to go two folders up from themselves), and lets Python's `relpath` cope with the
   plugin (C:) and the project (D:) sitting on different drives. It is idempotent.

## Upgrading from upstream

```bash
git fetch upstream --tags
git merge v1.x.y            # resolve conflicts, keeping the ProjectI adaptations
node plugin-tools/relocate.js
```

Then run a few helpers from the project root (`bash <plugin>/scripts/agent-check.sh`,
`project-state.sh`, `story-status.sh`) and start a new session to check the hooks.

## Moving this folder

Paths are absolute. After a move: `node plugin-tools/relocate.js` won't rewrite already
absolute paths, so replace the old prefix (`C:/Users/ishan/.claude/ccgs-studio`) across
`.claude/` and `studio-tests/`, then `claude plugin marketplace remove ccgs-local` and add
the new folder.
