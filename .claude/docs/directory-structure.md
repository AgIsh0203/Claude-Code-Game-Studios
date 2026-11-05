# Directory Structure

```text
/                                # ProjectI (Squirrel Wheels). Full map: .claude/docs/projecti-layout.md
├── CLAUDE.md                    # Master configuration: status, locked decisions, code map (wins on conflict)
├── CREDITS.md                   # A line per imported asset
├── .claude/                     # Agents, skills, docs, scripts
│   └── ccgs/                    # Framework config + state: project.yaml, stage.txt, session-state/ (gitignored), session-logs/ (gitignored)
├── Source/ProjectI/             # Game C++ (the code root)
├── Content/                     # Unreal assets; ThirdParty/ (committed), ThirdParty_Private/ (ignored)
├── SourceArt/                   # Source art for the Blender pipelines
├── Tools/                       # Blender, Car, Docs, Playtest, Route scripts
├── Config/                      # Engine and game config
└── docs/
    ├── GDD.md                   # Concept, pillars, systems and their status, tuning table
    ├── Roadmap.md               # Plan (J1–J15), backlog (#N), package size, release checklist, decisions
    ├── Playtest.md              # Hands-on checks and every playtest / review result
    ├── Story.md, story/         # Story bible, radio script, voice-actor sources
    ├── Assets.md                # Licences, folders, slot map, sources
    ├── Terrain.md               # L_Route, the mountain trail
    ├── design/, production/, prototypes/, architecture/   # created only if a skill needs them
    └── Review_<date>_<topic>.md # Long reviews
```

Work items (bugs, tasks, stories) are cards on the Trello board, not files.

## The code root is engine-specific

**Two of the three supported engines will not build a project whose code sits in
`src/`.** This is not a style preference — it is a hard constraint of the engine's
own toolchain:

| `engine.name` | Code root | Why it cannot be `src/` |
|---|---|---|
| **Godot** | `src/` | No constraint — Godot loads from `res://` anywhere under the project root. |
| **Unity** | `Assets/` | Unity compiles **only** `Assets/` and `Packages/`. Code outside them is invisible to the compiler. |
| **Unreal** | `Source/<Module>/` | UnrealBuildTool discovers modules under `Source/`; content lives in `Content/`. A module elsewhere is not built. |

**Resolve the code root from `engine.name` before writing any source file.** A
path shown as `src/…` alone is a Godot example: read it as *"the code root"* and
substitute the row above. `src/` is the table's Godot row, not a universal path.

**Tests follow the same rule** — the same compilers decide what they see:

| `engine.name` | Test root | Anywhere else |
|---|---|---|
| **Godot** | `tests/unit/`, `tests/integration/` | — |
| **Unity** | `Assets/Tests/EditMode/`, `Assets/Tests/PlayMode/` | not compiled: "0 tests, Passed" |
| **Unreal** | `Source/<Module>/Private/Tests/` | not built: "No automation tests matched" |

Read `tests/unit/[system]/` (or `integration/`) anywhere as the test root plus `[System]/`.
