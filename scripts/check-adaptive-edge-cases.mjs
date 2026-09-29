import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

// axe-core, the version @axe-core/playwright runs, read once and put in a
// page once: AxeBuilder injects all of it again on every run, and a hundred
// or so runs on one page stalled WebKit for good.
const axeSource = fs.readFileSync(
  createRequire(
    createRequire(import.meta.url).resolve("@axe-core/playwright"),
  ).resolve("axe-core/axe.min.js"),
  "utf8",
);

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

// Decision 51: the hosted details card's header under a grip, the shell
// `width` wide, right to left when `dir` says so, with `toggles` before its
// close button (favourite and save unless told otherwise). Where the close
// button sits (closeInsets), and whether the header's buttons would clear the
// grip's 24px circle if the header sat flush under the grip's row. That is
// read off where they sit across the panel, which the header's top padding
// never moves: flush, their top edge would be the grip row's bottom edge.
async function detailsUnderGrip(page, width, { dir = "ltr", toggles } = {}) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(
    ({ width, dir, toggles }) => {
      const fixture = document.getElementById("fixture");
      fixture.style.width = `${width}px`;
      fixture.dir = dir;
      window.showDetails("sheet", { toggles });
      window.setAdaptiveOptions({ panelDetent: "medium" });
    },
    { width, dir, toggles },
  );
  await page.waitForFunction(
    (width) => window.adaptiveSnapshot?.mapBounds.width === width,
    width,
  );
  await settleLayout(page);
  const at = await closeInsets(page);
  const flush = await page.evaluate(() => {
    const grip = document
      .querySelector(".kozmos-map-sheet-handle")
      .getBoundingClientRect();
    const cx = grip.left + grip.width / 2;
    const cy = grip.top + grip.height / 2;
    return [...document.querySelectorAll(".kozmos-poi-header button")].map(
      (button) => {
        const r = button.getBoundingClientRect();
        const dx = Math.max(r.left - cx, 0, cx - r.right);
        return {
          name: button.getAttribute("aria-label"),
          d: Math.round(Math.hypot(dx, grip.bottom - cy) * 100) / 100,
        };
      },
    );
  });
  return { ...at, flushClears: flush.every(({ d }) => d >= 12), flush };
}

// axe's WCAG 2.5.8 check, alone, on the page as it is: the grip is the one
// undersized target, so its findings are the grip's.
async function targetSizeFindings(page) {
  if (!(await page.evaluate(() => "axe" in window)))
    await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const audit = await window.axe.run(document, {
      runOnly: { type: "rule", values: ["target-size"] },
      resultTypes: ["violations"],
    });
    return audit.violations.flatMap(({ nodes }) =>
      nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    );
  });
}

// The page every case starts from: the shell 390 wide and 600 tall, left to
// right, in the light theme. A case that tries several parts in turn starts
// each from it again.
async function fresh(page) {
  await page.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture" style="width:390px;height:600px"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.waitForFunction(
    () => window.adaptiveSnapshot?.mapBounds.width === 390,
  );
  await settleLayout(page);
}

// Decision 43: the parts the shell hosts at the top of its panel, each found
// by its own root. The category browser and the route preview paint a fill
// of their own standing alone; the result list and the details card's sheet
// presentation paint none anywhere.
const PARTS = {
  browse: 'section[aria-label="Browse categories"]',
  route: 'section[aria-label="Route preview"]',
  results: 'section[aria-label="Points of interest"]',
  details: '.kozmos-poi-detail[data-presentation="sheet"]',
};
const TRANSPARENT = "rgba(0, 0, 0, 0)";

// Hosts `part` as the panel's whole content, with these shell options.
async function showPart(page, part, options = {}) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(
    ({ part, options }) => {
      if (part === "browse") window.showBrowse();
      if (part === "route") window.showRoute();
      if (part === "results") window.showResults();
      if (part === "details") window.showDetails("sheet");
      if (part === "details-body") window.showDetails("sheet", { body: true });
      if (part === "gallery") window.showGallery();
      window.setAdaptiveOptions(options);
    },
    { part, options },
  );
  await settleLayout(page);
}

