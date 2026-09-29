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

// ---- Shared build inputs and consumer-facing manifest fields (the read-only
// review's L3) ----

test("a root file this checkout's builds run needs a changeset for every package that runs it", () => {
  // scripts/emit-format-declarations.mjs writes the .d.mts and .d.cts that
  // react, icons and product-contracts ship (each build script runs it), and
  // the icons and product-contracts tsconfigs extend tsconfig.base.json.
  const missing = (file, changesets = []) =>
    missingChangesets({ changedFiles: [file], changesets }).map((m) => m.name);
  assert.deepEqual(missing("scripts/emit-format-declarations.mjs"), [
    "@kozmos-ds/react",
    "@kozmos-ds/icons",
    "@kozmos-ds/product-contracts",
  ]);
  assert.deepEqual(missing("tsconfig.base.json"), [
    "@kozmos-ds/icons",
    "@kozmos-ds/product-contracts",
  ]);
  assert.deepEqual(
    missing("scripts/emit-format-declarations.mjs", [{ releases: [react] }]),
    ["@kozmos-ds/icons", "@kozmos-ds/product-contracts"],
  );
  // An empty changeset still says none is needed.
  assert.deepEqual(
    missing("scripts/emit-format-declarations.mjs", [{ releases: [] }]),
    [],
  );
  // What no package's build runs stays out, the emitter's own test included.
  for (const file of [
    "scripts/emit-format-declarations.test.mjs",
    "scripts/check-raw-values.mjs",
    "scripts/release/changeset-required.mjs",
    "scripts/ci/ios-changes.sh",
    "tsconfig.json",
    "eslint.config.mjs",
  ])
    assert.deepEqual(missing(file), [], file);
});

/**
 * A scratch workspace: `files` committed on main, then a branch. `reset()`
 * starts the branch again from main, so each case changes one thing.
 */
function workspace(t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-changeset-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  for (const [file, text] of Object.entries(files)) write(file, text);
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  const reset = () => git("checkout", "-q", "-B", "change", "main");
  reset();
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
  return { run, commit, reset };
}

const manifest = (fields) => `${JSON.stringify(fields, null, 2)}\n`;

