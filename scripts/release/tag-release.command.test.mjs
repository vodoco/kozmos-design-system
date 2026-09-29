// `pnpm release:tag <sha>` as a person runs it: the real command, against a
// scratch repository holding a release commit, a stand-in `gh` that answers
// from a table and records every call, and a stand-in npm registry. Nothing
// here reaches GitHub or npm.
//
// What it pins (the read-only review's L1 and L2):
// - the full `gh release create` arguments for each channel: only a stable
//   React release on `latest` is Latest, and a semver prerelease is a GitHub
//   prerelease;
// - every planned tag and release is checked against the commit before the
//   first release is made: a tag (lightweight or annotated) or a release at
//   another commit refuses the whole run, and a lookup that fails is never
//   read as "there is none".
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT = fileURLToPath(new URL("./tag-release.mjs", import.meta.url));
const REPOSITORY = "vodoco/kozmos-design-system";
const OTHER = "b".repeat(40);

function scratch(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const DIRS = {
  "@kozmos-ds/react": "packages/react",
  "@kozmos-ds/icons": "packages/icons",
};

/** A repository whose HEAD is a release commit for `plan`; returns its sha. */
function releaseCommit(t, plan) {
  const dir = scratch(t, "kozmos-tag-repo-");
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  write("release/plan.json", JSON.stringify({ schemaVersion: 1, ...plan }));
  for (const [name, dir_] of Object.entries(DIRS)) {
    const version =
      plan.packages.find((item) => item.name === name)?.version ?? "0.0.1";
    write(`${dir_}/package.json`, JSON.stringify({ name, version }));
    write(
      `${dir_}/CHANGELOG.md`,
      `# ${name}\n\n## ${version}\n\n### Minor Changes\n\n- 1234567: ${name} ${version}.\n`,
    );
  }
  git("add", "-A");
  git("commit", "-q", "-m", "release");
  return { dir, sha: git("rev-parse", "HEAD") };
}

// The stand-in gh: CommonJS, since it has no extension. It serves `gh api`
// (with and without --include, as the real one prints them), `gh release view`
// and `gh release create`, from the world file, and logs each call.
const FAKE_GH = String.raw`#!/usr/bin/env node
const fs = require("node:fs");
const world = JSON.parse(fs.readFileSync(process.env.KOZMOS_FAKE_GH_WORLD, "utf8"));
const argv = process.argv.slice(2);
const call = { argv };
const REPO = "repos/${REPOSITORY}/";
const decode = (value) => value.split("/").map(decodeURIComponent).join("/");
const REASONS = { 200: "OK", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 502: "Bad Gateway" };
const notFound = { status: 404, body: { message: "Not Found", status: "404" } };
const failure = (entry) =>
  entry && entry.network ? { network: true }
  : entry && entry.status ? { status: entry.status, body: { message: REASONS[entry.status] || "Error", status: String(entry.status) } }
  : null;
function releases() {
  return failure(world.releases) || { status: 200, body: world.releases };
}
function respond(route) {
  if (!route.startsWith(REPO)) return { status: 400, body: { message: "unexpected route " + route } };
  route = route.slice(REPO.length);
  let match;
  if ((match = route.match(/^actions\/workflows\/release\.yml\/runs\?head_sha=([0-9a-f]{40})&per_page=100$/)))
    return { status: 200, body: { total_count: world.runs.length, workflow_runs: world.runs } };
  if ((match = route.match(/^git\/ref\/tags\/(.+)$/))) {
    const tag = world.tags[decode(match[1])];
    if (!tag) return notFound;
    return failure(tag) || { status: 200, body: { ref: "refs/tags/" + decode(match[1]), object: tag.annotated ? { type: "tag", sha: tag.annotated } : { type: "commit", sha: tag.commit } } };
  }
  if ((match = route.match(/^git\/tags\/([0-9a-f]{40})$/))) {
    const tag = Object.values(world.tags).find((candidate) => candidate.annotated === match[1]);
    return tag ? { status: 200, body: { sha: match[1], object: { type: "commit", sha: tag.commit } } } : notFound;
  }
  if ((match = route.match(/^releases\?per_page=100&page=(\d+)$/))) {
    const all = releases();
    if (all.status !== 200) return all;
    return { status: 200, body: match[1] === "1" ? all.body : [] };
  }
  if ((match = route.match(/^releases\/tags\/(.+)$/))) {
    const all = releases();
    if (all.status !== 200) return all;
    const release = all.body.find((candidate) => candidate.tag_name === decode(match[1]) && !candidate.draft);
    return release ? { status: 200, body: release } : notFound;
  }
  return { status: 400, body: { message: "unexpected route " + route } };
}
function finish(code) {
  fs.appendFileSync(process.env.KOZMOS_FAKE_GH_LOG, JSON.stringify(call) + "\n");
  process.exit(code);
}
function network() {
  process.stderr.write("error connecting to api.github.com\ncheck your internet connection or https://githubstatus.com\n");
  finish(1);
}
if (argv[0] === "api") {
  const include = argv.includes("-i") || argv.includes("--include");
  const route = argv.filter((arg) => !arg.startsWith("-"))[1];
  const answer = respond(route);
  if (answer.network) network();
  const text = JSON.stringify(answer.body);
  if (include)
    process.stdout.write("HTTP/2.0 " + answer.status + " " + (REASONS[answer.status] || "Error") + "\nContent-Type: application/json; charset=utf-8\r\nX-Github-Request-Id: FAKE\r\n\r\n" + text);
  else process.stdout.write(text);
  if (answer.status >= 400) process.stderr.write("gh: " + answer.body.message + " (HTTP " + answer.status + ")\n");
  finish(answer.status >= 400 ? 1 : 0);
}
if (argv[0] === "release" && argv[1] === "view") {
  // gh finds drafts as well as published releases.
  const all = releases();
  if (all.network) network();
  if (all.status !== 200) {
    process.stderr.write("HTTP " + all.status + ": " + all.body.message + "\n");
    finish(1);
  }
  const release = all.body.find((candidate) => candidate.tag_name === argv[2]);
  if (!release) {
    process.stderr.write("release not found\n");
    finish(1);
  }
  process.stdout.write(JSON.stringify(release));
  finish(0);
}
if (argv[0] === "release" && argv[1] === "create") {
  call.notes = fs.readFileSync(argv[argv.indexOf("--notes-file") + 1], "utf8");
  process.stdout.write("https://github.com/${REPOSITORY}/releases/tag/" + encodeURIComponent(argv[2]) + "\n");
  finish(0);
}
process.stderr.write("fake gh: unexpected call " + argv.join(" ") + "\n");
finish(2);
`;

// The stand-in registry, loaded before the command with --import.
const FAKE_NPM = `
const docs = JSON.parse(process.env.KOZMOS_FAKE_NPM);
globalThis.fetch = async (url) => {
  const { host, pathname } = new URL(String(url));
  if (host !== "registry.npmjs.org") throw new Error("the tests reach no network: " + url);
  const doc = docs[decodeURIComponent(pathname.slice(1))];
  return new Response(JSON.stringify(doc ?? { error: "Not found" }), {
    status: doc ? 200 : 404,
    headers: { "content-type": "application/json" },
  });
};
`;

/**
 * Runs `pnpm release:tag` for a release of `plan`. `world(sha)` describes
 * GitHub: `tags` ({ commit } for a lightweight tag, { annotated, commit } for
 * an annotated one, { status } or { network } for a failed lookup) and
 * `releases` (a list, or { status } / { network }). By default a successful
 * Release run published the commit and npm has every planned version.
 */
function releaseTag(t, { plan, world = () => ({}), dryRun = false }) {
  const { dir, sha } = releaseCommit(t, plan);
  const tmp = scratch(t, "kozmos-tag-gh-");
  const bin = path.join(tmp, "bin");
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "gh"), FAKE_GH, { mode: 0o755 });
  const npm = path.join(tmp, "npm.mjs");
  fs.writeFileSync(npm, FAKE_NPM);
  const worldFile = path.join(tmp, "world.json");
  const log = path.join(tmp, "gh.log");
  fs.writeFileSync(
    worldFile,
    JSON.stringify({
      runs: [
        {
          id: 9,
          head_sha: sha,
          path: ".github/workflows/release.yml",
          conclusion: "success",
        },
      ],
      tags: {},
      releases: [],
      ...world(sha),
    }),
  );
  fs.writeFileSync(log, "");
  const docs = {};
  for (const { name, version } of plan.packages)
    docs[name] = { versions: { [version]: {} } };
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      pathToFileURL(npm).href,
      SCRIPT,
      sha,
      ...(dryRun ? ["--dry-run"] : []),
    ],
    {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        // Were the real gh ever reached, it could not act.
        GH_HOST: "fake.invalid",
        GH_TOKEN: "test-only-not-a-token",
        KOZMOS_FAKE_GH_WORLD: worldFile,
        KOZMOS_FAKE_GH_LOG: log,
        KOZMOS_FAKE_NPM: JSON.stringify(docs),
      },
    },
  );
  const calls = fs
    .readFileSync(log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const creates = calls.filter(
    (call) => call.argv[0] === "release" && call.argv[1] === "create",
  );
  return {
    sha,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    output: `${result.stdout}\n${result.stderr}`,
    calls,
    creates,
    // The notes file is a temporary path; its content is checked apart.
    commands: creates.map(({ argv }) =>
      argv.map((arg, index) =>
        argv[index - 1] === "--notes-file" ? "<notes>" : arg,
      ),
    ),
  };
}

