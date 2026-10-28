/**
 * The 0.15.0 control props, on the built package in a real browser
 * (packages/react/tests/integration/control-props-host.tsx), in light and
 * dark, touch and compact, left to right and right to left:
 *
 * - IconButton `counter` (GAP-197): a Counter over the icon's top-end corner,
 *   its bottom edge on the button's centre line and its start edge 2px past
 *   it at every size (on the design's 28 help button, 4 above and 6 past its
 *   end, decision 139), mirrored right to left; drawn in the theme fill; read
 *   with the button's name, in counterLabel's words, after counterSeparator,
 *   also when aria-labelledby names it, the number itself hidden; an outline
 *   in forced colours.
 * - CardHeader `actions` (GAP-169): at the header's inline end, 24 in from
 *   the card's edge, mirrored right to left; centred on the title's line, a
 *   small and a large icon button too; a title-only header no taller for an
 *   icon button; a long title kept clear of them; after the title in reading
 *   and Tab order, its ring drawn.
 * - Input `action` (GAP-154): the copy button inside the field's end, as tall
 *   as the field, the text kept clear of it (in WebKit too, where no @scope
 *   rule reaches an input); Tab reaches it after the field, Enter copies the
 *   value and a polite live region, present before, says "Copied", again on
 *   a second copy; the copy icon gives way to a check. The toggle is a
 *   pressed button with its own name, Space flips it, and pressed it is a
 *   32 disc of the theme fill under the icon in the fill's foreground, 3:1 or
 *   more on the field, as a pressed ToggleButton is (not a colour alone,
 *   WCAG 1.4.1); a Highlight disc in forced colours. Giving a field an action,
 *   or taking it away, keeps the same input, its focus and its typed value.
 *
 * Each read is recorded on its own, so a run lists every read that fails.
 * Reads named "guard" hold on main too. The accessible names are read with
 * Playwright's role queries in every engine, and from Chromium's own
 * accessibility tree there.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-control-props.mjs
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("control-props-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const engine = browser.browserType().name();
const failed = new Map();
/** How many times each read ran. */
const attempts = new Map();
let reads = 0;

const MATRIX = [];
for (const theme of ["light", "dark"])
  for (const density of ["touch", "compact"])
    for (const dir of ["ltr", "rtl"]) MATRIX.push({ theme, density, dir });
const label = ({ theme, density, dir, forced }) =>
  `${theme}, ${density}, ${dir}${forced ? ", forced colours" : ""}`;

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
        ...context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data,
      ]);
    },
    { data: png.toString("base64"), points },
  );
const distance = (a, b) =>
  Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));
const rgb = (colour) =>
  colour
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
const near = (actual, expected, what, tolerance = 1) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${what}: ${actual.toFixed(2)}, expected ${expected}`,
  );

async function scenario(mount, run) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 600 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const read = async (name, fn) => {
    reads += 1;
    attempts.set(name, (attempts.get(name) ?? 0) + 1);
    try {
      await fn();
    } catch (error) {
      if (!failed.has(name)) failed.set(name, []);
      failed.get(name).push(label(mount));
      console.error(
        `FAIL ${name} (${label(mount)})\n  ${String(error.message ?? error).split("\n")[0]}`,
      );
    }
  };
  try {
    await page.emulateMedia({
      colorScheme: mount.theme,
      forcedColors: mount.forced ? "active" : "none",
    });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Control props</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.controlProps.mount(mount), mount);
    await settleLayout(page);
    await run(page, read);
    await read(`${mount.part}: no page errors`, () =>
      assert.deepEqual(errors, []),
    );
  } finally {
    await page.close();
  }
}

const box = (page, selector) =>
  page.evaluate(
    (selector) =>
      document.querySelector(selector).getBoundingClientRect().toJSON(),
    selector,
  );

/** Waits for an element's transitions (a colour easing in) to finish. */
const transitioned = (locator) =>
  locator.evaluate((el) =>
    Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
  );

/** A colour a variable resolves to, in the fixture's provider. */
const resolve = (page, variable) =>
  page.evaluate((variable) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${variable})`;
    document.getElementById("surface").append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, variable);

/** Chromium's own accessible name for an element, from its AX tree. */
async function chromiumName(page, selector) {
  if (engine !== "chromium") return null;
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send("Accessibility.getFullAXTree");
  const id = await page.evaluate(
    (selector) => document.querySelector(selector).id,
    selector,
  );
  const dom = await session.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await session.send("DOM.querySelector", {
    nodeId: dom.root.nodeId,
    selector: `#${id}`,
  });
  const { node } = await session.send("DOM.describeNode", { nodeId });
  const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
  await session.detach();
  return ax?.name?.value ?? null;
}

