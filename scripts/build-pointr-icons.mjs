/**
 * Generate owned React components from the Pointr Icon Library's own artwork.
 *
 * `@kozmos-ds/icons` maps its names onto lucide components, which draw the same
 * concept in a different hand. That was recorded as "renders different artwork
 * from Figma ... resolve before extending" (`docs/ds-handoff.md` §4.4), and the
 * POI detail card made it concrete: 14 of its 19 glyphs had no Kozmos name at
 * all. The icons added from here carry Pointr's real outlines instead.
 *
 * Both libraries draw on a 24×24 grid at stroke 2 with round caps, measured
 * 2026-09-14, so an owned icon and a lucide icon are interchangeable in a row.
 *
 * The node ids come from `docs/figma-pointr-icon-catalog.json`. Note that
 * `figma:icons`, which regenerates that catalog, needs `library_content:read`
 * and the current token does not carry it — but `/v1/images`, which this script
 * uses, works on `file_content:read`.
 *
 * Usage: FIGMA_ACCESS_TOKEN=... node scripts/build-pointr-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const FILE_KEY = "PpbQbvpNTMvwqCx9dD4efJ";
const CATALOG = path.join(ROOT_DIR, "docs/figma-pointr-icon-catalog.json");
const OUTPUT = path.join(
  ROOT_DIR,
  "packages/icons/src/pointr/icons.generated.ts",
);

/**
 * The icons owned so far, and why each is here: every one was drawn by the
 * SDK's POI detail card (`HbFSXhCPxKUy2fWa5x9TKO`, node `241:4772`) and had no
 * Kozmos equivalent. Adding a name here and re-running is the whole process.
 */
const OWNED = [
  "heart",
  "bookmark",
  "loading-01",
  "eye",
  "share-01",
  "calendar-check-01",
  "shopping-bag-02",
  "layout-alt-02",
  "phone",
  "globe-02",
  "mail-01",
  "clock-plus",
  "feather",
];

