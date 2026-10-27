/**
 * The core defects the website found (apps/site/GAPS.md, the site's own
 * GAP-nn), on the built React package in a real browser:
 *
 * - GAP-09: a Button drawn on a link (`buttonVariants` on an anchor, the
 *   README's navigation pattern, and Pagination's page links) draws no
 *   underline at rest; the link variant still underlines on hover, and
 *   Kozmos's own `underline` utility still wins.
 *   `.kozmos-reset` opts the element out of the scoped preflight, which is
 *   what took the browser's underline off a plain link.
 * - GAP-40: MapView, framed or filling, is its own stacking context, so a
 *   MapOverlay's z-index 50 no longer draws over a sticky Navbar's (also 50)
 *   when the page scrolls the map under it; and inside AdaptiveMapShell
 *   whatever the map draws, at any z-index, stays under the shell's top bar,
 *   controls and panel. A fixed Backdrop rendered inside the map is held
 *   there too; portalled out, it covers the page, as the docs say to do.
 * - GAP-55: a Listbox's column is the list's width, so a long option ends in
 *   an ellipsis instead of widening the list until it scrolls sideways, in a
 *   group that is a grid of its own too (#411's option groups).
 * - GAP-68: BottomNavigation's bar is as tall as its items at both
 *   densities, 64 and 72, as Figma's is, and nothing spills out of it; its
 *   top line is drawn inside, over the items, as Figma's inside stroke is,
 *   and forced colours still draw it; its items sit above the bottom safe
 *   area.
 * - GAP-73: SplitButton's outline variant keeps its outline: the seam tints
 *   only the main part's inline-end side, in both directions.
 * - GAP-74: Tooltip's tail covers the body's border where the two meet, as
 *   Figma's tip overlaps the body by 1px: no line across the tail, on any
 *   side, light or dark. PopoverArrow, whose defaults match it, too.
 * - GAP-94: Text's muted colour follows a glass surface, as Kozmos's own
 *   muted text does (decision 48): the foreground on the glass, the muted
 *   grey on a solid surface or an opaque Card inside it and off it, and its
 *   own theme's muted in a nested provider of the other theme. Measured
 *   against the glass as drawn over every category fill, in both themes.
 *
 * The owned rules (GAP-09, 55, 94 and PopoverArrow's) are read with and without every @scope
 * rule, as check-owned-css.mjs reads its own: they must hold in a host whose
 * browser applies no @scope. The rest are utilities, read with them.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-site-gaps.mjs
 */
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("site-gaps.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const scopeFree = postcss.parse(css);
scopeFree.walkAtRules("scope", (rule) => rule.remove());

const THEMES = ["light", "dark"];
const FILLS = [
  "blue",
  "green",
  "navy",
  "orange",
  "pink",
  "red",
  "turquoise",
  "yellow",
];
const failures = [];
const notes = [];
let reads = 0;

/** Records one read: a failure when `ok` is false. */
function expect(ok, message) {
  reads += 1;
  if (!ok) failures.push(message);
}

/** The WCAG contrast ratio of two opaque sRGB colours, 0–255 channels. */
function contrast(one, two) {
  const luminance = ([r, g, b]) => {
    const linear = (c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** A colour with its alpha, laid over an opaque one: 0–255 channels. */
const over = ([r, g, b, a = 255], under) =>
  [r, g, b].map((channel, index) =>
    Math.round((channel * a + under[index] * (255 - a)) / 255),
  );

const near = (one, two, tolerance = 3) =>
  one.length >= 3 &&
  two.length >= 3 &&
  [0, 1, 2].every((index) => Math.abs(one[index] - two[index]) <= tolerance);

/**
 * Any computed colour as rgba channels, 0–255: every engine's notation
 * (rgb(), color(srgb …), color-mix results) through a 1px canvas.
 */
function channelsInPage(colours) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return colours.map((colour) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  });
}

/** The mean colour of a PNG the page draws, 0–255 channels. */
async function meanColour(page, png) {
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const sum = [0, 0, 0];
    for (let index = 0; index < pixels.length; index += 4)
      for (let channel = 0; channel < 3; channel += 1)
        sum[channel] += pixels[index + channel];
    const count = pixels.length / 4;
    return sum.map((value) => Math.round(value / count));
  }, png.toString("base64"));
}

