/**
 * What an app pays for one icon.
 *
 * Every icon is its own export, so an app that imports one should ship one. This bundles a
 * consumer that imports a few exports from the built package the way an app's build does:
 * with Rollup and with esbuild, the versions Vite ships, with tree-shaking on, package.json's
 * `sideEffects` honoured and React left to the app. It then checks two things: the icons that
 * survive are exactly the ones asked for, and one icon stays under a ceiling in bytes.
 *
 * Until 2026-09-29 one icon cost 11.5 to 13 KB gzip, 33 to 36 KB minified, because all 56
 * of the registry's icons came with it. `kozmosIconRegistry` was built at module scope by
 * `Object.fromEntries(kozmosIconDefinitions.map(...))`, and only the outer call was marked
 * `@__PURE__`. A pure mark covers its own call, not the calls in its arguments, so both
 * bundlers kept the `.map`, and with it the definitions and every component they name.
 *
 * It reads the built package, so build first: `pnpm test` does, through turbo.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

// Measured on 2026-09-29, each of the 1,179 icons bundled alone, factory included: median
// 0.58 KB gzip, the heaviest (Settings01) 1.88 KB, Check 0.38 KB. The registry's 56 cost 11.5 KB.
const MAX_ONE_ICON_GZIP_KB = 2;

const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8"),
);
const ENTRY = path.join(PACKAGE_DIR, manifest.exports["."].import.default);

// Rollup and esbuild as Vite ships them, which is what an app's build runs.
const requireFromPackage = createRequire(
  path.join(PACKAGE_DIR, "package.json"),
);
const requireFromVite = createRequire(
  requireFromPackage.resolve("vite/package.json"),
);
const { rollup } = requireFromVite("rollup");
const esbuild = requireFromVite("esbuild");

const isReact = (id) => id === "react" || id.startsWith("react/");
const isIcon = (value) =>
  value !== null &&
  typeof value === "object" &&
  typeof value.render === "function" &&
  typeof value.displayName === "string";

let work;
let iconNames;
let registryNames;

before(async () => {
  assert.ok(
    fs.existsSync(ENTRY),
    `${path.relative(PACKAGE_DIR, ENTRY)} is missing: build the package first (pnpm --filter @kozmos-ds/icons build)`,
  );
  // Every icon the package exports, by the name it gives itself. Each factory is called with
  // that name as a string, so the name is in a bundle exactly when the icon is.
  const built = await import(pathToFileURL(ENTRY).href);
  iconNames = Object.values(built)
    .filter(isIcon)
    .map((icon) => icon.displayName);
  registryNames = Object.values(built.kozmosIconRegistry).map(
    (icon) => icon.displayName,
  );
  assert.ok(
    iconNames.length > 1000,
    `only ${iconNames.length} icons found in the build`,
  );

  // An app resolves the package from node_modules: through `exports`, with `sideEffects`.
  work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-icons-tree-shaking-"));
  fs.mkdirSync(path.join(work, "node_modules", "@kozmos-ds"), {
    recursive: true,
  });
  fs.symlinkSync(
    PACKAGE_DIR,
    path.join(work, "node_modules", "@kozmos-ds", "icons"),
    "dir",
  );
});

after(() => {
  if (work) fs.rmSync(work, { recursive: true, force: true });
});

function consumer(imports) {
  const file = path.join(work, `${imports.join("_")}.mjs`);
  fs.writeFileSync(
    file,
    `import { ${imports.join(", ")} } from "@kozmos-ds/icons";\nconsole.log(${imports.join(", ")});\n`,
  );
  return file;
}

const bundlers = {
  // As a Vite app builds: Rollup, then its minifier, esbuild.
  async rollup(input) {
    const bundle = await rollup({
      input,
      external: isReact,
      onwarn: () => {},
      plugins: [
        {
          // What Vite's resolver gives Rollup for the package: its `import` entry, and
          // whether package.json declares that entry free of side effects.
          name: "resolve-kozmos-icons",
          resolveId(id) {
            if (id !== "@kozmos-ds/icons") return null;
            return {
              id: ENTRY,
              moduleSideEffects: manifest.sideEffects !== false,
            };
          },
        },
      ],
    });
    const { output } = await bundle.generate({ format: "es" });
    await bundle.close();
    const code = output.map((chunk) => chunk.code ?? "").join("\n");
    return (await esbuild.transform(code, { minify: true, format: "esm" }))
      .code;
  },
  async esbuild(input) {
    const result = await esbuild.build({
      entryPoints: [input],
      bundle: true,
      write: false,
      format: "esm",
      minify: true,
      platform: "browser",
      external: ["react", "react/*"],
      logLevel: "silent",
    });
    return result.outputFiles[0].text;
  },
};

function survivors(code) {
  return iconNames
    .filter((name) => code.includes(`"${name}"`) || code.includes(`'${name}'`))
    .sort();
}

function describeLeak(kept, wanted) {
  const extra = kept.filter((name) => !wanted.includes(name));
  const inRegistry = extra.filter((name) =>
    registryNames.includes(name),
  ).length;
  return `${kept.length} icons survived where ${wanted.length} were imported: ${extra.length} extra (${extra.slice(0, 6).join(", ")}${extra.length > 6 ? ", …" : ""}), ${inRegistry} of them from the registry`;
}

const kb = (bytes) => (bytes / 1024).toFixed(2);

const CASES = [
  // An outline the registry names, one it does not, and the package's own two factories.
  { imports: ["Check"], keeps: ["Check"], ceiling: true },
  { imports: ["AlignBottom01"], keeps: ["AlignBottom01"], ceiling: true },
  { imports: ["Accessibility"], keeps: ["Accessibility"], ceiling: true },
  { imports: ["LocationHeading"], keeps: ["LocationHeading"], ceiling: true },
  { imports: ["SearchMd", "XClose"], keeps: ["SearchMd", "XClose"] },
  // The names and the aliases are data: they reach no icon at all.
  {
    imports: ["kozmosIconNames", "kozmosIconAliases", "resolveIconName"],
    keeps: [],
  },
];

for (const [bundler, bundle] of Object.entries(bundlers)) {
  describe(`${bundler}: an app keeps only the icons it imports`, () => {
    const bundled = new Map();
    const bundleOf = (imports) => {
      const key = imports.join(",");
      if (!bundled.has(key)) bundled.set(key, bundle(consumer(imports)));
      return bundled.get(key);
    };

    for (const { imports, keeps, ceiling } of CASES) {
      const statement = `import { ${imports.join(", ")} }`;
      test(`${statement} keeps ${keeps.length ? keeps.join(" and ") : "no icon"}`, async () => {
        const kept = survivors(await bundleOf(imports));
        assert.deepEqual(kept, [...keeps].sort(), describeLeak(kept, keeps));
      });
      if (ceiling) {
        test(`${statement} costs at most ${MAX_ONE_ICON_GZIP_KB} KB gzip`, async () => {
          const code = await bundleOf(imports);
          const gzip = gzipSync(code).length;
          assert.ok(
            gzip <= MAX_ONE_ICON_GZIP_KB * 1024,
            `one icon costs ${kb(gzip)} KB gzip (${kb(code.length)} KB minified), over ${MAX_ONE_ICON_GZIP_KB} KB`,
          );
        });
      }
    }

    // The control: a lookup by name needs every icon it can name, so these survive by design.
    // It also proves the count above can see icons when they are there.
    test("import { getIconComponent } keeps the whole registry, by design", async () => {
      const kept = survivors(await bundleOf(["getIconComponent"]));
      assert.deepEqual(kept, [...registryNames].sort());
    });
  });
}
