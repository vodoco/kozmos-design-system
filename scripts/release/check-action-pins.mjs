/**
 * Every action a workflow pins by SHA is pinned to a commit.
 *
 * `release.yml` pins each action by a 40-character SHA, so a moved tag cannot
 * change what publishes to npm. `workflow.test.mjs` holds the form
 * (`@[a-f0-9]{40}`), but it cannot tell a commit from an annotated tag's own
 * object. On 17 Oct 2026 `pnpm/action-setup@f40ffcd9…` turned out to be the
 * tag object of pnpm's `v4` tag, not a commit: it resolved only while `v4`
 * still pointed at that object, and pnpm moves its major tags. So this asks
 * GitHub, for each pinned SHA, for the commit it names, and fails on any SHA
 * that is not one (saying when it is a tag object, and which commit that tag
 * points at).
 *
 * It needs the network and a token (`GH_TOKEN` or `GITHUB_TOKEN`; CI passes
 * the job's own). It fails when it finds no pinned action, so a workflow that
 * moved cannot pass by checking nothing.
 *
 *   GH_TOKEN=… node scripts/release/check-action-pins.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKFLOWS = path.join(ROOT, ".github/workflows");
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

function fail(message) {
  console.error(`Action pin check failed: ${message}`);
  process.exit(1);
}

if (!token) fail("set GH_TOKEN or GITHUB_TOKEN to read commits from GitHub");

const pins = new Map();
for (const name of fs.readdirSync(WORKFLOWS).sort()) {
  if (!/\.ya?ml$/.test(name)) continue;
  const lines = fs.readFileSync(path.join(WORKFLOWS, name), "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const match of line.matchAll(
      /^\s*(?:-\s+)?uses:\s*([\w.-]+\/[\w.-]+)(?:\/[^@\s]*)?@([0-9a-f]{40})\b/g,
    )) {
      const key = `${match[1]}@${match[2]}`;
      if (!pins.has(key)) pins.set(key, []);
      pins.get(key).push(`${name}:${index + 1}`);
    }
  });
}
if (pins.size === 0) fail(`no action in ${WORKFLOWS} is pinned by SHA`);

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

const problems = [];
for (const [key, places] of pins) {
  const [repo, sha] = key.split("@");
  const commit = await api(`repos/${repo}/commits/${sha}`);
  if (commit.status === 200 && commit.body.sha === sha) continue;
  const tag = await api(`repos/${repo}/git/tags/${sha}`);
  const what =
    tag.status === 200
      ? `the annotated tag object of "${tag.body.tag}", which points at ${tag.body.object?.type} ${tag.body.object?.sha}: pin that commit`
      : `no commit (GitHub answered ${commit.status})`;
  problems.push(`${repo}@${sha} (${places.join(", ")}) is ${what}`);
}

if (problems.length) {
  fail(
    `${problems.length} of ${pins.size} pinned action(s) are not commits:\n  ${problems.join("\n  ")}`,
  );
}
console.log(
  `Action pins ok: ${pins.size} SHA-pinned action(s) in .github/workflows, each a commit`,
);
