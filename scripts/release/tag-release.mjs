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
// dependencies are released first and React last.
//
// A GitHub Release follows the npm channel the plan chose: a semver
// prerelease is a GitHub prerelease, and only a stable React release on
// `latest` is marked Latest. A prerelease, or anything on `next`, never is.
//
// It tags only what was published from <sha>: a successful Release run for
// that commit, and every planned version on npm. npm keeps no commit for a
// tarball publish (no gitHead), so the run is the link between the two.
//
// Before it makes any release, it looks up every planned tag and release. A
// tag that exists, lightweight or annotated, must point at <sha>, and so must
// the tag of a release that exists; a draft release is refused, having no tag
// to check. Any conflict refuses the whole run before the first release is
// made, and so does a lookup that fails (authentication, the API, the
// network): a failed lookup is never read as "there is none". It never moves
// or deletes a tag. A release that exists at <sha> is left as it is, so
// running it twice is safe. A dry run makes every check and creates nothing.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import semver from "semver";
import { REPOSITORY } from "./preflight.mjs";

const REACT = "@kozmos-ds/react";

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

/**
 * What to release at `sha`: one entry per planned package, dependencies
 * first. Each carries the plan's npm channel (`channel`), whether its version
 * is a semver prerelease (`prerelease`), and whether its GitHub Release is
 * marked Latest (`latest`): only React, stable, on `latest`.
 */
export function releasesAt(sha, git) {
  const plan = JSON.parse(git(["show", `${sha}:release/plan.json`]));
  if (!["latest", "next"].includes(plan.tag))
    throw new Error(
      `release/plan.json at ${sha} must choose next or latest, not ${JSON.stringify(plan.tag)}`,
    );
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
    if (semver.valid(version) !== version)
      throw new Error(`${name}@${version} is not a semver version`);
    const prerelease = semver.prerelease(version) !== null;
    return {
      name,
      version,
      tag: `${name}@${version}`,
      notes: changelogSection(
        git(["show", `${sha}:${dir}/CHANGELOG.md`]),
        version,
      ),
      channel: plan.tag,
      prerelease,
      latest: name === REACT && plan.tag === "latest" && !prerelease,
    };
  });
  // React depends on the others; its release goes last.
  return entries.sort(
    (a, b) => Number(a.name === REACT) - Number(b.name === REACT),
  );
}

/**
 * Refuses unless `runs` (release.yml's runs for `sha`) holds a successful one
 * and `getPackage(name)` shows every entry's version on npm.
 */
export async function assertPublished(sha, entries, runs, getPackage) {
  const run = runs.find(
    (r) =>
      r.head_sha === sha &&
      r.path === ".github/workflows/release.yml" &&
      r.conclusion === "success",
  );
  if (!run)
    throw new Error(
      `No successful Release run for ${sha}: tag a release after it has published, never before`,
    );
  const missing = [];
  for (const { name, version, tag } of entries)
    if (!(await getPackage(name))?.versions?.[version]) missing.push(tag);
  if (missing.length)
    throw new Error(
      `npm does not have ${missing.join(", ")}, although run ${run.id} succeeded; inspect before tagging`,
    );
  return run;
}

// The functions below read GitHub through `api(route)`, which answers
// `{ status, body }` for a route under repos/<REPOSITORY>/ and throws only
// when GitHub could not be asked at all. 404 is the one answer that means
// "there is none"; any other that is not 200 is a lookup that failed.

/** `what`'s body when GitHub found it; a throw for any other answer. */
function found(response, what) {
  if (response?.status === 200 && response.body != null) return response.body;
  throw new Error(
    `GitHub answered HTTP ${response?.status ?? "nothing"} for ${what}, so what is there is not known`,
  );
}

/** A tag in an API path: `@` and the like escaped, its `/` kept. */
const tagPath = (tag) => tag.split("/").map(encodeURIComponent).join("/");

/**
 * The commit `tag` points at, through any annotated tags, or null when the
 * repository has no such tag.
 */
export async function tagCommit(api, tag) {
  const ref = await api(`git/ref/tags/${tagPath(tag)}`);
  if (ref?.status === 404) return null;
  let object = found(ref, `the tag ${tag}`).object;
  for (let depth = 0; object?.type === "tag"; depth++) {
    if (depth === 10)
      throw new Error(`${tag} is more than ten annotated tags deep`);
    // The ref exists, so a missing tag object is a failed lookup, not an
    // absent tag.
    object = found(
      await api(`git/tags/${object.sha}`),
      `the annotated tag object ${object.sha} of ${tag}`,
    ).object;
  }
  if (object?.type !== "commit" || !/^[0-9a-f]{40}$/.test(object.sha ?? ""))
    throw new Error(
      `${tag} points at a ${object?.type ?? "missing object"}, not a commit`,
    );
  return object.sha;
}

