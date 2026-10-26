/**
 * Stepper's dots (GAP-191), on the built package in a real browser
 * (packages/react/tests/integration/stepper-dots-host.tsx): a five-step tour
 * on its second step, on the page, on a popover (a tour's step card) and on
 * the muted fill, in light and dark.
 *
 * - Contrast (WCAG 1.4.11): every dot, done, current and pending, is at
 *   least 3:1 against the surface it sits on, computed from the colours the
 *   browser resolves for the dot and for the first ancestor that paints a
 *   background. The wireframe's pending #D5DAE3 on white read about 1.4:1.
 *   Each colour is also read back as a pixel at the dot's centre, so a class
 *   that compiles to nothing cannot pass on its computed value.
 * - Shape: done and pending dots are 8 by 8, the current one 20 by 8, 6
 *   apart; under reduced motion, the media query's or the config's
 *   ([data-kozmos-motion="reduced"]), the current dot's width does not
 *   animate.
 * - Name: the dots are a group named "Step 2 of 5", from positionLabel (a
 *   function and a template are both read), a list whose items are named by
 *   the steps, and the current item, and only it, is aria-current="step". In
 *   Chromium its own accessibility tree is read too.
 * - Forced colours: done and current dots are the system's Highlight, and
 *   pending ones an outline in CanvasText, so none is repainted away.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-stepper-dots.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("stepper-dots-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
const ratios = [];
let reads = 0;

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
const parse = (colour) => {
  const n = colour.match(/[\d.]+/g).map(Number);
  return { rgb: n.slice(0, 3), alpha: n.length > 3 ? n[3] : 1 };
};
const luminance = ([r, g, b]) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

async function open({
  theme,
  surface,
  forced = "none",
  reduced = "no-preference",
  ...rest
}) {
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({
    forcedColors: forced,
    reducedMotion: reduced,
    colorScheme: theme,
  });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Stepper dots</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.evaluate((mount) => window.stepperDots.mount(mount), {
    theme,
    surface,
    ...rest,
  });
  await settleLayout(page);
  return { page, errors };
}

/** Each dot's state, box and colours, and the surface it sits on. */
const read = (page) =>
  page.evaluate(() => {
    const dots = [...document.querySelectorAll("#stepper li")];
    let surface = document.getElementById("stepper");
    // Transparent is any colour at alpha 0: forced colours keep the alpha
    // and change the colour, rgba(255, 255, 255, 0) in Chromium.
    const clear = (node) => {
      const c = getComputedStyle(node).backgroundColor;
      const n = c.match(/[\d.]+/g) ?? [];
      return c === "transparent" || (n.length === 4 && Number(n[3]) === 0);
    };
    while (surface && clear(surface)) surface = surface.parentElement;
    const probe = document.createElement("div");
    probe.style.cssText =
      "forced-color-adjust:none;background:Highlight;color:CanvasText";
    document.getElementById("stepper").append(probe);
    const system = {
      highlight: getComputedStyle(probe).backgroundColor,
      canvasText: getComputedStyle(probe).color,
    };
    probe.remove();
    return {
      surface: surface ? getComputedStyle(surface).backgroundColor : null,
      surfaceBox: surface?.getBoundingClientRect().toJSON(),
      system,
      dots: dots.map((dot) => {
        const style = getComputedStyle(dot);
        const box = dot.getBoundingClientRect();
        return {
          state: dot.getAttribute("data-state"),
          current: dot.getAttribute("aria-current"),
          text: dot.textContent,
          background: style.backgroundColor,
          outline:
            style.outlineStyle === "none"
              ? null
              : `${style.outlineWidth} ${style.outlineColor}`,
          transition: style.transitionDuration,
          box: {
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          },
        };
      }),
    };
  });

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

