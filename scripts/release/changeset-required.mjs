#!/usr/bin/env node
// A pull request that changes what a published package ships must say how it
// is released: a changeset naming that package, or an empty changeset
// (`pnpm changeset --empty`) when it genuinely needs none. Nothing between
// react 0.4.0 and #120 carried one, so a release would have versioned none of
// it, and react pins its siblings exactly (Olcay's decision 8: one catch-up,
// then a changeset in every pull request).
//
// What ships, per package: its src/ apart from tests, stories, docs pages and
// Code Connect files; the build files beside it; the consumer-facing fields of
// its package.json and the scripts that build and pack it; and the files
// outside it that its build runs or extends. The last are read from the
// packages themselves rather than listed here: a file a build script names
// (`node ../../scripts/emit-format-declarations.mjs` in react's, icons' and
// product-contracts'), a tsconfig a package's tsconfig extends
// (tsconfig.base.json), and what those files import. An edit to one of them
// needs a changeset for every package whose build reads it.
//
// `changeset status --since` is not used: it counts the private apps and the
// docs as packages too, so every story or docs edit would ask for one.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

// The packages npm receives. iOS and Android ship through their own
// channels, and every other workspace package is private.
export const PUBLISHED = {
  "@kozmos-ds/react": "packages/react",
  "@kozmos-ds/icons": "packages/icons",
  "@kozmos-ds/product-contracts": "packages/product-contracts",
  "@kozmos-ds/tokens": "packages/tokens",
};

// Under src/, what never reaches dist: tests, stories, docs pages, Code
// Connect files and snapshots.
const NOT_SHIPPED =
  /(^|\/)(__tests__|tests?)\/|\.(test|spec|stories)\.[cm]?[jt]sx?$|\.figma\.tsx?$|\.mdx?$|\.snap$/;
// Beside src/, the files that decide what dist holds: the build configs, the
// PostCSS plugins react's build runs over every rule it ships
// (postcss/scoped-css.cjs, postcss/token-alpha.cjs), and tsconfig, whose
// `exclude` is what vite-plugin-dts publishes. tsconfig.node.json only types
// the build config itself.
const BUILD_FILES =
  /^(tsconfig(\.build)?\.json|vite\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|postcss\/(?![^/]*\.test\.)[^/]+\.[cm]?js|build\.mjs|config\.json)$/;
// package.json fields a consumer's resolver, bundler or installer reads, or
// that decide what the tarball holds and how it is published. A version bump
// alone is the release itself, not a change to release.
const CONSUMER_FIELDS = [
  // how the package resolves, and what a bundler may drop
  "type",
  "exports",
  "imports",
  "main",
  "module",
  "browser",
  "types",
  "typings",
  "unpkg",
  "jsdelivr",
  "bin",
  "sideEffects",
  // what installs with it, and where it may install
  "dependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "optionalDependencies",
  "bundleDependencies",
  "bundledDependencies",
  "engines",
  "os",
  "cpu",
  // what the tarball holds, and how it is published
  "files",
  "publishConfig",
  // the browsers its build targets: react's floor, which it calls breaking
  // to raise
  "browserslist",
];
// The scripts that make or ship what the tarball holds: `build`, which the
// release runs; what pnpm runs when it packs; and what a consumer's install
// runs. Any script one of them runs by name counts with it. The rest (test,
// lint, dev, figma:publish…) only a person or CI runs.
const SHIPPING_SCRIPTS = [
  "build",
  "prepack",
  "prepare",
  "postpack",
  "preinstall",
  "install",
  "postinstall",
];
const MODULE = /\.[cm]?[jt]sx?$/;
const TSCONFIGS = ["tsconfig.json", "tsconfig.build.json"];

/** The published package whose shipped files `file` belongs to, or null. */
export function shippedPackage(file, packageJsonChanged = () => true) {
  for (const [name, dir] of Object.entries(PUBLISHED)) {
    if (!file.startsWith(`${dir}/`)) continue;
    const rest = file.slice(dir.length + 1);
    if (rest.startsWith("src/")) return NOT_SHIPPED.test(rest) ? null : name;
    if (rest === "package.json") return packageJsonChanged(file) ? name : null;
    return BUILD_FILES.test(rest) ? name : null;
  }
  return null;
}