/** Every release in the repository, drafts included, page by page. */
export async function allReleases(api) {
  const releases = [];
  for (let page = 1; page <= 100; page++) {
    const body = found(
      await api(`releases?per_page=100&page=${page}`),
      "the repository's releases",
    );
    if (!Array.isArray(body))
      throw new Error("GitHub's list of releases is not a list");
    releases.push(...body);
    if (body.length < 100) return releases;
  }
  throw new Error(
    "More than 10,000 releases: the list was not read to its end",
  );
}

/**
 * Checks every entry's tag and release against `sha`, all of them before
 * anything is made, and returns each entry with the release it already has
 * at `sha` (or null) and whether its tag exists. Throws, naming every
 * conflict, when any tag or release is elsewhere.
 */
export async function existingReleases(sha, entries, api) {
  const releases = await allReleases(api);
  const conflicts = [];
  const result = [];
  for (const entry of entries) {
    const commit = await tagCommit(api, entry.tag);
    const named = releases.filter((release) => release.tag_name === entry.tag);
    const published = named.filter((release) => !release.draft);
    // A release's tag is the entry's tag, so `commit` is its commit too.
    if (commit !== null && commit !== sha)
      conflicts.push(
        `${entry.tag} is tagged at ${commit}, not at ${sha}` +
          (published.length ? ", and has a release on that tag" : ""),
      );
    if (named.some((release) => release.draft))
      conflicts.push(
        `${entry.tag} has a draft release, which release:tag neither checks nor publishes`,
      );
    if (published.length && commit === null)
      conflicts.push(`${entry.tag} has a release but no tag`);
    if (published.length > 1)
      conflicts.push(`${entry.tag} has ${published.length} releases`);
    result.push({
      entry,
      release: published[0] ?? null,
      tagged: commit !== null,
    });
  }
  if (conflicts.length)
    throw new Error(
      `${conflicts.join("; ")}. Nothing was created. release:tag never moves or deletes a ` +
        "tag or a release: find out how each got there, settle it by hand, then run it again.",
    );
  return result;
}

/** The `gh` arguments that make `entry`'s GitHub Release, tagged at `sha`. */
export function releaseArgs(entry, sha, notesFile) {
  return [
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
    notesFile,
    `--latest=${entry.latest}`,
    ...(entry.prerelease ? ["--prerelease"] : []),
  ];
}

/**
 * `gh api` for a route under this repository, with its HTTP status (read
 * from `--include`), so a 404 can be told from any other failure. Throws
 * when gh got no answer from GitHub at all, as with a network failure.
 */
function githubApi(route) {
  const result = spawnSync(
    "gh",
    ["api", "--include", `repos/${REPOSITORY}/${route}`],
    { encoding: "utf8" },
  );
  const status = (result.stdout ?? "").match(/^HTTP\/[\d.]+ (\d{3})/);
  if (result.error || !status)
    throw new Error(
      `gh could not ask GitHub for ${route}: ${
        (result.error?.message ?? result.stderr ?? "").trim() ||
        `gh exited ${result.status}`
      }`,
    );
  const blank = result.stdout.match(/\r?\n\r?\n/);
  const text = blank
    ? result.stdout.slice(blank.index + blank[0].length).trim()
    : "";
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(
        `GitHub's answer for ${route} (HTTP ${status[1]}) is not JSON`,
      );
    }
  }
  return { status: Number(status[1]), body };
}

async function main() {
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
  let existing;
  try {
    const entries = releasesAt(sha, git);
    const run = await assertPublished(
      sha,
      entries,
      JSON.parse(
        gh([
          "api",
          `repos/${REPOSITORY}/actions/workflows/release.yml/runs?head_sha=${sha}&per_page=100`,
        ]),
      ).workflow_runs,
      async (name) => {
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
    );
    console.log(
      `Release run ${run.id} published ${sha.slice(0, 8)}; npm has every version.`,
    );
    // Every planned tag and release, before the first release is made.
    existing = await existingReleases(sha, entries, githubApi);
  } catch (error) {
    console.error(`Refused: ${error.message}`);
    process.exit(1);
  }
  const at = `at ${sha.slice(0, 8)}`;
  for (const { entry, release, tagged } of existing) {
    const kind =
      (entry.latest ? " (Latest)" : "") +
      (entry.prerelease ? " (prerelease)" : "");
    if (release) {
      console.log(
        `exists  ${entry.tag} ${at}, tag and release — left as they are`,
      );
      continue;
    }
    if (dryRun) {
      console.log(
        `would create ${entry.tag} ${at}${kind}${tagged ? ", on its existing tag" : ""}, ` +
          `${entry.notes.split("\n").length} lines of notes`,
      );
      continue;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-release-notes-"));
    const notes = path.join(dir, "notes.md");
    fs.writeFileSync(notes, `${entry.notes}\n`);
    try {
      gh(releaseArgs(entry, sha, notes));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    console.log(`created ${entry.tag}${kind}`);
  }
}

// Run as a command, not when imported (tests, `node -e`, where argv[1] is unset).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
