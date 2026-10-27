/**
 * Backdrop's cut-out (GAP-189), on the built package in a real browser
 * (packages/react/tests/integration/backdrop-target-host.tsx): a page with a
 * scroller holding "Update", a "Decoy" and a "Publish", under a Backdrop
 * whose `target` lights one of them, in light and dark, in normal and forced
 * colours.
 *
 * - Pixels: inside the cut-out the page draws as it does with no backdrop,
 *   on the target and in the padding round it; outside it the decoy is
 *   dimmed; the ring is drawn in its colour 2px outside the cut-out. In
 *   forced colours (Windows' high contrast) the ring is a border in the
 *   system's Highlight, and Chromium and Firefox repaint it there; WebKit
 *   matches the media query but repaints nothing, so there the rule's own
 *   colour is what shows.
 * - Pointer: a click on the target through the cut-out reaches it, and a
 *   click on the decoy reaches the backdrop and not the decoy.
 * - Place: the target keeps its parent, its own position and z-index, and
 *   its box. The cut-out follows it as its scroller scrolls, as it resizes
 *   (a ResizeObserver, with no React render) and as the window resizes.
 * - Shapes of target: a ref, an element, a list lit as one box, a rect and a
 *   virtual element; a ref to nothing and no target dim the whole page and
 *   catch every click, as Backdrop did before.
 * - Motion: a new target is glided to, from where the cut-out was; under
 *   reduced motion the cut-out is at the new target in the same frame.
 *
 * Pixels are read from screenshots, always on a part with a flat colour of
 * its own: a dimmed pixel read on the dark theme's page would pass vacuously.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-backdrop-target.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("backdrop-target-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const failures = [];
let reads = 0;
const measured = [];

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
        ...context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data,
      ]);
    },
    { data: png.toString("base64"), points },
  );
const distance = (a, b) =>
  Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));
const rgb = (p) => `rgb(${p.slice(0, 3).join(", ")})`;

async function open({
  theme,
  target,
  forced,
  reduced = "no-preference",
  visible = true,
  child = false,
}) {
  const page = await browser.newPage({
    viewport: { width: 480, height: 720 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({
    forcedColors: forced,
    reducedMotion: reduced,
    colorScheme: theme,
  });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Backdrop target</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.evaluate((mount) => window.backdropTarget.mount(mount), {
    theme,
    target,
    visible,
    child,
  });
  await settleLayout(page);
  return { page, errors };
}

const box = (page, selector) =>
  page.evaluate((selector) => {
    const node = document.querySelector(selector);
    if (!node || getComputedStyle(node).display === "none") return null;
    const r = node.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }, selector);
const ring = (page) => box(page, "#backdrop .kozmos-backdrop-ring");
const centre = (b) => [(b.left + b.right) / 2, (b.top + b.bottom) / 2];
// A pixel of a part's own flat fill: inside its rounded corner, clear of its
// label, whose glyphs draw differently in each engine.
const flat = (b) => [b.left + 12, b.top + 12];
const union = (a, b) => ({
  left: Math.min(a.left, b.left),
  top: Math.min(a.top, b.top),
  right: Math.max(a.right, b.right),
  bottom: Math.max(a.bottom, b.bottom),
});
// The ring sits 2 outside the cut-out, which is the target padded by 8.
const ringFor = (b) => ({
  left: b.left - 10,
  top: b.top - 10,
  right: b.right + 10,
  bottom: b.bottom + 10,
});
const fmt = (b) =>
  b
    ? `${b.left.toFixed(1)},${b.top.toFixed(1)} to ${b.right.toFixed(1)},${b.bottom.toFixed(1)}`
    : "none";
function sameBox(problems, step, actual, expected) {
  reads += 1;
  const ok =
    actual &&
    ["left", "top", "right", "bottom"].every(
      (k) => Math.abs(actual[k] - expected[k]) <= 0.75,
    );
  if (!ok)
    problems.push(
      `${step}: the ring is at ${fmt(actual)}, not ${fmt(expected)}`,
    );
}

async function counts(page) {
  return page.evaluate(() => ({ ...window.backdropTarget.counts }));
}

/** What a click at the centre of `selector` reaches. */
async function clickAt(page, selector) {
  const b = await box(page, selector);
  const [x, y] = centre(b);
  const before = await counts(page);
  await page.mouse.click(x, y);
  const after = await counts(page);
  const hit = await page.evaluate(
    // The nearest element with an id: the backdrop's dim is a part of it.
    ([x, y]) =>
      document.elementFromPoint(x, y)?.closest("[id]")?.id || "(none)",
    [x, y],
  );
  return {
    hit,
    delta: Object.fromEntries(
      Object.keys(after).map((k) => [k, after[k] - before[k]]),
    ),
  };
}