/** A manifest's scripts that build or ship it, with every script they run by name. */
export function shippingScripts(manifest) {
  const scripts = manifest?.scripts ?? {};
  const chosen = {};
  const queue = SHIPPING_SCRIPTS.filter(
    (name) => typeof scripts[name] === "string",
  );
  while (queue.length) {
    const name = queue.shift();
    if (name in chosen) continue;
    chosen[name] = scripts[name];
    for (const [, invoked] of scripts[name].matchAll(
      /\b(?:pnpm|npm|yarn)\s+(?:run(?:-script)?\s+)?([\w:.-]+)/g,
    ))
      if (typeof scripts[invoked] === "string") queue.push(invoked);
  }
  return Object.fromEntries(
    Object.entries(chosen).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * The consumer-facing fields that differ between two versions of a
 * package.json, with "scripts" when a script that builds or ships it did.
 */
export function consumerChanges(before, after) {
  const changed = CONSUMER_FIELDS.filter(
    (field) =>
      JSON.stringify(before?.[field]) !== JSON.stringify(after?.[field]),
  );
  if (
    JSON.stringify(shippingScripts(before)) !==
    JSON.stringify(shippingScripts(after))
  )
    changed.push("scripts");
  return changed;
}

const join = (...parts) => path.posix.normalize(path.posix.join(...parts));
const insideRepository = (file) =>
  !file.startsWith("../") && !path.posix.isAbsolute(file);

/** The relative paths a module imports, requires or re-exports. */
function relativeSpecifiers(source) {
  return [
    ...source.matchAll(
      /(?:\bfrom|\bimport|\brequire\s*\()\s*\(?\s*["'](\.\.?\/[^"'\n]+)["']/g,
    ),
  ].map((match) => match[1]);
}

/** The path `specifier` names from `file`, as Node or a bundler resolves it, if it exists. */
function resolveFrom(file, specifier, exists) {
  const base = join(path.posix.dirname(file), specifier);
  for (const candidate of [
    base,
    ...[".mjs", ".js", ".cjs", ".ts", ".mts", ".cts", ".json"].map(
      (extension) => base + extension,
    ),
    ...["index.mjs", "index.js", "index.ts"].map((index) => join(base, index)),
  ])
    if (exists(candidate)) return candidate;
  return null;
}

/** The relative tsconfig paths `file` extends, parsed as TypeScript does (comments and all). */
function tsconfigExtends(file, source) {
  const ts = require("typescript");
  const { config } = ts.parseConfigFileTextToJson(file, source);
  const values = [config?.extends ?? []].flat();
  return values
    .filter((value) => typeof value === "string" && value.startsWith("."))
    .map((value) => {
      const target = join(path.posix.dirname(file), value);
      return target.endsWith(".json") ? target : `${target}.json`;
    });
}

/**
 * The files outside `dir` that the package's build reads, from `source`
 * (`{ exists(file), read(file) }`, over repository paths): every path its
 * shipping scripts name, every tsconfig its tsconfig extends, and what those
 * files and its own build configs import, followed to the end. Its own files
 * are left to shippedPackage.
 */
export function buildInputs(dir, manifest, source) {
  const seen = new Set();
  const outside = new Set();
  const visit = (file) => {
    if (seen.has(file) || !insideRepository(file) || !source.exists(file))
      return;
    seen.add(file);
    if (!file.startsWith(`${dir}/`)) outside.add(file);
    const text =
      MODULE.test(file) || /tsconfig[^/]*\.json$/.test(file)
        ? source.read(file)
        : null;
    if (text == null) return;
    if (MODULE.test(file)) {
      for (const specifier of relativeSpecifiers(text)) {
        const target = resolveFrom(file, specifier, source.exists);
        if (target) visit(target);
      }
    } else for (const base of tsconfigExtends(file, text)) visit(base);
  };
  // The paths a shipping script names: `node ../../scripts/x.mjs`,
  // `--config ../shared/vite.config.mts`, `node build.mjs`.
  for (const command of Object.values(shippingScripts(manifest)))
    for (const word of command.split(/\s+/)) {
      const value = word.replace(/^--?[\w-]+=/, "").replace(/^["']|["']$/g, "");
      if (/^\.\.?\//.test(value) || MODULE.test(value)) visit(join(dir, value));
    }
  // The package's own build configs, for what they import from outside it.
  for (const file of source.files(dir))
    if (BUILD_FILES.test(file.slice(dir.length + 1))) visit(file);
  for (const name of TSCONFIGS) visit(`${dir}/${name}`);
  // Its own package.json is compared field by field, never as a whole.
  outside.delete(`${dir}/package.json`);
  return [...outside].sort();
}

/**
 * File → the published packages whose build reads it, for the files outside
 * each package that its build runs or extends, from `source`
 * (`{ files(dir), exists(file), read(file) }`).
 */
export function sharedBuildInputs(source) {
  const inputs = new Map();
  for (const [name, dir] of Object.entries(PUBLISHED)) {
    const text = source.read(`${dir}/package.json`);
    if (text == null) continue;
    for (const file of buildInputs(dir, JSON.parse(text), source))
      inputs.set(file, [...(inputs.get(file) ?? []), name]);
  }
  return inputs;
}

/** A source over the files git tracks in `root`, read from its working tree. */
function checkoutSource(root) {
  const files = execFileSync("git", ["ls-files"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const tracked = new Set(files);
  return {
    files: (dir) => files.filter((file) => file.startsWith(`${dir}/`)),
    exists: (file) => tracked.has(file),
    read: (file) => {
      if (!tracked.has(file)) return null;
      try {
        return fs.readFileSync(path.join(root, file), "utf8");
      } catch {
        return null;
      }
    },
  };
}

let checkoutInputs;
/** sharedBuildInputs for the repository this script is in, as it stands. */
function inputsOfThisCheckout() {
  checkoutInputs ??= sharedBuildInputs(
    checkoutSource(fileURLToPath(new URL("../../", import.meta.url))),
  );
  return checkoutInputs;
}

/**
 * What is missing, as `{ name, files }` per published package that changed
 * without a changeset naming it. `changesets` are the parsed changesets the
 * pull request adds or edits; any empty one waives them all. `buildInputs`
 * maps a file outside the packages to the packages whose build reads it
 * (sharedBuildInputs); by default, this checkout's.
 */
export function missingChangesets({
  changedFiles,
  changesets,
  packageJsonChanged,
  buildInputs = inputsOfThisCheckout(),
}) {
  const changed = new Map();
  const add = (name, file) => {
    const files = changed.get(name) ?? [];
    if (!files.includes(file)) files.push(file);
    changed.set(name, files);
  };
  for (const file of changedFiles) {
    const name = shippedPackage(file, packageJsonChanged);
    if (name) add(name, file);
    for (const reader of buildInputs.get(file) ?? []) add(reader, file);
  }
  if (changesets.some((changeset) => changeset.releases.length === 0))
    return [];
  const named = new Set(
    changesets.flatMap((changeset) => changeset.releases.map((r) => r.name)),
  );
  const order = Object.keys(PUBLISHED);
  return [...changed]
    .filter(([name]) => !named.has(name))
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([name, files]) => ({ name, files }));
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function main() {
  const base = process.argv[2] ?? process.env.CHANGESET_BASE ?? "origin/main";
  const range = `${base}...HEAD`;
  const lines = git("diff", "--name-status", "--no-renames", range)
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));
  const changedFiles = lines.map(([, file]) => file);
  const parse = createRequire(require.resolve("@changesets/cli"))(
    "@changesets/parse",
  ).default;
  const changesets = lines
    .filter(
      ([status, file]) =>
        status !== "D" &&
        /^\.changeset\/[^/]+\.md$/.test(file) &&
        !file.endsWith("README.md"),
    )
    .map(([, file]) => parse(git("show", `HEAD:${file}`)));
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const packageJsonChanged = (file) => {
    let before = {};
    try {
      before = JSON.parse(git("show", `${mergeBase}:${file}`));
    } catch {
      return true; // a new package.json is a new package
    }
    const after = JSON.parse(git("show", `HEAD:${file}`));
    return consumerChanges(before, after).length > 0;
  };
  // What each package's build reads from outside it, as HEAD has it.
  const files = git("ls-tree", "-r", "--name-only", "HEAD")
    .split("\n")
    .filter(Boolean);
  const tracked = new Set(files);
  const buildInputs = sharedBuildInputs({
    files: (dir) => files.filter((file) => file.startsWith(`${dir}/`)),
    exists: (file) => tracked.has(file),
    read: (file) => (tracked.has(file) ? git("show", `HEAD:${file}`) : null),
  });
  const missing = missingChangesets({
    changedFiles,
    changesets,
    packageJsonChanged,
    buildInputs,
  });
  if (missing.length === 0) {
    console.log(
      `Changesets: every published change since ${base} is described (${changesets.length} changeset(s)).`,
    );
    return;
  }
  for (const { name, files: shipped } of missing) {
    console.error(
      `${name} ships changes with no changeset naming it:\n  ${shipped.join("\n  ")}`,
    );
  }
  console.error(
    "\nAdd one with `pnpm changeset` (see CONTRIBUTING.md, Changesets). If this pull request " +
      "genuinely needs no release, add an empty one: `pnpm changeset --empty`.",
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