for (const theme of ["light", "dark"])
  for (const surface of ["page", "popover", "muted"])
    await scenario(
      `${theme}, on the ${surface}: every dot is 3:1 or more, drawn as computed, and shaped by its state`,
      async (problems) => {
        const { page, errors } = await open({ theme, surface });
        const state = await read(page);
        reads += 1;
        if (state.dots.length !== 5) {
          problems.push(`${state.dots.length} dots, not 5`);
          await page.close();
          return;
        }
        const expected = ["done", "current", "pending", "pending", "pending"];
        if (state.dots.map((d) => d.state).join() !== expected.join())
          problems.push(
            `the states are ${state.dots.map((d) => d.state).join(", ")}`,
          );
        const surfaceColour = parse(state.surface).rgb;
        const shot = await page.screenshot();
        const centres = state.dots.map((d) => [
          d.box.left + d.box.width / 2,
          d.box.top + d.box.height / 2,
        ]);
        const drawn = await pixels(shot, centres);
        for (const [index, dot] of state.dots.entries()) {
          const colour = parse(dot.background);
          reads += 2;
          const ratio = contrast(colour.rgb, surfaceColour);
          if (index <= 2)
            ratios.push(
              `${theme} ${surface} ${dot.state}: ${dot.background} on ${state.surface} = ${ratio.toFixed(2)}:1`,
            );
          if (colour.alpha !== 1)
            problems.push(
              `the ${dot.state} dot is translucent (${dot.background})`,
            );
          if (ratio < 3)
            problems.push(
              `the ${dot.state} dot, ${dot.background}, reads ${ratio.toFixed(2)}:1 on ${state.surface}`,
            );
          if (distance(drawn[index], colour.rgb) > 8)
            problems.push(
              `the ${dot.state} dot draws rgb(${drawn[index].slice(0, 3)}), not its ${dot.background}`,
            );
          const wide = dot.state === "current" ? 20 : 8;
          if (
            Math.abs(dot.box.width - wide) > 0.1 ||
            Math.abs(dot.box.height - 8) > 0.1
          )
            problems.push(
              `the ${dot.state} dot is ${dot.box.width} by ${dot.box.height}, not ${wide} by 8`,
            );
          if (index > 0) {
            const before = state.dots[index - 1].box;
            const gap = dot.box.left - (before.left + before.width);
            if (Math.abs(gap - 6) > 0.1)
              problems.push(
                `dots ${index} and ${index + 1} are ${gap} apart, not 6`,
              );
          }
        }
        if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
        await page.close();
      },
    );

