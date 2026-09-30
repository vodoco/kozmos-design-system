import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium, firefox, webkit } from "playwright";

/** Bundle built public package entry points, never a React source alias. */
export async function buildReactFixture(entry) {
  const packageDir = path.join(process.cwd(), "packages/react");
  const require = createRequire(path.join(packageDir, "package.json"));
  const { build } = await import(
    pathToFileURL(
      require.resolve("vite").replace(/index\.cjs$/, "dist/node/index.js"),
    ).href
  );
  const result = await build({
    configFile: false,
    root: packageDir,
    // Cross-workspace examples must share the fixture host's React instance.
    resolve: { dedupe: ["react", "react-dom"] },
    logLevel: "error",
    esbuild: { jsx: "automatic" },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
        },
      },
      lib: {
        entry: path.join(packageDir, "tests/integration", entry),
        formats: ["iife"],
        name: "KozmosFixture",
      },
    },
  });
  return {
    code: (Array.isArray(result) ? result[0] : result).output.find(
      (output) => output.type === "chunk",
    ).code,
    css: fs.readFileSync(path.join(packageDir, "dist/style.css"), "utf8"),
  };
}

export async function launchFixtureBrowser() {
  const requested = process.env.ADAPTIVE_BROWSER ?? "chromium";
  const engines = { chromium, chrome: chromium, firefox, webkit };
  if (!Object.hasOwn(engines, requested))
    throw new Error(`Unsupported ADAPTIVE_BROWSER: ${requested}`);
  const browser = await engines[requested].launch({
    channel: requested === "chrome" ? "chrome" : undefined,
  });
  console.log(
    `Browser: ${requested} (${browser.browserType().name()} ${browser.version()})`,
  );
  return browser;
}

export async function settleLayout(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
      ),
  );
}
