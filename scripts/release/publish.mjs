import path from "node:path";
import { execFileSync } from "node:child_process";
import { verifyRequest, readWorkspace } from "./verify-request.mjs";
import { readCandidate } from "./candidate.mjs";
import { preparePublication, publishPrepared } from "./publisher.mjs";

// No arguments or local bypass. The only real npm write in this repository's
// release tooling lives below, after rechecking live evidence and artifact bytes.
const plan = await verifyRequest();
if (!process.env.NODE_AUTH_TOKEN)
  throw new Error("Environment NPM_TOKEN is required");
if (!process.env.RUNNER_TEMP)
  throw new Error("GitHub runner directory is required");
const entries = readCandidate(
  path.join(process.env.RUNNER_TEMP, "kozmos-release"),
  process.env.RELEASE_SHA,
  plan,
);
const getPackage = async (name) => {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}`,
    {
      signal: AbortSignal.timeout(30000),
      headers: { "Cache-Control": "no-cache" },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Registry lookup failed: ${name}, HTTP ${response.status}`);
  return response.json();
};
const ordered = await preparePublication(
  entries,
  new Set(readWorkspace().map((p) => p.name)),
  getPackage,
  plan.tag,
);
await publishPrepared(
  ordered,
  plan.tag,
  async (entry, tag) => {
    execFileSync(
      "npm",
      [
        "publish",
        entry.file,
        "--registry=https://registry.npmjs.org/",
        "--access=public",
        `--tag=${tag}`,
        "--ignore-scripts",
        "--provenance=false",
      ],
      { stdio: "inherit" },
    );
  },
  getPackage,
);
console.log(
  "Approved tarballs verified in the npm registry. No git tags or GitHub releases were created.",
);
