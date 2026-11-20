import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build, type Rollup } from "vite";

// esbuild as Vite ships it, which is what a Vite app's build runs.
const esbuild = createRequire(
  createRequire(__filename).resolve("vite/package.json"),
)("esbuild") as {
  build: (
    options: Record<string, unknown>,
  ) => Promise<{ outputFiles: { text: string }[] }>;
};

/**
 * An app that imports one part ships that part (decision 227). This builds
 * a consumer that imports from the built package the way an app does: it
 * resolves `@kozmos-ds/vue` from node_modules, through package.json's
 * `exports`, with its `sideEffects` read for every file, by Vite (Rollup
 * with Vite's resolver) and by esbuild, with Vue, Reka UI and the class
 * helpers left to the app as its own. Then it reads what was kept.
 *
 * Until 20 Nov 2026 the main entry's ES build was one file with no
 * `sideEffects` declared, and every export alone cost the whole entry:
 * `import { KozmosButton }` kept KozmosBadge, KozmosThemeProvider and the
 * rest. It reads the built package, so build first: `pnpm test` does,
 * through turbo.
 */
const PACKAGE_DIR = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const theirs = Object.keys({
  ...manifest.dependencies,
  ...manifest.peerDependencies,
});
const isTheirs = (id: string) =>
  theirs.some((name) => id === name || id.startsWith(`${name}/`));

// What only one part's module carries: its name, quoted as its definition
// writes it (useTheme's error names the provider in a sentence), and a class
// only its recipe draws.
const MARKS = {
  KozmosButton: ['"KozmosButton"', "kozmos-button"],
  KozmosBadge: ['"KozmosBadge"', "h-badge-lg"],
  KozmosThemeProvider: ['"KozmosThemeProvider"'],
  KozmosSeparator: ['"KozmosSeparator"'],
  KozmosAnalyticsProvider: ['"KozmosAnalyticsProvider"'],
  bridge: ['"KozmosBridgeHost"'],
} as const;

let work: string;

beforeAll(() => {
  expect(
    fs.existsSync(path.join(PACKAGE_DIR, "dist/kozmos-vue.mjs")),
    "build the package first (pnpm --filter @kozmos-ds/vue build)",
  ).toBe(true);
  work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-vue-tree-shaking-"));
  fs.mkdirSync(path.join(work, "node_modules", "@kozmos-ds"), {
    recursive: true,
  });
  fs.symlinkSync(
    PACKAGE_DIR,
    path.join(work, "node_modules", "@kozmos-ds", "vue"),
    "dir",
  );
});

afterAll(() => {
  if (work) fs.rmSync(work, { recursive: true, force: true });
});

function consumer(imports: string[]) {
  const file = path.join(work, `${imports.join("_")}.mjs`);
  fs.writeFileSync(
    file,
    `import { ${imports.join(", ")} } from "@kozmos-ds/vue";\nconsole.log(${imports.join(", ")});\n`,
  );
  return file;
}

const bundlers: Record<string, (input: string) => Promise<string>> = {
  // A Vite app's production build.
  async vite(input) {
    const result = (await build({
      configFile: false,
      root: work,
      logLevel: "silent",
      mode: "production",
      build: {
        write: false,
        minify: false,
        lib: { entry: input, formats: ["es"], fileName: "app" },
        rollupOptions: { external: isTheirs },
      },
    })) as Rollup.RollupOutput[];
    return result
      .flatMap(({ output }) => output)
      .map((chunk) => (chunk.type === "chunk" ? chunk.code : ""))
      .join("\n");
  },
  async esbuild(input) {
    const result = await esbuild.build({
      entryPoints: [input],
      absWorkingDir: work,
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      external: theirs.flatMap((name) => [name, `${name}/*`]),
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });
    return result.outputFiles[0].text;
  },
};

const kept = (code: string) =>
  Object.entries(MARKS)
    .filter(([, marks]) => marks.some((mark) => code.includes(mark)))
    .map(([part]) => part)
    .sort();

describe.each(Object.entries(bundlers))(
  "%s: an app keeps only the parts it imports",
  (_, bundle) => {
    it("import { KozmosButton } keeps KozmosButton alone", async () => {
      expect(kept(await bundle(consumer(["KozmosButton"])))).toEqual([
        "KozmosButton",
      ]);
    }, 60_000);

    it("import { useTheme } keeps no part", async () => {
      expect(kept(await bundle(consumer(["useTheme"])))).toEqual([]);
    }, 60_000);

    // The control: the marks are found when the parts are there.
    it("import { KozmosBadge, KozmosSeparator } keeps both", async () => {
      expect(
        kept(await bundle(consumer(["KozmosBadge", "KozmosSeparator"]))),
      ).toEqual(["KozmosBadge", "KozmosSeparator"]);
    }, 60_000);
  },
);
