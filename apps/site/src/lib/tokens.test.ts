import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeThemes, parseTokenCss, stepOf } from "./tokens-core";

const light = `/**
 * Do not edit directly.
 */

:root {
  --primitives-colors-background-0: #ffffff;
  --primitives-colors-background-25: #f7f8fa; /** A resting hover. */
  --semantics-radius-control: 16; /** Interactive controls. */
  --semantics-typography-family-system: ui-sans-serif, system-ui, "Segoe UI", sans-serif; /** The default. */
  --primitives-layout-spacing-100: 8;
}
`;

const dark = `[data-theme='dark'] {
  --primitives-colors-background-0: #000000;
  --primitives-colors-background-25: #17191c;
  --semantics-radius-control: 16;
  --semantics-typography-family-system: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --primitives-layout-spacing-100: 8;
}
`;

test("declarations parse with their values and descriptions", () => {
  const entries = parseTokenCss(light);
  assert.equal(entries.size, 5);
  assert.deepEqual(entries.get("--primitives-colors-background-25"), {
    value: "#f7f8fa",
    description: "A resting hover.",
  });
  assert.deepEqual(entries.get("--semantics-typography-family-system"), {
    value: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif',
    description: "The default.",
  });
  assert.equal(
    entries.get("--primitives-layout-spacing-100")?.description,
    undefined,
  );
});

test("themes merge by name, the dark value falling back to light", () => {
  const merged = mergeThemes(light, dark);
  assert.equal(merged.length, 5);
  assert.deepEqual(merged[0], {
    name: "--primitives-colors-background-0",
    light: "#ffffff",
    dark: "#000000",
    description: undefined,
  });
  assert.equal(merged[2].dark, "16");
  assert.equal(merged[2].description, "Interactive controls.");
});

test("ramp steps come from the name", () => {
  assert.equal(stepOf("--primitives-colors-theme-600"), 600);
  assert.equal(stepOf("--primitives-colors-theme-0"), 0);
  assert.ok(Number.isNaN(stepOf("--semantics-border-subtle")));
});
