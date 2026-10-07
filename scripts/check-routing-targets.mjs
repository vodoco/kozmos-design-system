import assert from "node:assert/strict";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();

/**
 * Deletes every @scope rule from the page's stylesheets, as a browser without
 * @scope reads them: the utilities go, the owned rules stay. A promise the
 * component makes must hold either way.
 */
async function withoutScope(page) {
  const removed = await page.evaluate(() => {
    let count = 0;
    const strip = (owner) => {
      for (let index = owner.cssRules.length - 1; index >= 0; index--) {
        const rule = owner.cssRules[index];
        if (rule instanceof CSSScopeRule) {
          owner.deleteRule(index);
          count++;
        } else if (rule.cssRules) strip(rule);
      }
    };
    for (const sheet of document.styleSheets) {
      // A cross-origin sheet (a web font's) cannot be read, and holds none.
      let readable = true;
      try {
        void sheet.cssRules;
      } catch {
        readable = false;
      }
      if (readable) strip(sheet);
    }
    return count;
  });
  assert.ok(removed > 0, "the page has no @scope rule to take away");
}

/**
 * The text size, and the direction of the page and of the provider:
 * DesignConfigProvider writes its own `dir` on its roots, so the document's
 * alone mirrors nothing.
 */
const setText = (page, direction, fontSize) =>
  page.evaluate(
    ([dir, size]) => {
      document.documentElement.dir = dir;
      for (const node of document.querySelectorAll("[dir]")) node.dir = dir;
      document.documentElement.style.fontSize = size;
    },
    [direction, fontSize],
  );

/** Story args through the URL: words, spaces and dashes only. */
const args = (values) =>
  Object.entries(values)
    .map(([key, value]) => `${key}:${value.replaceAll(" ", "+")}`)
    .join(";");

// GAP-104's Change actions: the default story, long names, and a long verb.
const edits = [
  { name: "default", args: {}, names: ["Change From", "Change To"] },
  {
    name: "long names",
    args: {
      origin:
        "International arrivals reception and passenger assistance desk North Terminal",
      destination:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ",
    },
    names: ["Change From", "Change To"],
  },
  {
    name: "long verb",
    args: { changeLabel: "Change the start and the destination once more" },
    names: [
      "Change the start and the destination once more From",
      "Change the start and the destination once more To",
    ],
  },
];

