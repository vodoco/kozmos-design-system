import assert from "node:assert/strict";
import test from "node:test";
import { REPOSITORY, preflight } from "./preflight.mjs";

const sha = "c".repeat(40);

// GitHub as it answers for a release candidate that should pass: the live
// shape of npm-release since 2026-09-28 (one required reviewer, Olcay's
// account by its id, and no bypass).
const environment = (reviewers) => ({
  name: "npm-release",
  protection_rules: [
    { type: "branch_policy" },
    { type: "required_reviewers", prevent_self_review: false, reviewers },
  ],
  deployment_branch_policy: { custom_branch_policies: true },
  can_admins_bypass: false,
});
const OWNER = { type: "User", reviewer: { login: "vodoco", id: 10688082 } };

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
    "environments/npm-release": environment([OWNER]),
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

// npm as it answers before the release: react exists, but not at 0.6.0.
const registry =
  (versions = ["0.5.0"]) =>
  async (name) =>
    name === "@kozmos-ds/react"
      ? { versions: Object.fromEntries(versions.map((v) => [v, {}])) }
      : null;

test("a candidate the release job would accept passes, and yields the dispatch command", async () => {
  const result = await preflight({
    sha,
    runId: 7,
    gh: github(),
    git: tree(),
    credentialCheck: ok,
    getPackage: registry(),
  });
  assert.equal(result.plan.packages[0].version, "0.6.0");
  assert.equal(
    result.command,
    `gh workflow run release.yml --repo ${REPOSITORY} --ref main -f sha=${sha} -f ci_run_id=7 -f confirmation="publish ${sha}"`,
  );
});

test("the credential check runs, and its failure stops the pre-flight", async () => {
  let ran = false;
  await preflight({
    sha,
    runId: 7,
    gh: github(),
    git: tree(),
    credentialCheck: () => {
      ran = true;
    },
    getPackage: registry(),
  });
  assert.equal(ran, true);
  await assert.rejects(
    preflight({
      sha,
      runId: 7,
      gh: github(),
      git: tree(),
      credentialCheck: () => {
        throw new Error("NPM_TOKEN is a repository secret");
      },
      getPackage: registry(),
    }),
    /repository secret/,
  );
});

test("a plan npm already has is refused, whole or in part, and a first release passes", async () => {
  const run = (getPackage) =>
    preflight({
      sha,
      runId: 7,
      gh: github(),
      git: tree(),
      credentialCheck: ok,
      getPackage,
    });
  await assert.rejects(
    run(registry(["0.5.0", "0.6.0"])),
    /npm already has @kozmos-ds\/react@0\.6\.0\. A new release needs a version PR/,
  );
  // A package npm has never seen (404) is a first release, not a refusal.
  const first = await run(async () => null);
  assert.equal(first.plan.packages[0].version, "0.6.0");
});

for (const [label, input, message] of [
  [
    "main has moved on",
    {
      gh: github({ "git/ref/heads/main": { object: { sha: "d".repeat(40) } } }),
    },
    /no longer main HEAD/,
  ],
  [
    "a changeset is still pending at the commit",
    { git: tree({ pending: [".changeset/x.md"] }) },
    /Version pending changesets/,
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
    /skipped jobs are not evidence/,
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
    /Require a reviewer's approval/,
  ],
  [
    "npm-release's reviewer is an account other than Olcay's",
    {
      gh: github({
        "environments/npm-release": environment([
          { type: "User", reviewer: { login: "someone-else", id: 1 } },
        ]),
      }),
    },
    /exactly one required reviewer, Olcay's account \(vodoco, User id 10688082\)/,
  ],
  [
    "npm-release names a second reviewer beside Olcay",
    {
      gh: github({
        "environments/npm-release": environment([
          OWNER,
          { type: "Team", reviewer: { slug: "release", id: 5 } },
        ]),
      }),
    },
    /exactly one required reviewer, Olcay's account/,
  ],
])
  test(`the pre-flight refuses when ${label}`, async () => {
    // Each case names its own refusal, so none can pass on an unrelated error.
    await assert.rejects(
      preflight({
        sha,
        runId: 7,
        gh: github(),
        git: tree(),
        credentialCheck: ok,
        getPackage: registry(),
        ...input,
      }),
      message,
    );
  });
