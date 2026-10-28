/**
 * The 0.15.0 layout props, on the built package in a real browser
 * (packages/react/tests/integration/layout-props-host.tsx), in light and
 * dark, touch and compact, left to right and right to left:
 *
 * - Navbar `navigationAlign` (GAP-196): at "start" the items sit 16 after the
 *   logo's inline end, at "end" 16 before the account, mirrored right to
 *   left; Tab walks the end-aligned items into the account with no jump
 *   across the bar.
 * - Sidebar `inset="flush"` (GAP-199): a rail's first item at the sidebar's
 *   top edge, and its focus ring, drawn inside it, whole there (read as
 *   pixels); with a header, the header at the edge and the item 16 under it;
 *   an expanded sidebar's first item 16 under the edge, its outer ring drawn
 *   above it, not cut by the scrolling navigation.
 * - Drawer `placement="inline"` (GAP-198, decision 139): floating in the
 *   region under the header, 16 from its top and side, 420 wide, as tall as
 *   its content up to 32 above the region's bottom (then it scrolls), the
 *   container's corners all round; the header uncovered, not hidden from
 *   readers, not inert and pressable. Not modal, it is a panel: its trigger
 *   moves focus in, the page's code does not; Tab and Shift+Tab leave it and
 *   come back; a press or Escape on the page leaves it open; Escape from
 *   inside closes it and the trigger has focus; closed by code, focus stays
 *   where the user put it. Modal and inline, its scrim covers the region
 *   alone.
 * - Tree `divided` (GAP-201), in a 440 panel whose content is 20 in, the
 *   tree's `bleed`: a 1px stroke in the border role under every row, outside
 *   its height (a row and its stroke, 41), running to the panel's edges while
 *   the row stays in the tree, read computed and as pixels; an open parent on
 *   background 50 to the panel's edges (computed and drawn); a selected open
 *   parent's fill rounded inside the tree, over the surface; the arrow keys
 *   move a focus ring drawn inside the row.
 *
 * Each read is recorded on its own, so a run lists every read that fails.
 * Reads named "guard" hold on main too: they pin what each prop must keep
 * (the defaults, and a ring or a key that must still work with the prop).
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-layout-props.mjs
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("layout-props-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
// WebKit, as Safari, tabs to links only with Option held.
const TAB = browser.browserType().name() === "webkit" ? "Alt+Tab" : "Tab";
/** Failed reads, by name, with the combinations they failed in. */
const failed = new Map();
/** How many times each read ran. */
const attempts = new Map();
let reads = 0;

const MATRIX = [];
for (const theme of ["light", "dark"])
  for (const density of ["touch", "compact"])
    for (const dir of ["ltr", "rtl"]) MATRIX.push({ theme, density, dir });
const label = ({ theme, density, dir }) => `${theme}, ${density}, ${dir}`;

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

/**
 * Mounts a part and runs its reads. `read(name, fn)` records a failure of
 * fn under its name and goes on to the next read.
 */
async function scenario(mount, run) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 700 },
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
    await page.emulateMedia({ colorScheme: mount.theme });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Layout props</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.layoutProps.mount(mount), mount);
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

// --- Navbar: navigationAlign (GAP-196) -------------------------------------

