import assert from "node:assert/strict";
import { test } from "node:test";
import { brandOverrides } from "./brand";
import type { TokenEntry } from "./tokens-core";

const entry = (name: string, light: string, dark = light): TokenEntry => ({
  name,
  light,
  dark,
});

const list: TokenEntry[] = [
  entry("--primitives-colors-theme-0", "#eaf0fd", "#0b1a3a"),
  entry("--primitives-colors-theme-600", "#135bec", "#5b8cff"),
  entry("--primitives-colors-theme-700", "#0d44c2", "#3d73f0"),
  entry("--primitives-colors-theme-variant-1-600", "#00a37a", "#33d1a8"),
  entry("--primitives-colors-foreground-1000", "#ffffff", "#000000"),
  // Baked values: the idle background is theme-700 in both themes …
  entry(
    "--components-primary-buttons-themed-button-background-idle",
    "#0D44C2",
    "#3d73f0",
  ),
  // … the hover sits on different steps per theme …
  entry(
    "--components-primary-buttons-themed-button-background-hover",
    "#135bec",
    "#3d73f0",
  ),
  // … and the content colour is not on the ramp at all.
  entry(
    "--components-primary-buttons-themed-button-foreground-content-idle",
    "#ffffff",
    "#000000",
  ),
  entry(
    "--components-primary-buttons-danger-button-background-idle",
    "#c00",
    "#c00",
  ),
];

test("the theme itself needs no override", () => {
  assert.deepEqual(brandOverrides(list, "theme"), {
    tokens: {},
    repointed: [],
    unmatched: [],
  });
});

test("a variant re-points the ramp and the component tokens it can match", () => {
  const result = brandOverrides(list, "variant-1");
  assert.equal(
    result.tokens["--primitives-colors-theme-0"],
    "var(--primitives-colors-theme-variant-1-0)",
  );
  assert.equal(
    result.tokens["--primitives-colors-theme-600"],
    "var(--primitives-colors-theme-variant-1-600)",
  );
  assert.equal(
    result.tokens["--components-primary-buttons-themed-button-background-idle"],
    "var(--primitives-colors-theme-variant-1-700)",
  );
  assert.deepEqual(result.repointed, [
    "--components-primary-buttons-themed-button-background-idle",
  ]);
  assert.deepEqual(result.unmatched, [
    "--components-primary-buttons-themed-button-background-hover",
    "--components-primary-buttons-themed-button-foreground-content-idle",
  ]);
  // Other emotions and the variant ramp itself are untouched.
  assert.equal(
    "--components-primary-buttons-danger-button-background-idle" in
      result.tokens,
    false,
  );
  assert.equal(
    "--primitives-colors-theme-variant-1-600" in result.tokens,
    false,
  );
});
