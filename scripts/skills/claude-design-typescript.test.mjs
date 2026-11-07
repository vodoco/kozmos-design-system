/**
 * The TypeScript setup reads one React: packages/react's own types, whatever
 * pnpm hoisted (claude-design-typescript.mjs). On 7 Nov main's CI install
 * hoisted @types/react 19 where the pull request's had hoisted 18, and the
 * Vue bridge's part-takes.ts, read through this setup, went stale on main.
 *
 * The root package.json's packageExtensions now link framer-motion with its
 * importer's @types/react, so on this install nothing reaches the hoist.
 * The tests that matter here therefore make their own: a host that hides
 * every copy of React's types but the pinned one and plants a decoy at
 * node_modules/.pnpm/node_modules, where the hoist sits, so they hold on any
 * install, the one that broke main included.
 *
 * They need the built declarations: `pnpm --filter "@kozmos-ds/react..." build`.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  PINNED_REACT_SUBPATHS,
  PINNED_REACT_TYPES,
  compileModules,
  compilerOptions,
  hostWith,
  ts,
  unpinnedReactTypes,
} from "./claude-design-typescript.mjs";
import { DECLARATIONS } from "./claude-design-api.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const HOIST = path.join(ROOT, "node_modules/.pnpm/node_modules");
const MODULES = { "@types/react": "react", "@types/react-dom": "react-dom" };

/** framer-motion's declarations, as packages/react installs them. */
const FRAMER_MOTION = fs.realpathSync(
  path.join(ROOT, "packages/react/node_modules/framer-motion/dist/index.d.ts"),
);

/**
 * A host on which the only copies of React's types are the pinned ones and a
 * decoy of each at the hoist: framer-motion's own @types/react, and every
 * other, is out of sight, as on an install that links none beside it. The
 * decoy exports each subpath the pinned package does, each a file of its own.
 * Its current directory is the repository's root, whose node_modules/@types
 * holds no React, so a default type root cannot answer for `typeRoots`.
 */
function decoyHost() {
  const virtual = new Map();
  const decoyFiles = new Map();
  for (const [name, module] of Object.entries(MODULES)) {
    const dir = path.join(HOIST, name);
    const { exports } = JSON.parse(
      fs.readFileSync(
        path.join(PINNED_REACT_TYPES[name], "package.json"),
        "utf8",
      ),
    );
    const decoyExports = {};
    for (const key of Object.keys(exports)) {
      if (key === "./package.json") continue;
      const file = `./decoy${key === "." ? "" : key.slice(1).replaceAll("/", "-")}.d.ts`;
      decoyExports[key] = { types: file };
      const full = path.join(dir, file);
      virtual.set(full, "export declare const decoy: true;\n");
      decoyFiles.set(module + key.slice(1), full);
    }
    virtual.set(
      path.join(dir, "package.json"),
      JSON.stringify({ name, version: "0.0.0-decoy", exports: decoyExports }),
    );
  }
  const decoyDirs = Object.keys(MODULES).map((name) => path.join(HOIST, name));
  const underDecoy = (p) =>
    decoyDirs.some((dir) => p === dir || p.startsWith(dir + path.sep));
  const reactTypes =
    /[\\/]node_modules[\\/]@types[\\/]react(?:-dom)?(?:[\\/]|$)/;
  const pinned = Object.values(PINNED_REACT_TYPES);
  const visible = (p) =>
    !reactTypes.test(p) ||
    virtual.has(p) ||
    (underDecoy(p)
      ? false
      : pinned.some((dir) => p === dir || p.startsWith(dir + path.sep)));
  const host = hostWith(virtual);
  const { fileExists, readFile, directoryExists, realpath } = host;
  host.fileExists = (p) => visible(p) && fileExists.call(host, p);
  host.readFile = (p) => (visible(p) ? readFile.call(host, p) : undefined);
  host.directoryExists = (p) =>
    (underDecoy(p) || visible(p)) && directoryExists.call(host, p);
  // The decoy sits where the real hoist does: keep its files' own names.
  host.realpath = (p) => (underDecoy(p) ? p : realpath.call(host, p));
  host.getCurrentDirectory = () => ROOT;
  return { host, decoyFiles };
}