try {
  for (const width of [320, 1280]) {
    for (const theme of ["light", "dark"]) {
      for (const mode of ["full", "without-scope"]) {
        const itineraryPage = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await itineraryPage.goto(
          `${base}/iframe.html?id=map-itinerary--long-endpoints&viewMode=story&globals=theme:${theme}`,
        );
        await itineraryPage
          .getByRole("region", { name: "Itinerary" })
          .waitFor();
        if (mode === "without-scope") await withoutScope(itineraryPage);
        for (const direction of ["ltr", "rtl"]) {
          await setText(itineraryPage, direction, "200%");
          const where = `long-endpoints ${mode} ${width} ${theme} ${direction}`;
          for (const span of await itineraryPage
            .locator(".kozmos-itinerary li > span")
            .all()) {
            const geometry = await span.evaluate((node) => ({
              width: node.clientWidth,
              scroll: node.scrollWidth,
            }));
            assert.ok(
              geometry.scroll <= geometry.width + 1,
              `${where}: endpoint overflow ${JSON.stringify(geometry)}`,
            );
          }
          // Without @scope the spans are inline: read the rows and the page.
          const page = await itineraryPage.evaluate(() => ({
            page: document.documentElement.scrollWidth,
            viewport: innerWidth,
            rows: Array.from(
              document.querySelectorAll(".kozmos-itinerary li"),
              (row) => [row.scrollWidth, row.clientWidth],
            ),
          }));
          assert.ok(
            page.page <= page.viewport + 1 &&
              page.rows.every(([scroll, client]) => scroll <= client + 1),
            `${where}: a long endpoint name widens the page ${JSON.stringify(page)}`,
          );
        }
        console.log(`ok long-endpoints ${mode} ${theme} ${width}`);
        await itineraryPage.close();

        for (const edit of edits) {
          const page = await browser.newPage({
            viewport: { width, height: 800 },
          });
          await page.goto(
            `${base}/iframe.html?id=map-itinerary--with-endpoint-edit&viewMode=story&globals=theme:${theme}&args=${args(edit.args)}`,
          );
          await page.getByRole("region", { name: "Itinerary" }).waitFor();
          if (mode === "without-scope") await withoutScope(page);
          const buttons = page.getByRole("button");
          assert.deepEqual(
            await Promise.all(
              (await buttons.all()).map((button) =>
                button.getAttribute("aria-label"),
              ),
            ),
            edit.names,
            `${edit.name}: the actions' names`,
          );
          for (const direction of ["ltr", "rtl"])
            for (const fontSize of ["100%", "200%"]) {
              await setText(page, direction, fontSize);
              const drawn = await page.evaluate(() => ({
                page: document.documentElement.scrollWidth,
                viewport: innerWidth,
                rows: Array.from(
                  document.querySelectorAll(".kozmos-itinerary li"),
                )
                  .filter((row) => row.querySelector("button"))
                  .map((row) => {
                    const button = row.querySelector("button");
                    const box = (node) => {
                      const { left, right, top, width, height } =
                        node.getBoundingClientRect();
                      return { left, right, top, width, height };
                    };
                    const style = getComputedStyle(row);
                    return {
                      row: box(row),
                      // The row's content box: where the button may go.
                      start: parseFloat(style.paddingLeft),
                      end: parseFloat(style.paddingRight),
                      rowScroll: [row.scrollWidth, row.clientWidth],
                      button: box(button),
                      buttonScroll: [button.scrollWidth, button.clientWidth],
                    };
                  }),
              }));
              const where = `with-endpoint-edit ${edit.name} ${mode} ${width} ${theme} ${direction} ${fontSize}: ${JSON.stringify(drawn)}`;
              assert.equal(drawn.rows.length, 2, `${where}: two rows`);
              assert.ok(
                drawn.page <= drawn.viewport + 1,
                `${where}: the page overflows`,
              );
              for (const one of drawn.rows) {
                assert.ok(
                  one.button.width >= 44 - 0.5 && one.button.height >= 44 - 0.5,
                  `${where}: a Change target under 44px`,
                );
                assert.ok(
                  one.rowScroll[0] <= one.rowScroll[1] + 1,
                  `${where}: a row overflows`,
                );
                assert.ok(
                  one.buttonScroll[0] <= one.buttonScroll[1] + 1,
                  `${where}: a label overflows its button`,
                );
                // At the row's inline end: the right in LTR, the left in RTL.
                assert.ok(
                  direction === "rtl"
                    ? Math.abs(one.button.left - (one.row.left + one.start)) <=
                        1
                    : Math.abs(one.button.right - (one.row.right - one.end)) <=
                        1,
                  `${where}: Change is not at its row's inline end`,
                );
              }
            }
          console.log(
            `ok with-endpoint-edit ${edit.name} ${mode} ${theme} ${width}: 44px, text 100/200%, LTR/RTL inline end, no overflow`,
          );
          await page.close();
        }
      }
      for (const story of [
        "map-routinginputgroup--default",
        "map-routinginputgroup--with-stop",
        "components-wayfindingcard--default",
        "components-combobox--default",
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await page.goto(
          `${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`,
        );
        await page.locator("input").first().waitFor();
        const buttons = page.getByRole("button");
        assert.ok((await buttons.count()) > 0);
        for (const button of await buttons.all()) {
          const bounds = await button.boundingBox();
          const name = await button.getAttribute("aria-label");
          assert.ok(
            bounds.width >= 44 && bounds.height >= 44,
            `${story} ${name}: ${bounds.width}×${bounds.height}`,
          );
        }
        console.log(`ok ${story} ${theme} ${width}`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
