import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { readFileSync } from "fs";
import { pureCalls } from "./vite-plugins/pure-calls.mjs";

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

// With preserveModules, a module outside src/ is named for its path from the
// folder src/ and it share: the recipes and cn, built in from React's source,
// would sit under dist/esm/react/src/. They go under dist/esm/recipes/ instead
// (cn as recipes/utils), so no path in the main entry's build names React.
const moduleName = (name: string) =>
  name.replace(/^react\/src\/(recipes\/)?/, "recipes/");

export default defineConfig({
  plugins: [
    vue(),
    // Parts an app's bundler can leave out: vite-plugins/pure-calls.mjs.
    pureCalls({
      include: (id: string) =>
        /\.[cm]?[jt]sx?$/.test(id) &&
        [
          path.resolve(__dirname, "src") + path.sep,
          path.resolve(__dirname, "../react/src/recipes") + path.sep,
          path.resolve(__dirname, "../react/src/utils.ts"),
        ].some((root) => id.startsWith(root)),
    }),
  ],
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
    },
    rollupOptions: {
      external,
      output: [
        // One file per source module, as @kozmos-ds/react's ES build, so an
        // app's bundler keeps only the modules behind what it imports
        // (package.json declares the JavaScript free of side effects). As
        // one file, importing KozmosButton alone cost an app the whole
        // entry. The entries keep their published names; the modules sit
        // under dist/esm/, the shared recipes under dist/esm/recipes/.
        {
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: (chunk) =>
            chunk.isEntry ? "[name].mjs" : `esm/${moduleName(chunk.name)}.mjs`,
        },
        // require() keeps a file per entry: CommonJS consumers do not
        // tree-shake.
        {
          format: "cjs",
          entryFileNames: "[name].cjs",
          chunkFileNames: "[name]-[hash].js",
        },
      ],
    },
  },
});
