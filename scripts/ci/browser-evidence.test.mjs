import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("the browser matrix preserves every map/search/navigation output directory", () => {
  const workflow = fs.readFileSync(
    new URL("../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  const upload = workflow.slice(workflow.indexOf("name: browser-evidence-"));
  const paths = upload.slice(
    upload.indexOf("path: |"),
    upload.indexOf("if-no-files-found:"),
  );
  for (const name of ["map-sheet", "search-sheet", "navigation-examples"])
    assert.ok(
      paths.includes(`test-results/${name}`),
      `${name} evidence is lost when its browser check fails`,
    );
});
