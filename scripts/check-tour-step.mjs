/**
 * TourStep (GAP-188), on the built package in a real browser
 * (packages/react/tests/integration/tour-step-host.tsx), measured against
 * the MAP-64 design it draws (canvas v104, decision 136): a page with a
 * "Start tour" button and an "Open a site" target, under a two-step tour
 * whose card points at the target, in light and dark, with and without every
 * @scope rule; and the design's welcome card, a coachmark and the card with
 * nothing to point at.
 *
 * - The card: 372 wide (23.25rem), 432 with the dismiss link (27rem), 420
 *   with no target (26.25rem, decision 139); Popover's surface with its 1
 *   subtle edge all round (no top edge) and the Control corner (decision
 *   118); 16 inside and sections 12 apart; the eyebrow Text xs semibold in
 *   the theme ink in sentence case, the title Heading 4 (20/28 bold) as an
 *   h2, the body Text sm muted, each colour from its token and 4.5:1 or more.
 * - The instruction: a Notice, info with Cursor02 or warning with its own
 *   mark, its 16 icon centred on its words, 8/12 inside, the Container
 *   corner, in the one polite live region, taking no room while empty.
 * - The progress: an 8 pill bar of the secondary fill, filled from the
 *   inline start in the theme ink to step/count, and "n of m" (Text xs muted)
 *   12 after it.
 * - The header and footer: Close a ghost 32 (44 at touch density) at the
 *   eyebrow's row's end, or no Close without onClose; Back ghost, the
 *   secondary outline and Next default, every one size sm (32, or 44 at
 *   touch), at the end, the dismiss link at the start; Next drawn disabled.
 *   The design's heights at compact density: a 32 header row, a 16 progress
 *   row and a 32 footer.
 * - The arrow: 24 by 12 in the card's fill, its tip 3 past the cut-out's ring
 *   and the card 15 past it on every side, as the boards draw it (09, 22,
 *   43); never clipped, as the card does not scroll; none with no target.
 * - Where it sits: on each side of the target, centred on it; beside a rect
 *   and a virtual element; in the middle of the window with no target or a
 *   ref to nothing; following the target as it moves; never wider than a
 *   narrow window.
 * - What a press does: on the dim and on the lit target the step stays
 *   open, and the press reaches the target through the cut-out.
 * - Focus and what a reader hears: a dialog named by its title and described
 *   by its tour, position, body and instruction; opened by the page (no
 *   press), focus is on Next, beside a virtual element too, on the card when
 *   Next is disabled, and a coachmark takes it on itself; Next draws the next
 *   step and focus stays on its own Next once Radix's timers have run;
 *   Escape closes it and focus goes back as PopoverContent gives it (GAP-190,
 *   #410), and does nothing on the welcome card, which has no onClose; axe
 *   finds nothing.
 * - Motion: the card arrives without its zoom under reduced motion, the
 *   system's or the config's mark in the portal; forced colours draw the
 *   arrow in the system's text colour and keep the edges.
 * - Right to left and both densities.
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
// Backdrop pads the cut-out 8 and rings it 2 outside. The design's arrow tip
// is 3 past its ring, and its 12 deep arrow sets the card 15 past it
// (MAP-64 boards 09, 22 and 43, measured).
const ARROW_GAP = 3;
const ARROW = { width: 24, height: 12 };
const RING_GAP = ARROW_GAP + ARROW.height;
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

/** The card's place, once its entry has finished, against the ring, the target and its arrow. */
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
    const arrow = card.querySelector(".kozmos-tour-step-arrow");
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
      arrow: box(arrow),
      arrowHidden: arrow
        ? getComputedStyle(arrow.parentElement).visibility === "hidden"
        : null,
      placement: card.dataset.placement,
      side: card.dataset.side,
      lit: ring?.closest(".kozmos-backdrop")?.hasAttribute("data-lit") ?? false,
    };
  });

function assertBeside(at, side, label) {
  assert.ok(at.ring, `${label}: the cut-out is lit (${JSON.stringify(at)})`);
  const { card, ring, arrow } = at;
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
    `${label}: the card ${RING_GAP} past the ring on the ${side}, read ${gap.toFixed(2)} (${JSON.stringify(at)})`,
  );
  assert.ok(
    Math.abs(off) <= TOLERANCE,
    `${label}: centred on the target, read ${off.toFixed(2)} off`,
  );
  // The arrow: 24 across and 12 deep (turned on the sides), between the
  // card and the ring, its tip 3 past the ring, on the target's middle.
  assert.ok(arrow && !at.arrowHidden, `${label}: the arrow is drawn`);
  const across = side === "top" || side === "bottom";
  assert.ok(
    Math.abs((across ? arrow.width : arrow.height) - ARROW.width) <= 0.5 &&
      Math.abs((across ? arrow.height : arrow.width) - ARROW.height) <= 0.5,
    `${label}: the arrow is 24 by 12 (${arrow.width} by ${arrow.height})`,
  );
  const tip = {
    bottom: arrow.top - ring.bottom,
    top: ring.top - arrow.bottom,
    right: arrow.left - ring.right,
    left: ring.left - arrow.right,
  }[side];
  const base = {
    bottom: card.top - arrow.bottom,
    top: arrow.top - card.bottom,
    right: card.left - arrow.right,
    left: arrow.left - card.right,
  }[side];
  assert.ok(
    Math.abs(tip - ARROW_GAP) <= TOLERANCE && Math.abs(base) <= TOLERANCE,
    `${label}: the arrow's tip ${ARROW_GAP} past the ring and its base on the card, read ${tip.toFixed(2)} and ${base.toFixed(2)}`,
  );
  const arrowOff = across
    ? arrow.left + arrow.width / 2 - (ring.left + ring.width / 2)
    : arrow.top + arrow.height / 2 - (ring.top + ring.height / 2);
  // Radix sets the arrow on whole pixels: within 1.5.
  assert.ok(
    Math.abs(arrowOff) <= 1.5,
    `${label}: the arrow points at the target's middle, read ${arrowOff.toFixed(2)} off`,
  );
}

