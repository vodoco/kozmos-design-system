/**
 * Controls for the enum reader in `check-variant-parity.mjs`.
 *
 * The reader splits an enum body on commas to find its entries. A doc comment
 * inside the body carries commas of its own, and on 2026-09-22 one tore
 * `KozmosSpinnerSize` apart: the check reported Android as missing a size axis
 * it had just been given. Comments are blanked before the split now, and these
 * hold that.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  compareAxes,
  enumBodyValues,
  iosAxes,
  reactAxes,
} from "./check-variant-parity.mjs";

test("Swift component axes include shared utility enums", () => {
  assert.deepEqual(iosAxes("ArrivalPanel").presentation, [
    "standalone",
    "hosted",
  ]);
  assert.deepEqual(iosAxes("ManoeuvreCard").appearance, [
    "theme",
    "background",
  ]);
});

// The reader finds `<Component>Props`. Accordion's root props are a union
// around its form, and under another name its `variant` was never compared,
// while every platform passed.
test("Accordion's variant is read on React and on Swift", () => {
  assert.deepEqual(reactAxes("Accordion").variant, ["default", "boxed"]);
  assert.deepEqual(iosAxes("Accordion").variant, ["default", "boxed"]);
});

test("Kotlin entries are read through a doc comment that holds commas", () => {
  const block = `{
    /**
     * The scale: 16, 24, 32 and 48, as React's classes draw them.
     */
    Sm("sm", 16.dp),
    Md("md", 24.dp),
    Lg("lg", 32.dp),
    Xl("xl", 48.dp)
}`;
  assert.deepEqual(enumBodyValues(block, "kotlin"), ["Sm", "Md", "Lg", "Xl"]);
});

test("Kotlin entries survive a line comment, and members after the semicolon are not entries", () => {
  const block = `{
    Default, // the usual one
    Subtle;

    val label: String get() = name
}`;
  assert.deepEqual(enumBodyValues(block, "kotlin"), ["Default", "Subtle"]);
});

test("Swift cases are read, several to a line and through a comment", () => {
  const block = `{
    /** Two, three, four of them. */
    case sm, md
    case lg
    // a trailing note
    case xl
}`;
  assert.deepEqual(enumBodyValues(block, "swift"), ["sm", "md", "lg", "xl"]);
});

test("An axis is read by its own name before an alias: Drawer's placement and Figma's Side", () => {
  const { missingValues, missingAxes } = compareAxes(
    "Drawer",
    "figma",
    { placement: ["fixed", "inline"] },
    { Side: ["Right", "Left"], Placement: ["Fixed", "Inline"] },
  );
  assert.deepEqual(missingValues, []);
  assert.deepEqual(missingAxes, []);
});

test("reads a recipe shared with Vue as the component's own (Button, Vue 3 Phase 0)", () => {
  // Button's cva moved to packages/react/src/recipes/button.ts; its axes are
  // still Button's.
  const axes = reactAxes("Button");
  assert.deepEqual(axes.variant, [
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
    "glass",
  ]);
  assert.deepEqual(axes.size, ["default", "sm", "lg", "icon"]);
});