const create = (tag, sha, ...flags) => [
  "release",
  "create",
  tag,
  "--repo",
  REPOSITORY,
  "--target",
  sha,
  "--title",
  tag,
  "--notes-file",
  "<notes>",
  ...flags,
];

// ---- L1: the channel reaches the GitHub Release ----

for (const [label, plan, expected] of [
  [
    "a stable release on latest: React is Latest, the others are not",
    {
      tag: "latest",
      packages: [
        { name: "@kozmos-ds/react", version: "0.6.0" },
        { name: "@kozmos-ds/icons", version: "0.5.0" },
      ],
    },
    (sha) => [
      create("@kozmos-ds/icons@0.5.0", sha, "--latest=false"),
      create("@kozmos-ds/react@0.6.0", sha, "--latest=true"),
    ],
  ],
  [
    "a prerelease on next is a GitHub prerelease, never Latest",
    {
      tag: "next",
      packages: [{ name: "@kozmos-ds/react", version: "0.6.0-beta.1" }],
    },
    (sha) => [
      create(
        "@kozmos-ds/react@0.6.0-beta.1",
        sha,
        "--latest=false",
        "--prerelease",
      ),
    ],
  ],
  [
    "a stable version on next is not Latest, and not a prerelease",
    {
      tag: "next",
      packages: [{ name: "@kozmos-ds/react", version: "0.6.0" }],
    },
    (sha) => [create("@kozmos-ds/react@0.6.0", sha, "--latest=false")],
  ],
  [
    "a package other than React is never Latest; its prerelease is a prerelease",
    {
      tag: "next",
      packages: [{ name: "@kozmos-ds/icons", version: "0.5.0-next.0" }],
    },
    (sha) => [
      create(
        "@kozmos-ds/icons@0.5.0-next.0",
        sha,
        "--latest=false",
        "--prerelease",
      ),
    ],
  ],
])
  test(`release:tag, ${label}`, (t) => {
    const run = releaseTag(t, { plan });
    assert.equal(run.status, 0, run.output);
    assert.deepEqual(run.commands, expected(run.sha), run.output);
    for (const { argv, notes } of run.creates)
      assert.match(notes, new RegExp(`${argv[2].split("@")[2]}\\.\\n`));
  });

