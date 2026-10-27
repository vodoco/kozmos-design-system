/**
 * TourStep (GAP-188), on the built package in a real browser
 * (packages/react/tests/integration/tour-step-host.tsx): a page with a
 * "Start tour" button and an "Open a site" target, under a two-step tour
 * whose card points at the target, in light and dark, with and without every
 * @scope rule.
 *
 * - The card: 340 wide (21.25rem), the Control corner, 16 inside, a 4 top
 *   edge of the theme fill, sections 12 apart, each colour from its token,
 *   and the eyebrow, the body, the hint and the status 4.5:1 or more on what
 *   they sit on. Above its own Backdrop whatever the order the two are in,
 *   and under a popover its body opens.
 * - Where it sits: 12 past the cut-out's ring on each side of the target,
 *   centred on it; beside a rect and a virtual element; in the middle of the
 *   window with no target or a ref to nothing; following the target as it
 *   moves; never wider than a narrow window.
 * - What a press does: on the dim and on the lit target the step stays
 *   open, and the press reaches the target through the cut-out.
 * - Focus and what a reader hears: a dialog named by its title and described
 *   by its tour, position, body, hint and status; opened by the page (no
 *   press), focus is on Next, beside a virtual element too, and a coachmark
 *   takes it on itself; Next draws the next step and focus stays on its own
 *   Next once Radix's timers have run; Escape closes it and focus goes back
 *   as PopoverContent gives it (GAP-190, #410); axe finds nothing.
 * - The status: a live region in the card from the start, the same element
 *   as its text changes, and no room in the column while empty.
 * - Motion: the marker pulses, and holds still under reduced motion, the
 *   system's or the config's; forced colours draw it in Highlight.
 * - Right to left and compact density.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-tour-step.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("tour-step-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const unscoped = require("postcss").parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const engine = browser.browserType().name();
const failures = [];
let passed = 0;

const VIEWPORT = { width: 1000, height: 800 };
// Backdrop pads the cut-out 8 and rings it 2 outside; the card keeps 12
// from the ring (layout.spacing.150).
const RING_GAP = 12;
const TOLERANCE = 1;

async function scenario(name, options, run) {
  const {
    stylesheet = css,
    viewport = VIEWPORT,
    media = {},
    mount = {},
  } = options;
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.emulateMedia({ reducedMotion: "no-preference", ...media });
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>TourStep</title><style>body{margin:0}</style><style>${stylesheet}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate(
      (mount) => window.tourStep.mount({ theme: "light", ...mount }),
      mount,
    );
    await settleLayout(page);
    await run(page);
    assert.deepEqual(errors, [], "no page errors");
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await context.close();
  }
}

/** Waits, on a timer (a stalled WebKit renders no frames), for `test`. */
async function until(page, test, arg, timeout = 5000) {
  const deadline = Date.now() + timeout;
  let last = await page.evaluate(test, arg);
  while (!last?.ok && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    last = await page.evaluate(test, arg);
  }
  return last;
}