async function render(page, view, ready) {
  await page.evaluate((name) => window.renderSiteGaps(name), view);
  await page.getByTestId(ready).first().waitFor();
  await settleLayout(page);
  // Entrances (the tooltips' zoom) run to their end before anything is read.
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );
  await settleLayout(page);
}

async function gap09(page, mode, theme) {
  const where = `${mode} ${theme} GAP-09`;
  const decoration = (part) =>
    page
      .getByTestId(`${theme}-gap09-${part}`)
      .evaluate((node) => getComputedStyle(node).textDecorationLine);
  for (const [part, name] of [
    ["default", "buttonVariants() on an <a>"],
    ["variants", 'buttonVariants({ variant: "outline" }) on an <a>'],
    ["link", "the link variant on an <a>, at rest"],
    ["page", "Pagination's page link"],
  ]) {
    const line = await decoration(part);
    expect(line === "none", `${where}: ${name} draws ${line}; expected none`);
  }
  await page.getByTestId(`${theme}-gap09-link`).hover();
  const hovered = await decoration("link");
  expect(
    hovered === "underline",
    `${where}: the link variant, hovered, draws ${hovered}; expected underline`,
  );
  await page.mouse.move(1, 1);
  // A caller's utility outweighs the owned rule wherever @scope applies.
  if (mode === "full") {
    const caller = await decoration("caller");
    expect(
      caller === "underline",
      `${where}: a caller's underline class draws ${caller}; expected underline`,
    );
  }
}

async function gap55(page, mode, theme) {
  // The Listbox as it draws its options, and a long option inside a group
  // that is a grid of its own (#411's option groups), so the truncation is
  // seen to hold whatever wraps the option.
  for (const [list, name] of [
    ["gap55", "a Listbox"],
    ["gap55-group", "a Listbox's group"],
  ]) {
    const where = `${mode} ${theme} GAP-55 ${name}`;
    const drawn = await page.getByTestId(`${theme}-${list}`).evaluate((box) => {
      const s = getComputedStyle(box);
      const rect = box.getBoundingClientRect();
      const inner =
        rect.right -
        parseFloat(s.borderRightWidth) -
        parseFloat(s.paddingRight);
      const options = [...box.querySelectorAll('[role="option"]')];
      const long = options.find(
        (option) =>
          option.querySelector(".kozmos-option-label").textContent.length > 40,
      );
      const label = long?.querySelector(".kozmos-option-label");
      const description = [
        ...box.querySelectorAll(".kozmos-option-description"),
      ].at(-1);
      return {
        sideways: box.scrollWidth - box.clientWidth,
        past: Math.max(
          ...options.map(
            (option) => option.getBoundingClientRect().right - inner,
          ),
        ),
        label: label
          ? {
              cut: label.scrollWidth > label.clientWidth,
              overflow: getComputedStyle(label).textOverflow,
            }
          : null,
        description: description
          ? { cut: description.scrollWidth > description.clientWidth }
          : null,
      };
    });
    expect(
      drawn.sideways <= 0,
      `${where}: the list scrolls ${drawn.sideways}px sideways; expected 0`,
    );
    expect(
      drawn.past <= 0.5,
      `${where}: an option runs ${drawn.past.toFixed(1)}px past the list's content box; expected none`,
    );
    expect(
      drawn.label?.cut === true && drawn.label.overflow === "ellipsis",
      `${where}: the long label ${JSON.stringify(drawn.label)}; expected it cut, with an ellipsis`,
    );
    expect(
      drawn.description?.cut === true,
      `${where}: the long description ${JSON.stringify(drawn.description)}; expected it cut`,
    );
  }
}

/**
 * A BottomNavigation as drawn: the bar's box and its items', the colour its
 * top line is drawn in (the subtle border role), and two pixels down the
 * selected item's middle: the bar's top row, and one inside the item, under
 * where the line is.
 */
async function barAsDrawn(page, id) {
  const bar = page.getByTestId(id);
  await bar.scrollIntoViewIfNeeded();
  await settleLayout(page);
  const drawn = await bar.evaluate((nav) => {
    const box = nav.getBoundingClientRect();
    const items = [
      ...nav.querySelectorAll('[data-slot="bottom-navigation-item"]'),
    ];
    const selected = nav.querySelector(
      '[data-slot="bottom-navigation-item"][data-selected]',
    );
    const probe = document.createElement("span");
    probe.style.borderTop = "1px solid var(--semantics-border-subtle)";
    nav.append(probe);
    const role = getComputedStyle(probe).borderTopColor;
    probe.remove();
    const s = selected.getBoundingClientRect();
    return {
      bar: { top: box.top, bottom: box.bottom, height: box.height },
      items: items.map((item) => {
        const r = item.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      }),
      role,
      x: s.left + s.width / 2,
    };
  });
  const pixel = async (y) =>
    meanColour(
      page,
      await page.screenshot({
        clip: { x: Math.floor(drawn.x), y: Math.floor(y), width: 1, height: 1 },
      }),
    );
  return {
    ...drawn,
    topRow: await pixel(drawn.bar.top),
    inside: await pixel(drawn.bar.top + 6),
  };
}

