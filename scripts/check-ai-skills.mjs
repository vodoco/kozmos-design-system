/**
 * The AI-facing documentation, checked against the code it describes.
 *
 * `.ai-skills/` is twenty-nine documents written for an assistant rather than
 * for a person: it is what gets handed to Claude when someone asks it to
 * design or build with Kozmos. Nothing verified it. `check-package-scope.mjs`
 * explicitly EXCLUDES the directory, so even the rename sweeps left it alone,
 * and it had drifted to the point of teaching things that were never true:
 *
 *   - `api-changelog.md` and `migration-guide.md` document a migration from
 *     `variant="primary"` to `variant="solid"`. Button has neither value, and
 *     never has in this repository.
 *   - both cite codemods, `button-variant-rename` and `token-migration`, that
 *     do not exist.
 *   - `getting-started.md` lists `@kozmos-ds/vue` and `@kozmos-ds/react-native`
 *     as packages to install. There are four public packages and neither is
 *     one; vue is a private internal harness.
 *   - `storybook-guide.md` teaches `<Button variant="primary">` as the
 *     canonical example.
 *
 * Wrong documentation is worse here than missing documentation, because an
 * assistant reads it as fact and writes code from it that cannot compile.
 *
 * What is checked, and only what can be checked without guessing:
 *
 *   1. A package offered to install must be a PUBLIC package in this
 *      workspace, under @kozmos-ds: `@kozmos` is the scope before the
 *      rename.
 *   2. Code, against what the packages publish (scripts/skills/ai-snippets.mjs,
 *      from the facts in scripts/skills/ai-facts.mjs): every TypeScript and
 *      JavaScript block is parsed whole; its imports must name public
 *      packages and their real exports, and a Kozmos component in its JSX
 *      may take only props it has, and literal values only where its types
 *      take them. A block that is a whole module is compiled against the
 *      build; one that is not says so, with its reason, in a
 *      `// kozmos-skills: template — …` comment. Prose and other fences are
 *      read for the same imports and tags.
 *   3. (Was: `import { X } from "@kozmos-ds/react"` must name a real export,
 *      read one line at a time against the directory names. 2 does it.)
 *   4. Chromatic must not be named: it is not the visual review (decision 11).
 *   5. A `pnpm <name>` inside a fenced code block must be something pnpm can
 *      run where the block runs it: a root script, a workspace package's
 *      script reached with `--filter`, `--dir`, `-r` or a `cd`, a pnpm
 *      built-in, or a binary pnpm runs itself when no script has the name.
 *      Code in a sentence is left alone, because a sentence may name a
 *      command in order to say that there is no such command.
 *   6. A workflow must exist to be named: `.github/workflows/<file>`, a file
 *      listed under `workflows/` in a directory tree, `gh workflow <verb>
 *      <file>` — and one `gh workflow run` dispatches must accept a dispatch.
 *   7. Nothing may teach publishing outside release.yml.
 *   8. A secret, `secrets.<NAME>` or `gh secret set <NAME>`, must be one a
 *      workflow here reads.
 *
 * 5–8 exist because the CI and publishing guides drifted the same way the
 * component docs had: they described workflows that never existed here (a
 * Changesets bot, `publish.yml`, `codeql.yml`, `test.yml`…), secrets for
 * services never connected (Codecov, Slack), an npm token appended to
 * `~/.npmrc` for publishing from a laptop, and `pnpm` commands no
 * package.json has ever declared.
 *
 * Proposals — things designed but not built, such as an MCP server — live in
 * docs/proposals/, outside this knowledge base, each marked "Proposal: not
 * built". Nothing here is excused for describing something unbuilt.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readKozmosFacts, unknownFacts } from "./skills/ai-facts.mjs";
import { checkDocuments } from "./skills/ai-snippets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(root, ".ai-skills");

const problems = [];
const fail = (file, line, message) =>
  problems.push(`${path.basename(file)}:${line}  ${message}`);

/** Public packages in the workspace. A private one is not installable. */
const publicPackages = new Set();
/** Every workspace package (pnpm-workspace.yaml: packages/*, apps/*), for 5. */
const workspacePackages = [];
for (const dir of ["packages", "apps"]) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  for (const name of fs.readdirSync(base)) {
    const manifest = path.join(base, name, "package.json");
    if (!fs.existsSync(manifest)) continue;
    const json = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (json.name && !json.private) publicPackages.add(json.name);
    if (json.name)
      workspacePackages.push({
        name: json.name,
        dir: `${dir}/${name}`,
        scripts: new Set(Object.keys(json.scripts ?? {})),
      });
  }
}

