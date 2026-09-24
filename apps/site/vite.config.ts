import { readFileSync } from "node:fs";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

/**
 * What @kozmos/react brings with it, pre-bundled when the dev server starts.
 * The package is linked from the workspace, so Vite only finds its imports
 * (the Radix primitives, framer-motion, lucide…) on the first request, then
 * optimises them and reloads the page mid-visit: for a few seconds the page
 * is there but nothing on it responds. Read from the package so the list
 * cannot go stale. The build is unaffected; it bundles everything.
 */
const kozmosReact = JSON.parse(
  readFileSync(
    new URL("../../packages/react/package.json", import.meta.url),
    "utf8",
  ),
) as { dependencies?: Record<string, string> };
const kozmosDependencies = Object.keys(kozmosReact.dependencies ?? {})
  .filter((name) => !name.startsWith("@kozmos/"))
  .map((name) => `@kozmos/react > ${name}`);

/**
 * Where the site will be served from. Empty (the default) means the root,
 * which is what the dev server, the tests and a static host with an index
 * document all use. A blob container has no index document, so a deploy
 * there passes its own prefix: `BASE_PATH=/kozmos-ds/ pnpm build`.
 */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [reactRouter()],
  resolve: {
    // @kozmos/react is linked from the workspace and carries its own React for
    // its tests; one React instance must serve both, or hooks throw.
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: { include: kozmosDependencies },
  // Storybook holds 6006 and mapscale-review 5173.
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
});
