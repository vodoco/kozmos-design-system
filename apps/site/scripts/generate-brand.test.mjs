import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  OUTPUTS,
  K_BOUNDS,
  STAR_BOUNDS,
  boundsOf,
  brandSvgs,
  icoOf,
  icoSizes,
  pngSize,
  readLogo,
  tokenValue,
} from "./generate-brand.mjs";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** The first 24 bytes of a PNG: its signature and the size in its header. */
function fakePng(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "latin1");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test("bounds are read from absolute path commands", () => {
  assert.deepEqual(boundsOf("M10 20L30 5H40V60Z"), {
    x: 10,
    y: 5,
    right: 40,
    bottom: 60,
  });
  assert.deepEqual(boundsOf("M0 0C-5 10 15 10 10 0Z"), {
    x: -5,
    y: 0,
    right: 15,
    bottom: 10,
  });
  assert.throws(() => boundsOf("M0 0l10 10"), /not one the logo uses/);
});

test("the logo's K is its first three shapes, where it has always been", () => {
  const logo = readLogo(
    fs.readFileSync(path.join(SITE_ROOT, "src/brand/kozmos-logo.svg"), "utf8"),
  );
  assert.equal(logo.paths.length, 4);
  assert.deepEqual(logo.bounds, K_BOUNDS);
  assert.throws(() => readLogo('<svg><path d="M0 0Z"/></svg>'), /four paths/);
});

test("the logo's first star is its third path, a square four-pointed star", () => {
  const logo = readLogo(
    fs.readFileSync(path.join(SITE_ROOT, "src/brand/kozmos-logo.svg"), "utf8"),
  );
  assert.deepEqual(logo.starBounds, STAR_BOUNDS);
  // As wide as it is tall: the page sizes it by one side.
  assert.equal(
    STAR_BOUNDS.right - STAR_BOUNDS.x,
    STAR_BOUNDS.bottom - STAR_BOUNDS.y,
  );
});

test("a token's value is read from the tokens' stylesheet", () => {
  const css =
    "[data-theme='dark'] {\n  --primitives-colors-background-0: #000000;\n}";
  assert.equal(tokenValue(css, "--primitives-colors-background-0"), "#000000");
  assert.throws(() => tokenValue(css, "--missing"), /--missing is not/);
});

test("an .ico holds its PNGs and reads back their sizes", () => {
  const ico = icoOf([fakePng(16, 16), fakePng(32, 32)]);
  assert.deepEqual(icoSizes(ico), [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
  ]);
});

test("the committed brand files are what the logo and the tokens make now", () => {
  const svgs = brandSvgs();
  assert.equal(fs.readFileSync(OUTPUTS.mark, "utf8"), svgs.mark);
  assert.equal(fs.readFileSync(OUTPUTS.star, "utf8"), svgs.star);
  assert.equal(fs.readFileSync(OUTPUTS.favicon, "utf8"), svgs.favicon);
  assert.deepEqual(icoSizes(fs.readFileSync(OUTPUTS.ico)), [
    { width: 16, height: 16 },
    { width: 32, height: 32 },
  ]);
  assert.deepEqual(pngSize(fs.readFileSync(OUTPUTS.touchIcon)), {
    width: 180,
    height: 180,
  });
});

test("every brand SVG is well-formed where a browser is strict", () => {
  // An SVG drawn as an image or a mask is parsed as XML: one error and it
  // draws nothing, silently. A double hyphen inside a comment is one.
  for (const file of [
    path.join(SITE_ROOT, "src/brand/kozmos-logo.svg"),
    OUTPUTS.mark,
    OUTPUTS.star,
    OUTPUTS.favicon,
  ]) {
    const source = fs.readFileSync(file, "utf8");
    for (const [, comment] of source.matchAll(/<!--([\s\S]*?)-->/g)) {
      assert.ok(
        !comment.includes("--"),
        `${path.basename(file)}: "--" inside a comment`,
      );
    }
    assert.match(source, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(source.trimEnd(), /<\/svg>$/);
  }
});
