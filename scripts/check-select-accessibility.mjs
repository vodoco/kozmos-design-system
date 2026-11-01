import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const PAGE = (css) =>
  `<!doctype html><html lang="en"><head><title>Overlay test</title><style>${css}</style></head><body><button id="host">Host action</button><div id="preexisting" inert="existing"><button>Inert host</button></div><div id="fixture"></div><div id="custom-portal" data-kozmos-root data-theme="light"></div><div aria-live="polite">Live announcement</div></body></html>`;
// What each live role implies, which Kozmos's live parts say as well.
const IMPLIED = { status: "polite", alert: "assertive", log: "polite" };

/** Axe over the open page. `aria-hidden-focus` is a wcag2a rule, so the tags
 * run it; it is named here so a run proves it checked the hidden page. A
 * Dialog behind the popup makes axe call a hidden focusable box "needs
 * review" rather than a violation, so those count too. */
async function axeOpen(page, name, { reviewHidden = true } = {}) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const ran = [
    ...results.passes,
    ...results.violations,
    ...results.incomplete,
  ].find((rule) => rule.id === "aria-hidden-focus");
  assert.ok(ran, `${name}: axe ran aria-hidden-focus over the hidden page`);
  const summary = (list) =>
    list.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
        html: n.html,
      })),
    }));
  assert.deepEqual(
    summary(results.violations),
    [],
    `${name} open accessibility`,
  );
  if (reviewHidden)
    assert.deepEqual(
      summary(
        results.incomplete.filter((rule) => rule.id === "aria-hidden-focus"),
      ),
      [],
      `${name}: no hidden box is focusable, even behind a dialog`,
    );
  return ran.nodes.length;
}

/** GAP-193. Each of Kozmos's live parts on the page, with a button in it:
 * it must stay visible (or it is silenced) and in reach, and say the
 * liveness its role implies. */
async function assertLiveParts(page, name) {
  const parts = await page.evaluate(() =>
    [...document.querySelectorAll("[data-live-part]")].map((node) => ({
      part: node.getAttribute("data-live-part"),
      role: node.getAttribute("role"),
      live: node.getAttribute("aria-live"),
      hidden: !!node.closest('[aria-hidden="true"]'),
      inert: !!node.closest("[inert]"),
      buttons: node.querySelectorAll("button").length,
    })),
  );
  assert.equal(parts.length, 4, `${name}: the fixture's four live parts`);
  for (const part of parts) {
    assert.ok(part.buttons > 0, `${name}: ${part.part} holds a button`);
    assert.deepEqual(
      { live: part.live, hidden: part.hidden, inert: part.inert },
      { live: IMPLIED[part.role], hidden: false, inert: false },
      `${name}: ${part.part} (role ${part.role}) stays visible and in reach`,
    );
  }
  return parts.length;
}

/** GAP-193. With a popup that hides the page AND makes it inert, the two
 * agree: no focusable box is hidden but in reach, and no live region is
 * shown but inert. */
async function assertAgreement(page, name) {
  const mismatch = await page.evaluate(() => {
    const hidden = (node) => !!node.closest('[aria-hidden="true"]');
    const inert = (node) => !!node.closest("[inert]");
    const describe = (node) => node.outerHTML.slice(0, 120);
    const focusable = [
      ...document.body.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]",
      ),
    ].filter((node) => node.tabIndex >= 0 && !node.disabled);
    const live = [
      ...document.body.querySelectorAll(
        '[aria-live], [role~="status"], [role~="alert"], [role~="log"], output',
      ),
    ];
    return {
      hiddenButFocusable: focusable
        .filter((node) => hidden(node) && !inert(node))
        .map(describe),
      shownButInert: live
        .filter((node) => !hidden(node) && inert(node))
        .map(describe),
      focusable: focusable.length,
      live: live.length,
    };
  });
  assert.deepEqual(
    {
      hiddenButFocusable: mismatch.hiddenButFocusable,
      shownButInert: mismatch.shownButInert,
    },
    { hiddenButFocusable: [], shownButInert: [] },
    `${name}: aria-hidden and inert agree`,
  );
  return mismatch;
}

/** GAP-193. A product's own region with a live role and no aria-live is
 * hidden by the primitive as it opens: it is out of reach with it. */
async function assertProductRegion(page, name) {
  const region = await page.locator("[data-product-live]").evaluate((node) => ({
    hidden: !!node.closest('[aria-hidden="true"]'),
    inert: !!node.closest("[inert]"),
  }));
  assert.deepEqual(
    region,
    { hidden: true, inert: true },
    `${name}: a product's role-only region is hidden and out of reach together`,
  );
}