// ------------------------------------------------------ 5. pnpm commands

const rootScripts = new Set(
  Object.keys(
    JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
      .scripts ?? {},
  ),
);

/**
 * pnpm 9's own commands — every `commandNames` entry it registers — and the
 * npm commands it hands straight to npm (`pnpm view`, `pnpm version`). `run`,
 * `test` and `start` are not here: each runs a script, which must exist.
 */
const PNPM_BUILTINS = new Set(
  (
    "add audit bin c cat-file cat-index completion config create dedupe " +
    "deploy dislink dlx doctor env exec fetch find-hash get help i import " +
    "init install install-test it la licenses link ll ln list ls m multi " +
    "outdated pack patch patch-commit patch-remove prune publish rb rebuild " +
    "recursive remove restart rm root server set setup store un uni " +
    "uninstall unlink up update upgrade why " +
    // passed through to npm
    "access adduser bugs deprecate dist-tag docs edit info login logout " +
    "owner ping pkg prefix profile repo s se search set-script show star " +
    "stars team token unpublish unstar v version view whoami xmas"
  ).split(" "),
);

/** pnpm's options that take the next word as their value. */
const PNPM_VALUE_OPTIONS = new Set([
  "--filter",
  "-F",
  "--filter-prod",
  "--dir",
  "-C",
  "--reporter",
  "--loglevel",
  "--workspace-concurrency",
  "--resume-from",
  "--test-pattern",
  "--changed-files-ignore-pattern",
]);

/**
 * The binaries `pnpm <name>` runs when no script has that name — `pnpm tsx
 * scripts/performance/bundle-analyzer.ts` is how bundle-size.yml starts. pnpm
 * does this only for that bare form: `pnpm run <name>` and a filtered run
 * answer "missing script" instead (measured with pnpm 9.0.0).
 */
const binariesOf = (dir) => {
  const bin = path.join(root, dir, "node_modules/.bin");
  return new Set(fs.existsSync(bin) ? fs.readdirSync(bin) : []);
};

/**
 * The words of each `pnpm` command on a line, up to the end of that shell
 * command: `&&`, `||`, `;`, `|`, a bracket or a closing quote. A quoted word
 * keeps what is inside its quotes, and a GitHub expression, `${{ … }}`,
 * becomes one word this check cannot read.
 */
function pnpmCommands(code) {
  const found = [];
  for (const m of code.matchAll(/(?<![\w./@$-])pnpm(?=[ \t])/g)) {
    const words = [];
    let rest = code.slice(m.index + 4).replace(/\$\{\{.*?\}\}/g, "${{}}");
    for (
      let w = rest.match(/^[ \t]+(?:'([^']*)'|"([^"]*)"|([^\s'";&|()`]+))/);
      w;
      w = rest.match(/^[ \t]+(?:'([^']*)'|"([^"]*)"|([^\s'";&|()`]+))/)
    ) {
      words.push(w[1] ?? w[2] ?? w[3]);
      rest = rest.slice(w[0].length);
    }
    found.push(words);
  }
  return found;
}

/**
 * What a pnpm command asks for: its filters, `--dir`, `-r`, `-w`, the command
 * and, when the command runs a script, the script's name. Options after the
 * script's name are the script's own (`pnpm lint --filter=…` hands the filter
 * to turbo), so only the ones before it are read.
 */
