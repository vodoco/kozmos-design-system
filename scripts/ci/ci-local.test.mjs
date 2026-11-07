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
import { fileURLToPath, pathToFileURL } from "node:url";

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

// A step's `if` is decided at the step's turn, from the steps before it, as a
// runner decides it. ci-local used to decide every condition before the run
// and knew only `github.X == 'y'` and always(), so a step that runs once the
// build has passed (#488's `!cancelled() && steps.build-vue.outcome ==
// 'success'`) or once something has failed (`failure()`) was always skipped
// here, and never verified before its pull request.

/**
 * ci-local's condition evaluator, asked in a child process in a scratch
 * repository. Importing ci-local must run nothing: if it ever ran its CLI on
 * import, the workflow there has one step, and the step leaves a file behind.
 */
function decides(t, rows) {
  const { dir } = repository(t);
  fs.writeFileSync(
    path.join(dir, ".github/workflows/ci.yml"),
    JSON.stringify({
      jobs: {
        web: {
          steps: [{ name: "Must not run", run: "touch unexpected-execution" }],
        },
      },
    }),
  );
  const program = `
    const { evaluateCondition } = await import(${JSON.stringify(pathToFileURL(path.join(dir, "scripts/ci-local.mjs")).href)});
    const rows = JSON.parse(process.env.CONDITION_ROWS);
    console.log(JSON.stringify(rows.map(([condition, context]) => evaluateCondition(condition, context))));
  `;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", program],
    {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        CONDITION_ROWS: JSON.stringify(rows),
        TMPDIR: dir,
        TMP: dir,
        TEMP: dir,
      },
    },
  );
  const log = `${result.stdout}${result.stderr}`;
  assert.equal(
    fs.existsSync(path.join(dir, "unexpected-execution")),
    false,
    `importing ci-local ran a workflow step:\n${log}`,
  );
  assert.equal(result.status, 0, log);
  const decided = JSON.parse(result.stdout.trim().split("\n").at(-1));
  assert.deepEqual(
    rows.map(([condition], index) => [condition, decided[index]]),
    rows.map(([condition, , expected]) => [condition, expected]),
  );
}

const local = { github: { event_name: "pull_request", base_ref: "main" } };
const after = (steps, failed = false) => ({ ...local, steps, failed });
const PASSED = { outcome: "success", conclusion: "success" };
const FAILED = { outcome: "failure", conclusion: "failure" };
const SKIPPED = { outcome: "skipped", conclusion: "skipped" };
const TOLERATED = { outcome: "failure", conclusion: "success" };

test("the condition evaluator reads literals, ==, !=, !, && and || with GitHub's precedence and parentheses", (t) => {
  decides(t, [
    ["github.event_name == 'pull_request'", local, true],
    ["${{ github.event_name == 'pull_request' }}", local, true],
    ["github.event_name != 'pull_request'", local, false],
    ["github.base_ref == 'main'", local, true],
    // GitHub ignores case between strings, and compares other mixed types as
    // numbers.
    ["github.event_name == 'PULL_REQUEST'", local, true],
    ["'it''s' == 'IT''S'", local, true],
    ["'1' == 1", local, true],
    ["true == 1", local, true],
    ["null == 0", local, true],
    ["'' == 0", local, true],
    ["'abc' == 0", local, false],
    ["1 == 1.0", local, true],
    ["0x10 == 16", local, true],
    ["2.5e1 == 25", local, true],
    ["-1 != 1", local, true],
    ["!true", local, false],
    ["!''", local, true],
    ["!0", local, true],
    ["!null", local, true],
    ["!!'text'", local, true],
    ["true && false", local, false],
    ["true || false", local, true],
    // `&&` and `||` give back the operand that decided them.
    ["('' || 'x') == 'x'", local, true],
    ["(0 && 'x') == 0", local, true],
    // && binds tighter than ||, == tighter than &&, ! tighter than ==.
    ["true || false && false", local, true],
    ["(true || false) && false", local, false],
    ["'a' == 'a' && 'b'", local, true],
    ["!false && false", local, false],
    ["!(false && false)", local, true],
    ["!2 == true", local, false],
  ]);
});

test("the condition evaluator reads the status functions from the steps before", (t) => {
  decides(t, [
    ["always()", local, true],
    ["cancelled()", local, false],
    ["!cancelled()", local, true],
    ["success()", after({}, false), true],
    ["success()", after({}, true), false],
    ["failure()", after({}, false), false],
    ["failure()", after({}, true), true],
    ["${{ failure() }}", after({}, true), true],
    ["always() || failure()", after({}, false), true],
    // Without the run's state, what reads it is undecided.
    ["success()", local, null],
    ["failure()", after({}, null), null],
  ]);
});

