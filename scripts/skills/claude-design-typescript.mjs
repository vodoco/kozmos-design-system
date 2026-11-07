/**
 * The one TypeScript setup the Claude Design docs are read and checked with.
 *
 * Examples are compiled as modules that sit inside packages/react, so that
 * `@kozmos-ds/react` resolves the way it does for an app: through the
 * package's own `exports` (a self-reference) to the built `dist/index.d.mts`,
 * and `react`, `@kozmos-ds/icons` and `@kozmos-ds/product-contracts` resolve
 * to what the package itself depends on. They are never written there: the
 * host serves them from memory, so a check leaves no file behind.
 *
 * React's types are the ones packages/react is built against, wherever they
 * are imported from. A declarations file in node_modules that imports
 * `react` and has no @types/react of its own (framer-motion's, which
 * DynamicIsland's props extend) would otherwise get whichever @types/react
 * pnpm hoisted into node_modules/.pnpm/node_modules, and the lockfile holds
 * two: one install read React 19's DOM events into DynamicIsland's props and
 * another did not, so the Vue bridge's part-takes.ts was fresh on one CI run
 * and stale on the next (main, 7 Nov). `paths` sends every `react` and
 * `react-dom` import to packages/react's own, `typeRoots` does the same for a
 * `/// <reference types>`, and the host refuses any other copy, so a program
 * here reads one React whatever was hoisted and wherever it is run.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export { ts };

/** Where the in-memory examples pretend to live. Nothing is written here. */
export const exampleDirectory = (root) =>
  path.join(root, "packages/react/.claude-design-examples");

const REPOSITORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * The real directory of each React types package packages/react resolves:
 * the copy every program here reads.
 */
export const PINNED_REACT_TYPES = Object.fromEntries(
  ["@types/react", "@types/react-dom"].map((name) => [
    name,
    fs.realpathSync(
      path.dirname(
        createRequire(
          path.join(REPOSITORY, "packages/react/package.json"),
        ).resolve(`${name}/package.json`),
      ),
    ),
  ]),
);

const pinnedPaths = Object.fromEntries(
  Object.entries({ react: "@types/react", "react-dom": "@types/react-dom" })
    .map(([module, types]) => [
      [module, [PINNED_REACT_TYPES[types]]],
      [`${module}/*`, [path.join(PINNED_REACT_TYPES[types], "*")]],
    ])
    .flat(),
);

/**
 * The React types package `file` belongs to, if it is a copy other than the
 * pinned one: what the host refuses.
 */
export function unpinnedReactTypes(file) {
  const match = /[\\/]node_modules[\\/](@types[\\/]react(?:-dom)?)[\\/]/.exec(
    file,
  );
  if (!match) return null;
  const name = match[1].replace("\\", "/");
  const real = (() => {
    try {
      return fs.realpathSync(file);
    } catch {
      return file;
    }
  })();
  const pinned = PINNED_REACT_TYPES[name];
  return real.startsWith(pinned + path.sep) ? null : name;
}

export const compilerOptions = {
  strict: true,
  noEmit: true,
  noUnusedLocals: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  // The declarations are the package's; checking them is
  // check-package-install's job, against the tarballs. Only the examples are
  // under test here.
  skipLibCheck: true,
  types: [],
  // One React, packages/react's: see the head of this file. `paths` answers
  // `import … from "react"`; `typeRoots` answers `/// <reference
  // types="react" />`, which `paths` does not, and whose default roots are
  // the `node_modules/@types` folders above the current directory, so a run
  // from the repository's root and one from packages/vue read different
  // copies.
  paths: pinnedPaths,
  typeRoots: [
    ...new Set(
      Object.values(PINNED_REACT_TYPES).map((dir) => path.dirname(dir)),
    ),
  ],
};

// Parsed once per process: every program here reads the same lib, React and
// declaration files, and parsing them is most of what a program costs.
const parsed = new Map();

/** How a file is parsed, by its extension: a `.ts` file is not JSX. */
export const scriptKindOf = (file) =>
  /\.[mc]?ts$/.test(file)
    ? ts.ScriptKind.TS
    : /\.[mc]?js$/.test(file)
      ? ts.ScriptKind.JS
      : /\.jsx$/.test(file)
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TSX;

/** A compiler host that serves `virtual` (path → text) from memory. */
export function hostWith(virtual = new Map(), options = compilerOptions) {
  const host = ts.createCompilerHost(options, true);
  const { fileExists, readFile, getSourceFile, directoryExists } = host;
  // Module resolution gives up on a relative import whose directory does not
  // exist, and the virtual files' directories never do.
  const directories = new Set();
  for (const file of virtual.keys())
    for (let dir = path.dirname(file); !directories.has(dir); ) {
      directories.add(dir);
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  host.directoryExists = (dir) =>
    directories.has(dir) ||
    (directoryExists
      ? directoryExists.call(host, dir)
      : ts.sys.directoryExists(dir));
  host.fileExists = (file) => virtual.has(file) || fileExists.call(host, file);
  host.readFile = (file) =>
    virtual.has(file) ? virtual.get(file) : readFile.call(host, file);
  host.getSourceFile = (file, language, onError, create) => {
    const stray = unpinnedReactTypes(file);
    if (stray)
      throw new Error(
        `${file} is a copy of ${stray} other than packages/react's (${PINNED_REACT_TYPES[stray]}): a program here must read one React. Map the import that reached it in claude-design-typescript.mjs's \`paths\`.`,
      );
    if (virtual.has(file))
      return ts.createSourceFile(
        file,
        virtual.get(file),
        language,
        true,
        scriptKindOf(file),
      );
    const version =
      typeof language === "object" ? language.languageVersion : language;
    const key = `${file}\0${version}`;
    if (!parsed.has(key))
      parsed.set(
        key,
        getSourceFile.call(host, file, language, onError, create),
      );
    return parsed.get(key);
  };
  return host;
}

/** A diagnostic as one line: `file:line:col TS1234 message`. */
export function formatDiagnostic(diagnostic, root) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
  if (!diagnostic.file) return `TS${diagnostic.code} ${message}`;
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  return `${path.relative(root, diagnostic.file.fileName)}:${line + 1}:${character + 1} TS${diagnostic.code} ${message}`;
}

/**
 * Type-checks each of `modules` (name → source) as a file of its own, the way
 * an app holds it, and returns each one's diagnostics by name. A module is
 * a `.tsx` file unless `extensionOf(name)` says otherwise, and `options`
 * adjusts the compiler options for the whole set.
 */
export function compileModules(
  root,
  modules,
  { extensionOf = () => ".tsx", options = {} } = {},
) {
  const dir = exampleDirectory(root);
  const virtual = new Map();
  const nameOf = new Map();
  for (const [name, source] of modules) {
    const file = path.join(dir, `${name}${extensionOf(name)}`);
    virtual.set(file, source);
    nameOf.set(file, name);
  }
  const program = ts.createProgram({
    rootNames: [...virtual.keys()],
    options: { ...compilerOptions, ...options },
    host: hostWith(virtual, { ...compilerOptions, ...options }),
  });
  const result = new Map([...modules.keys()].map((name) => [name, []]));
  const global = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ].map((diagnostic) => formatDiagnostic(diagnostic, root));
  for (const [file, name] of nameOf) {
    const source = program.getSourceFile(file);
    result
      .get(name)
      .push(
        ...global,
        ...[
          ...program.getSyntacticDiagnostics(source),
          ...program.getSemanticDiagnostics(source),
        ].map((diagnostic) => formatDiagnostic(diagnostic, root)),
      );
  }
  return result;
}
