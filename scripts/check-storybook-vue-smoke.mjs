import assert from "node:assert/strict";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
import {
  assertPinnedReact,
  recordRenderers,
  renderersIn,
} from "./lib/storybook-react-pin.mjs";

// This is a render smoke gate, not evidence of adapter/API/a11y parity.
const base = process.env.VUE_STORYBOOK_URL ?? "http://127.0.0.1:6007";
const response = await fetch(`${base}/index.json`);
assert(response.ok, "Internal Vue Storybook is unavailable");
const stories = Object.values((await response.json()).entries).filter(
  (e) => e.type === "story",
);
assert(stories.length > 0, "Internal Vue harness must contain stories");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage();
  // The react-dom each story's bridged parts draw with (the React pin).
  await recordRenderers(page);
  const renderers = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const story of stories) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForFunction(
      () =>
        document.querySelector("#storybook-root")?.children.length > 0 ||
        document.body.classList.contains("sb-show-errordisplay"),
    );
    assert.equal(
      await page
        .locator("body")
        .evaluate((el) => el.classList.contains("sb-show-errordisplay")),
      false,
      `${story.id}: render error`,
    );
    const root = page.locator("#storybook-root");
    await root.locator("button, input, [role], h1, h2, h3").first().waitFor();
    const size = await root.boundingBox();
    assert(
      size && size.width > 0 && size.height > 0,
      `${story.id}: empty geometry`,
    );
    renderers.push(...(await renderersIn(page)));
  }
  assert.deepEqual(errors, [], "Vue runtime errors");
  console.log(assertPinnedReact(renderers, "The Vue Storybook"));
  console.log(
    `Internal Vue render smoke passed: ${stories.length} stories. Behavioural and accessibility parity are not asserted.`,
  );
} finally {
  await browser.close();
}
