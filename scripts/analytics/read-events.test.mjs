// The readers skip tests, stories, docs snippets and Code Connect files by
// their path inside the repository, never by where the repository sits: CI
// runs in a container whose workspace is /__w/kozmos-design-system/…, and a
// skip rule matching "/__" anywhere in the absolute path skipped every file,
// so every platform read 0 events (#582's first CI run).
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { readCompose, readReact, readSwiftUI } from "./read-events.mjs";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const sandbox = mkdtempSync(join(tmpdir(), "kozmos-analytics-"));
after(() => rmSync(sandbox, { recursive: true, force: true }));

/** The repository, linked in under a CI-like workspace path. */
function underWorkspace() {
  const workspace = join(sandbox, "__w", "kozmos-design-system");
  mkdirSync(workspace, { recursive: true });
  const root = join(workspace, "kozmos-design-system");
  symlinkSync(repo, root, "dir");
  return root;
}

test("a repository under /__w/ reads the same events as here", () => {
  const ci = underWorkspace();
  for (const [label, read] of [
    ["React", readReact],
    ["SwiftUI", readSwiftUI],
    ["Compose", readCompose],
  ]) {
    const here = [...read(repo).keys()].sort();
    const there = [...read(ci).keys()].sort();
    assert.ok(here.length >= 10, `${label} reads ${here.length} events here`);
    assert.deepEqual(there, here, `${label} under /__w/`);
  }
});

test("tests, stories, snippets and Code Connect files are still skipped", () => {
  const files = [
    ...readReact(repo).values(),
    ...readSwiftUI(repo).values(),
    ...readCompose(repo).values(),
  ].flatMap((entry) => [...entry.files]);
  assert.ok(files.length > 0);
  for (const file of files)
    assert.doesNotMatch(
      file,
      /\.(test|spec|stories|figma)\.|(^|\/)(test|Tests|__tests__|DocSnippets|docsnippets)\//,
      file,
    );
});