function parsePnpm(words) {
  const call = {
    filters: [],
    dir: null,
    recursive: false,
    workspaceRoot: false,
    command: null,
    script: null,
    explicitRun: false,
  };
  let i = 0;
  const options = () => {
    for (; i < words.length && /^-/.test(words[i]) && words[i] !== "--"; i++) {
      const eq = words[i].indexOf("=");
      const flag = eq === -1 ? words[i] : words[i].slice(0, eq);
      let value = eq === -1 ? null : words[i].slice(eq + 1);
      if (value === null && PNPM_VALUE_OPTIONS.has(flag)) value = words[++i];
      if (["--filter", "-F", "--filter-prod"].includes(flag))
        call.filters.push(value ?? "");
      else if (flag === "--dir" || flag === "-C") call.dir = value ?? "";
      else if (flag === "-r" || flag === "--recursive") call.recursive = true;
      else if (flag === "-w" || flag === "--workspace-root")
        call.workspaceRoot = true;
    }
  };
  // A checklist's `pnpm build, then…` ends the name at its punctuation.
  const word = (w) => w?.replace(/[.,]+$/, "") || null;
  options();
  call.command = word(words[i++]);
  if (call.command === "run" || call.command === "run-script") {
    options();
    call.script = word(words[i]);
    call.explicitRun = true;
  } else if (["test", "t", "tst"].includes(call.command)) call.script = "test";
  else if (call.command === "start") call.script = "start";
  else if (call.command && !PNPM_BUILTINS.has(call.command))
    call.script = call.command;
  return call;
}

const globToRegExp = (glob) =>
  new RegExp(
    "^" +
      glob
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "\0")
        .replace(/\*/g, "[^/]*")
        .replace(/\0/g, ".*") +
      "$",
  );

/**
 * The workspace packages one `--filter` selector names — by name, glob,
 * `./dir` or `{dir}`, with its `...` and `^` graph modifiers set aside — or
 * null when it cannot be known here: a git range, an expression, a variable.
 */
