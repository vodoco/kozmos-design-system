import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { writeCandidate, readCandidate } from "./candidate.mjs";

const sha = "a".repeat(40);
const manifest = {
  name: "@kozmos-ds/example",
  version: "0.1.0",
  publishConfig: { access: "public" },
};
const plan = {
  schemaVersion: 1,
  tag: "next",
  packages: [{ name: manifest.name, version: manifest.version }],
};

function fixture(t, packageManifest = manifest) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "kozmos-release-test-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "package"));
  fs.writeFileSync(
    path.join(directory, "package/package.json"),
    JSON.stringify(packageManifest),
  );
  const tarball = path.join(directory, "example.tgz");
  execFileSync("tar", ["-czf", tarball, "-C", directory, "package"]);
  const output = path.join(directory, "candidate");
  writeCandidate(output, sha, plan, [{ manifest, tarball }]);
  return { directory, output, tarball };
}

test("tested tarball is copied byte-for-byte and bound to SHA and plan", (t) => {
  const { output, tarball } = fixture(t);
  const entries = readCandidate(output, sha, plan);
  assert.equal(entries.length, 1);
  assert.deepEqual(fs.readFileSync(entries[0].file), fs.readFileSync(tarball));
  assert.throws(
    () => writeCandidate(output, sha, plan, [{ manifest, tarball }]),
    /already exist/,
  );
  assert.throws(
    () => readCandidate(output, "b".repeat(40), plan),
    /another commit/,
  );
  assert.throws(
    () => readCandidate(output, sha, { ...plan, tag: "latest" }),
    /reviewed plan/,
  );
});

test("tampered bytes, path traversal, duplicates and symlinks are refused", (t) => {
  const { output, tarball } = fixture(t);
  const manifestFile = path.join(output, "candidate.json");
  const original = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  for (const change of [
    (m) => {
      m.packages[0].file = "../example.tgz";
    },
    (m) => {
      m.packages.push(m.packages[0]);
    },
  ]) {
    const copy = structuredClone(original);
    change(copy);
    fs.writeFileSync(manifestFile, JSON.stringify(copy));
    assert.throws(() => readCandidate(output, sha, plan));
  }
  fs.writeFileSync(manifestFile, JSON.stringify(original));
  const file = path.join(output, original.packages[0].file);
  fs.appendFileSync(file, "changed");
  assert.throws(() => readCandidate(output, sha, plan), /integrity/);
  fs.unlinkSync(file);
  fs.symlinkSync(tarball, file);
  assert.throws(() => readCandidate(output, sha, plan), /regular file/);
});

test("packed identity, privacy, tag and registry cannot override the plan", (t) => {
  for (const changed of [
    { ...manifest, name: "@kozmos-ds/other" },
    { ...manifest, private: true },
    { ...manifest, publishConfig: { registry: "https://example.com/" } },
    { ...manifest, publishConfig: { tag: "latest" } },
  ]) {
    const { output } = fixture(t, changed);
    assert.throws(() => readCandidate(output, sha, plan));
  }
});

test("unexpected artifact files and missing tested packages are refused", (t) => {
  const { output, directory } = fixture(t);
  fs.writeFileSync(path.join(output, "unexpected.txt"), "no");
  assert.throws(() => readCandidate(output, sha, plan), /Unexpected/);
  assert.throws(
    () => writeCandidate(path.join(directory, "other"), sha, plan, []),
    /missing/,
  );
});