// --- IconButton: counter (GAP-197) ------------------------------------------

for (const m of MATRIX) {
  const rtl = m.dir === "rtl";
  await scenario({ ...m, part: "iconbutton" }, async (page, read) => {
    const counters = await page.evaluate(() =>
      ["sm", "icon", "lg"].map((size) => {
        const button = document.getElementById(`help-${size}`);
        const counter = button.querySelector('[data-slot="counter"]');
        return {
          size,
          button: button.getBoundingClientRect().toJSON(),
          counter: counter?.getBoundingClientRect().toJSON() ?? null,
          background: counter
            ? getComputedStyle(counter).backgroundColor
            : null,
          hidden: counter?.getAttribute("aria-hidden") ?? null,
          text: counter?.textContent ?? null,
        };
      }),
    );
    await read(
      "iconbutton counter: over the icon's top-end corner, its bottom on the button's centre line and its start 2px past it, at every size",
      async () => {
        for (const c of counters) {
          assert.ok(c.counter, `${c.size}: a counter`);
          const cx = (c.button.left + c.button.right) / 2;
          const cy = (c.button.top + c.button.bottom) / 2;
          near(c.counter.bottom, cy, `${c.size}: its bottom`, 0.5);
          // The MAP-64 design's help button, IconButton sm in compact: 28
          // across, its Counter at x 16 to 34 and y -4 to 14 (decision 139).
          if (m.density === "compact" && c.size === "sm" && !rtl) {
            near(c.button.width, 28, "sm in compact: 28 across", 0.5);
            near(c.counter.left - c.button.left, 16, "design x from", 0.5);
            near(c.counter.right - c.button.left, 34, "design x to", 0.5);
            near(c.counter.top - c.button.top, -4, "design y from", 0.5);
            near(c.counter.bottom - c.button.top, 14, "design y to", 0.5);
          }
          if (rtl) near(c.counter.right, cx - 2, `${c.size}: its start`, 0.5);
          else near(c.counter.left, cx + 2, `${c.size}: its start`, 0.5);
          near(c.counter.height, 18, `${c.size}: 18 tall`, 0.5);
        }
      },
    );
    await read(
      "iconbutton counter: drawn in the theme fill, its number hidden from readers",
      async () => {
        const fill = await resolve(page, "--primitives-colors-theme-500");
        const shot = await page.screenshot();
        for (const c of counters) {
          assert.equal(c.background, fill, `${c.size}: computed`);
          assert.equal(c.text, "3", `${c.size}: the number`);
          assert.equal(c.hidden, "true", `${c.size}: aria-hidden`);
          // The pill's edge at its middle height, clear of the digit.
          const [p] = await pixels(shot, [
            [c.counter.left + 3, (c.counter.top + c.counter.bottom) / 2],
          ]);
          assert.ok(
            distance(p, rgb(fill)) <= 3,
            `${c.size}: drawn rgb(${p.slice(0, 3)})`,
          );
        }
      },
    );
    await read(
      "iconbutton counter: the count read with the name, in counterLabel's words",
      async () => {
        assert.equal(
          await page
            .getByRole("button", { name: "Help, 3 tours left", exact: true })
            .count(),
          3,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: "Ayuda, 2 recorridos pendientes",
              exact: true,
            })
            .count(),
          1,
        );
        const own = await chromiumName(page, "#help-icon");
        if (own !== null) assert.equal(own, "Help, 3 tours left", "Chromium");
      },
    );
    await read(
      "iconbutton counter: read with a name from aria-labelledby, and after counterSeparator",
      async () => {
        assert.equal(
          await page
            .getByRole("button", { name: /^Help ?, 4 tours left$/ })
            .count(),
          1,
          "aria-labelledby",
        );
        assert.equal(
          await page.getByRole("button", { name: "ヘルプ、3", exact: true }).count(),
          1,
          "counterSeparator",
        );
        const own = await chromiumName(page, "#labelled");
        if (own !== null)
          assert.match(own, /^Help ?, 4 tours left$/, "Chromium");
      },
    );
    await read(
      "guard: iconbutton counter: Tab reaches the button and its ring draws",
      async () => {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => ({
          id: document.activeElement?.id,
          ring: getComputedStyle(document.activeElement).boxShadow,
        }));
        assert.equal(focused.id, "help-sm");
        assert.notEqual(focused.ring, "none");
      },
    );
  });
}
for (const m of [MATRIX[0], MATRIX[3]]) {
  await scenario(
    { ...m, part: "iconbutton", forced: true },
    async (page, read) => {
      await read(
        "iconbutton counter: outlined in CanvasText in forced colours",
        async () => {
          const outline = await page.evaluate(() => {
            const counter = document.querySelector(
              '#help-icon [data-slot="counter"]',
            );
            const probe = document.createElement("div");
            probe.style.cssText = "forced-color-adjust:none;color:CanvasText";
            document.body.append(probe);
            const canvasText = getComputedStyle(probe).color;
            probe.remove();
            const s = counter && getComputedStyle(counter);
            return {
              outline: s ? `${s.outlineWidth} ${s.outlineStyle}` : null,
              colour: s?.outlineColor,
              canvasText,
            };
          });
          assert.equal(outline.outline, "1px solid");
          assert.equal(outline.colour, outline.canvasText);
        },
      );
    },
  );
}

