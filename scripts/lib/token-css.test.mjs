/**
 * Controls for `scripts/lib/token-css.mjs`: a token stylesheet read as
 * values, its references followed in the theme it describes (GAP-23).
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  referenceOf,
  resolvedTokens,
  tokenDeclarations,
} from "./token-css.mjs";

const LIGHT = `/**
 * Do not edit directly, this file was auto-generated.
 */

:root {
  --primitives-colors-theme-500: #135bec;
  --primitives-colors-theme-600: #1051e8;
  --semantics-emotion-themed-text: var(--primitives-colors-theme-600); /** On a page. */
  --components-fill: var(--primitives-colors-theme-500); /** The fill. */
  --components-twice: var( --components-fill );
  --semantics-radius-control: 16;
}
`;

test("every declaration is read as written, comments aside", () => {
  const declared = tokenDeclarations(LIGHT);
  assert.equal(declared.size, 6);
  assert.equal(
    declared.get("--components-fill"),
    "var(--primitives-colors-theme-500)",
  );
  assert.equal(declared.get("--semantics-radius-control"), "16");
});

test("a reference is followed to the value it ends at, through a chain", () => {
  const resolved = resolvedTokens(LIGHT);
  assert.equal(resolved.get("--semantics-emotion-themed-text"), "#1051e8");
  assert.equal(resolved.get("--components-fill"), "#135bec");
  assert.equal(resolved.get("--components-twice"), "#135bec");
  assert.equal(resolved.get("--semantics-radius-control"), "16");
});

test("only a bare reference is one: not a fallback, not a value among others", () => {
  assert.equal(referenceOf("var(--a)"), "--a");
  assert.equal(referenceOf(" var( --a ) "), "--a");
  assert.equal(referenceOf("var(--a, #fff)"), null);
  assert.equal(referenceOf("0 0 var(--a)"), null);
  assert.equal(referenceOf("#135bec"), null);
});

test("a reference out of the stylesheet, or back to itself, fails by name", () => {
  assert.throws(
    () => resolvedTokens(":root {--a: var(--gone);}"),
    /--a refers to --gone, which the stylesheet does not declare/,
  );
  assert.throws(
    () => resolvedTokens(":root {--a: var(--b); --b: var(--a);}"),
    /--a → --b → --a refers back to itself/,
  );
});
