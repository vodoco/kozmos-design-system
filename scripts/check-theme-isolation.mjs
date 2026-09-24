import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("theme-host.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({ colorScheme: "light" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(`<!doctype html><html data-theme="host"><head><style>
    body { margin: 13px; font-family: serif; }
    h1 { font-size: 37px; margin: 19px; }
    button { border: 3px solid purple; background: orange; }
    .flex { display: block; }
  </style></head><body><h1 id="host-heading">Host page</h1><button id="host-button">Host button</button><div class="flex" id="host-utility">Host utility</div><div id="fixture"></div></body></html>`);
  const hostStyles = () =>
    page.evaluate(() =>
      ["host-heading", "host-button", "host-utility"].map((id) => {
        const style = getComputedStyle(document.getElementById(id));
        return [
          style.fontSize,
          style.margin,
          style.border,
          style.backgroundColor,
          style.display,
          style.boxSizing,
        ];
      }),
    );
  const before = await hostStyles();
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("light").waitFor();
  await settleLayout(page);
  assert.deepEqual(
    await hostStyles(),
    before,
    "Kozmos CSS changed unrelated host content",
  );
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    ),
    "host",
  );
  console.log(
    "PASS stylesheet leaves host reset, utilities and theme untouched",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "light light", exact: true })
      .evaluate((node) => getComputedStyle(node).borderTopWidth),
    "0px",
    "generic host button border leaked into the module",
  );
  const background = (id) =>
    page
      .getByTestId(id)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
  const light = await background("light-surface");
  const dark = await background("dark-surface");
  assert.notEqual(light, dark);
  assert.equal(await background("nested-light-surface"), light);
  assert.equal(await background("nested-dark-surface"), dark);
  // The translucent surface that follows its module's theme is the glass
  // role since cae0b91, which replaced `bg-white/70 dark:bg-black/70` (the
  // library no longer compiles those classes): the theme's glass colour at
  // the token's 0.7, which Chromium keeps in 8 bits and reads back as 0.698.
  for (const [id, rgb] of [
    ["light-variant", "255, 255, 255"],
    ["nested-light-variant", "255, 255, 255"],
    ["nested-dark-variant", "0, 0, 0"],
  ])
    assert.match(
      await background(id),
      new RegExp(`^rgba\\(${rgb}, 0\\.(698|7)\\)$`),
      `${id} is not its module's glass`,
    );
  console.log(
    "PASS sibling and arbitrarily nested theme tokens and dark variants",
  );
  // Programmatic activation deliberately leaves focus unchanged; these nonmodal
  // popovers opt out of autofocus so both independent modules can stay open.
  for (const id of ["dark", "light"]) {
    await page
      .getByRole("button", { name: `${id} overlay`, exact: true })
      .evaluate((node) => node.click());
    await page.getByTestId(`${id}-overlay`).waitFor();
  }
  assert.equal(await background("dark-overlay"), dark);
  assert.equal(await background("light-overlay"), light);
  await page.keyboard.press("Escape");
  await page.getByTestId("light-overlay").waitFor({ state: "hidden" });
  await page.keyboard.press("Escape");
  await page.getByTestId("dark-overlay").waitFor({ state: "hidden" });
  console.log("PASS simultaneous differently themed module overlays");
  for (const id of ["dark", "nested-light", "nested-dark", "light"]) {
    const trigger = page.getByRole("button", {
      name: `${id} overlay`,
      exact: true,
    });
    await trigger.click();
    const overlay = page.getByTestId(`${id}-overlay`);
    await overlay.waitFor();
    assert.equal(
      await background(`${id}-overlay`),
      id.includes("dark") ? dark : light,
    );
    assert.equal(
      await overlay.evaluate((node) => !!node.closest("[data-kozmos-portal]")),
      true,
    );
    if (id === "dark") {
      const existingContent = await overlay.elementHandle();
      await page
        .getByRole("button", { name: "dark dark", exact: true })
        .evaluate((node) => node.click());
      await page
        .getByRole("button", { name: "dark light", exact: true })
        .waitFor();
      assert.equal(
        await existingContent.evaluate((node) => node.isConnected),
        true,
        "theme update remounted open content",
      );
      assert.equal(
        await background("dark-overlay"),
        light,
        "portal did not follow theme update",
      );
      assert.equal(
        await background("nested-dark-surface"),
        dark,
        "parent change leaked to nested preference",
      );
    }
    await page.keyboard.press("Escape");
    await overlay.waitFor({ state: "hidden" });
  }
  console.log("PASS automatic overlay ownership and live theme updates");
  await page.emulateMedia({ colorScheme: "dark" });
  await page
    .getByRole("button", { name: "system dark", exact: true })
    .waitFor();
  assert.equal(await background("system-surface"), dark);
  await page.locator("#unmount").click();
  assert.equal(await page.locator("[data-kozmos-portal]").count(), 0);
  assert.deepEqual(await hostStyles(), before);
  assert.deepEqual(errors, []);
  console.log("PASS system changes, provider cleanup and host preservation");
  await page.addStyleTag({
    content: readFileSync("packages/react/dist/reset.css", "utf8"),
  });
  assert.equal(
    await page
      .locator("#host-heading")
      .evaluate((node) => getComputedStyle(node).margin),
    "0px",
  );
  console.log("PASS explicit reset export applies only when imported");
} finally {
  await browser.close();
}