function assertCentred(at, viewport, label) {
  const x = at.card.left + at.card.width / 2 - viewport.width / 2;
  const y = at.card.top + at.card.height / 2 - viewport.height / 2;
  assert.equal(at.placement, "centre", `${label}: the card places itself`);
  assert.equal(at.arrow, null, `${label}: with no arrow`);
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

/** "rgb(…)" or "color(srgb … / a)" as [r, g, b, a], 0–255 and 0–1. */
function rgba(value) {
  const srgb = value.match(/color\(srgb\s+([^)]+)\)/);
  if (srgb) {
    const [channels, alpha = "1"] = srgb[1].split("/");
    const [r, g, b] = channels.trim().split(/\s+/).map(Number);
    return [r * 255, g * 255, b * 255, Number(alpha)];
  }
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`not a colour: ${value}`);
  const [r, g, b, a = 1] = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  return [r, g, b, a];
}

/** Whether two colours are the same, to a rounding, alpha included. */
function sameColour(a, b, alpha) {
  const x = rgba(a);
  const y = rgba(b);
  return (
    x.slice(0, 3).every((v, i) => Math.abs(v - y[i]) <= 1.5) &&
    Math.abs(x[3] - (alpha ?? y[3])) <= 0.01
  );
}

/** Flattens "color(srgb …)" to "rgb(…)", over white where it is see-through. */
function flat(value, over = "rgb(255, 255, 255)") {
  const [r, g, b, a] = rgba(value);
  const [br, bg, bb] = rgba(over);
  const mix = (x, y) => Math.round(x * a + y * (1 - a));
  return `rgb(${mix(r, br)}, ${mix(g, bg)}, ${mix(b, bb)})`;
}

