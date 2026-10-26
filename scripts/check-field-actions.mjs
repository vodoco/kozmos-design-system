/**
 * Combobox's and MultiSelect's clear and open buttons, on the built package in
 * a real browser (packages/react/tests/integration/field-actions-host.tsx):
 * a Combobox with a choice, a MultiSelect with one chip, and a narrow
 * MultiSelect whose chips wrap, in light and dark, touch and compact, left to
 * right and right to left.
 *
 * - Hovering a button leaves the field's edge drawn. In forced colours
 *   (Windows' high contrast) a hover fill is repainted in the page's Canvas,
 *   so a fill over the edge erases it: there the top, bottom and end edges
 *   by each button draw as at rest, on Combobox and MultiSelect. In normal
 *   colours MultiSelect's buttons sit inside the field's border, so the end
 *   edge by its open button draws as at rest once its chips wrap (Combobox's
 *   buttons cover its input's edge by design, decision 82).
 * - Focus: the field rings only for its input. With a button focused from
 *   the keyboard, the button draws its ring and the field draws none, on
 *   MultiSelect as on Combobox; with the input focused, the field rings. In
 *   forced colours, where a ring (a box-shadow) is dropped, the mark is the
 *   outline they paint for a transparent outline-none, and the same holds.
 * - MultiSelect's input draws no box of its own inside the field, at rest or
 *   focused, in normal or forced colours: the field draws the edge, and the
 *   outline that marks the input's focus. Forced colours paint a transparent
 *   outline-none, so an input that kept one at rest drew a 2px box inside the
 *   field. Combobox's input is its field: at rest it paints no outline.
 *
 * The edges are read as pixels from screenshots, at rest and hovered, each at
 * the pixel nearest the edge that differs most from the field's inside.
 * Chromium and Firefox emulate the forced palette; WebKit matches the media
 * query but repaints nothing (Safari has no forced colours), so there the
 * hover fill itself must stand aside. The input's box is read as pixels
 * inside the field where forced colours repaint, and in forced colours, in
 * every engine, as the outline they paint, from computed styles.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-field-actions.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("field-actions-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const failures = [];
let reads = 0;
// Set when forced colours match but nothing repaints (WebKit).
let noForcedPalette = false;

// Screenshots are decoded on a page of their own, through a canvas.
const decoder = await browser.newPage();
await decoder.setContent("<!doctype html><title>decode</title>");
const pixels = (png, points) =>
  decoder.evaluate(
    async ({ data, points }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return points.map(([x, y]) => [
        ...context.getImageData(x, y, 1, 1).data,
      ]);
    },
    { data: png.toString("base64"), points },
  );
const distance = (a, b) =>
  Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));

/** The part's field (the box with the border round its input) and buttons. */
const layout = (page, part) =>
  page.evaluate((part) => {
    const host = document.querySelector(`[data-part="${part}"]`);
    let field = host.querySelector('[role="combobox"]');
    while (field && parseFloat(getComputedStyle(field).borderTopWidth) === 0)
      field = field.parentElement;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const buttons = [...host.querySelectorAll("button[aria-label]")]
      .filter((b) => /^(Clear|Open|Close)/.test(b.getAttribute("aria-label")))
      .map((b) => ({ label: b.getAttribute("aria-label"), ...box(b) }));
    return {
      field: box(field),
      rtl: getComputedStyle(field).direction === "rtl",
      buttons,
    };
  }, part);

/**
 * For each button, the field's top, bottom and end edges beside it: the
 * pixel nearest each edge that differs most from the field's inside, read
 * from a screenshot of the field.
 */
async function edges(page, part, edgesWanted) {
  const { field, rtl, buttons } = await layout(page, part);
  const x0 = Math.floor(field.left) - 2;
  const y0 = Math.floor(field.top) - 2;
  const clip = {
    x: x0,
    y: y0,
    width: Math.ceil(field.right) + 2 - x0,
    height: Math.ceil(field.bottom) + 2 - y0,
  };
  const shot = await page.screenshot({ clip });
  // The field's outermost pixels: the first and last rows and the end column
  // whose centres lie inside its box. The edge is read from these inward,
  // never outside the field, whose page differs from its inside too.
  const top = Math.ceil(field.top - 0.5) - y0;
  const bottom = Math.floor(field.bottom - 0.5) - y0;
  const end = rtl
    ? Math.ceil(field.left - 0.5) - x0
    : Math.floor(field.right - 0.5) - x0;
  const inward = rtl ? 1 : -1;
  const spots = [];
  for (const button of buttons) {
    const cx = Math.round((button.left + button.right) / 2) - x0;
    const cy = Math.round((button.top + button.bottom) / 2) - y0;
    if (edgesWanted.includes("top"))
      spots.push({
        edge: "top",
        button: button.label,
        near: [0, 1, 2].map((d) => [cx, top + d]),
        inside: [cx, top + 8],
      });
    if (edgesWanted.includes("bottom"))
      spots.push({
        edge: "bottom",
        button: button.label,
        near: [0, 1, 2].map((d) => [cx, bottom - d]),
        inside: [cx, bottom - 8],
      });
    if (edgesWanted.includes("end"))
      spots.push({
        edge: "end",
        button: button.label,
        near: [0, 1, 2].map((d) => [end + inward * d, cy]),
        inside: [end + inward * 8, cy],
      });
  }
  const read = await pixels(
    shot,
    spots.flatMap((spot) => [...spot.near, spot.inside]),
  );
  let i = 0;
  return spots.map((spot) => {
    const near = spot.near.map(() => read[i++]);
    const inside = read[i++];
    return { ...spot, nearPixels: near, insidePixel: inside };
  });
}

