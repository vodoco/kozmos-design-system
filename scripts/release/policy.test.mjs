import assert from "node:assert/strict";
import test from "node:test";
import { validateRequest, validateEvidence, validatePlan } from "./policy.mjs";
import { preparePublication, publishPrepared } from "./publisher.mjs";

const sha = "a".repeat(40);
const request = {
  event: "workflow_dispatch",
  ref: "refs/heads/main",
  sha,
  runId: "123",
  confirmation: `publish ${sha}`,
};
const evidence = {
  request,
  repository: "vodoco/kozmos-design-system-",
  mainSha: sha,
  enabled: "true",
  run: {
    id: 123,
    path: ".github/workflows/ci.yml",
    event: "push",
    head_branch: "main",
    head_sha: sha,
    repository: { full_name: "vodoco/kozmos-design-system-" },
    head_repository: { full_name: "vodoco/kozmos-design-system-" },
    status: "completed",
    conclusion: "success",
  },
  jobs: ["Web Build & Test", "iOS Build", "Android Build"].map((name) => ({
    name,
    status: "completed",
    conclusion: "success",
  })),
  environment: {
    name: "npm-release",
    protection_rules: [{ type: "branch_policy" }],
    deployment_branch_policy: { custom_branch_policies: true },
  },
  branches: [{ name: "main", type: "branch" }],
};

test("only exact SHA-confirmed main dispatch passes", () => {
  validateRequest(request);
  for (const patch of [
    { event: "workflow_run" },
    { ref: "refs/heads/feature" },
    { sha: "main" },
    { sha: "abc123" },
    { runId: "1; echo nope" },
    { confirmation: "yes" },
    { confirmation: `publish ${"b".repeat(40)}` },
  ]) {
    assert.throws(() => validateRequest({ ...request, ...patch }));
  }
});

test("complete same-repository main CI and protected environment pass", () =>
  validateEvidence(evidence));
for (const [label, mutate] of [
  [
    "disabled release",
    (e) => {
      e.enabled = "false";
    },
  ],
  [
    "main advanced",
    (e) => {
      e.mainSha = "b".repeat(40);
    },
  ],
  [
    "PR CI",
    (e) => {
      e.run.event = "pull_request";
    },
  ],
  [
    "wrong SHA",
    (e) => {
      e.run.head_sha = "b".repeat(40);
    },
  ],
  [
    "wrong workflow",
    (e) => {
      e.run.path = ".github/workflows/other.yml";
    },
  ],
  [
    "wrong run ID",
    (e) => {
      e.run.id = 124;
    },
  ],
  [
    "fork",
    (e) => {
      e.run.head_repository.full_name = "other/fork";
    },
  ],
  [
    "failed CI",
    (e) => {
      e.run.conclusion = "failure";
    },
  ],
  [
    "incomplete CI",
    (e) => {
      e.run.status = "in_progress";
    },
  ],
  [
    "missing native job",
    (e) => {
      e.jobs.pop();
    },
  ],
  [
    "skipped job",
    (e) => {
      e.jobs[0].conclusion = "skipped";
    },
  ],
  [
    "duplicate job",
    (e) => {
      e.jobs.push(e.jobs[0]);
    },
  ],
  [
    "an environment with no branch rule",
    (e) => {
      e.environment.protection_rules = [];
    },
  ],
  [
    "unrestricted environment",
    (e) => {
      e.environment.deployment_branch_policy = null;
    },
  ],
  [
    "wildcard environment",
    (e) => {
      e.branches[0].name = "*";
    },
  ],
  [
    "main tag",
    (e) => {
      e.branches[0].type = "tag";
    },
  ],
])
  test(`release refuses ${label}`, () => {
    const changed = structuredClone(evidence);
    mutate(changed);
    assert.throws(() => validateEvidence(changed));
  });

const manifests = [
  { name: "@kozmos-ds/a", version: "0.1.0-next.0" },
  { name: "@kozmos-ds/private", version: "0.1.0", private: true },
];
const plan = {
  schemaVersion: 1,
  tag: "next",
  packages: [{ name: "@kozmos-ds/a", version: "0.1.0-next.0" }],
};
test("reviewed exact versions pass; empty, stale, duplicate, private or pending plans fail", () => {
  validatePlan(plan, manifests);
  for (const patch of [
    { packages: [] },
    { tag: "latest" },
    { tag: "arbitrary" },
    { packages: [...plan.packages, ...plan.packages] },
    { packages: [{ name: "@kozmos-ds/a", version: "0.1.0" }] },
    { packages: [{ name: "@kozmos-ds/private", version: "0.1.0" }] },
  ]) {
    assert.throws(() => validatePlan({ ...plan, ...patch }, manifests));
  }
  assert.throws(() => validatePlan(plan, manifests, ["unversioned.md"]));
});