/** The card's geometry, styles and the tokens they come from, read in the page. */
const measure = (page) =>
  page.evaluate(() => {
    const card = document.getElementById("step");
    const round = (n) => Math.round(n * 100) / 100;
    const box = (node) => {
      if (!node) return null;
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
    const style = (selector) => {
      const node = q(selector);
      return node ? getComputedStyle(node) : null;
    };
    const sectionsNode = q(".kozmos-tour-step-sections");
    const sections = Array.from(sectionsNode.children).filter(
      (child) => getComputedStyle(child).position !== "absolute",
    );
    const sectionsStyle = getComputedStyle(sectionsNode);
    const eyebrow = style(".kozmos-tour-step-eyebrow");
    const title = style(".kozmos-tour-step-title");
    const notice = q(".kozmos-tour-step-instruction");
    const noticeStyle = notice ? getComputedStyle(notice) : null;
    const noticeIcon = notice?.querySelector("svg");
    const noticeText = notice?.querySelector("p");
    const bar = q(".kozmos-tour-step-progress-bar");
    const fill = bar?.firstElementChild;
    const text = q(".kozmos-tour-step-progress-text");
    const buttons = Array.from(
      card.querySelectorAll(".kozmos-tour-step-footer button"),
    ).map((button) => ({
      label: button.textContent,
      classes: button.className,
      disabled: button.disabled,
      opacity: getComputedStyle(button).opacity,
      ...box(button),
    }));
    const close = q(".kozmos-tour-step-close");
    return {
      card: box(card),
      rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
      radius: s.borderTopLeftRadius,
      overflow: s.overflowY,
      padding: [
        sectionsStyle.paddingTop,
        sectionsStyle.paddingRight,
        sectionsStyle.paddingBottom,
        sectionsStyle.paddingLeft,
      ],
      borders: [
        s.borderTopWidth,
        s.borderRightWidth,
        s.borderBottomWidth,
        s.borderLeftWidth,
      ],
      edges: [
        s.borderTopColor,
        s.borderRightColor,
        s.borderBottomColor,
        s.borderLeftColor,
      ],
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
      header: box(q(".kozmos-tour-step-header")),
      eyebrow: eyebrow && {
        ...box(q(".kozmos-tour-step-eyebrow")),
        color: eyebrow.color,
        font: `${eyebrow.fontSize}/${eyebrow.lineHeight}/${eyebrow.fontWeight}`,
        transform: eyebrow.textTransform,
        tracking: eyebrow.letterSpacing,
        text: q(".kozmos-tour-step-eyebrow").textContent,
      },
      close: close && {
        ...box(close),
        background: getComputedStyle(close).backgroundColor,
        border: getComputedStyle(close).borderTopWidth,
        classes: close.className,
        icon: box(close.querySelector("svg")),
      },
      title: {
        ...box(q(".kozmos-tour-step-title")),
        tag: q(".kozmos-tour-step-title").tagName,
        color: title.color,
        font: `${title.fontSize}/${title.lineHeight}/${title.fontWeight}`,
      },
      body: q(".kozmos-tour-step-body") && {
        ...box(q(".kozmos-tour-step-body")),
        color: style(".kozmos-tour-step-body").color,
        font: `${style(".kozmos-tour-step-body").fontSize}/${style(".kozmos-tour-step-body").lineHeight}`,
      },
      notice: notice && {
        ...box(notice),
        tone: notice.dataset.tone,
        border: noticeStyle.borderTopColor,
        borderWidth: noticeStyle.borderTopWidth,
        background: noticeStyle.backgroundColor,
        color: noticeStyle.color,
        radius: noticeStyle.borderTopLeftRadius,
        padding: [
          noticeStyle.paddingTop,
          noticeStyle.paddingRight,
          noticeStyle.paddingBottom,
          noticeStyle.paddingLeft,
        ],
        font: `${getComputedStyle(noticeText).fontSize}/${getComputedStyle(noticeText).fontWeight}`,
        lineHeight: parseFloat(getComputedStyle(noticeText).lineHeight),
        text: box(noticeText),
        icon: box(noticeIcon),
        pointer: !!noticeIcon?.innerHTML.includes("M20.5056 10.7754"),
      },
      progress: bar && {
        row: box(q(".kozmos-tour-step-progress")),
        bar: box(bar),
        fill: box(fill),
        track: getComputedStyle(bar).backgroundColor,
        ink: getComputedStyle(fill).backgroundColor,
        radius: parseFloat(getComputedStyle(bar).borderTopLeftRadius),
        text: {
          ...box(text),
          words: text.textContent,
          color: getComputedStyle(text).color,
          font: getComputedStyle(text).fontSize,
        },
      },
      footer: box(q(".kozmos-tour-step-footer")),
      buttons,
      arrow: q(".kozmos-tour-step-arrow") && {
        ...box(q(".kozmos-tour-step-arrow")),
        fill: getComputedStyle(q(".kozmos-tour-step-arrow")).fill,
        filter: getComputedStyle(q(".kozmos-tour-step-arrow")).filter,
      },
      tokens: {
        ink: token("--primitives-colors-theme-600"),
        popover: token("--primitives-colors-background-0"),
        foreground: token("--primitives-colors-foreground-0"),
        muted: token("--primitives-colors-foreground-400"),
        subtle: token("--semantics-border-subtle"),
        secondary: token("--primitives-colors-background-200"),
        info: token("--primitives-colors-emotional-info-700"),
        infoText: token("--semantics-emotion-informative-text"),
        warning: token("--primitives-colors-emotional-alert-800"),
        warningText: token("--semantics-emotion-alert-text"),
      },
    };
  });

/** Whether `inner`'s middle is `outer`'s, across the block axis. */
const middleOf = (inner, outer) =>
  Math.abs(inner.y + inner.h / 2 - (outer.y + outer.h / 2));

// --- The card, from its tokens ----------------------------------------------

for (const [mode, stylesheet] of [
  ["full", css],
  ["without @scope", unscoped.toString()],
]) {
  for (const theme of ["light", "dark"]) {
    await scenario(
      `the card, ${theme}, ${mode}: 372 wide, its edge all round, the Control corner, 16 inside, 12 apart, the design's type`,
      { stylesheet, mount: { theme, density: "compact" } },
      async (page) => {
        await placement(page);
        const m = await measure(page);
        assert.equal(m.card.w, 23.25 * m.rootFont, "372 wide, as 23.25rem");
        assert.equal(m.radius, "16px", "the Control corner (decision 118)");
        assert.deepEqual(
          m.padding,
          ["16px", "16px", "16px", "16px"],
          "16 inside",
        );
        assert.deepEqual(
          m.borders,
          ["1px", "1px", "1px", "1px"],
          "one 1 edge all round: no top edge",
        );
        assert.ok(
          m.edges.every((edge) => edge === m.tokens.subtle),
          `every edge is the subtle border, the top too (${m.edges})`,
        );
        assert.equal(m.background, m.tokens.popover, "the popover fill");
        assert.equal(m.overflow, "visible", "the card itself never scrolls");
        assert.equal(
          m.zIndex,
          "51",
          "one above the overlay layer, where the backdrop is",
        );
        assert.ok(
          m.gaps.length === 5 &&
            m.gaps.every((gap) => Math.abs(gap - 12) <= 0.5),
          `five sections after the header, 12 apart (${m.gaps})`,
        );
        // The eyebrow: Text xs semibold primary, in sentence case.
        assert.equal(m.eyebrow.color, m.tokens.ink, "the eyebrow's theme ink");
        assert.equal(m.eyebrow.font, "12px/16px/600", "Text xs semibold");
        assert.equal(m.eyebrow.transform, "none", "sentence case");
        assert.equal(m.eyebrow.tracking, "normal", "no tracking");
        assert.equal(
          m.eyebrow.text,
          "How Pointr Cloud is organised · 1 of 2",
          "{tour} · {step} of {count}",
        );
        // The title: Heading 4 as an h2, the whole width, under the eyebrow.
        assert.equal(m.title.tag, "H2");
        assert.equal(m.title.font, "20px/28px/700", "Heading 4: 20/28 bold");
        assert.equal(m.title.color, m.tokens.foreground, "the foreground");
        assert.equal(m.title.w, m.header.w, "the title takes the whole width");
        assert.ok(m.title.y >= m.header.bottom, "under the eyebrow's row");
        // The body: Text sm muted.
        assert.equal(m.body.color, m.tokens.muted, "the body's muted ink");
        assert.equal(m.body.font, "14px/20px", "Text sm");
        // The progress: an 8 pill bar, the secondary track, the theme ink
        // filled to 1 of 2 from the inline start, and the words 12 after it.
        const p = m.progress;
        assert.equal(p.bar.h, 8, "an 8 bar");
        assert.ok(p.radius >= 4, `a pill (${p.radius})`);
        assert.equal(p.track, m.tokens.secondary, "the secondary track");
        assert.equal(p.ink, m.tokens.ink, "the theme ink");
        assert.ok(
          Math.abs(p.fill.w - p.bar.w / 2) <= 1 && p.fill.x === p.bar.x,
          `filled to 1 of 2 from the start (${p.fill.w} of ${p.bar.w})`,
        );
        assert.equal(p.text.words, "1 of 2");
        assert.equal(p.text.color, m.tokens.muted, "the words in muted ink");
        assert.equal(p.text.font, "12px", "Text xs");
        assert.ok(
          Math.abs(p.text.x - p.bar.right - 12) <= 0.5 &&
            p.text.right === p.row.right,
          `the words 12 after the bar, at the row's end (${p.text.x - p.bar.right})`,
        );
        assert.ok(
          middleOf(p.bar, p.text) <= 0.5,
          "the bar on the words' middle",
        );
        // Every button size sm, Next the default fill.
        assert.ok(
          m.buttons.every((button) =>
            button.classes.includes("kozmos-button-size-sm"),
          ),
          "every button is size sm",
        );
        const contrasts = [
          ["the eyebrow", m.eyebrow.color, m.background],
          ["the title", m.title.color, m.background],
          ["the body", m.body.color, m.background],
          ["the progress's words", p.text.color, m.background],
        ];
        if (mode === "full")
          contrasts.push([
            "the instruction",
            m.notice.color,
            flat(m.notice.background, m.background),
          ]);
        for (const [what, fore, back] of contrasts) {
          const ratio = contrast(fore, back);
          assert.ok(
            ratio >= 4.5,
            `${what} reads ${ratio.toFixed(2)}:1, under 4.5`,
          );
        }
        // The arrow: the card's fill.
        assert.equal(m.arrow.fill, m.background, "the arrow is the card's fill");
        assert.ok(
          m.arrow.filter.startsWith("drop-shadow"),
          `with a soft edge (${m.arrow.filter})`,
        );
      },
    );
  }
}

for (const theme of ["light", "dark"]) {
  for (const tone of ["info", "warning"]) {
    await scenario(
      `the instruction, ${theme}, ${tone}: a Notice, its icon 16 on its words' middle, 8/12 inside, the Container corner`,
      { mount: { theme, density: "compact", instructionTone: tone } },
      async (page) => {
        await placement(page);
        const m = await measure(page);
        const n = m.notice;
        assert.equal(n.tone, tone);
        const fill = tone === "info" ? m.tokens.info : m.tokens.warning;
        const ink = tone === "info" ? m.tokens.infoText : m.tokens.warningText;
        assert.ok(
          sameColour(n.border, fill, 0.5) && n.borderWidth === "1px",
          `a 1 edge of the ${tone} fill at 50% (${n.border})`,
        );
        assert.ok(
          sameColour(n.background, fill, 0.05),
          `on the ${tone} fill at 5% (${n.background})`,
        );
        assert.equal(n.color, ink, `in the ${tone} ink`);
        assert.equal(n.radius, "20px", "the Container corner");
        assert.deepEqual(n.padding, ["8px", "12px", "8px", "12px"]);
        assert.equal(n.font, "14px/600", "Text sm semibold");
        assert.equal(n.icon.w, 16, "a 16 icon");
        assert.equal(n.icon.h, 16, "a 16 icon");
        assert.ok(
          middleOf(n.icon, n.text) <= 0.5,
          `the icon on the words' middle (${middleOf(n.icon, n.text)})`,
        );
        assert.equal(
          n.pointer,
          tone === "info",
          tone === "info" ? "Cursor02" : "the warning's own mark",
        );
        assert.ok(
          Math.abs(n.text.x - n.icon.right - 8) <= 0.5,
          "the words 8 after the icon",
        );
        // Two lines: 8 + 2 lines + 8, inside its edge (the design's 57).
        const lines = Math.round(n.text.h / n.lineHeight);
        assert.ok(
          Math.abs(n.h - (2 + 16 + lines * n.lineHeight)) <= 0.5,
          `${lines} lines, ${n.h} tall`,
        );
        const ratio = contrast(n.color, flat(n.background, m.background));
        assert.ok(ratio >= 4.5, `its words read ${ratio.toFixed(2)}:1`);
      },
    );
  }
}

// --- The design's heights, at compact density ---------------------------------

await scenario(
  "at compact density, the design's rows: a 32 header with the eyebrow on Close's middle, a 16 progress row, a 32 footer",
  { mount: { density: "compact" } },
  async (page) => {
    await placement(page);
    const m = await measure(page);
    assert.equal(m.header.h, 32, "the header row is Close's 32");
    assert.ok(
      middleOf(m.eyebrow, m.close) <= 0.5,
      "the eyebrow on Close's middle",
    );
    assert.equal(m.close.right, m.header.right, "Close at the row's end");
    assert.equal(m.progress.row.h, 16, "the progress row is its words' 16");
    assert.equal(m.footer.h, 32, "the footer is its buttons' 32");
    // Padding, rows and gaps add up to the card, as the design's do.
    const rows = [
      m.header.h,
      m.title.h,
      m.body.h,
      m.notice.h,
      m.progress.row.h,
      m.footer.h,
    ];
    const height = 2 + 32 + rows.reduce((a, b) => a + b, 0) + 5 * 12;
    assert.ok(
      Math.abs(m.card.h - height) <= 0.5,
      `the card is its rows, ${height}, read ${m.card.h}`,
    );
  },
);

for (const [density, size] of [
  ["touch", 44],
  ["compact", 32],
]) {
  await scenario(
    `${density}: Close a ghost ${size} with a 16 x-close, Back ghost and Next default, both size sm, ${size} tall`,
    { mount: { density, open: false } },
    async (page) => {
      await page.evaluate(() => window.tourStep.open());
      await placement(page);
      // Moved on, so Back is drawn.
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("dialog", { name: "Open a building" }).waitFor();
      await placement(page);
      const m = await measure(page);
      assert.deepEqual([m.close.w, m.close.h], [size, size]);
      assert.equal(m.close.border, "0px", "a ghost: no edge");
      assert.ok(m.close.classes.includes("kozmos-button-ghost"));
      assert.deepEqual([m.close.icon.w, m.close.icon.h], [16, 16]);
      const labels = m.buttons.map((button) => button.label);
      assert.deepEqual(labels, ["Back", "Done"]);
      assert.ok(m.buttons[0].classes.includes("kozmos-button-ghost"));
      assert.ok(m.buttons[1].classes.includes("kozmos-button-default"));
      assert.ok(
        m.buttons.every((button) => button.h === size),
        `${size} tall (${m.buttons.map((button) => button.h)})`,
      );
      assert.equal(
        m.buttons[1].right,
        m.footer.right,
        "Next at the footer's end",
      );
      assert.equal(
        Math.round(m.buttons[1].x - m.buttons[0].right),
        8,
        "8 apart",
      );
    },
  );
}

// --- The design's other cards ---------------------------------------------------

await scenario(
  "the welcome card: 432 wide, no Close and no progress, Don't show again at the start and Not now and Show me the tours at the end, on one line; Escape leaves it",
  {
    mount: {
      welcome: true,
      density: "compact",
      side: "bottom",
      align: "end",
    },
  },
  async (page) => {
    await placement(page);
    const m = await measure(page);
    assert.equal(m.card.w, 27 * m.rootFont, "432 wide, as 27rem");
    assert.equal(m.close, null, "no Close");
    assert.equal(m.progress, null, "no progress");
    assert.equal(m.eyebrow.text, "Welcome");
    assert.equal(m.header.h, 16, "the eyebrow's row is its words alone");
    assert.deepEqual(
      m.buttons.map((button) => button.label),
      ["Don't show again", "Not now", "Show me the tours"],
    );
    const [dismiss, secondary, next] = m.buttons;
    assert.ok(dismiss.classes.includes("kozmos-button-link"));
    assert.ok(secondary.classes.includes("kozmos-button-outline"));
    assert.ok(next.classes.includes("kozmos-button-default"));
    assert.equal(dismiss.x, m.footer.x, "the link at the start");
    assert.equal(next.right, m.footer.right, "Next at the end");
    assert.ok(
      new Set(m.buttons.map((button) => button.y)).size === 1,
      `one line (${m.buttons.map((button) => button.y)})`,
    );
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Show me the tours",
      "focus is on Next",
    );
    await page.keyboard.press("Escape");
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(await page.locator("#step").count(), 1, "Escape leaves it");
    await page.getByRole("button", { name: "Don't show again" }).click();
    await page.locator("#step").waitFor({ state: "detached" });
    assert.deepEqual(
      await page.evaluate(() => window.tourStep.actions()),
      ["dismiss"],
    );
  },
);

