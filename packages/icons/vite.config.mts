import { defineConfig } from "vite";
import path from "node:path";
import dts from "vite-plugin-dts";

const externals = ["react", "react/jsx-runtime"];

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true, rollupTypes: true })],
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
