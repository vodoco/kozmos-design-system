import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  along,
  cosmosSvgs,
  falloff,
  parseColour,
  readInputs,
  wedges,
} from "./generate-cosmos.mjs";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ART = path.join(SITE_ROOT, "src/home/cosmos");

test("a stop list is read as CSS reads a gradient's, straight between stops", () => {
  const stops = [
    [0, 0],
    [25, 1],
    [75, 1],
    [100, 0],
  ];
  assert.equal(along(stops, 0), 0);
  assert.equal(along(stops, 12.5), 0.5);
  assert.equal(along(stops, 50), 1);
  assert.equal(along(stops, 87.5), 0.5);
  assert.equal(along(stops, 100), 0);
});

test("the galaxy fades as its mask faded it: whole to a tenth, half at 40%, none at its edge", () => {
  assert.equal(falloff(0), 1);
  assert.equal(falloff(0.1), 1);
  assert.equal(falloff(0.25), 0.75);
  assert.equal(falloff(0.4), 0.5);
  assert.equal(falloff(1), 0);
});

test("wedges go once round, a degree each, and neighbours that match are one", () => {
  const one = wedges({ cx: 50, cy: 50, r: 72, from: 0, fill: () => "#000000" });
  assert.equal(one.length, 1);
  // One wedge for the whole turn is an arc past half of it.
  assert.match(one[0], /A72 72 0 1 1 /);
  const each = wedges({
    cx: 50,
    cy: 50,
    r: 72,
    from: 0,
    fill: (percent) => String(percent),
  });
  assert.equal(each.length, 360);
  // Each overlaps the next, so no seam shows between them.
  const angles = each.map((wedge) => {
    const [, x1, y1, x2, y2] = wedge
      .match(/L([-\d.]+) ([-\d.]+)A72 72 0 0 1 ([-\d.]+) ([-\d.]+)Z/)
      .map(Number);
    const turn = (x, y) =>
      ((Math.atan2(x - 50, 50 - y) * 180) / Math.PI + 360) % 360;
    return [turn(x1, y1), turn(x2, y2)];
  });
  for (let index = 1; index < angles.length; index += 1)
    assert.ok(angles[index][0] < angles[index - 1][1], `wedge ${index}`);
});

test("a token's colour is read in either form the stylesheet writes", () => {
  assert.deepEqual(parseColour("#7c3aed"), [124, 58, 237, 1]);
  assert.deepEqual(
    parseColour("rgba(255, 255, 255, 0.25)"),
    [255, 255, 255, 0.25],
  );
  assert.deepEqual(
    parseColour("rgb(255 255 255 / 0.25)"),
    [255, 255, 255, 0.25],
  );
  assert.throws(() => parseColour("oklch(0.6 0.2 300)"), /not a colour/);
});

test("an orbit whose tone has no colour stops the script", () => {
  const inputs = readInputs();
  assert.throws(
    () =>
      cosmosSvgs({
        ...inputs,
        orbits: [{ ...inputs.orbits[0], tone: "teal" }],
      }),
    /tone "teal" has no colour/,
  );
});

test("the committed cover images are what the orbits and the tokens make now, and nothing else is with them", () => {
  const files = cosmosSvgs(readInputs());
  for (const [file, contents] of files)
    assert.ok(
      fs.readFileSync(file, "utf8") === contents,
      `${path.relative(SITE_ROOT, file)} is out of date: run pnpm cosmos`,
    );
  assert.deepEqual(
    fs.readdirSync(ART).sort(),
    [...files.keys()].map((file) => path.basename(file)).sort(),
  );
});

test("every cover image is well-formed where a browser is strict", () => {
  // An SVG drawn as an image is parsed as XML: one error and it draws
  // nothing, silently. A double hyphen inside a comment is one.
  for (const name of fs.readdirSync(ART)) {
    const source = fs.readFileSync(path.join(ART, name), "utf8");
    for (const [, comment] of source.matchAll(/<!--([\s\S]*?)-->/g))
      assert.ok(!comment.includes("--"), `${name}: "--" inside a comment`);
    assert.match(source, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(source.trimEnd(), /<\/svg>$/);
  }
});

test("every cover image is drawn as WebKit draws it too", () => {
  for (const name of fs.readdirSync(ART)) {
    const source = fs.readFileSync(path.join(ART, name), "utf8");
    // WebKit draws no repeating gradient: it leaves the rings out.
    assert.ok(!source.includes("spreadMethod"), `${name}: spreadMethod`);
    // WebKit masks each child of a masked group on its own: a group holds
    // one layer, made one by an opacity, or the mask is on one shape.
    for (const [, next] of source.matchAll(/<g [^>]*mask="[^"]+"[^>]*>\n(.*)/g))
      assert.match(next, /^<g opacity="/, `${name}: a masked group of shapes`);
  }
  // The ring is a line painted with its colours, not colours cut by a line.
  assert.ok(
    !fs.readFileSync(path.join(ART, "ring.svg"), "utf8").includes("<mask"),
    "ring.svg: a mask",
  );
});
