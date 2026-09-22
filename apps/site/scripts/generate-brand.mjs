#!/usr/bin/env node
/**
 * Derives the site's brand files from the one logo it was given, so no mark
 * is ever drawn or coloured by hand:
 *
 *  - src/brand/kozmos-mark.svg — the logo's own K, alone: the header shows it
 *    where the full logo has no room (below 48rem);
 *  - src/brand/kozmos-star.svg — the four-pointed star from the logo's first
 *    O, alone: the home page's sky is scattered with it, as the Figma file's
 *    cover is;
 *  - public/favicon.svg — that K on a rounded tile, for the browser tab;
 *  - public/favicon.ico — the same at 16 and 32 pixels, for anything that
 *    asks for /favicon.ico or cannot draw an SVG icon;
 *  - public/apple-touch-icon.png — the K on a square, 180 pixels, for a
 *    phone's home screen (the phone rounds the corners itself).
 *
 * The source is src/brand/kozmos-logo.svg: white artwork, as supplied. The
 * icons keep it that way — the K in the dark theme's foreground-0 on its
 * background-0, read from the tokens' dark stylesheet — so they are the
 * logo as given and stand out on a light or a dark tab bar alike.
 *
 *   node scripts/generate-brand.mjs            # write every file
 *   node scripts/generate-brand.mjs --check    # fail if an SVG would change
 *
 * Drawing the PNG and ICO files needs Playwright's Chromium (the end-to-end
 * tests' browser). The check reads the SVGs only; it runs in `pnpm test`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const LOGO = path.join(SITE_ROOT, "src/brand/kozmos-logo.svg");
const DARK_TOKENS = fileURLToPath(
  import.meta.resolve("@kozmos/tokens/css/dark.css"),
);

export const OUTPUTS = {
  mark: path.join(SITE_ROOT, "src/brand/kozmos-mark.svg"),
  star: path.join(SITE_ROOT, "src/brand/kozmos-star.svg"),
  favicon: path.join(SITE_ROOT, "public/favicon.svg"),
  ico: path.join(SITE_ROOT, "public/favicon.ico"),
  touchIcon: path.join(SITE_ROOT, "public/apple-touch-icon.png"),
};

/** The K's measured bounds in the logo's coordinates; a changed logo fails here. */
export const K_BOUNDS = { x: 36.8564, y: 123.46, right: 309.429, bottom: 417 };

/** The first star's bounds (the logo's third path, inside the first O). */
export const STAR_BOUNDS = { x: 370, y: 226, right: 448, bottom: 304 };

/** The K's share of its tile's height: room around it, like an app icon's. */
const TILE_SHARE = 0.62;
/** Corner radius as a share of the tile, as app icons round theirs. */
const TILE_RADIUS = 0.225;
/** On the home-screen square the phone crops the corners, so the K is smaller. */
const SQUARE_SHARE = 0.55;

const round = (value) => Number(value.toFixed(4));

/**
 * The bounds of path data drawn with absolute commands (M, L, H, V, C, Z),
 * the only ones the logo uses. A curve's control points are included, which
 * is exact for straight-edged glyphs and conservative for round ones.
 */
export function boundsOf(d) {
  const tokens = d.match(/[A-Za-z]|-?(?:\d*\.)?\d+(?:e-?\d+)?/g) ?? [];
  const xs = [];
  const ys = [];
  let command = "";
  let x = 0;
  let y = 0;
  for (let index = 0; index < tokens.length; ) {
    if (/[A-Za-z]/.test(tokens[index])) {
      command = tokens[index];
      index += 1;
      if (command === "Z") continue;
    }
    const take = () => Number(tokens[index++]);
    if (command === "M" || command === "L") {
      x = take();
      y = take();
    } else if (command === "H") {
      x = take();
    } else if (command === "V") {
      y = take();
    } else if (command === "C") {
      for (let point = 0; point < 3; point += 1) {
        x = take();
        y = take();
        xs.push(x);
        ys.push(y);
      }
      continue;
    } else {
      throw new Error(
        `Path command "${command}" is not one the logo uses; extend boundsOf.`,
      );
    }
    xs.push(x);
    ys.push(y);
  }
  return {
    x: round(Math.min(...xs)),
    y: round(Math.min(...ys)),
    right: round(Math.max(...xs)),
    bottom: round(Math.max(...ys)),
  };
}

/**
 * The logo's paths; the K, the first three shapes of the wordmark; and the
 * first of its two stars.
 */
export function readLogo(source) {
  const paths = [...source.matchAll(/<path d="([^"]+)"/g)].map(
    (match) => match[1],
  );
  if (paths.length !== 4) {
    throw new Error(
      `Expected the logo's four paths (wordmark, subline, two stars), found ${paths.length}.`,
    );
  }
  const shapes = paths[0]
    .split(/(?<=Z)/)
    .map((shape) => shape.trim())
    .filter(Boolean);
  const k = shapes.slice(0, 3).join("");
  const bounds = boundsOf(k);
  if (JSON.stringify(bounds) !== JSON.stringify(K_BOUNDS)) {
    throw new Error(
      `The logo's first three shapes are not the K it had (${JSON.stringify(bounds)}); update K_BOUNDS and check the mark.`,
    );
  }
  const star = paths[2];
  const starBounds = boundsOf(star);
  if (JSON.stringify(starBounds) !== JSON.stringify(STAR_BOUNDS)) {
    throw new Error(
      `The logo's third path is not the star it had (${JSON.stringify(starBounds)}); update STAR_BOUNDS and check the star.`,
    );
  }
  return { paths, k, bounds, star, starBounds };
}