async function gap68(page, theme) {
  for (const density of ["compact", "default"]) {
    const where = `${theme} GAP-68 ${density}`;
    const drawn = await barAsDrawn(page, `${theme}-gap68-${density}`);
    // Figma's bar is its items' height, 64, with its 1px line drawn inside,
    // over the items; the default density's items are 72, so its bar is.
    const want = density === "compact" ? 64 : 72;
    expect(
      drawn.items.length === 3,
      `${where}: ${drawn.items.length} items; expected 3`,
    );
    for (const [index, item] of drawn.items.entries()) {
      expect(
        Math.abs(item.height - want) < 0.5,
        `${where}: item ${index} is ${item.height}px tall; expected ${want}`,
      );
      const above = drawn.bar.top - item.top;
      const below = item.bottom - drawn.bar.bottom;
      expect(
        above <= 0.01 && below <= 0.01,
        `${where}: item ${index} spills ${above.toFixed(1)}px above the bar and ${below.toFixed(1)}px below it; expected 0`,
      );
    }
    expect(
      Math.abs(drawn.bar.height - want) < 0.5,
      `${where}: the bar is ${drawn.bar.height}px tall, its items ${want}; expected the bar as tall as its items, its line drawn inside`,
    );
    const [role] = await page.evaluate(channelsInPage, [drawn.role]);
    expect(
      near(drawn.topRow, role, 12) && !near(drawn.topRow, drawn.inside, 12),
      `${where}: the bar's top row over the selected item draws rgb(${drawn.topRow.join(", ")}), the item under it rgb(${drawn.inside.join(", ")}); expected the line, rgb(${role.slice(0, 3).join(", ")}), drawn over the item`,
    );
    notes.push(`${where}: bar ${drawn.bar.height}px, items ${want}px`);
  }
}

/**
 * BottomNavigation keeps its items out of the bottom safe area, the iPhone's
 * home indicator: the bar pads its bottom by `env(safe-area-inset-bottom)`.
 * `pb-safe`, which it carried, compiled to nothing. Chromium can set the
 * inset (DevTools' Emulation.setSafeAreaInsetsOverride), so there the bar
 * is measured with a 34px one; elsewhere the rule that pads it is read.
 */
async function gap68SafeArea(browser, stylesheet) {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 2600 },
    reducedMotion: "reduce",
  });
  try {
    let inset = 0;
    if (browser.browserType().name() === "chromium") {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setSafeAreaInsetsOverride", {
        insets: { bottom: 34, bottomMax: 34 },
      });
      inset = 34;
    }
    await page.setContent(
      '<!doctype html><html><head></head><body style="margin:0"><div id="fixture"></div></body></html>',
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await render(page, "parts", "dark-gap94-page");
    for (const density of ["compact", "default"]) {
      const where = `GAP-68 ${density} safe area`;
      const drawn = await page
        .getByTestId(`light-gap68-${density}`)
        .evaluate((nav) => {
          const declared = [];
          const walk = (rules) => {
            for (const rule of rules) {
              if (rule.cssRules) walk(rule.cssRules);
              if (!rule.selectorText || !rule.style) continue;
              let matches = false;
              try {
                matches = nav.matches(rule.selectorText);
              } catch {
                matches = false;
              }
              if (!matches) continue;
              for (const property of ["padding-bottom", "padding-block-end"]) {
                const value = rule.style.getPropertyValue(property);
                if (value) declared.push(value);
              }
            }
          };
          for (const sheet of document.styleSheets) walk(sheet.cssRules);
          const box = nav.getBoundingClientRect();
          const item = nav
            .querySelector('[data-slot="bottom-navigation-item"]')
            .getBoundingClientRect();
          return {
            declared,
            bar: box.height,
            item: item.height,
            under: box.bottom - item.bottom,
          };
        });
      expect(
        drawn.declared.some((value) =>
          /env\(\s*safe-area-inset-bottom/.test(value),
        ),
        `${where}: no rule pads the bar's bottom by env(safe-area-inset-bottom) (it declares ${JSON.stringify(drawn.declared)})`,
      );
      if (inset)
        expect(
          Math.abs(drawn.under - inset) < 0.5 &&
            Math.abs(drawn.bar - drawn.item - inset) < 0.5,
          `${where}: with a ${inset}px inset the bar is ${drawn.bar}px over ${drawn.item}px items, ${drawn.under}px under them; expected the items ${inset}px above the bar's bottom`,
        );
    }
    if (inset)
      notes.push(
        `GAP-68 safe area: a ${inset}px bottom inset keeps the items ${inset}px above the bar's bottom`,
      );
  } finally {
    await page.close();
  }
}

