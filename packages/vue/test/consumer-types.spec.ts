import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * The declarations `@kozmos-ds/vue` ships type-check in a consumer that
 * checks its libraries' (`skipLibCheck: false`, `strict: true`): both
 * entries, reached through package.json's `exports`, as a bundler resolves
 * them and as Node's ESM and CommonJS do. test/consumer/ is that consumer;
 * a package resolves its own name through its own `exports`, so it reads
 * the built `dist` (`pnpm build`, which `test` depends on), as an app that
 * installed the package would.
 *
 * Until this, nothing compiled them so: every check here skipped library
 * types, and KozmosAnchoredPopover's declaration put Vue's
 * `GlobalComponents` where its own constraint refuses it (TS2344, twice).
 */
const CONSUMER = path.resolve(__dirname, "consumer");
const DIST = path.resolve(__dirname, "../dist");

/** The program a consumer's `tsc -p <config>` builds. */
function compile(config: string) {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    path.join(CONSUMER, config),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      },
    },
  )!;
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  return { options: parsed.options, program };
}

/** Each error, as `tsc` prints it: the file from the package, its line and column. */
const errors = (program: ts.Program) =>
  ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      " ",
    );
    if (!diagnostic.file) return message;
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start ?? 0,
    );
    const file = path.relative(
      path.resolve(__dirname, ".."),
      diagnostic.file.fileName,
    );
    return `${file}(${line + 1},${character + 1}): TS${diagnostic.code} ${message}`;
  });

describe("a consumer type-checks the built declarations, library types included", () => {
  it.each([
    ["a bundler's resolution", "tsconfig.json"],
    ["Node's ESM and CommonJS", "tsconfig.node16.json"],
  ])(
    "%s (%s)",
    (_, config) => {
      const { options, program } = compile(config);
      expect(options.skipLibCheck).toBe(false);
      expect(options.strict).toBe(true);
      // What it compiled is what ships: both entries' declarations, from dist.
      const files = program.getSourceFiles().map((file) => file.fileName);
      for (const entry of ["index.d.ts", "react-bridge/index.d.ts"])
        expect(files).toContain(path.join(fs.realpathSync(DIST), entry));
      expect(errors(program)).toEqual([]);
    },
    60_000,
  );
});
