import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
test("all platform navigation glyphs are generated from the same source", () => {
  execFileSync(
    process.execPath,
    ["scripts/generate-navigation-glyphs.mjs", "--check"],
    { cwd: root, stdio: "pipe" },
  );
});
const { glyphs } = JSON.parse(
  fs.readFileSync(
    path.join(root, "packages/icons/src/owned/navigation-glyphs.json"),
    "utf8",
  ),
);
const glyph = (kind) => glyphs.find((g) => g.kind === kind);
test("every glyph is a solid drawing from the Pointr Maps - Express file", () => {
  for (const g of glyphs) {
    assert.equal(g.paint, "fill", `${g.name}: Express artwork is solid`);
    assert.match(g.figma, /^\d+:\d+$/, `${g.name}: names its Figma node`);
  }
  assert.equal(new Set(glyphs.map((g) => g.figma)).size, glyphs.length);
  assert.equal(
    new Set(glyphs.map((g) => g.paths.join(" "))).size,
    glyphs.length,
  );
});
test("each transport's up and down are different drawings", () => {
  for (const transport of ["lift", "stairs", "escalator", "ramp"])
    assert.notDeepEqual(
      glyph(`${transport}-up`).paths,
      glyph(`${transport}-down`).paths,
    );
});
test("exit leaves through the door entry comes in by", () => {
  // Express draws Exit as Entrance mirrored: the arrow going into a door on
  // the left. Exit keeps Entrance's door, on the right as in EntranceExit,
  // with the arrow pointing away from it.
  const enter = glyph("enter");
  const exit = glyph("exit");
  assert.equal(exit.paths[0], enter.paths[0]);
  assert.notEqual(exit.paths[1], enter.paths[1]);
  assert.ok(exit.note, "a departure from the file says so");
});
