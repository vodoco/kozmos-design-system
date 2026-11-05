import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readPlan } from "./verify-request.mjs";

// readPlan is what the release workflow's guard job reads, from the checkout
// it publishes: a plan that splits a changesets fixed group stops there too.
function workspace(t, planned) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-verify-request-"));
  const cwd = process.cwd();
  t.after(() => {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), JSON.stringify(value));
  };
  write("packages/react/package.json", {
    name: "@kozmos-ds/react",
    version: "0.16.0",
  });
  write("packages/styles/package.json", {
    name: "@kozmos-ds/styles",
    version: "0.16.0",
  });
  write(".changeset/config.json", {
    fixed: [["@kozmos-ds/react", "@kozmos-ds/styles"]],
  });
  write("release/plan.json", {
    schemaVersion: 1,
    tag: "latest",
    packages: planned.map((name) => ({ name, version: "0.16.0" })),
  });
  process.chdir(dir);
}

test("the release guard reads the fixed groups and refuses a split plan", (t) => {
  workspace(t, ["@kozmos-ds/react"]);
  assert.throws(
    () => readPlan(),
    /the plan lists @kozmos-ds\/react but not @kozmos-ds\/styles/,
  );
});

test("the release guard accepts the whole group", (t) => {
  workspace(t, ["@kozmos-ds/react", "@kozmos-ds/styles"]);
  assert.equal(readPlan().packages.length, 2);
});
