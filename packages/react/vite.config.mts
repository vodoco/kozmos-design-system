import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import path from "path";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

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
 * Tailwind's preflight names theme values — `theme('fontFamily.sans', <its
 * default>)` — which only Tailwind resolves; a browser drops each such
 * declaration, so a page with the reset kept its serif. The host reset is not
 * built by Tailwind, so each value takes the default it names.
 */
function resolvePreflightTheme(css: string) {
  const resolved = css.replace(/theme\('[^']*',\s*([^;]*?)\)(?=;)/g, "$1");
  if (resolved.includes("theme(")) {
    throw new Error("reset.css: a theme() call has no default to resolve to");
  }
  return resolved;
}

/**
 * The stylesheet is minified for the browsers package.json declares, not for
 * Vite's default target (Chrome 87, Safari 14, Firefox 78), for which esbuild
 * split every `inset` into four longhands and wrote prefixed copies of
 * `appearance` and `tab-size` that no declared browser reads. Android's
 * WebView is Chrome's engine at the same version. An entry this does not
 * understand stops the build rather than leaving a browser out.
 */
function cssTargetFrom(browserslist: string[]) {
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
          throw new Error(`cssTarget: cannot read browserslist "${query}"`);
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
        name: "kozmos-opt-in-reset",
        async generateBundle() {
          // A separate, deliberate host-page reset. The default CSS is scoped.
          this.emitFile({
            type: "asset",
            fileName: "reset.css",
            source: resolvePreflightTheme(
              await readFile(
                require.resolve("tailwindcss/lib/css/preflight.css"),
                "utf8",
              ),
            ),
          });
        },
      },
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
    css: {
      postcss: {
        plugins: [
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("tailwindcss"),
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("autoprefixer"),
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("./postcss/shadow-reach.cjs")(),
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("./postcss/scoped-css.cjs")(),
        ],
      },
    },
    build: {
      cssTarget: cssTargetFrom(packageJson.browserslist),
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        name: "KozmosReact",
        // The stylesheet ships as dist/style.css, which package.json exports as ./style.css.
        // Vite 6 names a library's CSS after the package (react.css) unless told otherwise.
        cssFileName: "style",
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
