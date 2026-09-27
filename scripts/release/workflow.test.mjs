import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import YAML from "yaml";

const workflow = YAML.parse(
  fs.readFileSync(".github/workflows/release.yml", "utf8"),
);
const source = JSON.stringify(workflow);

test("publication has only a manual trigger and read-only default permissions", () => {
  assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
  assert.deepEqual(workflow.permissions, { contents: "read", actions: "read" });
  for (const input of ["sha", "ci_run_id", "confirmation"]) {
    assert.equal(workflow.on.workflow_dispatch.inputs[input].required, true);
  }
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
});

test("build and publish are separate, SHA-pinned, environment-fenced jobs", () => {
  assert.ok(workflow.jobs.prepare);
  assert.equal(workflow.jobs.publish.needs, "prepare");
  assert.equal(workflow.jobs.publish.environment, "npm-release");
  for (const [name, job] of Object.entries(workflow.jobs)) {
    const checkout = job.steps.find((step) =>
      step.uses?.startsWith("actions/checkout@"),
    );
    if (!checkout) {
      // A job that checks nothing out cannot be doing release work. It is held
      // to the opposite rule instead: no third-party code and no credential.
      // The guard job is one — it only compares two strings GitHub gave it.
      assert.ok(
        job.steps.every((step) => !step.uses),
        `${name} runs an action without checking out a reviewed tree`,
      );
      assert.doesNotMatch(
        JSON.stringify(job),
        /secrets\./,
        `${name} reads a secret without checking out a reviewed tree`,
      );
      continue;
    }
    assert.equal(checkout.with.ref, "${{ inputs.sha }}");
    assert.equal(checkout.with["persist-credentials"], false);
    assert.ok(
      job.steps.some(
        (step) => step.run === "node scripts/release/verify-request.mjs",
      ),
    );
    for (const step of job.steps.filter((s) => s.uses)) {
      assert.match(step.uses, /@[a-f0-9]{40}$/);
    }
  }
});

test("pnpm version is declared once, in the manifest", () => {
  // pnpm/action-setup v4 refuses to run when the action and package.json both
  // name a version: "Multiple versions of pnpm specified". On 2026-09-23 that
  // killed a release dispatch at step 3, before any validation ran, because CI
  // pins v3 — which has no such check — and this workflow pins v4.
  const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.match(manifest.packageManager ?? "", /^pnpm@\d+\.\d+\.\d+$/);
  for (const [name, job] of Object.entries(workflow.jobs)) {
    for (const step of (job.steps ?? []).filter((s) =>
      s.uses?.startsWith("pnpm/action-setup@"),
    )) {
      assert.equal(
        step.with?.version,
        undefined,
        `${name} names a pnpm version the manifest already declares`,
      );
    }
  }
});

test("a dispatch that is not main HEAD cannot conclude as success", () => {
  const guard = workflow.jobs.guard;
  assert.ok(guard, "no job runs when prepare and publish are skipped");
  assert.equal(guard.if, undefined, "the guard must not be skippable");
  const [step] = guard.steps;
  assert.deepEqual(Object.keys(step.env).sort(), [
    "CANDIDATE",
    "HEAD_SHA",
    "REF",
  ]);
  // The candidate is attacker-controlled input. It must reach the shell
  // through the environment, never interpolated into the script body.
  assert.doesNotMatch(step.run, /\$\{\{/);
  assert.match(step.run, /"\$CANDIDATE" != "\$HEAD_SHA"/);
  assert.match(step.run, /"\$REF" != "refs\/heads\/main"/);
});

test("only final publish step receives npm credential; no implicit publisher or rebuild", () => {
  assert.doesNotMatch(
    JSON.stringify(workflow.jobs.prepare),
    /secrets\.NPM_TOKEN/,
  );
  assert.doesNotMatch(JSON.stringify(workflow.env ?? {}), /NPM_TOKEN/);
  const publish = workflow.jobs.publish;
  assert.doesNotMatch(JSON.stringify(publish.env ?? {}), /secrets\.NPM_TOKEN/);
  const credentialSteps = publish.steps.filter((s) =>
    JSON.stringify(s).includes("secrets.NPM_TOKEN"),
  );
  assert.equal(credentialSteps.length, 1);
  assert.equal(credentialSteps[0].run, "node scripts/release/publish.mjs");
  assert.doesNotMatch(
    source,
    /changesets\/action|changeset publish|pnpm release/,
  );
  assert.doesNotMatch(JSON.stringify(publish), /turbo run build/);
  assert.equal(publish.steps.at(-1), credentialSteps[0]);
});

test("local release alias cannot publish and CI exercises the safety tests", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.release, "node scripts/release/local-release.mjs");
  const ci = YAML.parse(fs.readFileSync(".github/workflows/ci.yml", "utf8"));
  assert.ok(ci.jobs.web.steps.some((s) => s.run === "pnpm test:release"));
});
