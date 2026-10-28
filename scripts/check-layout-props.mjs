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
 * - Drawer `placement="inline"` (GAP-198): drawn in the region under the
 *   header, top to bottom of it, at its side; the header uncovered, not
 *   hidden from readers, not inert and pressable; Enter opens it and moves
 *   focus in, Escape closes it and focus returns to the trigger. Modal and
 *   inline, its scrim covers the region alone.
 * - Tree `divided` (GAP-201): a 1px stroke in the border role under every
 *   row, read computed and as pixels, square rows, an open parent on
 *   background 50 (computed and drawn), a selected open parent on the
 *   selected fill; the arrow keys move a focus ring that draws on a divided
 *   row.
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
        "drawer inline: drawn in the region, under the header, top to bottom of it, at its side",
        async () => {
          const region = await box(page, "#region");
          const header = await box(page, "#header-bar");
          const drawer = await box(page, "#drawer");
          assert.equal(
            await page.evaluate(
              () => !!document.querySelector("#region #drawer"),
            ),
            true,
            "drawn in place, in the region",
          );
          near(drawer.top, region.top, "top at the region's", 0.5);
          assert.ok(drawer.top >= header.bottom - 0.5, "below the header");
          near(drawer.bottom, region.bottom, "bottom at the region's", 0.5);
          near(drawer.right, region.right, "at the region's side", 0.5);
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
        "guard: drawer inline: Enter moved focus in, Tab cycles within it, Escape closes it and returns focus to the trigger",
        async () => {
          assert.ok(
            await page.evaluate(() =>
              document
                .getElementById("drawer")
                .contains(document.activeElement),
            ),
            "Enter opened it and moved focus in",
          );
          // Tab cycles within it, as in any Radix dialog, modal or not.
          for (let n = 0; n < 4; n += 1) await page.keyboard.press("Tab");
          assert.ok(
            await page.evaluate(() =>
              document
                .getElementById("drawer")
                .contains(document.activeElement),
            ),
            "Tab cycles within it",
          );
          await page.keyboard.press("Escape");
          await page.locator("#drawer").waitFor({ state: "detached" });
          assert.equal(
            await page.evaluate(() => document.activeElement?.id),
            "trigger",
          );
        },
      );
      await read(
        "drawer inline: a press on the header, the drawer open, reaches it and closes the drawer",
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
          // A press outside closes it, as any non-modal dialog.
          await page.locator("#drawer").waitFor({ state: "detached" });
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
        return {
          name: row.textContent.trim(),
          box: row.getBoundingClientRect().toJSON(),
          borderBottom: `${s.borderBottomWidth} ${s.borderBottomStyle} ${s.borderBottomColor}`,
          borderTop: s.borderTopWidth,
          radius: s.borderTopLeftRadius,
          background: s.backgroundColor,
        };
      }),
    };
  });

for (const m of MATRIX) {
  await scenario({ ...m, part: "tree", divided: true }, async (page, read) => {
    const state = await rows(page);
    const shot = await page.screenshot();
    const tree = await box(page, "#tree");
    const page0 = await pageColour(page);
    await read(
      "tree divided: a 1px stroke in the border role under every row, none above, square rows",
      async () => {
        for (const row of state.rows) {
          assert.equal(
            row.borderBottom,
            `1px solid ${state.tokens.border}`,
            `${row.name}'s stroke`,
          );
          assert.equal(row.borderTop, "0px", `${row.name}: no top stroke`);
          assert.equal(row.radius, "0px", `${row.name} is square`);
        }
      },
    );
    // Drawn: each row's last pixel line is the border colour, at its
    // middle and at the tree's two edges.
    await read("tree divided: every stroke drawn, edge to edge", async () => {
      for (const row of state.rows) {
        const y = row.box.bottom - 0.5;
        const points = await pixels(shot, [
          [(row.box.left + row.box.right) / 2, y],
          [tree.left + 1, y],
          [tree.right - 2, y],
        ]);
        for (const p of points)
          assert.ok(
            distance(p, rgb(state.tokens.border)) <= 3,
            `${row.name}: rgb(${p.slice(0, 3)})`,
          );
      }
    });
    await read(
      "tree divided: an open parent on background 50, computed and drawn; a leaf on the page",
      async () => {
        const open = state.rows.find((r) => r.name.startsWith("Terminal A"));
        const leaf = state.rows.find((r) => r.name.startsWith("Car park"));
        assert.equal(open.background, state.tokens.surface, "computed");
        const [surfacePixel, leafPixel] = await pixels(shot, [
          [open.box.right - 4, open.box.top + 4],
          [leaf.box.right - 4, leaf.box.top + 4],
        ]);
        assert.ok(
          distance(surfacePixel, rgb(state.tokens.surface)) <= 2,
          `drawn: rgb(${surfacePixel.slice(0, 3)})`,
        );
        assert.ok(distance(leafPixel, page0) <= 2, "a leaf on the page");
        if (m.theme === "light")
          assert.ok(distance(surfacePixel, page0) >= 8, "off the page");
      },
    );
    await read(
      "tree divided: ArrowDown moves a focus ring that draws on a divided row, its stroke kept",
      async () => {
        await page.locator("[role=treeitem]").first().focus();
        await page.keyboard.press("ArrowDown");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          const s = getComputedStyle(el);
          return {
            name: el.textContent.trim(),
            ring: s.boxShadow,
            stroke: s.borderBottomWidth,
          };
        });
        assert.ok(focused.name.startsWith("Level 1"), focused.name);
        assert.notEqual(focused.ring, "none", "the focus ring draws");
        assert.equal(focused.stroke, "1px", "the stroke stays");
      },
    );
  });
  await scenario(
    { ...m, part: "tree", divided: true, selectedId: "terminal-a" },
    async (page, read) => {
      const state = await rows(page);
      const open = state.rows.find((r) => r.name.startsWith("Terminal A"));
      await read(
        "tree divided: a selected open parent on the selected fill, its stroke kept",
        async () => {
          assert.equal(open.background, state.tokens.muted, "background 100");
          assert.equal(open.borderBottom, `1px solid ${state.tokens.border}`);
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
          assert.equal(row.borderBottom.split(" ")[0], "0px", row.name);
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
  `\nPASS layout props: ${reads} reads in light and dark, touch and compact, left to right and right to left; Navbar's navigation at the start and end (Tab walking into the account), Sidebar flush (a rail's first item and its ring at the edge, a header at the edge, an expanded sidebar's ring whole), Drawer inline (in the region, the header uncovered, read and pressable; modal, the scrim on the region alone), Tree divided (strokes computed and drawn, square rows, the open parent's surface, the selected fill, a focus ring), and the defaults and keys kept`,
);
