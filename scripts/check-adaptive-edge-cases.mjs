import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("adaptive-host.tsx");
const browser = await launchFixtureBrowser();
let failures = 0;
// GAP-083: where a hosted details card's close button sits in the panel —
// from the panel's top edge, and from its end edge (the left, right to left).
// Counted first, so a missing card fails on an assertion, not a timeout.
async function closeInsets(page) {
  const close = page.getByRole("button", { name: "Close details" });
  assert.equal(
    await close.count(),
    1,
    "the details card and its close button are drawn",
  );
  return close.evaluate((button) => {
    const panel = button.closest("aside");
    const b = button.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const rtl = getComputedStyle(panel).direction === "rtl";
    return {
      top: Math.round((b.top - p.top) * 10) / 10,
      end: Math.round((rtl ? b.left - p.left : p.right - b.right) * 10) / 10,
      headerTop: parseFloat(
        getComputedStyle(button.closest(".kozmos-poi-header")).paddingTop,
      ),
      grip: !!panel.querySelector('[role="slider"]'),
    };
  });
}

// Decision 14: where a hosted category browser's first control sits in the
// panel — its search field, or with no search row its first tile — from the
// panel's top edge and from its start edge (the right, right to left); and
// each of its rows' top padding, the search row's and then the tiles'.
// Counted first, as the details card is.
async function browseInsets(page) {
  const browse = page.getByRole("region", { name: "Browse categories" });
  assert.equal(await browse.count(), 1, "the category browser is drawn");
  return browse.evaluate((section) => {
    const panel = section.closest("aside");
    const field = section.querySelector('[role="search"]');
    const first = field ?? section.querySelector(".kozmos-category-tile");
    const b = first.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const rtl = getComputedStyle(panel).direction === "rtl";
    const round = (value) => Math.round(value * 10) / 10;
    return {
      control: field ? "search field" : "first tile",
      top: round(b.top - p.top),
      start: round(rtl ? p.right - b.right : b.left - p.left),
      rows: [...section.children].map((row) =>
        parseFloat(getComputedStyle(row).paddingTop),
      ),
      grip: !!panel.querySelector('[role="slider"]'),
    };
  });
}

// Decision 14: where a hosted route preview's first row sits in the panel —
// its destination label ("To"), the row's first line — from the panel's top
// edge and from its start edge (the right, right to left); and the top
// padding of that row and of the options under it. Counted first, as the
// details card is.
async function routeInsets(page) {
  const route = page.getByRole("region", { name: "Route preview" });
  assert.equal(await route.count(), 1, "the route preview is drawn");
  return route.evaluate((section) => {
    const panel = section.closest("aside");
    const row = section.querySelector("header");
    const label = row.firstElementChild;
    const b = label.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const rtl = getComputedStyle(panel).direction === "rtl";
    const round = (value) => Math.round(value * 10) / 10;
    return {
      label: label.textContent.trim(),
      top: round(b.top - p.top),
      start: round(rtl ? p.right - b.right : b.left - p.left),
      row: parseFloat(getComputedStyle(row).paddingTop),
      options: parseFloat(getComputedStyle(row.nextElementSibling).paddingTop),
      grip: !!panel.querySelector('[role="slider"]'),
    };
  });
}

// WCAG 2.5.8: the targets inside the 24px circle on the grip's centre. The
// grip is a 16px row, an undersized target, so the circle must meet no other.
async function insideGripCircle(page) {
  return page.evaluate(() => {
    const grip = document.querySelector(".kozmos-map-sheet-handle");
    const g = grip.getBoundingClientRect();
    const cx = g.left + g.width / 2;
    const cy = g.top + g.height / 2;
    return [
      ...grip
        .closest("aside")
        .querySelectorAll("button, a[href], input, [role='slider']"),
    ]
      .filter((target) => target !== grip)
      .map((target) => {
        const r = target.getBoundingClientRect();
        const dx = Math.max(r.left - cx, 0, cx - r.right);
        const dy = Math.max(r.top - cy, 0, cy - r.bottom);
        return {
          name: target.getAttribute("aria-label") ?? target.textContent.trim(),
          d: Math.hypot(dx, dy),
        };
      })
      .filter(({ d }) => d < 12);
  });
}

