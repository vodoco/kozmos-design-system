// The browser jobs install nothing from apt. `playwright install --with-deps`
// fetched about 180 packages from the runner's Ubuntu mirror in each of them,
// and on 22 Oct 2026 the mirror served a few KB/s: eight jobs of #376 ran out
// their 45 minutes in it. So every job that runs a browser runs in the
// Playwright image, which carries the browsers and every library they load,
// and the image is the lockfile's Playwright: a different one would hold
// other browser builds, and every job would download its own again.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("package.json"));
const version = manifest.devDependencies["@playwright/test"];
const IMAGE = `mcr.microsoft.com/playwright:v${version}-noble`;
const workflows = fs
  .readdirSync(path.join(root, ".github/workflows"))
  .filter((file) => /\.ya?ml$/.test(file))
  .map((file) => `.github/workflows/${file}`);

/** Each job of each workflow, with the text of everything it runs. */
function jobs() {
  return workflows.flatMap((file) =>
    Object.entries(YAML.parse(read(file)).jobs).map(([key, job]) => ({
      where: `${file} ${key}`,
      job,
      runs: [
        ...(job.steps ?? []).map((step) => String(step.run ?? "")),
        JSON.stringify(job.strategy?.matrix ?? {}),
      ].join("\n"),
    })),
  );
}

test("the Playwright image is the lockfile's Playwright", () => {
  assert.match(
    version,
    /^\d+\.\d+\.\d+$/,
    "@playwright/test is pinned exactly",
  );
  assert.equal(manifest.devDependencies.playwright, version);
  const lock = read("pnpm-lock.yaml");
  for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
    const escaped = name.replace(/[.]/g, "\\.");
    const key = new RegExp(
      `^ {2}["']?${escaped}@(\\d+\\.\\d+\\.\\d+)["']?:`,
      "gm",
    );
    const resolved = new Set([...lock.matchAll(key)].map((match) => match[1]));
    assert.deepEqual([...resolved], [version], `${name} in pnpm-lock.yaml`);
  }
  const references = [...workflows, "scripts/visual/docker.sh"].flatMap(
    (file) =>
      [
        ...read(file).matchAll(/mcr\.microsoft\.com\/playwright:[^\s"'`]+/g),
      ].map(([image]) => ({ file, image })),
  );
  assert.ok(references.length > 0, "no workflow names the Playwright image");
  for (const { file, image } of references) assert.equal(image, IMAGE, file);
});

test("no job installs from apt", () => {
  const apt = /--with-deps|install-deps|\bapt(-get)?\s+(update|install)\b/;
  for (const { where, runs } of jobs()) {
    const line = runs.split("\n").find((text) => apt.test(text));
    assert.equal(line, undefined, `${where} installs from apt: ${line}`);
  }
});

test("every job that runs a browser runs in the Playwright image", () => {
  const browserJobs = jobs().filter(({ runs }) =>
    /playwright (install|test)|ADAPTIVE_BROWSER|test:e2e/.test(runs),
  );
  assert.ok(browserJobs.length >= 5, "the browser jobs were not found");
  for (const { where, job } of browserJobs)
    assert.equal(
      job.container?.image,
      IMAGE,
      `${where} runs a browser outside the image`,
    );
});
