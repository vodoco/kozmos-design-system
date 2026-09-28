#!/usr/bin/env node
// Before dispatching a release: the checks the release job will make, made
// first, against the live CI run and settings, so a dispatch never meets a
// refusal it could have seen coming.
//
//   pnpm release:preflight <sha> <ci-run-id>
//
// 1. Where the npm credential lives (check-credential-placement.mjs): a
//    dispatch without it was the one step of docs/release-process.md that the
//    0.5.0 release skipped. It passed afterwards; now it cannot be skipped.
// 2. The request, the CI evidence and the environment, through the policy's
//    own validateRequest and validateEvidence, with the same GitHub responses
//    verify-request.mjs reads — fetched with `gh`, which holds the credentials.
// 3. The plan at that commit (not the working tree): validatePlan over the
//    commit's release/plan.json, manifests and pending changesets.
// 4. That npm has none of the planned versions yet. A dispatch is for a new
//    release; one already out needs a version PR, and one partly out needs the
//    recovery in docs/release-process.md (a rerun of the failed job, or a
//    reviewed plan), never a fresh dispatch whose rebuilt tarballs may differ
//    from the bytes npm already has.
//
// It never dispatches, and it never approves: it prints the command for a
// person to run.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateEvidence, validatePlan, validateRequest } from "./policy.mjs";

export const REPOSITORY = "vodoco/kozmos-design-system";

/** The published packages' manifests, release plan and pending changesets at `sha`. */
export function planAt(sha, git) {
  const plan = JSON.parse(git(["show", `${sha}:release/plan.json`]));
  const dirs = git(["ls-tree", "--name-only", `${sha}`, "packages/"])
    .split("\n")
    .filter(Boolean);
  const manifests = [];
  for (const dir of dirs) {
    try {
      manifests.push(JSON.parse(git(["show", `${sha}:${dir}/package.json`])));
    } catch {
      // a directory without a manifest is not a package
    }
  }
  const pending = git(["ls-tree", "--name-only", `${sha}`, ".changeset/"])
    .split("\n")
    .map((file) => path.basename(file))
    .filter((file) => file.endsWith(".md") && file !== "README.md");
  return validatePlan(plan, manifests, pending);
}

/** Refuses a plan any of whose versions npm already has (see 4. above). */
export async function assertUnpublished(plan, getPackage) {
  const published = [];
  for (const { name, version } of plan.packages)
    if ((await getPackage(name))?.versions?.[version])
      published.push(`${name}@${version}`);
  if (published.length)
    throw new Error(
      `npm already has ${published.join(", ")}. A new release needs a version PR; ` +
        "a partly published one needs the recovery in docs/release-process.md, not a new dispatch.",
    );
}

/**
 * Every check, in the order the release job makes them, then the registry.
 * `gh(route)` returns a parsed GitHub response for `repos/<repository>/<route>`;
 * `git(args)` returns git's stdout; `credentialCheck()` throws if the
 * credential is misplaced; `getPackage(name)` resolves to npm's packument, or
 * null for a package npm has never seen.
 */
export async function preflight({
  sha,
  runId,
  gh,
  git,
  credentialCheck,
  getPackage,
}) {
  const request = {
    event: "workflow_dispatch",
    ref: "refs/heads/main",
    sha,
    runId: String(runId),
    confirmation: `publish ${sha}`,
  };
  validateRequest(request);
  credentialCheck();
  const run = gh(`actions/runs/${request.runId}`);
  const jobs = [];
  for (let page = 1; ; page++) {
    const result = gh(
      `actions/runs/${request.runId}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
    );
    jobs.push(...result.jobs);
    if (jobs.length >= result.total_count) break;
    if (!result.jobs.length) throw new Error("Incomplete CI jobs response");
  }
  const branches = gh(
    "environments/npm-release/deployment-branch-policies?per_page=100",
  );
  if (branches.total_count !== branches.branch_policies.length)
    throw new Error("Incomplete environment branch policies");
  validateEvidence({
    request,
    repository: REPOSITORY,
    mainSha: gh("git/ref/heads/main").object.sha,
    run,
    jobs,
    environment: gh("environments/npm-release"),
    branches: branches.branch_policies,
    enabled: gh("actions/variables/NPM_RELEASE_ENABLED").value,
  });
  const plan = planAt(sha, git);
  await assertUnpublished(plan, getPackage);
  return {
    request,
    run,
    jobs,
    plan,
    command:
      `gh workflow run release.yml --repo ${REPOSITORY} --ref main ` +
      `-f sha=${sha} -f ci_run_id=${request.runId} -f confirmation="publish ${sha}"`,
  };
}

async function main() {
  const [sha, runId] = process.argv.slice(2);
  if (!sha || !runId) {
    console.error("Usage: pnpm release:preflight <sha> <ci-run-id>");
    process.exit(2);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  let result;
  try {
    result = await preflight({
      sha,
      runId,
      gh: (route) =>
        JSON.parse(
          execFileSync("gh", ["api", `repos/${REPOSITORY}/${route}`], {
            encoding: "utf8",
          }),
        ),
      git: (args) =>
        execFileSync("git", args, {
          encoding: "utf8",
          // A package directory without a manifest (ios, android) is expected.
          stdio: ["ignore", "pipe", "pipe"],
        }),
      credentialCheck: () =>
        execFileSync(
          process.execPath,
          [path.join(here, "check-credential-placement.mjs")],
          { stdio: "inherit" },
        ),
      // As publish.mjs reads it: uncached, and a 404 is a package npm never saw.
      getPackage: async (name) => {
        const response = await fetch(
          `https://registry.npmjs.org/${encodeURIComponent(name)}`,
          {
            signal: AbortSignal.timeout(30000),
            headers: { "Cache-Control": "no-cache" },
          },
        );
        if (response.status === 404) return null;
        if (!response.ok)
          throw new Error(
            `Registry lookup failed: ${name}, HTTP ${response.status}`,
          );
        return response.json();
      },
    });
  } catch (error) {
    // One line, as the release job would put it: what refused, and why.
    console.error(`\nPre-flight refused: ${error.message}`);
    process.exit(1);
  }
  console.log(
    `\nPre-flight passed: ${sha}, CI run ${result.request.runId} attempt ` +
      `${result.run.run_attempt} (${result.jobs.length} jobs, all succeeded); ` +
      `${result.plan.packages.map((p) => `${p.name}@${p.version}`).join(", ")} → ${result.plan.tag}, ` +
      "none of them on npm yet.\n\n" +
      `Dispatch it:\n\n  ${result.command}\n\n` +
      "Then approve the npm-release deployment in the run (Review deployments). " +
      "Nothing may merge to main between here and the dispatch.",
  );
}

// Run as a command, not when imported (tests, `node -e`, where argv[1] is unset).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
