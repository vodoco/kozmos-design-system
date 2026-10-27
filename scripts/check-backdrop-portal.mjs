/**
 * Backdrop in the theme's portal, on the built package in a real browser
 * (packages/react/tests/integration/backdrop-portal-host.tsx): a page with a
 * sticky Navbar (z 50) and a map under it, the map isolating its stacking as
 * MapView does since site GAP-40, holding "Add desk", which a Backdrop
 * rendered inside the map lights, with a step card as its child.
 *
 * - Fixed (the default), the dim covers the page: the Navbar too, read with
 *   elementFromPoint, whether or not the map isolates. Rendered inside an
 *   isolated map, a Backdrop drawn in place was trapped in the map's
 *   stacking context, under the Navbar.
 * - A click on the target through the cut-out reaches it; a click on the
 *   step card reaches the card, which is on top of the dim; a click on the
 *   Navbar reaches the dim, not the Navbar.
 * - Inline, the dim covers the map alone: the Navbar is not dimmed, and the
 *   cut-out and the card work as they do fixed.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-backdrop-portal.mjs
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("backdrop-portal-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const engine = browser.browserType().name();
const failures = [];
let passed = 0;

async function scenario(name, mount, run) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Backdrop portal</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.backdropPortal.mount(mount), mount);
    if (!mount.layers)
      await page.locator("#backdrop").waitFor({ state: "attached" });
    // The cut-out is drawn on the next frames.
    if (mount.withTarget !== false && !mount.layers)
      await page.waitForFunction(
        () => document.getElementById("backdrop")?.hasAttribute("data-lit"),
        undefined,
        { timeout: 5000 },
      );
    await settleLayout(page);
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

/** What is on top at the middle of each part, and what each part is. */
const tops = (page) =>
  page.evaluate(() => {
    const at = (id) => {
      const r = document.getElementById(id).getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      const backdrop = document.getElementById("backdrop");
      return hit?.closest("#card")
        ? "card"
        : hit && backdrop.contains(hit)
          ? "dim"
          : hit?.closest("#navbar")
            ? "navbar"
            : hit?.closest("#target")
              ? "target"
              : hit?.id || hit?.tagName;
    };
    const backdrop = document.getElementById("backdrop");
    return {
      navbar: at("navbar"),
      target: at("target"),
      card: at("card"),
      inPortal: !!backdrop.closest("[data-kozmos-portal]"),
      inMap: !!backdrop.closest("#map"),
    };
  });

const centre = async (page, selector) => {
  const box = await page.locator(selector).boundingBox();
  return [box.x + box.width / 2, box.y + box.height / 2];
};

for (const isolate of [true, false]) {
  await scenario(
    `fixed, in a map that ${isolate ? "isolates" : "does not isolate"} its stacking: the dim covers the page`,
    { isolate },
    async (page) => {
      const t = await tops(page);
      assert.deepEqual(
        { navbar: t.navbar, target: t.target, card: t.card },
        { navbar: "dim", target: "target", card: "card" },
        "the Navbar is dimmed, the target shows through the cut-out, the card is on top",
      );
      assert.equal(t.inPortal, true, "drawn in the theme's portal");
      assert.equal(t.inMap, false, "not inside the map");
      await page.mouse.click(...(await centre(page, "#target")));
      await page.mouse.click(...(await centre(page, "#next")));
      await page.mouse.click(...(await centre(page, "#navbar")));
      assert.deepEqual(
        await page.evaluate(() => ({
          target: window.backdropPortal.counts.target,
          card: window.backdropPortal.counts.card,
        })),
        { target: 1, card: 1 },
        "the target took the press through the cut-out, the card its own",
      );
    },
  );
}

