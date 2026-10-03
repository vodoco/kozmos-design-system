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
test("each transport retains its body while changing the explicit physical arrow", () => {
  const { glyphs } = JSON.parse(
    fs.readFileSync(
      path.join(root, "packages/icons/src/owned/navigation-glyphs.json"),
      "utf8",
    ),
  );
  for (const transport of ["lift", "stairs", "escalator", "ramp"]) {
    const up = glyphs.find((g) => g.kind === `${transport}-up`);
    const down = glyphs.find((g) => g.kind === `${transport}-down`);
    assert.deepEqual(up.paths.slice(0, -1), down.paths.slice(0, -1));
    assert.equal(up.paths.at(-1), "M20 19 L20 5 M17 8 L20 5 L23 8");
    assert.equal(down.paths.at(-1), "M20 5 L20 19 M17 16 L20 19 L23 16");
  }
  assert.equal(
    new Set(glyphs.map((g) => g.paths.join(" "))).size,
    glyphs.length,
  );
});