/** The card's place, once its entry has finished, against the ring and the target. */
const placement = (page) =>
  until(page, () => {
    const card = document.getElementById("step");
    const ring = document.querySelector(
      ".kozmos-tour-step-backdrop .kozmos-backdrop-ring",
    );
    const target = document.getElementById("target");
    if (!card) return { ok: false, why: "no card" };
    const box = (node) => {
      if (!node || getComputedStyle(node).display === "none") return null;
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
    const animating = card
      .getAnimations()
      .some((animation) => animation.playState === "running");
    return {
      ok:
        !animating &&
        card.closest("[data-radix-popper-content-wrapper]")?.style.transform !==
          "translate(0, -200%)",
      card: box(card),
      ring: box(ring),
      target: box(target),
      placement: card.dataset.placement,
      side: card.dataset.side,
      lit: ring?.closest(".kozmos-backdrop")?.hasAttribute("data-lit") ?? false,
    };
  });

function assertBeside(at, side, label) {
  assert.ok(at.ring, `${label}: the cut-out is lit (${JSON.stringify(at)})`);
  const { card, ring } = at;
  const gap = {
    bottom: card.top - ring.bottom,
    top: ring.top - card.bottom,
    right: card.left - ring.right,
    left: ring.left - card.right,
  }[side];
  const off =
    side === "top" || side === "bottom"
      ? card.left + card.width / 2 - (ring.left + ring.width / 2)
      : card.top + card.height / 2 - (ring.top + ring.height / 2);
  assert.ok(
    Math.abs(gap - RING_GAP) <= TOLERANCE,
    `${label}: ${RING_GAP} past the ring on the ${side}, read ${gap.toFixed(2)} (${JSON.stringify(at)})`,
  );
  assert.ok(
    Math.abs(off) <= TOLERANCE,
    `${label}: centred on the target, read ${off.toFixed(2)} off`,
  );
}

function assertCentred(at, viewport, label) {
  const x = at.card.left + at.card.width / 2 - viewport.width / 2;
  const y = at.card.top + at.card.height / 2 - viewport.height / 2;
  assert.equal(at.placement, "centre", `${label}: the card places itself`);
  assert.ok(
    Math.abs(x) <= TOLERANCE && Math.abs(y) <= TOLERANCE,
    `${label}: in the middle of the window, read ${x.toFixed(2)}, ${y.toFixed(2)} off (${JSON.stringify(at.card)})`,
  );
  assert.equal(at.lit, false, `${label}: the whole page is dimmed`);
}

/** Relative luminance contrast of two "rgb(…)" colours, the first over the second. */
function contrast(fore, back) {
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) throw new Error(`not an rgb colour: ${value}`);
    const [r, g, b, a = 1] = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r, g, b, a };
  };
  const f = parse(fore);
  const b = parse(back);
  const mix = (x, y) => x * f.a + y * (1 - f.a);
  const lum = ({ r, g, b }) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const l1 = lum({ r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b) });
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** The card's geometry, styles and the tokens they come from, read in the page. */
const measure = (page) =>
  page.evaluate(() => {
    const card = document.getElementById("step");
    const round = (n) => Math.round(n * 100) / 100;
    const box = (node) => {
      const r = node.getBoundingClientRect();
      return {
        x: round(r.x),
        y: round(r.y),
        w: round(r.width),
        h: round(r.height),
        bottom: round(r.bottom),
        right: round(r.right),
      };
    };
    const token = (name) => {
      const probe = document.createElement("i");
      probe.style.color = `var(${name})`;
      card.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const s = getComputedStyle(card);
    const q = (selector) => card.querySelector(selector);
    const sections = Array.from(card.children).filter(
      (child) => getComputedStyle(child).position !== "absolute",
    );
    return {
      card: box(card),
      rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
      radius: s.borderTopLeftRadius,
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
      borders: [
        s.borderTopWidth,
        s.borderRightWidth,
        s.borderBottomWidth,
        s.borderLeftWidth,
      ],
      edge: s.borderTopColor,
      side: s.borderLeftColor,
      background: s.backgroundColor,
      zIndex: getComputedStyle(
        card.closest("[data-radix-popper-content-wrapper]"),
      ).zIndex,
      gaps: sections
        .slice(1)
        .map((section, i) =>
          round(
            section.getBoundingClientRect().top -
              sections[i].getBoundingClientRect().bottom,
          ),
        ),
      eyebrow: {
        color: getComputedStyle(q(".kozmos-tour-step-eyebrow")).color,
        font: getComputedStyle(q(".kozmos-tour-step-eyebrow")).fontSize,
        transform: getComputedStyle(q(".kozmos-tour-step-eyebrow"))
          .textTransform,
      },
      title: {
        color: getComputedStyle(q(".kozmos-tour-step-title")).color,
        font: `${getComputedStyle(q(".kozmos-tour-step-title")).fontSize}/${getComputedStyle(q(".kozmos-tour-step-title")).fontWeight}`,
      },
      body: getComputedStyle(q(".kozmos-tour-step-body")).color,
      hint: {
        color: getComputedStyle(q(".kozmos-tour-step-hint")).color,
        background: getComputedStyle(q(".kozmos-tour-step-hint"))
          .backgroundColor,
        bar: getComputedStyle(q(".kozmos-tour-step-hint"))
          .borderInlineStartWidth,
      },
      status: {
        color: getComputedStyle(q(".kozmos-tour-step-instruction")).color,
        background: getComputedStyle(q(".kozmos-tour-step-instruction"))
          .backgroundColor,
      },
      marker: {
        ...box(q(".kozmos-tour-step-marker")),
        color: getComputedStyle(q(".kozmos-tour-step-marker")).backgroundColor,
      },
      tokens: {
        fill: token("--primitives-colors-theme-500"),
        ink: token("--primitives-colors-theme-600"),
        popover: token("--primitives-colors-background-0"),
        foreground: token("--primitives-colors-foreground-0"),
        muted: token("--primitives-colors-foreground-400"),
        subtle: token("--semantics-border-subtle"),
        themed: token("--semantics-emotion-themed-surface"),
        themedInk: token("--semantics-emotion-themed-on-surface"),
        mutedFill: token("--primitives-colors-background-100"),
      },
    };
  });

// --- The card, from its tokens ----------------------------------------------

for (const [mode, stylesheet] of [
  ["full", css],
  ["without @scope", unscoped.toString()],
]) {
  for (const theme of ["light", "dark"]) {
    await scenario(
      `the card, ${theme}, ${mode}: 340 wide, the Control corner, 16 inside, a 4 theme edge, 12 apart`,
      { stylesheet, mount: { theme } },
      async (page) => {
        await placement(page);
        const m = await measure(page);
        assert.equal(m.card.w, 21.25 * m.rootFont, "340 wide, as 21.25rem");
        assert.equal(m.radius, "16px", "the Control corner");
        assert.deepEqual(
          m.padding,
          ["16px", "16px", "16px", "16px"],
          "16 inside",
        );
        assert.deepEqual(
          m.borders,
          ["4px", "1px", "1px", "1px"],
          "a 4 top edge and the 1 subtle edge",
        );
        assert.equal(m.edge, m.tokens.fill, "the top edge is the theme fill");
        assert.equal(
          m.side,
          m.tokens.subtle,
          "the other edges are the subtle border",
        );
        assert.equal(m.background, m.tokens.popover, "the popover fill");
        assert.equal(
          m.zIndex,
          "51",
          "one above the overlay layer, where the backdrop is",
        );
        assert.ok(
          m.gaps.length >= 4 &&
            m.gaps.every((gap) => Math.abs(gap - 12) <= 0.5),
          `sections 12 apart (${m.gaps})`,
        );
        assert.equal(
          m.eyebrow.color,
          m.tokens.ink,
          "the eyebrow is the theme ink",
        );
        assert.equal(
          m.eyebrow.transform,
          "uppercase",
          "the eyebrow is upper case",
        );
        assert.equal(
          m.title.color,
          m.tokens.foreground,
          "the title is the foreground",
        );
        assert.equal(m.title.font, "16px/600", "the title is 16 semibold");
        assert.equal(m.body, m.tokens.muted, "the body is the muted ink");
        assert.equal(
          m.hint.background,
          m.tokens.themed,
          "the hint is the themed surface",
        );
        assert.equal(m.hint.color, m.tokens.themedInk, "under the themed ink");
        assert.equal(m.hint.bar, "4px", "with a 4 bar at its start");
        assert.equal(
          m.status.background,
          m.tokens.mutedFill,
          "the status is the muted fill",
        );
        assert.equal(m.marker.w, 8, "the marker is 8");
        assert.equal(m.marker.color, m.tokens.fill, "of the theme fill");
        for (const [what, fore, back] of [
          ["the eyebrow", m.eyebrow.color, m.background],
          ["the title", m.title.color, m.background],
          ["the body", m.body, m.background],
          ["the hint", m.hint.color, m.hint.background],
          ["the status", m.status.color, m.status.background],
        ]) {
          const ratio = contrast(fore, back);
          assert.ok(
            ratio >= 4.5,
            `${what} reads ${ratio.toFixed(2)}:1, under 4.5`,
          );
        }
      },
    );
  }
}

// --- Where it sits -----------------------------------------------------------

for (const side of ["bottom", "top", "right", "left"]) {
  await scenario(
    `beside the target on the ${side}, 12 past the cut-out's ring`,
    { mount: { side } },
    async (page) => {
      const at = await placement(page);
      assert.equal(at.placement, "target");
      assertBeside(at, side, side);
    },
  );
}

for (const target of ["rect", "virtual"]) {
  await scenario(`beside a ${target}`, { mount: { target } }, async (page) => {
    const at = await placement(page);
    assert.equal(at.placement, "target");
    assertBeside(at, "bottom", target);
  });
}

for (const target of ["none", "missing"]) {
  await scenario(
    `with ${target === "none" ? "no target" : "a ref to nothing"}, in the middle of the window`,
    { mount: { target } },
    async (page) => {
      assertCentred(await placement(page), VIEWPORT, target);
    },
  );
}

await scenario(
  "it follows the target as it moves, with the cut-out",
  {},
  async (page) => {
    const before = await placement(page);
    await page.evaluate(() => {
      document.getElementById("target").style.transform =
        "translate(-120px, 60px)";
    });
    const after = await until(
      page,
      (left) => {
        const card = document.getElementById("step").getBoundingClientRect();
        return { ok: Math.abs(card.left - left) > 100 };
      },
      before.card.left,
    );
    assert.ok(after.ok, "the card moved with the target");
    assertBeside(await placement(page), "bottom", "after the move");
  },
);

await scenario(
  "it follows a virtual element that moves with nothing else on the page changing",
  { mount: { target: "virtual" } },
  async (page) => {
    const before = await placement(page);
    await page.evaluate(() => window.tourStep.moveVirtual(-150, 80));
    const after = await until(
      page,
      (left) => {
        const card = document.getElementById("step").getBoundingClientRect();
        return { ok: Math.abs(card.left - left + 150) <= 1, left: card.left };
      },
      before.card.left,
    );
    assert.ok(
      after.ok,
      `the card moved 150 to the left with the point (${before.card.left} to ${after.left})`,
    );
  },
);

await scenario(
  "in a 360 window, never wider than the window less 16 a side",
  { viewport: { width: 360, height: 700 }, mount: { target: "none" } },
  async (page) => {
    const at = await placement(page);
    assert.ok(
      at.card.left >= 16 - TOLERANCE && at.card.right <= 360 - 16 + TOLERANCE,
      `inside the window (${JSON.stringify(at.card)})`,
    );
  },
);

// --- Stacking and presses -----------------------------------------------------

await scenario(
  "above its own Backdrop, whatever the order the two are in",
  {},
  async (page) => {
    await placement(page);
    const hit = () =>
      page.evaluate(() => {
        const card = document.getElementById("step");
        const r = card.getBoundingClientRect();
        // Clear of the buttons: the body's text.
        const body = card
          .querySelector(".kozmos-tour-step-body")
          .getBoundingClientRect();
        const at = document.elementFromPoint(body.left + 4, body.top + 4);
        return { inCard: card.contains(at), at: at?.className, r: r.top };
      });
    assert.ok((await hit()).inCard, "the card is on top");
    // The backdrop drawn anew after the card, as a target arriving draws it.
    await page.evaluate(() => {
      const backdrop = document.querySelector(".kozmos-tour-step-backdrop");
      backdrop.parentElement.appendChild(backdrop);
    });
    const after = await hit();
    assert.ok(
      after.inCard,
      `the card is still on top with the backdrop after it (${after.at})`,
    );
  },
);

await scenario(
  "a popover the body opens is above the card",
  { mount: { bodyPopover: true } },
  async (page) => {
    await placement(page);
    await page.locator("#more").click();
    await page.locator("#more-popover").waitFor();
    const top = await until(page, () => {
      const popover = document.getElementById("more-popover");
      const card = document.getElementById("step").getBoundingClientRect();
      const r = popover.getBoundingClientRect();
      // A point of the popover over the card.
      const x = Math.max(r.left, card.left) + 6;
      const y = Math.max(r.top, card.top) + 6;
      const at = document.elementFromPoint(x, y);
      return {
        ok: popover.contains(at),
        at: at?.className,
        overlaps: r.bottom > card.top,
      };
    });
    assert.ok(top.overlaps, "the popover overlaps the card");
    assert.ok(top.ok, `the popover is on top (${top.at})`);
  },
);

await scenario(
  "a press on the dim or on the lit target leaves the step open, and reaches the target",
  {},
  async (page) => {
    const at = await placement(page);
    await page.mouse.click(40, VIEWPORT.height - 40);
    await page.mouse.click(
      at.target.left + at.target.width / 2,
      at.target.top + at.target.height / 2,
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(await page.locator("#step").count(), 1, "the step is open");
    assert.equal(
      await page.evaluate(() => window.tourStep.closes()),
      0,
      "nothing asked it to close",
    );
    assert.equal(
      await page.evaluate(() => window.tourStep.presses()),
      1,
      "the target took the press through the cut-out",
    );
  },
);

// --- Focus, and what a reader hears --------------------------------------------

for (const target of ["ref", "virtual", "none"]) {
  await scenario(
    `opened by the page, beside ${target === "ref" ? "an element" : target === "virtual" ? "a virtual element" : "nothing"}: focus is on Next, in a dialog read with its position`,
    { mount: { target } },
    async (page) => {
      await placement(page);
      const dialog = page.getByRole("dialog", { name: "Open a site" });
      assert.equal(await dialog.count(), 1, "a dialog named by its title");
      const read = await page.evaluate(() => {
        const card = document.getElementById("step");
        const active = document.activeElement;
        return {
          modal: card.getAttribute("aria-modal"),
          description: (card.getAttribute("aria-describedby") ?? "")
            .split(" ")
            .map((id) => document.getElementById(id)?.textContent.trim())
            .filter(Boolean),
          active: card.contains(active)
            ? active.textContent
            : `outside: ${active?.tagName}`,
        };
      });
      assert.equal(read.modal, null, "not modal");
      assert.deepEqual(read.description, [
        "How Pointr Cloud is organised",
        "Step 1 of 2",
        "Each site in this client is listed here.",
        "Sites are listed by client.",
        "Go ahead and open a site to proceed to the next step.",
      ]);
      assert.equal(read.active, "Next", "focus is on Next");
    },
  );
}

await scenario(
  "a coachmark takes focus on itself, and closes by its button",
  { mount: { coachmark: true } },
  async (page) => {
    await placement(page);
    const card = page.getByRole("dialog", { name: "Draw rooms here" });
    assert.equal(
      await card.evaluate((node) => node === document.activeElement),
      true,
      "the card has focus",
    );
    assert.equal(
      await page.locator("#step .kozmos-tour-step-eyebrow").count(),
      0,
      "no position",
    );
    assert.equal(
      await page.locator("#step .kozmos-stepper-dots").count(),
      0,
      "no dots",
    );
    await page.getByRole("button", { name: "Dismiss" }).click();
    await page.locator("#step").waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => window.tourStep.closes()), 1);
  },
);