for (const m of MATRIX) {
  const rtl = m.dir === "rtl";
  await scenario(
    { ...m, part: "navbar", navigationAlign: "start" },
    async (page, read) => {
      await read("navbar start: the items 16 after the logo", async () => {
        const logo = await box(page, "#logo");
        const items = await box(page, "#items");
        near(
          rtl ? logo.left - items.right : items.left - logo.right,
          16,
          "logo to items",
        );
      });
    },
  );
  await scenario(
    { ...m, part: "navbar", navigationAlign: "end" },
    async (page, read) => {
      await read("navbar end: the items 16 before the account", async () => {
        const items = await box(page, "#items");
        const account = await box(page, "#account");
        near(
          rtl ? items.left - account.right : account.left - items.right,
          16,
          "items to account",
        );
      });
      // Keyboard: Maps, Analytics, Settings, Account, each stop next to the
      // last in the reading direction, never a jump across the bar.
      await read(
        "navbar end: Tab walks Maps, Analytics, Settings into the account, each stop next to the last",
        async () => {
          const stops = [];
          for (let i = 0; i < 4; i += 1) {
            await page.keyboard.press(TAB);
            stops.push(
              await page.evaluate(() => {
                const el = document.activeElement;
                const r = el.getBoundingClientRect();
                return {
                  text: el.textContent.trim(),
                  left: r.left,
                  right: r.right,
                };
              }),
            );
          }
          assert.deepEqual(
            stops.map((s) => s.text),
            ["Maps", "Analytics", "Settings", "Account"],
            "Tab order",
          );
          for (let i = 1; i < stops.length; i += 1) {
            const gap = rtl
              ? stops[i - 1].left - stops[i].right
              : stops[i].left - stops[i - 1].right;
            assert.ok(
              gap >= 0 && gap <= 16.5,
              `stop ${i} is ${gap.toFixed(1)} from the last`,
            );
          }
        },
      );
    },
  );
  await scenario(
    { ...m, part: "navbar", navigationAlign: "center" },
    async (page, read) => {
      await read(
        "guard: navbar center, the default, centres the items in a named landmark",
        async () => {
          const nav = await box(page, "nav");
          const items = await box(page, "#items");
          near(
            (items.left + items.right) / 2,
            (nav.left + nav.right) / 2,
            "items' centre",
          );
          const links = await page
            .getByRole("navigation", { name: "Main navigation" })
            .getByRole("link")
            .allTextContents();
          assert.deepEqual(links, ["Maps", "Analytics", "Settings"]);
        },
      );
    },
  );
}

// --- Sidebar: inset="flush" (GAP-199) ---------------------------------------

/**
 * The pixel at y, on the item's centre line, at rest and focused from the
 * keyboard: the ring is drawn there if they differ.
 */
const ringDrawn = async (page, selector, y) => {
  const item = await box(page, selector);
  const x = (item.left + item.right) / 2;
  await page.evaluate(() => document.activeElement?.blur());
  const before = await page.screenshot();
  await page.keyboard.press(TAB);
  const focused = await page.evaluate(() => document.activeElement?.id);
  await settleLayout(page);
  const after = await page.screenshot();
  const [[a], [b]] = [
    await pixels(before, [[x, y]]),
    await pixels(after, [[x, y]]),
  ];
  return { focused, change: distance(a, b) };
};

