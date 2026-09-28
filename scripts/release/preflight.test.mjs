import assert from "node:assert/strict";
import test from "node:test";
import { REPOSITORY, preflight } from "./preflight.mjs";

const sha = "c".repeat(40);

// GitHub as it answers for a release candidate that should pass: the live
// shape of npm-release since 2026-09-28 (a required reviewer, no bypass).
function github(overrides = {}) {
  const routes = {
    "actions/runs/7": {
      id: 7,
      run_attempt: 1,
      path: ".github/workflows/ci.yml",
      event: "push",
      head_branch: "main",
      head_sha: sha,
      status: "completed",
      conclusion: "success",
      repository: { full_name: REPOSITORY },
      head_repository: { full_name: REPOSITORY },
    },
    "actions/runs/7/attempts/1/jobs?per_page=100&page=1": {
      total_count: 3,
      jobs: ["Web Build & Test", "iOS Build", "Android Build"].map((name) => ({
        name,
        status: "completed",
        conclusion: "success",
      })),
    },
    "git/ref/heads/main": { object: { sha } },
    "environments/npm-release": {
      name: "npm-release",
      protection_rules: [
        { type: "branch_policy" },
        {
          type: "required_reviewers",
          reviewers: [{ type: "User", reviewer: { login: "vodoco" } }],
        },
      ],
      deployment_branch_policy: { custom_branch_policies: true },
      can_admins_bypass: false,
    },
    "environments/npm-release/deployment-branch-policies?per_page=100": {
      total_count: 1,
      branch_policies: [{ name: "main", type: "branch" }],
    },
    "actions/variables/NPM_RELEASE_ENABLED": { value: "true" },
    ...overrides,
  };
  return (route) => {
    if (!(route in routes)) throw new Error(`unexpected route ${route}`);
    return structuredClone(routes[route]);
  };
}

// The commit's tree: a plan approving one package, its manifest, no pending
// changesets unless a test adds one.
function tree({ pending = [] } = {}) {
  const files = {
    [`${sha}:release/plan.json`]: JSON.stringify({
      schemaVersion: 1,
      tag: "latest",
      packages: [{ name: "@kozmos-ds/react", version: "0.6.0" }],
    }),
    [`${sha}:packages/react/package.json`]: JSON.stringify({
      name: "@kozmos-ds/react",
      version: "0.6.0",
    }),
  };
  return (args) => {
    if (args[0] === "show") {
      if (!(args[1] in files)) throw new Error(`no ${args[1]}`);
      return files[args[1]];
    }
    if (args[0] === "ls-tree" && args[3] === "packages/")
      return "packages/react\n";
    if (args[0] === "ls-tree" && args[3] === ".changeset/")
      return [".changeset/config.json", ...pending].join("\n") + "\n";
    throw new Error(`unexpected git ${args.join(" ")}`);
  };
}

const ok = () => undefined;

test("a candidate the release job would accept passes, and yields the dispatch command", () => {
  const result = preflight({
    sha,
    runId: 7,
    gh: github(),
    git: tree(),
    credentialCheck: ok,
  });
  assert.equal(result.plan.packages[0].version, "0.6.0");
  assert.equal(
    result.command,
    `gh workflow run release.yml --repo ${REPOSITORY} --ref main -f sha=${sha} -f ci_run_id=7 -f confirmation="publish ${sha}"`,
  );
});

test("the credential check runs, and its failure stops the pre-flight", () => {
  let ran = false;
  preflight({
    sha,
    runId: 7,
    gh: github(),
    git: tree(),
    credentialCheck: () => {
      ran = true;
    },
  });
  assert.equal(ran, true);
  assert.throws(
    () =>
      preflight({
        sha,
        runId: 7,
        gh: github(),
        git: tree(),
        credentialCheck: () => {
          throw new Error("NPM_TOKEN is a repository secret");
        },
      }),
    /repository secret/,
  );
});

for (const [label, input] of [
  [
    "main has moved on",
    {
      gh: github({ "git/ref/heads/main": { object: { sha: "d".repeat(40) } } }),
    },
  ],
  [
    "a changeset is still pending at the commit",
    { git: tree({ pending: [".changeset/x.md"] }) },
  ],
  [
    "a CI job did not succeed",
    {
      gh: github({
        "actions/runs/7/attempts/1/jobs?per_page=100&page=1": {
          total_count: 3,
          jobs: ["Web Build & Test", "iOS Build", "Android Build"].map(
            (name) => ({
              name,
              status: "completed",
              conclusion: name === "iOS Build" ? "skipped" : "success",
            }),
          ),
        },
      }),
    },
  ],
  [
    "npm-release no longer needs an approval",
    {
      gh: github({
        "environments/npm-release": {
          name: "npm-release",
          protection_rules: [{ type: "branch_policy" }],
          deployment_branch_policy: { custom_branch_policies: true },
          can_admins_bypass: false,
        },
      }),
    },
  ],
])
  test(`the pre-flight refuses when ${label}`, () => {
    assert.throws(() =>
      preflight({
        sha,
        runId: 7,
        gh: github(),
        git: tree(),
        credentialCheck: ok,
        ...input,
      }),
    );
  });
