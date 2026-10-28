/**
 * Stepper's steps as objects, its orientation and step selection (GAP-173,
 * decision 119), on the built package in a real browser
 * (packages/react/tests/integration/stepper-steps-host.tsx): Pointr Cloud's
 * building wizard, five steps on the third. The first is done by its place,
 * the second has an error, the third is current and loading, the fourth is
 * ahead but open, the fifth ahead and closed.
 *
 * - Names: the steps are a list named by the position, "Step 3 of 5"; each
 *   item says its label and its status in words ("Levels, Error"), read from
 *   the label's own text (innerText, which WebKit runs together where a
 *   hidden word has no separator; the indicator is aria-hidden) and from the
 *   accessible names, Playwright's and, in Chromium, the browser's own tree.
 *   The hidden status is a block, so every engine names it with a space
 *   before its comma ("Levels , Error"), which speech does not hear: the
 *   names are compared with that space dropped. The current step, and only
 *   it, is aria-current="step".
 * - Selection: the steps the visitor may go to are buttons, named as their
 *   items are, and Tab stops in order; a closed one is not, and is drawn at
 *   half opacity where an open one is whole. The current step is a button
 *   too, aria-current="step", that selects nothing. Enter and Space select,
 *   and a focused step draws a 2px ring. When the product moves the current
 *   step to the one selected, the keyboard's focus stays on it, with its
 *   ring, in both orientations: it fell to the page's body.
 * - Connectors: the line after a done step is the theme's; after an error,
 *   though before the current step, it is the border's.
 * - Status drawn: done is the theme fill and error the danger fill, each 3:1
 *   or more on the page with its glyph 3:1 or more on it; a loading step's
 *   ring is 3:1 or more and its arc turns, and stops under reduced motion,
 *   the media query's or the config's; light and dark.
 * - Vertical: indicators in a column 56 apart, each followed by a 1 by 16
 *   connector 4 below it and centred under it, the label 12 beside it; in
 *   right to left the indicator is at the inline end. Buttons move nothing.
 * - Density: a step's target is 44 in touch and 32 in compact, measured by
 *   hit-testing the page, and never smaller than the step as drawn.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-stepper-steps.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("stepper-steps-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const tabKey = engine === "webkit" ? "Alt+Tab" : "Tab";
const failures = [];
const measured = [];
let reads = 0;

const NAMES = [
  "Building details, Done",
  "Levels, Error",
  "Alignment, In progress",
  "Fine-tune, Not started",
  "Preview, Not started",
];
const BUTTONS = [NAMES[0], NAMES[1], NAMES[2], NAMES[3]];
/** A name as the engines compute it: a space may stand before the comma. */
const named = (name) => new RegExp(`^${name.replace(", ", " ?, ")}$`);
const tidy = (text) => text.replace(/\s+/g, " ").replace(/ ,/g, ",").trim();

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
const rgb = (colour) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const luminance = ([r, g, b]) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

async function open({ reduced = "no-preference", theme = "light", ...rest }) {
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: reduced, colorScheme: theme });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Stepper steps</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.evaluate((mount) => window.stepperSteps.mount(mount), {
    theme,
    ...rest,
  });
  await settleLayout(page);
  return { page, errors };
}

