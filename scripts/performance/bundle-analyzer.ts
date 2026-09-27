import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";
import { gzipSync } from "zlib";

// What an app pays for @kozmos-ds/react. The ES build is one file per module, and package.json
// declares the JavaScript free of side effects, so an app's bundler keeps only the modules behind
// what it imports. Each budget is measured the way a Vite app builds: Rollup, honouring the
// package's `sideEffects`, with its dependencies left out (they are the app's own), then minified
// and gzipped.
//
// - Every public export, bundled alone: the heaviest stays under MAX_EXPORT_GZIP_KB, so no one
//   component can quietly pull in the rest. On 2026-09-22 the heaviest was POIDetailPanel at
//   6.15 KB, and the median export 1.14 KB.
// - Button alone, under MAX_BUTTON_GZIP_KB: the canary for the per-module output itself. When the
//   ES build was one file, importing Button cost an app 48.7 KB, nearly the whole library.
// - Everything at once (54.6 KB on 2026-09-22), and the stylesheet (26.4 KB), which no bundler
//   trims.
//
// Until 2026-09-22 this held the one-file bundle to 300 KB raw and 70 KB gzip, because that was
// the cost of any import. Raise a budget only with the measurement that justifies it.
const MAX_EXPORT_GZIP_KB = 8;
const MAX_BUTTON_GZIP_KB = 2;
const MAX_TOTAL_GZIP_KB = 60;
const MAX_CSS_GZIP_KB = 30;
const MIN_ESM_MODULES = 50;

const REACT_PKG_DIR = path.resolve(__dirname, "../../packages/react");
const DIST_DIR = path.join(REACT_PKG_DIR, "dist");
const ENTRY = path.join(DIST_DIR, "kozmos-react.mjs");
const ESM_DIR = path.join(DIST_DIR, "esm");
const STYLESHEET = path.join(DIST_DIR, "style.css");

interface RollupChunk {
  type: string;
  code?: string;
  exports?: string[];
}
interface RollupBundle {
  cache: unknown;
  generate(options: { format: "es" }): Promise<{ output: RollupChunk[] }>;
}
interface RollupApi {
  rollup(options: Record<string, unknown>): Promise<RollupBundle>;
}
interface EsbuildApi {
  transform(
    code: string,
    options: Record<string, unknown>,
  ): Promise<{ code: string }>;
}

// Rollup and esbuild as Vite ships them, which is what an app's build runs.
const requireFromReact = createRequire(
  path.join(REACT_PKG_DIR, "package.json"),
);
const requireFromVite = createRequire(
  requireFromReact.resolve("vite/package.json"),
);
const { rollup } = requireFromVite("rollup") as RollupApi;
const esbuild = requireFromVite("esbuild") as EsbuildApi;

const kb = (bytes: number) => bytes / 1024;
const fail: string[] = [];