/**
 * GAP-68 in forced colours (Windows' high contrast): the line is a border,
 * which the engine repaints in the system's colours, where a shadow or a
 * fill would vanish. WebKit matches the media query and repaints nothing,
 * so there the page's own colours are read, as above.
 */
async function gap68Forced(browser, stylesheet) {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 2600 },
    reducedMotion: "reduce",
  });
  try {
    await page.emulateMedia({ forcedColors: "active" });
    await page.setContent(
      '<!doctype html><html><head></head><body style="margin:0"><div id="fixture"></div></body></html>',
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await render(page, "parts", "dark-gap94-page");
    const repaints = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "rgb(1, 2, 3)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color !== "rgb(1, 2, 3)";
    });
    if (!repaints) {
      notes.push(
        "forced colours GAP-68: this engine keeps the page's colours; read in normal colours",
      );
      return;
    }
    for (const density of ["compact", "default"]) {
      const drawn = await barAsDrawn(page, `light-gap68-${density}`);
      const ratio = contrast(drawn.topRow, drawn.inside);
      expect(
        ratio >= 3,
        `forced colours GAP-68 ${density}: the bar's top row draws rgb(${drawn.topRow.join(", ")}) over the item's rgb(${drawn.inside.join(", ")}), ${ratio.toFixed(2)}:1; expected the line at 3:1 or more`,
      );
      notes.push(
        `forced colours GAP-68 ${density}: the line reads ${ratio.toFixed(2)}:1 on the item`,
      );
    }
  } finally {
    await page.close();
  }
}

async function gap73(page, theme) {
  for (const dir of ["ltr", "rtl"]) {
    for (const variant of ["outline", "default"]) {
      const where = `${theme} GAP-73 ${variant} ${dir}`;
      const raw = await page
        .getByTestId(`${theme}-gap73-${variant}-${dir}`)
        .evaluate((group) => {
          const [main, menu] = group.querySelectorAll("button");
          const sides = (node) => {
            const s = getComputedStyle(node);
            return {
              top: [s.borderTopWidth, s.borderTopColor],
              bottom: [s.borderBottomWidth, s.borderBottomColor],
              start: [s.borderInlineStartWidth, s.borderInlineStartColor],
              end: [s.borderInlineEndWidth, s.borderInlineEndColor],
              left: [s.borderLeftWidth, s.borderLeftColor],
              right: [s.borderRightWidth, s.borderRightColor],
              fill: ["", s.backgroundColor],
            };
          };
          return {
            main: sides(main),
            menu: sides(menu),
            mainIsLeft:
              main.getBoundingClientRect().left <
              menu.getBoundingClientRect().left,
          };
        });
      // Each side as [width, rgba channels]; the fill as its channels.
      const channels = async (sides) => {
        const keys = Object.keys(sides);
        const read = await page.evaluate(
          channelsInPage,
          keys.map((key) => sides[key][1]),
        );
        return Object.fromEntries(
          keys.map((key, index) => [
            key,
            key === "fill" ? read[index] : [sides[key][0], read[index]],
          ]),
        );
      };
      const drawn = {
        main: await channels(raw.main),
        menu: await channels(raw.menu),
        mainIsLeft: raw.mainIsLeft,
      };
      // The main part sits at the start, the chevron at the end.
      expect(
        drawn.mainIsLeft === (dir === "ltr"),
        `${where}: the main part is on the ${drawn.mainIsLeft ? "left" : "right"}`,
      );
      const seamSide = dir === "ltr" ? "right" : "left";
      const seam = drawn.main.end;
      expect(
        seam[0] === "1px" &&
          JSON.stringify(seam) === JSON.stringify(drawn.main[seamSide]),
        `${where}: the seam is ${JSON.stringify(seam)}, the ${seamSide} side ${JSON.stringify(drawn.main[seamSide])}; expected a 1px seam on the ${seamSide}`,
      );
      if (variant === "outline") {
        const outline = drawn.menu.top[1];
        for (const side of ["top", "bottom", "start"]) {
          const [width, colour] = drawn.main[side];
          expect(
            width === "1px" && near(colour, outline, 1) && colour[3] === 255,
            `${where}: the main part's ${side} border is ${width} rgba(${colour.join(", ")}); expected 1px in the outline's rgba(${outline.join(", ")})`,
          );
        }
        const edge = contrast(over(drawn.main.start[1], drawn.main.fill), [
          ...drawn.main.fill,
        ]);
        expect(
          edge >= 3,
          `${where}: the outline reads ${edge.toFixed(2)}:1 on the fill; expected 3:1 (WCAG 1.4.11)`,
        );
        if (dir === "ltr")
          notes.push(`${where}: outline ${edge.toFixed(2)}:1 on its fill`);
      } else {
        for (const side of ["top", "bottom", "start"])
          expect(
            drawn.main[side][0] === "0px",
            `${where}: the filled main part has a ${drawn.main[side][0]} ${side} border; expected none`,
          );
      }
    }
  }
}

