/**
 * GAP-174: every Kozmos field draws in the engine named by ADAPTIVE_BROWSER
 * as Chromium draws it, on the built React package.
 *
 * Playwright's WebKit 26.0 applies no `@scope` rule that has a scope-start
 * selector to an element that hosts a shadow root, and every text-like
 * <input> and every <textarea> hosts one: a scoped padding or colour reaches a
 * <div>, a <button> and a <select>, never a field. Safari 26.0 to 26.3 ship
 * it; Apple fixed it in 26.4 ("CSS rules within @scope not being applied to
 * <input> and <textarea> elements"). Kozmos's utilities are emitted inside
 * `@scope ([data-kozmos-root])`, so on those versions a field holds only what
 * owned CSS (`@kozmos-owned`, unscoped) gives it.
 *
 * The fixture (packages/react/tests/integration/field-styles.fixture.tsx)
 * draws every part with an <input> or a <textarea> in light and dark, left to
 * right and right to left, touch and compact, and disabled. Chromium applies
 * every scoped rule to a field, so it is the reference: in each board, every
 * field's size, padding on four sides, text alignment, font, colours,
 * borders, radius, shadow, opacity and resize must compute in this engine as
 * they do in Chromium, at rest and focused.
 *
 * - The placeholder's colour and opacity: Chromium and Firefox read them;
 *   WebKit answers a `::placeholder` read with the field's own values, so
 *   there they cannot be read. Instead, Chromium with every @scope rule
 *   removed must give every field the placeholder the full stylesheet does:
 *   owned CSS carries it, and owned CSS is what reaches a field in WebKit.
 * - The promises the parts make are written below and hold in every engine:
 *   OTPInput's cells, ColorPicker's room for its swatch, Search's and the date
 *   fields' room for their icon, Combobox's and PasswordInput's for their
 *   buttons, AIInputBar's bare field, the SDK fields' fills.
 * - A caller's emitted padding class (px-4, pl-12) wins over a field's own
 *   where @scope reaches a field (Chromium, Firefox). In WebKit it cannot
 *   land, and the field keeps its own padding: the limit GAP-174 documents.
 *   When Playwright's WebKit starts to apply @scope to a field (26.4 does),
 *   the check fails there and says so, so the expectations and the docs
 *   follow: the limit stays for Safari 26.0 to 26.3.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-field-styles.mjs
 */
import { createRequire } from "node:module";
import { chromium } from "playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("field-styles.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const unscoped = require("postcss").parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

// A field: what WebKit leaves unstyled by any scoped rule. FileUpload's file
// input is `hidden`; Radix's checkbox, radio and select controls are hidden
// native stand-ins for forms, and a <select> takes scoped rules in WebKit.
const FIELDS =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([hidden]), textarea';
const LENGTHS = [
  "width",
  "height",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "fontSize",
  "lineHeight",
];
const COLOURS = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
];
const EXACT = [
  "textAlign",
  "fontFamily",
  "fontWeight",
  "textTransform",
  "borderTopStyle",
  "position",
  "opacity",
  "resize",
  "boxShadow",
];
const FOCUSED = [
  "boxShadow",
  "backgroundColor",
  "borderTopColor",
  "outlineStyle",
  "outlineWidth",
];
const PADDINGS = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];

// The parts whose className lands on their field, as the caller boards pass
// it: a caller's px-4 sets both sides, a pl-12 the left, where @scope reaches.
const CALLER_PARTS = new Set([
  "input",
  "input-error",
  "textarea",
  "search",
  "combobox",
  "combobox-plain",
  "password-input",
  "number-input",
  "number-input-plain",
  "color-picker #1",
  "date-picker",
  "time-picker",
]);

