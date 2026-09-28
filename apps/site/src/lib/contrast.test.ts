import assert from "node:assert/strict";
import { test } from "node:test";
import { composite, contrastRatio, formatRatio, parseColour } from "./contrast";

test("colours parse from hex and rgb()", () => {
  assert.deepEqual(parseColour("#ffffff"), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColour("#000"), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColour("#00000080"), {
    r: 0,
    g: 0,
    b: 0,
    a: 128 / 255,
  });
  assert.deepEqual(parseColour("rgb(23, 25, 28)"), {
    r: 23,
    g: 25,
    b: 28,
    a: 1,
  });
  assert.deepEqual(parseColour("rgba(0, 0, 0, 0.5)"), {
    r: 0,
    g: 0,
    b: 0,
    a: 0.5,
  });
  assert.deepEqual(parseColour("rgb(0 0 0 / 0.2)"), {
    r: 0,
    g: 0,
    b: 0,
    a: 0.2,
  });
  assert.equal(parseColour("var(--x)"), undefined);
});

test("black on white is 21:1, white on white is 1:1", () => {
  const white = parseColour("#fff")!;
  const black = parseColour("#000")!;
  assert.equal(formatRatio(contrastRatio(black, white)), "21.00:1");
  assert.equal(formatRatio(contrastRatio(white, white)), "1.00:1");
  assert.equal(contrastRatio(black, white), contrastRatio(white, black));
});

test("the theme blue on white meets AA; the subtle border does not, by design", () => {
  const white = parseColour("#ffffff")!;
  assert.ok(contrastRatio(parseColour("#135bec")!, white) > 4.5);
  const subtle = contrastRatio(parseColour("#c7cad1")!, white);
  assert.ok(subtle > 1.5 && subtle < 1.7);
});

test("translucent colours composite before measuring", () => {
  const white = parseColour("#fff")!;
  const halfBlack = parseColour("rgba(0, 0, 0, 0.5)")!;
  assert.deepEqual(composite(halfBlack, white), {
    r: 128,
    g: 128,
    b: 128,
    a: 1,
  });
  const ratio = contrastRatio(halfBlack, white);
  assert.ok(ratio > 3.9 && ratio < 4.1, `got ${ratio}`);
});

test("rounding never lifts a ratio over a threshold", () => {
  assert.equal(formatRatio(4.4999), "4.49:1");
  assert.equal(formatRatio(2.997), "2.99:1");
});