await scenario(
  "a step its own action completes: Next drawn disabled, focus on the card, and a press on Next does nothing (D11)",
  { mount: { density: "compact", nextDisabled: true } },
  async (page) => {
    await placement(page);
    const m = await measure(page);
    const next = m.buttons.find((button) => button.label === "Next");
    assert.equal(next.disabled, true, "Next is there, disabled");
    assert.equal(next.opacity, "0.5", "drawn at 50%");
    assert.equal(
      await page.evaluate(
        () => document.activeElement === document.getElementById("step"),
      ),
      true,
      "the card has focus",
    );
    await page
      .getByRole("button", { name: "Next" })
      .click({ force: true })
      .catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(
      await page.getByRole("dialog", { name: "Open a site" }).count(),
      1,
      "the step stays",
    );
  },
);

await scenario(
  "a secondary action: an outline sm between Back and Next",
  { mount: { density: "compact", secondary: true, open: false } },
  async (page) => {
    await page.evaluate(() => window.tourStep.open());
    await placement(page);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("dialog", { name: "Open a building" }).waitFor();
    await placement(page);
    const m = await measure(page);
    assert.deepEqual(
      m.buttons.map((button) => button.label),
      ["Back", "Finish without adding", "Done"],
    );
    assert.ok(m.buttons[1].classes.includes("kozmos-button-outline"));
    assert.ok(m.buttons.every((button) => button.h === 32));
    await page.getByRole("button", { name: "Finish without adding" }).click();
    assert.deepEqual(
      await page.evaluate(() => window.tourStep.actions()),
      ["secondary"],
    );
  },
);

