/**
 * Accordion opens and closes over its content's height, on the built React
 * package in a real browser. Its content carried `animate-accordion-down`
 * and `animate-accordion-up`, which compiled to nothing: no config defined
 * the keyframes, so it opened and closed at once. Now the keyframes run from
 * and to Radix's `--radix-accordion-content-height`, and reduced motion,
 * the media query's or the design config's (`motion: "reduced"`), opens and
 * closes it at once.
 *
 * The content runs on the standard motion tokens, its duration and easing,
 * and the chevron turns on the same two, so they move together.
 *
 * Read here: at the tokens' own timing, the content's animation duration and
 * easing and the chevron's transition, each against the tokens as the
 * element sees them; then the animations running on the content just after
 * a press, and its height while one runs, with the standard duration token
 * set to 2800ms (so the read lands mid-way and the duration is seen to
 * follow the token), and in a reduced design config; and the same with the
 * browser asking for reduced motion.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-accordion-motion.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("accordion-motion.fixture.tsx");
const failures = [];
const notes = [];
let reads = 0;
const expect = (ok, message) => {
  reads += 1;
  if (!ok) failures.push(message);
};

/**
 * Presses an accordion's trigger and reads its content: what it runs at
 * once, and its height a moment later.
 */
async function press(page, id) {
  const accordion = page.getByTestId(id);
  await accordion.getByRole("button").click();
  return accordion
    .evaluate((root) => {
      const content = root.querySelector('[role="region"]');
      if (!content) return null;
      // The tokens as this content sees them, through a probe that takes
      // them as its own timing, so every engine's notation compares.
      const probe = document.createElement("div");
      probe.style.animationDuration =
        "var(--semantics-motion-duration-standard)";
      probe.style.animationTimingFunction =
        "var(--semantics-motion-easing-standard)";
      probe.style.transitionDuration =
        "var(--semantics-motion-duration-standard)";
      probe.style.transitionTimingFunction =
        "var(--semantics-motion-easing-standard)";
      content.append(probe);
      const token = getComputedStyle(probe);
      const tokens = {
        duration: token.animationDuration,
        easing: token.animationTimingFunction,
        transitionDuration: token.transitionDuration,
        transitionEasing: token.transitionTimingFunction,
      };
      probe.remove();
      const style = getComputedStyle(content);
      const chevron = root.querySelector("button svg");
      const turn = chevron ? getComputedStyle(chevron) : null;
      return {
        state: content.getAttribute("data-state"),
        name: style.animationName,
        duration: style.animationDuration,
        easing: style.animationTimingFunction,
        tokens,
        chevron: turn
          ? {
              property: turn.transitionProperty,
              duration: turn.transitionDuration,
              easing: turn.transitionTimingFunction,
            }
          : null,
        running: content
          .getAnimations()
          .filter((animation) => animation.playState === "running")
          .map((animation) => animation.animationName ?? ""),
        full: content.scrollHeight,
      };
    })
    .then(async (drawn) => {
      if (!drawn) return drawn;
      // A seventh of the 2.8s token in: part-way, if it moves at all.
      const height = await accordion.evaluate(
        (root) =>
          new Promise((done) =>
            setTimeout(() => {
              const content = root.querySelector('[role="region"]');
              done(content ? content.getBoundingClientRect().height : -1);
            }, 400),
          ),
      );
      return { ...drawn, height };
    });
}

/** Lets every animation on the page finish. */
const finish = (page) =>
  page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );

