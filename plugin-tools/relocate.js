// Rewrites the framework's project-relative paths (.claude/skills, .claude/scripts, ...)
// to this plugin's folder, and its "repo root = two folders up from the script" lookups
// to the project the session runs in. Project-only files keep their .claude/ paths.
//
//   node plugin-tools/relocate.js [repoDir] [--dry]
//
// The plugin root is <repo>/.claude (upstream's layout, so upstream merges stay clean);
// studio-tests stay at <repo>/studio-tests as upstream has them.
// Idempotent: a second run finds nothing to change.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const repoDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, '..'));
const ROOT = repoDir.replace(/\\/g, '/') + '/.claude';
const STUDIO = repoDir.replace(/\\/g, '/') + '/studio-tests';

// Under .claude/, these stay in the project (project-only).
const KEEP = /^\/(projecti-layout\.md|technical-preferences\.md|projecti-guard\.js)/;
const FW = '(scripts|docs|hooks|skills|agents)';
const PROJECT_ROOT_SH = '${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}';

function rewritePaths(text) {
  let n = 0;
  const swap = (m, sub, rest, offset, whole) => {
    const after = whole.slice(offset + m.length);
    if (KEEP.test(after)) return m;
    n++;
    return ROOT + '/' + sub;
  };
  // 1. Permission globs in skill frontmatter: Bash(bash "*/.claude/skills/x/../../scripts/...")
  text = text.replace(/\*\/\.claude\/(skills|scripts|hooks)\//g, (m, d) => { n++; return '*/' + d + '/'; });
  // 2. A variable, <root> or $(git rev-parse --show-toplevel) in front: $ROOT/.claude/agents
  text = text.replace(new RegExp('(?:\\$\\{?[A-Za-z_][A-Za-z0-9_]*\\}?|<root>|\\$\\(git rev-parse --show-toplevel\\))/\\.claude/' + FW + '(?![\\w-])', 'g'),
    (m, sub, offset, whole) => swap(m, sub, null, offset, whole));
  text = text.replace(/(?:\$\{?[A-Za-z_][A-Za-z0-9_]*\}?|<root>)\/\.claude\/ccgs\/studio-tests(?![\w-])/g, () => { n++; return STUDIO; });
  // 3. Bare .claude/<fw>, not after \ (regex), : (labels), / ~ . (other folders, ~/.claude)
  text = text.replace(new RegExp('(?<![\\\\\\w:/~.$-])\\.claude/' + FW + '(?![\\w-])', 'g'),
    (m, sub, offset, whole) => swap(m, sub, null, offset, whole));
  text = text.replace(/(?<![\\\w:/~.$-])\.claude\/ccgs\/studio-tests(?![\w-])/g, () => { n++; return STUDIO; });
  // 4. ./.claude/scripts/x.sh (permission patterns in skill frontmatter)
  text = text.replace(new RegExp('(?<![\\w.])\\./\\.claude/' + FW + '/', 'g'), (m, sub) => { n++; return ROOT + '/' + sub + '/'; });
  return [text, n];
}

function rewriteRootLookups(text) {
  let n = 0;
  const rules = [
    // ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
    [/"\$\(cd "\$\(dirname "\$0"\)\/\.\.\/\.\." && pwd\)"/g, '"' + PROJECT_ROOT_SH + '"'],
    // hooks, rule 4: "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)"
    [/"\$\(cd "\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)\/\.\.\/\.\." 2>\/dev\/null && pwd\)"/g, '"$(git rev-parse --show-toplevel 2>/dev/null || pwd)"'],
    // cd "$(dirname "$0")/../..", cd "$(dirname "${BASH_SOURCE[0]}")/../..", cd "$HERE/../.."
    [/cd "\$\(dirname "(?:\$0|\$\{BASH_SOURCE\[0\]\})"\)\/\.\.\/\.\."/g, 'cd "' + PROJECT_ROOT_SH + '"'],
    [/cd "\$HERE\/\.\.\/\.\."/g, 'cd "' + PROJECT_ROOT_SH + '"'],
  ];
  for (const [re, to] of rules) text = text.replace(re, () => { n++; return to; });
  // Python inside the helpers (agent-check, compat-inventory): the framework folders
  text = text.replace(/os\.path\.join\(root, "\.claude", "(agents|skills)"\)/g, (m, d) => { n++; return '"' + ROOT + '/' + d + '"'; });
  // agent-check's "sources" marker counts `dir/file` paths: let it see `C:/...` ones too.
  text = text.replace('re.compile(r"`[\\w.-]+/[\\w./*-]+`|', () => { n++; return 're.compile(r"`(?:[A-Za-z]:/)?[\\w.-]+/[\\w./*-]+`|'; });
  // relpath(plugin file, project root) raises when they sit on different drives (C: vs D:):
  // fall back to the absolute path.
  text = text.replace(/(?<!\()os\.path\.relpath\(([a-z_]+), root\)/g, (m, v) => { n++;
    return `(os.path.relpath(${v}, root) if os.path.splitdrive(os.path.abspath(${v}))[0].lower() == os.path.splitdrive(os.path.abspath(root))[0].lower() else os.path.abspath(${v}))`; });
  text = text.replace(/^claude = os\.path\.join\(root, "\.claude"\)/m, () => { n++; return 'claude = "' + ROOT + '"  # the framework lives in the ccgs plugin'; });
  return [text, n];
}

const TEXT = /\.(md|sh|js|json|ya?ml|awk|py|gd|txt|html|css|csv|toml)$/i;
let files = 0, total = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '.git') walk(p); continue; }
    if (!TEXT.test(e.name) || e.name === 'relocate.js') continue;
    const before = fs.readFileSync(p, 'utf8');
    let [text, a] = rewritePaths(before);
    let b = 0;
    if (/\.sh$/.test(e.name)) [text, b] = rewriteRootLookups(text);
    if (text !== before) {
      files++; total += a + b;
      if (!dry) fs.writeFileSync(p, text);
    }
  }
}
for (const d of ['skills', 'agents', 'scripts', 'docs', 'hooks']) walk(path.join(repoDir, '.claude', d));
walk(path.join(repoDir, 'studio-tests'));
console.log(`${dry ? '[dry] ' : ''}${files} files, ${total} rewrites, root ${ROOT}`);