for (const m of MATRIX) {
  await scenario(
    { ...m, part: "sidebar", inset: "flush" },
    async (page, read) => {
      const sidebar = await box(page, "#sidebar");
      await read(
        "sidebar flush rail: the first item at the top edge",
        async () => {
          const first = await box(page, "#item-Home");
          near(first.top - sidebar.top, 0, "first item from the top", 0.5);
        },
      );
      await read(
        "sidebar flush rail: Tab reaches the first item, its ring drawn 1px under the edge",
        async () => {
          const ring = await ringDrawn(page, "#item-Home", sidebar.top + 1);
          assert.equal(ring.focused, "item-Home", "Tab reaches the first item");
          assert.ok(ring.change >= 60, `ring change ${ring.change}`);
        },
      );
      await read("guard: sidebar flush keeps the bottom's 24", async () => {
        assert.equal(
          await page.evaluate(
            () =>
              getComputedStyle(document.getElementById("sidebar"))
                .paddingBottom,
          ),
          "24px",
        );
      });
    },
  );
  await scenario(
    { ...m, part: "sidebar", inset: "flush", header: true },
    async (page, read) => {
      await read(
        "sidebar flush rail with a header: the header at the edge, the item 16 under it",
        async () => {
          const sidebar = await box(page, "#sidebar");
          const header = await box(page, "[data-slot=sidebar-header]");
          const first = await box(page, "#item-Home");
          near(header.top - sidebar.top, 0, "header from the top", 0.5);
          near(first.top - header.bottom, 16, "item under the header", 0.5);
        },
      );
    },
  );
  await scenario(
    { ...m, part: "sidebar", inset: "flush", variant: "expanded" },
    async (page, read) => {
      const sidebar = await box(page, "#sidebar");
      const first = await box(page, "#item-Home");
      await read(
        "sidebar flush expanded: the first item 16 under the edge",
        async () => near(first.top - sidebar.top, 16, "first item", 0.5),
      );
      await read(
        "guard: sidebar flush expanded: the first item's outer ring drawn above it, not cut",
        async () => {
          // ring-2 with a 2px offset: the ring's own pixels are 3px above.
          const ring = await ringDrawn(page, "#item-Home", first.top - 3);
          assert.equal(ring.focused, "item-Home", "Tab reaches the first item");
          assert.ok(ring.change >= 60, `ring change ${ring.change}`);
        },
      );
    },
  );
  await scenario({ ...m, part: "sidebar" }, async (page, read) => {
    await read(
      "guard: sidebar default, the first item 40 under the edge",
      async () => {
        const sidebar = await box(page, "#sidebar");
        const first = await box(page, "#item-Home");
        near(first.top - sidebar.top, 40, "first item", 0.5);
      },
    );
  });
}

// --- Drawer: placement="inline" (GAP-198) -----------------------------------

const outsideState = (page) =>
  page.evaluate(() => {
    const help = document.getElementById("help");
    const r = help.getBoundingClientRect();
    const hit = document.elementFromPoint(
      r.left + r.width / 2,
      r.top + r.height / 2,
    );
    return {
      hit: hit?.id ?? hit?.tagName,
      hidden: !!help.closest("[aria-hidden=true]"),
      inert: !!help.closest("[inert]"),
      bodyPointer: getComputedStyle(document.body).pointerEvents,
    };
  });

const settled = (page) =>
  page.waitForFunction(() =>
    document
      .getElementById("drawer")
      .getAnimations()
      .every((a) => a.playState !== "running"),
  );

const pageColour = async (page) =>
  rgb(
    await page.evaluate(
      () =>
        getComputedStyle(document.getElementById("surface")).backgroundColor,
    ),
  );

/** The drawer's place, size and corners, read as drawn. */
const drawerShape = (page) =>
  page.evaluate(() => {
    const el = document.getElementById("drawer");
    const style = getComputedStyle(el);
    const last = el.querySelector("#tall, #tour").getBoundingClientRect();
    return {
      box: el.getBoundingClientRect().toJSON(),
      corners: [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ],
      borders: [style.borderLeftWidth, style.borderRightWidth],
      paddingBottom: parseFloat(style.paddingBottom),
      lastBottom: last.bottom,
      scrolls: el.scrollHeight > el.clientHeight + 1,
      role: el.getAttribute("role"),
    };
  });
const inDrawer = (page) =>
  page.evaluate(() =>
    document.getElementById("drawer").contains(document.activeElement),
  );
const activeId = (page) =>
  page.evaluate(
    () => document.activeElement?.id || document.activeElement?.tagName,
  );

