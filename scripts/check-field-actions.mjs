/**
 * The buttons at a field's end, on the built package in a real browser
 * (packages/react/tests/integration/field-actions-host.tsx): Combobox's and
 * MultiSelect's clear and open, on a Combobox with a choice, a MultiSelect
 * with one chip, and a narrow MultiSelect whose chips wrap; Input's toggle
 * action, PasswordInput's reveal, DatePicker's and TimePicker's trigger; and
 * a disabled Combobox and PasswordInput. In light and dark, touch and
 * compact, left to right and right to left.
 *
 * - Hovered, each button draws its fill inside itself (decision 164): its
 *   ::before, 4 in from the button's edges (the field's 1px edge and a 3
 *   gap), so 36 across in touch and 32 in compact, its corners the field's
 *   less 4, also with the control radius set to 8 on the provider. The
 *   button itself fills nothing; at rest, disabled, and in forced colours
 *   there is no fill; the button stays as tall as the field. Read from
 *   computed styles, and as pixels: hovered, the fill's middle is
 *   background-100, while the 4px band round it and the fill's corner
 *   pixels draw as at rest.
 * - Hovering a button leaves the field's top, bottom and end edges drawn as
 *   at rest, in normal and in forced colours (Windows' high contrast), where
 *   a hover fill is repainted in the page's Canvas and erased the edge it
 *   lay over.
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
 * every engine, as the outline they paint, from computed styles. Firefox
 * keeps its own date picker (DatePicker, decision 105), so there DatePicker
 * has no button to read.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-field-actions.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout as settleFrames,
} from "./lib/built-react-fixture.mjs";

/** Lays out, and lets every colour easing in or out finish. */
async function settleLayout(page) {
  await settleFrames(page);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}

const { code, css } = await buildReactFixture("field-actions-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const failures = [];
let reads = 0;
/** The parts with buttons at their field's end, and the disabled ones. */
const PARTS = [
  "combobox",
  "multiselect",
  "multiselect-wrapped",
  "input",
  "password",
  "date",
  "time",
];
const DISABLED = ["combobox-disabled", "password-disabled"];
// Set when DatePicker keeps the browser's own picker (Firefox).
let ownDatePicker = false;
/** Each fill's measured size and corners, for the summary. */
const fills = new Set();

/** The control radius on the provider, as a product's token override sets it. */
const setControlRadius = (page, value) =>
  page.evaluate((value) => {
    const root = document.querySelector("[data-kozmos-root]");
    if (value === null) root.style.removeProperty("--semantics-radius-control");
    else root.style.setProperty("--semantics-radius-control", String(value));
  }, value);
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
      return points.map(([x, y]) => [...context.getImageData(x, y, 1, 1).data]);
    },
    { data: png.toString("base64"), points },
  );
const distance = (a, b) =>
  Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));

/** The buttons at a field's end: Input's, PasswordInput's, DatePicker's and
 * TimePicker's, and Combobox's and MultiSelect's (field-actions.ts). */
const BUTTONS = "button.kozmos-field-action, button.kozmos-combobox-action";

/** The part's field (the box with the border round its input) and buttons. */
const layout = (page, part) =>
  page.evaluate(
    ({ part, BUTTONS }) => {
      const host = document.querySelector(`[data-part="${part}"]`);
      let field =
        host.querySelector('[role="combobox"]') ?? host.querySelector("input");
      while (field && parseFloat(getComputedStyle(field).borderTopWidth) === 0)
        field = field.parentElement;
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      const buttons = [...host.querySelectorAll(BUTTONS)].map((b) => ({
        label: b.getAttribute("aria-label"),
        ...box(b),
      }));
      return {
        field: box(field),
        rtl: getComputedStyle(field).direction === "rtl",
        buttons,
      };
    },
    { part, BUTTONS },
  );

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

/** The control height each density gives a field and its buttons. */
const FIELD_HEIGHT = { touch: 44, compact: 40 };
const rgb = (colour) =>
  colour
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
const clear = (colour) => /^transparent$|,\s*0\)$/.test(colour);

