import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { changelogProblems, readPackages, readPlan } from "./changelogs.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("every package's changelog says the version it is at, and the natives have React's snapshot", () => {
  assert.deepEqual(changelogProblems(readPackages(root), readPlan(root)), []);
});

const log = (...titles) =>
  `# Changelog\n\n${titles.map((t) => `## ${t}\n\nwords\n`).join("\n")}`;

test("an npm package whose newest heading is an older version is named", () => {
  const problems = changelogProblems({
    tokens: { version: "0.10.0", changelog: log("0.9.0", "0.8.1") },
  });
  assert.deepEqual(problems, [
    'packages/tokens/CHANGELOG.md: the newest heading is "0.9.0", but the package is at 0.10.0',
  ]);
});

const vuePlan = {
  packages: [{ name: "@kozmos-ds/vue", version: "0.17.0-next.0" }],
};

test("Vue's section is held when its plan publishes it", () => {
  const vue = { version: "0.17.0-next.0", changelog: log("0.0.5") };
  assert.deepEqual(changelogProblems({ vue }, vuePlan), [
    'packages/vue/CHANGELOG.md: the newest heading is "0.0.5", but the package is at 0.17.0-next.0',
  ]);
  assert.deepEqual(
    changelogProblems(
      { vue: { ...vue, changelog: log("0.17.0-next.0", "0.0.5") } },
      vuePlan,
    ),
    [],
  );
});

test("a React version PR may move Vue's version before Vue's own plan writes its section", () => {
  const latest = {
    packages: [{ name: "@kozmos-ds/react", version: "0.18.0" }],
  };
  assert.deepEqual(
    changelogProblems(
      { vue: { version: "0.18.0-next.0", changelog: log("0.17.0-next.0") } },
      latest,
    ),
    [],
  );
});

test("a native changelog with React's version only under Unreleased is named", () => {
  const problems = changelogProblems({
    react: { version: "0.17.0", changelog: log("0.17.0") },
    ios: {
      version: null,
      changelog: log(
        "Unreleased — repository source",
        "0.13.0 — repository snapshot",
      ),
    },
    android: {
      version: null,
      changelog: log(
        "Unreleased — repository source",
        "0.17.0 — repository snapshot",
      ),
    },
  });
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^packages\/ios\/CHANGELOG\.md has no "## 0\.17\.0 — repository snapshot"/,
  );
});