test("the condition evaluator reads steps.<id>.outcome and .conclusion after a success, a failure and a skip", (t) => {
  const gate = "${{ !cancelled() && steps.build-vue.outcome == 'success' }}";
  decides(t, [
    ["steps.b.outcome == 'success'", after({ b: PASSED }), true],
    ["steps.b.outcome == 'success'", after({ b: FAILED }), false],
    ["steps.b.outcome == 'failure'", after({ b: FAILED }), true],
    ["steps.b.conclusion == 'failure'", after({ b: FAILED }), true],
    ["steps.b.outcome == 'skipped'", after({ b: SKIPPED }), true],
    ["steps.b.outcome == 'success'", after({ b: SKIPPED }), false],
    // continue-on-error: the outcome is a failure, the conclusion a success.
    ["steps.b.outcome == 'failure'", after({ b: TOLERATED }), true],
    ["steps.b.conclusion == 'success'", after({ b: TOLERATED }), true],
    // #488's gate, after an unrelated failure.
    [gate, after({ "build-vue": PASSED }, true), true],
    [gate, after({ "build-vue": FAILED }, true), false],
    // A step the job does not have, or that has not run yet, is null on a
    // runner, and so here.
    ["steps.nope.outcome == 'success'", after({ b: PASSED }), false],
    ["steps.nope.outcome != 'success'", after({ b: PASSED }), true],
    ["steps.nope.outcome == null", after({ b: PASSED }), true],
    // A step this run did not see is not known, nor is any step without the
    // run's state.
    ["steps.b.outcome == 'success'", after({ b: null }), null],
    ["steps.b.outcome == 'success'", local, null],
  ]);
});

test("the condition evaluator leaves undecided what only a runner can decide, and never guesses", (t) => {
  decides(t, [
    ["contains(github.ref, 'main')", local, null],
    ["startsWith(github.head_ref, 'fix/')", local, null],
    ["env.CI == 'true'", local, null],
    ["matrix.shard.name == 'one'", local, null],
    ["needs.changes.result == 'success'", local, null],
    ["inputs.record", local, null],
    ["vars.FIGMA_VARIABLES_API_ENABLED == 'true'", local, null],
    ["runner.os == 'Linux'", local, null],
    ["github.ref == 'refs/heads/main'", local, null],
    ["steps.b.outputs.ios == 'true'", after({ b: PASSED }), null],
    // Today's shortcut ran anything that mentioned always().
    ["always() && contains(github.ref, 'main')", local, null],
    ["github.event_name < 'z'", local, null],
    ["github['event_name'] == 'pull_request'", local, null],
    ['"pull_request" == github.event_name', local, null],
    ["${{ github.event_name }} == 'pull_request'", local, null],
    ["(github.event_name == 'pull_request'", local, null],
    ["github.event_name ==", local, null],
  ]);
});

/** A scratch repository whose ci.yml is `jobs`. */
function withJobs(t, jobs) {
  const { dir } = repository(t);
  fs.writeFileSync(
    path.join(dir, ".github/workflows/ci.yml"),
    JSON.stringify({ jobs }),
  );
  return dir;
}

const AFTER_THE_BUILD = "${{ !cancelled() && steps.b.outcome == 'success' }}";

test("a step that runs when !cancelled() && steps.b.outcome == 'success' runs when b passed, even after an unrelated failure", (t) => {
  const dir = withJobs(t, {
    web: {
      steps: [
        { name: "Unrelated", run: "false" },
        { name: "Build", id: "b", run: "true" },
        {
          name: "After The Build",
          if: AFTER_THE_BUILD,
          run: "touch after-the-build",
        },
        { name: "Unconditioned", run: "touch unconditioned" },
      ],
    },
  });
  const run = ciLocal(dir);
  assert.equal(run.status, 1, run.log);
  assert.match(run.log, /FAIL\s+Unrelated/, run.log);
  assert.match(run.log, /PASS\s+After The Build/, run.log);
  assert.ok(fs.existsSync(path.join(dir, "after-the-build")), run.log);
  // A step with no if still runs after a failure: one local run shows every
  // failure.
  assert.match(run.log, /PASS\s+Unconditioned/, run.log);
});

