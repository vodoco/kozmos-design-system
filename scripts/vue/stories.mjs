import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import {
  launchFixtureBrowser,
  settleLayout,
} from "../lib/built-react-fixture.mjs";
import { VUE_STORIES, coverageProblems } from "./coverage.mjs";
import { installVueProbes } from "./in-page.mjs";

/**
 * What the Vue browser suites share: the built Vue Storybook's stories, held
 * to the register in ./coverage.mjs before anything is drawn, and a story
 * opened at a theme and a density with nothing from outside the Storybook.
 *
 * The Storybook is this checkout's build, served by the suite itself on a
 * port the system picks, so no suite reads whatever another worktree has
 * listening, and none needs a port of its own:
 *
 *   pnpm --filter @kozmos-ds/docs build-storybook:vue
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-vue-<suite>.mjs
 *
 * VUE_STORYBOOK_URL points a suite at a Storybook served elsewhere instead.
 */
const BUILD = "apps/docs/storybook-internal/vue";

const TYPES = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Serves the built Vue Storybook on 127.0.0.1, at a port the system picks. */
async function serveBuild() {
  const root = path.resolve(BUILD);
  if (!fs.existsSync(path.join(root, "index.json"))) {
    console.error(
      `No Vue Storybook in ${BUILD}: build it with pnpm --filter @kozmos-ds/docs build-storybook:vue`,
    );
    process.exit(1);
  }
  const server = createServer((request, response) => {
    let file = path.resolve(
      path.join(
        root,
        decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname),
      ),
    );
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    fs.readFile(file, (error, body) => {
      if (error) response.writeHead(404).end();
      else
        response
          .writeHead(200, {
            "content-type":
              TYPES[path.extname(file)] ?? "application/octet-stream",
          })
          .end(body);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  server.unref();
  return `http://127.0.0.1:${server.address().port}`;
}

/**
 * The stories a suite draws (`covered`; for the interaction suite, those
 * with an interaction, though it scans all of `ids` with axe). Exits before
 * any browser starts when the register and the build disagree: a story
 * nothing covers fails every suite.
 */
export async function storiesFor(suite) {
  const base = process.env.VUE_STORYBOOK_URL ?? (await serveBuild());
  let index;
  try {
    const response = await fetch(`${base}/index.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    index = await response.json();
  } catch (error) {
    console.error(
      `No Vue Storybook at ${base} (${error.message}): build it with pnpm --filter @kozmos-ds/docs build-storybook:vue`,
    );
    process.exit(1);
  }
  const ids = Object.values(index.entries)
    .filter((entry) => entry.type === "story")
    .map((entry) => entry.id);
  const problems = ids.length
    ? coverageProblems(ids)
    : ["the Vue Storybook indexes no stories"];
  if (problems.length) {
    for (const problem of problems) console.error(`FAIL coverage: ${problem}`);
    console.error(
      `Vue ${suite}: the register (scripts/vue/coverage.mjs) and the built Storybook disagree`,
    );
    process.exit(1);
  }
  const reasonFor = (id) =>
    suite === "interactions" && !VUE_STORIES[id].interaction
      ? VUE_STORIES[id].exempt.interactions
      : VUE_STORIES[id].exempt?.[suite];
  const covered = ids.filter((id) => !reasonFor(id));
  console.log(
    `Vue ${suite}: ${covered.length} of ${ids.length} stories, from ${base}`,
  );
  for (const id of ids.filter(reasonFor))
    console.log(
      suite === "interactions"
        ? `  no interaction, an axe scan only: ${id} (${reasonFor(id)})`
        : `  not drawn by this suite: ${id} (${reasonFor(id)})`,
    );
  return { base, ids, covered };
}

// One grey pixel for any image from outside the Storybook, as the visual
// review gives it: the suites depend on no CDN.
const outsideImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN4+P/ffwAJhgPdJDWOdgAAAABJRU5ErkJggg==",
  "base64",
);

/** A browser for the suite: ADAPTIVE_BROWSER's engine, as React's suites take it. */
export async function launch(options) {
  return launchFixtureBrowser(options);
}

/**
 * A page that refuses everything from outside the Storybook, records its
 * errors, and carries the in-page readings (./in-page.mjs).
 */
export async function newStoryPage(browser, base, contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
    ...contextOptions,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.url().startsWith(base)) return route.continue();
    if (request.resourceType() === "image")
      return route.fulfill({ contentType: "image/png", body: outsideImage });
    return route.abort();
  });
  await page.addInitScript(installVueProbes);
  return { context, page, errors };
}

/**
 * Opens a story at the toolbar's theme and density (the Vue Storybook's
 * decorator gives every story a provider with both), and waits until it
 * has drawn: Storybook shows it, the fonts are in, every finite animation
 * has finished, and the React parts the bridge mounts have rendered (their
 * roots render after Vue's, so the DOM is read until it stops changing).
 */
export async function openStory(
  page,
  base,
  id,
  { theme = "light", density = "touch" } = {},
) {
  await page.goto(
    `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};density:${density}`,
  );
  const shown = await page.waitForFunction(() => {
    const state = document.body.classList;
    if (state.contains("sb-show-errordisplay")) return "the error display";
    if (state.contains("sb-show-nopreview")) return "no preview";
    return state.contains("sb-show-main") &&
      !state.contains("sb-show-preparing-story")
      ? "the story"
      : false;
  });
  const what = await shown.jsonValue();
  if (what !== "the story")
    throw new Error(`${id} did not render: Storybook showed ${what}`);
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const read = () =>
          document.querySelector("#storybook-root")?.innerHTML.length +
          [...document.querySelectorAll("[data-kozmos-portal]")]
            .map((portal) => portal.innerHTML.length)
            .join();
        let last = read();
        let still = 0;
        const tick = () => {
          const now = read();
          still = now === last ? still + 1 : 0;
          last = now;
          if (still >= 3) resolve(true);
          else setTimeout(tick, 50);
        };
        setTimeout(tick, 50);
      }),
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  await settleLayout(page);
}

/** The density tokens' values, touch and compact, as the token build wrote them. */
export function densityTokens() {
  const css = fs.readFileSync(
    "packages/tokens/dist/css/variables-density.css",
    "utf8",
  );
  const blocks = {};
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const density = /compact/.test(selector) ? "compact" : "touch";
    blocks[density] = Object.fromEntries(
      [...body.matchAll(/(--density-[\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [
        n,
        v.trim(),
      ]),
    );
  }
  return blocks;
}

/**
 * The colour allowances a suite's colour readings used, summed over its
 * stories (scripts/vue/in-page.mjs names each, GLASS_EDGE alone today, and
 * every reading counts them all, used or not): `add` each reading's
 * `allowances`; `report` prints each one used and fails each one no story
 * used, so an allowance cannot outlive its case.
 */
export function colourAllowances() {
  const used = new Map();
  return {
    add(allowances) {
      for (const { name, reason, count } of allowances) {
        const seen = used.get(name) ?? { reason, count: 0 };
        seen.count += count;
        used.set(name, seen);
      }
    },
    report(failures) {
      if (!used.size)
        failures.push(
          "no colour reading named its allowances: the colour check read nothing",
        );
      for (const [name, { reason, count }] of used)
        if (count)
          console.log(
            `${count} colour reading(s) allowed by ${name}: ${reason}`,
          );
        else
          failures.push(
            `no story drew a colour that ${name} allows (${reason}): remove the allowance from scripts/vue/in-page.mjs`,
          );
    },
  };
}

/** Prints the result: every failure, or the stories it covered by name. */
export function finish(suite, covered, failures) {
  const browser = process.env.ADAPTIVE_BROWSER ?? "chromium";
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(
      `Vue ${suite} (${browser}): ${failures.length} failure(s) over ${covered.length} stories`,
    );
    process.exit(1);
  }
  console.log(
    `Vue ${suite} (${browser}) passed over ${covered.length} stories: ${covered.join(", ")}`,
  );
  process.exit(0);
}
