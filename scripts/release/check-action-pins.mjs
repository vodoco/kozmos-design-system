/**
 * Every action a workflow runs is pinned to the commit of a named release.
 *
 * A tag such as `actions/checkout@v5` is whatever the action's owner points it
 * at next, so a moved tag changes what runs in a job that may hold a write
 * token. Every `uses:` in `.github/workflows/*.yml` and in a composite action
 * under `.github/actions/` must therefore name a 40-character commit SHA, with
 * a `# vX.Y.Z` comment naming the release that commit is (Dependabot keeps the
 * two together when it bumps one). Decided 24 Oct 2026 (Olcay): every
 * workflow, not only `release.yml`.
 *
 * The form alone cannot tell a commit from an annotated tag's own object. On
 * 17 Oct 2026 `release.yml`'s `pnpm/action-setup@f40ffcd9…` turned out to be
 * the tag object of pnpm's `v4` tag (#295): it resolved only while `v4` still
 * pointed at that object, and pnpm moves its major tags. So this also asks
 * GitHub, for each pinned SHA, for the commit it names, and for the commit the
 * commented release's tag points at, and fails unless the two are the pin.
 *
 * Not checked: `./` actions, which are code in this tree and reviewed with it,
 * and `docker://` images (none today), which name no GitHub commit.
 *
 * The form check needs nothing; the commit check needs the network and a token
 * (`GH_TOKEN` or `GITHUB_TOKEN`; CI passes the job's own). It fails when it
 * finds no pinned action, so a workflow that moved cannot pass by checking
 * nothing.
 *
 *   GH_TOKEN=… node scripts/release/check-action-pins.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";

/** `owner/repo[/path]@<commit>`: the only form a third-party `uses:` may take. */
const PINNED = /^([\w.-]+\/[\w.-]+)(\/[^@\s]+)?@([0-9a-f]{40})$/;
/** The release a pin's comment names: `v5.0.0`, or `12.6.2` where tags have no `v`. */
export const RELEASE = /^v?\d+\.\d+\.\d+$/;

/** The files GitHub reads `uses:` from, relative to `root`. */
export function actionFiles(root) {
  const files = [];
  const workflows = path.join(root, ".github/workflows");
  for (const name of fs.readdirSync(workflows).sort()) {
    if (/\.ya?ml$/.test(name)) files.push(`.github/workflows/${name}`);
  }
  const walk = (dir) => {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) return;
    for (const entry of fs
      .readdirSync(full, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/^action\.ya?ml$/.test(entry.name)) files.push(rel);
    }
  };
  walk(".github/actions");
  return files;
}

/**
 * Every `uses:` in one workflow or action file: a job's (a reusable workflow),
 * a job step's, or a composite action's step. `comment` is the text after `#`
 * on the same line, read from the source, so a comment on the next line never
 * counts as the release.
 */