// --- CardHeader: actions (GAP-169) ------------------------------------------

for (const m of MATRIX) {
  const rtl = m.dir === "rtl";
  await scenario({ ...m, part: "card" }, async (page, read) => {
    const exists = await page.evaluate(() => !!document.getElementById("edit"));
    await read(
      "cardheader actions: at the header's inline end, 24 in from the card's edge",
      async () => {
        assert.ok(exists, "the actions are drawn");
        const card = await box(page, "#card");
        const edit = await box(page, "#edit");
        near(
          rtl ? edit.left - card.left : card.right - edit.right,
          24 + 1,
          "edit from the card's end edge (24 and the card's 1px border)",
        );
      },
    );
    await read(
      "cardheader actions: centred on the title's first line",
      async () => {
        assert.ok(exists, "the actions are drawn");
        const edit = await box(page, "#short #edit-short");
        const title = await box(page, "#short-title");
        near(
          (edit.top + edit.bottom) / 2,
          (title.top + title.bottom) / 2,
          "centres",
        );
        const long = await box(page, "#edit");
        const line = await page.evaluate(() => {
          const r = document.createRange();
          r.selectNodeContents(document.getElementById("title"));
          return r.getClientRects()[0].toJSON();
        });
        near(
          (long.top + long.bottom) / 2,
          (line.top + line.bottom) / 2,
          "long title's first line",
          1.5,
        );
        // A small and a large icon button are centred too: the actions sat
        // as tall as the density's default icon button, so a small one rode
        // 2 high in compact and a large one 2 to 4 low.
        for (const size of ["sm", "lg"]) {
          const button = await box(page, `#edit-${size}`);
          const sized = await box(page, `#title-${size}`);
          near(
            (button.top + button.bottom) / 2,
            (sized.top + sized.bottom) / 2,
            `${size} centres`,
            0.5,
          );
        }
      },
    );
    await read(
      "cardheader actions: a title-only header no taller for an icon button",
      async () => {
        assert.ok(exists, "the actions are drawn");
        const short = await box(page, "#short");
        const plain = await box(page, "#plain");
        near(short.height, plain.height, "header heights", 0.5);
      },
    );
    await read(
      "cardheader actions: a long title kept 16 clear of them, wrapping",
      async () => {
        assert.ok(exists, "the actions are drawn");
        const edit = await box(page, "#edit");
        const title = await box(page, "#title");
        const gap = rtl ? title.left - edit.right : edit.left - title.right;
        assert.ok(gap >= 15.5, `gap ${gap.toFixed(1)}`);
        assert.ok(title.height > 30, "the long title wraps");
      },
    );
    await read(
      "cardheader actions: after the title in reading and Tab order, named, its ring drawn",
      async () => {
        assert.ok(exists, "the actions are drawn");
        const order = await page.evaluate(
          () =>
            document
              .getElementById("title")
              .compareDocumentPosition(document.getElementById("edit")) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        assert.ok(order, "the button follows the title");
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => ({
          id: document.activeElement?.id,
          ring: getComputedStyle(document.activeElement).boxShadow,
        }));
        assert.equal(focused.id, "edit");
        assert.notEqual(focused.ring, "none");
        assert.equal(
          await page
            .getByRole("button", { name: "Edit Boston Logan Airport" })
            .count(),
          1,
        );
      },
    );
  });
}