// --- Where it sits -----------------------------------------------------------

for (const side of ["bottom", "top", "right", "left"]) {
  await scenario(
    `beside the target on the ${side}: the arrow's tip 3 past the cut-out's ring, the card 15`,
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
    `with ${target === "none" ? "no target" : "a ref to nothing"}, 420 wide in the middle of the window, with no arrow`,
    { mount: { target } },
    async (page) => {
      const at = await placement(page);
      assertCentred(at, VIEWPORT, target);
      const m = await measure(page);
      assert.equal(m.card.w, 26.25 * m.rootFont, "420 wide (decision 139)");
    },
  );
}

await scenario(
  "the arrow is never clipped: the point under its middle is the arrow, while the card enters too",
  { mount: { open: false } },
  async (page) => {
    await page.evaluate(() => window.tourStep.open());
    // Read at once, while the card zooms in, and again once it is still.
    const hits = [];
    for (let i = 0; i < 2; i += 1) {
      if (i === 1) await placement(page);
      hits.push(
        await until(page, () => {
          const arrow = document.querySelector(
            "#step .kozmos-tour-step-arrow",
          );
          if (!arrow) return { ok: false };
          const r = arrow.getBoundingClientRect();
          if (!r.width) return { ok: false };
          // A third of the way in from the base, on the middle.
          const at = document.elementFromPoint(
            r.left + r.width / 2,
            r.bottom - r.height / 3,
          );
          return {
            ok: true,
            arrow: arrow.contains(at) || at === arrow,
            at: at?.tagName,
          };
        }),
      );
    }
    assert.ok(
      hits.every((hit) => hit.arrow),
      `the arrow is under its own middle (${JSON.stringify(hits)})`,
    );
  },
);

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
    // Lower down, the card may flip above it: wherever it is, it is beside.
    const moved = await placement(page);
    assertBeside(moved, moved.side, "after the move");
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