async function gap74(page, mode, theme) {
  // Tooltip is drawn by utilities; PopoverArrow by an owned rule, so it is
  // read without @scope too.
  const tips = [
    ...(mode === "full"
      ? ["top", "bottom", "left", "right"].map((side) => [
          "Tooltip",
          side,
          side,
        ])
      : []),
    ["PopoverArrow", "top", "popover-top"],
    ["PopoverArrow", "bottom", "popover-bottom"],
  ];
  for (const [part, side, id] of tips) {
    const where = `${mode} ${theme} GAP-74 ${part} ${side}`;
    const body = page.getByTestId(`${theme}-gap74-${id}`);
    // In view, and placed again after any scroll: Radix repositions a
    // floating part a frame after the page moves, and the pixel is read
    // where the rectangles say.
    await body.scrollIntoViewIfNeeded();
    await settleLayout(page);
    const join = await body.evaluate((content, placed) => {
      const tail = content.querySelector("svg");
      if (!tail) return null;
      const s = getComputedStyle(content);
      const c = content.getBoundingClientRect();
      const t = tail.getBoundingClientRect();
      const border = parseFloat(s.borderTopWidth);
      // How far the tail reaches into the body past its outer edge, and a
      // pixel in the middle of the body's border band where they meet.
      const into = {
        top: c.bottom - t.top,
        bottom: t.bottom - c.top,
        left: c.right - t.left,
        right: t.right - c.left,
      }[placed];
      const centreX = t.left + t.width / 2;
      const centreY = t.top + t.height / 2;
      const pixel = {
        top: [centreX, c.bottom - border / 2],
        bottom: [centreX, c.top + border / 2],
        left: [c.right - border / 2, centreY],
        right: [c.left + border / 2, centreY],
      }[placed];
      return {
        side: content.getAttribute("data-side"),
        border,
        into,
        pixel,
        fill: s.backgroundColor,
        edge: s.borderTopColor,
      };
    }, side);
    expect(join !== null, `${where}: no tail drawn`);
    if (!join) continue;
    expect(
      join.side === side,
      `${where}: the tooltip opened on ${join.side}; the check reads ${side}`,
    );
    expect(
      join.into >= join.border - 0.01,
      `${where}: the tail reaches ${join.into.toFixed(2)}px into the body; expected the body's ${join.border}px border, so the two join`,
    );
    const [fill, edge] = await page.evaluate(channelsInPage, [
      join.fill,
      join.edge,
    ]);
    const png = await page.screenshot({
      clip: {
        x: Math.floor(join.pixel[0]),
        y: Math.floor(join.pixel[1]),
        width: 1,
        height: 1,
      },
    });
    const drawn = await meanColour(page, png);
    expect(
      near(drawn, fill, 8),
      `${where}: the join draws rgb(${drawn.join(", ")}) where the tail meets the body; expected the body's fill rgb(${fill.slice(0, 3).join(", ")}), not its border rgb(${edge.slice(0, 3).join(", ")})`,
    );
  }
}