// The fill `part` paints behind itself and the colour of its text, as the
// browser computes them, beside the theme's own background and foreground
// resolved in the same place; and the panel's fill, when a shell hosts it.
// Counted first, as the details card is.
async function partFill(page, part) {
  const found = page.locator(PARTS[part]);
  assert.equal(await found.count(), 1, `the ${part} part is drawn once`);
  return found.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--primitives-colors-foreground-0)";
    probe.style.backgroundColor = "var(--primitives-colors-background-0)";
    element.append(probe);
    const theme = getComputedStyle(probe);
    const panel = element.closest("aside");
    const measured = {
      fill: getComputedStyle(element).backgroundColor,
      text: getComputedStyle(element).color,
      themeBackground: theme.backgroundColor,
      themeForeground: theme.color,
      panel: panel && getComputedStyle(panel).backgroundColor,
      presentation: panel
        ? document.querySelector("[data-panel-presentation]").dataset
            .panelPresentation
        : null,
    };
    probe.remove();
    return measured;
  });
}

// WCAG 2's relative luminance of an sRGB colour, and the contrast of two.
function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Decision 48: text a hosted part draws on glass reads at 4.5:1 over any
// map. Each part's title and the text that is muted elsewhere, found by its
// place in the part: for the details card's body, its summary's note, its
// gallery's position and the headings of its services and of a group of
// attributes, read with the sheet at its largest detent, where its content
// scrolls; and the gallery hosted on its own.
const GLASS_TEXT = {
  route: [
    'section[aria-label="Route preview"] header > p',
    'section[aria-label="Route preview"] header > h2',
    'section[aria-label="Route preview"] [role="group"] > p',
  ],
  details: [
    ".kozmos-poi-detail .kozmos-poi-location > p",
    ".kozmos-poi-detail .kozmos-poi-title",
  ],
  "details-body": [
    ".kozmos-poi-detail .kozmos-poi-gallery-position",
    '.kozmos-poi-detail section[aria-label="Service options"] > .kozmos-poi-section-heading',
    '.kozmos-poi-detail section[aria-label="Dietary options"] > .kozmos-poi-section-heading',
    ".kozmos-poi-detail .kozmos-poi-summary-text small",
  ],
  gallery: [".kozmos-poi-gallery-position"],
  browse: [
    'section[aria-label="Browse categories"] button[data-category-id="gates"] > .line-clamp-2',
  ],
};
const GLASS_DETENT = { "details-body": "large" };

// Decision 48 on every glass surface: the cards that float over the map, and
// each one's text that is muted elsewhere, by its words. The itinerary's
// captions are upper case on screen and by their words here.
const FLOATING_TEXT = {
  manoeuvre: ["58 m · Level 2"],
  "manoeuvre-open": [/^From$/i, "Harbour Coffee Co.", /^To$/i],
  "route-summary": ["201 m"],
  feedback: ["Tell us how it went."],
  "save-location": ["Terminal 2, Level 1"],
};

// The floating card's text by its words, found only inside that card.
function floatingText(page, card, words) {
  return page
    .locator(`[data-floating-card="${card}"]`)
    .getByText(words, { exact: true });
}

// The colour drawn at one point of the page, viewport pixels.
async function pixelAt(page, x, y) {
  const [r, g, b] = await photograph(page, { x, y, width: 1, height: 1 });
  return [r, g, b];
}

// The text colour of the one element `node` finds, beside the theme's muted
// colour resolved in the same place.
async function mutedColour(node) {
  assert.equal(await node.count(), 1, `${node} is drawn once`);
  return node.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--primitives-colors-foreground-400)";
    element.append(probe);
    const measured = {
      colour: getComputedStyle(element).color,
      muted: getComputedStyle(probe).color,
    };
    probe.remove();
    return measured;
  });
}