test("an edit to a file outside a package that its build runs needs that package's changeset", (t) => {
  const { run, commit, reset } = workspace(t, {
    "packages/react/package.json": manifest({
      name: "@kozmos-ds/react",
      version: "0.4.0",
      scripts: {
        build: "tsc && vite build && node ../../scripts/emit.mjs",
        test: "node ../../scripts/unrelated.mjs",
      },
    }),
    "packages/icons/package.json": manifest({
      name: "@kozmos-ds/icons",
      version: "0.4.0",
      scripts: { build: "vite build && node ../../scripts/emit.mjs" },
    }),
    // JSONC, as tsconfig files are.
    "packages/icons/tsconfig.json":
      '{\n  // shared options\n  "extends": "../../tsconfig.base.json",\n  "include": ["src"],\n}\n',
    "packages/tokens/package.json": manifest({
      name: "@kozmos-ds/tokens",
      version: "0.1.0",
      scripts: { build: "node build.mjs" },
    }),
    "packages/tokens/build.mjs": "console.log('tokens');\n",
    "scripts/emit.mjs":
      'import { format } from "./lib/format.mjs";\nconsole.log(format());\n',
    "scripts/lib/format.mjs": "export const format = () => 'd.ts';\n",
    "scripts/unrelated.mjs": "console.log('a check');\n",
    "tsconfig.base.json": '{ "compilerOptions": { "declarationMap": true } }\n',
  });
  const names = (result) =>
    [...result.stderr.matchAll(/^(@kozmos-ds\/[a-z-]+) ships changes/gm)].map(
      (match) => match[1],
    );

  commit("scripts/emit.mjs", "console.log('another format');\n");
  let result = run();
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(names(result), ["@kozmos-ds/react", "@kozmos-ds/icons"]);
  assert.match(result.stderr, /^ {2}scripts\/emit\.mjs$/m);
  commit(".changeset/react.md", '---\n"@kozmos-ds/react": patch\n---\n\nA.\n');
  result = run();
  assert.deepEqual(names(result), ["@kozmos-ds/icons"]);
  commit(".changeset/icons.md", '---\n"@kozmos-ds/icons": patch\n---\n\nB.\n');
  result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);

  // What that script imports is part of it.
  reset();
  commit("scripts/lib/format.mjs", "export const format = () => 'd.mts';\n");
  result = run();
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(names(result), ["@kozmos-ds/react", "@kozmos-ds/icons"]);

  // A tsconfig a package's tsconfig extends.
  reset();
  commit(
    "tsconfig.base.json",
    '{ "compilerOptions": { "sourceMap": true } }\n',
  );
  result = run();
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(names(result), ["@kozmos-ds/icons"]);

  // A script only a test runs is not a build input.
  reset();
  commit("scripts/unrelated.mjs", "console.log('another check');\n");
  result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

// A workspace whose react build config imports a root script and reads two
// manifests, the tokens package's and the root's.
const configWorkspace = (t) =>
  workspace(t, {
    "package.json": manifest({
      name: "kozmos-design-system",
      private: true,
      scripts: { test: "turbo run test" },
    }),
    "packages/react/package.json": manifest({
      name: "@kozmos-ds/react",
      version: "0.4.0",
      // A path the shell ends with `;` is still a path.
      scripts: { build: "node ../../scripts/emit.mjs; vite build" },
    }),
    "packages/react/vite.config.mts": [
      'import shared from "../../scripts/vite-shared.mjs";',
      'const tokens = require("../tokens/package.json");',
      'const root = require("../../package.json");',
      "export default shared(tokens, root);",
      "",
    ].join("\n"),
    "packages/tokens/package.json": manifest({
      name: "@kozmos-ds/tokens",
      version: "0.1.0",
      scripts: { build: "node build.mjs" },
    }),
    "packages/tokens/build.mjs": "console.log('tokens');\n",
    "scripts/emit.mjs": "console.log('d.ts');\n",
    "scripts/vite-shared.mjs": "export default () => ({});\n",
  });
const shipping = (result) =>
  [...result.stderr.matchAll(/^(@kozmos-ds\/[a-z-]+) ships changes/gm)].map(
    (match) => match[1],
  );

test("what a package's build config imports from outside it counts, as does a path a build script ends with `;`", (t) => {
  const { run, commit, reset } = configWorkspace(t);
  commit(
    "scripts/vite-shared.mjs",
    "export default () => ({ minify: false });\n",
  );
  let result = run();
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(shipping(result), ["@kozmos-ds/react"]);

  reset();
  commit("scripts/emit.mjs", "console.log('d.mts');\n");
  result = run();
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.deepEqual(shipping(result), ["@kozmos-ds/react"]);
});

test("a manifest a build config reads never counts as a whole: a version PR asks nothing more", (t) => {
  const { run, commit, reset } = configWorkspace(t);
  // A version PR bumps the tokens manifest react's config reads: the bump
  // is the release, and asks nothing of react.
  let result;
  commit(
    "packages/tokens/package.json",
    manifest({
      name: "@kozmos-ds/tokens",
      version: "0.2.0",
      scripts: { build: "node build.mjs" },
    }),
  );
  result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);

  // Nor does a new root script.
  reset();
  commit(
    "package.json",
    manifest({
      name: "kozmos-design-system",
      private: true,
      scripts: { test: "turbo run test", lint: "turbo run lint" },
    }),
  );
  result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("each consumer-facing package.json field needs a changeset; a version bump or a script a person runs does not", (t) => {
  const base = {
    name: "@kozmos-ds/react",
    version: "0.4.0",
    description: "Kozmos for React",
    scripts: {
      build: "pnpm run build:css && vite build",
      "build:css": "tailwindcss -o dist/style.css",
      test: "vitest run",
      lint: "eslint src",
    },
    devDependencies: { vite: "^5.0.0" },
  };
  const { run, commit, reset } = workspace(t, {
    "packages/react/package.json": manifest(base),
  });
  const scripts = (patch) => ({ scripts: { ...base.scripts, ...patch } });
  for (const [label, patch] of [
    ["type", { type: "module" }],
    ["engines", { engines: { node: ">=20" } }],
    ["browser", { browser: "./dist/browser.js" }],
    ["browserslist", { browserslist: ["chrome >= 120"] }],
    ["sideEffects", { sideEffects: false }],
    ["exports", { exports: { ".": "./dist/index.js" } }],
    ["imports", { imports: { "#internal": "./dist/internal.js" } }],
    ["main", { main: "dist/index.cjs" }],
    ["module", { module: "dist/index.mjs" }],
    ["types", { types: "dist/index.d.ts" }],
    ["unpkg", { unpkg: "dist/index.umd.js" }],
    ["bin", { bin: { kozmos: "dist/cli.js" } }],
    ["files", { files: ["dist"] }],
    ["publishConfig", { publishConfig: { access: "public" } }],
    ["dependencies", { dependencies: { clsx: "2.1.1" } }],
    ["peerDependencies", { peerDependencies: { react: "^19.0.0" } }],
    [
      "peerDependenciesMeta",
      { peerDependenciesMeta: { "react-dom": { optional: true } } },
    ],
    ["optionalDependencies", { optionalDependencies: { fsevents: "2.3.3" } }],
    ["bundleDependencies", { bundleDependencies: ["clsx"] }],
    ["os", { os: ["darwin"] }],
    ["cpu", { cpu: ["arm64"] }],
    ["the build script", scripts({ build: "vite build --minify false" })],
    [
      "a script the build script runs",
      scripts({ "build:css": "tailwindcss --minify -o dist/style.css" }),
    ],
    ["a script npm runs when it packs", scripts({ prepack: "node strip.mjs" })],
    [
      "a script a consumer's install runs",
      scripts({ postinstall: "node setup.mjs" }),
    ],
  ]) {
    reset();
    commit("packages/react/package.json", manifest({ ...base, ...patch }));
    const result = run();
    assert.equal(
      result.status,
      1,
      `${label}\n${result.stdout}${result.stderr}`,
    );
    assert.match(result.stderr, /@kozmos-ds\/react ships changes/, label);
    assert.match(result.stderr, /^ {2}packages\/react\/package\.json$/m, label);
  }
  for (const [label, patch] of [
    ["a version bump", { version: "0.5.0" }],
    ["the test script", scripts({ test: "vitest run --coverage" })],
    ["the lint script", scripts({ lint: "eslint src --max-warnings 0" })],
    ["a new script no build runs", scripts({ storybook: "storybook dev" })],
    ["the description", { description: "Kozmos components for React" }],
    ["devDependencies", { devDependencies: { vite: "^5.4.0" } }],
  ]) {
    reset();
    commit("packages/react/package.json", manifest({ ...base, ...patch }));
    const result = run();
    assert.equal(
      result.status,
      0,
      `${label}\n${result.stdout}${result.stderr}`,
    );
  }
});
