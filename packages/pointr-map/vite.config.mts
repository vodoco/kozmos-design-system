import { defineConfig } from "vite";
import path from "node:path";
import dts from "unplugin-dts/vite";

// Nothing of the Pointr Web SDK is bundled: the browser loads it from Pointr's
// CDN at run time (src/sdk-loader.ts). React, Kozmos and the contracts are the
// host's own copies.
const externals = [
  "react",
  "react/jsx-runtime",
  "@kozmos-ds/react",
  "@kozmos-ds/product-contracts",
];

export default defineConfig({
  // API Extractor rolls the declarations into dist/index.d.ts. Left unset,
  // unplugin-dts hands it `bundledPackages: undefined`, which API Extractor
  // 7.43's config schema refuses (as #380 set it for the other packages).
  plugins: [
    dts({ insertTypesEntry: true, bundleTypes: { bundledPackages: [] } }),
  ],
  esbuild: { jsx: "automatic" },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    rollupOptions: {
      external: externals,
      // A client component (refs, effects, the DOM), as @kozmos-ds/react's
      // build marks its own, so a React Server Components host keeps it on
      // the client.
      output: { banner: '"use client";' },
    },
  },
});
