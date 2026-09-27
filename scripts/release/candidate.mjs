import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const integrity = (bytes) =>
  `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
const planDigest = (plan) =>
  createHash("sha256").update(JSON.stringify(plan)).digest("hex");

// Called only after the existing install/type/README checks succeed. Copy the
// same tarballs, never repack or rebuild in the credential-bearing job.
export function writeCandidate(directory, sha, plan, packed) {
  assert.match(sha, /^[a-f0-9]{40}$/);
  assert.ok(
    !fs.existsSync(directory),
    "Candidate output must not already exist",
  );
  const entries = plan.packages.map((item) => {
    const source = packed.find(
      ({ manifest }) =>
        manifest.name === item.name && manifest.version === item.version,
    );
    assert.ok(source, `Tested tarball missing: ${item.name}`);
    const file = path.basename(source.tarball);
    return {
      ...item,
      file,
      integrity: integrity(fs.readFileSync(source.tarball)),
      source: source.tarball,
    };
  });
  assert.equal(
    new Set(entries.map((entry) => entry.file)).size,
    entries.length,
  );
  fs.mkdirSync(directory);
  for (const entry of entries)
    fs.copyFileSync(entry.source, path.join(directory, entry.file));
  const manifest = {
    schemaVersion: 1,
    sha,
    planDigest: planDigest(plan),
    packages: entries.map(({ source: _source, ...entry }) => entry),
  };
  fs.writeFileSync(
    path.join(directory, "candidate.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

export function readCandidate(directory, sha, plan) {
  const candidate = JSON.parse(
    fs.readFileSync(path.join(directory, "candidate.json"), "utf8"),
  );
  assert.equal(candidate.schemaVersion, 1);
  assert.equal(candidate.sha, sha, "Artifact belongs to another commit");
  assert.equal(
    candidate.planDigest,
    planDigest(plan),
    "Artifact plan differs from reviewed plan",
  );
  assert.equal(candidate.packages.length, plan.packages.length);
  const seen = new Set();
  const entries = candidate.packages.map((entry) => {
    assert.ok(!seen.has(entry.name), "Duplicate artifact package");
    seen.add(entry.name);
    assert.ok(
      plan.packages.some(
        (item) => item.name === entry.name && item.version === entry.version,
      ),
    );
    assert.match(
      entry.file,
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tgz$/,
      "Unsafe artifact filename",
    );
    const file = path.join(directory, entry.file);
    assert.ok(
      fs.lstatSync(file).isFile(),
      "Tarball must be a regular file, not a symlink",
    );
    assert.equal(
      integrity(fs.readFileSync(file)),
      entry.integrity,
      "Tarball integrity mismatch",
    );
    const manifest = JSON.parse(
      execFileSync("tar", ["-xzOf", file, "package/package.json"], {
        encoding: "utf8",
      }),
    );
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, entry.version);
    assert.notEqual(manifest.private, true);
    assert.ok(
      !manifest.publishConfig?.registry ||
        manifest.publishConfig.registry === "https://registry.npmjs.org/",
      "Foreign publish registry",
    );
    assert.ok(
      !manifest.publishConfig?.access ||
        manifest.publishConfig.access === "public",
    );
    assert.ok(
      !manifest.publishConfig?.tag || manifest.publishConfig.tag === plan.tag,
      "Packed publishConfig must not override the approved tag",
    );
    return { ...entry, file, manifest };
  });
  assert.deepEqual(
    fs.readdirSync(directory).sort(),
    ["candidate.json", ...candidate.packages.map((p) => p.file)].sort(),
    "Unexpected release artifact files",
  );
  return entries;
}
