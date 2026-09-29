// The Changes job decides whether a pull request builds iOS (Olcay's decision
// 24). "iOS Build" is a required check that a deliberate skip passes, so the
// skip must mean "these paths are known, and none is an iOS input" — never
// "the paths could not be worked out" (the read-only review's F1: a failed
// `git diff` piped into `grep -q` read as no changes, and the job succeeded).
//
// These tests run the workflow's own step, as GitHub runs it (`bash -e` over
// the step's script, with its env), in a scratch repository.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = fileURLToPath(new URL("../../", import.meta.url));
const workflow = YAML.parse(
  fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8"),
);
const step = workflow.jobs.changes.steps.find(
  (candidate) => candidate.name === "Paths Touched",
);
const SCRIPT = "scripts/ci/ios-changes.sh";

function scratch(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Where the workflow's checkout would have it: the step may run a file. */
function placeScript(dir) {
  const source = path.join(root, SCRIPT);
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.join(dir, path.dirname(SCRIPT)), { recursive: true });
  fs.copyFileSync(source, path.join(dir, SCRIPT));
}

/** The step's outputs, exit status and log, run in `cwd` against `base`. */
function runStep(t, cwd, base) {
  const dir = scratch(t, "kozmos-ios-step-");
  const output = path.join(dir, "github-output");
  const script = path.join(dir, "step.sh");
  fs.writeFileSync(output, "");
  fs.writeFileSync(script, step.run);
  const result = spawnSync("bash", ["-e", script], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, BASE: base, GITHUB_OUTPUT: output },
  });
  const outputs = Object.fromEntries(
    fs
      .readFileSync(output, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("=")),
  );
  return {
    status: result.status,
    log: result.stdout + result.stderr,
    stdout: result.stdout,
    outputs,
  };
}

/** A repository with one commit on main, the base every case diffs against. */
function repository(t) {
  const dir = scratch(t, "kozmos-ios-repo-");
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  fs.writeFileSync(path.join(dir, "README.md"), "base\n");
  git("add", "README.md");
  git("commit", "-q", "-m", "base");
  const base = git("rev-parse", "HEAD");
  placeScript(dir);
  /** A pull request branch from the base that changes `file`. */
  const change = (file) => {
    git("checkout", "-q", "-B", "change", base);
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), `changed ${file}\n`);
    git("add", file);
    git("commit", "-q", "-m", file);
  };
  return { dir, base, git, change };
}

// Every path the list names, and the travel-time table #155 added to it.
const IOS_INPUTS = [
  "packages/ios/Sources/Kozmos/Components/Chip.swift",
  "packages/ios/Package.swift",
  "packages/tokens/src/core/color.json",
  "packages/tokens/build.mjs",
  "packages/product-contracts/tests/travel-time-bands.txt",
  "scripts/check-ios-poi.mjs",
  "scripts/figma-connect-native.mjs",
  ".github/workflows/ci.yml",
  "package.json",
  "pnpm-lock.yaml",
];
const NOT_IOS_INPUTS = [
  "docs/release-process.md",
  "packages/react/src/components/Chip/Chip.tsx",
  "packages/product-contracts/src/travel-time.ts",
  "packages/product-contracts/tests/travel-time-bands.txt.orig",
  "packages/android/src/main/java/com/kozmos/Chip.kt",
  "apps/site/package.json",
  "scripts/check-ios-poi.test.mjs",
  ".github/workflows/site.yml",
];

test("a pull request that touches an iOS input builds iOS", (t) => {
  const { dir, base, change } = repository(t);
  for (const file of IOS_INPUTS) {
    change(file);
    const run = runStep(t, dir, base);
    assert.equal(run.status, 0, run.log);
    assert.deepEqual(run.outputs, { ios: "true" }, `${file}\n${run.log}`);
    assert.doesNotMatch(run.stdout, /::warning/, file);
  }
});

