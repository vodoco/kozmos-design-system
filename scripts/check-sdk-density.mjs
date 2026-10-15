/**
 * SDK parts keep the SDK's touch geometry under any density (decision 82,
 * Olcay 15 Oct): a compact page, such as Pointr Cloud, can show an SDK part
 * and it draws as the apps draw it. Every SDK story is loaded twice, touch and
 * compact, and every element under the story root and its portals must have
 * the same size and place in both.
 *
 * A part keeps touch by marking its root data-kozmos-density="touch". The
 * check also confirms the compact load really was compact (the story's
 * provider says so), or a pass would prove nothing.
 *
 *   pnpm --filter @kozmos-ds/docs build-storybook
 *   STORYBOOK_URL=http://127.0.0.1:<port> node scripts/check-sdk-density.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const response = await fetch(`${base}/index.json`);
assert(response.ok, `Storybook index is unavailable at ${base}`);
const stories = Object.values((await response.json()).entries).filter(
  (entry) =>
    entry.type === "story" &&
    entry.title.startsWith("SDK/") &&
    !entry.tags?.includes("no-visual"),
);
assert(stories.length > 0, "no SDK stories found");

const still = `*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}`;
const grey = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN4+P/ffwAJhgPdJDWOdgAAAABJRU5ErkJggg==",
  "base64",
);

async function geometry(page, id, density, { strip = false } = {}) {
  await page.goto(
    `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:light;density:${density};a11y.manual:!true`,
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
  assert.equal(await shown.jsonValue(), "the story", `${id} did not render`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (strip)
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          for (const element of document.querySelectorAll(
            '[data-kozmos-density="touch"]:not([data-kozmos-root])',
          ))
            element.removeAttribute("data-kozmos-density");
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
    );
  return page.evaluate(() => {
    const provider = document.querySelector(
      "#storybook-root [data-kozmos-root]",
    );
    const label = (element) =>
      element.getAttribute("aria-label") ??
      element.getAttribute("data-testid") ??
      [...element.classList].find((name) => name.startsWith("kozmos-")) ??
      element.tagName.toLowerCase();
    const round = (values) => values.map((value) => Math.round(value * 2) / 2);
    // Each SDK part marks its root touch. Where a story has them, compare
    // each part from its own corner, so the story's own controls around it
    // (correctly compact) cannot move it; a story without one is compared
    // whole.
    const parts = [
      ...document.querySelectorAll(
        '#storybook-root [data-kozmos-density="touch"]:not([data-kozmos-root])',
      ),
    ].filter(
      (element) =>
        !element.parentElement?.closest(
          '[data-kozmos-density="touch"]:not([data-kozmos-root])',
        ),
    );
    const boxes = [];
    const measure = (root, origin) => {
      for (const element of root.querySelectorAll("*")) {
        const box = element.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue;
        boxes.push({
          label: label(element),
          rect: round([
            box.x - origin.x,
            box.y - origin.y,
            box.width,
            box.height,
          ]),
        });
      }
    };
    if (parts.length) {
      for (const part of parts) {
        const box = part.getBoundingClientRect();
        boxes.push({
          label: `part ${label(part)}`,
          rect: round([0, 0, box.width, box.height]),
        });
        measure(part, box);
      }
    } else {
      for (const root of [
        document.querySelector("#storybook-root"),
        ...document.querySelectorAll("body > [data-kozmos-portal]"),
      ].filter(Boolean))
        measure(root, { x: 0, y: 0 });
    }
    return {
      density: provider?.getAttribute("data-kozmos-density"),
      parts: parts.length,
      boxes,
    };
  });
}

// The static half: every SDK part whose source renders a Core control that
// follows the density must mark its root touch, so a part the stories don't
// reach is held too.
const COMPONENTS = path.join(process.cwd(), "packages/react/src/components");
const CORE_CONTROL =
  /<(Button|IconButton|Input|Select|SelectTrigger|Combobox|MultiSelect|NumberInput|PasswordInput)\b/;
const unmarked = [];
let controlled = 0;
for (const name of fs.readdirSync(COMPONENTS)) {
  const source = path.join(COMPONENTS, name, `${name}.tsx`);
  const story = path.join(COMPONENTS, name, `${name}.stories.tsx`);
  if (!fs.existsSync(source) || !fs.existsSync(story)) continue;
  if (!/title:\s*"SDK\//.test(fs.readFileSync(story, "utf8"))) continue;
  const code = fs.readFileSync(source, "utf8");
  if (!CORE_CONTROL.test(code)) continue;
  controlled += 1;
  if (!code.includes('data-kozmos-density="touch"')) unmarked.push(name);
}

const browser = await launchFixtureBrowser();
const failures = [];
let compared = 0;
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript((css) => {
    const install = () => {
      if (!document.documentElement) return false;
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.append(style);
      return true;
    };
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document, { childList: true });
  }, still);
  // Nothing from outside this Storybook: a map server, a font or a photo
  // could load in one pass and not the other.
  await context.route("**/*", (route) => {
    const request = route.request();
    if (request.url().startsWith(base)) return route.continue();
    if (request.resourceType() === "image")
      return route.fulfill({ contentType: "image/png", body: grey });
    return route.abort();
  });
  const page = await context.newPage();
  for (const story of stories) {
    const touch = await geometry(page, story.id, "touch");
    const compact = await geometry(page, story.id, "compact");
    compared += 1;
    if (compact.density !== "compact") {
      failures.push(
        `${story.id}: the compact load's provider says ${compact.density}`,
      );
      continue;
    }
    const differences = [];
    const length = Math.max(touch.boxes.length, compact.boxes.length);
    for (let index = 0; index < length; index += 1) {
      const a = touch.boxes[index];
      const b = compact.boxes[index];
      if (!a || !b || a.label !== b.label) {
        differences.push(
          `element ${index}: ${a?.label ?? "(none)"} in touch, ${b?.label ?? "(none)"} in compact`,
        );
        break;
      }
      if (a.rect.some((value, axis) => Math.abs(value - b.rect[axis]) > 0.5))
        differences.push(
          `${a.label} [x, y, w, h] ${JSON.stringify(a.rect)} in touch, ${JSON.stringify(b.rect)} in compact`,
        );
    }
    if (differences.length)
      failures.push(
        `${story.id}: ${differences.length} element(s) moved or resized, first ${differences.slice(0, 2).join("; ")}`,
      );
  }
  // The control: with the marks stripped, an SDK part with a Core button
  // must change under compact, or a pass above would prove nothing.
  const control = stories.find(
    (story) => story.id === "product-sdk-poidetailpanel--inline",
  );
  if (!control) failures.push("the control story is missing");
  else {
    const touch = await geometry(page, control.id, "touch", { strip: true });
    const compact = await geometry(page, control.id, "compact", {
      strip: true,
    });
    compared += 1;
    const same = JSON.stringify(touch.boxes) === JSON.stringify(compact.boxes);
    if (same)
      failures.push(
        `${control.id}: unmarked, it should change under compact and did not; the comparison is blind`,
      );
  }
} finally {
  await browser.close();
}

for (const name of unmarked)
  failures.push(
    `${name}: an SDK part that renders a Core control but doesn't mark its root data-kozmos-density="touch"`,
  );
if (failures.length) {
  console.error(
    `FAIL SDK density: ${failures.length} of ${compared} SDK stories change under compact\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS SDK density: all ${compared} SDK stories draw every SDK part at the same size, with every element in the same place, in a compact provider as in a touch one; all ${controlled} SDK parts that render a Core control mark their root touch`,
);
