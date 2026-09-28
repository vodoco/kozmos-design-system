import assert from "node:assert/strict";
import test from "node:test";
import { changelogSection, releasesAt } from "./tag-release.mjs";

const changelog = `# @kozmos-ds/react

## 0.5.0

### Minor Changes

- abc1234: The map fills its shell.

### Patch Changes

- def5678: MapOverlay stops clipping.

## 0.4.0

### Minor Changes

- 0000000: Older.
`;

test("a version's section runs from its heading to the next version's", () => {
  assert.equal(
    changelogSection(changelog, "0.5.0"),
    "### Minor Changes\n\n- abc1234: The map fills its shell.\n\n### Patch Changes\n\n- def5678: MapOverlay stops clipping.",
  );
  assert.equal(
    changelogSection(changelog, "0.4.0"),
    "### Minor Changes\n\n- 0000000: Older.",
  );
});

test("a version with no section, or an empty one, is refused rather than released bare", () => {
  assert.throws(() => changelogSection(changelog, "0.6.0"), /No "## 0.6.0"/);
  assert.throws(
    () => changelogSection("# x\n\n## 1.0.0\n\n## 0.9.0\n\n- y\n", "1.0.0"),
    /is empty/,
  );
});

const sha = "e".repeat(40);
const git = (args) => {
  const files = {
    [`${sha}:release/plan.json`]: JSON.stringify({
      schemaVersion: 1,
      tag: "latest",
      packages: [
        { name: "@kozmos-ds/react", version: "0.5.0" },
        { name: "@kozmos-ds/icons", version: "0.4.0" },
      ],
    }),
    [`${sha}:packages/react/package.json`]: JSON.stringify({
      name: "@kozmos-ds/react",
    }),
    [`${sha}:packages/icons/package.json`]: JSON.stringify({
      name: "@kozmos-ds/icons",
    }),
    [`${sha}:packages/react/CHANGELOG.md`]: changelog,
    [`${sha}:packages/icons/CHANGELOG.md`]:
      "# @kozmos-ds/icons\n\n## 0.4.0\n\n### Minor Changes\n\n- 1111111: Two icons.\n",
  };
  if (args[0] === "show") return files[args[1]];
  if (args[0] === "ls-tree") return "packages/icons\npackages/react\n";
  throw new Error(args.join(" "));
};

test("each planned package gets its tag and notes, dependencies first and React Latest", () => {
  const releases = releasesAt(sha, git);
  assert.deepEqual(
    releases.map((r) => [r.tag, r.latest]),
    [
      ["@kozmos-ds/icons@0.4.0", false],
      ["@kozmos-ds/react@0.5.0", true],
    ],
  );
  assert.match(releases[0].notes, /Two icons/);
  assert.match(releases[1].notes, /The map fills its shell/);
  assert.doesNotMatch(releases[1].notes, /Older/);
});
