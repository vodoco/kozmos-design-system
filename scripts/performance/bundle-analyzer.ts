import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";
import { gzipSync } from "zlib";
import { topLevelRetainers } from "./top-level-retainers.mjs";

// What an app pays for @kozmos-ds/react. The ES build is one file per module, and package.json
// declares the JavaScript free of side effects, so an app's bundler keeps only the modules behind
// what it imports. Each budget is measured the way a Vite app builds for production: Rollup, with
// `process.env.NODE_ENV` replaced as each module is read and the package's `sideEffects` honoured,
// with its dependencies left out (they are the app's own), then minified and gzipped.
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
//
// Everything went from 60 to 64 KB on 2026-09-27, with Olcay's agreement. Main measured 59.63 KB
// here (CI reads about 0.13 KB more), after 14 pull requests of features on 09-26; that day's
// three rows then measured +0.31 (the location control's modes and step-free, row 77), +0.18
// (the single-choice ChipGroup, row 37) and +0.70 (the selected result scrolling into view,
// row 70). That is growth by features, not a tree-shaking regression: the per-export and Button
// budgets, which catch one, did not move.
//
// Everything went from 64 to 68 KB on 2026-09-28 (decision 53, Olcay's). Main measured 63.61 KB
// here after that day's features, and the map status pill (decision 39) measured 63.77, leaving
// 0.23 KB for the next. The per-export, Button and stylesheet budgets are unchanged.
//
// Olcay approved 80 KB on 2026-09-30 for the SDK-controls integration (#175).
// After lossless SVG data-URL optimization, the candidate measured 74.01 KB gzip
// locally (previous CI measurements were about 0.38 KB higher). The heaviest
// export was 7.31 KB, Button 1.29 KB and CSS 29.83 KB. Only the total-library
// allowance changes; the per-export, Button, CSS and module-count guards stay.
//
// Olcay approved 88 KB on 2026-10-06 (decision 56). 0.9.0 measured 79.52 KB here and 79.86 KB on CI against 80
// (CI now reads about 0.33 KB more than a Mac). The growth is features: on CI, 0.7.0 measured
// 74.33, 0.8.0 74.81, 0.8.1 75.12 and 0.9.0 79.86, the last adding the navigation parts. The only
// lossless trims found, taken with this raise, came to 0.31 KB: the Pointr logo's data URL is
// encoded the short way (scripts/build-pointr-brand.mjs), and this measures a production build,
// as an app's build does. After them, Everything measured 79.21 KB here, leaving room for two to
// four releases at the recent growth of 1.8 to 3.6 KB each. The per-export, Button, CSS and
// module-count guards stay.
// Olcay approved 8.5 KB on 2026-10-16 (decision 90) for compact density (#274). Its DensityScope,
// on every SDK part's root, and cn's merge groups for the density sizes took AdaptiveMapShell
// alone from 7.85 to 8.03 KB on CI (7.79 to 7.97 here). That is the shell's real size now, not a
// tree-shaking slip, and it has no cheap lossless trim: the module is layout logic, not data. The
// guard still catches an export that pulls in more than it should.
const MAX_EXPORT_GZIP_KB = 8.5;
const MAX_BUTTON_GZIP_KB = 2;
// Olcay approved 92 KB on 2026-10-21 (decision 114) for the web's own date and time panels
// (decision 104): Calendar (#352), DatePicker's (#361), DateRangePicker's (#366) and
// TimePicker's list (#369) together take Everything from 82.95 to about 87.93 KB on CI, leaving
// nothing for the next feature. Their agent found no lossless trim in their code (sharing the
// pickers' button code shrank the minified bundle but not the gzipped one). The per-export,
// Button, CSS and module-count guards stay.
// Olcay approved 94 KB on 2026-10-26 (decision 117) for MAP-64's tour family (decision 116):
// Backdrop's target (#408), Stepper's dots (#409), PopoverAnchor (#410) and option groups (#411)
// take Everything from about 88.5 to 91.2 KB on CI, leaving too little for TourStep (GAP-188).
// Olcay approved 100 KB on 2026-10-28 (decision 126) for 0.15.0's approved APIs (decision 119):
// after 0.14.0's tour family and fixes, Everything measures about 93.9 KB, leaving no room for
// them. A trim pass runs alongside, reported before 0.15.0.
// Olcay approved 112 KB on 2026-11-09 (decision 175) for 0.16.0, which carries every item the register
// promises for it (decision 174): about 35, among them new parts (ContextMenu, Kbd, the Cloud modules)
// and Tree's range selection. Main measured about 96.4 KB on CI before them.
const MAX_TOTAL_GZIP_KB = 112;
// Olcay approved 30.5 KB on 2026-10-02 for the SDK result presentation.
// The candidate measured 30.12 KB CSS gzip; a lossless selector simplification
// saved only 14 bytes. JavaScript total/per-export/Button limits stay unchanged.
// 32 KB on 2026-10-16 (decision 97, Olcay's): main measured 29.68 KB here, Track 2 (#273)
// 30.14, compact density (#274) 30.22 and the two together 30.63. Both are new rules, not
// duplication: the SDK's markers in owned CSS (about 1 KB gzip alone) and the density rules.
// The room above them is for the next density groups (chips, tags, rows, tabs, the table, the
// tree). CI reads the stylesheet the same as a Mac.
// 36 KB on 2026-11-09 (decision 175, Olcay's): main measured 31.78 KB, and Button's subtle tier with
// CardHeader's tone and CardTitle's size (#515) alone take it to 32.20 KB, before the rest of 0.16.0
// (decision 174).
const MAX_CSS_GZIP_KB = 36;
const MIN_ESM_MODULES = 50;
// @kozmos-ds/vue (Vue 3 Phase 0, P0.5), measured as React is: an app's
// production build of every export at once, its dependencies (vue, reka-ui,
// class-variance-authority, clsx, tailwind-merge) left out as the app's own,
// minified and gzipped. Its stylesheet is @kozmos-ds/styles's, held above.
//
// The budget follows the rule React's first budgets were set by (22 Sep,
// a03d3fd7b): the measurement plus about a tenth, to a round figure
// (Everything 54.6 KB to 60, the stylesheet 26.4 to 30), here to the next
// half kilobyte, the step React's later budgets take (8.5, 30.5). On 6 Nov
// 2026 the main entry measured 2.69 KB here, and 110% of that, rounded up
// to the half, is 3. Raise it only with the measurement that justifies it.
const MAX_VUE_GZIP_KB = 3;
// ./react-bridge, on a line of its own: it mounts React's parts, and an app
// that imports it pays for @kozmos-ds/react, React and ReactDOM besides,
// which are its peers and left out here as Vue's are. Its own code measured
// 8.42 KB here and 8.47 KB on CI on 7 Nov 2026, with #489's bridge (v-model
// through each wrapper's models, listener routing and part-takes.ts; main's
// measured 3.58 on 6 Nov), and the same rule gave 9.5. #493 raised it to
// 11.5: 10.18 KB here (about 10.23 on CI, which read #489's 0.05 above a Mac)
// once a bare boolean attribute reached React as true. Each bridged part's
// boolean props are read from React's types into part-takes.ts, and the 112
// prop names alone gzip to about 700 B; 110% of either figure, to the half,
// is 11.5. It never counts towards the main entry's, which must not import it
// (packages/vue/test/react-free.spec.ts).
const MAX_VUE_BRIDGE_GZIP_KB = 11.5;