for (const m of MATRIX) {
  await scenario(
    { ...m, part: "drawer", placement: "inline" },
    async (page, read) => {
      await page.focus("#trigger");
      await page.keyboard.press("Enter");
      await page.locator("#drawer").waitFor();
      await settled(page);
      await settleLayout(page);
      await read(
        "drawer inline: floats in the region, 16 from the top and its side, 420 wide, as tall as its content, the container's corners all round",
        async () => {
          const region = await box(page, "#region");
          const header = await box(page, "#header-bar");
          const shape = await drawerShape(page);
          assert.equal(
            await page.evaluate(
              () => !!document.querySelector("#region #drawer"),
            ),
            true,
            "drawn in place, in the region",
          );
          assert.ok(shape.box.top >= header.bottom - 0.5, "below the header");
          near(
            shape.box.top,
            region.top + 16,
            "16 under the region's top",
            0.5,
          );
          near(shape.box.right, region.right - 16, "16 from its side", 0.5);
          near(shape.box.width, 420, "420 wide", 0.5);
          near(
            shape.box.bottom,
            shape.lastBottom + shape.paddingBottom,
            "as tall as its content",
            1,
          );
          assert.ok(
            shape.box.bottom < region.bottom - 32,
            "short of the region's bottom",
          );
          assert.deepEqual(shape.corners, ["20px", "20px", "20px", "20px"]);
          assert.deepEqual(
            shape.borders,
            ["1px", "0px"],
            "the border on its inner side",
          );
          assert.equal(shape.role, "complementary", "a panel, not a dialog");
        },
      );
      await read(
        "drawer inline: the header uncovered, not hidden from readers, not inert, the page taking presses",
        async () =>
          assert.deepEqual(await outsideState(page), {
            hit: "help",
            hidden: false,
            inert: false,
            bodyPointer: "auto",
          }),
      );
      await read(
        "drawer inline: its trigger moved focus in; Tab and Shift+Tab leave it and come back, and it stays open; Escape from inside closes it and the trigger has focus",
        async () => {
          assert.equal(
            await activeId(page),
            "tour",
            "Enter on its trigger moved focus in",
          );
          await page.keyboard.press(TAB);
          assert.equal(await inDrawer(page), true, "the close, still inside");
          await page.keyboard.press(TAB);
          assert.equal(await activeId(page), "after", "Tab left it");
          await page.keyboard.press(`Shift+${TAB}`);
          assert.equal(await inDrawer(page), true, "Shift+Tab came back");
          assert.equal(
            await page.locator("#drawer").getAttribute("data-state"),
            "open",
            "open as focus left it",
          );
          await page.keyboard.press("Escape");
          await page.locator("#drawer").waitFor({ state: "detached" });
          assert.equal(await activeId(page), "trigger");
        },
      );
      await read(
        "drawer inline: a press on the header reaches it and leaves the drawer open; Escape from the page leaves it open",
        async () => {
          await page.click("#trigger");
          await page.locator("#drawer").waitFor();
          await settled(page);
          await page.mouse.click(
            ...(await page.evaluate(() => {
              const r = document.getElementById("help").getBoundingClientRect();
              return [r.left + r.width / 2, r.top + r.height / 2];
            })),
          );
          assert.equal(
            await page.evaluate(() => window.layoutProps.counts.help),
            1,
          );
          await page.focus("#search");
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
          assert.equal(
            await page.locator("#drawer").getAttribute("data-state"),
            "open",
          );
        },
      );
    },
  );
  await scenario(
    { ...m, part: "drawer", placement: "inline" },
    async (page, read) => {
      await page.focus("#search");
      await page.keyboard.type("gate");
      await page.evaluate(() => window.layoutProps.drawer.setOpen(true));
      await page.locator("#drawer").waitFor();
      await settled(page);
      await read(
        "drawer inline: opened by the page's code, it leaves focus in the page's field",
        async () => {
          assert.equal(await activeId(page), "search");
          await page.keyboard.type(" b");
          assert.equal(await page.inputValue("#search"), "gate b");
        },
      );
      await read(
        "drawer inline: closed by the page's code, focus stays where the user put it",
        async () => {
          await page.evaluate(() => window.layoutProps.drawer.setOpen(false));
          await page.locator("#drawer").waitFor({ state: "detached" });
          await page.waitForTimeout(50);
          assert.equal(await activeId(page), "search");
        },
      );
    },
  );
  await scenario(
    { ...m, part: "drawer", placement: "inline", tall: true },
    async (page, read) => {
      await page.evaluate(() => window.layoutProps.drawer.setOpen(true));
      await page.locator("#drawer").waitFor();
      await settled(page);
      await settleLayout(page);
      await read(
        "drawer inline: content taller than the region stops 16 under its top and 32 above its bottom, and scrolls",
        async () => {
          const region = await box(page, "#region");
          const shape = await drawerShape(page);
          near(shape.box.top, region.top + 16, "16 under the top", 0.5);
          near(
            shape.box.bottom,
            region.bottom - 32,
            "32 above the bottom",
            0.5,
          );
          assert.equal(shape.scrolls, true, "it scrolls");
        },
      );
    },
  );
  await scenario(
    { ...m, part: "drawer", placement: "inline", modal: true },
    async (page, read) => {
      await page.click("#trigger");
      await page.locator("#drawer").waitFor();
      await settled(page);
      await settleLayout(page);
      // The modal takes the page's pointer events, so the scrim is read by
      // its box, and as drawn: the header's pixels are the page's.
      await read(
        "drawer inline and modal: the scrim in the region, its box the region's",
        async () => {
          const scrim = await page.evaluate(() => {
            const el = document.querySelector(".bg-overlay-scrim");
            return el
              ? {
                  box: el.getBoundingClientRect().toJSON(),
                  inRegion: !!el.closest("#region"),
                }
              : null;
          });
          const region = await box(page, "#region");
          assert.ok(scrim, "a scrim");
          assert.equal(scrim.inRegion, true, "drawn in the region");
          for (const side of ["top", "right", "bottom", "left"])
            near(scrim.box[side], region[side], `its ${side}`, 0.5);
        },
      );
      await read(
        "drawer inline and modal: the scrim is not over the header",
        async () => {
          // The scrim takes the pointer (Radix gives it pointer-events: auto
          // while the page has none), so what is on top at the header's
          // middle is never the scrim unless it covers the header. A dim
          // over a black page draws nothing, so this is not read as pixels.
          const covered = await page.evaluate(() => {
            const r = document
              .getElementById("header-bar")
              .getBoundingClientRect();
            const hit = document.elementFromPoint(
              (r.left + r.right) / 2,
              r.top + r.height / 2,
            );
            return !!hit?.classList.contains("bg-overlay-scrim");
          });
          assert.equal(covered, false);
        },
      );
    },
  );
  await scenario({ ...m, part: "drawer" }, async (page, read) => {
    await page.click("#trigger");
    await page.locator("#drawer").waitFor();
    await settled(page);
    await read(
      "guard: drawer fixed, the default, covers the window, the page hidden from readers",
      async () => {
        const drawer = await box(page, "#drawer");
        near(drawer.top, 0, "the drawer's top at the window's", 0.5);
        assert.equal((await outsideState(page)).hidden, true);
      },
    );
  });
}