// --- Input: action (GAP-154) ------------------------------------------------

for (const m of MATRIX) {
  const rtl = m.dir === "rtl";
  await scenario({ ...m, part: "input" }, async (page, read) => {
    const copy = page.getByRole("button", { name: "Copy FID" });
    const exists = (await copy.count()) === 1;
    await read(
      "input copy: inside the field's end, as tall as the field",
      async () => {
        assert.ok(exists, "a copy button");
        const field = await box(page, "#fid");
        const button = await copy.boundingBox();
        if (rtl) near(button.x, field.left, "at the field's start edge", 0.5);
        else
          near(
            button.x + button.width,
            field.right,
            "at the field's end edge",
            0.5,
          );
        near(button.y, field.top, "top", 0.5);
        near(button.height, field.height, "as tall as the field", 0.5);
      },
    );
    await read(
      "input copy: the text kept clear of the button (the owned rule, in WebKit too)",
      async () => {
        assert.ok(exists, "a copy button");
        const state = await page.evaluate(() => {
          const input = document.getElementById("fid");
          const s = getComputedStyle(input);
          return {
            end: parseFloat(s.paddingInlineEnd),
            height: input.getBoundingClientRect().height,
          };
        });
        near(state.end, state.height + 4, "padding-inline-end", 0.5);
      },
    );
    await read(
      "input copy: a polite live region in the page before the copy, silent",
      async () => {
        const region = await page.evaluate(() => {
          const el = document.querySelector("[role=status][aria-live=polite]");
          return el ? el.textContent : null;
        });
        assert.equal(region, "");
      },
    );
    await read(
      "input copy: Tab from the field reaches it; Enter copies the value and says Copied, again on a second copy",
      async () => {
        await page.focus("#fid");
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            document.activeElement?.getAttribute("aria-label"),
          ),
          "Copy FID",
        );
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          () => document.querySelector("[role=status]")?.textContent,
          undefined,
          { timeout: 2000 },
        );
        const after = await page.evaluate(() => ({
          copied: window.controlProps.copied.slice(),
          said: document.querySelector("[role=status]").textContent,
          ring: getComputedStyle(document.activeElement).boxShadow,
        }));
        assert.deepEqual(after.copied, [
          "5f0c2a7e-91d4-4b1e-a0f3-6c8e2d1b9a47-0000",
        ]);
        assert.equal(after.said, "Copied");
        assert.notEqual(after.ring, "none", "its ring draws");
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          () =>
            document.querySelector("[role=status]")?.textContent !== "Copied",
        );
        assert.equal(
          await page.evaluate(
            () => document.querySelector("[role=status]").textContent,
          ),
          "Copied ",
          "a second copy changes the words",
        );
      },
    );
    await read(
      "input toggle: a pressed button with its own name; Space flips it, drawn as a disc of the theme fill, not a colour alone",
      async () => {
        const toggle = page.getByRole("button", { name: "Featured" });
        assert.equal(await toggle.count(), 1, "named Featured");
        assert.equal(await toggle.getAttribute("aria-pressed"), "false");
        const icon = await toggle.locator("svg").boundingBox();
        const button = await toggle.boundingBox();
        // A point on the disc, clear of the icon: 12 from the centre, along
        // the diagonal, inside the 32 disc and outside the 16 icon.
        const cx = button.x + button.width / 2;
        const cy = button.y + button.height / 2;
        const onDisc = [cx - 9, cy - 9];
        const [restDrawn] = await pixels(await page.screenshot(), [onDisc]);
        await page.focus("#name");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Space");
        assert.equal(await toggle.getAttribute("aria-pressed"), "true");
        await page.mouse.move(0, 0);
        await transitioned(toggle);
        await settleLayout(page);
        const fill = await resolve(page, "--primitives-colors-theme-500");
        const ink = await resolve(
          page,
          "--components-primary-buttons-themed-button-foreground-content-idle",
        );
        const disc = await toggle.evaluate((el) => {
          const s = getComputedStyle(el, "::before");
          return {
            background: s.backgroundColor,
            width: s.width,
            height: s.height,
            colour: getComputedStyle(el).color,
            field: getComputedStyle(el.previousElementSibling)
              .backgroundColor,
          };
        });
        assert.equal(disc.background, fill, "the disc: the theme fill");
        assert.equal(`${disc.width} ${disc.height}`, "32px 32px", "32 across");
        assert.equal(disc.colour, ink, "the icon: the fill's foreground");
        const field = rgb(disc.field);
        const lum = ([r, g, b]) =>
          [r, g, b]
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        const [hi, lo] = [lum(rgb(fill)), lum(field)].sort((a, b) => b - a);
        assert.ok(
          (hi + 0.05) / (lo + 0.05) >= 3,
          `the disc reads ${((hi + 0.05) / (lo + 0.05)).toFixed(2)}:1 on the field`,
        );
        const shot = await page.screenshot();
        const [drawn] = await pixels(shot, [onDisc]);
        assert.ok(
          distance(drawn, rgb(fill)) <= 3,
          `pressed, the disc is drawn: rgb(${drawn.slice(0, 3)})`,
        );
        assert.ok(
          distance(restDrawn, rgb(fill)) > 60,
          `at rest, no disc: rgb(${restDrawn.slice(0, 3)})`,
        );
        // The icon's stroke is drawn in the fill's foreground, on the disc.
        const points = [];
        for (let x = 0; x < icon.width; x += 1)
          points.push([icon.x + x, icon.y + icon.height / 2]);
        const strokes = await pixels(shot, points);
        assert.ok(
          strokes.some((p) => distance(p, rgb(ink)) <= 40),
          "the icon is drawn in the fill's foreground",
        );
        near(icon.width, 16, "the icon at 16", 0.5);
      },
    );
    await read(
      "input action: given or taken away, the same input keeps its focus and its typed value",
      async () => {
        await page.focus("#switch");
        await page.keyboard.type("Gate B12");
        await page.evaluate(() => {
          window.__switchInput = document.getElementById("switch");
        });
        for (const action of [{ kind: "copy" }, null, { kind: "copy" }, null]) {
          await page.evaluate(
            (action) => window.controlProps.setAction(action ?? undefined),
            action,
          );
          const state = await page.evaluate(() => {
            const input = document.getElementById("switch");
            return {
              same: input === window.__switchInput,
              focused: document.activeElement === input,
              value: input.value,
              button: !!input.parentElement.querySelector("button"),
            };
          });
          assert.deepEqual(
            state,
            { same: true, focused: true, value: "Gate B12", button: !!action },
            `after ${action ? "giving" : "taking"} the action`,
          );
        }
        // Without an action the field is laid out as it was: as wide as
        // FID's, its box unchanged.
        const plain = await box(page, "#switch");
        const fid = await box(page, "#fid");
        near(plain.width, fid.width, "as wide as a field with an action", 0.5);
      },
    );
  });
}
for (const m of [MATRIX[0], MATRIX[3]]) {
  await scenario({ ...m, part: "input", forced: true }, async (page, read) => {
    await read(
      "input toggle: pressed is a Highlight disc under HighlightText in forced colours",
      async () => {
        const toggle = page.getByRole("button", { name: "Featured" });
        await toggle.click();
        await page.mouse.move(0, 0);
        await transitioned(toggle);
        const state = await page.evaluate(() => {
          const system = (name) => {
            const probe = document.createElement("div");
            probe.style.cssText = `forced-color-adjust:none;color:${name}`;
            document.body.append(probe);
            const colour = getComputedStyle(probe).color;
            probe.remove();
            return colour;
          };
          const el = document.querySelector("[aria-pressed]");
          return {
            colour: getComputedStyle(el).color,
            disc: getComputedStyle(el, "::before").backgroundColor,
            highlight: system("Highlight"),
            highlightText: system("HighlightText"),
          };
        });
        assert.equal(state.disc, state.highlight, "the disc");
        assert.equal(state.colour, state.highlightText, "the icon");
      },
    );
  });
}

await browser.close();
if (failed.size) {
  console.error(`\nFAIL control props: ${failed.size} read(s) failed`);
  for (const [name, where] of failed)
    console.error(`  - ${name}: ${where.length} of ${attempts.get(name)}`);
  process.exit(1);
}
console.log(
  `\nPASS control props: ${reads} reads in light and dark, touch and compact, left to right and right to left; IconButton's counter (placed at every size, the theme fill drawn, read with the name in counterLabel's words after counterSeparator, with aria-labelledby too, outlined in forced colours), CardHeader's actions (at the end, on the title's line at any size, no taller, the title clear, in Tab order), Input's actions (the copy inside the field's end, the text clear of it, Enter copies and a polite region says so twice; the toggle pressed, named, a disc of the theme fill under the fill's foreground, a Highlight disc in forced colours; an action given or taken keeps the same input, its focus and its value)`,
);
