import { defineConfig } from "vite";
import path from "node:path";
import dts from "unplugin-dts/vite";

/**
 * `@kozmos-ds/icons/vue`: the same entry, `src/index.ts`, built a second time
 * with each module that has a `.vue.ts` stand-in resolved to it. Only the four
 * icon factories and the props type have one, so the generated outlines, the
 * owned artwork and the registry are the React entry's own modules, shared,
 * and every icon the React entry exports is a Vue functional component here
 * under the same name. vite.config.mts never resolves `.vue.ts`, so React's
 * build is unchanged.
 *
 * The declarations come from tsconfig.vue.json, whose `moduleSuffixes` makes
 * TypeScript resolve the same stand-ins. Each stand-in's declaration is
 * written under its plain name (`createPointrIcon.d.ts`), the name the shared
 * modules' declarations import, into dist/vue/.types;
 * scripts/roll-vue-declarations.mjs then rolls them into dist/vue/index.d.ts
 * with API Extractor and removes the folder. The plugin cannot roll them
 * itself: it rolls into package.json's `types`, which is React's.
 */
const VUE_SUFFIX = /\.vue\.d\.ts$/;

export default defineConfig({
  resolve: {
    extensions: [".vue.ts", ".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  plugins: [
    dts({
      tsconfigPath: "tsconfig.vue.json",
      entryRoot: path.resolve(__dirname, "src"),
      outDirs: path.resolve(__dirname, "dist/vue/.types"),
      beforeWriteFile: (filePath, content) =>
        VUE_SUFFIX.test(filePath)
          ? { filePath: filePath.replace(VUE_SUFFIX, ".d.ts"), content }
          : undefined,
    }),
  ],
  build: {
    sourcemap: true,
    outDir: "dist/vue",
    // dist holds the React entry, built first.
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "KozmosIconsVue",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: { vue: "Vue" },
      },
    },
  },
});
