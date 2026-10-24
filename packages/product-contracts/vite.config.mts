import { defineConfig } from "vite";
import dts from "unplugin-dts/vite";
import path from "node:path";

export default defineConfig({
  // API Extractor rolls the declarations into dist/index.d.ts. Left unset,
  // unplugin-dts hands it `bundledPackages: undefined`, which API Extractor
  // 7.43's config schema refuses.
  plugins: [
    dts({ insertTypesEntry: true, bundleTypes: { bundledPackages: [] } }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
  },
});
