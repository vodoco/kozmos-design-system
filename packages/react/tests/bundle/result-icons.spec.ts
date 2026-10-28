// @vitest-environment node
/**
 * What an app pays in icons for the search results.
 *
 * A lookup by name (`getIconComponent`, `isKozmosIconKey`, `<Icon name>`) keeps
 * every icon a name can reach: 86 of them, about 20 KB gzip, measured on
 * 28 Oct. The bundle analyzer leaves `@kozmos-ds/icons` to the app, so it never
 * sees them. When POIResultCard drew a host action's icon by name (GAP-028),
 * an app that imported POIResultList alone went from 18.8 to 38.9 KB gzip,
 * every one of the 86 with it. The result cards draw a host action's icon from
 * the components the product hands them instead (`hostActionIcons`), and this
 * bundles each result part alone from the built package, as an app's build
 * does (esbuild as Vite ships it, `sideEffects` honoured, React left to the
 * app, everything else bundled), and fails if the icons a name reaches come
 * back with it.
 *
 * It reads the built packages: `pnpm test` builds them first, through turbo.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const PACKAGE_DIR = path.resolve(__dirname, "../..");
const ENTRY = path.join(PACKAGE_DIR, "dist/kozmos-react.mjs");
const requireFromPackage = createRequire(
  path.join(PACKAGE_DIR, "package.json"),
);
const requireFromVite = createRequire(
  requireFromPackage.resolve("vite/package.json"),
);
const esbuild = requireFromVite("esbuild") as typeof import("esbuild");

// The icons a result card draws by its own import, never by a name.
const ALLOWED = 3;

type IconComponent = { displayName?: string; render?: unknown };
let nameable: string[] = [];

beforeAll(async () => {
  expect(
    fs.existsSync(ENTRY),
    "dist/kozmos-react.mjs is missing: build the package first (pnpm --filter @kozmos-ds/react... build)",
  ).toBe(true);
  const iconsEntry = requireFromPackage
    .resolve("@kozmos-ds/icons")
    .replace(/index\.cjs$/, "index.mjs");
  const icons = (await import(pathToFileURL(iconsEntry).href)) as {
    kozmosIconRegistry: Record<string, IconComponent>;
    kozmosIconNamesBeyondTheLibrary: readonly string[];
    getIconComponent: (name: string) => IconComponent | undefined;
  };
  nameable = [
    ...Object.values(icons.kozmosIconRegistry),
    ...icons.kozmosIconNamesBeyondTheLibrary.map((name) =>
      icons.getIconComponent(name),
    ),
  ]
    .map((icon) => icon?.displayName)
    .filter((name): name is string => typeof name === "string");
  expect(nameable.length).toBeGreaterThan(50);
});

async function bundle(exported: string) {
  const result = await esbuild.build({
    stdin: {
      contents: `export { ${exported} } from ${JSON.stringify(ENTRY)};`,
      resolveDir: PACKAGE_DIR,
      loader: "js",
    },
    bundle: true,
    write: false,
    format: "esm",
    minify: true,
    platform: "browser",
    external: ["react", "react/*", "react-dom", "react-dom/*"],
    loader: { ".css": "empty" },
    logLevel: "silent",
  });
  const code = result.outputFiles[0].text;
  // Each icon's factory is called with its name, so the name is in a bundle
  // exactly when the icon is.
  const reached = nameable.filter(
    (name) => code.includes(`"${name}"`) || code.includes(`'${name}'`),
  );
  return { reached, gzipKB: gzipSync(code).length / 1024 };
}

describe("the search results' icons", () => {
  it.each(["POIResultCard", "POIResultList", "POIResultGroup"])(
    "%s alone keeps out the icons only a name reaches",
    async (exported) => {
      const { reached, gzipKB } = await bundle(exported);
      expect(
        reached.length,
        `${exported} alone bundles ${reached.length} of the ${nameable.length} icons a name reaches (${gzipKB.toFixed(2)} KB gzip with its dependencies)`,
      ).toBeLessThanOrEqual(ALLOWED);
    },
    30_000,
  );
});