async function gap94(page, mode, theme) {
  const where = `${mode} ${theme} GAP-94`;
  const colour = (id) =>
    page
      .getByTestId(`${theme}-gap94-${id}`)
      .evaluate((node) => getComputedStyle(node).color);
  const pageMuted = await colour("page");
  let worst = Infinity;
  let worstFill = "";
  for (const fill of FILLS) {
    const [text, owned, solid] = await Promise.all([
      colour(`${fill}-text`),
      colour(`${fill}-owned`),
      colour(`${fill}-solid`),
    ]);
    expect(
      text === owned,
      `${where} over ${fill}: a muted Text draws ${text} on the glass, where Kozmos's own muted text draws ${owned}; expected the same`,
    );
    expect(
      owned !== pageMuted,
      `${where} over ${fill}: the owned muted line is ${owned} on the glass, as off it; the glass says nothing`,
    );
    expect(
      solid === pageMuted,
      `${where} over ${fill}: a muted Text on a solid card inside the glass draws ${solid}; expected the muted ${pageMuted}`,
    );
    // Against the glass as drawn: what shows through, blurred and saturated,
    // under the glass's own tint.
    const patch = page.getByTestId(`${theme}-gap94-${fill}-patch`);
    const glass = await meanColour(page, await patch.screenshot());
    const [ink] = await page.evaluate(channelsInPage, [text]);
    const ratio = contrast(ink, glass);
    if (ratio < worst) {
      worst = ratio;
      worstFill = fill;
    }
  }
  expect(
    worst >= 4.5,
    `${where}: a muted Text on the glass reads ${worst.toFixed(2)}:1 at worst (over ${worstFill}); expected 4.5:1`,
  );
  // A provider of the other theme nested on the glass (DynamicIsland nests a
  // dark one on its capsule) takes its own muted colour, not the outer
  // theme's foreground, which the glass resolved where it was set; one of the
  // same theme still reads the glass. An opaque Card on the glass is a card
  // of its own: its muted Text is grey, as its CardDescription is.
  const [nestedOther, otherPage, nestedSame, glassOwned, cardText, cardDesc] =
    await Promise.all(
      [
        "nested-other",
        "other-page",
        "nested-same",
        "turquoise-owned",
        "card-text",
        "card-description",
      ].map(colour),
    );
  expect(
    nestedOther === otherPage,
    `${where}: a muted Text in a nested provider of the other theme, on the glass, draws ${nestedOther}; expected that theme's muted ${otherPage}`,
  );
  expect(
    nestedSame === glassOwned,
    `${where}: a muted Text in a nested provider of the same theme, on the glass, draws ${nestedSame}; expected the glass's ${glassOwned}`,
  );
  // CardDescription is a utility, gone without @scope; the Text is owned.
  expect(
    cardText === pageMuted && (mode !== "full" || cardDesc === pageMuted),
    `${where}: a muted Text on an opaque Card on the glass draws ${cardText}, its CardDescription ${cardDesc}; expected both the muted ${pageMuted}`,
  );
  notes.push(
    `${where}: a muted Text on the glass reads ${worst.toFixed(2)}:1 at worst, over ${worstFill}`,
  );
}

