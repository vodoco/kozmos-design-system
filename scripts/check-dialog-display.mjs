/**
 * 0.17.0's Dialog and type parts in a browser, from the built package, run
 * twice as check-owned-css.mjs runs: with style.css as built, and with every
 * @scope rule removed, so what each promises holds where a host drops the
 * utility layer. ADAPTIVE_BROWSER picks the engine.
 *
 * - DialogContent `size="full"` (decision 202, GAP-259): the window less 16
 *   on each side; the header keeps its height and the next child takes the
 *   rest, the gap between them the dialog's 24.
 * - ImageField's preview (CLOUD-UI-004), with dashboard.css: the same full
 *   Dialog, its image as large as it fits inside, with no class of its own.
 * - DialogHeader's media (decision 195, GAP-214): inside the 24 of padding,
 *   16 over the title; bled, to the dialog's edges and top corners inside its
 *   1 edge, rounded by the dialog's corner, with the close still in its
 *   place and above it. Unnamed media is hidden; named, it is one image.
 * - Text and Heading's display size (decision 203, GAP-272): 48 on 54 lines,
 *   bold, no added tracking, in rem (60 on 67.5 at a 20px root); a weight
 *   given beside it wins.
 * - DialogTitle's spacing (GAP-275): 8 over a one-line title and none under
 *   it, 36 tall at least, so its description sits 8 under the title's line
 *   and starts where the close's 44 target ends. The title's box is
 *   utilities, which a host without @scope drops, so this holds with style.css
 *   as built.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   node scripts/check-dialog-display.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("dialog-display-host.tsx");
const dashboardCss = fs.readFileSync(
  path.join(process.cwd(), "packages/react/dist/dashboard.css"),
  "utf8",
);
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const unscoped = require("postcss").parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

const VIEWPORT = { width: 1000, height: 700 };
const TOLERANCE = 0.5;
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
let passed = 0;

async function scenario(name, { mode, root }, run) {
  const label = `${name} (${mode})`;
  const page = await browser.newPage({
    viewport: VIEWPORT,
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setContent(
      `<!doctype html><html lang="en"${root ? ` style="font-size:${root}px"` : ""}><head><title>Dialog</title><style>body{margin:0}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addStyleTag({
      content: mode === "full" ? css : unscoped.toString(),
    });
    await page.addStyleTag({ content: dashboardCss });
    await page.addScriptTag({ content: code });
    await run(page);
    assert.deepEqual(errors, [], "no page errors");
    passed += 1;
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push(label);
    console.error(`FAIL ${label}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

const near = (a, b, what, tolerance = TOLERANCE) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${what}: ${b}, read ${a}`);

/** Mounts a case, waits for any dialog to finish arriving, and reads boxes. */
async function mount(page, name) {
  await page.evaluate((name) => window.dialogDisplay.mount(name), name);
  await settleLayout(page);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running"),
  );
}

const boxOf = (page, selector) =>
  page
    .locator(selector)
    .first()
    .evaluate((node) => {
      const r = node.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    });

function assertFullWindow(dialog, label) {
  near(dialog.left, 16, `${label}: 16 from the window's start`);
  near(dialog.top, 16, `${label}: 16 from the window's top`);
  near(
    dialog.width,
    VIEWPORT.width - 32,
    `${label}: the window's width less 32`,
  );
  near(
    dialog.height,
    VIEWPORT.height - 32,
    `${label}: the window's height less 32`,
  );
}

/**
 * The title 16 under the media: the header's 8 and the media's own 8. The
 * header's gap and the title's box are utilities, which a host without
 * @scope drops (and the h2's margin with them), so there the media's own 8
 * is what is promised.
 */
async function assertUnderMedia(page, mode, media, title) {
  if (mode === "full") {
    near(title.top - media.bottom, 16, "the title 16 under the media");
    return;
  }
  const margin = await page
    .locator(".kozmos-dialog-media")
    .evaluate((node) => getComputedStyle(node).marginBottom);
  assert.equal(margin, "8px", "the media keeps its own 8 under it");
}

