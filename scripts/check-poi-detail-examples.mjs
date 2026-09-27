import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = path.resolve("test-results/poi-detail-examples", engine);
fs.mkdirSync(output, { recursive: true });
const stories = [
  "restaurant",
  "entrance",
  "retail",
  "fitness",
  "parking",
  "full-field-catalogue",
  "missing-data",
  "failed-media",
  "action-states",
  "long-content",
  "on-map",
];
const results = [];
const browser = await launchFixtureBrowser();
try {
  for (const theme of ["light", "dark"]) {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 568, height: 320 },
      { width: 1280, height: 800 },
    ]) {
      for (const story of stories) {
        const name = `${story}-${theme}-${viewport.width}`;
        const context = await browser.newContext({
          viewport,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        const record = {
          name,
          violations: [],
          incomplete: [],
          status: "pending",
        };
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(
            `${base}/iframe.html?id=product-sdk-poi-detail-examples--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
          );
          const panel = page.locator(".kozmos-poi-detail");
          await panel.waitFor({ timeout: 60000 });
          const actionStrip = panel.locator(".kozmos-poi-actions");
          if (await actionStrip.count()) {
            const buttons = actionStrip.getByRole("button");
            const centers = await buttons.evaluateAll((items) =>
              items.map((item) => {
                const rect = item.getBoundingClientRect();
                return rect.top + rect.height / 2;
              }),
            );
            assert(
              centers.every((center) => Math.abs(center - centers[0]) < 1),
              "action buttons stay on one row",
            );
            if (
              await actionStrip.evaluate(
                (e) => e.scrollWidth > e.clientWidth + 1,
              )
            ) {
              await actionStrip.focus();
              await page.keyboard.press("End");
              await page.waitForFunction(() => {
                const strip = document.querySelector(".kozmos-poi-actions");
                return (
                  strip.lastElementChild.getBoundingClientRect().right <=
                  strip.getBoundingClientRect().right + 1
                );
              });
              await page.keyboard.press("Home");
              assert(
                await actionStrip.evaluate((e) => Math.abs(e.scrollLeft) < 1),
              );
              if (
                story === "restaurant" &&
                viewport.width === 320 &&
                theme === "light"
              ) {
                await panel.evaluate((e) => e.setAttribute("dir", "rtl"));
                await actionStrip.focus();
                await page.keyboard.press("End");
                assert(
                  await actionStrip.evaluate((e) => {
                    const last = e.lastElementChild.getBoundingClientRect(),
                      view = e.getBoundingClientRect();
                    return (
                      last.left >= view.left - 1 && last.right <= view.right + 1
                    );
                  }),
                  "RTL End reveals the final action",
                );
                await page.keyboard.press("Home");
                assert(
                  await actionStrip.evaluate((e) => Math.abs(e.scrollLeft) < 1),
                  "RTL Home returns to the first action",
                );
                await panel.evaluate((e) => e.removeAttribute("dir"));
              }
              const enabled = actionStrip.locator("button:not(:disabled)");
              if (await enabled.count()) {
                await enabled.first().focus();
                for (let i = 1; i < (await enabled.count()); i++)
                  await page.keyboard.press("Tab");
                assert(
                  await enabled
                    .last()
                    .evaluate((e) => e === document.activeElement),
                );
                assert(
                  await enabled.last().evaluate((e) => {
                    const rect = e.getBoundingClientRect(),
                      view = e.parentElement.getBoundingClientRect();
                    return (
                      rect.left >= view.left - 1 && rect.right <= view.right + 1
                    );
                  }),
                  "tabbing reveals off-screen action buttons",
                );
                await actionStrip.evaluate((e) => {
                  e.scrollLeft = 0;
                });
              }
            }
          }
          const strip = panel.locator("[data-slot=meta-strip]");
          if (await strip.count()) {
            const rows = await strip
              .locator("[data-slot=meta-strip-item]")
              .evaluateAll((items) =>
                items.map((item) => ({
                  top: item.getBoundingClientRect().top,
                  bottom: item.getBoundingClientRect().bottom,
                })),
              );
            assert(
              rows.every(
                (row) =>
                  Math.abs(row.top - rows[0].top) < 1 &&
                  Math.abs(row.bottom - rows[0].bottom) < 1,
              ),
              "metadata always occupies one row",
            );
            assert(rows.length <= 3, "POI metadata has a three-item cap");
            assert.equal(await strip.getAttribute("tabindex"), null);
            assert(
              await strip.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
              "POI metadata fits without scrolling",
            );
            const widths = await strip
              .locator("[data-slot=meta-strip-item]")
              .evaluateAll((items) =>
                items.map((item) => item.getBoundingClientRect().width),
              );
            assert(
              widths.every((width) => Math.abs(width - widths[0]) <= 1),
              "available items share the full width equally",
            );
          }
          const corners = await panel.evaluate((element) => {
            const style = getComputedStyle(element);
            return [
              style.borderTopLeftRadius,
              style.borderTopRightRadius,
              style.borderBottomLeftRadius,
              style.borderBottomRightRadius,
            ];
          });
          const sheet =
            (await panel.getAttribute("data-presentation")) === "sheet";
          assert.deepEqual(
            corners,
            ["16px", "16px", sheet ? "0px" : "16px", sheet ? "0px" : "16px"],
            "POI surface radius",
          );
          for (const radius of await panel
            .locator(
              ".kozmos-poi-logo, .kozmos-poi-action, .kozmos-poi-header-actions button, .kozmos-poi-chips li, .kozmos-poi-hours, .kozmos-poi-gallery-image, .kozmos-poi-gallery-unavailable, .kozmos-poi-gallery-controls button",
            )
            .evaluateAll((elements) =>
              elements.map((element) => {
                const style = getComputedStyle(element);
                return [
                  style.borderTopLeftRadius,
                  style.borderTopRightRadius,
                  style.borderBottomLeftRadius,
                  style.borderBottomRightRadius,
                ];
              }),
            )) {
            assert.deepEqual(
              radius,
              ["16px", "16px", "16px", "16px"],
              "POI components use 16px corners, not pills/circles",
            );
          }
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
            "viewport overflow",
          );
          assert.equal(
            await panel.evaluate((e) => e.scrollWidth <= e.clientWidth),
            true,
            "detail overflow",
          );
          assert.equal(
            await panel
              .locator("h2")
              .evaluate((e) => e.scrollWidth <= e.clientWidth),
            true,
            "title clipping",
          );
          if (story === "restaurant") {
            const primary = panel.locator(".kozmos-poi-action-primary");
            const type = await primary.evaluate((element) => ({
              font: getComputedStyle(element).fontSize,
              weight: getComputedStyle(element).fontWeight,
              leading: getComputedStyle(element).lineHeight,
              estimate: getComputedStyle(element.querySelector("small"))
                .fontSize,
              icon: element.querySelector("svg").getBoundingClientRect().width,
            }));
            assert.equal(type.font, "16px");
            assert.equal(type.weight, "600");
            assert.equal(type.leading, "24px");
            assert(Math.abs(parseFloat(type.estimate) - 11) < 0.05);
            assert.equal(type.icon, 24);
            const wifi = panel
              .locator(".kozmos-poi-chips li")
              .filter({ hasText: /^WiFi$/ });
            const tag = await wifi.evaluate((element) => ({
              height: element.getBoundingClientRect().height,
              font: parseFloat(getComputedStyle(element).fontSize),
              line: getComputedStyle(element).lineHeight,
              icon: element.querySelector("img")?.getBoundingClientRect().width,
            }));
            assert.equal(tag.height, 32);
            assert(Math.abs(tag.font - 13) < 0.05);
            assert.equal(tag.line, "16px");
            assert.equal(tag.icon, 16);
            const favourite = page.getByRole("button", {
              name: "Favourite",
              exact: true,
            });
            await favourite.click();
            assert.equal(await favourite.getAttribute("aria-pressed"), "true");
            // Compare idle fills, not the selected control's hovered token
            // against the navigation button's idle token.
            await page.mouse.move(0, 0);
            await page.waitForFunction(
              (element) =>
                getComputedStyle(element).backgroundColor ===
                getComputedStyle(
                  document.querySelector(".kozmos-poi-action-primary"),
                ).backgroundColor,
              await favourite.elementHandle(),
            );
            assert.equal(
              await favourite.locator("svg").getAttribute("fill"),
              "none",
            );
            await page
              .getByRole("button", { name: "Book", exact: true })
              .click();
            await page
              .getByRole("status")
              .filter({ hasText: "Demo book requested" })
              .waitFor();
            const readMore = page.getByRole("button", {
              name: "Read more",
              exact: true,
            });
            await readMore.focus();
            await page.keyboard.press("Enter");
            assert.equal(
              await page
                .getByRole("button", { name: "Read less" })
                .getAttribute("aria-expanded"),
              "true",
            );
            const hours = panel.locator("summary");
            await hours.focus();
            await page.keyboard.press("Enter");
            assert.equal(
              await panel.locator("details").evaluate((e) => e.open),
              true,
            );
            assert.equal(
              await panel
                .locator(".kozmos-poi-hours")
                .evaluate((e) => getComputedStyle(e).borderTopWidth),
              "1px",
              "hours border is owned",
            );
            assert.equal(
              await panel
                .locator(".kozmos-poi-summary")
                .evaluate((e) => getComputedStyle(e).borderTopWidth),
              "1px",
              "summary border is owned",
            );
          }
          if (story === "entrance" || story === "missing-data") {
            assert.equal(
              await panel.locator("img:not(.kozmos-poi-property-icon)").count(),
              0,
            );
            assert.equal(
              await panel
                .getByRole("button", { name: "Book", exact: true })
                .count(),
              0,
            );
          }
          if (
            (story === "entrance" || story === "parking") &&
            viewport.width === 1280
          ) {
            assert(
              await panel
                .locator(".kozmos-poi-summary-text")
                .evaluateAll((items) =>
                  items.every(
                    (item) =>
                      item.getBoundingClientRect().height <=
                      parseFloat(getComputedStyle(item).lineHeight) + 1,
                  ),
                ),
              "one/two metadata items use one text line when space permits",
            );
          }
          if (story === "missing-data")
            assert.equal(
              await panel.getByRole("heading", { name: "Amenities" }).count(),
              0,
            );
          if (story === "retail") {
            assert.equal(
              await panel
                .locator(".kozmos-poi-summary-text")
                .filter({ hasText: "Wheelchair Friendly" })
                .evaluateAll((values) =>
                  values.every((value) => {
                    const measure = document.createElement("span");
                    measure.textContent = "Wheelchair";
                    measure.style.font = getComputedStyle(value).font;
                    measure.style.whiteSpace = "nowrap";
                    document.body.append(measure);
                    const fits =
                      value.getBoundingClientRect().width >=
                      measure.getBoundingClientRect().width;
                    measure.remove();
                    return fits;
                  }),
                ),
              true,
              "ordinary words fit within the metadata cells",
            );
            assert.equal(
              await panel
                .getByRole("region", { name: "Cuisines", exact: true })
                .count(),
              0,
            );
            await panel
              .getByRole("button", { name: "Call", exact: true })
              .click();
            await page
              .getByRole("status")
              .filter({ hasText: "Demo call requested" })
              .waitFor();
          }
          if (story === "fitness") {
            await panel
              .getByRole("heading", { name: "Sport Types", exact: true })
              .waitFor();
            assert.equal(
              await panel
                .getByRole("button", { name: "Call", exact: true })
                .count(),
              0,
            );
          }
          if (story === "parking") {
            assert.equal(
              await panel
                .getByRole("button", { name: "Book", exact: true })
                .count(),
              0,
            );
            assert.equal(await panel.locator(".kozmos-poi-gallery").count(), 0);
            await panel
              .getByRole("heading", { name: "Parking Types", exact: true })
              .waitFor();
          }
          if (story === "failed-media")
            await panel
              .getByRole("img", {
                name: "Il Forno dining room: Image unavailable",
              })
              .waitFor();
          if (story === "action-states")
            assert.equal(
              await panel
                .getByRole("button", { name: "Book", exact: true })
                .isDisabled(),
              true,
            );
          if (story === "on-map") {
            const toggle = page.getByRole("button", {
              name: "Show more details",
            });
            if (await toggle.count()) {
              const before = await panel.boundingBox();
              await toggle.click();
              await page
                .getByRole("button", { name: "Show more map" })
                .waitFor();
              await page.waitForFunction(
                (height) =>
                  document
                    .querySelector(".kozmos-poi-detail")
                    .getBoundingClientRect().height > height,
                before.height,
              );
            }
            // The non-modal map example never traps focus behind a dialog.
            assert.equal(await page.getByRole("dialog").count(), 0);
          }
          const audit = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          record.violations = audit.violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map(({ target, failureSummary }) => ({
              target,
              failureSummary,
            })),
          }));
          record.incomplete = audit.incomplete.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          }));
          assert.deepEqual(record.violations, [], "accessibility violations");
          await panel.evaluate((e) => {
            e.scrollTop = 0;
          });
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: path.join(output, `${name}.png`),
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "Close details", exact: true })
            .click();
          const open = page.getByRole("button", { name: /^View / });
          await open.waitFor();
          await page.waitForFunction(() =>
            document.activeElement?.textContent?.startsWith("View "),
          );
          await open.press("Enter");
          await panel.waitFor();
          await page.waitForFunction(() =>
            document.activeElement?.classList.contains("kozmos-poi-detail"),
          );
          if (story === "on-map" && viewport.width === 320) {
            const favourite = panel.getByRole("button", {
              name: "Favourite",
              exact: true,
            });
            // Its state lives above the adaptive layout and survives rotation:
            // the shell turns its sheet into a side panel, and the card stays
            // the surfaceless one it is in the sheet (GAP-083).
            await favourite.click();
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForFunction(
              () =>
                document.querySelector("[data-panel-presentation]")?.dataset
                  .panelPresentation === "side",
            );
            assert.equal(
              await panel.getAttribute("data-presentation"),
              "sheet",
              "hosted in the side panel, the card paints no surface of its own",
            );
            assert.equal(await favourite.getAttribute("aria-pressed"), "true");
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            await page.setViewportSize(viewport);
            await page.waitForFunction(
              () =>
                document.querySelector("[data-panel-presentation]")?.dataset
                  .panelPresentation === "bottom",
            );
            assert.equal(await favourite.getAttribute("aria-pressed"), "true");
          }
          if (story === "long-content") {
            // The name and the quick buttons share one row: a long name wraps
            // beside them, three lines at most, and never pushes them under it.
            const header = await panel.evaluate((e) => {
              const title = e.querySelector(".kozmos-poi-title");
              const actions = e.querySelector(".kozmos-poi-header-actions");
              const t = title.getBoundingClientRect();
              const a = actions.getBoundingClientRect();
              return {
                text: title.textContent,
                titleTop: t.top,
                titleBottom: t.bottom,
                titleRight: t.right,
                titleHeight: t.height,
                actionsTop: a.top,
                actionsLeft: a.left,
                lineHeight: parseFloat(getComputedStyle(title).lineHeight),
              };
            });
            assert.ok(header.text.length > 60, "the long-content name is long");
            assert.ok(
              header.actionsTop <= header.titleTop + 1 &&
                header.actionsTop < header.titleBottom,
              `the quick buttons sit beside the name, never under it (${JSON.stringify(header)})`,
            );
            assert.ok(
              header.actionsLeft >= header.titleRight - 1,
              "the quick buttons are to the side of the name",
            );
            assert.ok(
              header.titleHeight <= header.lineHeight * 3 + 1,
              `the name stops at three lines (${header.titleHeight}px of ${header.lineHeight}px lines)`,
            );
            if (viewport.width === 320) {
              assert.ok(
                header.titleHeight > header.lineHeight * 1.5,
                "at 320px the long name wraps",
              );
            }
          }
          if (story === "long-content" && viewport.width === 320) {
            await page.addStyleTag({ content: "html { font-size: 200%; }" });
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
              "200% type must reflow",
            );
            assert.equal(
              await panel.evaluate((e) => e.scrollWidth <= e.clientWidth),
              true,
              "200% detail content must reflow",
            );
            await page.screenshot({
              path: path.join(output, `${name}-large-text.png`),
              fullPage: true,
            });
          }
          assert.deepEqual(errors, [], "runtime errors");
          record.status = "passed";
          console.log(`PASS ${name}`);
        } catch (error) {
          record.status = "failed";
          record.error = error.message;
          console.error(`FAIL ${name}: ${error.message}`);
          await page.screenshot({
            path: path.join(output, `${name}-failed.png`),
            fullPage: true,
          });
        } finally {
          results.push(record);
          await context.close();
        }
      }
    }
  }
} finally {
  await browser.close();
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(results, null, 2),
  );
}
assert.equal(
  results.filter((r) => r.status === "failed").length,
  0,
  "POI example failures",
);
console.log(
  `Verified ${results.length} cases; screenshots and incomplete checks: ${output}`,
);
