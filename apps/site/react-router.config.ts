import { copyFile } from "node:fs/promises";
import path from "node:path";
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  // The router's own prefix, matching Vite's `base` (see vite.config.ts).
  basename: process.env.BASE_PATH ?? "/",
  // A static site: every route is rendered to HTML at build time and hydrated
  // in the browser. Nothing runs on a server after the build.
  ssr: false,
  async prerender({ getStaticPaths }) {
    // Every route has a fixed path, the component pages included (one route
    // each, from the generated index: src/routes.ts); "/404" matches the
    // catch-all route, so the not-found page is drawn at build time like
    // every other page.
    return [...getStaticPaths(), "/404"];
  },
  // Static hosts answer an unknown address with /404.html and a 404 status.
  async buildEnd({ reactRouterConfig }) {
    // A basename puts every page under its own folder, so the 404 page is
    // copied from there and stays beside the pages it belongs to.
    const prefix = (process.env.BASE_PATH ?? "/").replace(/^\/|\/$/g, "");
    const pages = path.join(reactRouterConfig.buildDirectory, "client", prefix);
    await copyFile(
      path.join(pages, "404", "index.html"),
      path.join(pages, "404.html"),
    );
  },
  // React Router 8 turns these on; opting in now keeps the upgrade small.
  // Version 8 itself needs Node 22, and CI runs Node 20 (README.md).
  future: {
    v8_middleware: true,
    v8_passThroughRequests: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