// The pixels drawn in `box` (viewport pixels), as flat RGBA: the page's
// photograph of it, read back through a canvas in the page.
async function photograph(page, box) {
  const photo = await page.screenshot({ clip: box });
  return page.evaluate(async (png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return Array.from(
      context.getImageData(0, 0, image.width, image.height).data,
    );
  }, photo.toString("base64"));
}

// The contrast of `target`'s text, a selector or a locator, with what is
// drawn behind it. The text is made transparent and its box photographed:
// the ratio of the text's own colour to the least contrasting pixel behind
// it, the worst a reader meets.
async function textContrast(page, target) {
  const node = typeof target === "string" ? page.locator(target) : target;
  assert.equal(await node.count(), 1, `${target} is drawn once`);
  await node.scrollIntoViewIfNeeded();
  const { colour, text } = await node.evaluate((element) => {
    const measured = {
      colour: getComputedStyle(element).color,
      text: element.textContent.trim(),
    };
    for (const e of [element, ...element.querySelectorAll("*")])
      e.style.setProperty("color", "transparent", "important");
    return measured;
  });
  const box = await node.boundingBox();
  const pixels = await photograph(page, box);
  await node.evaluate((element) => {
    for (const e of [element, ...element.querySelectorAll("*")])
      e.style.removeProperty("color");
  });
  const ink = colour
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  let lowest = Infinity;
  for (let i = 0; i < pixels.length; i += 4)
    lowest = Math.min(lowest, contrast(ink, pixels.slice(i, i + 3)));
  return { colour, text, lowest };
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
    "under a grip, at 390 and 430 wide, a hosted details card's close button is as far from the sheet's top as from its side: 17 and 17 (decision 51)",
    async (page) => {
      // GAP-083: the card's header padded 16 on every side, and the sheet's
      // grip row added 16 above it — the close button sat 33 from the top
      // and 17 from the side. The card then topped its header up to 16
      // rather than adding, and kept the grip's 4px clearance too: 21
      // against 17. Decision 51: the header takes the 4 back wherever its
      // buttons stay clear of the grip's target anyway (the next cases), and
      // on a phone they do: 17 and 17, the panel's 1px border and 16.
      for (const width of [390, 430]) {
        const at = await detailsUnderGrip(page, width);
        assert(at.grip, `${width}: this sheet draws its grip`);
        assert(
          Math.abs(at.top - 17) <= 0.5 && Math.abs(at.end - 17) <= 0.5,
          `${width} wide: the close button ${at.top} from the top and ${at.end} from the side`,
        );
        assert.equal(at.headerTop, 0, `${width}: the header's top padding`);
      }
    },
  ],
  [
    "where its buttons would meet the grip's circle, a hosted details card's header keeps the grip's clearance: 21 at 320 and 339, 17 from 340 (decision 51)",
    async (page) => {
      // The grip is a 16px row: an undersized target, so a 24px circle on
      // its centre must meet no other target (WCAG 2.5.8). Flush under the
      // row, the header's buttons sit 8 below that centre, and its favourite,
      // the first of three 44px buttons 6 apart 17 in from the end, reaches
      // within 12 of it until the panel is 340 wide: its start edge must sit
      // √(12² − 8²) ≈ 8.9 past the middle. Narrower, the header keeps the
      // 4px clearance, as every other part at the panel's top does
      // (decision 14), and the favourite meets the circle at a tangent at
      // most: at 320 wide it starts at the sheet's middle.
      for (const [width, top] of [
        [320, 21],
        [339, 21],
        [340, 17],
      ]) {
        const at = await detailsUnderGrip(page, width);
        assert(at.grip, `${width}: this sheet draws its grip`);
        assert(
          Math.abs(at.top - top) <= 0.5 && Math.abs(at.end - 17) <= 0.5,
          `${width} wide: the close button ${at.top} from the top (expected ${top}) and ${at.end} from the side`,
        );
        const inside = await insideGripCircle(page);
        assert.deepEqual(
          inside,
          [],
          `${width} wide, inside the grip's 24px circle: ${JSON.stringify(inside)}`,
        );
      }
    },
  ],
  [
    "at every width from 300 to 440, a hosted details card's header sits flush under the grip exactly where its buttons clear the grip's circle, and axe's target-size rule passes (WCAG 2.5.8)",
    async (page) => {
      // The rule, from what is drawn at each width rather than from the
      // widths above: flush wherever the buttons, flush, would stay 12 from
      // the grip's centre; the grip's clearance wherever they would not.
      // And at every width no target meets the circle, by this measure and
      // by axe's own.
      const wrong = [];
      for (let width = 300; width <= 440; width++) {
        const at = await detailsUnderGrip(page, width);
        const top = at.flushClears ? 17 : 21;
        if (!at.grip) wrong.push(`${width}: no grip`);
        if (Math.abs(at.top - top) > 0.5 || Math.abs(at.end - 17) > 0.5)
          wrong.push(
            `${width}: close ${at.top}/${at.end}, expected ${top}/17 (flush ${JSON.stringify(at.flush)})`,
          );
        const inside = await insideGripCircle(page);
        if (inside.length)
          wrong.push(`${width}: inside the circle ${JSON.stringify(inside)}`);
        const findings = await targetSizeFindings(page);
        if (findings.length)
          wrong.push(`${width}: axe target-size ${JSON.stringify(findings)}`);
      }
      assert.deepEqual(wrong, [], wrong.join("\n"));
    },
  ],
  [
    "with fewer buttons in its header, a hosted details card keeps equal insets on narrower sheets: two from 240 wide, one from 140 (decision 51)",
    async (page) => {
      // Two buttons, a toggle and close, reach the circle only under 240
      // wide; close alone only under 140. The header follows its own
      // buttons, not a phone's width.
      for (const [toggles, width, top] of [
        [["favourite"], 239, 21],
        [["favourite"], 240, 17],
        [[], 139, 21],
        [[], 140, 17],
      ]) {
        const at = await detailsUnderGrip(page, width, { toggles });
        const name = `${toggles.length + 1} buttons, ${width} wide`;
        assert(at.grip, `${name}: this sheet draws its grip`);
        assert(
          Math.abs(at.top - top) <= 0.5 && Math.abs(at.end - 17) <= 0.5,
          `${name}: the close button ${at.top} from the top (expected ${top}) and ${at.end} from the side`,
        );
        const inside = await insideGripCircle(page);
        assert.deepEqual(
          inside,
          [],
          `${name}, inside the grip's 24px circle: ${JSON.stringify(inside)}`,
        );
        assert.deepEqual(
          await targetSizeFindings(page),
          [],
          `${name}: axe target-size`,
        );
      }
    },
  ],
  [
    "flush under a grip or at a side panel's top, a hosted details card's header buttons draw their keyboard focus ring whole",
    async (page) => {
      // The card is a scroll box of its own, and so is the panel: both clip.
      // A ring drawn outside a button flush against the card's top lost its
      // top edge there — in a side panel since the header first topped up
      // (GAP-083), and under a grip once it sits flush (decision 51). The
      // ring's colour along the middle of the button's top edge, where the
      // corners do not curve, must match its bottom edge's.
      const cut = [];
      for (const [layout, width] of [
        ["under a grip", 390],
        ["under a grip, keeping the clearance", 320],
        ["in a side panel", 1024],
      ]) {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.evaluate((width) => {
          document.getElementById("fixture").style.width = `${width}px`;
          window.showDetails("sheet");
          window.setAdaptiveOptions({ panelDetent: "medium" });
        }, width);
        await page.waitForFunction(
          (width) => window.adaptiveSnapshot?.mapBounds.width === width,
          width,
        );
        await settleLayout(page);
        await page.evaluate(() => document.activeElement?.blur());
        for (let tab = 0; tab < 40; tab++) {
          await page.keyboard.press("Tab");
          if (
            await page.evaluate(
              () =>
                document.activeElement?.getAttribute("aria-label") ===
                "Close details",
            )
          )
            break;
        }
        await settleLayout(page);
        const button = await page.evaluate(() => {
          const focused = document.activeElement;
          const r = focused.getBoundingClientRect();
          return {
            name: focused.getAttribute("aria-label"),
            visible: focused.matches(":focus-visible"),
            left: Math.round(r.left),
            top: Math.round(r.top),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
        });
        assert.equal(button.name, "Close details", `${layout}: focus`);
        assert(button.visible, `${layout}: the close button shows its focus`);
        // The theme's blue: the ring, and nothing else drawn there.
        const ring = async (y) => {
          const pixels = await photograph(page, {
            x: button.left + 18,
            y,
            width: button.width - 36,
            height: 9,
          });
          let blue = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i + 2] > 150 && pixels[i] < 110) blue++;
          return blue;
        };
        const top = await ring(button.top - 5);
        const bottom = await ring(button.top + button.height - 4);
        if (!bottom || Math.abs(top - bottom) > bottom / 4)
          cut.push(
            `${layout}: ${top} ring pixels along the top edge, ${bottom} along the bottom`,
          );
      }
      assert.deepEqual(cut, [], cut.join("; "));
    },
  ],
  [
    "right to left, under a grip, a hosted details card's close button is 17 from the top and 17 from the left at 390, and keeps the grip's clearance at 320 (decision 51)",
    async (page) => {
      // The header's buttons stand at its inline end, the left right to
      // left; the grip's circle is the same either way.
      for (const [width, top] of [
        [390, 17],
        [340, 17],
        [339, 21],
        [320, 21],
      ]) {
        const at = await detailsUnderGrip(page, width, { dir: "rtl" });
        assert(at.grip, `${width}: this sheet draws its grip`);
        assert(
          Math.abs(at.top - top) <= 0.5 && Math.abs(at.end - 17) <= 0.5,
          `right to left, ${width} wide: the close button ${at.top} from the top (expected ${top}) and ${at.end} from the left`,
        );
        const inside = await insideGripCircle(page);
        assert.deepEqual(
          inside,
          [],
          `right to left, ${width} wide, inside the grip's 24px circle: ${JSON.stringify(inside)}`,
        );
        assert.deepEqual(
          await targetSizeFindings(page),
          [],
          `right to left, ${width} wide: axe target-size`,
        );
      }
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
  [
    "on a glass sheet, a hosted part paints no fill of its own, and its text follows the theme (decision 43)",
    async (page) => {
      // Decision 43: in the shell's panel, the panel's surface is the one
      // surface. The category browser and the route preview filled their
      // box with the background colour wherever they were, so on a glass
      // sheet each was an opaque block from under the grip's row down. The
      // result list and the details card's sheet presentation paint none
      // already. Light and dark: the text keeps the theme's foreground.
      const painted = [];
      const text = [];
      for (const theme of ["light", "dark"]) {
        for (const part of Object.keys(PARTS)) {
          await fresh(page);
          await page.evaluate((t) => (document.body.dataset.theme = t), theme);
          await showPart(page, part, {
            panelSurface: "glass",
            panelDetent: "medium",
          });
          const at = await partFill(page, part);
          assert.equal(at.presentation, "bottom", `${part}: not the sheet`);
          assert.match(
            at.panel,
            /^rgba\(.+, 0?\.\d+\)$/,
            `${part}: the sheet is not glass (${at.panel})`,
          );
          if (at.fill !== TRANSPARENT)
            painted.push(`${part} ${theme} ${at.fill}`);
          if (part in { browse: 1, route: 1 } && at.text !== at.themeForeground)
            text.push(`${part} ${theme} ${at.text}, not ${at.themeForeground}`);
        }
      }
      assert.deepEqual(
        painted,
        [],
        `a fill of their own on a glass sheet: ${painted.join("; ")}`,
      );
      assert.deepEqual(
        text,
        [],
        `text off the theme on a glass sheet: ${text.join("; ")}`,
      );
    },
  ],
  [
    "on a solid sheet, a hosted part paints no fill of its own, and the sheet's fill shows as before",
    async (page) => {
      // The sheet's solid fill is the background colour the parts painted,
      // so a part that paints none looks as it did.
      const painted = [];
      for (const part of Object.keys(PARTS)) {
        await fresh(page);
        await showPart(page, part, { panelDetent: "medium" });
        const at = await partFill(page, part);
        assert.equal(at.presentation, "bottom", `${part}: not the sheet`);
        assert.equal(
          at.panel,
          at.themeBackground,
          `${part}: the solid sheet is not the background colour`,
        );
        if (at.fill !== TRANSPARENT) painted.push(`${part} ${at.fill}`);
      }
      assert.deepEqual(
        painted,
        [],
        `a fill of their own on a solid sheet: ${painted.join("; ")}`,
      );
    },
  ],
  [
    "in a side panel, glass or solid, a hosted part paints no fill of its own",
    async (page) => {
      // A side panel's surface can be glass too: the same opaque block
      // stood in it. On a solid side panel a part that paints none looks as
      // it did, its fill being the panel's.
      const painted = [];
      for (const surface of ["glass", "solid"]) {
        for (const part of Object.keys(PARTS)) {
          await fresh(page);
          await showPart(page, part, { panelSurface: surface });
          await widen(page);
          const at = await partFill(page, part);
          assert.equal(at.presentation, "side", `${part}: not the side panel`);
          if (at.fill !== TRANSPARENT)
            painted.push(`${part} ${surface} ${at.fill}`);
        }
      }
      assert.deepEqual(
        painted,
        [],
        `a fill of their own in a side panel: ${painted.join("; ")}`,
      );
    },
  ],
  [
    "standing alone, the category browser and the route preview keep their own fill, light and dark",
    async (page) => {
      // The guard: outside a shell nothing says a surface is there, and a
      // part keeps its fill, the theme's background, under the theme's text.
      const wrong = [];
      for (const theme of ["light", "dark"]) {
        for (const part of ["browse", "route"]) {
          await fresh(page);
          await page.evaluate((t) => (document.body.dataset.theme = t), theme);
          await page.evaluate((p) => window.showStandalone(p), part);
          await page.waitForSelector(`[data-standalone="${part}"] section`);
          await settleLayout(page);
          const at = await partFill(page, part);
          assert.equal(at.panel, null, `${part}: hosted in a panel`);
          if (at.fill !== at.themeBackground)
            wrong.push(`${part} ${theme} fill ${at.fill}`);
          if (at.text !== at.themeForeground)
            wrong.push(`${part} ${theme} text ${at.text}`);
        }
      }
      assert.deepEqual(wrong, [], `standing alone: ${wrong.join("; ")}`);
    },
  ],
  [
    "on a glass sheet over a saturated map, a hosted part's text reads at 4.5:1 or more, light and dark (decision 48)",
    async (page) => {
      // Decision 48: on glass, text that is muted elsewhere takes the
      // foreground colour, so it passes 4.5:1 over any map. Muted over the
      // glass stories' saturated rooms, the route preview's "To" and the
      // details card's level line read about 3.7:1, light and dark. The
      // glass itself stays as it is. Each text is read over each room.
      const low = [];
      for (const theme of ["light", "dark"]) {
        for (const amberFirst of [false, true]) {
          const room = amberFirst ? "amber" : "blue";
          for (const [part, selectors] of Object.entries(GLASS_TEXT)) {
            await fresh(page);
            await page.evaluate(
              (t) => (document.body.dataset.theme = t),
              theme,
            );
            await page.evaluate((a) => window.showSaturatedMap(a), amberFirst);
            await showPart(page, part, {
              panelSurface: "glass",
              panelDetent: GLASS_DETENT[part] ?? "medium",
            });
            for (const selector of selectors) {
              const at = await textContrast(page, selector);
              if (at.lowest < 4.5)
                low.push(
                  `${part} ${theme} over ${room} "${at.text}" ${at.lowest.toFixed(2)}:1 in ${at.colour}`,
                );
            }
          }
        }
      }
      assert.deepEqual(low, [], `below 4.5:1 on glass: ${low.join("; ")}`);
    },
  ],
  [
    "on a solid sheet and standing alone, text that is muted keeps its muted colour",
    async (page) => {
      // The guard: only glass turns muted text to ink. On a solid sheet, and
      // with no surface around it, it keeps the theme's muted colour; and so
      // does the details card's bordered presentation on a glass sheet, a
      // card of its own that its text sits on.
      const wrong = [];
      for (const [part, selector] of [
        ["route", GLASS_TEXT.route[0]],
        ["details", GLASS_TEXT.details[0]],
        ...GLASS_TEXT["details-body"].map((selector) => [
          "details-body",
          selector,
        ]),
        ["gallery", GLASS_TEXT.gallery[0]],
      ]) {
        await fresh(page);
        await showPart(page, part, { panelDetent: "medium" });
        const at = await mutedColour(page.locator(selector));
        if (at.colour !== at.muted)
          wrong.push(`${part} on a solid sheet ${selector} ${at.colour}`);
      }
      await fresh(page);
      await page.evaluate(() => {
        window.showDetails("panel", { body: true });
        window.setAdaptiveOptions({
          panelSurface: "glass",
          panelDetent: "medium",
        });
      });
      await settleLayout(page);
      for (const selector of [
        GLASS_TEXT.details[0],
        ...GLASS_TEXT["details-body"],
      ]) {
        const at = await mutedColour(page.locator(selector));
        if (at.colour !== at.muted)
          wrong.push(
            `the bordered card on a glass sheet ${selector} ${at.colour}`,
          );
      }
      await fresh(page);
      await page.evaluate(() => window.showStandalone("route"));
      await page.waitForSelector('[data-standalone="route"] section');
      const alone = await mutedColour(
        page.locator(`[data-standalone="route"] header > p`),
      );
      if (alone.colour !== alone.muted)
        wrong.push(`route standing alone ${alone.colour}`);
      assert.deepEqual(wrong, [], `not muted: ${wrong.join("; ")}`);
    },
  ],
  [
    "in the shell's panel, glass or solid, the details card's summary strip paints no fill of its own; on its own it keeps it (decision 43)",
    async (page) => {
      // The strip is the one band inside the card's sheet presentation that
      // painted a fill: an opaque band across a glass sheet. On a solid one
      // its fill was the sheet's own colour.
      const strip = (root) =>
        page.locator(`${root} .kozmos-poi-summary`).evaluate((element) => {
          const probe = document.createElement("span");
          probe.style.backgroundColor = "var(--primitives-colors-background-0)";
          element.append(probe);
          const measured = {
            fill: getComputedStyle(element).backgroundColor,
            theme: getComputedStyle(probe).backgroundColor,
          };
          probe.remove();
          return measured;
        });
      const wrong = [];
      for (const surface of ["glass", "solid"]) {
        await fresh(page);
        await showPart(page, "details-body", {
          panelSurface: surface,
          panelDetent: "large",
        });
        const at = await strip(".kozmos-poi-detail");
        if (at.fill !== TRANSPARENT)
          wrong.push(`on a ${surface} sheet ${at.fill}`);
      }
      await fresh(page);
      await page.evaluate(() => window.showStandalone("details"));
      await page.waitForSelector(
        '[data-standalone="details"] .kozmos-poi-summary',
      );
      const alone = await strip('[data-standalone="details"]');
      if (alone.fill !== alone.theme)
        wrong.push(`standing alone ${alone.fill}, not ${alone.theme}`);
      assert.deepEqual(wrong, [], `the summary strip: ${wrong.join("; ")}`);
    },
  ],
  [
    "on glass over a saturated map, a floating card's text that is muted elsewhere reads at 4.5:1 or more, light and dark (decision 48)",
    async (page) => {
      // Decision 48 on every glass surface: the manoeuvre, its itinerary,
      // the route summary, the feedback card and the save-location card,
      // each over each room.
      const low = [];
      for (const theme of ["light", "dark"]) {
        for (const amberFirst of [false, true]) {
          const room = amberFirst ? "amber" : "blue";
          for (const [card, texts] of Object.entries(FLOATING_TEXT)) {
            await fresh(page);
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.evaluate(
              (t) => (document.body.dataset.theme = t),
              theme,
            );
            await page.evaluate(
              ({ card, amberFirst }) =>
                window.showFloatingCard(card, "glass", amberFirst),
              { card, amberFirst },
            );
            await page.waitForSelector(`[data-floating-card="${card}"] > *`);
            await settleLayout(page);
            for (const words of texts) {
              const at = await textContrast(
                page,
                floatingText(page, card, words),
              );
              if (at.lowest < 4.5)
                low.push(
                  `${card} ${theme} over ${room} "${at.text}" ${at.lowest.toFixed(2)}:1 in ${at.colour}`,
                );
            }
          }
        }
      }
      assert.deepEqual(low, [], `below 4.5:1 on glass: ${low.join("; ")}`);
    },
  ],
  [
    "on a solid card, a floating card's text that is muted keeps its muted colour",
    async (page) => {
      // The guard: a solid card draws its muted text muted, as before.
      const wrong = [];
      for (const [card, texts] of Object.entries(FLOATING_TEXT)) {
        await fresh(page);
        await page.evaluate(
          (card) => window.showFloatingCard(card, "solid"),
          card,
        );
        await page.waitForSelector(`[data-floating-card="${card}"] > *`);
        await settleLayout(page);
        for (const words of texts) {
          const at = await mutedColour(floatingText(page, card, words));
          if (at.colour !== at.muted)
            wrong.push(`${card} "${words}" ${at.colour}, not ${at.muted}`);
        }
      }
      assert.deepEqual(wrong, [], `not muted: ${wrong.join("; ")}`);
    },
  ],
  [
    "on a glass sheet, the selected route option is as opaque as the others: its tint sits on the background colour",
    async (page) => {
      // The selected option's 5% tint lay over nothing, so on glass the map
      // showed through it while the others stood opaque. Read 6px inside
      // its start edge, halfway down, clear of its text and its edge: on
      // glass it must draw what it draws on a solid sheet, the tint on the
      // background colour.
      const sample = async (theme, surface) => {
        await fresh(page);
        await page.evaluate((t) => (document.body.dataset.theme = t), theme);
        await page.evaluate(() => window.showSaturatedMap());
        await showPart(page, "route", {
          panelSurface: surface,
          panelDetent: "medium",
        });
        const option = page.locator('button[data-route-id="quickest"]');
        await option.scrollIntoViewIfNeeded();
        const box = await option.boundingBox();
        return pixelAt(
          page,
          Math.round(box.x + 6),
          Math.round(box.y + box.height / 2),
        );
      };
      const wrong = [];
      for (const theme of ["light", "dark"]) {
        const solid = await sample(theme, "solid");
        const glass = await sample(theme, "glass");
        if (glass.some((channel, i) => Math.abs(channel - solid[i]) > 4))
          wrong.push(
            `${theme}: on glass rgb(${glass.join(", ")}), on a solid sheet rgb(${solid.join(", ")})`,
          );
      }
      assert.deepEqual(wrong, [], `see-through: ${wrong.join("; ")}`);
    },
  ],
];
try {
  for (const [name, test] of cases) {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 768 },
    });
    try {
      await fresh(page);
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
