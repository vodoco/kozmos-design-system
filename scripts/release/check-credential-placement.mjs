/**
 * Where the npm credential lives, checked before a dispatch.
 *
 * The release workflow cannot check this itself. A job's `GITHUB_TOKEN` has no
 * grantable `secrets` permission, so no step can ask GitHub where `NPM_TOKEN`
 * is configured, and a step that reads `secrets.NPM_TOKEN` to see whether it is
 * empty would defeat the very rule it is testing: exactly one step in the
 * release workflow may reference that secret, and it must be the last step of
 * the publish job (`workflow.test.mjs`).
 *
 * So this runs locally, with the owner's own `gh` credentials, before a
 * release is dispatched. It asks two questions and never sees a secret value —
 * GitHub's API returns names and dates only:
 *
 *   - is `NPM_TOKEN` absent from the repository's secrets? A repository secret
 *     is readable by every workflow and every job in the repository.
 *   - is `NPM_TOKEN` present on the `npm-release` environment, whose branch
 *     policy admits `main` alone? Only the publish job runs there.
 *
 * This is what stands in for the approval gate GitHub will not sell for a
 * private repository below Enterprise. See docs/release-process.md,
 * "The approval gate this plan cannot provide".
 *
 *   pnpm release:credential:check
 */
import { execFileSync } from "node:child_process";

const REPOSITORY = "vodoco/kozmos-design-system-";
const ENVIRONMENT = "npm-release";
const SECRET = "NPM_TOKEN";

const api = (route) => {
  try {
    return JSON.parse(
      execFileSync("gh", ["api", `repos/${REPOSITORY}/${route}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`Cannot read ${route}: ${detail}`);
  }
};

const names = (payload) => (payload.secrets ?? []).map((secret) => secret.name);
const problems = [];

const repositorySecrets = names(api("actions/secrets"));
if (repositorySecrets.includes(SECRET))
  problems.push(
    `${SECRET} is a repository secret, readable by every workflow. ` +
      `Delete it: gh secret delete ${SECRET} --repo ${REPOSITORY}`,
  );

const environmentSecrets = names(api(`environments/${ENVIRONMENT}/secrets`));
if (!environmentSecrets.includes(SECRET))
  problems.push(
    `${SECRET} is not a secret of the ${ENVIRONMENT} environment, so the ` +
      `publish job cannot read it. Set it with --env ${ENVIRONMENT}.`,
  );

const policies = api(
  `environments/${ENVIRONMENT}/deployment-branch-policies?per_page=100`,
);
const branches = (policies.branch_policies ?? []).map((policy) => policy.name);
if (policies.total_count !== branches.length)
  problems.push("Incomplete environment branch policies");
if (branches.length !== 1 || branches[0] !== "main")
  problems.push(
    `${ENVIRONMENT} admits ${branches.length ? branches.join(", ") : "no branch"}; it must admit main alone`,
  );

console.log("Where the npm credential lives\n");
console.log(`  repository secrets:  ${repositorySecrets.join(", ") || "none"}`);
console.log(
  `  ${ENVIRONMENT} secrets: ${environmentSecrets.join(", ") || "none"}`,
);
console.log(`  ${ENVIRONMENT} branches: ${branches.join(", ") || "none"}\n`);
for (const problem of problems) console.log(`  FAIL  ${problem}`);
if (!problems.length)
  console.log(
    `  ok    ${SECRET} is reachable only from the publish job, on main`,
  );
process.exitCode = problems.length ? 1 : 0;