// ---- L2: existing tags and releases are checked against the commit ----

const pair = {
  tag: "latest",
  packages: [
    { name: "@kozmos-ds/react", version: "0.6.0" },
    { name: "@kozmos-ds/icons", version: "0.5.0" },
  ],
};
const REACT = "@kozmos-ds/react@0.6.0";
const ICONS = "@kozmos-ds/icons@0.5.0";
const release = (tag, extra = {}) => ({
  tag_name: tag,
  draft: false,
  prerelease: false,
  html_url: `https://github.com/${REPOSITORY}/releases/tag/${tag}`,
  ...extra,
});

test("release:tag leaves a matching tag and release alone and makes the rest, on the tag that is there", (t) => {
  const run = releaseTag(t, {
    plan: pair,
    world: (sha) => ({
      tags: {
        [REACT]: { commit: sha }, // lightweight, with its release
        [ICONS]: { annotated: "a".repeat(40), commit: sha }, // annotated, no release yet
      },
      releases: [release(REACT)],
    }),
  });
  assert.equal(run.status, 0, run.output);
  assert.deepEqual(run.commands, [create(ICONS, run.sha, "--latest=false")]);
  assert.match(run.stdout, new RegExp(`exists +${REACT}`));
});

for (const [label, world, refusal] of [
  [
    "a lightweight tag at another commit",
    () => ({ tags: { [REACT]: { commit: OTHER } } }),
    new RegExp(`${REACT} is tagged at ${OTHER}`),
  ],
  [
    "an annotated tag at another commit",
    () => ({ tags: { [REACT]: { annotated: "c".repeat(40), commit: OTHER } } }),
    new RegExp(`${REACT} is tagged at ${OTHER}`),
  ],
  [
    "a release whose tag is at another commit",
    () => ({
      tags: { [REACT]: { commit: OTHER } },
      releases: [release(REACT)],
    }),
    new RegExp(`${REACT} is tagged at ${OTHER}`),
  ],
  [
    "a draft release, which has no tag to check",
    () => ({ releases: [release(REACT, { draft: true })] }),
    new RegExp(`${REACT} has a draft release`),
  ],
  [
    "a tag lookup GitHub refuses",
    () => ({ tags: { [REACT]: { status: 401 } } }),
    /HTTP 401/,
  ],
  [
    "a release list GitHub fails to give",
    () => ({ releases: { status: 502 } }),
    /HTTP 502/,
  ],
  [
    "a network failure",
    () => ({ tags: { [REACT]: { network: true } } }),
    /could not ask GitHub/,
  ],
])
  test(`release:tag refuses ${label}, before making any release`, (t) => {
    // The conflict is React's, whose release comes last: icons, first in
    // line and free of any conflict, must not be made either.
    const run = releaseTag(t, { plan: pair, world });
    assert.equal(run.status, 1, run.output);
    assert.match(run.stderr, refusal);
    assert.deepEqual(run.commands, [], "no release may be made");
    assert.doesNotMatch(run.output, /^created /m);
  });

test("release:tag --dry-run makes the same checks and creates nothing", (t) => {
  const clean = releaseTag(t, {
    plan: pair,
    dryRun: true,
    world: (sha) => ({
      tags: { [REACT]: { commit: sha }, [ICONS]: { commit: sha } },
      releases: [release(REACT), release(ICONS)],
    }),
  });
  assert.equal(clean.status, 0, clean.output);
  assert.deepEqual(clean.commands, []);
  assert.match(clean.stdout, new RegExp(`exists +${ICONS}`));
  assert.match(clean.stdout, new RegExp(`exists +${REACT}`));
  const conflict = releaseTag(t, {
    plan: pair,
    dryRun: true,
    world: () => ({ tags: { [ICONS]: { commit: OTHER } } }),
  });
  assert.equal(conflict.status, 1, conflict.output);
  assert.match(conflict.stderr, new RegExp(`${ICONS} is tagged at ${OTHER}`));
  assert.deepEqual(conflict.commands, []);
});
