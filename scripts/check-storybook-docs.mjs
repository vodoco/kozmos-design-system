import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const response = await fetch(`${base}/index.json`);
assert(response.ok, "Public Storybook index is unavailable");
const entries = Object.values((await response.json()).entries);
const expectedSections = new Map(
  entries
    .filter((entry) => entry.type === "docs")
    .map((entry) => {
      const source = fs.readFileSync(
        path.resolve("apps/docs", entry.importPath),
        "utf8",
      );
      return [entry.id, [...source.matchAll(/<PlatformSnippets\b/g)].length];
    }),
);
const expectedCanvases = new Map(
  entries
    .filter((entry) => entry.type === "docs")
    .map((entry) => {
      const source = fs.readFileSync(
        path.resolve("apps/docs", entry.importPath),
        "utf8",
      );
      return [entry.id, [...source.matchAll(/<Canvas\b/g)].length];
    }),
);
assert(entries.some((entry) => entry.id === "guides-platform-support--docs"));
assert(
  !entries.some((entry) => entry.title.startsWith("Vue/")),
  "Internal Vue stories leaked into the public catalogue",
);
const browser = await launchFixtureBrowser();
let checked = 0;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // This verifies the built manager too, not just the source configuration.
  const vueRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "6007") vueRequests.push(request.url());
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Shortcuts" }).waitFor();
  assert.equal(
    await page.getByText("Kozmos Vue Components", { exact: true }).count(),
    0,
  );
  assert.deepEqual(
    vueRequests,
    [],
    "Public manager must not depend on the Vue server",
  );

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    for (const entry of entries.filter((entry) => entry.type === "docs")) {
      await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=docs`);
      await page.locator(".sbdocs-content").waitFor();
      // Wait for MDX's async import, not just the docs shell.
      await page.locator(".sbdocs-content h1").first().waitFor();
      // A heading can render before all MDX children. An instantaneous .all()
      // silently skipped a late-loading snippet in the earlier gate.
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll(".kozmos-platform-snippets").length ===
          count,
        expectedSections.get(entry.id),
      );
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll(".sbdocs-preview .kozmos-story-surface")
            .length === count,
        expectedCanvases.get(entry.id),
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `${entry.id}: whole Docs page overflows ${viewport.width}px`,
      );
      for (const section of await page
        .locator(".kozmos-platform-snippets")
        .all()) {
        assert.equal(
          await section
            .locator(".kozmos-platform-code")
            .first()
            .evaluate((el) => Boolean(el.closest("[data-kozmos-root]"))),
          false,
          "Storybook source/copy UI must remain outside the Kozmos reset",
        );
        const tabs = section.getByRole("tablist", {
          name: "Implementation language",
        });
        assert.equal(
          await tabs.evaluate((el) => getComputedStyle(el).display),
          "flex",
          `${entry.id}: unstyled tabs`,
        );
        assert.equal(
          await section.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          true,
          `${entry.id}: snippet overflow at ${viewport.width}`,
        );
        assert.equal(await section.getByRole("tab").count(), 4);
        for (const tab of await section.getByRole("tab").all()) {
          await tab.click();
          assert.equal(await tab.getAttribute("aria-selected"), "true");
          await section.getByRole("tabpanel").waitFor();
          assert.equal(
            await section.evaluate(
              (el) => el.scrollWidth <= el.clientWidth + 1,
            ),
            true,
            `${entry.id}: active panel overflow`,
          );
        }
        checked++;
      }
    }
    console.log(`Checked all public Docs pages at ${viewport.width}px.`);
  }
  // Exercise real keyboard navigation and accessibility on the shared UI.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(
    `${base}/iframe.html?id=components-button--docs&viewMode=docs`,
  );
  const section = page.locator(".kozmos-platform-snippets").first();
  const properties = page.getByRole("region", { name: "Component properties" });
  await properties.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    () => document.querySelector(".kozmos-docs-properties")?.scrollLeft > 0,
  );
  const react = section.getByRole("tab", { name: "React", exact: true });
  await react.focus();
  await page.keyboard.press("ArrowRight");
  const vue = section.getByRole("tab", { name: "Vue 3 · Internal" });
  await page.waitForFunction(
    () => document.activeElement?.textContent === "Vue 3 · Internal",
  );
  assert.equal(await vue.getAttribute("aria-selected"), "true");
  assert.match(
    await section.getByRole("tabpanel").innerText(),
    /main entry is native Vue on Reka UI/,
  );
  const a11y = await new AxeBuilder({ page })
    .include(".kozmos-platform-snippets")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    a11y.violations.map(({ id }) => id),
    [],
    "Snippet accessibility violations",
  );
  assert.deepEqual(errors, [], "Documentation runtime errors");
  for (const id of [
    "platform-dynamicisland--docs",
    "map-routesummary--docs",
    "map-routinginputgroup--docs",
    "data-display-chip--docs",
    "components-emptystate--docs",
    "components-userlocationmarker--docs",
  ]) {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=docs`);
    await page
      .locator(".sbdocs-preview .kozmos-story-surface")
      .first()
      .waitFor();
  }
  console.log(
    `Public docs passed: ${entries.filter((e) => e.type === "docs").length} pages at two widths, ${checked} snippet sections, keyboard navigation and axe.`,
  );
  assert.equal(
    checked,
    2 * [...expectedSections.values()].reduce((a, b) => a + b, 0),
    "Every reference section must be checked at both widths",
  );
} finally {
  await browser.close();
}