function selectedBy(selector) {
  let s = selector.trim();
  if (!s || /[$[<]/.test(s)) return null;
  s = s.replace(/^\.\.\.\^?/, "").replace(/\^?\.\.\.$/, "");
  const braced = s.match(/^\{(.+)\}$/);
  if (braced || s.startsWith(".")) {
    const dir = path.posix
      .normalize((braced ? braced[1] : s).replace(/^\.\//, ""))
      .replace(/\/$/, "");
    const re = globToRegExp(dir);
    return workspacePackages.filter((p) => re.test(p.dir));
  }
  const re = globToRegExp(s);
  const named = workspacePackages.filter((p) => re.test(p.name));
  if (named.length || s.includes("/")) return named;
  // pnpm reads a bare name as the scoped package it names: `--filter docs`
  // runs in @kozmos-ds/docs.
  return workspacePackages.filter((p) =>
    re.test(p.name.replace(/^@[^/]+\//, "")),
  );
}

/** The package whose directory holds `dir` ("" is the root), or null. */
const packageAt = (dir) =>
  workspacePackages
    .filter((p) => dir === p.dir || dir.startsWith(`${p.dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0] ?? null;

/**
 * Where `cd <to>` lands, or null when that is outside the repository or not
 * in it. A block that runs `cd packages/ios`, then `cd packages/android`
 * means each from the root, as a reader running one part of it would, so a
 * path that does not exist from where the block stands is tried from there.
 */
function cdInto(from, to) {
  if (from === null || !to || /^[~/$-]/.test(to)) return null;
  for (const base of [from, ""]) {
    const next = path.posix.normalize(path.posix.join(base || ".", to));
    if (next === ".." || next.startsWith("../")) continue;
    const rel = next === "." ? "" : next.replace(/\/$/, "");
    if (fs.existsSync(path.join(root, rel))) return rel;
  }
  return null;
}

/** Why a pnpm command cannot run from `cwd`, or null when it can (or when
 *  where it runs cannot be known here). */
function pnpmProblem(words, cwd) {
  const call = parsePnpm(words);
  const { script } = call;
  // `pnpm 9.x installed` in a checklist, a `<script>` placeholder: not names.
  if (!script || !/^[A-Za-z][\w:.-]*$/.test(script)) return null;
  const spelled = `pnpm ${words.join(" ")}`.replace(/\s+--(\s.*)?$/, "");
  const havers = workspacePackages
    .filter((p) => p.scripts.has(script))
    .map((p) => p.name);
  const hint = havers.length
    ? ` (${havers.join(", ")} ${havers.length > 1 ? "have" : "has"} it: pnpm --filter ${havers[0]} ${script})`
    : "";

  if (call.filters.length) {
    const include = call.filters.filter((f) => !f.startsWith("!"));
    const exclude = call.filters
      .filter((f) => f.startsWith("!"))
      .map((f) => selectedBy(f.slice(1)) ?? []);
    let chosen = include.length ? [] : [...workspacePackages];
    for (const f of include) {
      const hit = selectedBy(f);
      if (hit === null) return null;
      if (!hit.length)
        return `\`${spelled}\`: no workspace package matches --filter ${f}`;
      chosen.push(...hit);
    }
    chosen = chosen.filter((p) => !exclude.flat().includes(p));
    if (chosen.some((p) => p.scripts.has(script))) return null;
    return `\`${spelled}\`: no package that --filter selects has a "${script}" script${hint}`;
  }
  if (call.recursive)
    return havers.length
      ? null
      : `\`${spelled}\`: no workspace package has a "${script}" script`;

  let dir = call.workspaceRoot ? "" : cwd;
  if (call.dir !== null) dir = cdInto(dir, call.dir);
  if (dir === null) return null;
  const pkg = packageAt(dir);
  if ((pkg ? pkg.scripts : rootScripts).has(script)) return null;
  if (
    !call.explicitRun &&
    (binariesOf("").has(script) || (pkg && binariesOf(pkg.dir).has(script)))
  )
    return null;
  const where = pkg ? `of ${pkg.name}` : "at the root";
  return call.explicitRun
    ? `\`${spelled}\`: "${script}" is not a script ${where}, and \`pnpm run\` runs only scripts${hint}`
    : `\`${spelled}\`: "${script}" is not a script ${where}, a pnpm command or a binary pnpm runs${hint}`;
}

// --------------------------------------------------------- 6. workflows

/**
 * The workflows that exist, and whether each takes `workflow_dispatch`.
 * Only this repository's own workflow paths are checked: other `.github/`
 * paths in these documents can be a consumer's (`.github/copilot-instructions
 * .md` in ai-integration-guide.md is a file its setup script writes into the
 * reader's project), so they are left to review.
 */
const WORKFLOWS = path.join(root, ".github/workflows");
const workflowText = new Map(
  (fs.existsSync(WORKFLOWS) ? fs.readdirSync(WORKFLOWS) : [])
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => [f, fs.readFileSync(path.join(WORKFLOWS, f), "utf8")]),
);
const workflows = new Map(
  [...workflowText].map(([f, text]) => [
    f,
    /^\s*workflow_dispatch\s*:/m.test(text),
  ]),
);
const workflowList = [...workflows.keys()].join(", ");

/**
 * The secrets a workflow here reads (8), and GITHUB_TOKEN, which every run
 * is given. A step handed `secrets.CODECOV_TOKEN` or `secrets.SLACK_WEBHOOK_URL`
 * describes a service this repository never connected.
 */
const workflowSecrets = new Set(["GITHUB_TOKEN"]);
for (const text of workflowText.values())
  for (const m of text.matchAll(/\bsecrets\.(\w+)/g)) workflowSecrets.add(m[1]);

/** A directory-tree line's depth (where its name starts) and its name. */
function treeEntry(line) {
  const m = line.match(/^([\s│├└─|`'+\\-]*)([^\s#]+)/);
  return m ? { depth: m[1].length, name: m[2] } : null;
}

// ---------------------------------------------------------- 7. publishing

/**
 * Publishing happens in one place: `release.yml`, dispatched from main and
 * approved on the `npm-release` environment, the only place NPM_TOKEN exists
 * (docs/release-process.md). `pnpm release` exits with instructions. These
 * patterns, checked on every line, prose included, are the ones that can only
 * teach the other way — a local or bot-driven publish, or the credential that
 * would allow one:
 *
 *   - `changeset publish` and `changesets/action`: Changesets only versions
 *     here; there is no bot.
 *   - `pnpm publish` / `yarn publish`: nothing here publishes with them.
 *   - `_authToken`, `NPM_TOKEN=`: an npm token in an `.npmrc`, a `.env` or a
 *     shell.
 *   - `gh secret set NPM_TOKEN` without `--env`: a repository secret, which
 *     `pnpm release:credential:check` refuses.
 *
 * Deliberately not matched, because a true description of release.yml can
 * contain them: `npm publish` (its publish step runs it on each tarball) and
 * `secrets.NPM_TOKEN` (the same step reads it). A document that must warn
 * against one of the matched forms can do it in words; the literal command
 * is what an assistant copies.
 */
const PUBLISHING = [
  [/\bchangeset\s+publish\b/, "`changeset publish`"],
  [/\bchangesets\/action\b/, "the Changesets bot (`changesets/action`)"],
  [/\byarn\s+(?:npm\s+)?publish\b/, "`yarn publish`"],
  [/_authToken\b/, "an npm token in an .npmrc (`_authToken`)"],
  [/(?:^|[\s"'`;(])(?:export\s+)?NPM_TOKEN=/, "NPM_TOKEN in a .env or shell"],
  [
    /\bgh\s+secret\s+set\s+NPM_TOKEN\b(?!.*\s(?:--env|-e)[\s=])/,
    "NPM_TOKEN as a repository secret",
  ],
];

const files = fs.existsSync(SKILLS)
  ? fs.readdirSync(SKILLS).filter((f) => f.endsWith(".md"))
  : [];

for (const file of files) {
  const full = path.join(SKILLS, file);
  const text = fs.readFileSync(full, "utf8");
  const lines = text.split("\n");
  // Fenced code, tracked the CommonMark way: a fence closes only on the same
  // character, at least as long, with nothing after it, so a ````mdx block
  // holding a ```bash example is one block, as GitHub renders it.
  let fence = null;
  let cwd = ""; // where the block's shell stands, relative to the root (5)
  let github = null; // the depth of a `.github/` tree entry (6)
  let workflowsAt = null; // and of the `workflows/` entry under it
  lines.forEach((line, index) => {
    const at = index + 1;

    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    const opens =
      marker && !fence && !(marker[1][0] === "`" && marker[2].includes("`"));
    const closes =
      marker &&
      fence &&
      marker[1][0] === fence.char &&
      marker[1].length >= fence.length &&
      !marker[2].trim();
    if (opens) {
      fence = { char: marker[1][0], length: marker[1].length };
      cwd = "";
      github = workflowsAt = null;
    } else if (closes) fence = null;
    const code = fence && !opens ? line : null;

    // Chromatic is not the visual review (Olcay's decision 11, #115): the
    // repository draws and compares every story itself. Ten documents still
    // sent an assistant to a service, a secret and a workflow this project
    // had left, and one told it to loosen the threshold to fix a flaky diff.
    if (/chromatic/i.test(line))
      fail(
        full,
        at,
        'names Chromatic; the visual review is tests/visual and the "Visual Review" check (docs/visual-review.md)',
      );

    // 1. A package offered to INSTALL must be a public one. Prose that
    // mentions a package in order to say it is private — which the generated
    // inventory does — is not a defect, and flagging it made the gate fail on
    // its own generated output. Imports and requires are 2's.
    const installing =
      /\b(npm|pnpm|yarn|bun)\s+(i|add|install)\b/.test(line) ||
      /^\s*["']@kozmos(?:-ds)?\/[a-z0-9-]+["']\s*:/.test(line) ||
      /^\s*@kozmos(?:-ds)?\/[a-z0-9-]+\s+-/.test(line);
    if (installing)
      for (const m of line.matchAll(/@(kozmos(?:-ds)?)\/([a-z0-9-]+)/g)) {
        const name = `@${m[1]}/${m[2]}`;
        if (m[1] === "kozmos")
          fail(
            full,
            at,
            `offers ${name} to install; @kozmos is the scope before the rename, and the packages are ${[...publicPackages].join(", ")}`,
          );
        else if (!publicPackages.has(name))
          fail(
            full,
            at,
            `offers ${name} to install; it is not a public package here`,
          );
      }

    if (code !== null) {
      // 5. Every pnpm command in code must be one pnpm can run. Comments are
      // not commands, and a YAML step starts again at the root: each `run:`
      // is a shell of its own.
      if (/^\s*(?:-\s+)?(?:name|run|uses):/.test(code)) cwd = "";
      const shell = code
        .replace(/(^|\s)(?:#|\/\/).*$/, "$1")
        .replace(/\$\{\{.*?\}\}/g, "${{}}");
      for (const part of shell.split(/&&|\|\||;/)) {
        const cd = part.match(/(?:^|[\s:])cd\s+([^\s;&|)]+)/);
        if (cd) cwd = cdInto(cwd, cd[1]);
        for (const words of pnpmCommands(part)) {
          const problem = pnpmProblem(words, cwd);
          if (problem) fail(full, at, `runs ${problem}`);
        }
      }

      // 6, as a directory tree: the files listed under .github/workflows/.
      const entry = treeEntry(code);
      if (entry) {
        if (workflowsAt !== null && entry.depth <= workflowsAt)
          workflowsAt = null;
        if (github !== null && entry.depth <= github) github = null;
        if (/^\.github\/workflows\/?$/.test(entry.name))
          workflowsAt = entry.depth;
        else if (/^\.github\/?$/.test(entry.name)) github = entry.depth;
        else if (entry.name === "workflows/" && github !== null)
          workflowsAt = entry.depth;
        else if (
          workflowsAt !== null &&
          /\.ya?ml$/.test(entry.name) &&
          !workflows.has(entry.name)
        )
          fail(
            full,
            at,
            `lists .github/workflows/${entry.name}; there is no such workflow`,
          );
      }
    }

    // 6. A workflow named by its path, or handed to `gh workflow`, must exist,
    // and one this tells a reader to dispatch must take a dispatch.
    for (const m of line.matchAll(/\.github\/workflows\/([\w.-]+\.ya?ml)\b/g))
      if (!workflows.has(m[1]))
        fail(
          full,
          at,
          `names .github/workflows/${m[1]}; there is no such workflow`,
        );
    for (const m of line.matchAll(
      /\bgh\s+workflow\s+(run|view|enable|disable)\s+["']?([\w.-]+\.ya?ml)\b/g,
    )) {
      if (!workflows.has(m[2]))
        fail(
          full,
          at,
          `gh workflow ${m[1]} ${m[2]}: there is no such workflow`,
        );
      else if (m[1] === "run" && !workflows.get(m[2]))
        fail(
          full,
          at,
          `gh workflow run ${m[2]}: it has no workflow_dispatch trigger, so it cannot be dispatched`,
        );
    }

    // 7. Publishing is release.yml's alone.
    const publishing = PUBLISHING.filter(([pattern]) => pattern.test(line)).map(
      ([, what]) => what,
    );
    if (pnpmCommands(line).some((w) => parsePnpm(w).command === "publish"))
      publishing.push("`pnpm publish`");
    for (const what of publishing)
      fail(
        full,
        at,
        `teaches ${what}; only release.yml publishes, dispatched from main and approved on npm-release (docs/release-process.md)`,
      );

    // 8. A secret must be one a workflow here reads.
    for (const m of line.matchAll(
      /\bsecrets\.(\w+)|\bgh\s+secret\s+set\s+["']?(\w+)/g,
    ))
      if (!workflowSecrets.has(m[1] ?? m[2]))
        fail(
          full,
          at,
          `names the secret ${m[1] ?? m[2]}; no workflow here reads it (they read ${[...workflowSecrets].join(", ")})`,
        );
  });
}

// 2. The code, whole: every document at once, so its complete blocks compile
// in one program.
const facts = readKozmosFacts(root);
const docs = files.map((file) => ({
  file,
  text: fs.readFileSync(path.join(SKILLS, file), "utf8"),
}));
const snippets = checkDocuments(root, docs, facts);
// A fact the checker could not establish is written into the inventory as
// unknown; it is not left there.
for (const unknown of unknownFacts(facts))
  problems.push(
    `facts  ${unknown}: the types do not say, so neither can the docs`,
  );
for (const p of snippets) fail(p.file, p.line, p.message);

if (problems.length) {
  console.error(
    `The AI-facing docs describe code that does not exist: ${problems.length} problem(s)\n`,
  );
  for (const p of problems) console.error("  " + p);
  console.error(
    "\nThese files are what an assistant is given as fact about Kozmos." +
      "\nFix the document, or the code if the document is right." +
      `\nThe workflows that exist: ${workflowList}.`,
  );
  process.exit(1);
}

const { stats } = snippets;
const exportCount = [...facts.packages.values()].reduce(
  (sum, p) => sum + (p.exports?.size ?? 0),
  0,
);
console.log(
  `AI-facing docs ok: ${files.length} file(s) checked against ` +
    `${publicPackages.size} public packages and their ${exportCount} exports, ` +
    `the props of ${facts.components.size} components read from the types, ` +
    `${rootScripts.size} root scripts, ` +
    `${workspacePackages.length} workspace packages' scripts and ` +
    `${workflows.size} workflows. Code: ${stats.blocks} TypeScript and ` +
    `JavaScript blocks, ${stats.compiled} compiled against the build, ` +
    `${stats.parsed} parsed, ${stats.templates} templates and ` +
    `${stats.counterexamples} counterexamples checked by name.`,
);
