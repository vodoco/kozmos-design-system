import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import path from "path";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { shakableComponents } from "./vite-plugins/shakable-components.mjs";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

const dependencyExternals = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  "react/jsx-runtime",
  "react-dom/client",
];

function toGlobalName(packageName: string) {
  const knownGlobals: Record<string, string> = {
    react: "React",
    "react-dom": "ReactDOM",
    "react-dom/client": "ReactDOMClient",
    "react/jsx-runtime": "ReactJsxRuntime",
    "@kozmos-ds/tokens": "KozmosTokens",
  };

  return (
    knownGlobals[packageName] ??
    packageName
      .replace(/^@/, "")
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
      .replace(/^[a-z]/, (chr) => chr.toUpperCase())
  );
}

/**
 * The stylesheets are @kozmos-ds/styles's (Vue 3 Phase 0): it builds style.css
 * and reset.css once for every Kozmos web package, from the sources and the
 * PostCSS passes this build ran until 5 Nov 2026. This package still ships
 * both, unchanged, as ./style.css, ./reset.css and ./dist/style.css, so no
 * product's import moves. Read as bytes, so the copy is exact.
 */
const STYLESHEETS = ["style.css", "reset.css"];

/**
 * The JavaScript is built for the browsers package.json declares, not for
 * Vite's default target (Chrome 87, Edge 88, Safari 14, Firefox 78), as
 * @kozmos-ds/styles builds the stylesheet for the same list. For that target
 * esbuild rewrote every optional chain, `a?.b`, as `a == null ? void 0 : a.b`:
 * it trusts `?.` only from Chrome and Edge 91, for a V8 bug no declared browser
 * has. Android's WebView is Chrome's engine at the same version. An entry this
 * does not understand stops the build rather than leaving a browser out.
 */
function targetFrom(browserslist: string[]) {
  const engines: Record<string, string> = {
    chrome: "chrome",
    edge: "edge",
    firefox: "firefox",
    safari: "safari",
    android: "chrome",
  };
  return [
    ...new Set(
      browserslist.map((query) => {
        const match = /^(\w+) >= ([\d.]+)$/.exec(query.trim());
        if (!match || !engines[match[1]])
          throw new Error(`target: cannot read browserslist "${query}"`);
        return `${engines[match[1]]}${match[2]}`;
      }),
    ),
  ];
}

export default defineConfig(async () => {
  let visualizerPlugin = null;
  if (process.env.ANALYZE) {
    const { visualizer } = await import("rollup-plugin-visualizer");
    visualizerPlugin = visualizer({ filename: "dist/stats.html", open: false });
  }

  return {
    plugins: [
      react(),
      {
        name: "kozmos-stylesheets-from-styles",
        async generateBundle() {
          for (const fileName of STYLESHEETS) {
            this.emitFile({
              type: "asset",
              fileName,
              source: await readFile(
                require.resolve(`@kozmos-ds/styles/${fileName}`),
              ),
            });
          }
        },
      },
      // Component names in development only, and parts an app's bundler can
      // leave out when the app does not use them: vite-plugins/shakable-components.mjs.
      shakableComponents({
        include: (id: string) =>
          id.startsWith(path.resolve(__dirname, "src") + path.sep) &&
          /\.[jt]sx?$/.test(id),
        pureFactories: ["createThemePortal"],
      }),
      dts({
        insertTypesEntry: true,
        // API Extractor rolls the declarations into dist/index.d.ts. Left
        // unset, unplugin-dts hands it `bundledPackages: undefined`, which
        // API Extractor 7.43's config schema refuses.
        bundleTypes: { bundledPackages: [] },
        // The Code Connect files are type-checked (they are in tsconfig's
        // include since 2026-09-14) but they are not part of the package: each
        // one describes a Figma mapping, not an export. Without this the dts
        // plugin followed tsconfig and emitted 92 `*.figma.d.ts` files of
        // `export {}` into dist, which `files: ["dist"]` would then publish.
        // src/figma.d.ts is their augmentation of @figma/code-connect.
        // unplugin-dts copies every `declare module` it finds into the bundle,
        // and a product that uses Code Connect itself would then be told its
        // FigmaConnectAPI has a `number()` that only Kozmos's checks declare.
        exclude: ["src/**/*.figma.ts", "src/**/*.figma.tsx", "src/figma.d.ts"],
      }),
      visualizerPlugin,
    ].filter(Boolean),
    build: {
      // ES2020 as well: the syntax stays what it was (the build already writes
      // `??`, so a consumer's parser sees nothing newer), and `x ??= y`, which
      // is ES2021, is still written out.
      target: ["es2020", ...targetFrom(packageJson.browserslist)],
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        name: "KozmosReact",
      },
      rollupOptions: {
        external: dependencyExternals,
        output: [
          // One file per source module, so an app's bundler keeps only the modules behind what
          // it imports (package.json declares the JavaScript free of side effects). As one file,
          // importing Button alone cost an app 48.7 KB gzip of the library's 54.5; this way,
          // 1.1 KB. The entry keeps its published name; the modules sit under dist/esm/.
          {
            format: "es",
            banner: '"use client";',
            preserveModules: true,
            preserveModulesRoot: "src",
            entryFileNames: (chunk) =>
              chunk.name === "index" ? "kozmos-react.mjs" : "esm/[name].mjs",
          },
          // require() keeps one file: CommonJS consumers do not tree-shake.
          {
            format: "umd",
            name: "KozmosReact",
            banner: '"use client";',
            entryFileNames: "kozmos-react.umd.cjs",
            globals: Object.fromEntries(
              dependencyExternals.map((dep) => [dep, toGlobalName(dep)]),
            ),
          },
        ],
      },
    },
  };
});
