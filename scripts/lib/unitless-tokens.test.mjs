/**
 * Controls for `scripts/check-unitless-tokens.mjs`.
 *
 * A checker that finds nothing is indistinguishable from a checker that looks
 * nowhere. These put each shape of the bug in front of it — GAP-38's own three
 * declarations, a token inside a length-taking function, a Tailwind arbitrary
 * value — and each shape's correct form beside it, so a change that blinds the
 * check fails here rather than in a component a year from now.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  enclosingFunction,
  findInSource,
  findInStylesheet,
  unitlessTokensFrom,
} from "./unitless-tokens.mjs";

const TOKENS = `[data-kozmos-root]{
  --primitives-layout-spacing-75: 6;
  --primitives-layout-spacing-200: 16;
  --primitives-layout-sizing-500: 40;
  --semantics-effect-glass-blur: 20;
  --semantics-effect-glass-border-opacity: 0.4;
  --primitives-opacity-50: 0.5;
  --primitives-layer-50: 50;
  --primitives-radius-sm: .25rem;
  --primitives-colors-theme-500: #135bec;
}`;

const unitless = unitlessTokensFrom([TOKENS]);

const css = (text) => findInStylesheet({ path: "probe.css", text }, unitless);
const source = (text) => findInSource({ path: "Probe.tsx", text }, unitless);

test("every custom property that is a bare number is collected, and no other", () => {
  assert.deepEqual(
    [...unitless].sort(),
    [
      "--primitives-layer-50",
      "--primitives-layout-sizing-500",
      "--primitives-layout-spacing-200",
      "--primitives-layout-spacing-75",
      "--primitives-opacity-50",
      "--semantics-effect-glass-blur",
      "--semantics-effect-glass-border-opacity",
    ].sort(),
    "a value with a unit, or a colour, is not a bare number",
  );
});

test("GAP-38's own three declarations are found", () => {
  const found = css(`.handle {
    height: var(--primitives-layout-spacing-200);
    padding-top: var(--primitives-layout-spacing-75);
  }
  .grip { width: var(--primitives-layout-sizing-500); }`);
  assert.deepEqual(
    found.map((f) => `${f.line}:${f.token}`),
    [
      "2:--primitives-layout-spacing-200",
      "3:--primitives-layout-spacing-75",
      "5:--primitives-layout-sizing-500",
    ],
  );
  assert.match(found[0].message, /calc\(var\(--primitives-layout-spacing-200\) \* 1px\)/);
});

test("the conversion is accepted, in each form the stylesheets use", () => {
  assert.deepEqual(css(`.a { height: calc(var(--primitives-layout-spacing-200) * 1px); }`), []);
  assert.deepEqual(css(`.b { font-size: calc(var(--primitives-layout-spacing-200) * 1rem / 16); }`), []);
  assert.deepEqual(
    css(`.c {
      transform: translateX(calc(var(--primitives-layout-spacing-200) * 1px));
    }`),
    [],
  );
});

test("a length inside a function is found, whatever the property is called", () => {
  const found = css(`.glass { backdrop-filter: blur(var(--semantics-effect-glass-blur)) saturate(1.8); }`);
  assert.equal(found.length, 1, "blur() takes a length and the property name says nothing");
  assert.equal(found[0].token, "--semantics-effect-glass-blur");
  assert.deepEqual(
    css(`.ok { backdrop-filter: blur(calc(var(--semantics-effect-glass-blur) * 1px)); }`),
    [],
  );
});

test("a number that is meant to be a number is left alone", () => {
  assert.deepEqual(css(`.a { opacity: var(--primitives-opacity-50); }`), []);
  assert.deepEqual(css(`.b { z-index: var(--primitives-layer-50); }`), []);
  assert.deepEqual(css(`.c { line-height: var(--primitives-opacity-50); }`), []);
  assert.deepEqual(css(`.d { flex-grow: var(--primitives-layer-50); }`), []);
});

test("a token read as a colour channel is not a length, inside a length property", () => {
  assert.deepEqual(
    css(`.glass { border: 1px solid rgba(255, 255, 255, var(--semantics-effect-glass-border-opacity)); }`),
    [],
    "the glass border's alpha is not a width",
  );
  assert.deepEqual(
    css(`.tint { box-shadow: 0 1px 2px rgba(0, 0, 0, var(--primitives-opacity-50)); }`),
    [],
  );
  assert.equal(
    css(`.real { box-shadow: 0 var(--primitives-layout-spacing-200) 0 #000; }`).length,
    1,
    "a length slot in the same property is still a length",
  );
});

test("a comment cannot hide a declaration, and line numbers survive one", () => {
  const found = css(`/* a comment
  mentioning height: var(--primitives-layout-spacing-200) */
.handle { height: var(--primitives-layout-spacing-200); }`);
  assert.equal(found.length, 1, "the commented copy is not a declaration");
  assert.equal(found[0].line, 3, "the live one keeps its line");
});

test("a Tailwind arbitrary value is found, and its converted form is not", () => {
  const found = source(`<div className="h-[var(--primitives-layout-spacing-200)] w-4" />`);
  assert.equal(found.length, 1);
  assert.match(found[0].message, /h-\[calc\(var\(--primitives-layout-spacing-200\)\*1px\)\]/);
  assert.deepEqual(
    source(`<div className="h-[calc(var(--primitives-layout-spacing-200)*1px)]" />`),
    [],
  );
  assert.deepEqual(
    source(`<div className="text-[var(--primitives-colors-theme-500)]" />`),
    [],
    "a colour in an arbitrary value is not a length",
  );
});

test("the innermost function is the one that decides", () => {
  const value = "blur(var(--a, rgba(0, 0, 0, var(--b))))";
  assert.equal(enclosingFunction(value, value.indexOf("--a")), "blur");
  assert.equal(enclosingFunction(value, value.indexOf("--b")), "rgba");
  assert.equal(enclosingFunction("var(--a)", 4), null, "var() alone encloses nothing");
  assert.equal(
    enclosingFunction("calc(var(--a) * 1px)", 9),
    null,
    "calc() alone encloses nothing either",
  );
});
