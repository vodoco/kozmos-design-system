import assert from "node:assert/strict";
import semver from "semver";

// All registry reads complete before the first irreversible write. Dependencies
// publish before dependants. Reruns accept only byte-identical existing versions.
export async function preparePublication(
  entries,
  workspaceNames,
  getPackage,
  tag = "next",
) {
  const selected = new Map(entries.map((entry) => [entry.name, entry]));
  const registry = new Map();
  const lookup = async (name) => {
    if (!registry.has(name)) registry.set(name, await getPackage(name));
    return registry.get(name);
  };
  for (const entry of entries) {
    const existing = (await lookup(entry.name))?.versions?.[entry.version];
    if (existing)
      assert.equal(
        existing.dist?.integrity,
        entry.integrity,
        `${entry.name}@${entry.version} already exists with different bytes; do not overwrite or retag it`,
      );
    entry.alreadyPublished = Boolean(existing);
    if (existing)
      assert.equal(
        (await lookup(entry.name))["dist-tags"]?.[tag],
        entry.version,
        "Registry tag differs; inspect before publishing any package",
      );
  }
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();
  const visit = async (entry) => {
    if (visited.has(entry.name)) return;
    assert.ok(
      !visiting.has(entry.name),
      "Cyclic internal release dependencies require a separate release plan",
    );
    visiting.add(entry.name);
    const dependencies = {
      ...entry.manifest.peerDependencies,
      ...entry.manifest.optionalDependencies,
      ...entry.manifest.dependencies,
    };
    for (const [name, range] of Object.entries(dependencies)) {
      if (!workspaceNames.has(name)) continue;
      assert.ok(
        semver.validRange(range),
        `Invalid packed dependency: ${name}@${range}`,
      );
      const dependency = selected.get(name);
      if (dependency) {
        assert.ok(
          semver.satisfies(dependency.version, range),
          `Planned ${name} does not satisfy ${range}`,
        );
        await visit(dependency);
      } else {
        const published = await lookup(name);
        assert.ok(
          semver.maxSatisfying(Object.keys(published?.versions ?? {}), range),
          `Unpublished internal dependency: ${name}@${range}`,
        );
      }
    }
    visiting.delete(entry.name);
    visited.add(entry.name);
    ordered.push(entry);
  };
  for (const entry of entries) await visit(entry);
  return ordered;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Confirm one published version, allowing for a registry that has not caught
 * up with its own write.
 *
 * npm's read path is eventually consistent, and for a name published for the
 * very first time the packument can 404 for minutes. On 2026-09-23 the first
 * real release read back 0.04s after npm printed `+ @kozmos-ds/react@0.1.0`,
 * found nothing, and failed a release that had in fact succeeded — four times,
 * once per package. Re-running was worse: the preflight also could not see the
 * new version, published again, and npm answered `403 You cannot publish over
 * the previously published versions`.
 *
 * So absence is retried and disagreement is not. A version that is missing may
 * simply be in flight. A version that is *present* with different bytes, or
 * under a tag pointing elsewhere, is a fact about the registry that no amount
 * of waiting will change — except that a freshly created tag can itself lag,
 * so a tag that is missing or still moving is retried while the deadline holds
 * and reported as it was last seen.
 *
 * The ten-minute budget is measured, not guessed. On 2026-09-23 the four names
 * took about 3.5-3.7 minutes each to become readable, except the first name
 * published into the brand-new scope, which took about nine. The publish job's
 * `timeout-minutes` has to cover this budget times the number of packages, or
 * the job is killed instead of the assertion firing; both are set together.
 */
async function confirmPublished(entry, tag, getPackage, wait, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let delay = 1000;
  let seen = "the registry returned no document for this package";
  for (;;) {
    const registered = await getPackage(entry.name);
    const published = registered?.versions?.[entry.version];
    if (published) {
      // Present is a fact, not a race: hold it to the bytes we packed.
      assert.equal(
        published.dist?.integrity,
        entry.integrity,
        "Published bytes could not be confirmed; stop and inspect the registry",
      );
      const pointsAt = registered?.["dist-tags"]?.[tag];
      if (pointsAt === entry.version) return;
      seen = `${entry.version} is published, but ${tag} points at ${pointsAt ?? "nothing"}`;
    } else if (registered) {
      seen = `the registry knows ${entry.name} but not ${entry.version}`;
    }
    if (Date.now() >= deadline) {
      assert.fail(
        `Published bytes could not be confirmed; stop and inspect the registry. ` +
          `After ${Math.round(timeoutMs / 1000)}s, ${seen}.`,
      );
    }
    await wait(delay);
    delay = Math.min(delay * 2, 15000);
  }
}

export async function publishPrepared(
  entries,
  tag,
  publish,
  getPackage,
  { wait = sleep, timeoutMs = 600000 } = {},
) {
  for (const entry of entries) {
    if (!entry.alreadyPublished) await publish(entry, tag);
    await confirmPublished(entry, tag, getPackage, wait, timeoutMs);
  }
}