// --- Tree: divided (GAP-201) ------------------------------------------------

const rows = (page) =>
  page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--semantics-border-subtle)";
    probe.style.backgroundColor = "var(--primitives-colors-background-50)";
    probe.style.outlineColor = "var(--primitives-colors-background-100)";
    document.getElementById("tree").append(probe);
    const tokens = {
      border: getComputedStyle(probe).color,
      surface: getComputedStyle(probe).backgroundColor,
      muted: getComputedStyle(probe).outlineColor,
    };
    probe.remove();
    return {
      tokens,
      rows: [...document.querySelectorAll("[role=treeitem]")].map((row) => {
        const s = getComputedStyle(row);
        const divider = row.parentElement.matches("[data-tree-divider]")
          ? row.parentElement
          : null;
        const d = divider && getComputedStyle(divider);
        return {
          name: row.textContent.trim(),
          box: row.getBoundingClientRect().toJSON(),
          borderBottom: s.borderBottomWidth,
          radius: s.borderTopLeftRadius,
          background: s.backgroundColor,
          divider: divider && {
            box: divider.getBoundingClientRect().toJSON(),
            borderBottom: `${d.borderBottomWidth} ${d.borderBottomStyle} ${d.borderBottomColor}`,
            borderTop: d.borderTopWidth,
            background: d.backgroundColor,
          },
        };
      }),
    };
  });