// The side panel, as a wide host lays it out: the fixture made 1024 wide.
async function widen(page) {
  await page.evaluate(() => {
    document.getElementById("fixture").style.width = "1024px";
  });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-panel-presentation]")?.dataset
        .panelPresentation === "side",
  );
  await settleLayout(page);
}

const cases = [
  [
    "layout callback cannot mutate padding callback payload",
    async (page) => {
      await page.evaluate(() =>
        window.setAdaptiveOptions({
          collisionInsets: { top: 122 },
          onLayoutChange: (layout) => {
            layout.collisionInsets.top = -999;
          },
          onCollisionInsetsChange: (insets) => {
            window.paddingTestValue = insets.top;
          },
        }),
      );
      await settleLayout(page);
      assert((await page.evaluate(() => window.paddingTestValue)) >= 122);
    },
  ],
  [
    "invalid host inset cannot cancel a CSS safe area",
    async (page) => {
      await page
        .locator("[data-map-status] > [aria-hidden=true]")
        .evaluate((node) => (node.style.paddingTop = "24px"));
      await page.evaluate(() => {
        window.dispatchEvent(new Event("resize"));
        window.setAdaptiveOptions({ safeAreaInsets: { top: NaN } });
      });
      await settleLayout(page);
      // The map runs under the device's safe area and the chrome keeps it
      // (55981f6): the top bar, not the map, starts below it.
      assert.equal(
        await page.evaluate(() => window.adaptiveSnapshot.mapBounds.y),
        0,
        "the map runs under the safe area",
      );
      const barTop = async () => {
        const [bar, host] = await Promise.all([
          page.getByRole("button", { name: "Search this floor" }).boundingBox(),
          page.locator("#fixture").boundingBox(),
        ]);
        return bar.y - host.y;
      };
      assert((await barTop()) >= 24, "the top bar keeps the safe area");
      await page
        .locator("[data-map-status] > [aria-hidden=true]")
        .evaluate((node) => (node.style.paddingTop = "40px"));
      await settleLayout(page);
      assert(
        (await barTop()) >= 40,
        "safe-area changes must be observed without a window resize",
      );
    },
  ],
  [
    "zero-width host excludes interactive content",
    async (page) => {
      await page
        .locator("#fixture")
        .evaluate((node) => (node.style.width = "0px"));
      await settleLayout(page);
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Focus map" }).count(),
        0,
      );
      await page
        .locator("#fixture")
        .evaluate((node) => (node.style.width = "390px"));
      await settleLayout(page);
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).count(),
        1,
      );
    },
  ],
  [
    "a bottom sheet leaves the controls usable, or out of reach",
    async (page) => {
      // Half the shell: the band above the sheet holds the controls.
      await page.evaluate(() =>
        window.setAdaptiveOptions({ panelFraction: 0.5 }),
      );
      await settleLayout(page);
      const focusMap = page.getByRole("button", { name: "Focus map" });
      const controls = await focusMap.boundingBox();
      const panel = await page.locator("aside").boundingBox();
      assert(
        controls.y + controls.height <= panel.y + 1,
        `control ends at ${controls.y + controls.height}, panel starts at ${panel.y}`,
      );
      await focusMap.click({ timeout: 1000 });
      // 88 %: the sheet takes the band, as the shell keeps no height back for
      // the controls (d0ec0b0). They are hidden then, never drawn under the
      // sheet where a keyboard or a screen reader would still reach them.
      await page.evaluate(() =>
        window.setAdaptiveOptions({ panelFraction: 0.88 }),
      );
      await settleLayout(page);
      assert.equal(
        await focusMap.count(),
        0,
        "controls under the sheet must be out of reach",
      );
      assert(
        !(await page.evaluate(() =>
          window.adaptiveSnapshot.occlusions.some(
            (occlusion) => occlusion.kind === "controls",
          ),
        )),
        "hidden controls must not pad the camera",
      );
    },
  ],
  [
    "padding callback cannot mutate layout callback snapshot",
    async (page) => {
      await page.evaluate(() =>
        window.setAdaptiveOptions({
          collisionInsets: { top: 122 },
          onCollisionInsetsChange: (insets) => {
            insets.top = -999;
          },
        }),
      );
      await settleLayout(page);
      assert(
        (await page.evaluate(
          () => window.adaptiveSnapshot.collisionInsets.top,
        )) >= 122,
      );
    },
  ],
  [
    "geometry agrees with visible chrome after font enlargement",
    async (page) => {
      await page.addStyleTag({
        content:
          "button { font-size: 32px !important; line-height: 48px !important; height: auto !important; white-space: normal !important; }",
      });
      await settleLayout(page);
      const layout = await page.evaluate(() => window.adaptiveSnapshot);
      const controls = await page
        .getByRole("button", { name: "Focus map" })
        .boundingBox();
      const topBar = await page
        .getByRole("button", { name: "Search this floor" })
        .boundingBox();
      const measured = layout.occlusions.find(
        (occlusion) => occlusion.kind === "controls",
      ).bounds;
      assert(
        Math.abs(measured.height - controls.height) < 1,
        "controls were clipped by enlarged text",
      );
      assert(controls.y >= topBar.y + topBar.height - 1);
    },
  ],
  [
    "a panel header stays put while the content under it scrolls",
    async (page) => {
      // Row 73: the sheet scrolled as one piece, so the search field went up
      // and out of sight with the results it was searching. Reduced motion:
      // a sheet easing to its detent moves everything in it.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.setAdaptiveOptions({ panelDetent: "large" });
      });
      await settleLayout(page);
      const field = page.getByRole("textbox", { name: "Search this sheet" });
      // Counted first: a missing header would otherwise read null twice and
      // "stay put", or time out rather than fail.
      assert.equal(await field.count(), 1, "the panel header is drawn");
      assert(
        await page.evaluate(
          () => !!document.querySelector("[data-kozmos-panel-header]"),
        ),
        "the panel header has its own row",
      );
      const before = await field.boundingBox();
      const scrolled = await page.evaluate(() => {
        const header = document.querySelector("[data-kozmos-panel-header]");
        const content = header.nextElementSibling;
        content.scrollTop = 300;
        return content.scrollTop;
      });
      await settleLayout(page);
      assert(scrolled > 0, "the content under the header scrolls");
      assert.deepEqual(
        await field.boundingBox(),
        before,
        "the header stays put",
      );
    },
  ],
  [
    "a collapsed sheet shows the whole of a panel header taller than it",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.setAdaptiveOptions({ panelDetent: "collapsed" });
      });
      await settleLayout(page);
      const sortButton = page.getByRole("button", { name: "Sort" });
      assert.equal(await sortButton.count(), 1, "the panel header is drawn");
      const sort = await sortButton.boundingBox();
      const sheet = await page.locator("aside").boundingBox();
      assert(
        sort.y + sort.height <= sheet.y + sheet.height,
        `the header ends at ${sort.y + sort.height}, the sheet at ${sheet.y + sheet.height}`,
      );
    },
  ],
  [
    "a drag that starts on the panel header moves the sheet, however far its content has scrolled",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The detent follows the drag, as a product holding it would.
      await page.evaluate(() => {
        window.showPanelHeader();
        const hold = (detent) =>
          window.setAdaptiveOptions({
            panelDetent: detent,
            onPanelDetentChange: hold,
          });
        hold("large");
      });
      await settleLayout(page);
      const scrolled = await page.evaluate(() => {
        const content = document.querySelector(
          "[data-kozmos-panel-header]",
        )?.nextElementSibling;
        if (!content) return 0;
        content.scrollTop = 300;
        return content.scrollTop;
      });
      assert(
        scrolled > 0,
        "the panel header is drawn over content that has scrolled",
      );
      await settleLayout(page);
      const sheetBefore = await page.locator("aside").boundingBox();
      const filters = await page
        .getByRole("button", { name: "Filters" })
        .boundingBox();
      const x = filters.x + filters.width / 2;
      const y = filters.y + filters.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let step = 1; step <= 10; step++)
        await page.mouse.move(x, y + step * 25);
      await page.mouse.up();
      await page.waitForTimeout(600);
      await settleLayout(page);
      const sheetAfter = await page.locator("aside").boundingBox();
      assert(
        sheetAfter.height < sheetBefore.height - 50,
        `the sheet stayed ${sheetBefore.height}px, now ${sheetAfter.height}px`,
      );
    },
  ],
  [
    "a selected result comes into a sheet below its largest detent, and nothing else moves",
    async (page) => {
      // Row 70: below the largest detent the sheet's content hides its
      // overflow and every touch moves the sheet, so nobody can scroll to a
      // result by hand. A pin's tap still selects one, anywhere in the list.
      const measure = () =>
        page.evaluate(() => {
          const list = document.querySelector(
            'section[aria-label="Points of interest"]',
          );
          const scroller = list.parentElement;
          const aside = document.querySelector("aside");
          const frame = scroller.getBoundingClientRect();
          const style = getComputedStyle(scroller);
          const card = (id) =>
            document
              .querySelector(`[data-poi-id="${id}"]`)
              .getBoundingClientRect();
          return {
            overflow: style.overflowY,
            scrollTop: scroller.scrollTop,
            viewTop: frame.top + scroller.clientTop,
            viewBottom:
              frame.top +
              scroller.clientTop +
              scroller.clientHeight -
              parseFloat(style.paddingBottom),
            last: card("result-10"),
            first: card("result-0"),
            asideTop: aside.getBoundingClientRect().top,
            asideScroll: aside.scrollTop,
            shellScroll: aside.parentElement.scrollTop,
            page: window.scrollY,
          };
        });
      const inView = (box, at) =>
        box.top >= at.viewTop - 0.5 && box.bottom <= at.viewBottom + 0.5;

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => window.showResults());
      await settleLayout(page);
      const before = await measure();
      assert.equal(
        before.overflow,
        "hidden",
        "the sheet rests below its largest detent",
      );
      assert(!inView(before.last, before), "the result starts out of sight");

      await page.evaluate(() => window.showResults("result-10"));
      await settleLayout(page);
      const after = await measure();
      assert(
        inView(after.last, after),
        `result at ${after.last.top}–${after.last.bottom}, view ${after.viewTop}–${after.viewBottom}`,
      );
      assert.equal(
        after.asideTop,
        before.asideTop,
        "the sheet itself stays put",
      );
      assert.equal(after.asideScroll, 0, "the sheet's frame does not scroll");
      assert.equal(after.shellScroll, 0, "the shell does not scroll");
      assert.equal(after.page, 0, "the page does not scroll");

      // And back up, gliding this time: motion is the default.
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.evaluate(() => window.showResults("result-0"));
      await page.waitForTimeout(1500);
      const back = await measure();
      assert(
        inView(back.first, back),
        `result at ${back.first.top}–${back.first.bottom}, view ${back.viewTop}–${back.viewBottom}`,
      );
    },
  ],
  [
    "under a grip, a hosted details card's close button is as far from the sheet's top as from its side, plus the grip's clearance",
    async (page) => {
      // GAP-083: the card's header padded 16 on every side, and the sheet's
      // grip row added 16 above it — the close button sat 33 from the top
      // and 17 from the side. The shell now says what it leaves above its
      // content, and the card tops its header up to 16 rather than adding.
      // Under a grip it keeps 4 more, the grip's target clearance (WCAG
      // 2.5.8, the next case): 21 against 17.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showDetails("sheet");
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await closeInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert(
        Math.abs(at.top - (at.end + 4)) <= 1,
        `close button ${at.top} from the top and ${at.end} from the side`,
      );
    },
  ],
  [
    "at 320 wide, a hosted details card keeps the grip's target clear (WCAG 2.5.8)",
    async (page) => {
      // The grip is a 16px row: an undersized target, so a 24px circle on
      // its centre must meet no other target. With the card's header flush
      // under the grip, at 320 wide the favourite button sat inside that
      // circle (axe target-size). The card keeps the grip's clearance, as a
      // panel header does (#109).
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        document.getElementById("fixture").style.width = "320px";
        window.showDetails("sheet");
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 320,
      );
      await settleLayout(page);
      assert.equal(
        await page.getByRole("button", { name: "Close details" }).count(),
        1,
        "the details card is drawn",
      );
      const inside = await insideGripCircle(page);
      assert.deepEqual(
        inside,
        [],
        `inside the grip's 24px circle: ${JSON.stringify(inside)}`,
      );
    },
  ],
  [
    "a single-detent sheet draws no grip, and the card keeps its own top padding",
    async (page) => {
      // The guard: with no grip the shell leaves nothing above the content,
      // so the card's header must keep its 16 or the button meets the edge.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showDetails("sheet");
        window.setAdaptiveOptions({
          panelDetents: ["medium"],
          panelDetent: "medium",
        });
      });
      await settleLayout(page);
      const at = await closeInsets(page);
      assert(!at.grip, "a single detent draws no grip");
      assert.equal(at.headerTop, 16, "the header keeps its own 16");
      assert(
        Math.abs(at.top - at.end) <= 1,
        `close button ${at.top} from the top and ${at.end} from the side`,
      );
    },
  ],
  [
    "a hosted details card's close button is as far from the side panel's top as from its side",
    async (page) => {
      // The sheet presentation paints no surface, so the card sits on the side
      // panel as on a sheet (the MAP-474 boards measured 33 and 17 there too).
      await page.emulateMedia({ reducedMotion: "reduce" });
      await widen(page);
      await page.evaluate(() => window.showDetails("sheet"));
      await settleLayout(page);
      const at = await closeInsets(page);
      assert(
        Math.abs(at.top - at.end) <= 1,
        `close button ${at.top} from the top and ${at.end} from the side`,
      );
    },
  ],
  [
    "right to left, the side panel's close button is as far from the top as from the left",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        document.getElementById("fixture").dir = "rtl";
      });
      await widen(page);
      await page.evaluate(() => window.showDetails("sheet"));
      await settleLayout(page);
      const at = await closeInsets(page);
      assert(
        Math.abs(at.top - at.end) <= 1,
        `close button ${at.top} from the top and ${at.end} from the left`,
      );
    },
  ],
  [
    "a bordered panel-presentation card keeps its header's 16 inside its border",
    async (page) => {
      // The guard for this fix's first version: the panel presentation draws
      // its own bordered card, and the side panel's 16 lies outside that
      // border. Topped up to nothing, the header met the border.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await widen(page);
      await page.evaluate(() => window.showDetails("panel"));
      await settleLayout(page);
      const at = await closeInsets(page);
      assert.equal(
        at.headerTop,
        16,
        "the header keeps its 16 inside the card's border",
      );
    },
  ],
  [
    "under a panel header, the details card keeps its own top padding",
    async (page) => {
      // A header sits between the grip and the content: the space above the
      // card is the header, not empty, so the card's 16 separates them.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.showDetails("sheet");
        window.setAdaptiveOptions({ panelDetent: "large" });
      });
      await settleLayout(page);
      const at = await closeInsets(page);
      assert.equal(
        at.headerTop,
        16,
        "the header keeps its own 16 under a panel header",
      );
    },
  ],
  [
    "under a grip, a hosted category browser's search field is as far from the sheet's top as from its side, plus the grip's clearance",
    async (page) => {
      // Decision 14: every part at the top of the panel keeps the grip's
      // 4px, not only the panel header and the details card. The browser's
      // search row padded 16 on every side under the grip's 16 row: the field
      // sat 33 from the sheet's top and 17 from its side, the details card's
      // GAP-083. The row tops its padding up to 16 instead of adding 16, and
      // keeps the grip's clearance: 21 against 17.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showBrowse();
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await browseInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert.equal(at.control, "search field");
      assert(
        Math.abs(at.start - 17) <= 1,
        `the search field starts ${at.start} in, not the panel's 1px border and the row's 16`,
      );
      assert(
        Math.abs(at.top - (at.start + 4)) <= 1,
        `search field ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "under a grip, a category browser with no search row keeps its first tiles as far down as in, plus the grip's clearance",
    async (page) => {
      // The tiles are the first row then, and the same rule holds: the
      // first tile sat 33 from the sheet's top and 17 from its side.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showBrowse({ search: false });
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await browseInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert.equal(at.control, "first tile");
      assert(
        Math.abs(at.start - 17) <= 1,
        `the first tile starts ${at.start} in`,
      );
      assert(
        Math.abs(at.top - (at.start + 4)) <= 1,
        `first tile ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "at 320 wide, a hosted category browser keeps the grip's target clear (WCAG 2.5.8)",
    async (page) => {
      // The tiles span the row, so one always sits under the grip's centre.
      // Flush under the grip — a row topped up to exactly 16 from the top,
      // with no clearance — they sat 8 from its centre, inside the circle.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        document.getElementById("fixture").style.width = "320px";
        window.showBrowse({ search: false });
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 320,
      );
      await settleLayout(page);
      assert.equal(
        (await browseInsets(page)).control,
        "first tile",
        "the category browser is drawn",
      );
      const inside = await insideGripCircle(page);
      assert.deepEqual(
        inside,
        [],
        `inside the grip's 24px circle: ${JSON.stringify(inside)}`,
      );
    },
  ],
  [
    "only a category browser's first row tops up: the tiles under its own search row keep their 16",
    async (page) => {
      // The guard for topping up the wrong row: under the search row the
      // tiles sit under that row, not under the grip.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showBrowse();
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await browseInsets(page);
      assert.equal(at.rows.length, 2, "a search row and the tiles");
      assert.equal(at.rows[1], 16, "the tiles keep their 16 under the row");
    },
  ],
  [
    "a single-detent sheet draws no grip, and the category browser keeps its own top padding",
    async (page) => {
      // The guard: with no grip the shell leaves nothing above the content,
      // so the search row keeps its 16 or the field meets the sheet's edge.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showBrowse();
        window.setAdaptiveOptions({
          panelDetents: ["medium"],
          panelDetent: "medium",
        });
      });
      await settleLayout(page);
      const at = await browseInsets(page);
      assert(!at.grip, "a single detent draws no grip");
      assert.equal(at.rows[0], 16, "the search row keeps its own 16");
      assert(
        Math.abs(at.top - at.start) <= 1,
        `search field ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "a hosted category browser's search field is as far from the side panel's top as from its side",
    async (page) => {
      // The side panel leaves 16 above its content (GAP-012): the field sat
      // 33 from its top and 17 from its side.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await widen(page);
      await page.evaluate(() => window.showBrowse());
      await settleLayout(page);
      const at = await browseInsets(page);
      assert(
        Math.abs(at.top - at.start) <= 1,
        `search field ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "right to left, the side panel's category browser has its search field as far from the top as from the right",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        document.getElementById("fixture").dir = "rtl";
      });
      await widen(page);
      await page.evaluate(() => window.showBrowse());
      await settleLayout(page);
      const at = await browseInsets(page);
      assert(
        Math.abs(at.top - at.start) <= 1,
        `search field ${at.top} from the top and ${at.start} from the right`,
      );
    },
  ],
  [
    "under a panel header holding the search, the category browser keeps its own 16 and the header's field keeps the grip's clearance",
    async (page) => {
      // Many products put the search field in the panel header now; the
      // browser then has no search row of its own, and its tiles sit under
      // the header, not the grip. The header itself starts 4 under the grip.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.showBrowse({ search: false });
        window.setAdaptiveOptions({ panelDetent: "large" });
      });
      await settleLayout(page);
      const at = await browseInsets(page);
      assert.equal(at.control, "first tile");
      assert.equal(at.rows[0], 16, "the tiles keep their own 16");
      const field = await page
        .getByRole("textbox", { name: "Search this sheet" })
        .evaluate((input) => {
          const panel = input.closest("aside").getBoundingClientRect();
          const header = input
            .closest("[data-kozmos-panel-header]")
            .getBoundingClientRect();
          const tile = document
            .querySelector(".kozmos-category-tile")
            .getBoundingClientRect();
          return {
            top:
              Math.round((input.getBoundingClientRect().top - panel.top) * 10) /
              10,
            tileUnderHeader: Math.round((tile.top - header.bottom) * 10) / 10,
          };
        });
      assert.equal(
        field.top,
        21,
        "the header's field: the border, the grip's 16 and its 4",
      );
      assert.equal(
        field.tileUnderHeader,
        16,
        "the first tile sits 16 under the header",
      );
    },
  ],
  [
    "under a grip, a hosted result list keeps its first result clear of the grip's target (WCAG 2.5.8)",
    async (page) => {
      // A result list brings no top padding of its own, so its first result
      // sat flush under the grip's row, 9 from the grip's centre: inside the
      // 24px circle its 16px target must keep clear. It keeps the grip's
      // clearance, as every part at the top of the panel does (decision 14).
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showResults();
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      assert.equal(
        await page.getByRole("region", { name: "Points of interest" }).count(),
        1,
        "the result list is drawn",
      );
      const inside = await insideGripCircle(page);
      assert.deepEqual(
        inside,
        [],
        `inside the grip's 24px circle: ${JSON.stringify(inside)}`,
      );
    },
  ],
  [
    "in a side panel, and with a single detent, a hosted result list adds nothing above its first result",
    async (page) => {
      // The guard: with no grip there is no clearance to keep, and the list
      // starts where the panel's content starts, as it always has.
      const listTop = () =>
        page
          .getByRole("region", { name: "Points of interest" })
          .evaluate((list) => ({
            padding: parseFloat(getComputedStyle(list).paddingTop),
            grip: !!list.closest("aside").querySelector('[role="slider"]'),
          }));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showResults();
        window.setAdaptiveOptions({
          panelDetents: ["medium"],
          panelDetent: "medium",
        });
      });
      await settleLayout(page);
      const single = await listTop();
      assert(!single.grip, "a single detent draws no grip");
      assert.equal(
        single.padding,
        0,
        "with a single detent the list adds nothing",
      );
      await page.evaluate(() => window.setAdaptiveOptions({}));
      await widen(page);
      const side = await listTop();
      assert(!side.grip, "a side panel draws no grip");
      assert.equal(side.padding, 0, "in a side panel the list adds nothing");
    },
  ],
  [
    "under a grip, a hosted route preview's first row is as far from the sheet's top as from its side, plus the grip's clearance",
    async (page) => {
      // Decision 14, as for the category browser: the route preview's header
      // padded 16 on every side under the grip's 16 row, so its destination
      // label sat 33 from the sheet's top and 17 from its side. The row tops
      // its padding up to 16 instead of adding 16, and keeps the grip's
      // clearance: 21 against 17.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showRoute();
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert.equal(at.label, "To");
      assert(
        Math.abs(at.start - 17) <= 1,
        `the destination label starts ${at.start} in, not the panel's 1px border and the row's 16`,
      );
      assert(
        Math.abs(at.top - (at.start + 4)) <= 1,
        `destination label ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "only a route preview's first row tops up: the options under it keep their 16",
    async (page) => {
      // The guard for topping up the wrong part: the options sit under the
      // destination row and its rule, not under the grip.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showRoute();
        window.setAdaptiveOptions({ panelDetent: "medium" });
      });
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert.equal(at.options, 16, "the options keep their 16 under the row");
    },
  ],
  [
    "a single-detent sheet draws no grip, and the route preview keeps its own top padding",
    async (page) => {
      // The guard: with no grip the shell leaves nothing above the content,
      // so the row keeps its 16 or the label meets the sheet's edge.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showRoute();
        window.setAdaptiveOptions({
          panelDetents: ["medium"],
          panelDetent: "medium",
        });
      });
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(!at.grip, "a single detent draws no grip");
      assert.equal(at.row, 16, "the destination row keeps its own 16");
      assert(
        Math.abs(at.top - at.start) <= 1,
        `destination label ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "a hosted route preview's first row is as far from the side panel's top as from its side",
    async (page) => {
      // The side panel leaves 16 above its content (GAP-012): the label sat
      // 33 from its top and 17 from its side.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await widen(page);
      await page.evaluate(() => window.showRoute());
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(!at.grip, "a side panel draws no grip");
      assert(
        Math.abs(at.top - at.start) <= 1,
        `destination label ${at.top} from the top and ${at.start} from the side`,
      );
    },
  ],
  [
    "right to left, the side panel's route preview has its first row as far from the top as from the right",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        document.getElementById("fixture").dir = "rtl";
      });
      await widen(page);
      await page.evaluate(() => window.showRoute());
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(
        Math.abs(at.top - at.start) <= 1,
        `destination label ${at.top} from the top and ${at.start} from the right`,
      );
    },
  ],
  [
    "under a panel header, the route preview keeps its own top padding",
    async (page) => {
      // A header sits between the grip and the content: the space above the
      // preview is the header, not empty, so the row's 16 separates them.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.showRoute();
        window.setAdaptiveOptions({ panelDetent: "large" });
      });
      await settleLayout(page);
      const at = await routeInsets(page);
      assert(at.grip, "this sheet draws its grip");
      assert.equal(
        at.row,
        16,
        "the destination row keeps its own 16 under a panel header",
      );
    },
  ],
];
try {
  for (const [name, test] of cases) {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 768 },
    });
    try {
      await page.setContent(
        `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture" style="width:390px;height:600px"></div></body></html>`,
      );
      await page.addScriptTag({ content: code });
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 390,
      );
      await settleLayout(page);
      await test(page);
      console.log(`PASS ${name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exitCode = failures ? 1 : 0;
