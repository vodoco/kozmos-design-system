// ci-local runs CI's steps on this machine, and CI runs the changeset rule
// only on pull requests (ci.yml: `if: github.event_name == 'pull_request'`),
// so ci-local skipped it. A branch that shipped a change with no changeset
// passed here and failed on its pull request (the night audit's X1,
// 2026-09-29). A local run stands for a pull request into main, so the step
// runs, against origin/main.
//
// These tests run ci-local itself, in a scratch repository holding this
// checkout's workflow, ci-local and the changeset rule, with the packages'
// node_modules linked in.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const STEP = "Require A Changeset For Published Changes";
const FILES = [
  ".github/workflows/ci.yml",
  ".github/workflows/bundle-size.yml",
  "scripts/ci-local.mjs",
  "scripts/release/changeset-required.mjs",
];

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-ci-local-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * A repository whose main carries a published package, with origin/main
 * where the pull request's base would be, and a branch `change` off it.
 */
function repository(t) {
  const dir = scratch(t);
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  for (const file of FILES)
    write(file, fs.readFileSync(path.join(root, file), "utf8"));
  fs.symlinkSync(
    path.join(root, "node_modules"),
    path.join(dir, "node_modules"),
  );
  write(".gitignore", "node_modules\n");
  write(
    "packages/react/package.json",
    `${JSON.stringify({ name: "@kozmos-ds/react", version: "0.5.0" }, null, 2)}\n`,
  );
  write(
    "packages/react/src/components/Thing/Thing.tsx",
    "export const thing = 1;\n",
  );
  git("add", ".");
  git("commit", "-q", "-m", "base");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  git("checkout", "-q", "-b", "change");
  const commit = (file, text) => {
    write(file, text);
    git("add", file);
    git("commit", "-q", "-m", file);
  };
  return { dir, commit };
}

/** ci-local, run in `dir` with `args`, as a person runs it there. */
function ciLocal(dir, ...args) {
  const result = spawnSync(
    process.execPath,
    [path.join(dir, "scripts/ci-local.mjs"), ...args],
    {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, TMPDIR: dir, TMP: dir, TEMP: dir },
    },
  );
  return { status: result.status, log: `${result.stdout}${result.stderr}` };
}

for (const args of [
  ["--help"],
  ["--unknown"],
  ["--job"],
  ["--only", "--list"],
]) {
  test(`CLI ${args.join(" ")} never executes workflow steps`, (t) => {
    const { dir } = repository(t);
    fs.writeFileSync(
      path.join(dir, ".github/workflows/ci.yml"),
      JSON.stringify({
        jobs: {
          web: {
            steps: [
              { name: "Must not run", run: "touch unexpected-execution" },
            ],
          },
        },
      }),
    );
    const result = ciLocal(dir, ...args);
    assert.equal(
      fs.existsSync(path.join(dir, "unexpected-execution")),
      false,
      result.log,
    );
    assert.equal(result.status, args[0] === "--help" ? 0 : 2, result.log);
    assert.match(
      result.log,
      args[0] === "--help" ? /Usage:/ : /Unknown option|requires a value/,
    );
  });
}

for (const args of [
  ["--from", "abc"],
  ["--from", "-1"],
  ["--from", "1.5"],
  ["--from", "999"],
  ["--only", "missing-step"],
  ["--shard", "missing-shard"],
]) {
  test(`CLI rejects an invalid or empty selection: ${args.join(" ")}`, (t) => {
    const { dir } = repository(t);
    fs.writeFileSync(
      path.join(dir, ".github/workflows/ci.yml"),
      JSON.stringify({
        jobs: {
          web: {
            steps: [
              { name: "Must not run", run: "touch unexpected-execution" },
            ],
          },
        },
      }),
    );
    const result = ciLocal(dir, ...args);
    assert.equal(
      fs.existsSync(path.join(dir, "unexpected-execution")),
      false,
      result.log,
    );
    assert.equal(result.status, 2, result.log);
    assert.match(
      result.log,
      /nonnegative integer|No steps match|has no shard matrix/,
    );
  });
}