for (const mode of ["full", "without-scope"]) {
  await scenario(
    "size full: the window less 16 each side, the body takes the rest",
    { mode },
    async (page) => {
      await mount(page, "full");
      const dialog = await boxOf(page, '[data-testid="dialog"]');
      const header = await boxOf(page, '[data-testid="header"]');
      const body = await boxOf(page, '[data-testid="body"]');
      assertFullWindow(dialog, "the full dialog");
      // 1 edge and 24 inside; the body 24 under the header, to the bottom.
      near(header.top, dialog.top + 25, "the header 24 inside the edge");
      near(body.top, header.bottom + 24, "the body 24 under the header");
      near(
        body.bottom,
        dialog.bottom - 25,
        "the body reaches the padding's end",
      );
      near(
        body.width,
        dialog.width - 50,
        "the body as wide as the padding allows",
      );
      // The header keeps its own height: a title and one line of description.
      assert.ok(
        header.height < 120,
        `the header keeps its height, read ${header.height}`,
      );
      // Close and focus as any Dialog's: the close button is there, and the
      // dialog holds focus.
      assert.equal(
        await page.getByRole("button", { name: "Close" }).count(),
        1,
        "its close",
      );
      assert.ok(
        await page.evaluate(() =>
          document
            .querySelector('[role="dialog"]')
            .contains(document.activeElement),
        ),
        "focus is inside the dialog",
      );
    },
  );

  await scenario(
    "ImageField's preview opens in Dialog's full size, its image fitted",
    { mode },
    async (page) => {
      await mount(page, "image-field");
      await page.getByRole("button", { name: "Preview image 1" }).click();
      await page.getByRole("dialog", { name: "Image 1" }).waitFor();
      await settleLayout(page);
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every((animation) => animation.playState !== "running"),
      );
      const read = await page
        .getByRole("dialog", { name: "Image 1" })
        .evaluate((dialog) => {
          const box = (node) => {
            const r = node.getBoundingClientRect();
            return {
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
              width: r.width,
              height: r.height,
            };
          };
          const image = dialog.querySelector("img");
          return {
            dialog: box(dialog),
            header: box(dialog.firstElementChild),
            image: box(image),
            fit: getComputedStyle(image).objectFit,
            classes: dialog.className,
            size: dialog.dataset.size,
          };
        });
      assertFullWindow(read.dialog, "the preview");
      assert.equal(read.size, "full", "the preview is Dialog's full size");
      assert.ok(
        !read.classes.includes("kozmos-image-field-preview "),
        `no class of its own: ${read.classes}`,
      );
      near(
        read.image.top,
        read.header.bottom + 24,
        "the image 24 under the header",
      );
      near(
        read.image.bottom,
        read.dialog.bottom - 25,
        "the image takes the rest",
      );
      near(
        read.image.width,
        read.dialog.width - 50,
        "the image as wide as the padding allows",
      );
      assert.equal(read.fit, "contain", "the picture fits inside, whole");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "detached" });
      const back = await page
        .waitForFunction(
          () =>
            document.activeElement?.getAttribute("aria-label") ===
            "Preview image 1",
          undefined,
          { timeout: 3000 },
        )
        .then(() => true)
        .catch(() => false);
      assert.ok(
        back,
        `Escape closes it and focus goes back, read ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 120))}`,
      );
    },
  );

  await scenario(
    "DialogHeader's media inside the padding, 16 over the title, decorative",
    { mode },
    async (page) => {
      await mount(page, "media");
      const dialog = await boxOf(page, '[data-testid="dialog"]');
      const media = await boxOf(page, ".kozmos-dialog-media");
      const title = await boxOf(page, '[role="dialog"] h2');
      near(media.left, dialog.left + 25, "the media 24 inside the edge");
      near(media.top, dialog.top + 25, "the media 24 under the top edge");
      near(media.width, dialog.width - 50, "the media across the padding");
      await assertUnderMedia(page, mode, media, title);
      assert.equal(
        await page.locator(".kozmos-dialog-media").getAttribute("aria-hidden"),
        "true",
        "unnamed media is hidden",
      );
    },
  );

  await scenario(
    "DialogHeader's media bled to the edges and top corners, the close above it",
    { mode },
    async (page) => {
      await mount(page, "media-bleed");
      const dialog = await boxOf(page, '[data-testid="dialog"]');
      const media = await boxOf(page, ".kozmos-dialog-media");
      const title = await boxOf(page, '[role="dialog"] h2');
      near(
        media.left,
        dialog.left + 1,
        "the media from the start edge, inside the 1 edge",
      );
      near(media.right, dialog.right - 1, "to the end edge");
      near(media.top, dialog.top + 1, "from the top edge");
      await assertUnderMedia(page, mode, media, title);
      near(title.left, dialog.left + 25, "the title keeps the padding");
      const read = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const media = dialog.querySelector(".kozmos-dialog-media");
        const close = dialog.querySelector(".kozmos-dialog-close");
        const c = close.getBoundingClientRect();
        const d = dialog.getBoundingClientRect();
        const hit = document.elementFromPoint(
          c.left + c.width / 2,
          c.top + c.height / 2,
        );
        // The dialog's corner, just inside its top start, over the media: the
        // dialog's own surface shows there, not the picture, so the corner
        // rounds it.
        return {
          close: {
            top: c.top - d.top,
            end: d.right - c.right,
            width: c.width,
            height: c.height,
          },
          closeOnTop: !!hit && close.contains(hit),
          radius: getComputedStyle(media).borderTopLeftRadius,
          dialogRadius: getComputedStyle(dialog).borderTopLeftRadius,
          name: media.getAttribute("aria-label"),
          role: media.getAttribute("role"),
          hidden: media.getAttribute("aria-hidden"),
        };
      });
      // 24 inside the 1 edge, as in any Dialog.
      near(read.close.top, 25, "the close 24 inside the top edge");
      near(read.close.end, 25, "and 24 inside the end edge");
      near(read.close.width, 44, "its 44 target");
      assert.ok(
        read.closeOnTop,
        "the close is above the media: a press lands on it",
      );
      near(
        parseFloat(read.radius),
        parseFloat(read.dialogRadius) - 1,
        "the media's top corners follow the dialog's, inside its edge",
      );
      assert.equal(read.role, "img", "named media is one image");
      assert.equal(
        read.name,
        "Charts rising over a floor plan",
        "named as given",
      );
      assert.equal(read.hidden, null, "and not hidden");
    },
  );

  if (mode === "full")
    await scenario(
      "DialogTitle: a one-line title's description 8 under it, where the close's 44 ends",
      { mode },
      async (page) => {
        await mount(page, "title");
        const read = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const title = dialog.querySelector("h2");
          const description = dialog.querySelector(
            '[data-testid="description"]',
          );
          const close = dialog.querySelector(".kozmos-dialog-close");
          const s = getComputedStyle(title);
          const t = title.getBoundingClientRect();
          const c = close.getBoundingClientRect();
          return {
            // The bottom of the title's one line box: its top, its padding
            // over the words and one line.
            lineBottom:
              t.top + parseFloat(s.paddingTop) + parseFloat(s.lineHeight),
            lines: Math.round(
              (t.height -
                parseFloat(s.paddingTop) -
                parseFloat(s.paddingBottom)) /
                parseFloat(s.lineHeight),
            ),
            descriptionTop: description.getBoundingClientRect().top,
            close: { bottom: c.bottom, width: c.width, height: c.height },
          };
        });
        assert.equal(read.lines, 1, "the title is one line");
        near(
          read.descriptionTop - read.lineBottom,
          8,
          "the description 8 under the title's line",
          1,
        );
        near(read.close.width, 44, "the close's 44 target, wide");
        near(read.close.height, 44, "and tall");
        near(
          read.descriptionTop,
          read.close.bottom,
          "the description starts where the close's target ends",
        );
      },
    );

  for (const root of [undefined, 20])
    await scenario(
      `Text and Heading's display size${root ? ", at a 20px root" : ""}`,
      { mode, root },
      async (page) => {
        await mount(page, "display");
        const scale = (root ?? 16) / 16;
        const read = await page.evaluate(() => {
          const style = (id) => {
            const s = getComputedStyle(
              document.querySelector(`[data-testid="${id}"]`),
            );
            return {
              size: parseFloat(s.fontSize),
              line: parseFloat(s.lineHeight),
              weight: s.fontWeight,
              tracking: s.letterSpacing,
              tag: document.querySelector(`[data-testid="${id}"]`).tagName,
            };
          };
          return {
            text: style("text"),
            normal: style("text-normal"),
            heading: style("heading"),
          };
        });
        for (const [id, expectWeight] of [
          ["text", "700"],
          ["heading", "700"],
          ["normal", "400"],
        ]) {
          const it = read[id];
          near(it.size, 48 * scale, `${id}: the display size`);
          near(it.line, 54 * scale, `${id}: on its line`);
          assert.equal(it.weight, expectWeight, `${id}: weight`);
          assert.ok(
            it.tracking === "normal" || parseFloat(it.tracking) === 0,
            `${id}: no added tracking, read ${it.tracking}`,
          );
        }
        assert.equal(read.heading.tag, "H1", "the heading keeps its rank");
      },
    );
}

await browser.close();
if (failures.length) {
  console.error(
    `\n${failures.length} Dialog and display scenario(s) failed in ${engine}: ${failures.join("; ")}`,
  );
  process.exit(1);
}
console.log(`\nDialog and display: ${passed} scenarios passed in ${engine}.`);
