/**
 * Accordion's boxed form (decision 149), on the built React package in a real
 * browser. It is Pointr Cloud's building editor as a Kozmos part, so what is
 * read here is that page's numbers: five sections 8 apart in a 408 panel, a 40
 * header at compact density (44 at touch) with a 20 icon, two lines and a 20
 * chevron, corners at the control radius, a hairline while closed and
 * theme 900 while open, with its title and label at 4.5:1 in both themes, 8
 * between a header and its content, and disabled and loading items greyed and
 * skipped by keyboard.
 *
 * Read twice: with the stylesheet, and with every @scope rule taken out, as a
 * browser without @scope draws it, so nothing the form promises can rest on
 * the utility layer. Then right to left, reduced motion, forced colours, the
 * keyboard, the focus ring on a filled header, and that a default Accordion
 * beside them draws as it did.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-accordion-boxed.mjs
 */
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("accordion-boxed.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const withoutScope = postcss.parse(css);
withoutScope.walkAtRules("scope", (rule) => rule.remove());

const failures = [];
const notes = [];
let reads = 0;
const expect = (ok, message) => {
  reads += 1;
  if (!ok) failures.push(message);
};
const near = (a, b, tolerance = 0.51) => Math.abs(a - b) <= tolerance;

const luminance = ([r, g, b]) => {
  const linear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};
const contrast = (one, two) => {
  const [a, b] = [luminance(one), luminance(two)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

/** Everything a section draws, read off the page. */
function read(root, { title }) {
  const button = [...root.querySelectorAll("button")].find((node) =>
    node.textContent.includes(title),
  );
  const box = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      display: style.display,
      color: style.color,
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
    };
  };
  const spinnerBox = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      width: parseFloat(style.width),
      height: parseFloat(style.height),
      centre: rect.left + rect.width / 2,
    };
  };
  const style = getComputedStyle(button);
  const label = button.querySelector(".kozmos-accordion-label");
  const children = [...button.children];
  return {
    box: box(button),
    backgroundColor: style.backgroundColor,
    color: style.color,
    radius: parseFloat(style.borderTopLeftRadius),
    borderWidth: parseFloat(style.borderTopWidth),
    borderStyle: style.borderTopStyle,
    borderColor: style.borderTopColor,
    paddingInlineStart: parseFloat(style.paddingInlineStart),
    paddingInlineEnd: parseFloat(style.paddingInlineEnd),
    disabled: button.disabled,
    busy: button.getAttribute("aria-busy"),
    expanded: button.getAttribute("aria-expanded"),
    label: box(label) ?? {},
    icon: box(children[0]),
    mark: box(children[children.length - 1]),
    markClass: children[children.length - 1].getAttribute("class"),
    chevron: box(button.querySelector(".kozmos-accordion-chevron")),
    // Its box, not its rect: a turning arc's rect is the rotated square's.
    spinner: spinnerBox(button.querySelector(".kozmos-spinner-arc")),
    text: box(button.querySelector(".kozmos-accordion-text")) ?? {},
    name: button.textContent,
  };
}

/** What each token paints here, through probes inside the section. */
function tokens(root) {
  const paint = (value) => {
    const probe = document.createElement("div");
    probe.style.color = value;
    root.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  };
  return {
    fill: paint("var(--primitives-colors-theme-900)"),
    title: paint("var(--primitives-colors-foreground-1000)"),
    label: paint("var(--primitives-colors-theme-300)"),
    page: paint("var(--primitives-colors-background-0)"),
    grey: paint("var(--primitives-colors-background-100)"),
    ink: paint("var(--primitives-colors-foreground-0)"),
    muted: paint("var(--primitives-colors-foreground-400)"),
    edge: paint("var(--semantics-border-subtle)"),
    ring: paint("var(--primitives-colors-theme-600)"),
  };
}

/** A computed colour as 0–255 channels, through a canvas, which every engine reads. */
function rgb(page, colour) {
  return page.evaluate((value) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }, colour);
}

