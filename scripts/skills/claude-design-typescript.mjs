/**
 * The one TypeScript setup the Claude Design docs are read and checked with.
 *
 * Examples are compiled as modules that sit inside packages/react, so that
 * `@kozmos-ds/react` resolves the way it does for an app: through the
 * package's own `exports` (a self-reference) to the built `dist/index.d.mts`,
 * and `react`, `@kozmos-ds/icons` and `@kozmos-ds/product-contracts` resolve
 * to what the package itself depends on. They are never written there: the
 * host serves them from memory, so a check leaves no file behind.
 */
import path from "node:path";
import ts from "typescript";

export { ts };

/** Where the in-memory examples pretend to live. Nothing is written here. */
export const exampleDirectory = (root) =>
  path.join(root, "packages/react/.claude-design-examples");

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
};

// Parsed once per process: every program here reads the same lib, React and
// declaration files, and parsing them is most of what a program costs.
const parsed = new Map();

/** A compiler host that serves `virtual` (path → text) from memory. */
export function hostWith(virtual = new Map(), options = compilerOptions) {
  const host = ts.createCompilerHost(options, true);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (file) => virtual.has(file) || fileExists.call(host, file);
  host.readFile = (file) =>
    virtual.has(file) ? virtual.get(file) : readFile.call(host, file);
  host.getSourceFile = (file, language, onError, create) => {
    if (virtual.has(file))
      return ts.createSourceFile(
        file,
        virtual.get(file),
        language,
        true,
        ts.ScriptKind.TSX,
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
 * an app holds it, and returns each one's diagnostics by name.
 */
export function compileModules(root, modules) {
  const dir = exampleDirectory(root);
  const virtual = new Map();
  const nameOf = new Map();
  for (const [name, source] of modules) {
    const file = path.join(dir, `${name}.tsx`);
    virtual.set(file, source);
    nameOf.set(file, name);
  }
  const program = ts.createProgram({
    rootNames: [...virtual.keys()],
    options: compilerOptions,
    host: hostWith(virtual),
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