/** The edges at rest, then with each button hovered: none may change. */
async function hoverKeepsEdges(page, part, edgesWanted, step, problems) {
  await page.mouse.move(1, 1);
  await settleLayout(page);
  const rest = await edges(page, part, edgesWanted);
  const { buttons } = await layout(page, part);
  if (buttons.length === 0) problems.push(`${step}: no buttons found`);
  for (const button of buttons) {
    await page
      .locator(`[data-part="${part}"] button[aria-label="${button.label}"]`)
      .hover();
    await settleLayout(page);
    const hovered = await edges(page, part, edgesWanted);
    for (const [index, spot] of rest.entries()) {
      if (spot.button !== button.label) continue;
      reads += 1;
      // The pixel that stands out most from the field's inside at rest is
      // the edge; it must be visible at rest, and the same when hovered.
      let pick = 0;
      for (const [n, pixel] of spot.nearPixels.entries())
        if (
          distance(pixel, spot.insidePixel) >
          distance(spot.nearPixels[pick], spot.insidePixel)
        )
          pick = n;
      const at = spot.nearPixels[pick];
      const contrast = distance(at, spot.insidePixel);
      if (contrast < 24) {
        problems.push(
          `${step}: ${part}'s ${spot.edge} edge by ${button.label} is not drawn at rest (${contrast} from the inside)`,
        );
        continue;
      }
      const now = hovered[index].nearPixels[pick];
      if (distance(now, at) > 2)
        problems.push(
          `${step}: hovering ${button.label} on ${part} changes the ${spot.edge} edge beside it from rgb(${at.slice(0, 3)}) to rgb(${now.slice(0, 3)})`,
        );
    }
  }
  await page.mouse.move(1, 1);
}

/**
 * The part's input draws no box of its own. MultiSelect's input sits inside
 * the field: the pixels 1 to 5px outside its top, bottom and end, inside the
 * field's border and short of its buttons, where forced colours paint a
 * transparent outline-none (2px wide, 2px out), must match the input's empty
 * inside. Read where the engine repaints forced colours; in forced colours,
 * in every engine, the input must also paint no outline. Combobox's input is
 * its field: only the outline is read, at rest.
 */
