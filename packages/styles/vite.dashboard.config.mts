import { defineConfig } from "vite";
import path from "path";
import { createRequire } from "node:module";
import { targetFrom } from "./vite.config.mts";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

/**
 * dashboard.css, the Dashboard modules' sheet (decision 183, owner, 13 Nov
 * 2026), built after style.css into the same dist. It is what
 * `@kozmos-ds/react/dashboard` draws with, and assumes style.css is loaded
 * too: the tokens, the preflight and the utilities are style.css's and are
 * not repeated here. No Tailwind runs: the sheet holds owned rules alone
 * (postcss/dashboard-sheet.cjs), for the browsers package.json declares and
 * minified as style.css is.
 */
export default defineConfig({
  plugins: [
    {
      // Only the stylesheet ships (as vite.config.mts's own pass).
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
        require("autoprefixer"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("./postcss/dashboard-sheet.cjs")(),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("./postcss/compact-css.cjs")(),
      ],
    },
  },
  build: {
    // style.css is already in dist.
    emptyOutDir: false,
    cssTarget: targetFrom(packageJson.browserslist),
    lib: {
      entry: path.resolve(__dirname, "src/dashboard-entry.ts"),
      formats: ["es"],
      fileName: "dashboard-entry",
      cssFileName: "dashboard",
    },
  },
});