/** Each step's item, indicator, label, connector and button, as drawn. */
const read = (page) =>
  page.evaluate(() => {
    const box = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    const root = document.getElementById("stepper");
    const items = root ? [...root.querySelectorAll('[role="listitem"]')] : [];
    return {
      root: box(root),
      role: root?.getAttribute("role") ?? null,
      name: root?.getAttribute("aria-label") ?? null,
      surface: getComputedStyle(document.getElementById("surface"))
        .backgroundColor,
      connectors: root
        ? [...root.querySelectorAll(".kozmos-stepper-connector")].map(box)
        : [],
      lines: root
        ? [...root.querySelectorAll(".kozmos-stepper-connector")].map(
            (line) => getComputedStyle(line).backgroundColor,
          )
        : [],
      items: items.map((item) => {
        const indicator = item.querySelector(".kozmos-stepper-indicator");
        const label = item.querySelector(".kozmos-stepper-label");
        const button = item.querySelector("button");
        const arc = item.querySelector(".kozmos-spinner-arc");
        const glyph = indicator?.querySelector("svg:not(.kozmos-spinner-arc)");
        const style = indicator ? getComputedStyle(indicator) : null;
        const after = button ? getComputedStyle(button, "::after") : null;
        return {
          text: label?.innerText ?? "",
          status: item.getAttribute("data-status"),
          // On the item, or on its button where the current step is one.
          current:
            item.getAttribute("aria-current") ??
            button?.getAttribute("aria-current") ??
            null,
          opacity: indicator
            ? [indicator, label].map((node) => getComputedStyle(node).opacity)
            : null,
          indicator: box(indicator),
          label: box(label),
          button: box(button),
          after: after ? { width: after.width, height: after.height } : null,
          background: style?.backgroundColor ?? null,
          border: style ? style.borderLeftColor : null,
          borderWidth: style ? style.borderLeftWidth : null,
          glyph: glyph ? getComputedStyle(glyph).color : null,
          arc: arc ? getComputedStyle(arc).animationName : null,
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

await scenario(
  "a list named Step 3 of 5, each step named with its status, the current one aria-current, the open ones buttons",
  async (problems) => {
    for (const orientation of ["horizontal", "vertical"]) {
      const { page, errors } = await open({ orientation, navigable: true });
      const state = await read(page);
      reads += 1;
      if (state.role !== "list" || state.name !== "Step 3 of 5")
        problems.push(
          `${orientation}: the root is role ${state.role} named ${JSON.stringify(state.name)}, not a list named "Step 3 of 5"`,
        );
      const texts = state.items.map((item) => tidy(item.text));
      reads += 1;
      if (JSON.stringify(texts) !== JSON.stringify(NAMES))
        problems.push(
          `${orientation}: the items read ${JSON.stringify(texts)}, not ${JSON.stringify(NAMES)}`,
        );
      const current = state.items
        .map((item, index) => (item.current ? `${index}:${item.current}` : ""))
        .filter(Boolean);
      reads += 1;
      if (current.join() !== "2:step")
        problems.push(
          `${orientation}: aria-current is on ${JSON.stringify(current)}, not step 3 alone`,
        );
      const list = page.getByRole("list", { name: "Step 3 of 5", exact: true });
      reads += 1;
      if ((await list.count()) !== 1)
        problems.push(`${orientation}: no list is named "Step 3 of 5"`);
      for (const name of BUTTONS) {
        reads += 1;
        if (
          (await page.getByRole("button", { name: named(name) }).count()) !==
          1
        )
          problems.push(`${orientation}: no button is named "${name}"`);
      }
      const buttons = await page.locator("#stepper button").count();
      reads += 1;
      if (buttons !== 4)
        problems.push(`${orientation}: ${buttons} buttons, not 4`);
      const said = await page.evaluate(() =>
        [...document.querySelectorAll("#stepper [aria-current]")].map(
          (node) => `${node.tagName}:${node.getAttribute("aria-current")}`,
        ),
      );
      reads += 1;
      if (said.join() !== "BUTTON:step")
        problems.push(
          `${orientation}: aria-current is on ${JSON.stringify(said)}, not the current step's button alone`,
        );
      if (engine === "chromium") {
        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send("Accessibility.getFullAXTree");
        const names = (role) =>
          nodes
            .filter((node) => node.role?.value === role && !node.ignored)
            .map((node) => tidy(node.name?.value ?? ""));
        reads += 1;
        if (!names("list").includes("Step 3 of 5"))
          problems.push(`${orientation}: Chromium's tree has no list named it`);
        if (names("listitem").length !== 5)
          problems.push(
            `${orientation}: Chromium's tree has ${names("listitem").length} list items, not 5`,
          );
        const buttonNames = names("button").filter((n) => BUTTONS.includes(n));
        if (buttonNames.length !== 4)
          problems.push(
            `${orientation}: Chromium names the buttons ${JSON.stringify(names("button"))}`,
          );
      }
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "the open steps are Tab stops in order; Enter and Space select; focus draws a 2px ring",
  async (problems) => {
    for (const dir of ["ltr", "rtl"]) {
      const { page, errors } = await open({
        orientation: "vertical",
        navigable: true,
        dir,
      });
      await page.focus("#before");
      const order = [];
      for (let i = 0; i < 5; i += 1) {
        await page.keyboard.press(tabKey);
        order.push(
          tidy(
            await page.evaluate(
              () =>
                (
                  document.activeElement?.querySelector(
                    ".kozmos-stepper-label",
                  ) ?? document.activeElement
                )?.innerText ?? "",
            ),
          ),
        );
      }
      reads += 1;
      const expected = [...BUTTONS, "After"];
      if (JSON.stringify(order) !== JSON.stringify(expected))
        problems.push(
          `${dir}: Tab visits ${JSON.stringify(order)}, not ${JSON.stringify(expected)}`,
        );
      await page.getByRole("button", { name: named(BUTTONS[1]) }).focus();
      await page.keyboard.press("Enter");
      // The current step's button selects nothing.
      await page.getByRole("button", { name: named(BUTTONS[2]) }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: named(BUTTONS[3]) }).focus();
      await page.keyboard.press(" ");
      const selected = await page.evaluate(() => window.stepperSteps.selected);
      reads += 1;
      if (selected.join() !== "1,3")
        problems.push(
          `${dir}: Enter and Space selected ${JSON.stringify(selected)}, not [1, 3]`,
        );
      // The ring: keyboard focus, so :focus-visible matches in every engine.
      await page.focus("#before");
      await page.keyboard.press(tabKey);
      const ring = await page.evaluate(() => {
        const button = document.activeElement;
        const style = getComputedStyle(button);
        const r = button.getBoundingClientRect();
        return {
          tag: button.tagName,
          style: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`,
          colour: style.outlineColor,
          box: { left: r.left, top: r.top, width: r.width, height: r.height },
        };
      });
      reads += 1;
      if (ring.tag !== "BUTTON" || ring.style !== "solid 2px 2px")
        problems.push(
          `${dir}: the focused step's outline is "${ring.style}" on a ${ring.tag}, not a solid 2px ring 2px out`,
        );
      const shot = await page.screenshot();
      const [drawn, surface] = await pixels(shot, [
        [ring.box.left - 3, ring.box.top + ring.box.height / 2],
        [ring.box.left - 12, ring.box.top + ring.box.height / 2],
      ]);
      reads += 1;
      if (distance(drawn, rgb(ring.colour)) > 24 || distance(drawn, surface) < 40)
        problems.push(
          `${dir}: the ring is not drawn (rgb(${drawn.slice(0, 3)}) beside the step, ${ring.colour} asked, rgb(${surface.slice(0, 3)}) the page)`,
        );
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "a step selected keeps the keyboard's focus, and its ring, as the product makes it current",
  async (problems) => {
    for (const orientation of ["horizontal", "vertical"]) {
      const { page, errors } = await open({
        orientation,
        navigable: true,
        follows: true,
      });
      const focused = () =>
        page.evaluate(() => {
          const node = document.activeElement;
          const style = getComputedStyle(node);
          return {
            tag: node.tagName,
            inside: !!node.closest("#stepper"),
            text: (
              node.querySelector(".kozmos-stepper-label") ?? node
            ).innerText.replace(/\s+/g, " "),
            current: node.getAttribute("aria-current"),
            ring: `${style.outlineStyle} ${style.outlineWidth}`,
            selected: window.stepperSteps.selected.join(),
          };
        });
      // From the keyboard, so :focus-visible matches in every engine: Tab
      // to "Levels" and Enter, then to "Fine-tune", open ahead, and Space.
      await page.focus("#before");
      await page.keyboard.press(tabKey);
      await page.keyboard.press(tabKey);
      await page.keyboard.press("Enter");
      await settleLayout(page);
      const first = await focused();
      reads += 1;
      if (
        first.tag !== "BUTTON" ||
        !first.inside ||
        tidy(first.text) !== NAMES[1] ||
        first.current !== "step" ||
        first.ring !== "solid 2px" ||
        first.selected !== "1"
      )
        problems.push(
          `${orientation}: after Enter on "Levels" the focus is ${JSON.stringify(first)}, not its button, current, with its ring`,
        );
      // Levels is current now: Alignment, ahead, is closed; Fine-tune is open.
      await page.keyboard.press(tabKey);
      await page.keyboard.press(" ");
      await settleLayout(page);
      const second = await focused();
      reads += 1;
      if (
        second.tag !== "BUTTON" ||
        tidy(second.text) !== NAMES[3].replace(", Not started", "") ||
        second.current !== "step" ||
        second.ring !== "solid 2px" ||
        second.selected !== "1,3"
      )
        problems.push(
          `${orientation}: after Space on "Fine-tune" the focus is ${JSON.stringify(second)}, not its button, current, with its ring`,
        );
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "a closed step is drawn at half opacity where an open one is whole; none without selection",
  async (problems) => {
    for (const navigable of [true, false]) {
      const { page, errors } = await open({ orientation: "vertical", navigable });
      const state = await read(page);
      const drawn = state.items.map((item) => item.opacity.join("/"));
      const expected = navigable
        ? ["1/1", "1/1", "1/1", "1/1", "0.5/0.5"]
        : ["1/1", "1/1", "1/1", "1/1", "1/1"];
      reads += 1;
      if (drawn.join() !== expected.join())
        problems.push(
          `${navigable ? "with" : "without"} selection: the steps' indicator/label opacity is ${JSON.stringify(drawn)}, not ${JSON.stringify(expected)}`,
        );
      if (navigable) {
        // The pixels: Fine-tune (open) and Preview (closed) are both pending,
        // so their rings were one colour.
        const shot = await page.screenshot();
        const ring = (item) => [item.indicator.left + 0.5, item.indicator.top + 16];
        const [open_, closed] = await pixels(shot, [
          ring(state.items[3]),
          ring(state.items[4]),
        ]);
        reads += 1;
        if (distance(open_, closed) < 24)
          problems.push(
            `the open and closed rings draw rgb(${open_.slice(0, 3)}) and rgb(${closed.slice(0, 3)}), one look`,
          );
      }
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    }
  },
);

await scenario(
  "the line after a done step is the theme's, and after an error the border's",
  async (problems) => {
    const { page, errors } = await open({ orientation: "vertical" });
    const state = await read(page);
    const colours = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.getElementById("surface").append(probe);
      const read = (name) => {
        probe.className = name;
        return getComputedStyle(probe).backgroundColor;
      };
      const out = { primary: read("bg-primary"), border: read("bg-border") };
      probe.remove();
      return out;
    });
    reads += 1;
    if (state.lines[0] !== colours.primary || state.lines[1] !== colours.border)
      problems.push(
        `the lines after "Building details" (done) and "Levels" (error) are ${state.lines[0]} and ${state.lines[1]}, not ${colours.primary} and ${colours.border}`,
      );
    if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
    await page.close();
  },
);

for (const theme of ["light", "dark"])
  await scenario(
    `${theme}: done, error and loading are drawn as their own, 3:1 or more on the page, and the arc turns`,
    async (problems) => {
      const { page, errors } = await open({
        theme,
        orientation: "vertical",
      });
      const state = await read(page);
      reads += 1;
      if (state.items.length !== 5) {
        problems.push(`${state.items.length} steps, not 5`);
        await page.close();
        return;
      }
      const statuses = state.items.map((item) => item.status).join();
      reads += 1;
      if (statuses !== "done,error,loading,pending,pending")
        problems.push(`the statuses are ${statuses}`);
      const surface = rgb(state.surface);
      const shot = await page.screenshot();
      const [done, error, loading] = state.items;
      const centre = (item) => [
        item.indicator.left + item.indicator.width / 2,
        item.indicator.top + item.indicator.height / 2 - 6,
      ];
      const [doneDrawn, errorDrawn, ringDrawn] = await pixels(shot, [
        centre(done),
        centre(error),
        [loading.indicator.left + 1, loading.indicator.top + 16],
      ]);
      for (const [name, item, drawn, colour] of [
        ["done", done, doneDrawn, done.background],
        ["error", error, errorDrawn, error.background],
        ["loading", loading, ringDrawn, loading.border],
      ]) {
        reads += 2;
        const ratio = contrast(rgb(colour), surface);
        measured.push(
          `${theme} ${name}: ${colour} on ${state.surface} = ${ratio.toFixed(2)}:1`,
        );
        if (ratio < 3)
          problems.push(
            `the ${name} step's ${colour} reads ${ratio.toFixed(2)}:1 on ${state.surface}`,
          );
        if (distance(drawn, rgb(colour)) > 24)
          problems.push(
            `the ${name} step draws rgb(${drawn.slice(0, 3)}), not its ${colour}`,
          );
        if (name !== "loading") {
          reads += 1;
          const glyph = contrast(rgb(item.glyph ?? "0,0,0"), rgb(colour));
          measured.push(
            `${theme} ${name} glyph: ${item.glyph} on ${colour} = ${glyph.toFixed(2)}:1`,
          );
          if (!item.glyph || glyph < 3)
            problems.push(
              `the ${name} step's glyph ${item.glyph} reads ${glyph.toFixed(2)}:1 on its fill`,
            );
        }
      }
      reads += 1;
      if (distance(rgb(done.background), rgb(error.background)) < 40)
        problems.push("done and error are drawn in the same colour");
      if (loading.borderWidth !== "2px")
        problems.push(`the loading ring is ${loading.borderWidth}, not 2px`);
      reads += 1;
      if (!loading.arc || loading.arc === "none")
        problems.push(`the loading step's arc does not turn (${loading.arc})`);
      if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await page.close();
    },
  );

await scenario(
  "under reduced motion, the media query's or the config's, the arc stops",
  async (problems) => {
    for (const [name, options] of [
      ["prefers-reduced-motion", { reduced: "reduce" }],
      ['[data-kozmos-motion="reduced"]', { configReduced: true }],
    ]) {
      const { page } = await open({ orientation: "vertical", ...options });
      const state = await read(page);
      reads += 1;
      const arc = state.items[2]?.arc;
      if (arc !== "none")
        problems.push(`${name}: the arc's animation is ${arc}, not none`);
      await page.close();
    }
  },
);

for (const dir of ["ltr", "rtl"])
  await scenario(
    `vertical, ${dir}: a column 56 apart, 1 by 16 connectors centred under the indicators, labels 12 beside them; buttons move nothing`,
    async (problems) => {
      const plain = await open({ orientation: "vertical", dir });
      const open_ = await open({ orientation: "vertical", dir, navigable: true });
      const [state, navigable] = [await read(plain.page), await read(open_.page)];
      reads += 1;
      if (state.items.length !== 5 || state.connectors.length !== 4) {
        problems.push(
          `${state.items.length} steps and ${state.connectors.length} connectors, not 5 and 4`,
        );
      } else {
        const rtl = dir === "rtl";
        for (const [index, item] of state.items.entries()) {
          const ind = item.indicator;
          reads += 3;
          if (ind.width !== 32 || ind.height !== 32)
            problems.push(`step ${index + 1}'s indicator is ${ind.width} by ${ind.height}`);
          const edge = rtl
            ? state.root.left + state.root.width - (ind.left + ind.width)
            : ind.left - state.root.left;
          if (Math.abs(edge) > 0.5)
            problems.push(
              `step ${index + 1}'s indicator is ${edge} from the inline start`,
            );
          const gap = rtl
            ? ind.left - (item.label.left + item.label.width)
            : item.label.left - (ind.left + ind.width);
          if (Math.abs(gap - 12) > 0.5)
            problems.push(`step ${index + 1}'s label is ${gap} from its indicator`);
          if (index > 0) {
            const before = state.items[index - 1].indicator;
            const pitch = ind.top - before.top;
            if (Math.abs(pitch - 56) > 0.5)
              problems.push(`steps ${index} and ${index + 1} are ${pitch} apart, not 56`);
            const line = state.connectors[index - 1];
            const off =
              line.left + line.width / 2 - (before.left + before.width / 2);
            reads += 2;
            if (line.width !== 1 || line.height !== 16)
              problems.push(`connector ${index} is ${line.width} by ${line.height}`);
            if (Math.abs(off) > 0.5 || Math.abs(line.top - (before.top + 36)) > 0.5)
              problems.push(
                `connector ${index} is ${off} off the indicator's centre and ${line.top - before.top - 32} below it`,
              );
          }
          const moved = navigable.items[index]?.indicator;
          reads += 1;
          if (
            !moved ||
            Math.abs(moved.left - ind.left) > 0.5 ||
            Math.abs(moved.top - ind.top) > 0.5
          )
            problems.push(
              `a button moves step ${index + 1}'s indicator (${JSON.stringify(moved)} from ${JSON.stringify(ind)})`,
            );
        }
      }
      for (const { errors } of [plain, open_])
        if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
      await plain.page.close();
      await open_.page.close();
    },
  );

for (const density of ["touch", "compact"])
  await scenario(
    `${density}: a step's target is ${density === "touch" ? 44 : 32}, hit-tested, and never smaller than the step`,
    async (problems) => {
      const target = density === "touch" ? 44 : 32;
      for (const orientation of ["vertical", "horizontal"]) {
        const { page, errors } = await open({
          orientation,
          density,
          navigable: true,
        });
        const state = await read(page);
        const levels = state.items[1];
        reads += 1;
        if (!levels?.button || !levels.after) {
          problems.push(`${orientation}: "Levels" is not a button`);
          await page.close();
          continue;
        }
        const width = Math.max(levels.button.width, target);
        const height = Math.max(levels.button.height, target);
        reads += 1;
        if (
          Math.abs(parseFloat(levels.after.width) - width) > 0.5 ||
          Math.abs(parseFloat(levels.after.height) - height) > 0.5
        )
          problems.push(
            `${orientation}: the target is ${levels.after.width} by ${levels.after.height}, not ${width} by ${height}`,
          );
        // Inside the target's edge it is the step's; past it, it is not.
        const cx = levels.button.left + levels.button.width / 2;
        const cy = levels.button.top + levels.button.height / 2;
        const probes = [
          [cx, cy - height / 2 + 1, true],
          [cx, cy + height / 2 - 1, true],
          [cx, cy - height / 2 - 2, false],
          [cx - width / 2 + 1, cy, true],
          [cx + width / 2 - 1, cy, true],
        ];
        const hits = await page.evaluate(
          (points) =>
            points.map(([x, y]) => {
              const hit = document.elementFromPoint(x, y);
              const button = document.querySelectorAll("#stepper button")[1];
              return !!hit && (hit === button || button.contains(hit));
            }),
          probes,
        );
        reads += 1;
        for (const [index, [x, y, expected]] of probes.entries())
          if (hits[index] !== expected)
            problems.push(
              `${orientation}: (${x.toFixed(1)}, ${y.toFixed(1)}) ${expected ? "misses" : "hits"} "Levels"`,
            );
        measured.push(
          `${density} ${orientation}: "Levels" drawn ${levels.button.width.toFixed(1)} by ${levels.button.height.toFixed(1)}, target ${levels.after.width} by ${levels.after.height}`,
        );
        if (errors.length) problems.push(`page errors: ${errors.join("; ")}`);
        await page.close();
      }
    },
  );

await browser.close();
for (const line of measured) console.log(`  measured  ${line}`);
if (failures.length) {
  console.error(
    `\nFAIL stepper steps: ${failures.length} problem(s) in ${reads} reads`,
  );
  process.exit(1);
}
console.log(
  `\nPASS stepper steps: ${reads} reads; the steps are a list named "Step 3 of 5", each item its label and status in words, the current one aria-current; the open steps and the current one are buttons and Tab stops in order, Enter and Space select, focus draws a 2px ring and stays on a step selected as it becomes current; a closed step is drawn at half opacity; the line after an error is the border's; done, error and loading are each drawn 3:1 or more in light and dark, the arc turns and stops under reduced motion; vertical is a column 56 apart with centred 1 by 16 connectors, mirrored in right to left, unmoved by buttons; a step's target is 44 in touch and 32 in compact`,
);