async function inputDrawsNoBox(page, part, state, mode, step, problems) {
  const at = await page.evaluate((part) => {
    const host = document.querySelector(`[data-part="${part}"]`);
    const input = host.querySelector('[role="combobox"]');
    let field = input;
    while (field && parseFloat(getComputedStyle(field).borderTopWidth) === 0)
      field = field.parentElement;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const f = getComputedStyle(field);
    const outer = box(field);
    const i = getComputedStyle(input);
    return {
      own: field === input,
      outline: i.outlineStyle === "none" ? 0 : parseFloat(i.outlineWidth),
      input: box(input),
      field: outer,
      inner: {
        left: outer.left + parseFloat(f.borderLeftWidth),
        top: outer.top + parseFloat(f.borderTopWidth),
        right: outer.right - parseFloat(f.borderRightWidth),
        bottom: outer.bottom - parseFloat(f.borderBottomWidth),
      },
      rtl: f.direction === "rtl",
      buttons: [...field.querySelectorAll("button[aria-label]")]
        .filter((b) => /^(Clear|Open|Close)/.test(b.getAttribute("aria-label")))
        .map(box),
    };
  }, part);
  if (mode.forced) {
    reads += 1;
    if (at.outline > 0)
      problems.push(
        at.own
          ? `${step}: ${part}'s input paints an outline ${at.outline}px ${state}, which forced colours draw round its edge`
          : `${step}: ${part}'s input paints an outline ${at.outline}px ${state}, which forced colours draw as a box of its own inside the field`,
      );
  }
  if (at.own || !mode.repaints) return;
  const { input, field, inner, rtl, buttons } = at;
  const x0 = Math.floor(field.left) - 2;
  const y0 = Math.floor(field.top) - 2;
  const shot = await page.screenshot({
    clip: {
      x: x0,
      y: y0,
      width: Math.ceil(field.right) + 2 - x0,
      height: Math.ceil(field.bottom) + 2 - y0,
    },
  });
  const cx = Math.round((input.left + input.right) / 2);
  const cy = Math.round((input.top + input.bottom) / 2);
  // The buttons' start: the end side stops short of them.
  const stop = rtl
    ? Math.max(...buttons.map((b) => b.right))
    : Math.min(...buttons.map((b) => b.left));
  const inField = ([x, y]) =>
    x >= Math.ceil(inner.left) &&
    x < Math.floor(inner.right) &&
    y >= Math.ceil(inner.top) &&
    y < Math.floor(inner.bottom) &&
    (rtl ? x >= Math.ceil(stop) : x < Math.floor(stop));
  // Each side's pixels, d px out from the input, kept inside the field.
  const sides = { top: [], bottom: [], end: [] };
  for (let d = 1; d <= 5; d += 1) {
    sides.top.push({ d, x: cx, y: Math.floor(input.top) - d });
    sides.bottom.push({ d, x: cx, y: Math.ceil(input.bottom) - 1 + d });
    sides.end.push({
      d,
      x: rtl ? Math.floor(input.left) - d : Math.ceil(input.right) - 1 + d,
      y: cy,
    });
  }
  const spots = Object.entries(sides).map(([side, points]) => ({
    side,
    points: points.filter(({ x, y }) => inField([x, y])),
  }));
  const read = await pixels(
    shot,
    [{ x: cx, y: cy }, ...spots.flatMap((spot) => spot.points)].map(
      ({ x, y }) => [x - x0, y - y0],
    ),
  );
  const inside = read[0];
  let n = 1;
  for (const spot of spots) {
    reads += 1;
    const values = read.slice(n, n + spot.points.length);
    n += spot.points.length;
    if (spot.points.length < 3) {
      problems.push(
        `${step}: ${part}'s input leaves ${spot.points.length}px inside the field at its ${spot.side}, too few to read`,
      );
      continue;
    }
    let worst = { contrast: -1 };
    for (const [k, pixel] of values.entries()) {
      const contrast = distance(pixel, inside);
      if (contrast > worst.contrast)
        worst = { contrast, pixel, d: spot.points[k].d };
    }
    if (worst.contrast >= 24)
      problems.push(
        `${step}: ${part}'s input draws a box of its own inside the field ${state}: its ${spot.side} edge reads rgb(${worst.pixel.slice(0, 3)}) ${worst.d}px out, ${worst.contrast} from the input's inside`,
      );
  }
}

/** A box-shadow's rings: layers with a spread and some colour. */
const ringed = (shadow) =>
  shadow !== "none" &&
  (shadow.match(/(?:rgba?|color)\([^)]*\)[^,]*/g) ?? []).some((layer) => {
    const spread = layer.match(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/);
    const alpha = layer.match(/rgba\([^)]*,\s*([\d.]+)\)/);
    return spread && Number(spread[4]) > 0 && (!alpha || Number(alpha[1]) > 0);
  });

/** The focus marks of the part's field and buttons now. */
const rings = (page, part) =>
  page.evaluate((part) => {
    const host = document.querySelector(`[data-part="${part}"]`);
    const input = host.querySelector('[role="combobox"]');
    let field = input;
    while (field && parseFloat(getComputedStyle(field).borderTopWidth) === 0)
      field = field.parentElement;
    const look = (el) => {
      const s = getComputedStyle(el);
      return {
        shadow: s.boxShadow,
        outline: s.outlineStyle === "none" ? 0 : parseFloat(s.outlineWidth),
      };
    };
    return {
      active: document.activeElement?.getAttribute("aria-label") ?? "input",
      field: look(field),
      buttons: [...host.querySelectorAll("button[aria-label]")]
        .filter((b) => /^(Clear|Open|Close)/.test(b.getAttribute("aria-label")))
        .map((b) => ({ label: b.getAttribute("aria-label"), ...look(b) })),
    };
  }, part);

