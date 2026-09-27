import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRequest, validateEvidence, validatePlan } from "./policy.mjs";

export function readWorkspace() {
  return fs
    .readdirSync("packages", { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(`packages/${entry.name}/package.json`),
    )
    .map((entry) =>
      JSON.parse(
        fs.readFileSync(`packages/${entry.name}/package.json`, "utf8"),
      ),
    );
}

export function readPlan() {
  const plan = JSON.parse(fs.readFileSync("release/plan.json", "utf8"));
  const pending = fs
    .readdirSync(".changeset")
    .filter((file) => file.endsWith(".md") && file !== "README.md");
  return validatePlan(plan, readWorkspace(), pending);
}

export async function verifyRequest(
  env = process.env,
  apiFetch = fetch,
  planReader = readPlan,
) {
  const request = {
    event: env.GITHUB_EVENT_NAME,
    ref: env.GITHUB_REF,
    sha: env.RELEASE_SHA,
    runId: env.CI_RUN_ID,
    confirmation: env.RELEASE_CONFIRMATION,
  };
  validateRequest(request);
  if (env.GITHUB_ACTIONS !== "true" || !env.GH_TOKEN)
    throw new Error("Release verification requires GitHub Actions");
  if (env.GITHUB_SHA !== request.sha)
    throw new Error("Workflow commit differs from requested SHA");
  if (
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !==
    request.sha
  )
    throw new Error("Checkout differs from requested SHA");
  const repository = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? ""))
    throw new Error("Invalid repository");
  const get = async (route) => {
    const response = await apiFetch(
      `https://api.github.com/repos/${repository}/${route}`,
      {
        headers: {
          Authorization: `Bearer ${env.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok)
      throw new Error(
        `GitHub ${route}: HTTP ${response.status}; release remains blocked`,
      );
    return response.json();
  };
  const [run, main, environment, branchResult] = await Promise.all([
    get(`actions/runs/${request.runId}`),
    get("git/ref/heads/main"),
    get("environments/npm-release"),
    get("environments/npm-release/deployment-branch-policies?per_page=100"),
  ]);
  if (!Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1)
    throw new Error("Invalid run attempt");
  const jobs = [];
  for (let page = 1; ; page++) {
    const result = await get(
      `actions/runs/${request.runId}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
    );
    jobs.push(...result.jobs);
    if (jobs.length >= result.total_count) break;
    if (!result.jobs.length) throw new Error("Incomplete CI jobs response");
  }
  if (branchResult.total_count !== branchResult.branch_policies.length)
    throw new Error("Incomplete environment branch policies");
  validateEvidence({
    request,
    repository,
    mainSha: main.object.sha,
    run,
    jobs,
    environment,
    branches: branchResult.branch_policies,
    enabled: env.NPM_RELEASE_ENABLED,
  });
  const plan = planReader();
  console.log(
    `Approved candidate ${request.sha}: CI run ${request.runId}, attempt ${run.run_attempt}; ${plan.packages.map((p) => `${p.name}@${p.version}`).join(", ")} → ${plan.tag}`,
  );
  return plan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyRequest();
}