await scenario(
  "in a short window, its sections scroll inside the card, and the card stays in the window",
  {
    viewport: { width: 1000, height: 280 },
    mount: { target: "none", density: "compact" },
  },
  async (page) => {
    const at = await placement(page);
    const read = await page.evaluate(() => {
      const sections = document.querySelector(
        "#step .kozmos-tour-step-sections",
      );
      return {
        scrolls: sections.scrollHeight > sections.clientHeight,
        overflow: getComputedStyle(sections).overflowY,
      };
    });
    assert.ok(
      at.card.top >= 16 - TOLERANCE && at.card.bottom <= 360 - 16 + TOLERANCE,
      `inside the window (${JSON.stringify(at.card)})`,
    );
    assert.ok(
      at.card.bottom <= 280 - 16 + TOLERANCE,
      `inside the window (${JSON.stringify(at.card)})`,
    );
    assert.deepEqual(read, { scrolls: true, overflow: "auto" });
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
  "a popover its content opens is above the card",
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
        const bar = card.querySelector('[role="progressbar"]');
        return {
          modal: card.getAttribute("aria-modal"),
          description: (card.getAttribute("aria-describedby") ?? "")
            .split(" ")
            .map((id) => document.getElementById(id)?.textContent.trim())
            .filter(Boolean),
          active: card.contains(active)
            ? active.textContent
            : `outside: ${active?.tagName}`,
          progress: [
            bar?.getAttribute("aria-label"),
            bar?.getAttribute("aria-valuetext"),
          ],
        };
      });
      assert.equal(read.modal, null, "not modal");
      assert.deepEqual(read.description, [
        "How Pointr Cloud is organised",
        "1 of 2",
        "Each site in this client is listed here.",
        "Go ahead and open a site to proceed to the next step.",
      ]);
      assert.equal(read.active, "Next", "focus is on Next");
      assert.deepEqual(
        read.progress,
        ["Tour progress", "1 of 2"],
        "the bar is named and read as the position",
      );
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
      await page.locator('#step [role="progressbar"]').count(),
      0,
      "no progress",
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
      "Done",
      "focus is on the second step's Next, Done",
    );
    assert.equal(
      await page.evaluate(() => window.tourStep.closes()),
      0,
      "nothing closed the tour",
    );
  },
);