export function findUses(text, file) {
  const lineCounter = new YAML.LineCounter();
  const doc = YAML.parseDocument(text, { lineCounter });
  if (doc.errors.length) {
    throw new Error(`${file}: not valid YAML: ${doc.errors[0].message}`);
  }
  const nodes = [];
  const stepsOf = (owner) => {
    const steps = owner?.get?.("steps", true);
    for (const step of steps?.items ?? []) {
      if (YAML.isMap(step) && step.has("uses"))
        nodes.push(step.get("uses", true));
    }
  };
  const jobs = doc.get("jobs", true);
  for (const job of jobs?.items ?? []) {
    if (!YAML.isMap(job.value)) continue;
    if (job.value.has("uses")) nodes.push(job.value.get("uses", true));
    stepsOf(job.value);
  }
  stepsOf(doc.get("runs", true));

  return nodes.map((node) => {
    const { line } = lineCounter.linePos(node.range[0]);
    // A plain or quoted string on one line; an alias or a block scalar could
    // carry its comment anywhere, so neither counts as a pin.
    if (
      !YAML.isScalar(node) ||
      typeof node.value !== "string" ||
      !["PLAIN", "QUOTE_DOUBLE", "QUOTE_SINGLE"].includes(node.type)
    ) {
      const value = YAML.isAlias(node) ? `*${node.source}` : String(node);
      return { file, line, value, comment: null, plain: false };
    }
    const rest = text.slice(node.range[1]).split("\n", 1)[0];
    const comment = rest.match(/^\s+#\s*(.*?)\s*$/)?.[1] ?? null;
    return { file, line, value: node.value, comment, plain: true };
  });
}

/**
 * Sorts each reference into a pin to verify, one not checked (`./`, `docker://`),
 * or a problem with what is wrong with it.
 */
export function classify(uses) {
  const pins = [];
  const skipped = [];
  const problems = [];
  for (const use of uses) {
    const where = `${use.file}:${use.line}`;
    if (!use.plain) {
      problems.push(
        `${where} ${use.value} is not a one-line string: write the pin and its "# vX.Y.Z" on the \`uses:\` line`,
      );
      continue;
    }
    if (use.value.startsWith("./") || use.value.startsWith("docker://")) {
      skipped.push(use);
      continue;
    }
    const match = use.value.match(PINNED);
    if (!match) {
      problems.push(
        `${where} ${use.value} is not pinned to a commit: name the 40-character SHA its release tag points at`,
      );
      continue;
    }
    // The release in the comment is its first word: "v5.0.0" in "# v5.0.0".
    const release = use.comment?.split(/\s+/, 1)[0] ?? "";
    if (!RELEASE.test(release)) {
      problems.push(
        `${where} ${use.value} has ${use.comment === null ? "no comment" : `the comment "# ${use.comment}"`}: follow the SHA with "# vX.Y.Z", the release it is`,
      );
      continue;
    }
    pins.push({ repo: match[1], sha: match[3], release, where });
  }
  return { pins, skipped, problems };
}

function fail(message) {
  console.error(`Action pin check failed: ${message}`);
  process.exit(1);
}

async function main() {
  const root = process.cwd();
  const files = actionFiles(root);
  const uses = files.flatMap((file) =>
    findUses(fs.readFileSync(path.join(root, file), "utf8"), file),
  );
  const { pins, skipped, problems } = classify(uses);
  if (problems.length) {
    fail(
      `${problems.length} of ${uses.length} action reference(s) in ${files.length} file(s) are not pinned to a release's commit:\n  ${problems.join("\n  ")}`,
    );
  }
  if (pins.length === 0) fail(`no action in ${files.join(", ")} is pinned`);

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) fail("set GH_TOKEN or GITHUB_TOKEN to read commits from GitHub");

  async function api(route) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetch(`https://api.github.com/${route}`, {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "x-github-api-version": "2022-11-28",
        },
      });
      if (response.status >= 500 && attempt < 3) continue;
      return { status: response.status, body: await response.json() };
    }
    throw new Error("unreachable");
  }

  /** The commit a release tag points at, through an annotated tag's object. */
  async function tagCommit(repo, release) {
    const ref = await api(`repos/${repo}/git/ref/tags/${release}`);
    if (ref.status !== 200 || !ref.body.object) return null;
    let { type, sha } = ref.body.object;
    for (let depth = 0; type === "tag" && depth < 5; depth += 1) {
      const tag = await api(`repos/${repo}/git/tags/${sha}`);
      if (tag.status !== 200) return null;
      ({ type, sha } = tag.body.object);
    }
    return type === "commit" ? sha : null;
  }

  const byPin = new Map();
  for (const pin of pins) {
    const key = `${pin.repo}@${pin.sha} # ${pin.release}`;
    if (!byPin.has(key)) byPin.set(key, { ...pin, places: [] });
    byPin.get(key).places.push(pin.where);
  }

  const wrong = [];
  for (const { repo, sha, release, places } of byPin.values()) {
    const at = `${repo}@${sha} (${places.join(", ")})`;
    const commit = await api(`repos/${repo}/commits/${sha}`);
    if (commit.status !== 200 || commit.body.sha !== sha) {
      const tag = await api(`repos/${repo}/git/tags/${sha}`);
      wrong.push(
        tag.status === 200
          ? `${at} is the annotated tag object of "${tag.body.tag}", which points at ${tag.body.object?.type} ${tag.body.object?.sha}: pin that commit`
          : `${at} is no commit (GitHub answered ${commit.status})`,
      );
      continue;
    }
    const tagged = await tagCommit(repo, release);
    if (tagged !== sha) {
      wrong.push(
        tagged
          ? `${at} says "# ${release}", but ${release} is commit ${tagged}`
          : `${at} says "# ${release}", and ${repo} has no tag ${release} on a commit`,
      );
    }
  }

  if (wrong.length) {
    fail(
      `${wrong.length} of ${byPin.size} pin(s) are not the commit of the release they name:\n  ${wrong.join("\n  ")}`,
    );
  }
  const names = files
    .map((file) => file.replace(".github/workflows/", ""))
    .join(", ");
  console.log(
    `Action pins ok: ${pins.length} action reference(s) in ${files.length} file(s) (${names}), ` +
      `${byPin.size} distinct pin(s), each the commit of the release its comment names` +
      (skipped.length
        ? `; ${skipped.length} local or docker:// reference(s) not checked`
        : ""),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