await scenario(
  "Next draws the next step, and focus stays on its Next after Radix's timers",
  {},
  async (page) => {
    await placement(page);
    const first = await page.locator("#step").elementHandle();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: "Open a building" }).waitFor();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const read = await page.evaluate((first) => {
      const card = document.getElementById("step");
      return {
        firstGone: !first.isConnected,
        active: card.contains(document.activeElement)
          ? document.activeElement.textContent
          : `outside: ${document.activeElement?.tagName}#${document.activeElement?.id}`,
        open: !!card,
      };
    }, first);
    assert.equal(read.firstGone, true, "the first step is drawn no more");
    assert.equal(
      read.active,
      "Finish",
      "focus is on the second step's Next, Finish",
    );
    assert.equal(
      await page.evaluate(() => window.tourStep.closes()),
      0,
      "nothing closed the tour",
    );
  },
);

await scenario(
  "Escape closes it, and focus goes back to what opened it",
  { mount: { open: false } },
  async (page) => {
    await page.locator("#start").click();
    await placement(page);
    await page.keyboard.press("Escape");
    await page.locator("#step").waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(() => window.tourStep.closes()),
      1,
      "onClose once",
    );
    const back = await until(page, () => ({
      ok: document.activeElement?.id === "start",
      at: document.activeElement?.id || document.activeElement?.tagName,
    }));
    assert.ok(back.ok, `focus is back on Start tour (on ${back.at})`);
  },
);

