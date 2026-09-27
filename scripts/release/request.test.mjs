import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { verifyRequest } from "./verify-request.mjs";

const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const repo = "vodoco/kozmos-design-system-";
const env = {
  GITHUB_ACTIONS: "true",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
  RELEASE_SHA: sha,
  CI_RUN_ID: "123",
  RELEASE_CONFIRMATION: `publish ${sha}`,
  GH_TOKEN: "test-only-not-a-token",
  GITHUB_REPOSITORY: repo,
  NPM_RELEASE_ENABLED: "true",
};
const jobs = ["Web Build & Test", "iOS Build", "Android Build"].map((name) => ({
  name,
  status: "completed",
  conclusion: "success",
}));
const replies = {
  "actions/runs/123": {
    id: 123,
    path: ".github/workflows/ci.yml",
    event: "push",
    head_sha: sha,
    head_branch: "main",
    status: "completed",
    conclusion: "success",
    run_attempt: 2,
    repository: { full_name: repo },
    head_repository: { full_name: repo },
  },
  "git/ref/heads/main": { object: { sha } },
  "environments/npm-release": {
    name: "npm-release",
    protection_rules: [{ type: "branch_policy" }],
    deployment_branch_policy: { custom_branch_policies: true },
  },
  "environments/npm-release/deployment-branch-policies?per_page=100": {
    total_count: 1,
    branch_policies: [{ name: "main" }],
  },
  "actions/runs/123/attempts/2/jobs?per_page=100&page=1": {
    total_count: 3,
    jobs: jobs.slice(0, 2),
  },
  "actions/runs/123/attempts/2/jobs?per_page=100&page=2": {
    total_count: 3,
    jobs: jobs.slice(2),
  },
};

function api(overrides = {}, calls = []) {
  return async (url) => {
    const route = url.replace(`https://api.github.com/repos/${repo}/`, "");
    calls.push(route);
    const body = { ...replies, ...overrides }[route];
    assert.ok(body, `Unexpected API call: ${route}`);
    return { ok: true, json: async () => body };
  };
}

test("GitHub evidence uses the current attempt and all job pages before reading the plan", async () => {
  const calls = [];
  const fixturePlan = {
    schemaVersion: 1,
    tag: "next",
    packages: [{ name: "@kozmos-ds/example", version: "0.1.0" }],
  };
  assert.deepEqual(
    await verifyRequest(env, api({}, calls), () => fixturePlan),
    fixturePlan,
  );
  assert.ok(
    calls.includes("actions/runs/123/attempts/2/jobs?per_page=100&page=2"),
  );
});

test("network/permission failure is not interpreted as approval", async () => {
  await assert.rejects(
    verifyRequest(env, async () => ({ ok: false, status: 403 })),
    /HTTP 403/,
  );
});

test("workflow SHA mismatch fails before GitHub calls", async () => {
  await assert.rejects(
    verifyRequest({ ...env, GITHUB_SHA: "b".repeat(40) }, async () =>
      assert.fail("must not fetch"),
    ),
    /Workflow commit differs/,
  );
});

test("truncated job and branch-policy responses fail closed", async () => {
  await assert.rejects(
    verifyRequest(
      env,
      api({
        "actions/runs/123/attempts/2/jobs?per_page=100&page=2": {
          total_count: 3,
          jobs: [],
        },
      }),
    ),
    /Incomplete CI/,
  );
  await assert.rejects(
    verifyRequest(
      env,
      api({
        "environments/npm-release/deployment-branch-policies?per_page=100": {
          total_count: 2,
          branch_policies: [{ name: "main" }],
        },
      }),
    ),
    /Incomplete environment/,
  );
});