async function scenario(name, run) {
  const problems = [];
  try {
    await run(problems);
  } catch (error) {
    problems.push(String(error.stack ?? error.message ?? error));
  }
  if (problems.length) {
    failures.push(...problems.map((p) => `${name}: ${p}`));
    console.error(`FAIL ${name}\n  ${problems.join("\n  ")}`);
  } else console.log(`PASS ${name}`);
}

for (const forced of ["none", "active"])
  for (const theme of ["light", "dark"]) {
    const mode = `${forced === "active" ? "forced colours" : "normal colours"}, ${theme}`;

    await scenario(
      `${mode}: a ref is cut out, ringed, clickable and left in place`,
      async (problems) => {
        // The page with no backdrop, for what the cut-out should show.
        const reference = await open({
          theme,
          target: "update",
          forced,
          visible: false,
        });
        const updateBefore = await box(reference.page, "#update");
        const decoyBox = await box(reference.page, "#decoy");
        const referenceShot = await reference.page.screenshot();
        await reference.page.close();

        const { page, errors } = await open({
          theme,
          target: "update",
          forced,
        });
        const update = await box(page, "#update");
        reads += 1;
        if (JSON.stringify(update) !== JSON.stringify(updateBefore))
          problems.push(
            `the target moved: ${fmt(updateBefore)} became ${fmt(update)}`,
          );
        const place = await page.evaluate(() => {
          const node = document.getElementById("update");
          const style = getComputedStyle(node);
          return {
            parent: node.parentElement.id,
            position: style.position,
            zIndex: style.zIndex,
            inBackdrop: document.getElementById("backdrop").contains(node),
            focusable: document
              .getElementById("backdrop")
              .querySelectorAll(
                "a, button, input, select, textarea, [tabindex]",
              ).length,
            clip: getComputedStyle(document.getElementById("backdrop"))
              .clipPath,
          };
        });
        reads += 1;
        if (
          place.parent !== "scroller-content" ||
          place.position !== "relative" ||
          place.zIndex !== "1" ||
          place.inBackdrop
        )
          problems.push(
            `the target was moved or re-stacked: ${JSON.stringify(place)}`,
          );
        if (place.focusable !== 0)
          problems.push(`${place.focusable} focusable element(s) in the dim`);
        const ringBox = await ring(page);
        sameBox(problems, "on the ref", ringBox, ringFor(update));
        if (!ringBox) {
          await page.close();
          return;
        }

        const shot = await page.screenshot();
        const ringColour = await page.evaluate(() => {
          const ring = document.querySelector(
            "#backdrop .kozmos-backdrop-ring",
          );
          const style = getComputedStyle(ring);
          // The system's Highlight, resolved where the ring is: a system
          // colour follows the color-scheme it is used in.
          const probe = document.createElement("div");
          probe.style.cssText = "forced-color-adjust:none;background:Highlight";
          ring.parentElement.append(probe);
          const highlight = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return {
            colour: style.borderTopColor,
            width: style.borderTopWidth,
            style: style.borderTopStyle,
            highlight,
          };
        });
        const parse = (colour) => {
          const n = colour.match(/[\d.]+/g).map(Number);
          return { rgb: n.slice(0, 3), alpha: n.length > 3 ? n[3] : 1 };
        };
        const cy = (update.top + update.bottom) / 2;
        const points = {
          target: flat(update),
          padding: [update.left - 4, cy],
          ring: [ringBox.left + 1, cy],
          // The dim just outside the ring: what a translucent ring is over.
          under: [ringBox.left - 3, cy],
          decoy: flat(decoyBox),
        };
        const names = Object.keys(points);
        const [lit, ref] = await Promise.all([
          pixels(shot, Object.values(points)),
          pixels(referenceShot, Object.values(points)),
        ]);
        const at = Object.fromEntries(
          names.map((n, i) => [n, { lit: lit[i], ref: ref[i] }]),
        );
        for (const part of ["target", "padding"]) {
          reads += 1;
          if (distance(at[part].lit, at[part].ref) > 3)
            problems.push(
              `the cut-out's ${part} is drawn ${rgb(at[part].lit)}, not as the page draws it, ${rgb(at[part].ref)}`,
            );
        }
        reads += 1;
        // The ring's colour is the focus colour, and in forced colours the
        // system's Highlight (Chromium's emulated one is translucent, 0.8),
        // composited over the dim it sits on.
        const drawn = parse(ringColour.colour);
        if (forced === "active" && ringColour.colour !== ringColour.highlight)
          problems.push(
            `in forced colours the ring is ${ringColour.colour}, not Highlight, ${ringColour.highlight}`,
          );
        if (ringColour.width !== "2px" || ringColour.style !== "solid")
          problems.push(
            `the ring is ${ringColour.width} ${ringColour.style}, not a 2px solid border`,
          );
        const expectedRing = drawn.rgb.map(
          (c, i) => c * drawn.alpha + at.under.lit[i] * (1 - drawn.alpha),
        );
        if (distance(at.ring.lit, expectedRing) > 24)
          problems.push(
            `the ring is not drawn: ${rgb(at.ring.lit)} where ${rgb(expectedRing.map(Math.round))} was expected (${ringColour.colour} over ${rgb(at.under.lit)})`,
          );
        if (distance(at.ring.lit, at.padding.lit) < 40)
          problems.push(
            `the ring reads as the page beside it (${rgb(at.ring.lit)})`,
          );
        const dimmed = distance(at.decoy.lit, at.decoy.ref);
        measured.push(
          `${mode}: decoy ${rgb(at.decoy.ref)} drawn ${rgb(at.decoy.lit)} under the dim; ring ${rgb(at.ring.lit)}`,
        );
        if (forced === "none") {
          reads += 1;
          if (dimmed < 60)
            problems.push(
              `the decoy is not dimmed: ${rgb(at.decoy.ref)} drew ${rgb(at.decoy.lit)}`,
            );
        }

        // A click through the cut-out reaches the target; one outside it
        // reaches the backdrop, and not what is under it.
        const through = await clickAt(page, "#update");
        reads += 1;
        if (
          through.hit !== "update" ||
          through.delta.update !== 1 ||
          through.delta.backdrop !== 0
        )
          problems.push(
            `a click on the target reached ${through.hit} (${JSON.stringify(through.delta)})`,
          );
        const outside = await clickAt(page, "#decoy");
        reads += 1;
        if (
          outside.hit !== "backdrop" ||
          outside.delta.decoy !== 0 ||
          outside.delta.backdrop !== 1
        )
          problems.push(
            `a click on the decoy reached ${outside.hit} (${JSON.stringify(outside.delta)})`,
          );

        // It follows the target: its scroller scrolls, it grows with no
        // render, and the window resizes and moves it.
        await page.evaluate(() => {
          document.getElementById("scroller").scrollTop = 40;
        });
        await settleLayout(page);
        const scrolled = await box(page, "#update");
        reads += 1;
        if (Math.abs(scrolled.top - (update.top - 40)) > 0.75)
          problems.push(
            `the scroller did not scroll the target (${fmt(scrolled)})`,
          );
        sameBox(
          problems,
          "after the scroller scrolls 40",
          await ring(page),
          ringFor(scrolled),
        );
        if (forced === "none") {
          const [onTarget] = await pixels(await page.screenshot(), [
            flat(scrolled),
          ]);
          reads += 1;
          if (distance(onTarget, [255, 204, 0]) > 3)
            problems.push(
              `after scrolling, the target draws ${rgb(onTarget)}, not its own #ffcc00`,
            );
        }
        await page.evaluate(() => {
          document.getElementById("update").style.width = "240px";
        });
        await settleLayout(page);
        sameBox(
          problems,
          "after the target grows to 240",
          await ring(page),
          ringFor(await box(page, "#update")),
        );
        await page.setViewportSize({ width: 640, height: 720 });
        await settleLayout(page);
        const moved = await box(page, "#update");
        reads += 1;
        if (Math.abs(moved.left - update.left - 80) > 0.75)
          problems.push(
            `the window's resize did not move the target (${fmt(moved)})`,
          );
        sameBox(
          problems,
          "after the window widens to 640",
          await ring(page),
          ringFor(moved),
        );
        if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
        await page.close();
      },
    );

    await scenario(
      `${mode}: an element, a list, a rect and a virtual element`,
      async (problems) => {
        for (const [target, expected] of [
          ["publish", async (page) => ringFor(await box(page, "#publish"))],
          [
            "both",
            async (page) =>
              ringFor(
                union(await box(page, "#update"), await box(page, "#publish")),
              ),
          ],
          ["rect", async (page) => ringFor(await box(page, "#decoy"))],
          ["virtual", async (page) => ringFor(await box(page, "#decoy"))],
        ]) {
          const { page, errors } = await open({ theme, target, forced });
          sameBox(
            problems,
            `lighting ${target}`,
            await ring(page),
            await expected(page),
          );
          if (target === "publish") {
            const through = await clickAt(page, "#publish");
            reads += 1;
            if (through.hit !== "publish" || through.delta.publish !== 1)
              problems.push(
                `a click on the lit element reached ${through.hit}`,
              );
          }
          if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
          await page.close();
        }
      },
    );

    await scenario(
      `${mode}: a ref to nothing, and no target, dim the whole page as before`,
      async (problems) => {
        const reference = await open({
          theme,
          target: "none",
          forced,
          visible: false,
        });
        const update = await box(reference.page, "#update");
        const [ref] = await pixels(await reference.page.screenshot(), [
          flat(update),
        ]);
        await reference.page.close();
        for (const target of ["missing", "none"]) {
          const { page, errors } = await open({ theme, target, forced });
          const state = await page.evaluate(() => {
            const backdrop = document.getElementById("backdrop");
            const scrim = backdrop.querySelector(".kozmos-backdrop-scrim");
            return {
              clip:
                [backdrop, scrim]
                  .filter(Boolean)
                  .map((node) => getComputedStyle(node).clipPath)
                  .find((clip) => clip !== "none") ?? "none",
              lit: backdrop.hasAttribute("data-lit"),
              rings: backdrop.querySelectorAll(".kozmos-backdrop-ring").length,
              // With no target, the one element Backdrop always drew.
              markup: backdrop.outerHTML,
            };
          });
          reads += 1;
          if (state.clip !== "none" || state.lit)
            problems.push(
              `${target}: the dim is cut (${JSON.stringify(state)})`,
            );
          if (target === "none" && state.rings !== 0)
            problems.push(
              `with no target, Backdrop draws ${state.rings} ring(s)`,
            );
          // In the theme's portal, which marks what it draws with the
          // provider's density, as it marks a Popover's.
          if (
            target === "none" &&
            state.markup !==
              '<div class="fixed inset-0 z-50 bg-overlay-scrim" id="backdrop" data-kozmos-density="touch"></div>'
          )
            problems.push(
              `with no target, Backdrop is not the element it was: ${state.markup}`,
            );
          if ((await ring(page)) !== null)
            problems.push(`${target}: a ring is drawn`);
          if (forced === "none") {
            const [lit] = await pixels(await page.screenshot(), [flat(update)]);
            reads += 1;
            if (distance(lit, ref) < 60)
              problems.push(
                `${target}: the target is not dimmed (${rgb(ref)} drew ${rgb(lit)})`,
              );
          }
          const click = await clickAt(page, "#update");
          reads += 1;
          if (
            click.hit !== "backdrop" ||
            click.delta.update !== 0 ||
            click.delta.backdrop !== 1
          )
            problems.push(
              `${target}: a click on the target reached ${click.hit}`,
            );
          if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
          await page.close();
        }
      },
    );
  }

