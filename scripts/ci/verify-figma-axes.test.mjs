import assert from "node:assert/strict";
import test from "node:test";
import {
  constantLists,
  expectations,
} from "../verify-figma-library.mjs";

// figma:verify compares the live file with the axes the plugin declares. It
// must read a list as the plugin computes it, or it reports drift the file
// does not have (Input, NumberInput and Combobox's Mixed, 12–15 Nov).

test("a list takes its quoted names, string constants and spread lists", () => {
  const lists = constantLists(`
const MIXED = "Mixed";
const BASE = ["Default", "Focus"];
const WITH_CONSTANT = [
  "Default",
  // a comment, "Ignored", is no name
  MIXED,
];
const SPREAD = [...BASE, "Readonly"];
`);
  assert.deepEqual(lists.WITH_CONSTANT, ["Default", "Mixed"]);
  assert.deepEqual(lists.SPREAD, ["Default", "Focus", "Readonly"]);
});

test("a list extended with concat holds its base and what it adds", () => {
  const lists = constantLists(`
const ADDED = "Mixed";
const EXTENDED = BASE.concat([ADDED, "Error"]);
const BASE = ["Default", "Focus"];
`);
  assert.deepEqual(lists.EXTENDED, ["Default", "Focus", "Mixed", "Error"]);
});

test("a list with anything the verifier cannot resolve is no list", () => {
  const lists = constantLists(`
const UNKNOWN_NAME = ["Default", SOMETHING_ELSE];
const NUMBERS = [1, 2];
const CALLED = [label("Default")];
`);
  assert.equal(lists.UNKNOWN_NAME, undefined);
  assert.equal(lists.NUMBERS, undefined);
  assert.equal(lists.CALLED, undefined);
});

test("the plugin's mixed fields declare their Mixed state", () => {
  const { axes } = expectations();
  for (const set of ["Input", "NumberInput", "Combobox"]) {
    assert.ok(axes[set]?.State, `${set} has a State axis`);
    assert.ok(axes[set].State.includes("Mixed"), `${set} declares Mixed`);
  }
});

// Decisions 188 to 190: Switch's Mixed is a value of its Checked axis, so a
// mixed switch can be disabled or in error too; ToggleButton's of its State.
test("the plugin's Switch and ToggleButton declare their Mixed value", () => {
  const { axes } = expectations();
  assert.deepEqual(axes.Switch?.Checked, ["Unchecked", "Checked", "Mixed"]);
  assert.ok(axes.ToggleButton?.State?.includes("Mixed"), "ToggleButton declares Mixed");
});
