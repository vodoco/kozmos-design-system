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
    "packages/styles/src/styles/owned-components.css",
    "packages/react/tsconfig.json",
    "packages/react/vite.config.mts",
    "packages/react/vite-plugins/shakable-components.mjs",
    "packages/icons/vite.config.mts",
    "packages/styles/tailwind.config.js",
    // styles' build runs these PostCSS plugins over every rule it ships
    "packages/styles/postcss/scoped-css.cjs",
    "packages/styles/postcss/token-alpha.cjs",
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
    "packages/styles/postcss/scoped-css.test.cjs",
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

test("a public package's other Vite configs, tsconfigs, build scripts and subpath manifests count", () => {
  // icons builds its Vue entry with vite.vue.config.mts and tsconfig.vue.json,
  // rolls its declarations with scripts/roll-vue-declarations.mjs (which
  // imports scripts/react-in-declarations.mjs), and ships vue/package.json
  // for resolvers that ignore `exports`. Until 5 Nov none of them counted.
  for (const file of [
    "packages/icons/vite.vue.config.mts",
    "packages/icons/tsconfig.vue.json",
    "packages/icons/scripts/roll-vue-declarations.mjs",
    "packages/icons/scripts/react-in-declarations.mjs",
    "packages/icons/vue/package.json",
    "packages/react/vite.lib.config.ts",
  ])
    assert.equal(shippedPackage(file)?.startsWith("@kozmos-ds/"), true, file);
  for (const file of [
    // a test beside the build scripts, a nested folder's manifest, and the
    // tsconfig that only types the build config, as before
    "packages/icons/scripts/react-in-declarations.test.mjs",
    "packages/icons/tests/fixtures/package.json",
    "packages/icons/vue/nested/package.json",
    "packages/react/tsconfig.node.json",
    "packages/react/vitest.config.ts",
    // only `pnpm typecheck` reads it: react's build names no tsconfig but
    // tsconfig.json
    "packages/react/tsconfig.typecheck.json",
  ])
    assert.equal(shippedPackage(file), null, file);
});

test("a tsconfig counts when the package's build reads it", () => {
  // From a source, as a pull request's checkout gives one: the build script
  // and Vite config name what they read, and a named tsconfig's `extends`
  // is followed.
  const files = {
    "packages/icons/package.json": JSON.stringify({
      name: "@kozmos-ds/icons",
      scripts: {
        build: "tsc --noEmit && tsc -p tsconfig.vue.json --noEmit && vite build",
        typecheck: "tsc -p tsconfig.check.json --noEmit",
      },
    }),
    "packages/icons/vite.config.mts": `dts({ tsconfigPath: "tsconfig.lib.json" })`,
    "packages/icons/tsconfig.lib.json": `{ "extends": "./tsconfig.shared.json" }`,
    "packages/icons/tsconfig.shared.json": "{}",
    "packages/icons/tsconfig.vue.json": "{}",
    "packages/icons/tsconfig.check.json": "{}",
    "packages/icons/tsconfig.json": "{}",
  };
  const source = {
    files: (dir) => Object.keys(files).filter((f) => f.startsWith(`${dir}/`)),
    exists: (file) => file in files,
    read: (file) => files[file] ?? null,
  };
  for (const name of ["tsconfig.json", "tsconfig.vue.json", "tsconfig.lib.json", "tsconfig.shared.json"])
    assert.equal(
      shippedPackage(`packages/icons/${name}`, () => true, source),
      "@kozmos-ds/icons",
      name,
    );
  assert.equal(
    shippedPackage("packages/icons/tsconfig.check.json", () => true, source),
    null,
  );
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

// Styles' Tailwind build scans Vue's sources for the classes it emits, so a
// Vue part can change the style.css styles ships and react copies.
test("a Vue source the stylesheet scans needs a changeset for styles and for react", () => {
  const changedFiles = [
    "packages/vue/src/components/Button.vue",
    "packages/vue/src/index.ts",
    "packages/vue/src/recipes/button.js",
  ];
  const styles = { name: "@kozmos-ds/styles", type: "minor" };
  assert.deepEqual(missingChangesets({ changedFiles, changesets: [] }), [
    { name: "@kozmos-ds/react", files: changedFiles },
    { name: "@kozmos-ds/styles", files: changedFiles },
  ]);
  assert.deepEqual(
    missingChangesets({
      changedFiles,
      changesets: [{ releases: [react, styles] }],
    }),
    [],
  );
  assert.deepEqual(
    missingChangesets({ changedFiles, changesets: [{ releases: [react] }] }),
    [{ name: "@kozmos-ds/styles", files: changedFiles }],
  );
});

test("a Vue file the stylesheet does not scan needs none", () => {
  assert.deepEqual(
    missingChangesets({
      changedFiles: [
        "packages/vue/src/components/Button.spec.ts",
        "packages/vue/src/components/Button.test.ts",
        "packages/vue/src/components/Button.stories.ts",
        "packages/vue/src/README.md",
        "packages/vue/package.json",
        "packages/vue/vite.config.ts",
      ],
      changesets: [],
    }),
    [],
  );
});

// styles' style.css inlines tokens' CSS, which packages/tokens/build.mjs
// builds from these sources: a change to one changes the stylesheet styles
// ships and react copies, whatever either lists as a dependency (styles takes
// tokens only as a build input since #481).
test("a token source styles' CSS inlines needs a changeset for tokens, styles and react", () => {
  for (const file of [
    "packages/tokens/src/tokens-light.json",
    "packages/tokens/src/tokens-dark.json",
    "packages/tokens/src/tokens-density-compact.json",
    "packages/tokens/build.mjs",
  ])
    assert.deepEqual(
      missingChangesets({ changedFiles: [file], changesets: [] }).map(
        (m) => m.name,
      ),
      ["@kozmos-ds/react", "@kozmos-ds/tokens", "@kozmos-ds/styles"],
      file,
    );
  // The token sources no CSS is built from release tokens alone.
  assert.deepEqual(
    missingChangesets({
      changedFiles: ["packages/tokens/src/tokens.json"],
      changesets: [],
    }).map((m) => m.name),
    ["@kozmos-ds/tokens"],
  );
});

test("the tokens' CSS styles imports is exactly what the rule counts", async () => {
  const { STYLESHEET_TOKENS } = await import("./changeset-required.mjs");
  const imported = [
    ...fs
      .readFileSync(
        path.join(import.meta.dirname, "../../packages/styles/src/index.css"),
        "utf8",
      )
      .matchAll(/@import\s+"(@kozmos-ds\/tokens\/[^"]+)"/g),
  ].map((m) => m[1]);
  assert.deepEqual(
    imported,
    STYLESHEET_TOKENS.imports,
    "packages/styles/src/index.css imports other tokens CSS: update STYLESHEET_TOKENS in changeset-required.mjs",
  );
});

test("the Vue files that count are exactly the ones styles' Tailwind build scans", async () => {
  const { STYLESHEET_SCANS } = await import("./changeset-required.mjs");
  const config = (await import("../../packages/styles/tailwind.config.js"))
    .default;
  const vueGlobs = config.content.files.filter((glob) =>
    glob.replace(/^!/, "").startsWith("../vue/"),
  );
  assert.deepEqual(
    vueGlobs,
    STYLESHEET_SCANS.map((scan) => scan.globs).flat(),
    "packages/styles/tailwind.config.js scans other Vue files: update STYLESHEET_SCANS in changeset-required.mjs to match",
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