/** GAP-193. A live part mounted while the popup is open, in a box the
 * primitive hid as it opened, is hidden with it: it must be out of reach as
 * well, not a focusable button a screen reader is told is not there. */
async function assertLateLivePart(page, name) {
  await page.evaluate(() => window.mountLateAlert());
  await page.locator("[data-late-part]").waitFor({ state: "attached" });
  // The inert owner answers the mutation in a microtask; give it a frame.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
  );
  const late = await page.locator("[data-late-part]").evaluate((node) => ({
    live: node.getAttribute("aria-live"),
    hidden: !!node.closest('[aria-hidden="true"]'),
    inert: !!node.closest("[inert]"),
  }));
  assert.deepEqual(
    late,
    { live: "assertive", hidden: true, inert: true },
    `${name}: a live part mounted in a hidden box is out of reach too`,
  );
  await assertAgreement(page, `${name} after a late live part`);
}

const { code, css } = await buildReactFixture("select-accessibility-host.tsx");
const browser = await launchFixtureBrowser();
try {
  for (const name of [
    "Normal",
    "Controlled",
    "Custom",
    "Nested",
    "Unmount",
    "LanguageSwitcher",
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setContent(PAGE(css));
    await page.addScriptTag({ content: code });
    if (name === "Nested")
      await page.getByRole("button", { name: "Open dialog" }).click();
    const trigger =
      name === "LanguageSwitcher"
        ? page.getByRole("combobox", { name: "Language, English" })
        : page.getByRole("combobox", {
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
    const checked = await axeOpen(page, name);
    const parts = await assertLiveParts(page, name);
    const agreement = await assertAgreement(page, name);
    await assertProductRegion(page, name);
    if (name === "Normal" || name === "LanguageSwitcher")
      await assertLateLivePart(page, name);
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
    assert.equal(
      await page.locator("[inert]").count(),
      1,
      `${name}: only the host's own inert box is left after closing`,
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS ${name}: accessible open state, inert background, cleanup and focus restoration; ` +
        `${parts} role-only live parts with buttons kept visible and in reach, aria-hidden and inert agree over ` +
        `${agreement.focusable} focusable boxes and ${agreement.live} live regions, a product's role-only region is out of reach with the page, ` +
        `axe aria-hidden-focus checked ${checked} hidden boxes` +
        (name === "Normal" || name === "LanguageSwitcher"
          ? ", and a live part mounted late in a hidden box is out of reach"
          : ""),
    );
  }

  // GAP-193: the other modal Radix primitives. Each hides the page with the
  // same hideOthers as it opens. Dialog and Drawer trap focus behind an
  // overlay, which axe reads as a modal and so reports a hidden focusable
  // box behind them as "needs review", never a violation; Menu makes the
  // page inert as Select does. Either way Kozmos's live parts stay visible,
  // so they keep speaking, and in reach.
  for (const [name, open, role] of [
    ["Dialog", "Open dialog", "dialog"],
    ["Drawer", "Open drawer", "dialog"],
    ["Menu", "Open menu", "menu"],
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setContent(PAGE(css));
    await page.addScriptTag({ content: code });
    const trigger = page.getByRole("button", { name: open });
    await trigger.click();
    const popup = page.getByRole(role);
    await popup.waitFor();
    await popup.evaluate((node) =>
      Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    const checked = await axeOpen(page, name, {
      reviewHidden: name === "Menu",
    });
    const parts = await assertLiveParts(page, name);
    let agreement;
    if (name === "Menu") {
      agreement = await assertAgreement(page, name);
      await assertProductRegion(page, name);
      await assertLateLivePart(page, name);
      assert.equal(
        await page.locator("#host").evaluate((n) => !!n.closest("[inert]")),
        true,
        "Menu: host must be non-interactive",
      );
    }
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
    await page.waitForFunction(
      (n) => document.activeElement === n,
      await trigger.elementHandle(),
    );
    assert.equal(
      await page.locator("[inert]").count(),
      1,
      `${name}: only the host's own inert box is left after closing`,
    );
    assert.equal(
      await page.locator("[data-aria-hidden]").count(),
      0,
      `${name}: the page is shown again after closing`,
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS ${name}: ${parts} role-only live parts with buttons kept visible and in reach while open, ` +
        `axe aria-hidden-focus checked ${checked} hidden boxes` +
        (agreement
          ? `, aria-hidden and inert agree over ${agreement.focusable} focusable boxes and ${agreement.live} live regions, ` +
            "a product's role-only region is out of reach with the page, a live part mounted late in a hidden box is out of reach, and the page is inert"
          : ""),
    );
  }
} finally {
  await browser.close();
}
