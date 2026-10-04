import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("CSS compiler helpers participate in the cached package build", () => {
  const config = JSON.parse(
    fs.readFileSync(new URL("../../turbo.json", import.meta.url), "utf8"),
  );
  assert.ok(
    config.tasks.build.inputs.includes("postcss/**"),
    "Changing scoped-css, shadow-reach or token-alpha must invalidate built CSS, not restore old dist",
  );
});
