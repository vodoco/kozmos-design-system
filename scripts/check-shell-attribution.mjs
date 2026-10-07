import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("shell-attribution.fixture.tsx");
const browser = await launchFixtureBrowser();
async function settled(page) {
  await settleLayout(page);
  await page.waitForFunction(
    () =>
      !document.querySelector('[data-slot="map-shell-panel"][data-settling]'),
  );
  await settleLayout(page);
}
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const dir of ["ltr", "rtl"])
    for (const width of [390, 1200])
      for (const panel of [false, true])
        for (const large of [false, true]) {
          await page.evaluate(
            (config) => window.renderAttributionShell(config),
            { dir, width, panel, large },
          );
          await settled(page);
          const attribution = page.getByRole("region", {
            name: "Map attribution",
          });
          assert.equal(
            await attribution.count(),
            1,
            "shell owns a visible attribution slot",
          );
          const box = await attribution.boundingBox();
          assert.ok(box && box.height > 0);
          if (width === 390 && !panel) {
            const logo = await attribution.locator("img").boundingBox();
            assert.ok(
              logo.width >= 97,
              "centering does not squash the default logo between unequal corners",
            );
          }
          const mapBox = await page.getByTestId("shell").boundingBox();
          assert.ok(
            Math.abs(box.x + box.width / 2 - mapBox.x - mapBox.width / 2) < 1,
            `attribution stays centered on the full map: ${JSON.stringify({ box, mapBox, width, panel, dir })}`,
          );
          const textRow = await attribution.locator("ul").boundingBox();
          assert.ok(
            Math.abs(box.y + box.height - textRow.y - textRow.height) < 1,
            "map credit text ends at the attribution slot edge, without extra bottom padding",
          );
          if (!panel && !large) {
            const end = await page.getByTestId("end").boundingBox();
            const shell = await page.getByTestId("shell").boundingBox();
            assert.ok(
              Math.abs(shell.y + shell.height - end.y - end.height - 16) < 1,
              "corner bottom inset stays 16 regardless of attribution",
            );
          }
          for (const selector of [
            '[data-testid="start"]',
            '[data-testid="end"]',
            '[data-slot="map-shell-panel"]',
          ]) {
            const other = page.locator(selector);
            if (!(await other.count()) || !(await other.isVisible())) continue;
            const b = await other.boundingBox();
            assert.ok(
              !(
                box.x < b.x + b.width &&
                b.x < box.x + box.width &&
                box.y < b.y + b.height &&
                b.y < box.y + box.height
              ),
              `attribution overlaps ${selector}: ${JSON.stringify({ box, b, width, panel, large, dir })}`,
            );
          }
          assert.ok(
            await attribution.getByRole("link").evaluate((node) => {
              const r = node.getBoundingClientRect();
              const viewport = node
                .closest(".kozmos-map-attribution-scroll")
                .getBoundingClientRect();
              const hit = document.elementFromPoint(
                (Math.max(r.left, viewport.left) +
                  Math.min(r.right, viewport.right)) /
                  2,
                r.y + r.height / 2,
              );
              return node === hit || node.contains(hit);
            }),
            "credit link remains reachable",
          );
        }
  for (const dir of ["ltr", "rtl"])
    for (const panelPlacement of ["start", "end"]) {
      await page.evaluate((config) => window.renderAttributionShell(config), {
        width: 1200,
        panel: true,
        corners: false,
        dir,
        panelPlacement,
      });
      await settled(page);
      const footer = await page
        .getByRole("region", { name: "Map attribution" })
        .boundingBox();
      const shell = await page.getByTestId("shell").boundingBox();
      const panel = await page
        .locator('[data-slot="map-shell-panel"]')
        .boundingBox();
      assert.ok(
        Math.abs(footer.x + footer.width / 2 - shell.x - shell.width / 2) < 1,
      );
      assert.ok(
        panel.y + panel.height + 15 <= footer.y,
        "a tall side panel leaves the centered footer clear without corner controls",
      );
    }
  await page.evaluate(() =>
    window.renderAttributionShell({
      panel: true,
      detent: "medium",
      height: 390,
      long: true,
      tallBrand: true,
    }),
  );
  await settled(page);
  assert.equal(
    await page
      .locator("[data-kozmos-scroller]")
      .evaluate((node) => getComputedStyle(node).overflowY),
    "auto",
    "a sheet capped by attribution must still allow scrolling",
  );
  for (const scale of [1, 2])
    for (const keyboard of [0, 240])
      for (const dir of ["ltr", "rtl"]) {
        await page.evaluate(
          ({ scale, keyboard, dir }) => {
            document.documentElement.style.fontSize = `${16 * scale}px`;
            window.renderAttributionShell({
              width: 390,
              height: 720,
              keyboard,
              dir,
              long: true,
              panel: true,
            });
          },
          { scale, keyboard, dir },
        );
        await settled(page);
        const footer = await page
          .locator("[data-kozmos-attribution]")
          .boundingBox();
        const panel = await page
          .locator('[data-slot="map-shell-panel"]')
          .boundingBox();
        assert.ok(footer && footer.height > 0 && footer.y >= 0);
        assert.ok(
          footer.y + footer.height <= panel.y + 1,
          `long credits stay above the panel: ${JSON.stringify({ footer, panel, scale, keyboard, dir, layout: await page.evaluate(() => window.attributionLayout) })}`,
        );
        const layout = await page.evaluate(() => window.attributionLayout);
        assert.equal(
          layout.occlusions.filter((item) => item.kind === "attribution")
            .length,
          1,
        );
        assert.ok(
          layout.collisionInsets.bottom > 0,
          "attribution reserves camera padding",
        );
        for (const id of ["start", "end"]) {
          const node = page.getByTestId(id);
          if (await node.isVisible()) {
            const box = await node.boundingBox();
            assert.ok(
              box.x + box.width <= footer.x + 1 ||
                footer.x + footer.width <= box.x + 1 ||
                footer.y + footer.height <= box.y + 1,
              "visible controls and credits never overlap",
            );
            if (id === "end")
              assert.ok(
                Math.abs(box.y + box.height - panel.y + 16) < 1,
                "bottom-most controls retain the 16px sheet gap",
              );
          }
        }
      }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => window.renderAttributionShell({ panel: true }));
  await settled(page);
  for (const large of [true, false]) {
    const collisions = await page.evaluate(async (large) => {
      window.renderAttributionShell({ panel: true, large });
      const failures = [];
      const start = performance.now();
      while (performance.now() - start < 500) {
        await new Promise(requestAnimationFrame);
        const footer = document
          .querySelector("[data-kozmos-attribution]")
          .getBoundingClientRect();
        const panel = document
          .querySelector('[data-slot="map-shell-panel"]')
          .getBoundingClientRect();
        if (footer.bottom > panel.top + 1)
          failures.push({ footer: footer.toJSON(), panel: panel.toJSON() });
      }
      return failures;
    }, large);
    assert.deepEqual(
      collisions,
      [],
      "credits track the moving sheet without overlap",
    );
    await settled(page);
  }
  // GAP-135: an opened direction card and the sheet can leave the credits less room than they need.
  // They are never clipped into a scroll region: the Pointr logo goes first, and the credits keep
  // their full height. A logo is whole or absent.
  const squeezeStates = new Set();
  for (const brandOnly of [false, true])
    for (let barHeight = 200; barHeight <= 660; barHeight += 20) {
      await page.evaluate((config) => window.renderAttributionShell(config), {
        panel: true,
        barHeight,
        brandOnly,
        width: 390,
        height: 720,
      });
      await settled(page);
      const state = await page.evaluate(() => {
        const slot = document.querySelector("[data-kozmos-attribution]");
        if (!slot || slot.hidden || !slot.getBoundingClientRect().height)
          return { empty: true };
        const box = slot.getBoundingClientRect();
        const style = getComputedStyle(slot);
        const inside = (node) => {
          const r = node.getBoundingClientRect();
          return r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
        };
        const logo = slot.querySelector("img");
        const link = slot.querySelector("a");
        const unreachable = [...slot.querySelectorAll("*"), slot].filter(
          (node) => {
            const s = getComputedStyle(node);
            const scrolls =
              (/(auto|scroll)/.test(s.overflowY) &&
                node.scrollHeight > node.clientHeight + 1) ||
              (/(auto|scroll)/.test(s.overflowX) &&
                node.scrollWidth > node.clientWidth + 1);
            return scrolls && node.tabIndex < 0;
          },
        );
        return {
          empty: false,
          clipped:
            /(auto|scroll|hidden|clip)/.test(style.overflowY) &&
            slot.scrollHeight > slot.clientHeight + 1,
          logo: logo
            ? logo.getBoundingClientRect().height > 0 && inside(logo)
              ? "whole"
              : "cut"
            : "absent",
          link: link ? (inside(link) ? "whole" : "cut") : "none",
          unreachable: unreachable.length,
        };
      });
      const where = JSON.stringify({ brandOnly, barHeight, state });
      if (state.empty) {
        squeezeStates.add(brandOnly ? "brand-only gone" : "empty");
        assert.ok(brandOnly, `credits never disappear: ${where}`);
        continue;
      }
      assert.equal(state.clipped, false, `credits are never clipped: ${where}`);
      assert.equal(
        state.unreachable,
        0,
        `no scroll region a keyboard can't reach: ${where}`,
      );
      assert.notEqual(state.logo, "cut", `a logo is whole or absent: ${where}`);
      if (!brandOnly)
        assert.equal(
          state.link,
          "whole",
          `credits keep their full height: ${where}`,
        );
      squeezeStates.add(
        `${brandOnly ? "brand-only" : "credits"} logo ${state.logo}`,
      );
    }
  for (const expected of [
    "credits logo whole",
    "credits logo absent",
    "brand-only logo whole",
    "brand-only gone",
  ])
    assert.ok(
      squeezeStates.has(expected),
      `the squeeze reached "${expected}": ${[...squeezeStates]}`,
    );
  await page.evaluate(() =>
    window.renderAttributionShell({
      panel: true,
      barHeight: 200,
      width: 390,
      height: 720,
    }),
  );
  await settled(page);
  assert.equal(
    await page.locator("[data-kozmos-attribution] img").count(),
    1,
    "the logo comes back when there is room again",
  );
  await page.evaluate(() => window.renderAttributionShell({ credits: false }));
  await settled(page);
  assert.equal(
    await page.getByRole("region", { name: "Map attribution" }).count(),
    0,
  );
  assert.equal(
    await page.evaluate(() =>
      window.attributionLayout.occlusions.some(
        (item) => item.kind === "attribution",
      ),
    ),
    false,
  );
  console.log(
    "PASS shell attribution: 29 layouts, 48 squeezed (never clipped, the logo first), full-map centering, logo clearance, animated detents, RTL, side panels with/without corners, large/capped sheets, keyboard insets, 200% text, long credits, link hit testing and removal",
  );
} finally {
  await browser.close();
}
