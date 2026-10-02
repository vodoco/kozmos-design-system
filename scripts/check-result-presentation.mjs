import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("result-presentation-host.tsx");
for (const pointer of ["mouse", "touch"]) {
  const browser = await launchFixtureBrowser({ pointer });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 1000 },
      reducedMotion: "reduce",
      hasTouch: pointer === "touch",
    });
    assert.deepEqual(
      await page.evaluate(() => ({
        fineHover: matchMedia("(hover: hover) and (pointer: fine)").matches,
        coarseNoHover: matchMedia("(hover: none) and (pointer: coarse)")
          .matches,
      })),
      { fineHover: pointer === "mouse", coarseNoHover: pointer === "touch" },
      `${pointer}: browser input capability precondition`,
    );
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<!doctype html><html><head></head><body style="margin:0"><div id="root"></div></body></html>',
    );
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: code });
    const card = (id) => page.locator(`[data-poi-id="${id}"]`);
    const fill = (id) =>
      card(id).evaluate((e) => getComputedStyle(e).backgroundColor);
    const select = (id) => card(id).locator(":scope > button");
    const settle = async (id, color) => {
      try {
        await page.waitForFunction(
          ({ id, color }) =>
            getComputedStyle(document.querySelector(`[data-poi-id="${id}"]`))
              .backgroundColor === color,
          { id, color },
        );
      } catch (error) {
        console.error(
          "Result color did not settle",
          await card(id).evaluate((e, expected) => {
            const rect = e.getBoundingClientRect();
            return {
              expected,
              actual: getComputedStyle(e).backgroundColor,
              selected: e.hasAttribute("data-selected"),
              hovered: e.matches(":hover"),
              fineHover: matchMedia("(hover: hover) and (pointer: fine)")
                .matches,
              rect: rect.toJSON(),
              scrollY,
              direction: getComputedStyle(e).direction,
              hoveredElements: [...document.querySelectorAll(":hover")].map(
                (n) => ({
                  tag: n.tagName,
                  id: n.getAttribute("data-poi-id"),
                  className: n.className,
                }),
              ),
            };
          }, color),
        );
        throw error;
      }
    };
    for (const dark of [false, true]) {
      if (dark)
        await page.getByRole("button", { name: "Theme", exact: true }).click();
      const selectedFill = dark ? "rgb(20, 22, 26)" : "rgb(249, 250, 251)";
      const hoverFill = dark ? "rgb(32, 35, 41)" : "rgb(238, 239, 240)";
      for (const rtl of [false, true]) {
        if (rtl)
          await page
            .getByRole("button", { name: "Direction", exact: true })
            .click();
        await select("single-featured").click();
        await page.mouse.move(0, 0);
        await settle("single-featured", selectedFill);
        assert.equal(await fill("single-featured"), selectedFill);
        for (const id of [
          "group-featured",
          "group-alternative",
          "group-standard",
          "single-featured",
          "single-alternative",
          "single-standard",
        ]) {
          const geometry = await card(id).evaluate((e) => {
            const tab = e.querySelector("[data-tab]");
            const name = e.querySelector(".kozmos-poi-result-name");
            const s = getComputedStyle(tab);
            const r = tab.getBoundingClientRect();
            const n = name.getBoundingClientRect();
            const button = e.querySelector(":scope > button");
            return {
              topGap: r.top - button.getBoundingClientRect().top,
              topStart: s.borderStartStartRadius,
              bottomEnd: s.borderEndEndRadius,
              overlap: r.bottom > n.top,
              overflow: e.scrollWidth > e.clientWidth + 1,
              nameClipped: name.scrollWidth > name.clientWidth + 1,
              side: s.paddingInlineStart,
              top: s.paddingTop,
              minimum: s.minHeight,
            };
          });
          assert.ok(
            Math.abs(geometry.topGap) < 0.1,
            `${id}: tag must be flush with selection row (gap ${geometry.topGap}px)`,
          );
          assert.equal(
            geometry.topStart,
            id === "group-alternative" || id === "group-standard"
              ? "0px"
              : "16px",
            `${id}: top-start`,
          );
          assert.equal(geometry.bottomEnd, "16px", `${id}: bottom-end`);
          assert.equal(geometry.side, "10px");
          assert.equal(geometry.top, "1px");
          assert.equal(geometry.minimum, "20px");
          assert.equal(geometry.overlap, false, `${id}: tag/name overlap`);
          assert.equal(geometry.overflow, false, `${id}: overflow`);
          assert.equal(geometry.nameClipped, false, `${id}: name clipping`);
        }
        const restingFill = await fill("group-alternative");
        await select("group-alternative").hover();
        await settleLayout(page);
        await settle(
          "group-alternative",
          pointer === "mouse" ? hoverFill : restingFill,
        );
        const tagBounds = await card("group-alternative")
          .locator("[data-tab]")
          .boundingBox();
        await page.mouse.click(
          tagBounds.x + tagBounds.width / 2,
          tagBounds.y + tagBounds.height / 2,
        );
        await settle("group-alternative", selectedFill);
        assert.equal(await page.locator("article[data-selected]").count(), 1);
        await card("group-alternative")
          .getByRole("button", { name: "Go", exact: true })
          .click();
        assert.equal(await page.locator("output").textContent(), "navigate");
        assert.equal(
          await select("group-alternative").getAttribute("aria-current"),
          "location",
        );
        await page.getByRole("button", { name: "Hide", exact: true }).click();
        assert.equal(await card("group-alternative").count(), 0);
        await page
          .getByRole("button", { name: "Show 2 more", exact: true })
          .click();
        assert.equal(
          await select("group-alternative").getAttribute("aria-current"),
          "location",
        );
        await select("group-standard").focus();
        await page.keyboard.press("Space");
        assert.equal(
          await select("group-standard").getAttribute("aria-current"),
          "location",
        );
        if (rtl)
          await page
            .getByRole("button", { name: "Direction", exact: true })
            .click();
      }
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "32px"),
    );
    for (const gap of await page
      .locator(".kozmos-poi-result-card [data-tab]")
      .evaluateAll((tabs) =>
        tabs.map(
          (tab) =>
            tab.getBoundingClientRect().top -
            tab.parentElement.getBoundingClientRect().top,
        ),
      )) {
      assert.ok(Math.abs(gap) < 0.1, `200% text: tag top gap ${gap}px`);
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "320px / 200% text overflow",
    );
    if (process.env.RESULT_PRESENTATION_SCREENSHOT)
      await page.screenshot({
        path: process.env.RESULT_PRESENTATION_SCREENSHOT,
        fullPage: true,
      });
    assert.deepEqual(errors, []);
    console.log(
      `PASS: SDK result production build (${pointer}) — both themes, RTL/LTR, six card/group states, flush tag alignment, corner radii, hover/selection, independent actions, keyboard, collapse/expand and 320px enlarged text.`,
    );
  } finally {
    await browser.close();
  }
}
