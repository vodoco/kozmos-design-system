import assert from "node:assert/strict";
import test from "node:test";
import * as tagRelease from "./tag-release.mjs";
import {
  assertPublished,
  changelogSection,
  releasesAt,
} from "./tag-release.mjs";

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

test("it tags only what a successful Release run for the commit published, and npm has", async () => {
  const entries = releasesAt(sha, git);
  const run = {
    id: 9,
    head_sha: sha,
    path: ".github/workflows/release.yml",
    conclusion: "success",
  };
  const npm = (versions) => async (name) => ({
    versions: Object.fromEntries(
      (versions[name] ?? []).map((version) => [version, {}]),
    ),
  });
  const both = npm({
    "@kozmos-ds/icons": ["0.4.0"],
    "@kozmos-ds/react": ["0.5.0"],
  });
  assert.equal((await assertPublished(sha, entries, [run], both)).id, 9);
  // Before the publish, or after one that failed: no successful run.
  for (const runs of [[], [{ ...run, conclusion: "failure" }]])
    await assert.rejects(
      assertPublished(sha, entries, runs, both),
      /No successful Release run/,
    );
  // A successful run for another commit is not this commit's release.
  await assert.rejects(
    assertPublished(sha, entries, [{ ...run, head_sha: "f".repeat(40) }], both),
    /No successful Release run/,
  );
  // The run passed, yet npm lacks a version: stop and look.
  await assert.rejects(
    assertPublished(
      sha,
      entries,
      [run],
      npm({ "@kozmos-ds/icons": ["0.4.0"] }),
    ),
    /npm does not have @kozmos-ds\/react@0\.5\.0/,
  );
});

// A release commit for any plan: its manifests and changelogs.
const planned = (plan) => (args) => {
  if (args[0] === "ls-tree") return "packages/icons\npackages/react\n";
  if (args[0] !== "show") throw new Error(args.join(" "));
  const [, file] = args[1].split(":");
  if (file === "release/plan.json")
    return JSON.stringify({ schemaVersion: 1, ...plan });
  const name = `@kozmos-ds/${file.split("/")[1]}`;
  const version =
    plan.packages.find((item) => item.name === name)?.version ?? "0.0.1";
  if (file.endsWith("package.json")) return JSON.stringify({ name, version });
  return `# ${name}\n\n## ${version}\n\n- 1111111: ${version}.\n`;
};

test("the plan's channel reaches each release: only stable React on latest is Latest", () => {
  const classify = (plan) =>
    releasesAt(sha, planned(plan)).map((r) => [
      r.tag,
      r.channel,
      r.prerelease,
      r.latest,
    ]);
  const react = (version) => ({ name: "@kozmos-ds/react", version });
  const icons = (version) => ({ name: "@kozmos-ds/icons", version });
  assert.deepEqual(
    classify({ tag: "latest", packages: [react("0.6.0"), icons("0.5.0")] }),
    [
      ["@kozmos-ds/icons@0.5.0", "latest", false, false],
      ["@kozmos-ds/react@0.6.0", "latest", false, true],
    ],
  );
  assert.deepEqual(
    classify({ tag: "next", packages: [react("0.6.0-beta.1")] }),
    [["@kozmos-ds/react@0.6.0-beta.1", "next", true, false]],
  );
  assert.deepEqual(classify({ tag: "next", packages: [react("0.6.0")] }), [
    ["@kozmos-ds/react@0.6.0", "next", false, false],
  ]);
  assert.deepEqual(classify({ tag: "next", packages: [icons("0.5.0-rc.0")] }), [
    ["@kozmos-ds/icons@0.5.0-rc.0", "next", true, false],
  ]);
  // The policy never lets a prerelease use latest; were one to, it would
  // still not be Latest.
  assert.deepEqual(
    classify({ tag: "latest", packages: [react("0.6.0-rc.1")] }),
    [["@kozmos-ds/react@0.6.0-rc.1", "latest", true, false]],
  );
  // React goes last on every channel: it depends on the others.
  assert.deepEqual(
    classify({ tag: "next", packages: [react("0.6.0"), icons("0.5.0")] }).map(
      ([tag]) => tag,
    ),
    ["@kozmos-ds/icons@0.5.0", "@kozmos-ds/react@0.6.0"],
  );
});

test("a plan without a channel, or a version that is not semver, is refused rather than guessed", () => {
  for (const plan of [
    { packages: [{ name: "@kozmos-ds/react", version: "0.6.0" }] },
    { tag: "beta", packages: [{ name: "@kozmos-ds/react", version: "0.6.0" }] },
  ])
    assert.throws(() => releasesAt(sha, planned(plan)), /next or latest/);
  assert.throws(
    () =>
      releasesAt(
        sha,
        planned({
          tag: "latest",
          packages: [{ name: "@kozmos-ds/react", version: "v0.6" }],
        }),
      ),
    /not a semver version/,
  );
});

test("a tag resolves to its commit through any number of annotated tags", async () => {
  assert.equal(
    typeof tagRelease.tagCommit,
    "function",
    "tag-release.mjs exports tagCommit",
  );
  const commit = "c".repeat(40);
  const objects = {
    "git/ref/tags/%40kozmos-ds/react%400.6.0": {
      status: 200,
      body: { object: { type: "tag", sha: "1".repeat(40) } },
    },
    [`git/tags/${"1".repeat(40)}`]: {
      status: 200,
      body: { object: { type: "tag", sha: "2".repeat(40) } },
    },
    [`git/tags/${"2".repeat(40)}`]: {
      status: 200,
      body: { object: { type: "commit", sha: commit } },
    },
    "git/ref/tags/%40kozmos-ds/icons%400.5.0": {
      status: 200,
      body: { object: { type: "commit", sha: commit } },
    },
    "git/ref/tags/%40kozmos-ds/tree%401.0.0": {
      status: 200,
      body: { object: { type: "tree", sha: "3".repeat(40) } },
    },
    "git/ref/tags/%40kozmos-ds/gone%401.0.0": {
      status: 200,
      body: { object: { type: "tag", sha: "4".repeat(40) } },
    },
  };
  const api = async (route) =>
    objects[route] ?? { status: 404, body: { message: "Not Found" } };
  assert.equal(
    await tagRelease.tagCommit(api, "@kozmos-ds/react@0.6.0"),
    commit,
  );
  assert.equal(
    await tagRelease.tagCommit(api, "@kozmos-ds/icons@0.5.0"),
    commit,
  );
  assert.equal(await tagRelease.tagCommit(api, "@kozmos-ds/none@1.0.0"), null);
  await assert.rejects(
    tagRelease.tagCommit(api, "@kozmos-ds/tree@1.0.0"),
    /points at a tree, not a commit/,
  );
  // The ref is there but its tag object is not: that is a failed lookup, not
  // an absent tag.
  await assert.rejects(
    tagRelease.tagCommit(api, "@kozmos-ds/gone@1.0.0"),
    /HTTP 404/,
  );
});
