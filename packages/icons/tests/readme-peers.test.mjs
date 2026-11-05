/**
 * The README's install section says which peers icons takes, and the
 * manifest is the truth: every peer dependency is named there, and called
 * optional where peerDependenciesMeta makes it so. Until 5 Nov it said
 * "`react` is the only peer dependency" while vue was a peer too.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8"),
);
const readme = fs.readFileSync(
  process.env.KOZMOS_ICONS_README ?? path.join(PACKAGE_DIR, "README.md"),
  "utf8",
);
const install = readme.slice(
  readme.indexOf("## Install"),
  readme.indexOf("\n## ", readme.indexOf("## Install") + 1),
);

test("the install section names every peer dependency", () => {
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    assert.ok(install.includes(`\`${peer}\``), `${peer} is not named`);
  }
});

test("it calls a peer optional exactly when the manifest does", () => {
  const optional = Object.entries(manifest.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta.optional)
    .map(([peer]) => peer);
  assert.equal(/\boptional\b/.test(install), optional.length > 0);
  assert.doesNotMatch(install, /the only peer dependency/);
});
