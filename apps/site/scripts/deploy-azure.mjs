/**
 * Put the built site in front of people, on Azure Storage's static website.
 *
 *   pnpm --filter @kozmos-ds/site build
 *   pnpm --filter @kozmos-ds/site deploy
 *
 * In order: check the build is there, check the account's static website is
 * on and pointed at index.html and 404.html, mirror `build/client` into
 * `$web` (deleting what the build no longer carries), then mark the pages
 * `no-cache` so a deploy is seen at once.
 *
 * It never holds a key. Every data call is `--auth-mode login`, which uses
 * the `az login` session of whoever runs it; that account needs Storage Blob
 * Data Contributor. A connection string is deliberately not supported: an
 * account key in a shell history or a CI log is worth more than this site.
 *
 * Caching is what makes "updated with every change" true. The assets are
 * content-hashed by the build, so a browser may keep them as long as it
 * likes — a new build has new names. The pages are not hashed, so they are
 * marked `no-cache`: the browser asks every visit and gets the new page.
 * Without that split a visitor keeps yesterday's page with today's assets.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT ?? "pointrmapstorage";
const site = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const client = path.join(site, "build", "client");

/** A data-plane call, signed in as the person running it. */
function data(args, { quiet = false } = {}) {
  return run([...args, "--auth-mode", "login"], quiet);
}

/** A management-plane call, which takes no --auth-mode. */
function management(args, { quiet = true } = {}) {
  return run(args, quiet);
}

function run(args, quiet) {
  const result = spawnSync("az", args, {
    encoding: "utf8",
    stdio: quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    const reason = (result.stderr ?? "").trim().split("\n")[0];
    throw new Error(`az ${args.slice(0, 3).join(" ")} failed: ${reason}`);
  }
  return (result.stdout ?? "").trim();
}

function theBuild() {
  const page = path.join(client, "index.html");
  if (!existsSync(page)) {
    throw new Error(
      "build/client/index.html is missing. Run `pnpm build` first, without BASE_PATH: the static website resolves directories, so the site belongs at the root.",
    );
  }
  const minutes = Math.round((Date.now() - statSync(page).mtimeMs) / 60000);
  console.log(`build:   ${client} (index.html written ${minutes} min ago)`);
}

function theWebsite() {
  const shown = JSON.parse(
    data(
      [
        "storage", "blob", "service-properties", "show",
        "--account-name", ACCOUNT,
        "--query", "staticWebsite",
        "-o", "json",
      ],
      { quiet: true },
    ),
  );
  if (!shown.enabled) {
    throw new Error(
      `the static website is off on ${ACCOUNT}. Turn it on once:\n` +
        `  az storage blob service-properties update --account-name ${ACCOUNT} \\\n` +
        "    --static-website --index-document index.html --404-document 404.html --auth-mode login",
    );
  }
  console.log(
    `website: on (index ${shown.indexDocument}, 404 ${shown.errorDocument_404Path})`,
  );
}

function mirror() {
  console.log("sync:    build/client → $web (stale blobs deleted)");
  data([
    "storage", "blob", "sync",
    "--account-name", ACCOUNT,
    "--container", "$web",
    "--source", client,
    "--delete-destination", "true",
  ]);
}

/** The pages are not content-hashed, so they must never be kept. */
function pagesRevalidate() {
  const pages = JSON.parse(
    data(
      [
        "storage", "blob", "list",
        "--account-name", ACCOUNT,
        "--container-name", "$web",
        "--query", "[?ends_with(name, '.html')].name",
        "-o", "json",
      ],
      { quiet: true },
    ),
  );
  for (const name of pages) {
    data(
      [
        "storage", "blob", "update",
        "--account-name", ACCOUNT,
        "--container-name", "$web",
        "--name", name,
        "--content-cache-control", "no-cache",
        "--content-type", "text/html",
      ],
      { quiet: true },
    );
  }
  console.log(`cache:   ${pages.length} pages marked no-cache`);
}

function address() {
  return management([
    "storage", "account", "show",
    "--name", ACCOUNT,
    "--query", "primaryEndpoints.web",
    "-o", "tsv",
  ]);
}

theBuild();
theWebsite();
mirror();
pagesRevalidate();
console.log(`\ndeployed: ${address()}`);