/** A colour a variable resolves to, inside the provider. */
const resolve = (page, variable) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${variable})`;
    document.querySelector("[data-kozmos-root]").append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, variable);

/** A button's box, its field's corner, and its fill (its ::before), now. */
const fillState = (page, part, index) =>
  page.evaluate(
    ({ part, index, BUTTONS }) => {
      const host = document.querySelector(`[data-part="${part}"]`);
      const button = host.querySelectorAll(BUTTONS)[index];
      let field =
        host.querySelector('[role="combobox"]') ?? host.querySelector("input");
      while (field && parseFloat(getComputedStyle(field).borderTopWidth) === 0)
        field = field.parentElement;
      const f = getComputedStyle(field);
      const s = getComputedStyle(button, "::before");
      const r = button.getBoundingClientRect();
      const drawn = s.content !== "none" && s.content !== "normal";
      return {
        label: button.getAttribute("aria-label"),
        hovered: button.matches(":hover"),
        disabled: button.disabled,
        box: { left: r.left, top: r.top, width: r.width, height: r.height },
        own: getComputedStyle(button).backgroundColor,
        fieldRadius: parseFloat(
          f.direction === "rtl"
            ? f.borderTopLeftRadius
            : f.borderTopRightRadius,
        ),
        fill: drawn
          ? {
              background: s.backgroundColor,
              position: s.position,
              width: parseFloat(s.width),
              height: parseFloat(s.height),
              insets: [s.top, s.right, s.bottom, s.left].map(parseFloat),
              radii: [
                s.borderTopLeftRadius,
                s.borderTopRightRadius,
                s.borderBottomRightRadius,
                s.borderBottomLeftRadius,
              ].map(parseFloat),
            }
          : null,
      };
    },
    { part, index, BUTTONS },
  );

/** The button's pixels: the fill's middle, the band round it, its corners. */
async function fillPixels(page, box) {
  const x0 = Math.round(box.left);
  const y0 = Math.round(box.top);
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  const shot = await page.screenshot({
    clip: { x: x0, y: y0, width: w, height: h },
  });
  const mid = Math.floor(h / 2);
  const spots = {
    middle: [
      [6, mid],
      [w - 7, mid],
    ],
    band: [
      [2, mid],
      [w - 3, mid],
      [Math.floor(w / 2), 2],
      [Math.floor(w / 2), h - 3],
    ],
    corners: [
      [4, 4],
      [w - 5, 4],
      [4, h - 5],
      [w - 5, h - 5],
    ],
  };
  const read = await pixels(shot, Object.values(spots).flat());
  let i = 0;
  return Object.fromEntries(
    Object.entries(spots).map(([name, points]) => [
      name,
      points.map(() => read[i++]),
    ]),
  );
}

/**
 * Decision 164: each button, hovered, draws its fill inside itself, 4 in
 * from its edges, its corners the field's less 4, and nothing at rest; the
 * button itself fills nothing, a disabled one draws no fill, and in forced
 * colours none is drawn. The button stays as tall as the field. `fills`
 * collects each fill's measured size, for the summary.
 */
async function hoverFill(page, part, mode, density, step, problems, fills) {
  const count = await page
    .locator(`[data-part="${part}"]`)
    .locator(BUTTONS)
    .count();
  if (count === 0) {
    problems.push(`${step}: ${part} has no button at its field's end`);
    return;
  }
  const muted = mode.forced
    ? null
    : await resolve(page, "--primitives-colors-background-100");
  for (let index = 0; index < count; index += 1) {
    await page.mouse.move(1, 1);
    await settleLayout(page);
    const rest = await fillState(page, part, index);
    const name = `${part}'s ${rest.label}`;
    const restPixels = await fillPixels(page, rest.box);
    reads += 1;
    if (rest.fill && !clear(rest.fill.background))
      problems.push(
        `${step}: at rest, ${name} draws a fill (${rest.fill.background})`,
      );
    if (!clear(rest.own))
      problems.push(`${step}: at rest, ${name} fills its box (${rest.own})`);
    reads += 1;
    if (Math.abs(rest.box.height - FIELD_HEIGHT[density]) > 0.5)
      problems.push(
        `${step}: ${name} is ${rest.box.height} tall, not the field's ${FIELD_HEIGHT[density]}`,
      );
    await page.mouse.move(
      rest.box.left + rest.box.width / 2,
      rest.box.top + rest.box.height / 2,
    );
    await settleLayout(page);
    const now = await fillState(page, part, index);
    const nowPixels = await fillPixels(page, now.box);
    reads += 1;
    if (!now.hovered) {
      problems.push(`${step}: ${name} did not take the pointer's hover`);
      continue;
    }
    // In forced colours the button's own background is the engine's to
    // repaint; the edges read below hold it to the field's edge there.
    if (!mode.forced && !clear(now.own))
      problems.push(
        `${step}: hovered, ${name} fills its own box (${now.own}), over the field's edge`,
      );
    const changed = (from, to) => distance(from, to) > 2;
    if (now.disabled || mode.forced) {
      reads += 1;
      const why = now.disabled ? "disabled" : "in forced colours";
      if (now.fill && !clear(now.fill.background))
        problems.push(
          `${step}: hovered ${why}, ${name} draws a fill (${now.fill.background})`,
        );
      if (mode.repaints)
        for (const [k, pixel] of nowPixels.middle.entries())
          if (changed(restPixels.middle[k], pixel))
            problems.push(
              `${step}: hovered ${why}, ${name} draws over its middle: rgb(${pixel.slice(0, 3)}), at rest rgb(${restPixels.middle[k].slice(0, 3)})`,
            );
      continue;
    }
    reads += 1;
    if (!now.fill) {
      problems.push(
        `${step}: hovered, ${name} draws no fill inside itself (its own box: ${now.own})`,
      );
    } else {
      const { fill, box } = now;
      const radius = Math.max(0, now.fieldRadius - 4);
      fills.add(
        `${density} ${Math.round(fill.width)}x${Math.round(fill.height)} r${fill.radii[0]} (field r${now.fieldRadius})`,
      );
      if (fill.position !== "absolute")
        problems.push(`${step}: ${name}'s fill is ${fill.position}`);
      if (fill.insets.some((inset) => Math.abs(inset - 4) > 0.5))
        problems.push(
          `${step}: hovered, ${name}'s fill sits ${fill.insets.join(", ")} in from its top, end, bottom and start, not 4`,
        );
      if (
        Math.abs(fill.width - (box.width - 8)) > 0.5 ||
        Math.abs(fill.height - (box.height - 8)) > 0.5
      )
        problems.push(
          `${step}: hovered, ${name}'s fill is ${fill.width}x${fill.height} in a ${box.width}x${box.height} button, not 8 less each way`,
        );
      if (fill.radii.some((r) => Math.abs(r - radius) > 0.5))
        problems.push(
          `${step}: hovered, ${name}'s fill has corners ${fill.radii.join(", ")}, not the field's ${now.fieldRadius} less 4`,
        );
      if (fill.background !== muted)
        problems.push(
          `${step}: hovered, ${name}'s fill is ${fill.background}, not background-100 (${muted})`,
        );
    }
    // As drawn: the fill's middle is background-100; the band round it, where
    // the field's edge is, and the fill's own corners stay as at rest.
    reads += 1;
    const want = rgb(muted);
    for (const pixel of nowPixels.middle)
      if (distance(pixel, want) > 3)
        problems.push(
          `${step}: hovered, ${name}'s middle draws rgb(${pixel.slice(0, 3)}), not background-100 rgb(${want})`,
        );
    const where = {
      band: ["left", "right", "top", "bottom"].map(
        (e) => `the 4px band at its ${e}`,
      ),
      corners: ["top left", "top right", "bottom left", "bottom right"].map(
        (c) => `the fill's ${c} corner`,
      ),
    };
    // A corner pixel can be the field's own antialiased corner, which moves
    // by a few levels as the button repaints; a fill there moves it by most
    // of the fill's contrast with the field (28 in either theme).
    const moved = { band: 2, corners: 8 };
    for (const spot of ["band", "corners"])
      for (const [k, pixel] of nowPixels[spot].entries())
        if (distance(restPixels[spot][k], pixel) > moved[spot])
          problems.push(
            `${step}: hovered, ${name} draws over ${where[spot][k]}: rgb(${pixel.slice(0, 3)}), at rest rgb(${restPixels[spot][k].slice(0, 3)})`,
          );
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
    const spread = layer.match(
      /(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/,
    );
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
          viewport: { width: 480, height: 1280 },
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
          // DatePicker's button opens Kozmos's calendar only where the
          // browser's own picker can give way (not Firefox, decision 105).
          const parts = [];
          for (const part of PARTS)
            if (
              part !== "date" ||
              (await page
                .locator('[data-part="date"] [data-picker="kozmos"]')
                .count())
            )
              parts.push(part);
            else ownDatePicker = true;
          for (const part of parts)
            await hoverKeepsEdges(
              page,
              part,
              ["top", "bottom", "end"],
              name,
              problems,
            );
          for (const part of [...parts, ...DISABLED])
            await hoverFill(page, part, mode, density, name, problems, fills);
          // The fill's corners follow the control radius a product sets.
          if (!mode.forced) {
            await setControlRadius(page, 8);
            for (const part of parts)
              await hoverFill(
                page,
                part,
                mode,
                density,
                `${name}, control radius 8`,
                problems,
                fills,
              );
            await setControlRadius(page, null);
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
          failures.push(
            ...problems.map((p) => (p.startsWith(name) ? p : `${name}: ${p}`)),
          );
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
  `\nPASS field actions: ${reads} reads; hovered, Combobox's and MultiSelect's clear and open, Input's action, PasswordInput's reveal${ownDatePicker ? "" : ", DatePicker's"} and TimePicker's trigger each draw background-100 inside themselves, 4 in, corners the field's less 4 (${[...fills].sort().join("; ")}), nothing at rest, disabled or in forced colours, each as tall as the field${ownDatePicker ? " (DatePicker keeps the browser's own picker in this engine: no button to read)" : ""}; hovering leaves the field's top, bottom and end edges drawn, in normal and forced colours; a focused button rings alone, on MultiSelect as on Combobox, and the field rings for its input; MultiSelect's input draws no box of its own inside the field, at rest or focused, and Combobox's paints no outline at rest${noForcedPalette ? " (forced colours repaint nothing in this engine: there the input's box was read from computed styles only)" : ""}; light and dark, touch and compact, both directions`,
);