async function focusRings(page, part, mode, step, problems) {
  const { forced } = mode;
  // Forced colours drop the ring and paint the transparent outline instead.
  const marked = (look) => (forced ? look.outline > 0 : ringed(look.shadow));
  const describe = (look) =>
    forced ? `an outline ${look.outline}px` : look.shadow;
  await page.locator(`[data-part="${part}"] [role="combobox"]`).focus();
  await settleLayout(page);
  const atInput = await rings(page, part);
  reads += 1;
  if (!marked(atInput.field))
    problems.push(`${step}: ${part}'s field draws no ring for its input`);
  // The field marks the input's focus; the input draws no box inside it.
  if (part !== "combobox")
    await inputDrawsNoBox(page, part, "focused", mode, step, problems);
  // The open button reads "Close options" while the list is open.
  for (const [label, name] of [
    ["clear", /^Clear /],
    ["open", /^(Open|Close) options$/],
  ]) {
    await page.keyboard.press("Tab");
    await settleLayout(page);
    const state = await rings(page, part);
    const focused = state.buttons.find((b) => b.label === state.active);
    reads += 2;
    if (!focused || !name.test(state.active)) {
      problems.push(
        `${step}: Tab reached "${state.active}" on ${part}, not its ${label} button`,
      );
      continue;
    }
    if (!marked(focused))
      problems.push(`${step}: ${part}'s ${focused.label} draws no ring`);
    if (marked(state.field))
      problems.push(
        `${step}: with ${focused.label} focused, ${part}'s field draws a ring too (${describe(state.field)})`,
      );
  }
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("Escape");
}

for (const forced of ["none", "active"])
  for (const theme of ["light", "dark"])
    for (const density of ["touch", "compact"])
      for (const dir of ["ltr", "rtl"]) {
        const name = `${forced === "active" ? "forced colours" : "normal colours"}, ${theme}, ${density}, ${dir}`;
        const page = await browser.newPage({
          viewport: { width: 480, height: 640 },
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const problems = [];
        try {
          await page.emulateMedia({ forcedColors: forced });
          await page.setContent(
            `<!doctype html><html lang="en"><head><title>Field actions</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
          );
          await page.addScriptTag({ content: code });
          await page.evaluate((mount) => window.fieldActions.mount(mount), {
            theme,
            density,
            dir,
          });
          await settleLayout(page);
          const matches = await page.evaluate(
            () => matchMedia("(forced-colors: active)").matches,
          );
          if (matches !== (forced === "active"))
            problems.push(`forced-colors matches ${matches}`);
          // Whether the engine repaints in the forced palette: WebKit
          // matches the media query and keeps the page's colours.
          const mode = {
            forced: forced === "active",
            repaints:
              forced !== "active" ||
              (await page.evaluate(() => {
                const probe = document.createElement("div");
                probe.style.color = "rgb(1, 2, 3)";
                document.body.append(probe);
                const color = getComputedStyle(probe).color;
                probe.remove();
                return color !== "rgb(1, 2, 3)";
              })),
          };
          if (mode.forced && !mode.repaints) noForcedPalette = true;
          for (const part of ["combobox", "multiselect", "multiselect-wrapped"])
            await inputDrawsNoBox(page, part, "at rest", mode, name, problems);
          if (forced === "active") {
            for (const part of [
              "combobox",
              "multiselect",
              "multiselect-wrapped",
            ])
              await hoverKeepsEdges(
                page,
                part,
                ["top", "bottom", "end"],
                name,
                problems,
              );
          } else {
            for (const part of ["multiselect", "multiselect-wrapped"])
              await hoverKeepsEdges(page, part, ["end"], name, problems);
          }
          for (const part of ["combobox", "multiselect"])
            await focusRings(page, part, mode, name, problems);
          if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
        } catch (error) {
          problems.push(String(error.message ?? error));
        } finally {
          await page.close();
        }
        if (problems.length) {
          failures.push(...problems.map((p) => (p.startsWith(name) ? p : `${name}: ${p}`)));
          console.error(`FAIL ${name}\n  ${problems.join("\n  ")}`);
        } else console.log(`PASS ${name}`);
      }

await browser.close();
if (failures.length) {
  console.error(
    `\nFAIL field actions: ${failures.length} problem(s) in ${reads} reads`,
  );
  process.exit(1);
}
console.log(
  `\nPASS field actions: ${reads} reads; hovering Combobox's and MultiSelect's clear and open leaves the field's top, bottom and end edges drawn in forced colours, and MultiSelect's end edge in normal colours with its chips wrapped; a focused button rings alone, on MultiSelect as on Combobox, and the field rings for its input; MultiSelect's input draws no box of its own inside the field, at rest or focused, and Combobox's paints no outline at rest${noForcedPalette ? " (forced colours repaint nothing in this engine: there the input's box was read from computed styles only)" : ""}; light and dark, touch and compact, both directions`,
);
