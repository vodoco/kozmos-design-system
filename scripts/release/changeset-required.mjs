#!/usr/bin/env node
// A pull request that changes what a published package ships must say how it
// is released: a changeset naming that package, or an empty changeset
// (`pnpm changeset --empty`) when it genuinely needs none. Nothing between
// react 0.4.0 and #120 carried one, so a release would have versioned none of
// it, and react pins its siblings exactly (Olcay's decision 8: one catch-up,
// then a changeset in every pull request).
//
// `changeset status --since` is not used: it counts the private apps and the
// docs as packages too, so every story or docs edit would ask for one.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

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
// Beside src/, the files that decide what dist holds. tsconfig counts because
// its `exclude` is what vite-plugin-dts publishes.
const BUILD_FILES =
  /^(tsconfig[^/]*\.json|vite\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|build\.mjs|config\.json)$/;
// package.json fields a consumer resolves or installs; a version bump alone is
// the release itself, not a change to release.
const CONSUMER_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "exports",
  "main",
  "module",
  "types",
  "typings",
  "files",
  "sideEffects",
  "bin",
];

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

/**
 * What is missing, as `{ name, files }` per published package that changed
 * without a changeset naming it. `changesets` are the parsed changesets the
 * pull request adds or edits; any empty one waives them all.
 */
export function missingChangesets({
  changedFiles,
  changesets,
  packageJsonChanged,
}) {
  const changed = new Map();
  for (const file of changedFiles) {
    const name = shippedPackage(file, packageJsonChanged);
    if (name) changed.set(name, [...(changed.get(name) ?? []), file]);
  }
  if (changesets.some((changeset) => changeset.releases.length === 0))
    return [];
  const named = new Set(
    changesets.flatMap((changeset) => changeset.releases.map((r) => r.name)),
  );
  return [...changed]
    .filter(([name]) => !named.has(name))
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
  const parse = createRequire(
    createRequire(import.meta.url).resolve("@changesets/cli"),
  )("@changesets/parse").default;
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
    return CONSUMER_FIELDS.some(
      (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    );
  };
  const missing = missingChangesets({
    changedFiles,
    changesets,
    packageJsonChanged,
  });
  if (missing.length === 0) {
    console.log(
      `Changesets: every published change since ${base} is described (${changesets.length} changeset(s)).`,
    );
    return;
  }
  for (const { name, files } of missing) {
    console.error(
      `${name} ships changes with no changeset naming it:\n  ${files.join("\n  ")}`,
    );
  }
  console.error(
    "\nAdd one with `pnpm changeset` (see CONTRIBUTING.md, Changesets). If this pull request " +
      "genuinely needs no release, add an empty one: `pnpm changeset --empty`.",
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
