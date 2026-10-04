import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const output = `test-results/route-location/${process.env.ADAPTIVE_BROWSER ?? "chromium"}`;
fs.mkdirSync(output, { recursive: true });
try {
  for (const width of [320, 1280])
    for (const theme of ["light", "dark"]) {
      for (const story of [
        "search",
        "host-filtered",
        "with-current-position",
        "resolved",
        "loading",
        "empty",
        "error",
        "disabled",
        "long-location",
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        await page.goto(
          `${base}/iframe.html?id=map-routelocationfield--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        await page.getByText("From", { exact: true }).waitFor();
        if (story === "search") {
          const input = page.getByRole("combobox", { name: "From" });
          await input.fill("North");
          await input.dispatchEvent("keydown", {
            key: "Enter",
            isComposing: true,
          });
          assert.equal(
            await input.count(),
            1,
            "IME composition must not resolve a location",
          );
          await input.press("Escape");
          assert.equal(await page.getByRole("option").count(), 0);
          await input.press("ArrowDown");
          await input.press("Home");
          await input.press("Enter");
          await page
            .getByText("North terminal lobby", { exact: true })
            .waitFor();
          assert.equal(await page.getByRole("combobox").count(), 0);
          await page.getByRole("button", { name: "Clear location" }).click();
          await input.waitFor();
          assert.equal(await input.inputValue(), "");
          await input.focus();
          await input.press("End");
          assert.equal(
            await input.getAttribute("aria-activedescendant"),
            await page
              .getByRole("option", { name: "Select from the map" })
              .getAttribute("id"),
          );
          await input.press("Escape");
          assert.equal(
            await input.evaluate((n) => n === document.activeElement),
            true,
          );
        } else if (story === "with-current-position") {
          const input = page.getByRole("combobox", { name: "From" });
          await input.fill("no matching place");
          const current = page.getByRole("option", {
            name: "Current position",
            exact: true,
          });
          const map = page.getByRole("option", {
            name: "Select from the map",
            exact: true,
          });
          await current.waitFor();
          assert.equal(await page.getByRole("option").count(), 2);
          // Enter on typed text that matches nothing chooses nothing: a
          // command is picked by the visitor, never chosen for them.
          assert.equal(await input.getAttribute("aria-activedescendant"), null);
          await input.press("Enter");
          assert.equal(
            await page.getByRole("combobox", { name: "From" }).count(),
            1,
            "Enter on an unmatched place left the endpoint unresolved",
          );
          await current.waitFor();
          for (const dir of ["ltr", "rtl"]) {
            await page.evaluate((direction) => {
              document.documentElement.dir = direction;
              document.documentElement.style.fontSize = "200%";
            }, dir);
            for (const action of [current, map]) {
              const rect = await action.boundingBox();
              assert.ok(
                rect.height >= 44 && rect.width >= 44,
                "dropdown choices retain touch targets",
              );
            }
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            );
            assert.deepEqual(
              (
                await new AxeBuilder({ page })
                  .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                  .analyze()
              ).violations.map((v) => v.id),
              [],
            );
          }
          await page.evaluate(() => {
            document.documentElement.dir = "ltr";
            document.documentElement.style.fontSize = "";
          });
          assert.equal(
            await map.evaluate(
              (n) =>
                !!n.closest("[data-combobox-popup]") &&
                !!n.closest('[role="listbox"]'),
            ),
            true,
          );
          await input.press("Home");
          assert.equal(
            await input.getAttribute("aria-activedescendant"),
            await current.getAttribute("id"),
          );
          await input.press("Enter");
          await page.getByText("Current position", { exact: true }).waitFor();
          assert.equal(await page.getByRole("combobox").count(), 0);
        } else if (story === "host-filtered") {
          const input = page.getByRole("combobox", { name: "From" });
          assert.equal(await input.inputValue(), "lift");
          await input.press("ArrowDown");
          await page.getByRole("option", { name: /Elevator/ }).waitFor();
          await input.press("Home");
          await input.press("Enter");
          await page.getByText("Elevator", { exact: true }).waitFor();
          assert.equal(await page.getByRole("combobox").count(), 0);
          await page.getByRole("button", { name: "Clear location" }).click();
          await input.waitFor();
          assert.equal(await input.inputValue(), "");
        } else if (["loading", "empty", "error"].includes(story)) {
          await page.getByRole("combobox").focus();
          await page.getByRole("combobox").press("ArrowDown");
          assert.equal(
            await page.getByRole("option").count(),
            1,
            "non-ready state offered stale options",
          );
          await page
            .getByRole("option", { name: "Select from the map", exact: true })
            .waitFor();
        }
        for (const button of await page.getByRole("button").all()) {
          const rect = await button.boundingBox();
          assert.ok(
            rect.width >= 44 && rect.height >= 44,
            `${story}: target ${rect.width}×${rect.height}`,
          );
          if (story === "disabled")
            assert.equal(await button.isDisabled(), true);
        }
        for (const direction of ["ltr", "rtl"]) {
          await page.evaluate((dir) => {
            document.documentElement.dir = dir;
            document.documentElement.style.fontSize = "200%";
          }, direction);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            `${story}: horizontal overflow`,
          );
          if (story === "long-location") {
            const fullWidth = await page
              .getByText(
                "International departures assistance and accessible transport meeting point",
                { exact: true },
              )
              .evaluate((node) => {
                const panel = node.closest(".border");
                const style = getComputedStyle(panel);
                const available =
                  panel.clientWidth -
                  parseFloat(style.paddingLeft) -
                  parseFloat(style.paddingRight);
                return node.getBoundingClientRect().width >= available - 1;
              });
            assert.ok(
              fullWidth,
              "resolved place name must use full content width at enlarged text",
            );
          }
        }
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          results.violations.map((v) => v.id),
          [],
          `${story} ${theme} ${width}: accessibility`,
        );
        await page.screenshot({
          path: `${output}/${story}-${theme}-${width}.png`,
          fullPage: true,
        });
        console.log(`ok RouteLocationField ${story} ${theme} ${width}`);
        await context.close();
      }
    }
} finally {
  await browser.close();
}