test("a pull request that touches no iOS input skips iOS, deliberately and quietly", (t) => {
  const { dir, base, change } = repository(t);
  for (const file of NOT_IOS_INPUTS) {
    change(file);
    const run = runStep(t, dir, base);
    assert.equal(run.status, 0, run.log);
    assert.deepEqual(run.outputs, { ios: "false" }, `${file}\n${run.log}`);
    assert.doesNotMatch(run.stdout, /::warning/, file);
  }
});

test("no base (a push to main) builds iOS", (t) => {
  const { dir, change } = repository(t);
  change("docs/release-process.md");
  const run = runStep(t, dir, "");
  assert.equal(run.status, 0, run.log);
  assert.deepEqual(run.outputs, { ios: "true" }, run.log);
});

test("a base git cannot diff against builds iOS, with a warning, never a skip", (t) => {
  const { dir, git, change } = repository(t);
  // A commit that shares no history with the branch: `base...HEAD` has no
  // merge base, as when a base was rewritten away.
  git("checkout", "-q", "--orphan", "elsewhere");
  git("commit", "-q", "--allow-empty", "-m", "unrelated");
  const unrelated = git("rev-parse", "HEAD");
  change("docs/release-process.md"); // a change that on its own would skip
  for (const [label, base] of [
    ["a commit this clone does not have", "0".repeat(40)],
    ["a malformed base", "not-a-commit"],
    ["a base with no history in common", unrelated],
  ]) {
    const run = runStep(t, dir, base);
    assert.equal(run.status, 0, `${label}\n${run.log}`);
    assert.deepEqual(run.outputs, { ios: "true" }, `${label}\n${run.log}`);
    assert.match(
      run.stdout,
      /^::warning title=iOS Build::.*builds rather than skips/m,
      `${label}\n${run.log}`,
    );
  }
});

test("git failing for any other reason builds iOS, with a warning", (t) => {
  // Not a repository at all: every git command fails.
  const dir = scratch(t, "kozmos-ios-no-repo-");
  placeScript(dir);
  const run = runStep(t, dir, "a".repeat(40));
  assert.equal(run.status, 0, run.log);
  assert.deepEqual(run.outputs, { ios: "true" }, run.log);
  assert.match(run.stdout, /^::warning title=iOS Build::/m, run.log);
});

test("the workflow runs the tested script, and iOS still builds if the Changes job fails", () => {
  // The step runs the file these tests exercise, so the logic cannot drift
  // back inline where nothing tests it.
  assert.equal(step.run.trim(), `bash ${SCRIPT}`);
  assert.equal(step.id, "diff");
  assert.deepEqual(step.env, {
    BASE: "${{ github.event.pull_request.base.sha }}",
  });
  // The names the required checks match on, and the wiring between the jobs.
  assert.equal(workflow.jobs.changes.name, "Changes");
  assert.equal(
    workflow.jobs.changes.outputs.ios,
    "${{ steps.diff.outputs.ios }}",
  );
  // A shallow clone has no base to diff against; the whole history is fetched.
  assert.equal(workflow.jobs.changes.steps[0].with["fetch-depth"], 0);
  const ios = workflow.jobs.ios;
  assert.equal(ios.name, "iOS Build");
  assert.equal(ios.needs, "changes");
  const condition = ios.if.replace(/\s+/g, " ");
  for (const clause of [
    "!cancelled()",
    "(github.event_name == 'push' && github.ref == 'refs/heads/main')",
    "needs.changes.result != 'success'",
    "needs.changes.outputs.ios == 'true'",
  ])
    assert.ok(
      condition.includes(clause),
      `iOS Build's condition lost ${clause}`,
    );
  // And CI runs these tests.
  assert.ok(
    workflow.jobs.web.steps.some(
      (candidate) => candidate.run === "pnpm test:ci",
    ),
    "the web job must run pnpm test:ci",
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(
    manifest.scripts["test:ci"],
    "node --test scripts/ci/*.test.mjs",
  );
});
