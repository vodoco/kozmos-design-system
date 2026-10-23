import { defineConfig } from "vite";
import path from "node:path";
import dts from "unplugin-dts/vite";

const externals = ["react", "react/jsx-runtime"];

export default defineConfig({
  // API Extractor rolls the declarations into dist/index.d.ts. Left unset,
  // unplugin-dts hands it `bundledPackages: undefined`, which API Extractor
  // 7.43's config schema refuses.
  plugins: [
    dts({ insertTypesEntry: true, bundleTypes: { bundledPackages: [] } }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "KozmosIcons",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    rollupOptions: {
      external: externals,
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "ReactJsxRuntime",
        },
      },
    },
  },
});
