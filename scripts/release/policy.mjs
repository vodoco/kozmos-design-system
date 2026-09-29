import assert from "node:assert/strict";
import semver from "semver";

// Who approves a release: Olcay's account, and only it (Olcay's decision,
// 2026-09-28). The numeric id is what is compared, not the login: a login can
// be renamed and later registered by someone else, an account id cannot.
// From `gh api users/vodoco --jq .id`.
export const RELEASE_APPROVER = { type: "User", login: "vodoco", id: 10688082 };

/** A required reviewer as a person reads it, for a refusal message. */
function reviewerName(entry) {
  const who = entry?.reviewer;
  const name = who?.login ?? who?.slug ?? who?.name ?? "no account";
  return `${entry?.type ?? "no type"} ${name} (id ${JSON.stringify(who?.id)})`;
}

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
  // Three fences. The branch rule: only main may deploy. The credential:
  // NPM_TOKEN is an environment secret, so only the publish job can read it,
  // and the prepare job fails if it is reachable from outside the environment.
  // And a person: GitHub offers required reviewers on a public repository (on
  // Free, Pro and Team it does not for a private one, which is why this
  // comment once said the click could not be required). This repository is
  // public, and since 2026-09-28 npm-release waits for Olcay's approval with
  // administrator bypass off (Olcay's choice), so both are asserted: a release
  // refuses to run if someone removes the reviewer, replaces or joins it with
  // another account or a team, or turns bypass back on. The reviewers must be
  // exactly one, of type User, with RELEASE_APPROVER's account id. An absent
  // bypass field is refused too rather than read as false.
  assert.ok(
    environment.protection_rules?.some((rule) => rule.type === "branch_policy"),
    "Restrict the environment with a branch protection rule",
  );
  const reviewerRules = (environment.protection_rules ?? []).filter(
    (rule) => rule.type === "required_reviewers",
  );
  assert.ok(
    reviewerRules.some(
      (rule) => Array.isArray(rule.reviewers) && rule.reviewers.length > 0,
    ),
    "Require a reviewer's approval on the npm-release environment",
  );
  const reviewers = reviewerRules.flatMap((rule) =>
    Array.isArray(rule.reviewers) ? rule.reviewers : [rule.reviewers],
  );
  assert.ok(
    reviewers.length === 1 &&
      reviewers[0]?.type === RELEASE_APPROVER.type &&
      reviewers[0]?.reviewer?.id === RELEASE_APPROVER.id,
    `npm-release must have exactly one required reviewer, Olcay's account ` +
      `(${RELEASE_APPROVER.login}, User id ${RELEASE_APPROVER.id}); it has ` +
      `${reviewers.map(reviewerName).join(", ")}`,
  );
  assert.equal(
    environment.can_admins_bypass,
    false,
    "Administrators must not be able to bypass the npm-release approval",
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
