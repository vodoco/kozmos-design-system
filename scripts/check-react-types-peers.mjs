#!/usr/bin/env node
/**
 * Every installed package whose declarations use React's types reads its
 * importer's copy, never the one pnpm hoisted.
 *
 * A package whose declarations import or reference `react` (or `react-dom`)
 * and declare no @types/react (or @types/react-dom) of their own is linked
 * once for every importer, with no copy beside it, so TypeScript answers its
 * import through the hidden hoist, node_modules/.pnpm/node_modules/@types/
 * react. One lockfile can fill that with 18.3.28 on one install and 19.2.14
 * on the next: main went red after #489 (7 Nov 2026) when DynamicIsland's
 * props, which extend framer-motion's, read React 19's events on main's CI and
 * not on the pull request's. The root package.json's `pnpm.packageExtensions`
 * gives each such package an optional peer, as Radix declares it, so pnpm
 * links it per importer with that importer's types beside it.
 *
 * This fails when a package that uses React's types has no
 * node_modules/.pnpm/<folder>/node_modules/@types/react (or react-dom) linked
 * beside it, and when an extension names no installed package. It reads the
 * link, not the folder's name: @xstate/react's and
 * storybook-addon-performance's names carried `@types+react@18.3.28` through
 * a child's peer while nothing was linked inside them.
 *
 * Usage: node scripts/check-react-types-peers.mjs [repository root]
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const semver = require("semver");

const REPOSITORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Each module, and the types package that answers it. */
export const TYPES = { react: "@types/react", "react-dom": "@types/react-dom" };

/**
 * `from "react"`, `import("react")`, `import "react"`, `require("react")`
 * and `/// <reference types="react" />`, subpaths included (`react/jsx-runtime`,
 * `react-dom/client`).
 */
const usesModule = (module) => {
  const spec = `["']${module}(?:/[^"'\\s]*)?["']`;
  return new RegExp(
    [
      `\\bfrom\\s*${spec}`,
      `\\bimport\\s*\\(\\s*${spec}\\s*\\)`,
      `\\bimport\\s+${spec}`,
      `\\brequire\\s*\\(\\s*${spec}\\s*\\)`,
      `///\\s*<reference\\s+types\\s*=\\s*${spec}`,
    ].join("|"),
  );
};
const PATTERNS = Object.entries(TYPES).map(([module, types]) => [
  usesModule(module),
  types,
]);

/** The package a node_modules/.pnpm folder holds (`@scope+name@1.0.0_…`). */
export function packageOfFolder(folder) {
  const at = folder.startsWith("@")
    ? folder.indexOf("@", 1)
    : folder.indexOf("@");
  return at > 0 ? folder.slice(0, at).replace("+", "/") : null;
}

/** A package's declaration files, not those of the packages inside it. */
function* declarations(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* declarations(full);
    else if (entry.isFile() && /\.d\.[mc]?ts$/.test(entry.name)) yield full;
  }
}

/**
 * Every installed package, by name, with its versions; and each one whose
 * declarations use React's types with no copy of them linked beside it.
 */
export function scan(root) {
  const store = path.join(root, "node_modules/.pnpm");
  if (!fs.existsSync(store))
    throw new Error(`${store} is missing: run pnpm install first.`);
  const installed = new Map();
  const unlinked = [];
  const usingReact = new Set();
  for (const entry of fs.readdirSync(store, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;
    const name = packageOfFolder(entry.name);
    if (!name) continue;
    const linked = path.join(store, entry.name, "node_modules");
    const dir = path.join(linked, name);
    let version;
    try {
      ({ version } = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf8"),
      ));
    } catch {
      continue;
    }
    if (!installed.has(name)) installed.set(name, new Set());
    installed.get(name).add(version);
    if (Object.values(TYPES).includes(name)) continue;
    const needs = new Set();
    for (const file of declarations(dir)) {
      const text = fs.readFileSync(file, "utf8");
      for (const [pattern, types] of PATTERNS)
        if (pattern.test(text)) needs.add(types);
      if (needs.size === PATTERNS.length) break;
    }
    if (needs.size) usingReact.add(`${name}@${version}`);
    const absent = [...needs].filter(
      (types) => !fs.existsSync(path.join(linked, types)),
    );
    if (absent.length)
      unlinked.push({ name, version, folder: entry.name, absent });
  }
  return { installed, unlinked, usingReact };
}

/** The `pnpm.packageExtensions` keys (`name` or `name@range`) nothing installed matches. */
export function staleExtensions(extensions, installed) {
  return Object.keys(extensions ?? {}).filter((key) => {
    const at = key.startsWith("@") ? key.indexOf("@", 1) : key.indexOf("@");
    const name = at > 0 ? key.slice(0, at) : key;
    const range = at > 0 ? key.slice(at + 1) : "*";
    return ![...(installed.get(name) ?? [])].some((version) =>
      semver.satisfies(version, range, { includePrerelease: true }),
    );
  });
}

function main() {
  const root = path.resolve(process.argv[2] ?? REPOSITORY);
  const { pnpm } = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const extensions = pnpm?.packageExtensions ?? {};
  const { installed, unlinked, usingReact } = scan(root);
  const stale = staleExtensions(extensions, installed);
  const problems = [];
  if (unlinked.length) {
    const byPackage = new Map();
    for (const { name, version, folder, absent } of unlinked) {
      const key = `${name}@${version}`;
      if (!byPackage.has(key))
        byPackage.set(key, { absent: new Set(), folders: [] });
      for (const types of absent) byPackage.get(key).absent.add(types);
      byPackage.get(key).folders.push(folder);
    }
    problems.push(
      `${byPackage.size} package(s) in ${unlinked.length} folder(s) use React's types with none of their own linked beside them, so they read whichever copy pnpm hoisted:`,
      ...[...byPackage].map(
        ([key, { absent, folders }]) =>
          `  ${key}: no ${[...absent].join(" or ")} (${folders.join(", ")})`,
      ),
      `Give each an optional peer in the root package.json's pnpm.packageExtensions, as Radix declares it ({"peerDependencies": {"@types/react": "*"}, "peerDependenciesMeta": {"@types/react": {"optional": true}}}), and run pnpm install. If one still has none linked, its importer declares no @types/react. docs/design-system-maintenance.md, "Dependency overrides and pins", has the reasons.`,
    );
  }
  if (stale.length)
    problems.push(
      `${stale.length} pnpm.packageExtensions entr${stale.length === 1 ? "y matches" : "ies match"} no installed package: ${stale.join(", ")}. Remove ${stale.length === 1 ? "it" : "them"}, or scope ${stale.length === 1 ? "it" : "them"} to what is installed.`,
    );
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(
    `React's types: each of the ${usingReact.size} installed packages whose declarations use them has its own linked, and each of the ${Object.keys(extensions).length} package extensions matches an installed package.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