test("a step that runs when !cancelled() && steps.b.outcome == 'success' is skipped when b failed", (t) => {
  const dir = withJobs(t, {
    web: {
      steps: [
        { name: "Build", id: "b", run: "false" },
        {
          name: "After The Build",
          if: AFTER_THE_BUILD,
          run: "touch after-the-build",
        },
      ],
    },
  });
  const run = ciLocal(dir);
  assert.equal(run.status, 1, run.log);
  assert.ok(
    run.log.includes(
      `SKIP  After The Build  — runs only when ${AFTER_THE_BUILD}, which is false here: steps.b.outcome is failure`,
    ),
    run.log,
  );
  assert.equal(fs.existsSync(path.join(dir, "after-the-build")), false);
});

test("success() and failure() read the steps before, and each shard is a job run of its own", (t) => {
  const dir = withJobs(t, {
    web: {
      strategy: { matrix: { shard: [{ name: "first" }, { name: "second" }] } },
      steps: [
        {
          name: "Fails In The First Shard",
          run: 'test "${{ matrix.shard.name }}" != first',
        },
        {
          name: "On Success",
          if: "success()",
          run: 'touch "success-${{ matrix.shard.name }}"',
        },
        {
          name: "On Failure",
          if: "${{ failure() }}",
          run: 'touch "failure-${{ matrix.shard.name }}"',
        },
      ],
    },
  });
  const run = ciLocal(dir);
  const ran = [
    "success-first",
    "failure-first",
    "success-second",
    "failure-second",
  ].filter((file) => fs.existsSync(path.join(dir, file)));
  assert.deepEqual(ran, ["failure-first", "success-second"], run.log);
});

test("a failure under continue-on-error concludes as a success, and fails nothing after it", (t) => {
  const dir = withJobs(t, {
    web: {
      steps: [
        {
          name: "Tolerated",
          id: "lint",
          "continue-on-error": true,
          run: "false",
        },
        {
          name: "After It",
          if: "success() && steps.lint.outcome == 'failure' && steps.lint.conclusion == 'success'",
          run: "touch after-it",
        },
      ],
    },
  });
  const run = ciLocal(dir);
  assert.match(run.log, /FAIL\s+Tolerated/, run.log);
  assert.match(run.log, /PASS\s+After It/, run.log);
  assert.ok(fs.existsSync(path.join(dir, "after-it")), run.log);
});

for (const args of [
  ["--only", "After The Build"],
  ["--from", "2"],
]) {
  test(`a condition on a step that ${args.join(" ")} leaves out is skipped as undecided, never guessed`, (t) => {
    const dir = withJobs(t, {
      web: {
        steps: [
          { name: "Build", id: "b", run: "true" },
          {
            name: "After The Build",
            if: AFTER_THE_BUILD,
            run: "touch after-the-build",
          },
        ],
      },
    });
    const run = ciLocal(dir, ...args);
    assert.equal(run.status, 0, run.log);
    assert.ok(
      run.log.includes(
        `SKIP  After The Build  — runs only when ${AFTER_THE_BUILD}, which this run cannot decide: steps.b did not run here`,
      ),
      run.log,
    );
    assert.equal(fs.existsSync(path.join(dir, "after-the-build")), false);
  });
}

test("--list shows a condition the run decides as decided as the job runs, not as skipped", (t) => {
  const dir = withJobs(t, {
    web: {
      steps: [
        { name: "Plain", run: "touch ran" },
        {
          name: "On Pull Requests",
          if: "github.event_name == 'pull_request'",
          run: "touch ran",
        },
        {
          name: "On Pushes",
          if: "github.event_name == 'push'",
          run: "touch ran",
        },
        { name: "On Linux", if: "runner.os == 'Linux'", run: "touch ran" },
        { name: "Build", id: "b", run: "touch ran" },
        { name: "After The Build", if: AFTER_THE_BUILD, run: "touch ran" },
        { name: "On Failure", if: "failure()", run: "touch ran" },
        { name: "Always", if: "always()", run: "touch ran" },
      ],
    },
  });
  const listed = ciLocal(dir, "--list");
  assert.equal(listed.status, 0, listed.log);
  assert.equal(fs.existsSync(path.join(dir, "ran")), false, listed.log);
  assert.deepEqual(
    listed.log.split("\n").filter((line) => /^\s*\d+\. /.test(line)),
    [
      " 1. RUN   Plain",
      " 2. RUN   On Pull Requests",
      " 3. SKIP  On Pushes  — runs only when github.event_name == 'push', and a local run is a pull request into main",
      " 4. SKIP  On Linux  — runs only when runner.os == 'Linux'",
      " 5. RUN   Build",
      ` 6. WHEN  After The Build  — runs when ${AFTER_THE_BUILD}, decided as the job runs`,
      " 7. WHEN  On Failure  — runs when failure(), decided as the job runs",
      " 8. RUN   Always",
    ],
  );
});