await scenario(
  "inline, in an isolated map: the dim covers the map alone",
  { isolate: true, placement: "inline" },
  async (page) => {
    const t = await tops(page);
    assert.equal(t.inPortal, false, "drawn in place");
    assert.equal(t.inMap, true, "inside the map");
    assert.deepEqual(
      { navbar: t.navbar, target: t.target, card: t.card },
      { navbar: "navbar", target: "target", card: "card" },
      "the Navbar is not dimmed; the cut-out and the card work as fixed",
    );
    await page.mouse.click(...(await centre(page, "#target")));
    await page.mouse.click(...(await centre(page, "#next")));
    assert.deepEqual(
      await page.evaluate(() => ({
        target: window.backdropPortal.counts.target,
        card: window.backdropPortal.counts.card,
      })),
      { target: 1, card: 1 },
      "the target and the card take their presses",
    );
  },
);

// Drawn at the same layer in the same portal as the popovers, whichever
// opened last is on top (Backdrop.mdx says so).
for (const first of ["popover", "backdrop"]) {
  await scenario(
    `a ${first} opened first is under the other`,
    { layers: true, withTarget: false },
    async (page) => {
      const second = first === "popover" ? "backdrop" : "popover";
      await page.evaluate(
        (name) => window.backdropPortal.open[name](true),
        first,
      );
      await page.locator(`#${first}`).waitFor();
      await page.evaluate(
        (name) => window.backdropPortal.open[name](true),
        second,
      );
      await page.locator(`#${second}`).waitFor();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const top = await page.evaluate(() => {
        const r = document.getElementById("popover").getBoundingClientRect();
        const at = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return at?.closest("#popover")
          ? "popover"
          : at?.closest("#backdrop")
            ? "backdrop"
            : at?.id || at?.tagName;
      });
      assert.equal(top, second, `the one opened last is on top (${top})`);
    },
  );
}

// #419's review: inside a modal, which makes everything outside its content
// inert, the backdrop is drawn in the content.
for (const modal of ["dialog", "drawer", "bottomsheet"]) {
  await scenario(
    `inside a ${modal}, with no target, the scrim blocks a press on the ${modal}'s button`,
    { modal, withTarget: false },
    async (page) => {
      // Once the modal has finished entering.
      await new Promise((resolve) => setTimeout(resolve, 400));
      const hit = await page.evaluate(() => {
        const r = document.getElementById("save").getBoundingClientRect();
        const at = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return {
          dim: !!at && document.getElementById("backdrop").contains(at),
          at: at?.id || at?.tagName,
        };
      });
      assert.equal(hit.dim, true, `the dim is over Save (${hit.at})`);
      await page.mouse.click(...(await centre(page, "#save")));
      assert.equal(
        await page.evaluate(() => window.backdropPortal.counts.save),
        0,
        "Save took no press",
      );
    },
  );
  await scenario(
    `inside a ${modal}, with a target, Tab reaches the card's Next and focus stays there; nothing is hidden from readers`,
    { modal, withTarget: true },
    async (page) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      let reached = false;
      for (let i = 0; i < 12 && !reached; i += 1) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(
          () => document.activeElement?.id === "next",
        );
      }
      assert.equal(reached, true, "Tab reaches Next");
      await new Promise((resolve) => setTimeout(resolve, 300));
      assert.equal(
        await page.evaluate(() => document.activeElement?.id),
        "next",
        "focus stays on Next",
      );
      const hidden = await page.evaluate(() =>
        ["backdrop", "card", "next"].filter((id) =>
          document.getElementById(id).closest('[aria-hidden="true"]'),
        ),
      );
      assert.deepEqual(
        hidden,
        [],
        "neither the backdrop nor its card is hidden from readers",
      );
      assert.equal(
        await page.getByRole("button", { name: "Next" }).count(),
        1,
        "Next is a button a reader finds",
      );
      await page.keyboard.press("Enter");
      assert.equal(
        await page.evaluate(() => window.backdropPortal.counts.card),
        1,
        "Next takes Enter",
      );
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(
    `\n${failures.length} Backdrop portal scenario(s) failed in ${engine}: ${failures.join("; ")}`,
  );
  process.exit(1);
}
console.log(`\nBackdrop portal: ${passed} scenarios passed in ${engine}.`);
