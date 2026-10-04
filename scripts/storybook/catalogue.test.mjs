import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { readStories } from "../../apps/site/scripts/generate-reference.mjs";

const root = new URL("../../", import.meta.url);
const { entries } = JSON.parse(
  fs.readFileSync(new URL("catalogue.json", import.meta.url), "utf8"),
);
test("every public CSF file is registered, with stable IDs and retained scenario exports", () => {
  const files = [
    "packages/react/src",
    "apps/docs/src",
    "apps/docs/stories",
  ].flatMap((directory) =>
    fs
      .readdirSync(new URL(directory, root), { recursive: true })
      .filter((file) => file.endsWith(".stories.tsx"))
      .map((file) => path.posix.join(directory, file)),
  );
  assert.deepEqual(entries.map((entry) => entry.file).sort(), files.sort());
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  for (const entry of entries) {
    const source = fs.readFileSync(new URL(entry.file, root), "utf8");
    const meta = readStories(source, entry.file);
    assert.equal(meta.title, entry.title, entry.file);
    assert.equal(meta.id, entry.id, `${entry.file}: stable URL ID`);
    assert.match(meta.title, /^(Foundations|Core|SDK|Examples|Guides)\//);
    const exports = [...source.matchAll(/^export const (\w+)/gm)].map(
      (match) => match[1],
    );
    assert.deepEqual(
      exports.sort(),
      [...entry.exports].sort(),
      `${entry.file}: scenario coverage`,
    );
  }
});

test("navigation and place-detail references do not masquerade as duplicate SDK components", () => {
  const title = (suffix) =>
    entries.find((entry) => entry.file.endsWith(suffix))?.title;
  assert.equal(
    title("POIDetailPanel.stories.tsx"),
    "SDK/Place details/POIDetailPanel",
  );
  assert.equal(
    title("POIDetailExamples.stories.tsx"),
    "Examples/Place details/Venue scenarios",
  );
  assert.equal(
    title("POIDetailCard.stories.tsx"),
    "Guides/Design gap references/POI details",
  );
  assert.match(
    title("NavigationExamples.stories.tsx"),
    /^Examples\/Navigation\//,
  );
  assert.match(
    title("NavigationJourney.stories.tsx"),
    /^Examples\/Navigation\//,
  );
});