for (const theme of ["light", "dark"]) {
  await scenario(
    `normal colours, ${theme}: a target moved with no resize or scroll, by content above it and by a transform, keeps the ring and the click`,
    async (problems) => {
      const { page, errors } = await open({
        theme,
        target: "update",
        forced: "none",
      });
      for (const [name, move] of [
        [
          "content inserted above it",
          () => {
            const above = document.createElement("div");
            above.style.height = "32px";
            const update = document.getElementById("update");
            update.parentElement.insertBefore(above, update);
          },
        ],
        [
          "a transform on it",
          () => {
            document.getElementById("update").style.transform =
              "translateX(40px)";
          },
        ],
      ]) {
        const before = await box(page, "#update");
        await page.evaluate(move);
        await settleLayout(page);
        const after = await box(page, "#update");
        reads += 1;
        if (
          Math.abs(after.top - before.top) +
            Math.abs(after.left - before.left) <
          20
        )
          problems.push(
            `${name}: the target did not move (${fmt(before)} to ${fmt(after)})`,
          );
        sameBox(problems, `after ${name}`, await ring(page), ringFor(after));
        const click = await clickAt(page, "#update");
        reads += 1;
        if (
          click.hit !== "update" ||
          click.delta.update !== 1 ||
          click.delta.backdrop !== 0
        )
          problems.push(
            `after ${name}, a click on the target reached ${click.hit} (${JSON.stringify(click.delta)})`,
          );
      }
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    },
  );

  await scenario(
    `normal colours, ${theme}: a child of the backdrop over the cut-out's padding is drawn and takes the click`,
    async (problems) => {
      const { page, errors } = await open({
        theme,
        target: "update",
        forced: "none",
        child: true,
      });
      const update = await box(page, "#update");
      const child = await box(page, "#child");
      // Inside the cut-out's padding, on its straight edge, under the child.
      const point = [update.left - 4, (child.top + child.bottom) / 2];
      reads += 1;
      if (
        !(
          point[0] > child.left &&
          point[0] < child.right &&
          point[1] > update.top &&
          point[1] < update.bottom
        )
      )
        problems.push(
          `the probe ${point} is not under the child in the cut-out (${fmt(child)})`,
        );
      const [drawn] = await pixels(await page.screenshot(), [point]);
      reads += 1;
      if (distance(drawn, [255, 0, 255]) > 3)
        problems.push(
          `the child is not drawn over the cut-out: rgb(${drawn.slice(0, 3)}), not #ff00ff`,
        );
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.id,
        point,
      );
      const before = await counts(page);
      await page.mouse.click(point[0], point[1]);
      const after = await counts(page);
      reads += 1;
      if (
        hit !== "child" ||
        after.child - before.child !== 1 ||
        after.update !== before.update
      )
        problems.push(
          `a click on the child over the cut-out reached ${hit} (child ${after.child - before.child}, update ${after.update - before.update})`,
        );
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    },
  );
}

