import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { missingChangesets, shippedPackage } from "./changeset-required.mjs";

const script = fileURLToPath(
  new URL("./changeset-required.mjs", import.meta.url),
);
const react = { name: "@kozmos-ds/react", type: "minor" };
const icons = { name: "@kozmos-ds/icons", type: "minor" };

test("what a published package ships counts, and nothing else does", () => {
  for (const file of [
    "packages/react/src/components/Chip/Chip.tsx",
    "packages/react/src/styles/owned-components.css",
    "packages/react/tsconfig.json",
    "packages/react/vite.config.mts",
    "packages/icons/vite.config.mts",
    "packages/react/tailwind.config.js",
    "packages/react/postcss.config.cjs",
    // react's build runs these PostCSS plugins over every rule it ships
    "packages/react/postcss/scoped-css.cjs",
    "packages/react/postcss/token-alpha.cjs",
    "packages/tokens/build.mjs",
    "packages/tokens/config.json",
  ])
    assert.equal(shippedPackage(file)?.startsWith("@kozmos-ds/"), true, file);
  for (const file of [
    "packages/react/src/components/Chip/Chip.test.tsx",
    "packages/react/src/components/Chip/Chip.stories.tsx",
    "packages/react/src/components/Chip/Chip.mdx",
    "packages/react/src/components/Chip/Chip.figma.tsx",
    "packages/react/src/__tests__/a11y.tsx",
    "packages/react/tests/integration/adaptive-host.tsx",
    "packages/react/README.md",
    "packages/react/postcss/scoped-css.test.cjs",
    "packages/react/tsconfig.node.json",
    "packages/react/vitest.config.ts",
    "packages/react/playwright.config.ts",
    "packages/react/e2e/Button.spec.tsx",
    "packages/react/figma.config.json",
    "packages/ios/Sources/Components/Chip/Chip.swift",
    "packages/android/src/main/java/com/kozmos/components/Chip.kt",
    "apps/docs/src/Intro.mdx",
    "docs/visual-review.md",
  ])
    assert.equal(shippedPackage(file), null, file);
});

test("a package.json counts only when a consumer-facing field changed", () => {
  const file = "packages/icons/package.json";
  assert.equal(
    shippedPackage(file, () => true),
    "@kozmos-ds/icons",
  );
  assert.equal(
    shippedPackage(file, () => false),
    null,
  );
});

test("a shipped change needs a changeset naming its package", () => {
  const changedFiles = ["packages/react/src/components/Chip/Chip.tsx"];
  assert.deepEqual(missingChangesets({ changedFiles, changesets: [] }), [
    { name: "@kozmos-ds/react", files: changedFiles },
  ]);
  assert.deepEqual(
    missingChangesets({ changedFiles, changesets: [{ releases: [react] }] }),
    [],
  );
  assert.deepEqual(
    missingChangesets({ changedFiles, changesets: [{ releases: [icons] }] }),
    [{ name: "@kozmos-ds/react", files: changedFiles }],
  );
});

test("an empty changeset says none is needed", () => {
  assert.deepEqual(
    missingChangesets({
      changedFiles: ["packages/react/src/index.ts"],
      changesets: [{ releases: [] }],
    }),
    [],
  );
});

test("a change that ships nothing needs no changeset", () => {
  assert.deepEqual(
    missingChangesets({
      changedFiles: [
        "docs/handoff-2026-09-27-night.md",
        "packages/react/src/components/Chip/Chip.stories.tsx",
        "tests/visual/baselines/components-chip--default--light.png",
      ],
      changesets: [],
    }),
    [],
  );
});

// The whole check, as CI runs it: a scratch repository with main and a branch.
function repository(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-changeset-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  write(
    "packages/react/package.json",
    JSON.stringify({ name: "@kozmos-ds/react", version: "0.4.0" }),
  );
  write("packages/react/src/index.ts", "export const a = 1;\n");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("switch", "-q", "-c", "change");
  const run = () =>
    spawnSync(process.execPath, [script, "main"], {
      cwd: dir,
      encoding: "utf8",
    });
  const commit = (file, text) => {
    write(file, text);
    git("add", file);
    git("commit", "-q", "-m", file);
  };
  return { run, commit };
}

test("the check fails a branch that ships without a changeset, and passes once it has one", (t) => {
  const { run, commit } = repository(t);
  commit("packages/react/src/index.ts", "export const a = 2;\n");
  const without = run();
  assert.equal(without.status, 1, without.stdout + without.stderr);
  assert.match(without.stderr, /@kozmos-ds\/react ships changes/);
  commit(".changeset/a.md", '---\n"@kozmos-ds/react": patch\n---\n\nA.\n');
  const withOne = run();
  assert.equal(withOne.status, 0, withOne.stdout + withOne.stderr);
});

test("the check accepts an empty changeset, and a version bump alone", (t) => {
  const { run, commit } = repository(t);
  commit(
    "packages/react/package.json",
    JSON.stringify({ name: "@kozmos-ds/react", version: "0.5.0" }),
  );
  assert.equal(run().status, 0, "a version bump is the release itself");
  commit("packages/react/src/index.ts", "export const a = 3;\n");
  assert.equal(run().status, 1);
  commit(".changeset/none.md", "---\n---\n");
  const empty = run();
  assert.equal(empty.status, 0, empty.stdout + empty.stderr);
});
