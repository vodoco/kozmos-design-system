#!/usr/bin/env node
// After a release has published: a git tag and a GitHub Release for each
// package it shipped, with that version's changelog as the notes (Olcay's
// decision 33, 2026-09-28). The release workflow cannot do this itself — its
// token is read-only on purpose — so a person runs it, with their own gh.
//
//   pnpm release:tag <sha> [--dry-run]
//
// <sha> is the commit the release published (the dispatch's `sha`). The plan,
// the manifests and the changelogs are read from that commit, not from the
// working tree. Tags are `<package>@<version>`, as Changesets names them;
// dependencies are released first and the React package is marked Latest.
// A release that already exists is left as it is, so running it twice is safe.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REPOSITORY } from "./preflight.mjs";

/** The body of `## <version>` in a Changesets CHANGELOG, up to the next `## `. */
export function changelogSection(markdown, version) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) throw new Error(`No "## ${version}" in the changelog`);
  let end = lines.findIndex(
    (line, index) => index > start && /^## /.test(line),
  );
  if (end === -1) end = lines.length;
  const body = lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
  if (!body) throw new Error(`"## ${version}" is empty`);
  return body;
}

/** What to release at `sha`: one entry per planned package, dependencies first. */
export function releasesAt(sha, git) {
  const plan = JSON.parse(git(["show", `${sha}:release/plan.json`]));
  const dirs = git(["ls-tree", "--name-only", sha, "packages/"])
    .split("\n")
    .filter(Boolean);
  const dirOf = new Map();
  for (const dir of dirs) {
    try {
      dirOf.set(
        JSON.parse(git(["show", `${sha}:${dir}/package.json`])).name,
        dir,
      );
    } catch {
      // not a package
    }
  }
  const entries = plan.packages.map(({ name, version }) => {
    const dir = dirOf.get(name);
    if (!dir) throw new Error(`${name} is not a package at ${sha}`);
    return {
      name,
      version,
      tag: `${name}@${version}`,
      notes: changelogSection(
        git(["show", `${sha}:${dir}/CHANGELOG.md`]),
        version,
      ),
      latest: name === "@kozmos-ds/react",
    };
  });
  // React depends on the others; its release goes last and carries Latest.
  return entries.sort((a, b) => Number(a.latest) - Number(b.latest));
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sha = args.find((arg) => /^[0-9a-f]{40}$/.test(arg));
  if (!sha) {
    console.error("Usage: pnpm release:tag <40-character sha> [--dry-run]");
    process.exit(2);
  }
  const git = (gitArgs) =>
    execFileSync("git", gitArgs, {
      encoding: "utf8",
      // A package directory without a manifest (ios, android) is expected.
      stdio: ["ignore", "pipe", "pipe"],
    });
  const gh = (ghArgs, options = {}) =>
    execFileSync("gh", ghArgs, { encoding: "utf8", ...options });
  for (const entry of releasesAt(sha, git)) {
    let exists = true;
    try {
      gh(["release", "view", entry.tag, "--repo", REPOSITORY], {
        stdio: "ignore",
      });
    } catch {
      exists = false;
    }
    if (exists) {
      console.log(`exists  ${entry.tag} — left as it is`);
      continue;
    }
    if (dryRun) {
      console.log(
        `would create ${entry.tag} at ${sha.slice(0, 8)}${entry.latest ? " (Latest)" : ""}, ` +
          `${entry.notes.split("\n").length} lines of notes`,
      );
      continue;
    }
    const notes = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-release-notes-")),
      "notes.md",
    );
    fs.writeFileSync(notes, `${entry.notes}\n`);
    gh([
      "release",
      "create",
      entry.tag,
      "--repo",
      REPOSITORY,
      "--target",
      sha,
      "--title",
      entry.tag,
      "--notes-file",
      notes,
      `--latest=${entry.latest}`,
    ]);
    console.log(`created ${entry.tag}${entry.latest ? " (Latest)" : ""}`);
  }
}

// Run as a command, not when imported (tests, `node -e`, where argv[1] is unset).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