await scenario(
  "Escape closes it, and focus goes back to the button that opened it",
  { mount: { open: false } },
  async (page) => {
    // From the keyboard: WebKit gives a button no focus when it is clicked,
    // so there a click leaves nothing to go back to but the target.
    await page.locator("#start").focus();
    await page.keyboard.press("Enter");
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

await scenario(
  "started while a Popover is open: the dim is over the popover and the card above both",
  { mount: { open: false, pagePopover: true } },
  async (page) => {
    await page.locator("#page-popover").waitFor();
    await page.evaluate(() => window.tourStep.open());
    await placement(page);
    const tops = await page.evaluate(() => {
      const top = (id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        const at = document.elementFromPoint(r.left + 8, r.top + 8);
        return at?.closest("#step")
          ? "card"
          : at?.closest(".kozmos-tour-step-backdrop")
            ? "dim"
            : at?.closest("#page-popover")
              ? "popover"
              : at?.id || at?.tagName;
      };
      return { popover: top("page-popover"), card: top("step") };
    });
    assert.deepEqual(tops, { popover: "dim", card: "card" });
  },
);

await scenario(
  "inside a modal Dialog: its card works over the dialog, Next moves it on, and Escape closes the step, not the dialog",
  { mount: { inDialog: true } },
  async (page) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await placement(page);
    const read = () =>
      page.evaluate(() => {
        const card = document.getElementById("step");
        const backdrop = document.querySelector(".kozmos-tour-step-backdrop");
        const modal = document.getElementById("modal");
        const r = card?.getBoundingClientRect();
        const hit = r && document.elementFromPoint(r.left + 20, r.top + 20);
        return {
          open: !!card,
          active: card?.contains(document.activeElement)
            ? document.activeElement.textContent
            : document.activeElement?.id,
          hidden: [card, backdrop].filter((node) =>
            node?.closest('[aria-hidden="true"]'),
          ).length,
          backdropInModal: !!backdrop && modal.contains(backdrop),
          cardOnTop: !!hit && card.contains(hit),
          dialogOpen: !!modal,
        };
      });
    let r = await read();
    assert.deepEqual(
      r,
      {
        open: true,
        active: "Next",
        hidden: 0,
        backdropInModal: true,
        cardOnTop: true,
        dialogOpen: true,
      },
      "open on Next, readable, the dim in the dialog, the card on top",
    );
    await page.mouse.click(
      ...(await (async () => {
        const box = await page
          .getByRole("button", { name: "Next" })
          .boundingBox();
        return [box.x + box.width / 2, box.y + box.height / 2];
      })()),
    );
    await page.getByRole("dialog", { name: "Open a building" }).waitFor();
    await new Promise((resolve) => setTimeout(resolve, 300));
    r = await read();
    assert.equal(
      r.active,
      "Done",
      "a press on Next moved it on, focus on the next step's Next",
    );
    await page.keyboard.press("Escape");
    await page.locator("#step").waitFor({ state: "detached" });
    r = await read();
    assert.equal(r.dialogOpen, true, "the dialog stays open");
    assert.equal(
      await page.evaluate(() => window.tourStep.closes()),
      1,
      "the step closed once",
    );
  },
);

for (const mount of [{}, { welcome: true }, { instructionTone: "warning" }]) {
  await scenario(
    `axe finds nothing while it is open${mount.welcome ? ", the welcome card" : mount.instructionTone ? ", a warning" : ""}`,
    { mount },
    async (page) => {
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
    },
  );
}

// --- The instruction's live region ----------------------------------------------

await scenario(
  "the instruction's region is one live region, there from the start, taking no room while empty",
  {},
  async (page) => {
    await placement(page);
    const read = () =>
      page.evaluate(() => {
        const card = document.getElementById("step");
        const status = card.querySelectorAll('[role="status"], [aria-live]');
        const body = card
          .querySelector(".kozmos-tour-step-body")
          .getBoundingClientRect();
        const progress = card
          .querySelector(".kozmos-tour-step-progress")
          .getBoundingClientRect();
        return {
          regions: status.length,
          live: status[0]?.getAttribute("aria-live"),
          text: status[0]?.textContent ?? null,
          bodyToProgress: Math.round((progress.top - body.bottom) * 100) / 100,
        };
      });
    const first = await page.evaluateHandle(() =>
      document.querySelector('#step [role="status"]'),
    );
    assert.deepEqual(
      (({ regions, live }) => ({ regions, live }))(await read()),
      { regions: 1, live: "polite" },
      "one region, polite, the Notice in it no region of its own",
    );
    await page.evaluate(() => window.tourStep.setInstruction(null));
    await settleLayout(page);
    const empty = await read();
    assert.equal(empty.text, "", "empty, and still there");
    assert.equal(empty.bodyToProgress, 12, "the empty region takes no room");
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

const motion = (page) =>
  page.evaluate(
    () => getComputedStyle(document.getElementById("step")).animationName,
  );

await scenario(
  "under the system's reduced motion the card arrives without its zoom",
  { media: { reducedMotion: "reduce" } },
  async (page) => {
    await placement(page);
    assert.equal(await motion(page), "none", "the card arrives at once");
  },
);

await scenario(
  "under the config's reduced motion the card arrives without its zoom, in the provider's portal",
  { mount: { configReduced: true } },
  async (page) => {
    await placement(page);
    // The config's mark reaches the portal the card is drawn in (#418).
    assert.equal(
      await page.evaluate(
        () =>
          !!document
            .getElementById("step")
            .closest('[data-kozmos-motion="reduced"]'),
      ),
      true,
      "the card is under the config's mark",
    );
    assert.equal(await motion(page), "none", "the card arrives at once");
  },
);

if (engine !== "webkit")
  await scenario(
    "forced colours draw the arrow in the system's text colour and keep the edges",
    { media: { forcedColors: "active" } },
    async (page) => {
      await placement(page);
      const read = await page.evaluate(() => {
        const card = document.getElementById("step");
        const probe = document.createElement("i");
        probe.style.cssText = "forced-color-adjust:none;color:CanvasText";
        card.appendChild(probe);
        const text = getComputedStyle(probe).color;
        probe.remove();
        const arrow = getComputedStyle(
          card.querySelector(".kozmos-tour-step-arrow"),
        );
        const s = getComputedStyle(card);
        return {
          text,
          arrow: arrow.fill,
          filter: arrow.filter,
          top: s.borderTopWidth,
          notice: getComputedStyle(
            card.querySelector(".kozmos-tour-step-instruction"),
          ).borderTopWidth,
        };
      });
      assert.equal(read.arrow, read.text, "the arrow is CanvasText");
      assert.equal(read.filter, "none", "with no shadow");
      assert.equal(read.top, "1px", "the card's edge stays a line");
      assert.equal(read.notice, "1px", "the instruction's edge stays a line");
    },
  );

// --- Direction and density ------------------------------------------------------

await scenario(
  "a coachmark's one action sits at the end, with no progress beside it",
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
        progress: document.querySelectorAll('#step [role="progressbar"]')
          .length,
        focused: document.activeElement === action,
      };
    });
    assert.equal(read.progress, 0, "no progress");
    assert.ok(
      Math.abs(read.end - 17) <= TOLERANCE,
      `Got it ends 17 from the card's end, read ${read.end}`,
    );
    assert.equal(read.focused, true, "focus is on its action");
  },
);

