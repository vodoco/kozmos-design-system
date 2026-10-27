/**
 * The design config's reduced motion in the theme's portal, on the built
 * package in a real browser (packages/react/tests/integration/
 * portal-motion-host.tsx).
 *
 * DesignConfigProvider marks its scope `data-kozmos-motion="reduced"` when
 * its config reduces motion (`motion: "reduced"`, or
 * `accessibility.reduceMotion`), and every animation that loops stops on that
 * mark (GAP-50): a loop needs telling, not scaling. Popover, Dialog, Drawer
 * (and BottomSheet, which is Drawer), Tooltip, Select, Menu and Combobox's
 * list draw in the provider's portal, which is not inside the scope. Each is
 * opened, holding a Spinner where its content takes one, and read:
 *
 * - the mark: the content is inside an element marked reduced;
 * - the loop: the Spinner's arc has no animation (it strobes otherwise: the
 *   config scales durations to a thousandth, so the 1 s spin is 1 ms);
 * - the entry: the content's own animation is a cut (0.15 s times the
 *   config's 0.001), the scale reaching the portal as a token;
 * - what else the config's provider sets reaches the portal too: its theme,
 *   density and direction (dark, compact, right to left here);
 * - and the mark follows the config: off when motion is fluid again, back
 *   when it is reduced.
 *
 * Toast draws in place, so it is a control; a ThemeProvider inside the
 * config's provider has a portal of its own, under the same config.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-portal-motion.mjs
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("portal-motion-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
let passed = 0;

const REDUCED = { motion: "reduced" };
const FLUID = { motion: "fluid" };

async function open(page, part, config) {
  await page.evaluate(
    ({ part, config }) => window.portalMotion.mount({ part, config }),
    { part, config },
  );
  if (part === "combobox") {
    await page.getByRole("combobox", { name: "Building" }).focus();
    await page.keyboard.press("ArrowDown");
  }
  await page
    .locator('[data-probe="content"], [role="listbox"]')
    .first()
    .waitFor();
  await settleLayout(page);
}

/** What the content is under, and what its loop and its entry do. */
const read = (page) =>
  page.evaluate(() => {
    const content =
      document.querySelector('[data-probe="content"]') ??
      document.querySelector('[role="listbox"]');
    const arc = content.querySelector(".kozmos-spinner-arc");
    const portal = content.closest("[data-kozmos-portal]");
    const seconds = (value) =>
      Math.max(
        ...value
          .split(",")
          .map(
            (part) =>
              parseFloat(part) * (part.trim().endsWith("ms") ? 0.001 : 1),
          ),
      );
    const style = getComputedStyle(content);
    return {
      marked: !!content.closest('[data-kozmos-motion="reduced"]'),
      inPortal: !!portal,
      portal: portal && {
        theme: portal.getAttribute("data-theme"),
        density: portal.getAttribute("data-kozmos-density"),
        dir: portal.getAttribute("dir"),
      },
      arc: arc ? getComputedStyle(arc).animationName : null,
      entry:
        style.animationName === "none" ? 0 : seconds(style.animationDuration),
    };
  });

async function scenario(name, run) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 700 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Portal motion</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await run(page);
    assert.deepEqual(errors, [], "no page errors");
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

const PORTALLED = [
  ["popover", true],
  ["dialog", true],
  ["drawer", true],
  ["tooltip", true],
  ["select", true],
  ["menu", true],
  ["combobox", false],
  ["nested", true],
];

for (const [part, hasLoop] of PORTALLED) {
  await scenario(
    `${part}: in the portal, under the config's reduced motion`,
    async (page) => {
      await open(page, part, REDUCED);
      const r = await read(page);
      console.log(`  read ${part}: ${JSON.stringify(r)}`);
      assert.equal(r.inPortal, true, `${part} draws in the theme's portal`);
      assert.deepEqual(
        part === "nested" ? { ...r.portal, theme: "dark" } : r.portal,
        { theme: "dark", density: "compact", dir: "rtl" },
        `the provider's theme, density and direction reach the portal (${JSON.stringify(r.portal)})`,
      );
      assert.ok(
        r.entry <= 0.001,
        `the entry is a cut, the scale reaching the portal (${r.entry}s)`,
      );
      assert.equal(
        r.marked,
        true,
        "the portal carries the config's reduced-motion mark",
      );
      if (hasLoop)
        assert.equal(
          r.arc,
          "none",
          `the Spinner inside holds still (${r.arc})`,
        );
    },
  );
}

await scenario(
  "dialog: accessibility.reduceMotion marks the portal as motion reduced does",
  async (page) => {
    await open(page, "dialog", { accessibility: { reduceMotion: true } });
    const r = await read(page);
    assert.equal(r.marked, true, "marked");
    assert.equal(r.arc, "none", `the Spinner holds still (${r.arc})`);
  },
);

await scenario(
  "popover: the portal's mark follows the config as it changes",
  async (page) => {
    await open(page, "popover", FLUID);
    let r = await read(page);
    assert.equal(r.marked, false, "fluid: no mark");
    assert.equal(r.arc, "kozmos-spin", "fluid: the Spinner spins");
    await page.evaluate(
      (config) => window.portalMotion.setConfig(config),
      REDUCED,
    );
    await settleLayout(page);
    r = await read(page);
    assert.equal(r.marked, true, "reduced: marked");
    assert.equal(r.arc, "none", "reduced: the Spinner holds still");
    await page.evaluate(
      (config) => window.portalMotion.setConfig(config),
      FLUID,
    );
    await settleLayout(page);
    r = await read(page);
    assert.equal(r.marked, false, "fluid again: the mark is gone");
    assert.equal(r.arc, "kozmos-spin", "fluid again: the Spinner spins");
  },
);

await scenario(
  "toast, drawn in place, is under the mark (control)",
  async (page) => {
    await open(page, "toast", REDUCED);
    const r = await read(page);
    assert.equal(r.inPortal, false, "the toast draws in place");
    assert.equal(r.marked, true, "marked by the provider's own scope");
    assert.equal(r.arc, "none", "its Spinner holds still");
  },
);

await browser.close();
if (failures.length) {
  console.error(
    `\n${failures.length} portal motion scenario(s) failed in ${engine}: ${failures.join("; ")}`,
  );
  process.exit(1);
}
console.log(`\nPortal motion: ${passed} scenarios passed in ${engine}.`);
