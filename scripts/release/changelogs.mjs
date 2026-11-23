// Every changelog says the version its package is at.
//
// A version PR writes each npm package's CHANGELOG.md through Changesets, and
// `@kozmos-ds/vue`'s by hand (docs/release-process.md, "Releasing a `next`").
// The SwiftUI and Compose changelogs are written by hand too: their changes
// collect under "Unreleased" and the version PR cuts them as
// "## <React's version> — repository snapshot". Nothing held that, and
// 0.14.0 to 0.17.0 shipped with no snapshot cut. The Releases guide in
// Storybook reads these files, so a missed heading is a missed release there.
import fs from "node:fs";
import path from "node:path";

export const NPM_PACKAGES = [
  "react",
  "styles",
  "tokens",
  "icons",
  "product-contracts",
  "vue",
];
export const NATIVE_PACKAGES = ["ios", "android"];

// A React version PR moves Vue to the next `-next.0` with no section of its
// own (docs/release-process.md, "The `next` channel"): Vue's section is
// written by its own plan PR, so it is held only when the plan publishes it.
const PLANNED_ONLY = new Set(["vue"]);

/** The `## ` headings' words, in file order. */
export function headings(text) {
  return [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/**
 * What is wrong, given each package's `{ version, changelog }` by folder name:
 * an npm package whose newest heading is not its version, and a native one
 * with no snapshot of React's version. `plan` is release/plan.json.
 */
export function changelogProblems(packages, plan = { packages: [] }) {
  const problems = [];
  const planned = new Map(plan.packages.map((p) => [p.name, p.version]));
  for (const name of NPM_PACKAGES) {
    const pkg = packages[name];
    if (!pkg) continue;
    if (
      PLANNED_ONLY.has(name) &&
      planned.get(`@kozmos-ds/${name}`) !== pkg.version
    )
      continue;
    const newest = headings(pkg.changelog)[0];
    if (newest !== pkg.version)
      problems.push(
        `packages/${name}/CHANGELOG.md: the newest heading is ${newest === undefined ? "missing" : `"${newest}"`}, but the package is at ${pkg.version}`,
      );
  }
  const react = packages.react?.version;
  for (const name of NATIVE_PACKAGES) {
    const pkg = packages[name];
    if (!pkg || !react) continue;
    const snapshot = `${react} — repository snapshot`;
    if (!headings(pkg.changelog).includes(snapshot))
      problems.push(
        `packages/${name}/CHANGELOG.md has no "## ${snapshot}": cut what is under Unreleased into it in React ${react}'s version PR`,
      );
  }
  return problems;
}

/** The repository's packages, read from `root`. */
export function readPackages(root) {
  const packages = {};
  for (const name of [...NPM_PACKAGES, ...NATIVE_PACKAGES]) {
    const dir = path.join(root, "packages", name);
    const changelog = fs.readFileSync(path.join(dir, "CHANGELOG.md"), "utf8");
    const manifest = path.join(dir, "package.json");
    const version = fs.existsSync(manifest)
      ? JSON.parse(fs.readFileSync(manifest, "utf8")).version
      : null;
    packages[name] = { version, changelog };
  }
  return packages;
}

/** The repository's release/plan.json. */
export function readPlan(root) {
  return JSON.parse(
    fs.readFileSync(path.join(root, "release", "plan.json"), "utf8"),
  );
}