await scenario(
  "the dots are a group named by the position, a list named by the steps, with one current step",
  async (problems) => {
    for (const [positionLabel, name, currentStep] of [
      [undefined, "Step 2 of 5", 1],
      ["function", "Paso 4 de 5", 3],
      ["Étape {step} sur {count}", "Étape 5 sur 5", 4],
    ]) {
      const { page, errors } = await open({
        theme: "light",
        surface: "popover",
        positionLabel,
        currentStep,
      });
      const group = page.getByRole("group", { name, exact: true });
      reads += 1;
      if ((await group.count()) !== 1) {
        problems.push(`no group is named "${name}"`);
        await page.close();
        continue;
      }
      const snapshot = await group.ariaSnapshot();
      reads += 1;
      const steps = ["Search", "Route", "Floors", "Share", "Go"];
      for (const step of steps)
        if (!snapshot.includes(`listitem: ${step}`))
          problems.push(
            `"${name}": no list item is named ${step} (${snapshot.replace(/\n/g, " | ")})`,
          );
      const current = await page
        .locator("#stepper [aria-current]")
        .evaluateAll((nodes) =>
          nodes.map(
            (node) =>
              `${node.getAttribute("aria-current")} ${node.textContent}`,
          ),
        );
      reads += 1;
      if (current.join() !== `step ${steps[currentStep]}`)
        problems.push(
          `"${name}": aria-current is on ${JSON.stringify(current)}, not "${steps[currentStep]}" alone`,
        );
      if (engine === "chromium") {
        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send("Accessibility.getFullAXTree");
        const named = nodes.find(
          (node) => node.role?.value === "group" && node.name?.value === name,
        );
        const items = nodes.filter(
          (node) => node.role?.value === "listitem" && !node.ignored,
        );
        reads += 1;
        if (!named || named.ignored)
          problems.push(`Chromium's tree has no group named "${name}"`);
        if (items.length !== 5)
          problems.push(
            `Chromium's tree has ${items.length} list items, not 5`,
          );
      }
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "forced colours keep every dot: done and current in Highlight, pending an outline",
  async (problems) => {
    for (const theme of ["light", "dark"]) {
      const { page, errors } = await open({
        theme,
        surface: "popover",
        forced: "active",
      });
      const state = await read(page);
      reads += 1;
      if (state.dots.length !== 5) {
        problems.push(`${theme}: ${state.dots.length} dots, not 5`);
        await page.close();
        continue;
      }
      const shot = await page.screenshot();
      const surfacePoint = [
        state.surfaceBox.left + 4,
        state.surfaceBox.top + 4,
      ];
      const centres = state.dots.map((d) => [
        d.box.left + d.box.width / 2,
        d.box.top + d.box.height / 2,
      ]);
      const edges = state.dots.map((d) => [
        d.box.left + 0.5,
        d.box.top + d.box.height / 2,
      ]);
      const [onSurface, ...rest] = await pixels(shot, [
        surfacePoint,
        ...centres,
        ...edges,
      ]);
      for (const [index, dot] of state.dots.entries()) {
        reads += 1;
        if (dot.state !== "pending") {
          if (dot.background !== state.system.highlight)
            problems.push(
              `${theme}: the ${dot.state} dot is ${dot.background}, not Highlight (${state.system.highlight})`,
            );
          if (distance(rest[index], onSurface) < 40)
            problems.push(
              `${theme}: the ${dot.state} dot is not drawn (rgb(${rest[index].slice(0, 3)}) on rgb(${onSurface.slice(0, 3)}))`,
            );
        } else {
          if (dot.outline !== `1px ${state.system.canvasText}`)
            problems.push(
              `${theme}: the pending dot's outline is ${dot.outline}, not 1px CanvasText (${state.system.canvasText})`,
            );
          const edge = rest[state.dots.length + index];
          if (distance(edge, onSurface) < 40)
            problems.push(
              `${theme}: the pending dot's outline is not drawn (rgb(${edge.slice(0, 3)}) on rgb(${onSurface.slice(0, 3)}))`,
            );
        }
      }
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "under reduced motion, the media query's or the config's, the current dot's width does not animate",
  async (problems) => {
    for (const [name, options] of [
      ["with motion", { reduced: "no-preference" }],
      ["under prefers-reduced-motion", { reduced: "reduce" }],
      // The config's reduced motion, as DesignConfig marks its scope, with
      // the media query saying nothing.
      [
        'inside [data-kozmos-motion="reduced"]',
        { reduced: "no-preference", configReduced: true },
      ],
    ]) {
      const { page } = await open({
        theme: "light",
        surface: "page",
        ...options,
      });
      const state = await read(page);
      const current = state.dots.find((dot) => dot.state === "current");
      reads += 1;
      if (!current) {
        problems.push(`${name}: no current dot`);
        await page.close();
        continue;
      }
      const moving = current.transition
        .split(",")
        .some((t) => parseFloat(t) > 0);
      if (moving !== (name === "with motion"))
        problems.push(
          `${name}: the current dot ${moving ? "transitions" : "does not transition"} (${current.transition})`,
        );
      await page.close();
    }
  },
);

await browser.close();
for (const line of ratios) console.log(`  measured  ${line}`);
if (failures.length) {
  console.error(
    `\nFAIL stepper dots: ${failures.length} problem(s) in ${reads} reads`,
  );
  process.exit(1);
}
console.log(
  `\nPASS stepper dots: ${reads} reads; every dot, done, current and pending, is 3:1 or more on the page, a popover and the muted fill in light and dark, computed and drawn; done and pending are 8 by 8, the current 20 by 8, 6 apart; the dots are a group named by positionLabel (its default, a function and a template), a list named by the steps, with aria-current="step" on the current one alone; forced colours keep every dot; reduced motion, the media query's or the config's, stills the current dot's width`,
);