async function gap40(page) {
  // A window shorter than the page, so the page scrolls the maps under it.
  await page.setViewportSize({ width: 1200, height: 800 });
  await render(page, "stacking", "gap40-fill-overlay");
  for (const variant of ["framed", "fill"]) {
    const where = `GAP-40 ${variant} MapView`;
    const isolation = await page
      .getByTestId(`gap40-${variant}`)
      .evaluate((map) => getComputedStyle(map).isolation);
    expect(
      isolation === "isolate",
      `${where}: isolation ${isolation}; expected isolate`,
    );
    // Scroll the overlay under the sticky header, and look at what draws
    // where the two cross.
    const hit = await page.evaluate((id) => {
      const overlay = document.querySelector(`[data-testid="${id}"]`);
      const navbar = document.querySelector(".kozmos-navbar");
      if (!overlay || !navbar) return { missing: true };
      const bar = navbar.getBoundingClientRect();
      window.scrollBy(
        0,
        overlay.getBoundingClientRect().top - (bar.top + bar.height / 2) + 8,
      );
      const header = navbar.getBoundingClientRect();
      const box = overlay.getBoundingClientRect();
      const y = header.top + header.height / 2;
      const crossing = box.top < y && box.bottom > y && header.top === 0;
      const at = document.elementFromPoint(box.left + 20, y);
      return {
        crossing,
        header: Boolean(at?.closest(".kozmos-navbar")),
        overlay: Boolean(at?.closest(`[data-testid="${id}"]`)),
      };
    }, `gap40-${variant}-overlay`);
    expect(
      hit.crossing === true,
      `${where}: the overlay never crossed the stuck header (${JSON.stringify(hit)})`,
    );
    expect(
      hit.header === true && hit.overlay === false,
      `${where}: where the overlay crosses the sticky Navbar, the ${hit.overlay ? "overlay" : "page"} draws on top; expected the Navbar`,
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  // A fixed overlay rendered inside the map stacks inside it now, under the
  // page's sticky Navbar; portalled out of the map it covers the page, as
  // MapView's and Backdrop's docs say to render one.
  for (const [view, covers] of [
    ["stacking-portalled", true],
    ["stacking-trapped", false],
  ]) {
    await render(page, view, "gap40-backdrop");
    const at = await page.evaluate(() => {
      const navbar = document.querySelector(".kozmos-navbar");
      const r = navbar.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      return {
        backdrop: Boolean(hit?.closest('[data-testid="gap40-backdrop"]')),
        navbar: Boolean(hit?.closest(".kozmos-navbar")),
      };
    });
    expect(
      covers ? at.backdrop : at.navbar && !at.backdrop,
      covers
        ? `GAP-40: a Backdrop portalled out of the map does not cover the sticky Navbar (${JSON.stringify(at)}); expected it on top`
        : `GAP-40: a Backdrop rendered inside the map draws over the sticky Navbar (${JSON.stringify(at)}); expected it inside the map's stacking context, under the Navbar`,
    );
  }

  await render(page, "shell", "gap40-shell-panel");
  const isolation = await page
    .getByTestId("gap40-shell-map")
    .evaluate((map) => getComputedStyle(map).isolation);
  expect(
    isolation === "isolate",
    `GAP-40 shell: the map's isolation ${isolation}; expected isolate`,
  );
  for (const part of ["top-bar", "controls", "panel"]) {
    const on = await page
      .getByTestId(`gap40-shell-${part}`)
      .evaluate((node) => {
        const r = node.getBoundingClientRect();
        const at = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return {
          own: Boolean(at && node.contains(at)),
          drawn:
            at?.getAttribute("data-testid") ??
            at?.className?.toString().slice(0, 40) ??
            null,
        };
      });
    expect(
      on.own,
      `GAP-40 shell: over the shell's ${part}, the map's own layer draws (${on.drawn}); expected the ${part}`,
    );
  }
}

const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", scopeFree.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 2600 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<!doctype html><html><head></head><body style="margin:0"><div id="fixture"></div></body></html>',
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await render(page, "parts", "dark-gap94-page");
    for (const theme of THEMES) {
      await gap09(page, mode, theme);
      await gap55(page, mode, theme);
      await gap74(page, mode, theme);
      await gap94(page, mode, theme);
      if (mode === "full") {
        await gap68(page, theme);
        await gap73(page, theme);
      }
    }
    if (mode === "full") {
      await gap40(page);
      await gap68Forced(browser, stylesheet);
      await gap68SafeArea(browser, stylesheet);
    }
    expect(
      errors.length === 0,
      `${mode}: the page threw: ${errors.join("; ")}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}

for (const note of notes) console.log(`  ${note}`);
if (failures.length) {
  console.error(
    `FAIL site gaps (${engine}): ${failures.length} of ${reads} reads\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS site gaps (${engine}): ${reads} reads — GAP-09 a Button on a link draws no underline (the link variant on hover, Kozmos's own underline utility); GAP-40 MapView isolates, framed and filling, under a sticky Navbar and inside the shell, and a portalled Backdrop still covers the page; GAP-55 a Listbox's long options end in an ellipsis, in a group too; GAP-68 BottomNavigation's bar is its items' height at both densities, its line drawn inside, in forced colours too, its items above the bottom safe area; GAP-73 SplitButton's outline keeps its edge, the seam on the inline end; GAP-74 Tooltip's tail, and PopoverArrow's, covers the body's border on every side; GAP-94 a muted Text takes the glass's foreground, 4.5:1 or more over every category fill, light and dark, and its own theme's muted in a nested provider of the other theme or on an opaque Card — owned rules with and without @scope`,
);
