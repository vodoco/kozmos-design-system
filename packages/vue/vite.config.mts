import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { readFileSync } from "fs";

const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
// Every package this one names stays external, and so do its subpaths
// (`react-dom/client`): the build carries only Kozmos's own Vue code and the
// shared recipes it builds in.
const packages = Object.keys({
  ...manifest.dependencies,
  ...manifest.peerDependencies,
});
const external = (id: string) =>
  packages.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // The recipes React's parts draw with (packages/react/src/recipes),
      // framework-free and built in here, so React and Vue draw one element
      // from one source. recipes.framework-free.test.ts keeps React out.
      "#kozmos-recipes": path.resolve(
        __dirname,
        "../react/src/recipes/index.ts",
      ),
    },
  },
  build: {
    lib: {
      entry: {
        "kozmos-vue": path.resolve(__dirname, "src/index.ts"),
        "react-bridge": path.resolve(__dirname, "src/react-bridge/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: { external },
  },
});
