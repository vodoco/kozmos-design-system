import assert from "node:assert/strict";
import semver from "semver";

export function validateRequest(request) {
  assert.equal(
    request.event,
    "workflow_dispatch",
    "Only a manual dispatch may release",
  );
  assert.equal(request.ref, "refs/heads/main", "Dispatch from main only");
  assert.match(
    request.sha ?? "",
    /^[a-f0-9]{40}$/,
    "Use a full lowercase commit SHA",
  );
  assert.match(request.runId ?? "", /^[1-9][0-9]*$/, "Use a CI run ID");
  assert.equal(
    request.confirmation,
    `publish ${request.sha}`,
    "Explicit SHA confirmation required",
  );
}

export function validateEvidence({
  request,
  repository,
  mainSha,
  run,
  jobs,
  environment,
  branches,
  enabled,
}) {
  validateRequest(request);
  assert.equal(enabled, "true", "NPM_RELEASE_ENABLED must explicitly be true");
  assert.equal(
    mainSha,
    request.sha,
    "Candidate is no longer main HEAD; validate the new HEAD first",
  );
  assert.equal(String(run.id), request.runId, "Wrong CI run");
  assert.equal(run.path, ".github/workflows/ci.yml", "Wrong workflow");
  assert.equal(
    run.event,
    "push",
    "CI must be a main push, not a PR or dispatch",
  );
  assert.equal(run.head_branch, "main");
  assert.equal(run.head_sha, request.sha, "CI did not test this SHA");
  assert.equal(run.repository?.full_name, repository);
  assert.equal(
    run.head_repository?.full_name,
    repository,
    "Fork CI is not release evidence",
  );
  assert.equal(run.status, "completed");
  assert.equal(run.conclusion, "success");
  assert.ok(
    jobs.length > 0 &&
      jobs.every(
        (job) => job.status === "completed" && job.conclusion === "success",
      ),
    "Every CI job must succeed; skipped jobs are not evidence",
  );
  for (const name of ["Web Build & Test", "iOS Build", "Android Build"]) {
    assert.equal(
      jobs.filter((job) => job.name === name).length,
      1,
      `Missing/duplicate CI job: ${name}`,
    );
  }
  assert.equal(environment.name, "npm-release");
  // GitHub sells required reviewers and wait timers for a PRIVATE repository
  // only with Enterprise: on Free, Pro and Team they exist for public
  // repositories alone, and the settings page omits the section rather than
  // disabling it. This repository is private on Pro, so the approval click
  // cannot be required here and asserting it would refuse every release for
  // ever. The branch rule is the one protection this plan does enforce, so it
  // is asserted. What replaces the approval is a fence around the credential
  // rather than around the deployment: NPM_TOKEN is an environment secret, so
  // only the publish job, running on main, can read it, and the prepare job
  // fails if that token is reachable from outside the environment. REST does
  // not expose the administrator-bypass setting either. Do not invent evidence
  // for what the plan cannot give.
  assert.ok(
    environment.protection_rules?.some((rule) => rule.type === "branch_policy"),
    "Restrict the environment with a branch protection rule",
  );
  assert.equal(
    environment.deployment_branch_policy?.custom_branch_policies,
    true,
    "Restrict the environment to main",
  );
  assert.equal(branches.length, 1);
  assert.equal(branches[0].name, "main");
  // Older REST responses omit type. The workflow and request both independently
  // require refs/heads/main, so a tag can never dispatch a release even then.
  if (branches[0].type !== undefined) assert.equal(branches[0].type, "branch");
}

export function validatePlan(plan, manifests, pendingChangesets = []) {
  assert.equal(plan.schemaVersion, 1);
  assert.ok(
    ["next", "latest"].includes(plan.tag),
    "Choose next or latest explicitly",
  );
  assert.ok(
    Array.isArray(plan.packages) && plan.packages.length > 0,
    "No release approved: release/plan.json is empty",
  );
  assert.equal(
    pendingChangesets.length,
    0,
    "Version pending changesets before approving a release",
  );
  const publicPackages = new Map(
    manifests.filter((p) => p.private !== true).map((p) => [p.name, p]),
  );
  const seen = new Set();
  for (const item of plan.packages) {
    assert.ok(!seen.has(item.name), "Duplicate release package");
    seen.add(item.name);
    assert.ok(
      publicPackages.has(item.name),
      `Not a public workspace package: ${item.name}`,
    );
    assert.equal(
      publicPackages.get(item.name).version,
      item.version,
      "Plan and package version differ",
    );
    assert.equal(
      semver.valid(item.version),
      item.version,
      "A canonical semver is required",
    );
    if (plan.tag === "latest")
      assert.equal(
        semver.prerelease(item.version),
        null,
        "Prereleases must not use latest",
      );
  }
  return plan;
}
