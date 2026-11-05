import { defineConfig } from "vite";
import path from "path";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

/**
 * The shared stylesheet, built once for every Kozmos web package (Vue 3
 * Phase 0; Olcay's answer of 16 Oct: `@kozmos-ds/styles`, which
 * `@kozmos-ds/react` re-exports). Until 5 Nov 2026 `@kozmos-ds/react` built it
 * in its own library build; this is that pipeline, moved: the same PostCSS
 * passes in the same order, the same browser targets, the same minifier, so
 * the file React ships is byte for byte what it was. Tailwind reads React's
 * and Vue's sources (tailwind.config.js), so a class either draws is in it.
 */

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
 * The stylesheet is built for the browsers package.json declares, not for
 * Vite's default target (Chrome 87, Edge 88, Safari 14, Firefox 78). For that
 * target esbuild split every `inset` into four longhands and wrote prefixed
 * copies of `appearance` and `tab-size` that no declared browser reads.
 * Android's WebView is Chrome's engine at the same version. An entry this does
 * not understand stops the build rather than leaving a browser out.
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

export default defineConfig({
  plugins: [
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
    {
      // The build's entry is a module that imports the stylesheet, as React's
      // index.ts did; the package ships the CSS alone, so its empty chunk goes.
      // Last, after Vite has drawn the stylesheet out of the chunk.
      name: "kozmos-stylesheet-only",
      enforce: "post",
      generateBundle: {
        order: "post",
        handler(_options, bundle) {
          for (const [fileName, output] of Object.entries(bundle)) {
            if (output.type === "chunk") delete bundle[fileName];
          }
        },
      },
    },
  ],
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("./postcss/compact-css.cjs")(),
      ],
    },
  },
  build: {
    cssTarget: targetFrom(packageJson.browserslist),
    lib: {
      entry: path.resolve(__dirname, "src/entry.ts"),
      formats: ["es"],
      fileName: "entry",
      // dist/style.css, which package.json exports as ./style.css. Vite 6
      // names a library's CSS after the package unless told otherwise.
      cssFileName: "style",
    },
  },
});
