import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertFirefoxScopeFloor } from "./firefox-support.mjs";

test("the package Firefox declaration meets the scoped-CSS prerequisite", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../../packages/react/package.json", import.meta.url),
      "utf8",
    ),
  );
  assertFirefoxScopeFloor(manifest.browserslist);
});

test("the old Firefox 128 declaration and other pre-scope versions are rejected", () => {
  for (const version of [128, 140, 145]) {
    assert.throws(
      () => assertFirefoxScopeFloor([`firefox >= ${version}`]),
      /requires Firefox >= 146/,
    );
  }
});

test("Firefox 146 and higher floors satisfy this prerequisite", () => {
  for (const version of [146, 146.1, 147]) {
    assertFirefoxScopeFloor(["chrome >= 118", `firefox >= ${version}`]);
  }
});

test("missing, ambiguous or broadened Firefox declarations require policy review", () => {
  for (const declarations of [
    undefined,
    [],
    ["firefox >= 146", "firefox >= 128"],
    ["firefox > 128"],
    ["ff >= 128"],
    ["firefox >= NaN"],
  ]) {
    assert.throws(() => assertFirefoxScopeFloor(declarations));
  }
});

test("a broad union cannot silently reintroduce Firefox below the declared minimum", () => {
  for (const query of [
    "defaults",
    "last 100 Firefox versions",
    "> 0%",
    "firefox 128",
  ]) {
    assert.throws(() => assertFirefoxScopeFloor(["firefox >= 146", query]));
  }
});