/** A token's value from a tokens stylesheet. */
export function tokenValue(css, name) {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`${name} is not in the tokens' stylesheet.`);
  return match[1].trim();
}

// XML forbids a double hyphen inside a comment, and an SVG that is not
// well-formed draws nothing at all, as an icon or as a mask; so this names
// the script, not the pnpm command with its flag.
const HEADER =
  "<!-- Generated from src/brand/kozmos-logo.svg by scripts/generate-brand.mjs (the site's brand script). Change the logo and run the script; do not edit this file. -->";

/** The K alone, on a canvas trimmed to it: the header's mark on a phone. */
export function markSvg({ k, bounds }) {
  const width = round(bounds.right - bounds.x);
  const height = round(bounds.bottom - bounds.y);
  return [
    `<svg width="${width}" height="${height}" viewBox="${bounds.x} ${bounds.y} ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    HEADER,
    `<path d="${k}" fill="white"/>`,
    "</svg>",
    "",
  ].join("\n");
}

/** The first star alone, on a canvas trimmed to it: the home page's stars. */
export function starSvg({ star, starBounds }) {
  const width = round(starBounds.right - starBounds.x);
  const height = round(starBounds.bottom - starBounds.y);
  return [
    `<svg width="${width}" height="${height}" viewBox="${starBounds.x} ${starBounds.y} ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    HEADER,
    `<path d="${star}" fill="white"/>`,
    "</svg>",
    "",
  ].join("\n");
}

/** The K centred on a square tile of the dark theme's background. */
export function tileSvg(
  { k, bounds },
  { background, foreground },
  { share, radius },
) {
  const size = round((bounds.bottom - bounds.y) / share);
  const x = round((bounds.x + bounds.right) / 2 - size / 2);
  const y = round((bounds.y + bounds.bottom) / 2 - size / 2);
  const corner = radius ? ` rx="${round(size * radius)}"` : "";
  return [
    `<svg viewBox="${x} ${y} ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`,
    HEADER,
    `<rect x="${x}" y="${y}" width="${size}" height="${size}"${corner} fill="${background}"/>`,
    `<path d="${k}" fill="${foreground}"/>`,
    "</svg>",
    "",
  ].join("\n");
}

/** Every SVG this script writes, from the logo's and the tokens' current text. */
export function brandSvgs(
  logoSource = fs.readFileSync(LOGO, "utf8"),
  darkCss = fs.readFileSync(DARK_TOKENS, "utf8"),
) {
  const logo = readLogo(logoSource);
  const colours = {
    background: tokenValue(darkCss, "--primitives-colors-background-0"),
    foreground: tokenValue(darkCss, "--primitives-colors-foreground-0"),
  };
  return {
    mark: markSvg(logo),
    star: starSvg(logo),
    favicon: tileSvg(logo, colours, { share: TILE_SHARE, radius: TILE_RADIUS }),
    touchIcon: tileSvg(logo, colours, { share: SQUARE_SHARE, radius: 0 }),
  };
}

/** Width and height from a PNG's header. */
export function pngSize(buffer) {
  if (buffer.toString("latin1", 1, 4) !== "PNG") throw new Error("Not a PNG.");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** An .ico holding PNG images, which every browser and Windows Vista on read. */
export function icoOf(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map((png) => {
    const { width, height } = pngSize(png);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

/** The sizes an .ico holds, read back from its directory. */
export function icoSizes(buffer) {
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const at = 6 + 16 * index;
    const offset = buffer.readUInt32LE(at + 12);
    const length = buffer.readUInt32LE(at + 8);
    return pngSize(buffer.subarray(offset, offset + length));
  });
}

/** Draws an SVG at a size in Chromium and returns the PNG, corners transparent. */
async function rasterise(page, svg, size) {
  await page.setViewportSize({ width: size, height: size });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;background:transparent}img{display:block}</style><img width="${size}" height="${size}" src="${src}">`,
  );
  await page.locator("img").evaluate((image) => image.decode());
  return page.screenshot({ omitBackground: true, type: "png" });
}

async function main() {
  const svgs = brandSvgs();
  if (process.argv.includes("--check")) {
    const stale = ["mark", "star", "favicon"].filter(
      (name) =>
        !fs.existsSync(OUTPUTS[name]) ||
        fs.readFileSync(OUTPUTS[name], "utf8") !== svgs[name],
    );
    if (stale.length > 0) {
      console.error(
        `Out of date: ${stale.map((name) => path.relative(SITE_ROOT, OUTPUTS[name])).join(", ")}. Run pnpm --filter @kozmos/site brand.`,
      );
      process.exit(1);
    }
    console.log(
      "generate-brand: the brand files match the logo and the tokens.",
    );
    return;
  }
  fs.writeFileSync(OUTPUTS.mark, svgs.mark);
  fs.writeFileSync(OUTPUTS.star, svgs.star);
  fs.writeFileSync(OUTPUTS.favicon, svgs.favicon);
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    const small = [
      await rasterise(page, svgs.favicon, 16),
      await rasterise(page, svgs.favicon, 32),
    ];
    fs.writeFileSync(OUTPUTS.ico, icoOf(small));
    fs.writeFileSync(
      OUTPUTS.touchIcon,
      await rasterise(page, svgs.touchIcon, 180),
    );
  } finally {
    await browser.close();
  }
  for (const file of Object.values(OUTPUTS)) {
    console.log(
      `wrote ${path.relative(SITE_ROOT, file)} (${fs.statSync(file).size} bytes)`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