for (const m of MATRIX) {
  await scenario({ ...m, part: "tree", divided: true }, async (page, read) => {
    const state = await rows(page);
    const shot = await page.screenshot();
    const tree = await box(page, "#tree");
    const panel = await box(page, "#panel");
    const page0 = await pageColour(page);
    await read(
      "tree divided: each row as tall as undivided, its 1px stroke under it in the border role, running to the panel's edges",
      async () => {
        for (const row of state.rows) {
          assert.ok(row.divider, `${row.name} has its stroke's box`);
          // One line of text: the row's own minimum height, the stroke
          // outside it.
          near(row.box.height, 40, `${row.name}'s row`, 0.5);
          near(row.divider.box.height, 41, `${row.name} and its stroke`, 0.5);
          assert.equal(
            row.borderBottom,
            "0px",
            `${row.name}: no stroke inside`,
          );
          assert.equal(
            row.divider.borderBottom,
            `1px solid ${state.tokens.border}`,
            `${row.name}'s stroke`,
          );
          assert.equal(row.divider.borderTop, "0px", `${row.name}: none above`);
          near(
            row.divider.box.left,
            panel.left,
            `${row.name}'s stroke start`,
            0.5,
          );
          near(
            row.divider.box.right,
            panel.right,
            `${row.name}'s stroke end`,
            0.5,
          );
          // The row's content stays in the tree, 20 in from the panel.
          near(row.box.left, tree.left, `${row.name}'s row start`, 0.5);
          near(row.box.right, tree.right, `${row.name}'s row end`, 0.5);
        }
        near(tree.left, panel.left + 20, "the tree 20 in", 0.5);
      },
    );
    // Drawn: each stroke's pixel line is the border colour, at the middle
    // and at the panel's two edges, past the tree.
    await read(
      "tree divided: every stroke drawn to the panel's edges",
      async () => {
        for (const row of state.rows) {
          const y = row.divider.box.bottom - 0.5;
          const points = await pixels(shot, [
            [(panel.left + panel.right) / 2, y],
            [panel.left + 1, y],
            [panel.right - 2, y],
          ]);
          for (const p of points)
            assert.ok(
              distance(p, rgb(state.tokens.border)) <= 3,
              `${row.name}: rgb(${p.slice(0, 3)})`,
            );
        }
      },
    );
    await read(
      "tree divided: an open parent on background 50 to the panel's edges, computed and drawn; a leaf on the page",
      async () => {
        const open = state.rows.find((r) => r.name.startsWith("Terminal A"));
        const leaf = state.rows.find((r) => r.name.startsWith("Car park"));
        assert.equal(open.divider.background, state.tokens.surface, "computed");
        const middle = open.box.top + open.box.height / 2;
        const [edge, inside, leafPixel] = await pixels(shot, [
          [panel.left + 4, middle],
          [open.box.right - 4, middle],
          [leaf.box.right - 4, leaf.box.top + leaf.box.height / 2],
        ]);
        for (const p of [edge, inside])
          assert.ok(
            distance(p, rgb(state.tokens.surface)) <= 2,
            `drawn: rgb(${p.slice(0, 3)})`,
          );
        assert.ok(distance(leafPixel, page0) <= 2, "a leaf on the page");
        if (m.theme === "light")
          assert.ok(distance(edge, page0) >= 8, "off the page");
      },
    );
    await read(
      "tree divided: ArrowDown moves a focus ring drawn inside the row, whole inside the panel, its stroke kept",
      async () => {
        await page.locator("[role=treeitem]").first().focus();
        await page.keyboard.press("ArrowDown");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          const s = getComputedStyle(el);
          return {
            name: el.textContent.trim(),
            ring: s.boxShadow,
            box: el.getBoundingClientRect().toJSON(),
            stroke: getComputedStyle(el.parentElement).borderBottomWidth,
          };
        });
        assert.ok(focused.name.startsWith("Level 1"), focused.name);
        assert.match(focused.ring, /inset/, "the ring is drawn inside the row");
        assert.ok(
          focused.box.left >= panel.left + 20 - 0.5,
          "inside the panel's padding",
        );
        assert.equal(focused.stroke, "1px", "the stroke stays");
        const ring = await page.screenshot();
        const [p] = await pixels(ring, [
          [focused.box.left + 1, focused.box.top + focused.box.height / 2],
        ]);
        assert.ok(
          distance(p, page0) >= 40,
          `the ring drawn: rgb(${p.slice(0, 3)})`,
        );
      },
    );
  });
  await scenario(
    { ...m, part: "tree", divided: true, selectedId: "terminal-a" },
    async (page, read) => {
      const state = await rows(page);
      const shot = await page.screenshot();
      const panel = await box(page, "#panel");
      const open = state.rows.find((r) => r.name.startsWith("Terminal A"));
      await read(
        "tree divided: a selected open parent keeps its rounded fill inside the tree, over the surface, its stroke kept",
        async () => {
          assert.equal(
            open.background,
            state.tokens.muted,
            "the selected fill",
          );
          assert.equal(open.radius, "16px", "rounded");
          assert.equal(open.divider.background, state.tokens.surface);
          assert.equal(
            open.divider.borderBottom,
            `1px solid ${state.tokens.border}`,
          );
          const middle = open.box.top + open.box.height / 2;
          const [fill, edge, corner] = await pixels(shot, [
            [(open.box.left + open.box.right) / 2, middle],
            [panel.left + 4, middle],
            [open.box.left + 1, open.box.top + 1],
          ]);
          assert.ok(
            distance(fill, rgb(state.tokens.muted)) <= 2,
            `fill rgb(${fill.slice(0, 3)})`,
          );
          for (const p of [edge, corner])
            assert.ok(
              distance(p, rgb(state.tokens.surface)) <= 2,
              `the surface round it: rgb(${p.slice(0, 3)})`,
            );
        },
      );
    },
  );
  await scenario({ ...m, part: "tree" }, async (page, read) => {
    const state = await rows(page);
    await read(
      "guard: tree not divided, rounded rows, no stroke, a named tree",
      async () => {
        for (const row of state.rows) {
          assert.equal(row.borderBottom, "0px", row.name);
          assert.equal(row.divider, null, row.name);
          assert.equal(row.radius, "16px", row.name);
        }
        assert.equal(
          await page.getByRole("tree", { name: "Map content" }).count(),
          1,
        );
      },
    );
  });
}

await browser.close();
if (failed.size) {
  console.error(`\nFAIL layout props: ${failed.size} read(s) failed`);
  for (const [name, where] of failed)
    console.error(`  - ${name}: ${where.length} of ${attempts.get(name)}`);
  process.exit(1);
}
console.log(
  `\nPASS layout props: ${reads} reads in light and dark, touch and compact, left to right and right to left; Navbar's navigation at the start and end (Tab walking into the account), Sidebar flush (a rail's first item and its ring at the edge, a header at the edge, an expanded sidebar's ring whole), Drawer inline (floating in the region, as tall as its content, the header uncovered, read and pressable; a panel, not a dialog, for focus, Tab, presses and Escape; modal, the scrim on the region alone), Tree divided (strokes under the rows to the panel's edges, computed and drawn, the open parent's surface, the selected fill rounded over it, an inset focus ring), and the defaults and keys kept`,
);
