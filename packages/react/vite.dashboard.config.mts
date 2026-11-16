import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import dts from "unplugin-dts/vite";
import path from "path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { shakableComponents } from "./vite-plugins/shakable-components.mjs";
import { targetFrom } from "./vite.config.mts";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

/**
 * `@kozmos-ds/react/dashboard`: Pointr Cloud's Dashboard modules (decision
 * 183, owner, 13 Nov 2026), built after the main entry (vite.config.mts) into
 * the same dist, so that an SDK or Core product never pays for them.
 *
 * The main entry is external to it. A module imports a Core part from the
 * package's source as any part does (`../../components/Backdrop/Backdrop`),
 * and here every such import becomes an import of `@kozmos-ds/react`, the
 * package's own name, which resolves to the very file an app already loads.
 * So no Core part is copied into the dashboard bundle, and a part and its
 * React context are one, whichever entry imported them. An import that
 * leaves src/dashboard must therefore name something the main entry
 * exports, by the name it exports it under; anything else stops the build
 * (see kozmosMainEntryExternal below).
 *
 * The outputs mirror the main entry's: the ES build one file per source
 * module, under dist/esm/dashboard, behind dist/kozmos-react-dashboard.mjs,
 * so an app's bundler keeps only the modules it uses; require() one file,
 * dist/kozmos-react-dashboard.cjs (CommonJS, as UMD cannot name the main
 * entry's package for a browser global any more usefully). The types are
 * rolled into dist/dashboard/index.d.ts, and
 * `../../scripts/emit-format-declarations.mjs dist/dashboard` gives each
 * format its own copy beside it, index.d.mts and index.d.cts, as it does for
 * the main entry in dist (and for icons' ./vue in dist/vue).
 */

const SRC = path.resolve(__dirname, "src") + path.sep;
const DASHBOARD = path.join(SRC, "dashboard") + path.sep;
const MAIN_ENTRY = "@kozmos-ds/react";

const dependencyExternals = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  "react/jsx-runtime",
  "react-dom/client",
];

/** The names the built main entry exports, read from its ES file. */
function mainEntryExports() {
  const file = path.resolve(__dirname, "dist/kozmos-react.mjs");
  if (!fs.existsSync(file))
    throw new Error(
      "the dashboard entry builds after the main entry: run vite build first",
    );
  const names = new Set<string>();
  for (const block of fs
    .readFileSync(file, "utf8")
    .matchAll(/export\s*\{([^}]*)\}/g))
    for (const item of block[1].split(","))
      if (item.trim()) names.add(item.trim().split(/\s+as\s+/).pop()!);
  return names;
}

function kozmosMainEntryExternal(): Plugin {
  return {
    name: "kozmos-dashboard-main-entry-external",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer?.startsWith(DASHBOARD) || !source.startsWith("."))
        return null;
      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      });
      if (
        resolved &&
        !resolved.external &&
        resolved.id.startsWith(SRC) &&
        !resolved.id.startsWith(DASHBOARD)
      )
        return { id: MAIN_ENTRY, external: true };
      return null;
    },
    generateBundle(_options, bundle) {
      const exported = mainEntryExports();
      const missing = new Set<string>();
      for (const chunk of Object.values(bundle))
        if (chunk.type === "chunk")
          for (const name of chunk.importedBindings[MAIN_ENTRY] ?? [])
            if (!exported.has(name)) missing.add(`${name} (${chunk.fileName})`);
      if (missing.size)
        this.error(
          `a Dashboard module imports from the package's source what its main entry does not export: ${[...missing].join(", ")}. A module takes Core parts through the public API only; export it from src/index.ts, or keep it in src/dashboard.`,
        );
    },
  };
}

const MAIN_TYPES = path.resolve(__dirname, "dist/index.d.ts");
const MAIN_TYPES_ASIDE = path.resolve(__dirname, "dist/.main-index.d.ts");
const DASHBOARD_TYPES = path.resolve(__dirname, "dist/dashboard/index.d.ts");
const dashboardTypes = {
  started: false,
  plugin: {
    name: "kozmos-dashboard-types",
    // After the bundle is checked (kozmos-dashboard-main-entry-external) and
    // before unplugin-dts writes, which it does in its own writeBundle, once,
    // for the first of the two outputs.
    writeBundle: {
      sequential: true,
      order: "pre",
      handler() {
        if (dashboardTypes.started) return;
        dashboardTypes.started = true;
        if (!fs.existsSync(MAIN_TYPES))
          this.error(
            "the dashboard entry builds after the main entry: dist/index.d.ts is missing",
          );
        fs.renameSync(MAIN_TYPES, MAIN_TYPES_ASIDE);
      },
    },
  } satisfies Plugin,
  finish() {
    fs.mkdirSync(path.dirname(DASHBOARD_TYPES), { recursive: true });
    fs.renameSync(MAIN_TYPES, DASHBOARD_TYPES);
    fs.renameSync(MAIN_TYPES_ASIDE, MAIN_TYPES);
  },
};

export default defineConfig({
  plugins: [
    kozmosMainEntryExternal(),
    dashboardTypes.plugin,
    react(),
    shakableComponents({
      include: (id: string) => id.startsWith(DASHBOARD) && /\.[jt]sx?$/.test(id),
      pureFactories: ["createThemePortal"],
    }),
    dts({
      // As vite.config.mts's, for this entry's sources alone. It rolls them
      // into the file package.json's `types` names, dist/index.d.ts, the main
      // entry's: kozmos-dashboard-types moves the main entry's aside first,
      // and afterBuild moves this one to dist/dashboard/index.d.ts and puts
      // the main entry's back.
      bundleTypes: { bundledPackages: [] },
      include: ["src/dashboard/**/*.ts", "src/dashboard/**/*.tsx"],
      exclude: [
        "src/**/*.figma.ts",
        "src/**/*.figma.tsx",
        "src/**/*.stories.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
      ],
      afterBuild: () => dashboardTypes.finish(),
    }),
  ],
  build: {
    // The main entry is already in dist.
    emptyOutDir: false,
    target: ["es2020", ...targetFrom(packageJson.browserslist)],
    lib: {
      entry: { dashboard: path.resolve(__dirname, "src/dashboard/index.ts") },
    },
    rollupOptions: {
      external: [...dependencyExternals, MAIN_ENTRY],
      output: [
        {
          format: "es",
          banner: '"use client";',
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: (chunk) =>
            chunk.name === "dashboard"
              ? "kozmos-react-dashboard.mjs"
              : "esm/[name].mjs",
        },
        {
          format: "cjs",
          banner: '"use client";',
          entryFileNames: "kozmos-react-dashboard.cjs",
        },
      ],
    },
  },
});