// What each part promises, [touch, compact] where density changes it, read
// in every engine on the light and dark boards. Lengths in px; paddingStart
// and paddingEnd are the board's start and end, left or right as it reads (a
// native date field can report a left-to-right direction of its own inside a
// right-to-left board). `enabled` holds only while the field is enabled.
const ALL = "all";
const PROMISES = [
  // Six cells, each a 44 square with the digit centred at 18/28.
  {
    part: "otp-input",
    field: ALL,
    width: 44,
    height: 44,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 28,
  },
  // The swatch, 32 square, sits over the text, which starts 48 in and keeps
  // 48 at the end for the open button; the value reads in capitals.
  {
    part: "color-picker",
    field: 0,
    width: 32,
    height: 32,
    position: "absolute",
  },
  {
    part: "color-picker",
    field: 1,
    paddingStart: 48,
    paddingEnd: 48,
    height: [44, 40],
    textTransform: "uppercase",
  },
  // The panel's number fields, 36 tall with 8 either side.
  {
    part: "color-picker",
    field: [4, 5, 6, 7],
    height: 36,
    paddingStart: 8,
    paddingEnd: 8,
    fontSize: 14,
  },
  {
    part: "color-picker",
    field: [2, 3],
    height: 20,
  },
  {
    part: "color-picker-hex",
    field: 4,
    height: 36,
    textTransform: "uppercase",
  },
  {
    part: "input",
    field: 0,
    height: [44, 40],
    paddingStart: 12,
    paddingEnd: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  { part: "textarea", field: 0, paddingStart: 12, paddingEnd: 12 },
  // The text clears the magnifier, and the date fields' icon, at the start.
  { part: "search", field: 0, paddingStart: 36, paddingEnd: 12 },
  { part: "date-picker", field: 0, paddingStart: 36 },
  // DatePicker's button, where it replaces the browser's (decision 105), has
  // the room PasswordInput's toggle has; where the browser's own cannot be
  // hidden (Firefox 146) the field is the browser's, with the field's own 12.
  { part: "date-picker", field: 0, picker: "kozmos", paddingEnd: [48, 44] },
  { part: "date-picker", field: 0, picker: null, paddingEnd: 12 },
  {
    part: "date-range-picker",
    field: ALL,
    picker: "kozmos",
    paddingEnd: [48, 44],
  },
  { part: "date-range-picker", field: ALL, picker: null, paddingEnd: 12 },
  { part: "date-range-picker", field: ALL, paddingStart: 36 },
  { part: "time-picker", field: 0, paddingStart: 36 },
  // The room for the buttons at the end, each as tall as the field.
  // Disabled, the clear goes, and its room with it.
  { part: "combobox", field: 0, enabled: true, paddingEnd: [96, 88] },
  { part: "combobox-plain", field: 0, paddingEnd: [48, 44] },
  { part: "password-input", field: 0, paddingEnd: [48, 44] },
  // An SDK part: touch under any density (decision 89).
  { part: "route-location-field", field: 0, paddingEnd: 48, height: 44 },
  { part: "multi-select", field: 0, height: [32, 28] },
  // The assistant's field is bare inside its pill: no border, no fill.
  {
    part: "ai-input-bar",
    field: 0,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    fontSize: 14,
    height: 20,
  },
  // The SDK route fields: 40 tall on a wash, with no edge.
  {
    part: "routing-input-group",
    field: ALL,
    height: 40,
    borderTopColor: "transparent",
  },
  {
    part: "wayfinding-input-row",
    field: ALL,
    height: 40,
    paddingEnd: 64,
    borderTopWidth: 0,
  },
  {
    part: "feedback-card",
    field: 0,
    resize: "none",
    borderTopColor: "transparent",
  },
];

/** A computed colour as [r, g, b, a] in 0–255 and 0–1, or the string. */
function readColour(value) {
  if (value === "transparent") return [0, 0, 0, 0];
  const legacy = value.match(
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/,
  );
  if (legacy)
    return [
      Number(legacy[1]),
      Number(legacy[2]),
      Number(legacy[3]),
      legacy[4] === undefined ? 1 : Number(legacy[4]),
    ];
  const srgb = value.match(
    /^color\(srgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)(?: \/ ([\d.e+-]+))?\)$/,
  );
  if (srgb)
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  return value;
}
const sameColour = (a, b) => {
  const [x, y] = [readColour(a), readColour(b)];
  if (typeof x === "string" || typeof y === "string") return a === b;
  // Fully transparent is one colour, whatever its channels.
  if (x[3] === 0 && y[3] === 0) return true;
  return (
    x.slice(0, 3).every((channel, i) => Math.abs(channel - y[i]) <= 1.5) &&
    Math.abs(x[3] - y[3]) <= 0.01
  );
};
/** Colours inside a shadow, written one way, so engines compare. */
const normaliseShadow = (value) =>
  value.replace(/rgba?\([^)]*\)|color\(srgb[^)]*\)/g, (colour) => {
    const parsed = readColour(colour);
    if (typeof parsed === "string") return colour;
    const [r, g, b, a] = parsed;
    return a === 0
      ? "transparent"
      : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(2)})`;
  });
// Chromium writes BlinkMacSystemFont as "system-ui"; the stack is the same.
const normaliseFamily = (value) =>
  value.replace(/BlinkMacSystemFont/g, '"system-ui"');
const px = (value) => Number.parseFloat(value);

/** Every field, at rest and focused, as this browser draws it. */
async function measure(browser, stylesheet) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1200 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    '<!doctype html><html lang="en"><div id="fixture"></div></html>',
  );
  await page.addStyleTag({ content: stylesheet });
  await page.addScriptTag({ content: code });
  await page
    .locator('[data-board="caller pl-12 rtl"] [data-part="feedback-card"]')
    .locator("textarea")
    .waitFor();
  await settleLayout(page);
  const result = await page.evaluate(
    ({ FIELDS, LENGTHS, COLOURS, EXACT, FOCUSED }) => {
      const settle = () => {
        for (const animation of document.getAnimations()) {
          try {
            animation.finish();
          } catch {
            // An endless animation (a spinner): nothing to settle.
          }
        }
      };
      settle();
      const fields = [];
      for (const board of document.querySelectorAll("[data-board]"))
        for (const part of board.querySelectorAll("[data-part]"))
          part.querySelectorAll(FIELDS).forEach((field, index) =>
            fields.push({
              key: `${board.getAttribute("data-board")} | ${part.getAttribute("data-part")} #${index}`,
              field,
            }),
          );
      const rest = {};
      for (const { key, field } of fields) {
        const style = getComputedStyle(field);
        const box = field.getBoundingClientRect();
        const read = {
          what: `${field.tagName.toLowerCase()}${field.tagName === "INPUT" ? `[type=${field.type}]` : ""}${field.getAttribute("aria-label") ? ` "${field.getAttribute("aria-label")}"` : ""}`,
          disabled: field.disabled,
          // DatePicker's mark where its button replaces the browser's.
          picker: field.getAttribute("data-picker"),
          width: `${box.width}px`,
          height: `${box.height}px`,
          placeholder: field.placeholder
            ? getComputedStyle(field, "::placeholder").color
            : null,
          placeholderOpacity: field.placeholder
            ? getComputedStyle(field, "::placeholder").opacity
            : null,
        };
        for (const name of [...LENGTHS.slice(2), ...COLOURS, ...EXACT])
          read[name] = style[name];
        if (field.tagName !== "TEXTAREA") delete read.resize;
        rest[key] = read;
      }
      // Focused, one at a time: the ring, the fill and the edge it takes.
      const focused = {};
      for (const { key, field } of fields) {
        if (field.disabled) continue;
        field.focus({ preventScroll: true });
        settle();
        const style = getComputedStyle(field);
        focused[key] = {};
        for (const name of FOCUSED) focused[key][name] = style[name];
        field.blur();
      }
      settle();
      return { rest, focused };
    },
    { FIELDS, LENGTHS, COLOURS, EXACT, FOCUSED },
  );
  // Whether this engine applies a scoped rule to a field at all, measured on
  // a probe beside the fixture: a scoped padding on an <input> and a <div>.
  const probe = await page.evaluate(() => {
    const host = document.createElement("div");
    host.setAttribute("data-field-probe", "");
    const style = document.createElement("style");
    style.textContent =
      "@scope ([data-field-probe]) { .probe { padding-inline-start: 23px; } }";
    const input = document.createElement("input");
    const div = document.createElement("div");
    input.className = div.className = "probe";
    host.append(style, input, div);
    document.body.append(host);
    const read = (element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart);
    const out = { input: read(input), div: read(div) };
    host.remove();
    return out;
  });
  await page.close();
  return { ...result, errors, probe };
}