function globToRegExp(glob: string) {
  const source = glob
    .split("**/")
    .map((part) =>
      part
        .split("*")
        .map((piece) => piece.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join("(?:.*/)?");
  return new RegExp(`^${source}$`);
}

// The package's own declaration, read rather than assumed: drop it, and every budget below fails.
const declared = JSON.parse(
  fs.readFileSync(path.join(REACT_PKG_DIR, "package.json"), "utf8"),
).sideEffects as boolean | string[] | undefined;
const sideEffectGlobs = Array.isArray(declared)
  ? declared.map(globToRegExp)
  : [];
function moduleSideEffects(id: string, external: boolean) {
  if (external || !id.startsWith(DIST_DIR + path.sep)) return true;
  if (declared === false) return false;
  if (!Array.isArray(declared)) return true;
  const relative = path.relative(REACT_PKG_DIR, id).split(path.sep).join("/");
  return sideEffectGlobs.some(
    (pattern) => pattern.test(relative) || pattern.test(`./${relative}`),
  );
}
const isExternal = (id: string) =>
  !id.startsWith("/") && !id.startsWith(".") && !id.startsWith("\0");

async function main() {
  console.log(
    "🔄 Building @kozmos-ds/react and its dependencies for performance analysis...",
  );
  try {
    // turbo builds the transitive dependencies, such as @kozmos-ds/tokens, first
    execSync("ANALYZE=true pnpm turbo run build --filter=@kozmos-ds/react", {
      stdio: "inherit",
    });
  } catch {
    console.error("❌ Build failed! Bundle analysis aborted.");
    process.exit(1);
  }
  for (const file of [ENTRY, STYLESHEET]) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Output file not found: ${file}`);
      process.exit(1);
    }
  }

  const modules = fs.existsSync(ESM_DIR)
    ? (fs.readdirSync(ESM_DIR, { recursive: true }) as string[]).filter((f) =>
        f.endsWith(".mjs"),
      )
    : [];
  if (modules.length < MIN_ESM_MODULES) {
    fail.push(
      `the ES build has ${modules.length} module files in dist/esm, under ${MIN_ESM_MODULES}: it is one file again, and every import costs the whole library`,
    );
  }

  // Every entry is bundled with the same options, so Rollup's cache stays valid between them: a
  // cache from a build that took every module to have side effects carries that into the next.
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-bundle-"));
  let cache: unknown;
  async function cost(source: string, label: string) {
    const input = path.join(work, `${label.replace(/\W/g, "_")}.mjs`);
    fs.writeFileSync(input, source);
    const bundle = await rollup({
      input,
      external: isExternal,
      cache,
      onwarn: () => {},
      treeshake: {
        moduleSideEffects: (id: string, external: boolean) =>
          id === input || moduleSideEffects(id, external),
      },
    });
    cache = bundle.cache;
    const { output } = await bundle.generate({ format: "es" });
    const code = output.map((chunk) => chunk.code ?? "").join("\n");
    const minified = (
      await esbuild.transform(code, { minify: true, format: "esm" })
    ).code;
    return { output, raw: minified.length, gzip: gzipSync(minified).length };
  }

  try {
    const everything = await cost(
      `import * as kozmos from ${JSON.stringify(ENTRY)}; console.log(kozmos);`,
      "everything",
    );
    const exportsList =
      (
        await (
          await rollup({
            input: ENTRY,
            external: isExternal,
            cache,
            onwarn: () => {},
            treeshake: { moduleSideEffects },
          })
        ).generate({ format: "es" })
      ).output[0].exports ?? [];
    const perExport: Array<[string, number]> = [];
    for (const name of exportsList) {
      const { gzip } = await cost(
        `import { ${name} } from ${JSON.stringify(ENTRY)}; console.log(${name});`,
        `export_${name}`,
      );
      perExport.push([name, gzip]);
    }
    perExport.sort((a, b) => b[1] - a[1]);
    const button = perExport.find(([name]) => name === "Button");
    const cssGzip = gzipSync(fs.readFileSync(STYLESHEET)).length;
    const sorted = perExport.map(([, gzip]) => gzip).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;

    console.log(`\n📊 What an app pays for @kozmos-ds/react (minified, gzip):`);
    console.log(`---------------------------------`);
    console.log(`ES modules:        ${modules.length} files in dist/esm`);
    console.log(
      `Exports measured:  ${perExport.length}, median ${kb(median).toFixed(2)} KB`,
    );
    console.log(`Heaviest exports:`);
    for (const [name, gzip] of perExport.slice(0, 5)) {
      console.log(
        `  ${name.padEnd(28)} ${kb(gzip).toFixed(2)} KB / ${MAX_EXPORT_GZIP_KB.toFixed(2)} KB`,
      );
    }
    console.log(
      `Button alone:      ${button ? kb(button[1]).toFixed(2) : "missing"} KB / ${MAX_BUTTON_GZIP_KB.toFixed(2)} KB`,
    );
    console.log(
      `Everything:        ${kb(everything.gzip).toFixed(2)} KB / ${MAX_TOTAL_GZIP_KB.toFixed(2)} KB (${kb(everything.raw).toFixed(2)} KB minified)`,
    );
    console.log(
      `Stylesheet:        ${kb(cssGzip).toFixed(2)} KB / ${MAX_CSS_GZIP_KB.toFixed(2)} KB`,
    );
    console.log(`---------------------------------`);

    const overBudget = perExport.filter(
      ([, gzip]) => kb(gzip) > MAX_EXPORT_GZIP_KB,
    );
    if (overBudget.length) {
      const named = overBudget
        .slice(0, 5)
        .map(([name, gzip]) => `${name} ${kb(gzip).toFixed(2)} KB`)
        .join(", ");
      fail.push(
        `${overBudget.length} of ${perExport.length} exports cost over ${MAX_EXPORT_GZIP_KB} KB alone (${named}${overBudget.length > 5 ? ", …" : ""})`,
      );
    }
    if (!button) fail.push("Button is not a public export");
    else if (kb(button[1]) > MAX_BUTTON_GZIP_KB) {
      fail.push(
        `Button alone costs ${kb(button[1]).toFixed(2)} KB, over ${MAX_BUTTON_GZIP_KB} KB: the ES build no longer tree-shakes`,
      );
    }
    if (kb(everything.gzip) > MAX_TOTAL_GZIP_KB) {
      fail.push(
        `everything costs ${kb(everything.gzip).toFixed(2)} KB, over ${MAX_TOTAL_GZIP_KB} KB`,
      );
    }
    if (kb(cssGzip) > MAX_CSS_GZIP_KB) {
      fail.push(
        `the stylesheet is ${kb(cssGzip).toFixed(2)} KB, over ${MAX_CSS_GZIP_KB} KB`,
      );
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  if (fail.length) {
    for (const line of fail) console.error(`❌ ERROR: ${line}`);
    process.exit(1);
  }
  console.log(`✅ SUCCESS: every import is within budget.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