const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
try {
  for (const motion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({
      viewport: { width: 800, height: 600 },
      reducedMotion: motion,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<!doctype html><html><head></head><body style="margin:0"><div id="fixture"></div></body></html>',
    );
    await page.addStyleTag({ content: css });
    await page.addScriptTag({ content: code });
    await page.getByTestId("config-reduced").waitFor();
    await settleLayout(page);
    // At the tokens' own timing: the content's animation and the chevron's
    // turn run on the standard duration and easing, so they turn together.
    if (motion !== "reduce") {
      const where = `${engine}, motion allowed, at the tokens' timing`;
      const drawn = await press(page, "token");
      expect(drawn !== null, `${where}: no content after the press`);
      if (drawn) {
        expect(
          drawn.duration === drawn.tokens.duration &&
            drawn.easing === drawn.tokens.easing,
          `${where}: the content runs ${drawn.duration} ${drawn.easing}; expected the standard motion tokens, ${drawn.tokens.duration} ${drawn.tokens.easing}`,
        );
        expect(
          drawn.chevron !== null &&
            /transform|all/.test(drawn.chevron.property) &&
            drawn.chevron.duration === drawn.tokens.transitionDuration &&
            drawn.chevron.easing === drawn.tokens.transitionEasing,
          `${where}: the chevron turns over ${JSON.stringify(drawn.chevron)}; expected transform over the standard motion tokens, ${drawn.tokens.transitionDuration} ${drawn.tokens.transitionEasing}`,
        );
        notes.push(
          `${where}: content ${drawn.duration} ${drawn.easing}, chevron ${drawn.chevron?.duration} ${drawn.chevron?.easing}`,
        );
      }
      await finish(page);
      await settleLayout(page);
    }
    for (const id of ["plain", "config-reduced"]) {
      const where = `${engine}, ${motion === "reduce" ? "reduced motion asked" : "motion allowed"}, ${id === "plain" ? "a plain provider" : "a reduced design config"}`;
      const moves = motion !== "reduce" && id === "plain";
      for (const [direction, state] of [
        ["down", "open"],
        ["up", "closed"],
      ]) {
        const drawn = await press(page, id);
        expect(drawn !== null, `${where}: no content after the press`);
        if (!drawn) continue;
        if (moves) {
          expect(
            drawn.duration === drawn.tokens.duration &&
              drawn.tokens.duration === "2.8s",
            `${where}: ${state === "open" ? "opening" : "closing"}, the content runs over ${drawn.duration}; expected the standard duration token, set to 2800ms here (${drawn.tokens.duration})`,
          );
          expect(
            drawn.name.endsWith(`accordion-${direction}`) &&
              drawn.running.some((name) =>
                name.endsWith(`accordion-${direction}`),
              ),
            `${where}: ${state === "open" ? "opening" : "closing"}, the content runs ${JSON.stringify(drawn.running)} (animation-name ${drawn.name}); expected accordion-${direction}`,
          );
          expect(
            drawn.height > 0.5 && drawn.height < drawn.full - 0.5,
            `${where}: ${state === "open" ? "opening" : "closing"}, the content is ${drawn.height.toFixed(1)}px of ${drawn.full}px; expected it part-way`,
          );
        } else {
          expect(
            drawn.name === "none" && drawn.running.length === 0,
            `${where}: ${state === "open" ? "opening" : "closing"}, the content runs ${JSON.stringify(drawn.running)} (animation-name ${drawn.name}); expected none`,
          );
          if (state === "open")
            expect(
              Math.abs(drawn.height - drawn.full) < 0.5,
              `${where}: opened, the content is ${drawn.height.toFixed(1)}px of ${drawn.full}px; expected all of it at once`,
            );
        }
        await finish(page);
        await settleLayout(page);
      }
    }
    expect(
      errors.length === 0,
      `${motion}: the page threw: ${errors.join("; ")}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}

for (const note of notes) console.log(`  ${note}`);
if (failures.length) {
  console.error(
    `FAIL accordion motion (${engine}): ${failures.length} of ${reads} reads\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS accordion motion (${engine}): ${reads} reads — the content runs accordion-down opening and accordion-up closing on the standard motion tokens, part-way through its height, the chevron turning on the same tokens, and under reduced motion, the media query's or the design config's, opens and closes at once`,
);