const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const reference = engine === "chromium" ? browser : await chromium.launch();
if (reference !== browser)
  console.log(`Reference: chromium ${reference.version()}`);
const failures = new Map();
let reads = 0;
let drawn = { fields: 0, parts: 0, boards: 0 };
// Failures group by part: in which fields and boards, and each property that
// differs with the first values read.
const fail = (part, what, board, detail, field) => {
  if (!failures.has(part))
    failures.set(part, {
      boards: new Set(),
      fields: new Set(),
      reads: 0,
      details: new Map(),
    });
  const entry = failures.get(part);
  entry.boards.add(board);
  if (field) entry.fields.add(field);
  entry.reads += 1;
  if (!entry.details.has(what)) entry.details.set(what, detail);
};

try {
  const ref = await measure(reference, css);
  const owned = await measure(reference, unscoped.toString());
  const got = reference === browser ? ref : await measure(browser, css);
  for (const [name, run] of [
    ["chromium", ref],
    ["chromium without @scope", owned],
    [engine, got],
  ])
    if (run.errors.length)
      fail(`${name}`, "client-side errors", "page", run.errors.join("; "));

  // WebKit 26 applies no scoped rule to a field; Chromium and Firefox do.
  const scopeReachesFields = got.probe.input === 23;
  reads += 2;
  if (got.probe.div !== 23)
    fail(
      "probe",
      "a scoped padding on a <div>",
      "probe",
      `${got.probe.div}, expected 23: this engine does not apply @scope at all`,
    );
  if (engine === "webkit" && scopeReachesFields)
    fail(
      "probe",
      "WebKit now applies @scope to an <input>",
      "probe",
      "as Safari 26.4 does: expect a caller's class to win here too, and keep GAP-174's limit in the docs for Safari 26.0 to 26.3",
    );
  if (engine !== "webkit" && !scopeReachesFields)
    fail(
      "probe",
      `${engine} applies no @scope rule to an <input>`,
      "probe",
      `${got.probe.input}, expected 23`,
    );

  const partOf = (key) => key.split(" | ")[1];
  const boardOf = (key) => key.split(" | ")[0];
  const partName = (key) => partOf(key).replace(/ #\d+$/, "");
  const takesCaller = (key) =>
    CALLER_PARTS.has(partName(key)) || CALLER_PARTS.has(partOf(key));
  const fieldOf = (key, read) => `#${partOf(key).split(" #")[1]} ${read.what}`;

  const refKeys = Object.keys(ref.rest);
  drawn = {
    fields: refKeys.length,
    parts: new Set(refKeys.map(partName)).size,
    boards: new Set(refKeys.map(boardOf)).size,
  };
  reads += 1;
  if (refKeys.length < 400)
    fail("fixture", "fields", "page", `only ${refKeys.length} drawn`);
  for (const key of refKeys) {
    const want = ref.rest[key];
    const have = got.rest[key];
    const board = boardOf(key);
    reads += 1;
    if (!have) {
      fail(partName(key), "drawn", board, "no", fieldOf(key, want));
      continue;
    }
    const caller = board.startsWith("caller ");
    // In WebKit a caller's class cannot reach the field: its padding is the
    // part's own, as the same part draws it without the class.
    const ownPadding =
      caller && takesCaller(key) && !scopeReachesFields
        ? ref.rest[
            key.replace(
              /^caller \S+ (ltr|rtl)/,
              (_, dir) => `light ${dir} touch`,
            )
          ]
        : null;
    for (const name of [
      ...LENGTHS,
      ...COLOURS,
      ...EXACT,
      "placeholder",
      "placeholderOpacity",
    ]) {
      if (!(name in want)) continue;
      let expected = want[name];
      const actual = have[name];
      if (name.startsWith("placeholder")) {
        if (expected === null) continue;
        // WebKit answers a ::placeholder read with the field's own values.
        if (engine === "webkit") continue;
      }
      if (ownPadding && PADDINGS.includes(name)) expected = ownPadding[name];
      // DatePicker keeps the browser's field where the browser's own picker
      // button cannot be hidden (Firefox 146): no button, so no room for one
      // at the end. Its end is then TimePicker's, the same field recipe
      // under the same caller's class.
      const endSide = board.includes(" rtl") ? "paddingLeft" : "paddingRight";
      if (
        name === endSide &&
        want.picker === "kozmos" &&
        have.picker !== "kozmos"
      )
        // DateRangePicker's fields take no caller's class: the field's own 12.
        expected = key.includes("| date-range-picker #")
          ? "12px"
          : ref.rest[key.replace("| date-picker #", "| time-picker #")][name];
      reads += 1;
      let same;
      if (LENGTHS.includes(name))
        same =
          expected === actual || Math.abs(px(expected) - px(actual)) <= 0.5;
      else if (COLOURS.includes(name) || name === "placeholder")
        same = sameColour(expected, actual);
      else if (name === "boxShadow")
        same = normaliseShadow(expected) === normaliseShadow(actual);
      else if (name === "fontFamily")
        same = normaliseFamily(expected) === normaliseFamily(actual);
      else same = expected === actual;
      if (!same)
        fail(
          partName(key),
          name,
          board,
          `${actual}, expected ${expected}${ownPadding && PADDINGS.includes(name) ? " (its own: a caller's class cannot land in WebKit)" : ""}`,
          fieldOf(key, want),
        );
    }
  }

  // Focused: the same ring, fill and edge. WebKit does not take a scripted
  // focus on a native date or time field as :focus-visible, which is why the
  // temporal fields ring on :focus (owned-temporal-fields.css): what is drawn
  // is compared, not the selector that drew it.
  for (const [key, want] of Object.entries(ref.focused)) {
    const have = got.focused[key];
    if (!have) continue;
    const board = boardOf(key);
    for (const name of FOCUSED) {
      // No outline, or the platform's own ring, whose width is the engine's.
      if (
        name === "outlineWidth" &&
        (want.outlineStyle === "none" || want.outlineStyle === "auto")
      )
        continue;
      reads += 1;
      const same =
        name === "boxShadow"
          ? normaliseShadow(want[name]) === normaliseShadow(have[name])
          : name === "outlineWidth"
            ? Math.abs(px(want[name]) - px(have[name])) <= 0.5
            : name === "outlineStyle"
              ? want[name] === have[name]
              : sameColour(want[name], have[name]);
      if (!same)
        fail(
          partName(key),
          `focused ${name}`,
          board,
          `${have[name]}, expected ${want[name]}`,
          fieldOf(key, ref.rest[key]),
        );
    }
  }

  // Owned CSS carries every placeholder's colour and opacity: what reaches
  // WebKit.
  for (const [key, want] of Object.entries(ref.rest)) {
    if (want.placeholder === null || boardOf(key).startsWith("caller "))
      continue;
    for (const name of ["placeholder", "placeholderOpacity"]) {
      reads += 1;
      const have = owned.rest[key]?.[name];
      if (
        !have ||
        !(name === "placeholder"
          ? sameColour(have, want[name])
          : have === want[name])
      )
        fail(
          partName(key),
          `${name} without @scope`,
          boardOf(key),
          `${have}, expected ${want[name]}: owned CSS does not carry it, so WebKit draws the browser's`,
          fieldOf(key, want),
        );
    }
  }

  // The parts' own promises, in this engine.
  for (const [key, have] of Object.entries(got.rest)) {
    const board = boardOf(key);
    if (board.startsWith("caller ")) continue;
    const [part, index] = partOf(key).split(" #");
    const column = board.includes("compact") ? 1 : 0;
    for (const promise of PROMISES) {
      if (promise.part !== part) continue;
      const fields =
        promise.field === ALL ? null : [promise.field].flat().map(String);
      if (fields && !fields.includes(index)) continue;
      if (promise.enabled && have.disabled) continue;
      if ("picker" in promise && promise.picker !== have.picker) continue;
      const rtl = board.includes(" rtl");
      for (const [name, value] of Object.entries(promise)) {
        if (["part", "field", "enabled", "picker"].includes(name)) continue;
        // A disabled field fades or fills as its part says; the rest holds.
        if (have.disabled && /Color$|opacity/.test(name)) continue;
        const want = Array.isArray(value) ? value[column] : value;
        const side =
          name === "paddingStart"
            ? rtl
              ? "paddingRight"
              : "paddingLeft"
            : name === "paddingEnd"
              ? rtl
                ? "paddingLeft"
                : "paddingRight"
              : name;
        const actual = have[side];
        reads += 1;
        const same =
          typeof want === "number"
            ? Math.abs(px(actual) - want) <= 0.5
            : want === "transparent"
              ? sameColour(actual, "transparent")
              : actual === want;
        if (!same)
          fail(
            part,
            `promises ${name}`,
            board,
            `${actual}, promised ${want}`,
            fieldOf(key, have),
          );
      }
    }
  }

  // A caller's class: wins where @scope reaches the field.
  if (scopeReachesFields)
    for (const [key, have] of Object.entries(got.rest)) {
      const board = boardOf(key);
      if (!board.startsWith("caller ") || !takesCaller(key)) continue;
      // px-4 at the start, left or right as the board reads; pl-12 on the left.
      const [name, want] = board.includes("px-4")
        ? [board.endsWith(" rtl") ? "paddingRight" : "paddingLeft", 16]
        : ["paddingLeft", 48];
      reads += 1;
      if (Math.abs(px(have[name]) - want) > 0.5)
        fail(
          partName(key),
          `with a caller's ${board.split(" ")[1]}, ${name}`,
          board,
          `${have[name]}, expected ${want}: a caller's class must win`,
          fieldOf(key, have),
        );
    }
} finally {
  await browser.close();
  if (reference !== browser) await reference.close();
}

if (failures.size) {
  const few = (set, n) =>
    `${[...set].slice(0, n).join(", ")}${set.size > n ? ", …" : ""}`;
  const lines = [...failures].map(
    ([part, { boards, fields, details }]) =>
      `${part}: ${fields.size ? `${fields.size} field${fields.size === 1 ? "" : "s"} (${few(fields, 2)}) ` : ""}in ${boards.size} board${boards.size === 1 ? "" : "s"} (${few(boards, 3)}):\n    ${[...details].map(([what, detail]) => `${what} ${detail}`).join("\n    ")}`,
  );
  console.error(
    `FAIL field styles in ${engine}: ${[...failures.values()].reduce((n, entry) => n + entry.reads, 0)} of ${reads} reads, in ${failures.size} parts: ${[...failures.keys()].sort().join(", ")}\n- ${lines.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS field styles in ${engine}: ${reads} reads; ${drawn.fields} fields of ${drawn.parts} parts in ${drawn.boards} boards compute as in Chromium, at rest and focused, in light and dark, left to right and right to left, touch and compact, and disabled; owned CSS carries every placeholder's colour and opacity; OTPInput's cells, ColorPicker's swatch room, Search's and the date fields' icon room, Combobox's and PasswordInput's button room, AIInputBar's bare field and the SDK route fields hold; ${engine === "webkit" ? "a caller's px-4 and pl-12 cannot reach a field in this WebKit, as in Safari 26.0 to 26.3 (GAP-174), and each field keeps its own padding" : "a caller's px-4 and pl-12 win over every field's own"}`,
);