const entry = (name, dependencies = {}) => ({
  name,
  version: "1.0.0",
  integrity: `sha512-${name}`,
  manifest: { dependencies },
});
test("dependency order, selected subsets and identical-version retry", async () => {
  const a = entry("@kozmos-ds/a", { "@kozmos-ds/b": "^1.0.0" });
  const b = entry("@kozmos-ds/b");
  const registry = {
    "@kozmos-ds/b": {
      versions: { "1.0.0": { dist: { integrity: b.integrity } } },
      "dist-tags": { next: "1.0.0" },
    },
  };
  const names = new Set([a.name, b.name]);
  const ordered = await preparePublication(
    [a, b],
    names,
    async (name) => registry[name] ?? null,
  );
  assert.deepEqual(
    ordered.map((p) => p.name),
    [b.name, a.name],
  );
  const writes = [];
  await publishPrepared(
    ordered,
    "next",
    async (p, tag) => {
      writes.push(p.name);
      registry[p.name] = {
        versions: { [p.version]: { dist: { integrity: p.integrity } } },
        "dist-tags": { [tag]: p.version },
      };
    },
    async (name) => registry[name],
  );
  assert.deepEqual(writes, [a.name]);
  assert.equal(
    (await preparePublication([a], names, async (name) => registry[name]))
      .length,
    1,
  );
});

test("preflight refuses registry failures, collisions, missing dependencies and cycles", async () => {
  const a = entry("@kozmos-ds/a", { "@kozmos-ds/b": "^1.0.0" });
  const b = entry("@kozmos-ds/b");
  const names = new Set([a.name, b.name]);
  await assert.rejects(
    preparePublication([a], names, async () => null),
    /Unpublished internal dependency/,
  );
  await assert.rejects(
    preparePublication([a], names, async () => {
      throw new Error("registry unavailable");
    }),
    /registry unavailable/,
  );
  await assert.rejects(
    preparePublication([a, b], names, async () => ({
      versions: { "1.0.0": { dist: { integrity: "wrong" } } },
    })),
    /different bytes/,
  );
  await assert.rejects(
    preparePublication(
      [a, { ...b, version: "2.0.0" }],
      names,
      async () => null,
    ),
    /does not satisfy/,
  );
  await assert.rejects(
    preparePublication(
      [a, entry(b.name, { [a.name]: "^1.0.0" })],
      names,
      async () => null,
    ),
    /Cyclic/,
  );
});

test("partial publish failure stops immediately; no automatic retag or overwrite", async () => {
  const entries = [entry("@kozmos-ds/a"), entry("@kozmos-ds/b")];
  let writes = 0;
  await assert.rejects(
    publishPrepared(
      entries,
      "next",
      async () => {
        writes++;
        throw new Error("npm failed");
      },
      async () => null,
    ),
    /npm failed/,
  );
  assert.equal(writes, 1);
  await assert.rejects(
    publishPrepared(
      [{ ...entries[0], alreadyPublished: true }],
      "next",
      async () => assert.fail("must not write"),
      async () => ({
        versions: { "1.0.0": { dist: { integrity: entries[0].integrity } } },
        "dist-tags": { next: "2.0.0" },
      }),
      { wait: async () => {}, timeoutMs: 0 },
    ),
    /next points at 2.0.0/,
  );
});

test("a registry that has not caught up with its own write is waited for", async () => {
  const one = entry("@kozmos-ds/a");
  // npm printed success; the read path 404s for a while. That is the shape of
  // the 2026-09-23 release, where the readback lost the race by 0.04s.
  let reads = 0;
  const slept = [];
  await publishPrepared(
    [one],
    "next",
    async () => {},
    async () => {
      reads += 1;
      if (reads < 4) return null;
      return {
        versions: { "1.0.0": { dist: { integrity: one.integrity } } },
        "dist-tags": { next: "1.0.0" },
      };
    },
    { wait: async (ms) => slept.push(ms), timeoutMs: 300000 },
  );
  assert.equal(reads, 4);
  assert.deepEqual(slept, [1000, 2000, 4000], "delay must back off");
});

test("a version that never appears fails, bounded, naming what was seen", async () => {
  const one = entry("@kozmos-ds/a");
  let reads = 0;
  let waited = 0;
  await assert.rejects(
    publishPrepared(
      [one],
      "next",
      async () => {},
      async () => {
        reads += 1;
        return null;
      },
      {
        wait: async (ms) => {
          waited += ms;
        },
        timeoutMs: 50,
      },
    ),
    /no document for this package/,
  );
  assert.ok(reads > 1, "it must retry at least once");
  assert.ok(waited > 0, "it must have waited");
});

test("different bytes under the same version fail at once, never retried", async () => {
  const one = entry("@kozmos-ds/a");
  let reads = 0;
  await assert.rejects(
    publishPrepared(
      [one],
      "next",
      async () => {},
      async () => {
        reads += 1;
        return {
          versions: {
            "1.0.0": { dist: { integrity: "sha512-something-else" } },
          },
          "dist-tags": { next: "1.0.0" },
        };
      },
      { wait: async () => assert.fail("must not wait"), timeoutMs: 300000 },
    ),
    /Published bytes could not be confirmed/,
  );
  assert.equal(reads, 1, "a disagreement is not a race; do not wait it out");
});

test("stale tag on an existing version fails before any package can publish", async () => {
  const a = entry("@kozmos-ds/a");
  await assert.rejects(
    preparePublication([a], new Set([a.name]), async () => ({
      versions: { [a.version]: { dist: { integrity: a.integrity } } },
      "dist-tags": { next: "2.0.0" },
    })),
    /tag differs/,
  );
});