const REACT_PKG_DIR = path.resolve(__dirname, "../../packages/react");
const DIST_DIR = path.join(REACT_PKG_DIR, "dist");
const ENTRY = path.join(DIST_DIR, "kozmos-react.mjs");
const ESM_DIR = path.join(DIST_DIR, "esm");
// The stylesheet is @kozmos-ds/styles's since 5 Nov 2026 (Vue 3 Phase 0), and
// react ships it as its own ./style.css: measured where it is built, and held
// to be the very file react ships.
const STYLESHEET = path.resolve(
  __dirname,
  "../../packages/styles/dist/style.css",
);
const REACT_STYLESHEET = path.join(DIST_DIR, "style.css");
const VUE_PKG_DIR = path.resolve(__dirname, "../../packages/vue");
const VUE_ENTRY = path.join(VUE_PKG_DIR, "dist/kozmos-vue.mjs");
const VUE_BRIDGE = path.join(VUE_PKG_DIR, "dist/react-bridge.mjs");

interface RollupChunk {
  type: string;
  code?: string;
  exports?: string[];
  imports?: string[];
  dynamicImports?: string[];
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
const { parseAst } = requireFromVite("rollup/parseAst") as {
  parseAst: (code: string) => unknown;
};

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
    "🔄 Building @kozmos-ds/react, @kozmos-ds/vue and their dependencies for performance analysis...",
  );
  try {
    // turbo builds the transitive dependencies, such as @kozmos-ds/tokens, first
    execSync(
      "ANALYZE=true pnpm turbo run build --filter=@kozmos-ds/react --filter=@kozmos-ds/vue",
      { stdio: "inherit" },
    );
  } catch {
    console.error("❌ Build failed! Bundle analysis aborted.");
    process.exit(1);
  }
  for (const file of [ENTRY, STYLESHEET, VUE_ENTRY, VUE_BRIDGE]) {
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
  // The JavaScript is built for the browsers package.json declares (vite.config.mts). Built for
  // Vite's default target instead, esbuild wrote every `a?.b` as `a == null ? void 0 : a.b`, in 44
  // modules, and an app's minifier could not fold all of them back: Everything measured 91.81 KB
  // here that way on 2026-10-28, and 90.46 KB with the target.
  const lowered = modules.filter((file) =>
    /(?<![=!])== null \? void 0 : /.test(
      fs.readFileSync(path.join(ESM_DIR, file), "utf8"),
    ),
  );
  if (lowered.length) {
    fail.push(
      `${lowered.length} modules in dist/esm write optional chaining out (a == null ? void 0 : a.b), as for a browser older than package.json declares: build.target in packages/react/vite.config.mts (${lowered.slice(0, 3).join(", ")})`,
    );
  }

  // Each part's name is set in development only, and the calls that make a part
  // are marked pure (packages/react/vite-plugins/shakable-components.mjs), so an
  // app's production build leaves out the parts it does not use. Before, a
  // top-level `X.displayName = "X"` kept every part of a module once anything
  // from it was imported: `DEFAULT_PANEL_DETENTS`, a constant, cost 8 KB.
  const retainers = topLevelRetainers(ESM_DIR, parseAst);
  if (retainers.length) {
    fail.push(
      `${retainers.length} top-level statements in dist/esm keep a component that nothing imports (${retainers.slice(0, 3).join("; ")}): see packages/react/vite-plugins/shakable-components.mjs`,
    );
  }

  // Every entry is bundled with the same options, so Rollup's cache stays valid between them: a
  // cache from a build that took every module to have side effects carries that into the next.
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-bundle-"));
  let cache: unknown;

  // An app's production build replaces process.env.NODE_ENV as it reads each module, before it
  // decides what to keep: Vite's define plugin, webpack's DefinePlugin (from `mode`), esbuild's
  // `define` and Rollup's @rollup/plugin-replace all do. So code that only runs in development is
  // already dead when the bundler tree-shakes, and whatever only it kept is left out. Replacing it
  // here too, with esbuild's define as Vite's does, measures what such an app ships. Replacing it
  // only after bundling, as this used to, kept what development-only code held.
  const productionDefine = {
    name: "kozmos-production-define",
    async transform(code: string) {
      if (!code.includes("process.env.NODE_ENV")) return null;
      const replaced = await esbuild.transform(code, {
        format: "esm",
        loader: "js",
        define: { "process.env.NODE_ENV": '"production"' },
      });
      return { code: replaced.code, map: null };
    },
  };

  async function cost(source: string, label: string) {
    const input = path.join(work, `${label.replace(/\W/g, "_")}.mjs`);
    fs.writeFileSync(input, source);
    const bundle = await rollup({
      input,
      external: isExternal,
      cache,
      plugins: [productionDefine],
      onwarn: () => {},
      treeshake: {
        moduleSideEffects: (id: string, external: boolean) =>
          id === input || moduleSideEffects(id, external),
      },
    });
    cache = bundle.cache;
    const { output } = await bundle.generate({ format: "es" });
    const code = output.map((chunk) => chunk.code ?? "").join("\n");
    // Minified as an app's production build minifies, with the same replacement.
    const minified = (
      await esbuild.transform(code, {
        minify: true,
        format: "esm",
        define: { "process.env.NODE_ENV": '"production"' },
      })
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
            plugins: [productionDefine],
            onwarn: () => {},
            treeshake: { moduleSideEffects },
          })
        ).generate({ format: "es" })
      ).output[0].exports ?? [];
    const perExport: Array<[string, number]> = [];
    for (const name of exportsList) {
      const { gzip } = await cost(
        `import { ${name} } from ${JSON.stringify(ENTRY)}; console.log(${name});`,
        // Numbered: `Toast` and `toast` are one file on a Mac's disk, which
        // ignores case, and the second entry then never resolved.
        `export_${perExport.length}_${name}`,
      );
      perExport.push([name, gzip]);
    }
    perExport.sort((a, b) => b[1] - a[1]);
    const button = perExport.find(([name]) => name === "Button");
    const cssGzip = gzipSync(fs.readFileSync(STYLESHEET)).length;
    if (!fs.readFileSync(STYLESHEET).equals(fs.readFileSync(REACT_STYLESHEET)))
      fail.push(
        "packages/react/dist/style.css is not @kozmos-ds/styles's dist/style.css: react must ship the shared stylesheet byte for byte",
      );
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

    // @kozmos-ds/vue: the main entry, and ./react-bridge on its own line.
    const vue = await cost(
      `import * as kozmos from ${JSON.stringify(VUE_ENTRY)}; console.log(kozmos);`,
      "vue_everything",
    );
    const bridge = await cost(
      `import * as bridge from ${JSON.stringify(VUE_BRIDGE)}; console.log(bridge);`,
      "vue_react_bridge",
    );
    // The main entry draws no React: a bridge import in it would put the
    // bridge's cost, and React itself, in every Vue app. A dynamic
    // import() counts as much as a static one: the app's bundler still
    // builds React into a chunk it ships.
    const vueImports = vue.output
      .flatMap((chunk) => [
        ...(chunk.imports ?? []),
        ...(chunk.dynamicImports ?? []),
      ])
      .filter((id) => /react/.test(id) && !/^reka-ui/.test(id));
    console.log(`\n📊 What an app pays for @kozmos-ds/vue (minified, gzip):`);
    console.log(`---------------------------------`);
    console.log(
      `Main entry:        ${kb(vue.gzip).toFixed(2)} KB / ${MAX_VUE_GZIP_KB.toFixed(2)} KB (${kb(vue.raw).toFixed(2)} KB minified)`,
    );
    console.log(
      `./react-bridge:    ${kb(bridge.gzip).toFixed(2)} KB / ${MAX_VUE_BRIDGE_GZIP_KB.toFixed(2)} KB (${kb(bridge.raw).toFixed(2)} KB minified; React's parts, React and ReactDOM besides)`,
    );
    console.log(`---------------------------------`);
    if (vueImports.length)
      fail.push(
        `@kozmos-ds/vue's main entry imports ${vueImports.join(", ")}: React belongs in ./react-bridge alone`,
      );
    if (kb(vue.gzip) > MAX_VUE_GZIP_KB)
      fail.push(
        `@kozmos-ds/vue's main entry costs ${kb(vue.gzip).toFixed(2)} KB, over ${MAX_VUE_GZIP_KB} KB`,
      );
    if (kb(bridge.gzip) > MAX_VUE_BRIDGE_GZIP_KB)
      fail.push(
        `@kozmos-ds/vue/react-bridge costs ${kb(bridge.gzip).toFixed(2)} KB, over ${MAX_VUE_BRIDGE_GZIP_KB} KB`,
      );
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