await scenario(
  "right to left, the eyebrow, Close, the progress and the buttons mirror",
  { mount: { dir: "rtl", density: "compact" } },
  async (page) => {
    await placement(page);
    const m = await measure(page);
    const card = m.card;
    assert.ok(
      Math.abs(m.close.x - card.x - 17) <= TOLERANCE,
      `Close at the left, read ${m.close.x - card.x}`,
    );
    assert.ok(
      Math.abs(card.right - m.eyebrow.right - 17) <= TOLERANCE,
      `the eyebrow at the right, read ${card.right - m.eyebrow.right}`,
    );
    const next = m.buttons.at(-1);
    assert.ok(
      Math.abs(next.x - card.x - 17) <= TOLERANCE,
      `the buttons end at the left, read ${next.x - card.x}`,
    );
    const p = m.progress;
    assert.ok(
      Math.abs(card.right - p.bar.right - 17) <= TOLERANCE &&
        p.fill.right === p.bar.right,
      `the bar at the right, filled from the right (${card.right - p.bar.right}, ${p.fill.right} of ${p.bar.right})`,
    );
    assert.ok(p.text.right <= p.bar.x, "the words to the bar's left");
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.getElementById("step")).textAlign,
      ),
      "start",
    );
  },
);

await browser.close();
if (failures.length) {
  console.error(
    `\n${failures.length} TourStep scenario(s) failed in ${engine}: ${failures.join("; ")}`,
  );
  process.exit(1);
}
console.log(`\nTourStep: ${passed} scenarios passed in ${engine}.`);