await scenario(
  "motion: a new target is glided to, and under reduced motion moved to at once",
  async (problems) => {
    for (const reduced of ["no-preference", "reduce"]) {
      const { page, errors } = await open({
        theme: "light",
        target: "update",
        forced: "none",
        reduced,
      });
      const from = ringFor(await box(page, "#update"));
      const to = ringFor(await box(page, "#publish"));
      // The ring's box in the frame the new target arrives in.
      const first = await page.evaluate(() => {
        window.backdropTarget.retarget("publish");
        const r = document
          .querySelector("#backdrop .kozmos-backdrop-ring")
          .getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      sameBox(
        problems,
        `${reduced}: in the first frame`,
        first,
        reduced === "reduce" ? to : from,
      );
      await page.waitForTimeout(800);
      sameBox(problems, `${reduced}: once settled`, await ring(page), to);
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await browser.close();
for (const line of measured) console.log(`  measured  ${line}`);
if (failures.length) {
  console.error(
    `\nFAIL backdrop target: ${failures.length} problem(s) in ${reads} reads`,
  );
  process.exit(1);
}
console.log(
  `\nPASS backdrop target: ${reads} reads; the cut-out shows the target and its padding as the page draws them, the decoy outside it is dimmed, and the ring is a 2px border in the focus colour (Highlight in forced colours); a click reaches the target through the cut-out and the backdrop elsewhere; the target keeps its parent, position, z-index and box; the cut-out follows a scroll, a resize with no render and the window; an element, a list, a rect and a virtual element are lit; a ref to nothing and no target dim everything; a new target is glided to, at once under reduced motion; light and dark, normal and forced colours`,
);