async function openPage(browser, stylesheet, options = {}) {
  const page = await browser.newPage({
    viewport: { width: 900, height: 1400 },
    ...options,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    '<!doctype html><html><head></head><body style="margin:0"><div id="fixture"></div></body></html>',
  );
  await page.addStyleTag({ content: stylesheet });
  await page.addScriptTag({ content: code });
  await page.getByTestId("dark").waitFor();
  await settleLayout(page);
  return { page, errors };
}

const sectionOf = (page, id, title) =>
  page.getByTestId(id).evaluate(read, { title });

const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
let forcedRead = false;
try {
  for (const [mode, stylesheet] of [
    ["with the stylesheet", css],
    ["without @scope", withoutScope.toString()],
  ]) {
    const { page, errors } = await openPage(browser, stylesheet);
    for (const id of ["light", "dark"]) {
      const where = `${engine}, ${mode}, ${id}`;
      const closed = await sectionOf(page, id, "Location");
      const open = await sectionOf(page, id, "Building details");
      const disabled = await sectionOf(page, id, "Levels");
      const loading = await sectionOf(page, id, "Floor plans");
      const last = await sectionOf(page, id, "Review");
      const token = await page.getByTestId(id).evaluate(tokens);

      // Geometry: the numbers of the live page, at compact density.
      expect(
        near(closed.box.width, 408),
        `${where}: a header is ${closed.box.width} wide in a 408 panel`,
      );
      for (const [name, section] of [
        ["closed", closed],
        ["open", open],
        ["disabled", disabled],
        ["loading", loading],
      ]) {
        expect(
          near(section.box.height, 40),
          `${where}: a ${name} header is ${section.box.height} tall; expected 40`,
        );
        expect(
          section.radius === 16,
          `${where}: a ${name} header's corners are ${section.radius}; expected the control radius, 16`,
        );
        expect(
          section.borderWidth === 1,
          `${where}: a ${name} header's edge is ${section.borderWidth}; expected 1, in every state, so nothing moves`,
        );
        expect(
          section.paddingInlineStart === 8 && section.paddingInlineEnd === 8,
          `${where}: a ${name} header pads ${section.paddingInlineStart} and ${section.paddingInlineEnd}; expected 8`,
        );
        expect(
          near(section.icon.width, 20, 0.01) &&
            near(section.icon.height, 20, 0.01),
          `${where}: a ${name} header's icon is ${section.icon.width} by ${section.icon.height}; expected 20`,
        );
        expect(
          near(section.icon.left - section.box.left, 9, 0.01),
          `${where}: a ${name} header's icon starts ${section.icon.left - section.box.left} in; expected 9, the 8 inside the hairline`,
        );
        expect(
          section.label.fontSize > 10.9 &&
            section.label.fontSize < 11.1 &&
            near(section.label.lineHeight, 14, 0.01),
          `${where}: a ${name} label is ${section.label.fontSize}/${section.label.lineHeight}; expected 11/14`,
        );
        expect(
          near(section.label.height, 14, 0.01),
          `${where}: a ${name} label's line is ${section.label.height}; expected one line of 14`,
        );
        expect(
          section.text.fontSize > 12.9 &&
            section.text.fontSize < 13.1 &&
            near(section.text.lineHeight, 17.5, 0.05),
          `${where}: a ${name} title is ${section.text.fontSize}/${section.text.lineHeight}; expected the 13 on the 17.5 of the type tokens`,
        );
      }
      expect(
        near(closed.mark.width, 20, 0.01) && near(closed.mark.height, 20, 0.01),
        `${where}: the chevron is ${closed.mark.width} by ${closed.mark.height}; expected 20`,
      );
      expect(
        near(closed.box.right - closed.mark.right, 9, 0.01),
        `${where}: the chevron ends ${closed.box.right - closed.mark.right} in; expected 9`,
      );

      // The sections are 8 apart, each header to the next, when closed.
      expect(
        near(disabled.box.top - closed.box.bottom, 8),
        `${where}: closed sections are ${disabled.box.top - closed.box.bottom} apart; expected 8`,
      );
      expect(
        near(last.box.top - loading.box.bottom, 8),
        `${where}: the last sections are ${last.box.top - loading.box.bottom} apart; expected 8`,
      );

      // Closed: the page's white, with a hairline, and the muted label.
      expect(
        closed.backgroundColor === token.page,
        `${where}: a closed header is ${closed.backgroundColor}; expected background 0, ${token.page}`,
      );
      expect(
        closed.borderColor === token.edge,
        `${where}: a closed header's edge is ${closed.borderColor}; expected the subtle border, ${token.edge}`,
      );
      expect(
        closed.color === token.ink,
        `${where}: a closed title is ${closed.color}; expected ${token.ink}`,
      );
      expect(
        closed.label.color === token.muted,
        `${where}: a closed label is ${closed.label.color}; expected foreground 400, ${token.muted}`,
      );
      expect(
        closed.expanded === "false",
        `${where}: a closed header says aria-expanded ${closed.expanded}`,
      );

      // Open: theme 900, its title and label, no edge to see.
      expect(
        open.backgroundColor === token.fill,
        `${where}: an open header is ${open.backgroundColor}; expected theme 900, ${token.fill}`,
      );
      expect(
        open.color === token.title,
        `${where}: an open title is ${open.color}; expected foreground 1000, ${token.title}`,
      );
      expect(
        open.label.color === token.label,
        `${where}: an open label is ${open.label.color}; expected theme 300, ${token.label}`,
      );
      expect(
        /rgba\(0, 0, 0, 0\)|transparent|\/ 0\)/.test(open.borderColor),
        `${where}: an open header's edge is ${open.borderColor}; expected none to see`,
      );
      const [fill, title, label] = await Promise.all(
        [token.fill, token.title, token.label].map((c) => rgb(page, c)),
      );
      const titleRatio = contrast(fill, title);
      const labelRatio = contrast(fill, label);
      expect(
        titleRatio >= 4.5,
        `${where}: the open title is ${titleRatio.toFixed(2)}:1 on its fill`,
      );
      expect(
        labelRatio >= 4.5,
        `${where}: the open label is ${labelRatio.toFixed(2)}:1 on its fill`,
      );
      if (mode === "with the stylesheet")
        notes.push(
          `${where}: title ${titleRatio.toFixed(2)}:1, label ${labelRatio.toFixed(2)}:1 on ${token.fill}`,
        );

      // The form sits 8 under its header, in the panel's flow.
      const content = await page.getByTestId(id).evaluate((root) => {
        const region = root.querySelector('[role="region"]');
        const field = region.querySelector("input");
        const style = getComputedStyle(region);
        return {
          top: field.getBoundingClientRect().top,
          bottom: region.getBoundingClientRect().bottom,
          left: field.getBoundingClientRect().left,
          width: field.getBoundingClientRect().width,
          overflow: style.overflowY,
        };
      });
      expect(
        near(content.top - open.box.bottom, 8),
        `${where}: the form starts ${content.top - open.box.bottom} under its header; expected 8`,
      );
      expect(
        near(closed.box.top - content.bottom, 8),
        `${where}: the next section starts ${closed.box.top - content.bottom} under the content; expected 8`,
      );
      expect(
        near(content.left, open.box.left),
        `${where}: the form starts ${content.left - open.box.left} in from its header; expected in the panel's flow, 0`,
      );
      expect(
        content.overflow === "visible",
        `${where}: the content is overflow ${content.overflow} at rest; a field's focus ring would be clipped`,
      );

      // Disabled: greyed, with no chevron.
      expect(
        disabled.disabled === true,
        `${where}: the disabled header is not disabled`,
      );
      expect(
        disabled.chevron?.display === "none",
        `${where}: the disabled header draws a chevron (${disabled.chevron?.display})`,
      );
      expect(
        disabled.backgroundColor === token.grey,
        `${where}: a disabled header is ${disabled.backgroundColor}; expected background 100, ${token.grey}`,
      );
      expect(
        disabled.color === token.muted,
        `${where}: a disabled title is ${disabled.color}; expected foreground 400, ${token.muted}`,
      );
      expect(
        disabled.busy === null,
        `${where}: a disabled header says aria-busy ${disabled.busy}`,
      );

      // Loading: the same, busy, a spinner where the chevron is.
      expect(
        loading.disabled === true,
        `${where}: the loading header is not disabled`,
      );
      expect(
        loading.busy === "true",
        `${where}: the loading header says aria-busy ${loading.busy}`,
      );
      expect(
        loading.chevron === null,
        `${where}: the loading header still draws a chevron`,
      );
      expect(
        loading.spinner !== null &&
          near(loading.spinner.width, 20, 0.01) &&
          near(loading.spinner.height, 20, 0.01),
        `${where}: the spinner is ${loading.spinner?.width} by ${loading.spinner?.height}; expected 20`,
      );
      expect(
        loading.spinner !== null &&
          near(loading.spinner.centre, closed.mark.left + 10, 0.01),
        `${where}: the spinner is centred at ${loading.spinner?.centre}; expected where the chevron is, ${closed.mark.left + 10}`,
      );
      expect(
        loading.backgroundColor === token.grey,
        `${where}: a loading header is ${loading.backgroundColor}; expected background 100`,
      );
      expect(
        loading.name.includes("Step 4/5 Floor plans"),
        `${where}: the header's words run together: ${JSON.stringify(loading.name)}`,
      );
    }

    // At touch the same sections are the density's 44, and only the height
    // moves: the type, the gaps, the icon and the content stay. Cloud's 40 is
    // compact's control height; a product at touch gets a touch target.
    {
      const here = `${engine}, ${mode}, touch`;
      const closed = await sectionOf(page, "touch", "Location");
      const open = await sectionOf(page, "touch", "Building details");
      const disabled = await sectionOf(page, "touch", "Levels");
      const loading = await sectionOf(page, "touch", "Floor plans");
      for (const [name, section] of [
        ["closed", closed],
        ["open", open],
        ["disabled", disabled],
        ["loading", loading],
      ]) {
        expect(
          near(section.box.height, 44),
          `${here}: a ${name} header is ${section.box.height}; expected 44`,
        );
        expect(
          near(section.icon.width, 20, 0.01) &&
            near(section.icon.left - section.box.left, 9, 0.01),
          `${here}: a ${name} header's icon is ${section.icon.width} wide, ${section.icon.left - section.box.left} in`,
        );
        expect(
          near(section.label.lineHeight, 14, 0.01) &&
            near(section.text.lineHeight, 17.5, 0.05),
          `${here}: a ${name} header's lines are ${section.label.lineHeight} and ${section.text.lineHeight}`,
        );
        // The two lines stay in the middle of the taller box.
        expect(
          near(
            section.text.top - section.box.top,
            section.box.bottom - section.text.bottom,
          ),
          `${here}: a ${name} header's lines sit ${section.text.top - section.box.top} from the top and ${section.box.bottom - section.text.bottom} from the bottom`,
        );
      }
      expect(
        near(disabled.box.top - closed.box.bottom, 8),
        `${here}: closed sections are ${disabled.box.top - closed.box.bottom} apart; expected 8`,
      );
    }

    // Right to left: the icon at the right, the chevron at the left.
    const rtl = await sectionOf(page, "rtl", "Location");
    const where = `${engine}, ${mode}, right to left`;
    expect(
      near(rtl.box.right - rtl.icon.right, 9, 0.01),
      `${where}: the icon ends ${rtl.box.right - rtl.icon.right} from the right; expected 9`,
    );
    expect(
      near(rtl.mark.left - rtl.box.left, 9, 0.01),
      `${where}: the chevron starts ${rtl.mark.left - rtl.box.left} from the left; expected 9`,
    );
    expect(
      near(rtl.label.right, rtl.text.right, 0.01),
      `${where}: the label ends ${rtl.text.right - rtl.label.right} from its column's start`,
    );
    const rtlOpen = await page.getByTestId("rtl").evaluate((root) => {
      const field = root.querySelector('[role="region"] input');
      const region = root.querySelector('[role="region"]');
      return {
        fieldRight: field.getBoundingClientRect().right,
        rootRight: root.getBoundingClientRect().right,
        width: region.getBoundingClientRect().width,
      };
    });
    expect(
      near(rtlOpen.fieldRight, rtlOpen.rootRight),
      `${where}: the form ends ${rtlOpen.rootRight - rtlOpen.fieldRight} from the panel's start`,
    );

    expect(errors.length === 0, `${engine}, ${mode}: ${errors.join(", ")}`);
    await page.close();
  }

  // The keyboard, on the stylesheet proper.
  {
    const { page, errors } = await openPage(browser, css);
    const where = `${engine}, the keyboard`;
    const light = page.getByTestId("light");
    const focused = () =>
      page.evaluate(() =>
        (document.activeElement?.textContent ?? "")
          .replace(/Step \d\/5/, "")
          .trim(),
      );
    const trigger = (name) => light.getByRole("button", { name });
    await trigger(/Building details/).focus();

    // Arrows skip the disabled and the loading item, in both directions.
    await page.keyboard.press("ArrowDown");
    expect(
      (await focused()) === "Location",
      `${where}: ArrowDown reached "${await focused()}"; expected Location`,
    );
    await page.keyboard.press("ArrowDown");
    expect(
      (await focused()) === "Review",
      `${where}: ArrowDown reached "${await focused()}"; expected Review, past the disabled and the loading item`,
    );
    await page.keyboard.press("ArrowUp");
    expect(
      (await focused()) === "Location",
      `${where}: ArrowUp reached "${await focused()}"; expected Location`,
    );
    await page.keyboard.press("End");
    expect(
      (await focused()) === "Review",
      `${where}: End reached "${await focused()}"; expected Review`,
    );
    await page.keyboard.press("Home");
    expect(
      (await focused()) === "Building details",
      `${where}: Home reached "${await focused()}"; expected Building details`,
    );

    // Tab goes on past both too: Radix's arrows are its own, and Tab is the
    // browser's. WebKit on a Mac does not Tab to a button at all here, so a
    // landing outside the sections says nothing and is not read.
    await trigger(/Location/).focus();
    await page.keyboard.press("Tab");
    const tabbed = await focused();
    if (tabbed === "") notes.push(`${where}: Tab leaves buttons out here`);
    else
      expect(
        tabbed === "Review",
        `${where}: Tab reached "${tabbed}"; expected Review, past the disabled and the loading item`,
      );
    await trigger(/Building details/).focus();

    // A disabled trigger takes no focus at all.
    for (const name of [/Levels/, /Floor plans/]) {
      await light
        .getByRole("button", { name })
        .evaluate((node) => node.focus());
      expect(
        (await focused()) === "Building details",
        `${where}: a disabled header took focus ("${await focused()}")`,
      );
    }

    // Enter and Space, on the focused header.
    await trigger(/Location/).focus();
    await page.keyboard.press("Enter");
    expect(
      (await trigger(/Location/).getAttribute("aria-expanded")) === "true",
      `${where}: Enter did not open Location`,
    );
    expect(
      (await trigger(/Building details/).getAttribute("aria-expanded")) ===
        "false",
      `${where}: one section open at a time: opening Location left Building details open`,
    );
    await page.keyboard.press("Space");
    expect(
      (await trigger(/Location/).getAttribute("aria-expanded")) === "false",
      `${where}: Space did not close Location`,
    );
    await page.keyboard.press("Space");
    expect(
      (await trigger(/Location/).getAttribute("aria-expanded")) === "true",
      `${where}: Space did not open Location`,
    );

    // A press on a disabled or loading header opens nothing.
    for (const name of [/Levels/, /Floor plans/]) {
      await light
        .getByRole("button", { name })
        .click({ force: true })
        .catch(() => {});
      expect(
        (await light
          .getByRole("button", { name })
          .getAttribute("aria-expanded")) === "false",
        `${where}: a press opened a disabled header`,
      );
    }

    // The ring on a filled header: on the open one, in both themes. It sits
    // outside the fill on the page's colour, so it reads against the page.
    for (const id of ["light", "dark"]) {
      const root = page.getByTestId(id);
      const name = id === "light" ? /Location/ : /Building details/;
      await page.keyboard.press("Shift+Tab");
      await root.getByRole("button", { name }).focus();
      const ring = await root
        .getByRole("button", { name })
        .evaluate((node) => ({
          boxShadow: getComputedStyle(node).boxShadow,
          focusVisible: node.matches(":focus-visible"),
          state: node.getAttribute("data-state"),
        }));
      const token = await root.evaluate(tokens);
      const here = `${where}, the ring on a filled header, ${id}`;
      expect(ring.state === "open", `${here}: the header is ${ring.state}`);
      expect(
        ring.focusVisible,
        `${here}: the header does not match :focus-visible`,
      );
      const stop = (spread) =>
        new RegExp(`(.*) 0px 0px 0px ${spread}px`).exec(
          ring.boxShadow
            .split(/,\s*(?=rgb|color|oklab|#)/)
            .find((part) => part.includes(`${spread}px`)) ?? "",
        )?.[1];
      expect(
        stop(4) === token.ring,
        `${here}: the ring is ${JSON.stringify(ring.boxShadow)}; expected 2 of ${token.ring} outside a 2 offset`,
      );
      expect(
        stop(2) === token.page,
        `${here}: the offset is ${JSON.stringify(ring.boxShadow)}; expected the page's ${token.page}`,
      );
      const [ringColour, pageColour] = await Promise.all(
        [token.ring, token.page].map((c) => rgb(page, c)),
      );
      const ratio = contrast(ringColour, pageColour);
      expect(
        ratio >= 3,
        `${here}: the ring is ${ratio.toFixed(2)}:1 on the page`,
      );
      notes.push(`${here}: ${ratio.toFixed(2)}:1 on the page`);
    }

    // A field in the open section keeps its whole ring: the content does not
    // clip while it rests, and the ring reaches past the panel's edge.
    {
      const root = page.getByTestId("dark");
      const field = root.getByRole("textbox", { name: "Building name" });
      await field.focus();
      const drawn = await field.evaluate((node) => {
        const clips = [];
        for (
          let at = node.parentElement;
          at && !at.dataset.testid;
          at = at.parentElement
        ) {
          const style = getComputedStyle(at);
          if (style.overflowX !== "visible" || style.overflowY !== "visible")
            clips.push(at.className);
        }
        return { clips, boxShadow: getComputedStyle(node).boxShadow };
      });
      expect(
        drawn.clips.length === 0,
        `${where}: the field's ring is clipped by ${JSON.stringify(drawn.clips)}`,
      );
      expect(
        /4px/.test(drawn.boxShadow),
        `${where}: the field drew no ring to clip (${drawn.boxShadow})`,
      );
    }

    expect(errors.length === 0, `${where}: ${errors.join(", ")}`);
    await page.close();
  }

  // It clips while it moves, and only then, and reduced motion moves nothing.
  for (const motion of ["no-preference", "reduce"]) {
    const { page, errors } = await openPage(browser, css, {
      reducedMotion: motion,
    });
    const where = `${engine}, ${motion === "reduce" ? "reduced motion" : "motion"}`;
    const root = page.getByTestId("light");
    await page.addStyleTag({
      content:
        "[data-testid=light]{--semantics-motion-duration-standard:2800ms}",
    });
    await root.getByRole("button", { name: /Location/ }).click();
    const drawn = await root.evaluate((node) => {
      const button = [...node.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Location"),
      );
      const region = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      const style = getComputedStyle(region);
      const chevron = getComputedStyle(
        button.querySelector(".kozmos-accordion-chevron"),
      );
      return {
        name: style.animationName,
        overflow: style.overflowY,
        running: region.getAnimations().filter((a) => a.playState === "running")
          .length,
        transition: chevron.transitionProperty,
        transitionDuration: chevron.transitionDuration,
        spinner: (() => {
          const arc = node.querySelector(".kozmos-spinner-arc");
          return arc ? getComputedStyle(arc).animationName : "no spinner";
        })(),
      };
    });
    if (motion === "reduce") {
      expect(
        drawn.running === 0 && drawn.name === "none",
        `${where}: the content runs ${drawn.name}`,
      );
      expect(
        drawn.transition === "all" || drawn.transitionDuration === "0s",
        `${where}: the chevron turns over ${drawn.transition} ${drawn.transitionDuration}`,
      );
      expect(
        drawn.spinner === "none" || drawn.spinner === "kozmos-spin-reduced",
        `${where}: the spinner runs ${drawn.spinner}`,
      );
      expect(
        drawn.overflow === "visible",
        `${where}: the content is overflow ${drawn.overflow}`,
      );
    } else {
      expect(
        drawn.running > 0,
        `${where}: the content runs nothing while it opens`,
      );
      expect(
        drawn.overflow === "hidden",
        `${where}: the content is overflow ${drawn.overflow} while it moves; expected hidden, or the form spills over the next section`,
      );
    }
    expect(errors.length === 0, `${where}: ${errors.join(", ")}`);
    await page.close();
  }

  // Forced colours: every state keeps an edge and readable words.
  {
    const { page, errors } = await openPage(browser, css);
    await page.emulateMedia({ forcedColors: "active" });
    await settleLayout(page);
    const where = `${engine}, forced colours`;
    // WebKit answers the media query and repaints nothing, so a probe's own
    // red says whether this engine really forces colours.
    const active = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "rgb(255, 0, 0)";
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return (
        matchMedia("(forced-colors: active)").matches &&
        colour !== "rgb(255, 0, 0)"
      );
    });
    if (!active) {
      notes.push(
        `${where}: this engine does not force them under emulation, so not read here`,
      );
    } else {
      forcedRead = true;
      const open = await sectionOf(page, "light", "Building details");
      const closed = await sectionOf(page, "light", "Location");
      const disabled = await sectionOf(page, "light", "Levels");
      const grey = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.color = "GrayText";
        document.body.append(probe);
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
      });
      for (const [name, section] of [
        ["open", open],
        ["closed", closed],
      ]) {
        expect(
          !/rgba\(0, 0, 0, 0\)|transparent|\/ 0\)/.test(section.borderColor),
          `${where}: a ${name} header has no edge (${section.borderColor})`,
        );
        expect(
          section.color !== section.backgroundColor,
          `${where}: a ${name} title is ${section.color} on ${section.backgroundColor}`,
        );
      }
      expect(
        disabled.color === grey,
        `${where}: a disabled title is ${disabled.color}; expected GrayText, ${grey}`,
      );
      const trigger = page
        .getByTestId("light")
        .getByRole("button", { name: /Location/ });
      await page.keyboard.press("Tab");
      await trigger.focus();
      const outline = await trigger.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          style: style.outlineStyle,
          width: style.outlineWidth,
          colour: style.outlineColor,
        };
      });
      expect(
        outline.style !== "none" &&
          outline.width !== "0px" &&
          !/rgba\(0, 0, 0, 0\)|transparent/.test(outline.colour),
        `${where}: focus draws no outline where shadows do not draw (${JSON.stringify(outline)})`,
      );
    }
    expect(errors.length === 0, `${where}: ${errors.join(", ")}`);
    await page.close();
  }

  // A default Accordion beside them draws as it did.
  {
    const { page, errors } = await openPage(browser, css);
    const where = `${engine}, the default form`;
    const drawn = await page.getByTestId("default").evaluate((root) => {
      const items = [...root.children];
      const [first] = items;
      const button = first.querySelector("button");
      const svg = button.querySelector("svg");
      const style = getComputedStyle(button);
      const open = button.getAttribute("data-state");
      return {
        rootClass: root.getAttribute("class"),
        rootDisplay: getComputedStyle(root).display,
        itemBorder: getComputedStyle(first).borderBottomWidth,
        paddingTop: style.paddingTop,
        weight: style.fontWeight,
        background: style.backgroundColor,
        radius: style.borderTopLeftRadius,
        chevron: svg.getBoundingClientRect().width,
        transform: getComputedStyle(svg).transform,
        open,
        overflow: getComputedStyle(first.querySelector('[role="region"]'))
          .overflowY,
        bodyBottom: getComputedStyle(
          first.querySelector('[role="region"]').firstElementChild,
        ).paddingBottom,
      };
    });
    expect(
      drawn.rootClass === null,
      `${where}: the root carries a class (${JSON.stringify(drawn.rootClass)})`,
    );
    expect(
      drawn.rootDisplay === "block",
      `${where}: the root is ${drawn.rootDisplay}`,
    );
    expect(
      drawn.itemBorder === "1px",
      `${where}: an item's rule is ${drawn.itemBorder}`,
    );
    expect(
      drawn.paddingTop === "16px",
      `${where}: a trigger pads ${drawn.paddingTop}`,
    );
    expect(
      drawn.weight === "500",
      `${where}: a trigger's weight is ${drawn.weight}`,
    );
    expect(
      /rgba\(0, 0, 0, 0\)|transparent/.test(drawn.background),
      `${where}: a trigger is filled ${drawn.background}`,
    );
    expect(
      drawn.radius === "0px",
      `${where}: a trigger's corners are ${drawn.radius}`,
    );
    expect(drawn.chevron === 16, `${where}: the chevron is ${drawn.chevron}`);
    expect(
      drawn.transform !== "none",
      `${where}: the open chevron does not turn`,
    );
    expect(
      drawn.overflow === "hidden",
      `${where}: the content is overflow ${drawn.overflow}`,
    );
    expect(
      drawn.bodyBottom === "16px",
      `${where}: the content pads ${drawn.bodyBottom}`,
    );
    expect(errors.length === 0, `${where}: ${errors.join(", ")}`);
    await page.close();
  }
} finally {
  await browser.close();
}

for (const note of notes) console.log(note);
if (failures.length) {
  console.error(
    `\nAccordion's boxed form: ${failures.length} of ${reads} reads failed in ${engine}:`,
  );
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `\nAccordion's boxed form: ${reads} reads pass in ${engine}: heights, gaps, corners, colours and contrast in both themes, with and without @scope; right to left; reduced motion; ${forcedRead ? "forced colours; " : ""}the keyboard, the ring on a filled header, and the default form.`,
);