for (const fails of [false, true]) {
  test(`large step output preserves ${fails ? "a late failure" : "a successful exit"}`, (t) => {
    const { dir } = repository(t);
    const program = `const fs = require("node:fs"); fs.writeSync(1, "output line\\n".repeat(200000)); fs.writeSync(2, "error line\\n".repeat(200000)); fs.writeSync(2, "FINAL_DIAGNOSTIC\\n"); process.exit(${fails ? 7 : 0})`;
    fs.writeFileSync(
      path.join(dir, ".github/workflows/ci.yml"),
      JSON.stringify({
        jobs: {
          web: {
            steps: [{ name: "Large output", run: `node -e '${program}'` }],
          },
        },
      }),
    );
    const result = ciLocal(dir);
    assert.equal(result.status, fails ? 1 : 0, result.log);
    assert.match(
      result.log,
      fails ? /FAIL\s+Large output/ : /PASS\s+Large output/,
    );
    const logs = result.log.match(/Full step logs: (.+)/)?.[1];
    assert.ok(
      logs,
      "Retain full output for inspection without piping it into memory",
    );
    const captured = fs.readFileSync(path.join(logs, "1.log"), "utf8");
    assert.equal(
      captured,
      "output line\n".repeat(200000) +
        "error line\n".repeat(200000) +
        "FINAL_DIAGNOSTIC\n",
    );
    if (fails)
      assert.match(
        result.log,
        /FINAL_DIAGNOSTIC/,
        "Keep the actual late failure, not a buffer-limit truncation",
      );
  });
}

test("ci-local lists the changeset rule as a step it runs", (t) => {
  const { dir } = repository(t);
  const listed = ciLocal(dir, "--list", "--only", "Require A Changeset");
  assert.equal(listed.status, 0, listed.log);
  assert.match(
    listed.log,
    new RegExp(`RUN\\s+${STEP}`),
    `the changeset rule is not run here:\n${listed.log}`,
  );
});

test("the changeset rule fails a branch that ships a change with no changeset", (t) => {
  const { dir, commit } = repository(t);
  commit(
    "packages/react/src/components/Thing/Thing.tsx",
    "export const thing = 2;\n",
  );
  const run = ciLocal(dir, "--only", "Require A Changeset");
  assert.equal(
    run.status,
    1,
    `ci-local passed a change with no changeset:\n${run.log}`,
  );
  assert.match(run.log, new RegExp(`FAIL\\s+${STEP}`), run.log);
  assert.match(
    run.log,
    /@kozmos-ds\/react ships changes with no changeset naming it:\s+packages\/react\/src\/components\/Thing\/Thing\.tsx/,
    run.log,
  );
});

test("the changeset rule passes the same branch once a changeset names the package", (t) => {
  const { dir, commit } = repository(t);
  commit(
    "packages/react/src/components/Thing/Thing.tsx",
    "export const thing = 2;\n",
  );
  commit(
    ".changeset/thing.md",
    '---\n"@kozmos-ds/react": patch\n---\n\nThe thing is 2.\n',
  );
  const run = ciLocal(dir, "--only", "Require A Changeset");
  assert.equal(run.status, 0, run.log);
  assert.match(run.log, new RegExp(`PASS\\s+${STEP}`), run.log);
});

test("a step that reads what only a runner has is skipped, never run with the expression", (t) => {
  const { dir } = repository(t);
  const listed = ciLocal(dir, "--list", "--job", "changes");
  assert.equal(listed.status, 0, listed.log);
  assert.match(
    listed.log,
    /SKIP.*reads github\.event\.pull_request\.base\.sha, which only a runner has/,
    `the Changes job's diff would run with a literal \${{ }} for its base:\n${listed.log}`,
  );
});

test("ci-local can inspect the separate bundle workflow instead of silently omitting it", (t) => {
  const { dir } = repository(t);
  const listed = ciLocal(
    dir,
    "--list",
    "--workflow",
    "bundle-size.yml",
    "--job",
    "analyze-bundle",
  );
  assert.equal(listed.status, 0, listed.log);
  assert.match(listed.log, /RUN\s+Run Bundle Size Analyzer/);
});
