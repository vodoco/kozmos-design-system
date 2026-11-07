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
const ts = require("typescript");
const YAML = require("yaml");

const REPOSITORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Each module, and the types package that answers it. */
export const TYPES = { react: "@types/react", "react-dom": "@types/react-dom" };

/**
 * The React types a declarations file uses: what TypeScript's own
 * preprocessor reads as an import, a `/// <reference types>` or a `declare
 * module` of `react` or `react-dom` (subpaths included), never a mention in
 * a comment. Only declarations are read: this guards what TypeScript sees,
 * not what a bundler runs.
 */
export function reactTypesUsedBy(text) {
  const { importedFiles, typeReferenceDirectives, ambientExternalModules } =
    ts.preProcessFile(text, true, true);
  const names = [
    ...importedFiles.map((ref) => ref.fileName),
    ...typeReferenceDirectives.map((ref) => ref.fileName),
    ...(ambientExternalModules ?? []),
  ];
  const used = new Set();
  for (const [module, types] of Object.entries(TYPES))
    if (names.some((name) => name === module || name.startsWith(`${module}/`)))
      used.add(types);
  return used;
}

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
 * The node_modules/.pnpm folders this install uses: those each importer's
 * node_modules links to (the importers are in node_modules/.pnpm/lock.yaml,
 * the lockfile pnpm last installed), and those their folders link to in
 * turn. A folder an earlier install left behind is never reached: installing
 * one lockfile over another removes nothing.
 */
export function reachedFolders(root) {
  const store = fs.realpathSync(path.join(root, "node_modules/.pnpm"));
  const { importers = {} } =
    YAML.parse(fs.readFileSync(path.join(store, "lock.yaml"), "utf8")) ?? {};
  const reached = new Set();
  const queue = [];
  const follow = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const link = path.join(dir, entry.name);
      if (entry.name.startsWith("@") && entry.isDirectory()) {
        follow(link);
        continue;
      }
      if (!entry.isSymbolicLink()) continue;
      let target;
      try {
        target = fs.realpathSync(link);
      } catch {
        continue;
      }
      if (!target.startsWith(store + path.sep)) continue;
      const folder = path.relative(store, target).split(path.sep)[0];
      if (!reached.has(folder)) {
        reached.add(folder);
        queue.push(folder);
      }
    }
  };
  for (const importer of Object.keys(importers))
    follow(path.join(root, importer, "node_modules"));
  while (queue.length) follow(path.join(store, queue.shift(), "node_modules"));
  return reached;
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
  for (const folder of reachedFolders(root)) {
    const name = packageOfFolder(folder);
    if (!name) continue;
    const linked = path.join(store, folder, "node_modules");
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
      for (const types of reactTypesUsedBy(fs.readFileSync(file, "utf8")))
        needs.add(types);
      if (needs.size === Object.keys(TYPES).length) break;
    }
    if (needs.size) usingReact.add(`${name}@${version}`);
    const absent = [...needs].filter(
      (types) => !fs.existsSync(path.join(linked, types)),
    );
    if (absent.length) unlinked.push({ name, version, folder, absent });
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
      `Give each an optional peer in the root package.json's pnpm.packageExtensions, as Radix declares it ({"peerDependencies": {"@types/react": "*"}, "peerDependenciesMeta": {"@types/react": {"optional": true}}}), and run pnpm install. If one still has none linked, its importer declares no @types/react. A folder no install uses would not be listed; if one is, remove node_modules and reinstall. docs/design-system-maintenance.md, "Dependency overrides and pins", has the reasons.`,
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