await scenario(
  "Escape on a step the page opened gives focus to its target",
  {},
  async (page) => {
    await placement(page);
    await page.keyboard.press("Escape");
    await page.locator("#step").waitFor({ state: "detached" });
    const back = await until(page, () => ({
      ok: document.activeElement?.id === "target",
      at: document.activeElement?.id || document.activeElement?.tagName,
    }));
    assert.ok(back.ok, `focus is on the target (on ${back.at})`);
  },
);

await scenario("axe finds nothing while it is open", {}, async (page) => {
  await placement(page);
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;
  assert.deepEqual(
    violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
});

// --- The status ---------------------------------------------------------------

await scenario(
  "the status is one live region, there from the start, taking no room while empty",
  {},
  async (page) => {
    await placement(page);
    const read = () =>
      page.evaluate(() => {
        const card = document.getElementById("step");
        const status = card.querySelector('[role="status"]');
        const hint = card
          .querySelector(".kozmos-tour-step-hint")
          .getBoundingClientRect();
        const footer = card
          .querySelector(".kozmos-tour-step-footer")
          .getBoundingClientRect();
        return {
          status,
          text: status?.textContent ?? null,
          hintToFooter: Math.round((footer.top - hint.bottom) * 100) / 100,
        };
      });
    const first = await page.evaluateHandle(() =>
      document.querySelector('#step [role="status"]'),
    );
    await page.evaluate(() => window.tourStep.setInstruction(null));
    await settleLayout(page);
    const empty = await read();
    assert.equal(empty.text, "", "empty, and still there");
    assert.equal(empty.hintToFooter, 12, "the empty status takes no room");
    await page.evaluate(() =>
      window.tourStep.setInstruction("Done: select Next."),
    );
    await settleLayout(page);
    const same = await page.evaluate((first) => {
      const now = document.querySelector('#step [role="status"]');
      return { same: now === first, text: now.textContent };
    }, first);
    assert.deepEqual(
      same,
      { same: true, text: "Done: select Next." },
      "the same region, with the new words",
    );
  },
);

// --- Motion and forced colours -------------------------------------------------

const pulse = (page) =>
  page.evaluate(() => {
    const marker = document.querySelector("#step .kozmos-tour-step-marker");
    const s = getComputedStyle(marker, "::after");
    const card = getComputedStyle(document.getElementById("step"));
    return {
      name: s.animationName,
      duration: s.animationDuration,
      count: s.animationIterationCount,
      card: card.animationName,
    };
  });

await scenario("the marker pulses while the tour waits", {}, async (page) => {
  await placement(page);
  const p = await pulse(page);
  assert.equal(p.name, "kozmos-tour-step-pulse");
  assert.equal(p.count, "infinite");
  assert.equal(p.duration, "1.38s", "three deliberate durations");
});

await scenario(
  "under the system's reduced motion the marker holds still and the card arrives without its zoom",
  { media: { reducedMotion: "reduce" } },
  async (page) => {
    await placement(page);
    const p = await pulse(page);
    assert.equal(p.name, "none", "the marker holds still");
    assert.equal(p.card, "none", "the card arrives at once");
  },
);

await scenario(
  "under the config's reduced motion the marker holds still in the provider's portal",
  { mount: { configReduced: true } },
  async (page) => {
    await placement(page);
    const p = await pulse(page);
    // 1.38 s divided by the config's 0.001: one pulse in 23 minutes.
    assert.ok(parseFloat(p.duration) >= 1000, `a pulse takes ${p.duration}`);
  },
);

if (engine !== "webkit")
  await scenario(
    "forced colours draw the marker in Highlight and keep the edges",
    { media: { forcedColors: "active" } },
    async (page) => {
      await placement(page);
      const read = await page.evaluate(() => {
        const card = document.getElementById("step");
        const probe = document.createElement("i");
        probe.style.cssText =
          "forced-color-adjust:none;background-color:Highlight";
        card.appendChild(probe);
        const highlight = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const marker = getComputedStyle(
          card.querySelector(".kozmos-tour-step-marker"),
        );
        const s = getComputedStyle(card);
        return {
          highlight,
          marker: marker.backgroundColor,
          top: s.borderTopWidth,
          hintBar: getComputedStyle(
            card.querySelector(".kozmos-tour-step-hint"),
          ).borderInlineStartWidth,
        };
      });
      assert.equal(read.marker, read.highlight, "the marker is Highlight");
      assert.equal(read.top, "4px", "the top edge stays a line");
      assert.equal(read.hintBar, "4px", "the hint's bar stays a line");
    },
  );

// --- Direction and density ------------------------------------------------------

await scenario(
  "a coachmark's one action sits at the end, with no dots beside it",
  { mount: { coachmark: true, coachmarkAction: true } },
  async (page) => {
    await placement(page);
    const read = await page.evaluate(() => {
      const card = document.getElementById("step").getBoundingClientRect();
      const action = Array.from(document.querySelectorAll("#step button")).find(
        (b) => b.textContent === "Got it",
      );
      return {
        end: card.right - action.getBoundingClientRect().right,
        dots: document.querySelectorAll("#step .kozmos-stepper-dots").length,
        focused: document.activeElement === action,
      };
    });
    assert.equal(read.dots, 0, "no dots");
    assert.ok(
      Math.abs(read.end - 17) <= TOLERANCE,
      `Got it ends 17 from the card's end, read ${read.end}`,
    );
    assert.equal(read.focused, true, "focus is on its action");
  },
);

await scenario(
  "right to left, Close and the buttons mirror",
  { mount: { dir: "rtl" } },
  async (page) => {
    await placement(page);
    const read = await page.evaluate(() => {
      const card = document.getElementById("step").getBoundingClientRect();
      const box = (selector) =>
        document.querySelector(`#step ${selector}`).getBoundingClientRect();
      return {
        close: box(".kozmos-tour-step-close").left - card.left,
        next: box(".kozmos-tour-step-actions").left - card.left,
        dots: card.right - box(".kozmos-tour-step-dots").right,
        align: getComputedStyle(document.getElementById("step")).textAlign,
      };
    });
    assert.ok(
      Math.abs(read.close - 17) <= TOLERANCE,
      `Close is at the start of the left, read ${read.close}`,
    );
    assert.ok(
      Math.abs(read.next - 17) <= TOLERANCE,
      `the buttons end at the left, read ${read.next}`,
    );
    assert.ok(
      Math.abs(read.dots - 17) <= TOLERANCE,
      `the dots start at the right, read ${read.dots}`,
    );
    assert.equal(read.align, "start");
  },
);

for (const [density, close, next] of [
  ["touch", 44, 44],
  ["compact", 32, 40],
]) {
  await scenario(
    `${density}: Close ${close}, Next ${next} tall`,
    { mount: { density } },
    async (page) => {
      await placement(page);
      const read = await page.evaluate(() => {
        const box = (selector) =>
          document.querySelector(`#step ${selector}`).getBoundingClientRect();
        const nextButton = Array.from(
          document.querySelectorAll("#step button"),
        ).find((b) => b.textContent === "Next");
        return {
          close: [
            box(".kozmos-tour-step-close").width,
            box(".kozmos-tour-step-close").height,
          ],
          next: nextButton.getBoundingClientRect().height,
        };
      });
      assert.deepEqual(read.close, [close, close]);
      assert.equal(read.next, next);
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(
    `\n${failures.length} TourStep scenario(s) failed in ${engine}: ${failures.join("; ")}`,
  );
  process.exit(1);
}
console.log(`\nTourStep: ${passed} scenarios passed in ${engine}.`);
