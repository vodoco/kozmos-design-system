// Non-publishing integration proof: an isolated git fixture references already
// built workspace packages. Its plan never touches the real release/plan.json.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readWorkspace } from "./verify-request.mjs";
import { readCandidate } from "./candidate.mjs";

const root = process.cwd();
const fixture = fs.mkdtempSync(
  path.join(os.tmpdir(), "kozmos-release-export-"),
);
const plan = {
  schemaVersion: 1,
  tag: "next",
  packages: readWorkspace()
    .filter((p) => p.private !== true)
    .map(({ name, version }) => ({ name, version })),
};
const git = (args) =>
  execFileSync("git", args, {
    cwd: fixture,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
try {
  fs.symlinkSync(
    path.join(root, "packages"),
    path.join(fixture, "packages"),
    "dir",
  );
  fs.copyFileSync(path.join(root, "LICENSE"), path.join(fixture, "LICENSE"));
  fs.mkdirSync(path.join(fixture, ".changeset"));
  fs.mkdirSync(path.join(fixture, "release"));
  fs.writeFileSync(
    path.join(fixture, "release/plan.json"),
    JSON.stringify(plan),
  );
  git(["init", "--quiet"]);
  git([
    "-c",
    "user.name=Release Test",
    "-c",
    "user.email=release-test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "--allow-empty",
    "-m",
    "isolated release export fixture",
  ]);
  const sha = git(["rev-parse", "HEAD"]).trim();
  const output = path.join(fixture, "candidate");
  execFileSync(
    process.execPath,
    [
      path.join(root, "scripts/check-package-install.mjs"),
      "--release-output",
      output,
      "--release-sha",
      sha,
    ],
    { cwd: fixture, stdio: "inherit" },
  );
  const entries = readCandidate(output, sha, plan);
  assert.equal(entries.length, plan.packages.length);
  console.log(
    `Verified ${entries.length} retained real-package tarballs; no publication attempted.`,
  );
} finally {
  // Only this generated fixture is removed; rm does not follow its package symlink.
  fs.rmSync(fixture, { recursive: true, force: true });
}
