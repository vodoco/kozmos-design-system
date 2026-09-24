import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";
const { code, css } = await buildReactFixture("select-accessibility-host.tsx");
const browser = await launchFixtureBrowser();
try {
  for (const name of ["Normal", "Controlled", "Custom", "Nested", "Unmount"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Overlay test</title><style>${css}</style></head><body><button id="host">Host action</button><div id="preexisting" inert="existing"><button>Inert host</button></div><div id="fixture"></div><div id="custom-portal" data-kozmos-root data-theme="light"></div><div aria-live="polite">Live announcement</div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    if (name === "Nested")
      await page.getByRole("button", { name: "Open dialog" }).click();
    const trigger = page.getByRole("combobox", {
      name: name === "Unmount" ? "Normal" : name,
      exact: true,
    });
    await trigger.click();
    await page.getByRole("listbox").waitFor();
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "option",
    );
    await page
      .getByRole("listbox")
      .evaluate((node) =>
        Promise.all(
          node
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => {})),
        ),
      );
    const violations = (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations;
    assert.deepEqual(
      violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
          html: n.html,
        })),
      })),
      [],
      `${name} open accessibility`,
    );
    assert.equal(
      await page.locator("#host").evaluate((n) => !!n.closest("[inert]")),
      true,
      "host must be non-interactive",
    );
    await page.locator("#host").evaluate((n) => n.focus());
    assert.equal(
      await page.locator("#host").evaluate((n) => n === document.activeElement),
      false,
    );
    assert.equal(
      await page.getByRole("listbox").evaluate((n) => !!n.closest("[inert]")),
      false,
    );
    if (name === "Unmount")
      await page.evaluate(() => window.unmountSelectFixture());
    else if (name === "Controlled")
      await page.evaluate(() => window.closeControlledSelect());
    else await page.keyboard.press("Escape");
    await page.getByRole("listbox").waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => !document.querySelector("#host").closest("[inert]"),
    );
    if (name !== "Unmount")
      await page.waitForFunction(
        (n) => document.activeElement === n,
        await trigger.elementHandle(),
      );
    if (name === "Nested") {
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }
    assert.equal(
      await page.locator("#preexisting").getAttribute("inert"),
      "existing",
    );
    assert.equal(await page.locator("#host").getAttribute("aria-hidden"), null);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS ${name}: accessible open state, inert background, cleanup and focus restoration`,
    );
  }
} finally {
  await browser.close();
}