/** What `options` resolves `specifier` to from `file`, by import and by reference. */
function resolve(specifier, file, options, host) {
  return {
    imported: ts.resolveModuleName(specifier, file, options, host)
      .resolvedModule?.resolvedFileName,
    referenced: ts.resolveTypeReferenceDirective(specifier, file, options, host)
      .resolvedTypeReferenceDirective?.resolvedFileName,
  };
}

const withoutPin = (option) => {
  const options = { ...compilerOptions };
  delete options[option];
  return options;
};

const pinnedCopy = (file, name) =>
  file?.startsWith(PINNED_REACT_TYPES[name] + path.sep) ?? false;

test("the pinned React types are the versions the lockfile records for packages/react", () => {
  const lockfile = YAML.parse(
    fs.readFileSync(path.join(ROOT, "pnpm-lock.yaml"), "utf8"),
  );
  const importer = lockfile.importers["packages/react"];
  for (const name of Object.keys(MODULES)) {
    const entry =
      importer.devDependencies?.[name] ?? importer.dependencies?.[name];
    assert.ok(entry, `the lockfile records ${name} for packages/react`);
    const recorded = entry.version.replace(/\(.*$/, "");
    const pinned = JSON.parse(
      fs.readFileSync(
        path.join(PINNED_REACT_TYPES[name], "package.json"),
        "utf8",
      ),
    );
    assert.equal(pinned.name, name);
    assert.equal(
      pinned.version,
      recorded,
      `${name} pinned at the lockfile's ${recorded}`,
    );
  }
});

test("framer-motion's `react`, imported and referenced, reads the pinned copy and not the decoy at the hoist", () => {
  const { host, decoyFiles } = decoyHost();
  const decoy = decoyFiles.get("react");
  // The decoy is in reach: without the pin, TypeScript reads it.
  assert.equal(
    resolve("react", FRAMER_MOTION, withoutPin("paths"), host).imported,
    decoy,
    "without `paths`, the import reaches the decoy",
  );
  assert.equal(
    resolve("react", FRAMER_MOTION, withoutPin("typeRoots"), host).referenced,
    decoy,
    "without `typeRoots`, the reference reaches the decoy",
  );
  const { imported, referenced } = resolve(
    "react",
    FRAMER_MOTION,
    compilerOptions,
    host,
  );
  assert.ok(
    pinnedCopy(imported, "@types/react"),
    `import "react" reads ${imported}, not packages/react's`,
  );
  assert.ok(
    pinnedCopy(referenced, "@types/react"),
    `/// <reference types="react" /> reads ${referenced}, not packages/react's`,
  );
});

test("react-dom, react-dom/client and every other exported subpath, from a declarations file in node_modules, read the pinned copy", () => {
  const { host, decoyFiles } = decoyHost();
  assert.ok(PINNED_REACT_SUBPATHS["react-dom"]);
  assert.ok(PINNED_REACT_SUBPATHS["react-dom/client"]);
  for (const specifier of Object.keys(PINNED_REACT_SUBPATHS)) {
    const name = specifier.startsWith("react-dom")
      ? "@types/react-dom"
      : "@types/react";
    assert.equal(
      resolve(specifier, FRAMER_MOTION, withoutPin("paths"), host).imported,
      decoyFiles.get(specifier),
      `without \`paths\`, ${specifier} reaches the decoy`,
    );
    const { imported } = resolve(
      specifier,
      FRAMER_MOTION,
      compilerOptions,
      host,
    );
    assert.ok(
      pinnedCopy(imported, name),
      `${specifier} reads ${imported}, not packages/react's ${name}`,
    );
  }
  const { referenced } = resolve(
    "react-dom",
    FRAMER_MOTION,
    compilerOptions,
    host,
  );
  assert.ok(
    pinnedCopy(referenced, "@types/react-dom"),
    `/// <reference types="react-dom" /> reads ${referenced}`,
  );
});

test("`paths` maps the subpaths the pinned packages export, and no others", () => {
  const expected = [];
  for (const [name, module] of Object.entries(MODULES)) {
    const { exports } = JSON.parse(
      fs.readFileSync(
        path.join(PINNED_REACT_TYPES[name], "package.json"),
        "utf8",
      ),
    );
    for (const key of Object.keys(exports))
      if (key !== "./package.json") expected.push(module + key.slice(1));
  }
  assert.deepEqual(Object.keys(compilerOptions.paths).sort(), expected.sort());
  for (const specifier of ["react/jsx-runtime", "react-dom/client"])
    assert.ok(expected.includes(specifier), `${specifier} is exported`);
});

test("a deep import an app could not make does not resolve here either", () => {
  const modules = new Map([
    [
      "exported",
      `import { jsx } from "react/jsx-runtime";\nexport const j = jsx;\n`,
    ],
    [
      "index",
      `import { useState } from "react/index";\nexport const s = useState;\n`,
    ],
    [
      "withExtension",
      `import { jsx } from "react/jsx-runtime.js";\nexport const j = jsx;\n`,
    ],
    [
      "domFile",
      `import { createRoot } from "react-dom/client.js";\nexport const c = createRoot;\n`,
    ],
  ]);
  const diagnostics = compileModules(ROOT, modules, {
    extensionOf: () => ".ts",
  });
  assert.deepEqual(
    diagnostics.get("exported"),
    [],
    "react/jsx-runtime is exported",
  );
  for (const name of ["index", "withExtension", "domFile"])
    assert.ok(
      diagnostics.get(name).some((line) => / TS2307 /.test(line)),
      `${name}: ${diagnostics.get(name).join("; ") || "compiled"}`,
    );
});

test("a copy other than the pinned one is named, and the pinned one is not", () => {
  const pinned = path.join(PINNED_REACT_TYPES["@types/react"], "index.d.ts");
  assert.equal(unpinnedReactTypes(pinned), null);
  const other = path.join(
    ROOT,
    "node_modules/.pnpm/@types+react@0.0.0/node_modules/@types/react/index.d.ts",
  );
  assert.equal(unpinnedReactTypes(other), "@types/react");
  const otherDom = other.replace(
    `${path.sep}react${path.sep}index.d.ts`,
    `${path.sep}react-dom${path.sep}index.d.ts`,
  );
  assert.equal(unpinnedReactTypes(otherDom), "@types/react-dom");
  assert.equal(unpinnedReactTypes(path.join(ROOT, "src/react.d.ts")), null);
});

test("the host refuses another copy of React's types, and says which option sends each route home", () => {
  const host = hostWith();
  const other = path.join(
    ROOT,
    "node_modules/.pnpm/@types+react@0.0.0/node_modules/@types/react/index.d.ts",
  );
  assert.throws(
    () => host.getSourceFile(other, ts.ScriptTarget.Latest),
    (error) =>
      /other than packages\/react's/.test(error.message) &&
      /`paths` sends an import/.test(error.message) &&
      /`typeRoots` a `\/\/\/ <reference types>`/.test(error.message),
  );
});

test("an import that reaches another copy is refused by the file that made it", () => {
  const other = path.join(
    ROOT,
    "node_modules/.pnpm/@types+react@0.0.0/node_modules/@types/react/index.d.ts",
  );
  const importer = path.join(
    ROOT,
    "node_modules/.pnpm/importer@0.0.0/node_modules/importer/index.d.ts",
  );
  const host = hostWith(
    new Map([
      [other, "export declare const other: true;\n"],
      [
        importer,
        `import type { other } from "../../../@types+react@0.0.0/node_modules/@types/react/index.js";\nexport type Other = typeof other;\n`,
      ],
    ]),
  );
  assert.throws(
    () =>
      ts.createProgram({
        rootNames: [importer],
        options: compilerOptions,
        host,
      }),
    (error) =>
      error.message.startsWith(
        `${importer} imports "../../../@types+react@0.0.0`,
      ) &&
      error.message.includes(`resolves to ${other}`) &&
      /`paths` sends an import/.test(error.message),
  );
});

test("the published declarations, framer-motion's included, read only the pinned React", () => {
  const program = ts.createProgram({
    rootNames: [path.join(ROOT, DECLARATIONS)],
    options: compilerOptions,
    host: hostWith(),
  });
  const files = program.getSourceFiles().map((file) => file.fileName);
  const reactTypes = files.filter((file) =>
    /[\\/]@types[\\/]react[\\/]/.test(file),
  );
  assert.ok(reactTypes.length > 0, "React's types are read");
  for (const file of reactTypes)
    assert.ok(
      file.startsWith(PINNED_REACT_TYPES["@types/react"] + path.sep),
      `${file} is packages/react's`,
    );
  // framer-motion's declarations import `react`: the import the hoist used
  // to answer.
  assert.ok(
    files.some((file) => /[\\/]framer-motion[\\/]/.test(file)),
    "framer-motion's declarations are in the program",
  );
});