function findDotEnv(startDir) {
  let current = startDir;
  for (;;) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function parseDotEnv(filePath) {
  const values = {};
  if (!filePath) return values;
  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return values;
}

// `Infinity`, `NaN` and `undefined` cannot be bound without shadowing the
// global of the same name inside this module — ESLint's
// no-shadow-restricted-names refuses it, and it is a genuine hazard in
// generated code nobody reads. The catalogue contains `infinity`. Bind such an
// icon under a safe local name and export it under the name callers expect, so
// the package's surface is unchanged.
const RESTRICTED = new Set(["Infinity", "NaN", "undefined"]);

function emitIcon(exported, paths) {
  const body = `/* @__PURE__ */ createPointrIcon("${exported}", [\n${paths}\n])`;
  if (!RESTRICTED.has(exported)) return `export const ${exported} = ${body};`;
  return (
    `const ${exported}Icon = ${body};\n` +
    `export { ${exported}Icon as ${exported} };`
  );
}

function pascalCase(name) {
  return name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Pull the outlines out of an exported SVG.
 *
 * Stroke attributes are dropped deliberately: the wrapper sets them once, so an
 * icon inherits `currentColor` and whatever `strokeWidth` the caller asked for
 * instead of freezing the black and the 2 that Figma exported. Anything else —
 * a fill, a shape that is not a path — is refused rather than silently lost.
 */
function extractPaths(svg, name) {
  const elements = [...svg.matchAll(/<(\w+)([^>]*)\/>/g)];
  const paths = [];

  for (const [, tag, attrText] of elements) {
    if (tag !== "path") {
      throw new Error(
        `${name}: <${tag}> is not a path; this generator only understands paths`,
      );
    }
    const attrs = {};
    for (const [, key, value] of attrText.matchAll(/([\w-]+)="([^"]*)"/g)) {
      attrs[key] = value;
    }
    const fill = attrs.fill;
    if (fill && fill !== "none") {
      throw new Error(
        `${name}: path carries fill="${fill}"; the wrapper draws strokes, not fills`,
      );
    }
    paths.push({
      d: attrs.d,
      ...(attrs["fill-rule"] ? { fillRule: attrs["fill-rule"] } : {}),
      ...(attrs["clip-rule"] ? { clipRule: attrs["clip-rule"] } : {}),
    });
  }

  if (!paths.length) throw new Error(`${name}: no paths found`);
  return paths;
}

async function figma(pathname, token) {
  const response = await fetch(`https://api.figma.com/v1${pathname}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!response.ok) {
    throw new Error(
      `Figma API ${response.status} for ${pathname}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response.json();
}

const env = { ...parseDotEnv(findDotEnv(ROOT_DIR)), ...process.env };
const token = env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Missing FIGMA_ACCESS_TOKEN. Add it to .env or pass it in the environment.",
  );
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf-8"));
const byName = new Map(catalog.icons.map((icon) => [icon.name, icon]));

// `--all` builds every icon the catalogue lists rather than the curated set
// above. The catalogue can name the same icon twice — `colors` appears at two
// nodes — and two entries would emit the same `export const`, so the first
// wins and the rest are reported rather than silently overwriting.
const buildAll = process.argv.includes("--all");
const duplicates = [];
let picked;
if (buildAll) {
  const seen = new Set();
  picked = [];
  for (const icon of catalog.icons) {
    if (seen.has(icon.name)) {
      duplicates.push(icon.name);
      continue;
    }
    seen.add(icon.name);
    picked.push({ ...icon });
  }
} else {
  picked = OWNED.map((name) => {
    const icon = byName.get(name);
    if (!icon)
      throw new Error(`${name} is not in ${path.relative(ROOT_DIR, CATALOG)}`);
    return { name, ...icon };
  });
}
if (duplicates.length) {
  console.log(
    `  ${duplicates.length} duplicate name(s) in the catalogue, first wins: ${duplicates.join(", ")}`,
  );
}
console.log(`  building ${picked.length} icon(s)\n`);

const ID_BATCH = 120;
const images = {};
for (let i = 0; i < picked.length; i += ID_BATCH) {
  const batch = picked.slice(i, i + ID_BATCH);
  const page = await figma(
    `/images/${FILE_KEY}?ids=${encodeURIComponent(batch.map((p) => p.nodeId).join(","))}&format=svg`,
    token,
  );
  Object.assign(images, page.images);
  if (picked.length > ID_BATCH) {
    console.log(
      `  asked Figma for ${Math.min(i + ID_BATCH, picked.length)}/${picked.length} image url(s)`,
    );
  }
}

const svgOf = async (icon) => {
  const url = images[icon.nodeId];
  if (!url)
    throw new Error(`${icon.name}: Figma returned no image for ${icon.nodeId}`);
  // S3 hands these out and occasionally drops one; a whole run should not be
  // lost to a single flake.
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error(`${icon.name}: could not download ${url} (${lastError})`);
};

const CONCURRENCY = 8;
const generated = new Array(picked.length);
let cursor = 0;
let done = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, picked.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= picked.length) return;
      const icon = picked[index];
      const paths = extractPaths(await svgOf(icon), icon.name);
      generated[index] = { ...icon, paths };
      done += 1;
      if (picked.length <= 40 || done % 100 === 0 || done === picked.length) {
        console.log(`  ${done}/${picked.length} drawn`);
      }
    }
  }),
);

const body = generated
  .map((icon) => {
    const paths = icon.paths
      .map((p) => {
        const extras = [
          p.fillRule ? `\n      fillRule: "${p.fillRule}",` : "",
          p.clipRule ? `\n      clipRule: "${p.clipRule}",` : "",
        ].join("");
        return `    {\n      d: "${p.d}",${extras}\n    },`;
      })
      .join("\n");
    return (
      `/** ${icon.description || icon.name} — Pointr \`${icon.name}\`, node \`${icon.nodeId}\`. */\n` +
      emitIcon(pascalCase(icon.name), paths)
    );
  })
  .join("\n\n");

const header = `/**
 * Generated by scripts/build-pointr-icons.mjs — do not edit by hand.
 *
 * The outlines are the Pointr Icon Library's own, exported from
 * https://www.figma.com/design/${FILE_KEY}/Pointr-Icon-Library and carried here
 * so that an icon the design system names is the icon the product draws.
 */
import { createPointrIcon } from "./createPointrIcon";

`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, header + body + "\n");
console.log(
  `\n${generated.length} icons -> ${path.relative(ROOT_DIR, OUTPUT)}`,
);
