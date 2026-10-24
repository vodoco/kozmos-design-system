import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { actionFiles, classify, findUses } from "./check-action-pins.mjs";

const SHA = "08c6903cd8c0fde910a37f88322edcfb5dd907a8";

function check(text, file = ".github/workflows/x.yml") {
  return classify(findUses(text, file));
}

test("a step pinned to a commit with its release passes", () => {
  const { pins, problems } = check(`jobs:
  build:
    steps:
      - uses: actions/checkout@${SHA} # v5.0.0
      - name: Lighthouse
        uses: treosh/lighthouse-ci-action@${SHA} # 12.6.2
`);
  assert.deepEqual(problems, []);
  assert.deepEqual(
    pins.map(({ repo, release, where }) => [repo, release, where]),
    [
      ["actions/checkout", "v5.0.0", ".github/workflows/x.yml:4"],
      ["treosh/lighthouse-ci-action", "12.6.2", ".github/workflows/x.yml:6"],
    ],
  );
});

test("a tag, a branch or a short SHA is not a pin", () => {
  const { pins, problems } = check(`jobs:
  build:
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@main # v5.0.0
      - uses: pnpm/action-setup@fc06bc1 # v5.0.0
      - uses: "actions/upload-artifact@v6"
`);
  assert.equal(pins.length, 0);
  assert.equal(problems.length, 4);
  assert.match(problems[0], /x\.yml:4 actions\/checkout@v5 is not pinned/);
  assert.match(
    problems[3],
    /x\.yml:7 actions\/upload-artifact@v6 is not pinned/,
  );
});

test("a SHA must say which release it is, on its own line", () => {
  const { pins, problems } = check(`jobs:
  build:
    steps:
      - uses: actions/checkout@${SHA}
      - uses: actions/checkout@${SHA} # v4
      - uses: actions/checkout@${SHA}
        # v5.0.0
      - uses: actions/checkout@${SHA} # v5.0.0 (Node 24)
`);
  assert.equal(problems.length, 3);
  assert.match(problems[0], /:4 .* has no comment/);
  assert.match(problems[1], /:5 .* has the comment "# v4"/);
  assert.match(problems[2], /:6 .* has no comment/);
  assert.deepEqual(
    pins.map((pin) => pin.where),
    [".github/workflows/x.yml:8"],
  );
});

test("a quoted pin counts; an alias or a block scalar does not", () => {
  const { pins, problems } = check(`jobs:
  build:
    steps:
      - uses: "actions/checkout@${SHA}" # v5.0.0
      - uses: &pin actions/checkout@${SHA}
      - uses: *pin
        # v5.0.0
      - uses: >-
          actions/checkout@${SHA}
        # v5.0.0
`);
  assert.deepEqual(
    pins.map((pin) => pin.where),
    [".github/workflows/x.yml:4"],
  );
  assert.equal(problems.length, 3);
  assert.match(problems[0], /:5 .* has no comment/);
  assert.match(problems[1], /:6 \*pin is not a one-line string/);
  assert.match(problems[2], /:8 actions\/checkout@.* is not a one-line string/);
});

test("a reusable workflow called by a job is held to the same rule", () => {
  const { pins, problems } = check(`jobs:
  shared:
    uses: octo/workflows/.github/workflows/build.yml@v1
  pinned:
    uses: octo/workflows/.github/workflows/build.yml@${SHA} # v1.2.3
  local:
    uses: ./.github/workflows/local.yml
`);
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /:3 octo\/workflows\/\.github\/workflows\/build\.yml@v1/,
  );
  assert.deepEqual(
    pins.map(({ repo, where }) => [repo, where]),
    [["octo/workflows", ".github/workflows/x.yml:5"]],
  );
});

test("local actions and docker:// images are named, not checked", () => {
  const { pins, skipped, problems } = check(`jobs:
  build:
    steps:
      - uses: ./.github/actions/setup
      - uses: docker://alpine:3.20
`);
  assert.deepEqual(problems, []);
  assert.equal(pins.length, 0);
  assert.deepEqual(
    skipped.map((use) => use.value),
    ["./.github/actions/setup", "docker://alpine:3.20"],
  );
});

test("a composite action's steps are found, and actions/ is searched", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "action-pins-"));
  try {
    fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
    fs.mkdirSync(path.join(root, ".github/actions/setup/inner"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(root, ".github/workflows/ci.yml"), "on: push\n");
    fs.writeFileSync(path.join(root, ".github/workflows/notes.txt"), "");
    fs.writeFileSync(
      path.join(root, ".github/actions/setup/action.yml"),
      "runs:\n  using: composite\n  steps:\n    - uses: actions/setup-node@v5\n",
    );
    fs.writeFileSync(
      path.join(root, ".github/actions/setup/inner/action.yaml"),
      "runs:\n  using: node24\n  main: index.js\n",
    );
    const files = actionFiles(root);
    assert.deepEqual(files, [
      ".github/workflows/ci.yml",
      ".github/actions/setup/action.yml",
      ".github/actions/setup/inner/action.yaml",
    ]);
    const { problems } = classify(
      findUses(fs.readFileSync(path.join(root, files[1]), "utf8"), files[1]),
    );
    assert.deepEqual(problems, [
      ".github/actions/setup/action.yml:4 actions/setup-node@v5 is not pinned to a commit: name the 40-character SHA its release tag points at",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("every action this repository runs is pinned to a release's commit", () => {
  // The form only; `pnpm release:pins:check` asks GitHub that each SHA is the
  // commit of the release its comment names.
  const files = actionFiles(process.cwd());
  assert.ok(files.includes(".github/workflows/release.yml"));
  const uses = files.flatMap((file) =>
    findUses(fs.readFileSync(file, "utf8"), file),
  );
  const { pins, problems } = classify(uses);
  assert.deepEqual(problems, []);
  assert.ok(pins.length > 0, "no pinned action found");
});
