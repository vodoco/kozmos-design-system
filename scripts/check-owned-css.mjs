import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

/** A computed colour as sRGB channels in 0–1 and its alpha. */
function readColour(css) {
  const legacy = css.match(
    /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/,
  );
  if (legacy)
    return {
      r: legacy[1] / 255,
      g: legacy[2] / 255,
      b: legacy[3] / 255,
      a: legacy[4] === undefined ? 1 : Number(legacy[4]),
    };
  const srgb = css.match(
    /^color\(srgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)(?: \/ ([\d.e+-]+))?\)$/,
  );
  if (srgb)
    return {
      r: Number(srgb[1]),
      g: Number(srgb[2]),
      b: Number(srgb[3]),
      a: srgb[4] === undefined ? 1 : Number(srgb[4]),
    };
  throw new Error(`a colour this check cannot read: ${css}`);
}

/** What paints behind a node: its backgrounds, innermost first, over a white page. */
function paintedBehind(layers) {
  let behind = { r: 1, g: 1, b: 1 };
  for (const layer of [...layers].reverse()) {
    const { r, g, b, a } = readColour(layer);
    behind = {
      r: r * a + behind.r * (1 - a),
      g: g * a + behind.g * (1 - a),
      b: b * a + behind.b * (1 - a),
    };
  }
  return behind;
}

/** The WCAG contrast ratio of two opaque sRGB colours. */
function contrastRatio(one, two) {
  const luminance = ({ r, g, b }) => {
    const linear = (c) =>
      c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * The Nearby of each of the result card's four surfaces in a root of the
 * owned-css host: how many there are, the colour it draws in, and the
 * backgrounds from it up to the page.
 */
async function nearbyOnEverySurface(page, id) {
  const group = page.getByTestId(`${id}-travel-group`);
  const surfaces = [
    ["card", page.getByTestId(`${id}-travel-card`)],
    ["selected card", page.getByTestId(`${id}-travel-card-selected`)],
    ["grouped row", group.locator("article").nth(1)],
    ["selected grouped row", group.locator("article").nth(0)],
  ];
  const drawn = [];
  for (const [surface, card] of surfaces) {
    const nearby = card.getByText("Nearby", { exact: true });
    const found = await nearby.count();
    drawn.push({
      surface,
      found,
      ...(found === 1
        ? await nearby.evaluate((node) => {
            const layers = [];
            for (let at = node; at; at = at.parentElement)
              layers.push(getComputedStyle(at).backgroundColor);
            return { color: getComputedStyle(node).color, layers };
          })
        : {}),
    });
  }
  return drawn;
}

const { code, css } = await buildReactFixture("owned-css-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const root = postcss.parse(css);
root.walkAtRules("scope", (rule) => rule.remove());
const browser = await launchFixtureBrowser();
try {
  // Run the same assertions with and without the legacy stylesheet. A modern
  // browser cannot hide a dependency on @scope in the migrated slice.
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", root.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1100, height: 1100 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(`<!doctype html><html><head><style>
      html {font-size:16px} body {margin:13px}
      input,textarea,button {background:orange;border:3px solid purple;border-radius:3px}
      label {font-size:30px} p {margin:20px}
      .flex {display:block} .rounded-control {border-radius:3px}
      .host-slot-button {background:orange;border:3px solid purple;border-radius:3px}
    </style></head><body><button id="host">Host</button><div id="fixture"></div></body></html>`);
    const measure = (locator) =>
      locator.evaluate((node) => {
        const s = getComputedStyle(node);
        return Object.fromEntries(
          [
            "backgroundColor",
            "color",
            "height",
            "width",
            "paddingLeft",
            "borderRadius",
            "borderTopWidth",
            "borderTopColor",
            "boxShadow",
            "fontSize",
            "lineHeight",
            "fontWeight",
            "display",
            "opacity",
            "direction",
            "animationName",
            "animationDuration",
          ].map((key) => [key, s[key]]),
        );
      });
    const hostBefore = await measure(page.locator("#host"));
    await page.addStyleTag({ content: stylesheet });
    // Deliberate consumer overrides are loaded after the package, need no
    // Tailwind compiler. State-specific overrides follow normal CSS specificity.
    await page.addStyleTag({
      content:
        ".consumer-control {border-radius:7px;padding-left:19px;background:rgb(10,20,30)} .consumer-heading {font-size:48px;font-weight:700;margin:9px} .consumer-copy {font-size:11.5px;color:rgb(10,20,30)}",
    });
    await page.addScriptTag({ content: code });
    await page.getByTestId("outer-input").waitFor();
    await settleLayout(page);
    assert.deepEqual(await measure(page.locator("#host")), hostBefore);
    const value = async (id, token) =>
      page.getByTestId(id).evaluate((node, name) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${name})`;
        node.parentElement.append(probe);
        const result = getComputedStyle(probe).color;
        probe.remove();
        return result;
      }, token);
    for (const id of ["outer", "nested"]) {
      // Decision 50 (GAP-088): a walk in the Nearby tone draws in the success
      // emotion's Text role on each of the result card's four surfaces, in
      // this root's theme (outer is dark, nested light), with or without
      // @scope and under the host's hostile rules, because the rule is owned.
      // Its contrast is measured after these passes, on a page of its own.
      {
        const theme = id === "outer" ? "dark" : "light";
        const success = await value(
          `${id}-travel`,
          "--semantics-emotion-success-text",
        );
        for (const { surface, found, color } of await nearbyOnEverySurface(
          page,
          id,
        )) {
          assert.equal(
            found,
            1,
            `${mode}, ${theme}: the ${surface} does not read Nearby for a walk under a minute`,
          );
          assert.equal(
            color,
            success,
            `${mode}, ${theme}: Nearby on the ${surface} is not the success text colour`,
          );
        }
        if (mode === "full")
          assert.equal(
            (
              await measure(
                page
                  .getByTestId(`${id}-travel-card-neutral`)
                  .getByText("5–10 min", { exact: true }),
              )
            ).color,
            await value(`${id}-travel`, "--primitives-colors-foreground-0"),
            `${theme}: a band other than Nearby is not the card's text colour`,
          );
        console.log(
          `PASS decision 50, ${theme}, ${mode}: Nearby is the success text colour ${success} on the card, the selected card, the grouped row and the selected grouped row${mode === "full" ? "; 5–10 min is the text colour" : ""}`,
        );
      }
      const poi = page.getByTestId(`${id}-poi`);
      const metadata = poi.locator("[data-slot=meta-strip]");
      assert.equal(
        await metadata.evaluate((e) => getComputedStyle(e).display),
        "grid",
      );
      assert.equal(await metadata.getAttribute("tabindex"), null);
      assert(
        await metadata.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      );
      const rowTops = await metadata
        .locator("[data-slot=meta-strip-item]")
        .evaluateAll((items) =>
          items.map((item) => item.getBoundingClientRect().top),
        );
      assert(
        rowTops.every((top) => Math.abs(top - rowTops[0]) < 1),
        "single metadata row without scope",
      );
      assert.equal((await measure(poi)).borderRadius, "16px");
      for (const selector of [
        ".kozmos-poi-header-actions button",
        ".kozmos-poi-chips li",
        ".kozmos-poi-hours",
      ]) {
        assert.equal(
          (await measure(poi.locator(selector))).borderRadius,
          "16px",
          `${mode}: ${selector} radius`,
        );
      }
      for (const selector of [
        ".kozmos-poi-summary",
        ".kozmos-poi-hours",
        ".kozmos-poi-chips li",
      ]) {
        assert.equal(
          (await measure(poi.locator(selector))).borderTopWidth,
          "1px",
          `${mode} ${selector} must own its border`,
        );
      }
      assert.equal((await measure(poi.locator("h2"))).fontSize, "20px");
      assert.equal(
        await poi.evaluate((e) => e.scrollWidth <= e.clientWidth),
        true,
        "POI must fit its host without scoped preflight",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-host-heading`))).fontSize,
        "48px",
        "Preflight must not override a product heading class",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-heading`))).fontSize,
        "30px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-heading`))).fontWeight,
        "700",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-text`))).fontSize,
        "14px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-text`))).fontWeight,
        "600",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-host-copy`))).fontSize,
        "11.5px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-host-copy`))).color,
        "rgb(10, 20, 30)",
      );
      const listbox = page.getByTestId(`${id}-listbox`);
      await listbox.focus();
      await page.keyboard.press("End");
      assert.equal(
        await listbox.evaluate((node) => {
          const active = node.ownerDocument.getElementById(
            node.getAttribute("aria-activedescendant"),
          );
          const row = active.getBoundingClientRect();
          const bounds = node.getBoundingClientRect();
          return row.top >= bounds.top && row.bottom <= bounds.bottom;
        }),
        true,
        "keyboard active option must scroll into view",
      );
      const field = page.getByTestId(`${id}-input`);
      const s = await measure(field);
      assert.equal(s.height, "44px");
      assert.equal(s.paddingLeft, "12px");
      assert.equal(s.borderRadius, "16px");
      assert.equal(s.borderTopWidth, "1px");
      assert.equal(s.fontSize, "14px");
      assert.equal(s.direction, "rtl");
      assert.equal(
        s.backgroundColor,
        await value(`${id}-input`, "--primitives-colors-background-0"),
      );
      const override = await measure(page.getByTestId(`${id}-override`));
      assert.equal(override.borderRadius, "7px");
      assert.equal(override.paddingLeft, "19px");
      assert.equal(override.backgroundColor, "rgb(10, 20, 30)");
      await field.focus();
      assert.notEqual((await measure(field)).boxShadow, "none");
      assert.equal(
        await field.evaluate((n) =>
          getComputedStyle(n).getPropertyValue("--tw-ring-offset-width"),
        ),
        "2px",
        "legacy compiler defaults must not erase the owned focus-ring offset",
      );
      const disabled = await measure(page.getByTestId(`${id}-disabled`));
      assert.equal(
        disabled.backgroundColor,
        await value(`${id}-disabled`, "--primitives-colors-background-100"),
      );
      for (const [state, token] of [
        ["invalid", "danger-600"],
        ["warning", "alert-800"],
        ["success", "success-800"],
      ]) {
        const result = await measure(page.getByTestId(`${id}-${state}`));
        assert.equal(
          result.borderTopColor,
          await value(
            `${id}-${state}`,
            `--primitives-colors-emotional-${token}`,
          ),
        );
      }
      assert.equal(
        (await measure(page.getByTestId(`${id}-button`))).height,
        "44px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-button`))).borderTopWidth,
        "0px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-helper-button`))).width,
        "44px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-helper-input`))).height,
        "44px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-helper-error`))).borderTopColor,
        await value(
          `${id}-helper-error`,
          "--primitives-colors-emotional-danger-600",
        ),
        "the exported helper's error flag must override its warning status",
      );
      const password = page.getByTestId(`${id}-password`);
      const toggle = password.locator("..").getByRole("button");
      assert.equal(
        (await measure(toggle)).width,
        "44px",
        "password toggle owns its target size",
      );
      assert.equal((await measure(toggle.locator("svg"))).width, "16px");
      const passwordBox = await password.boundingBox();
      const toggleBox = await toggle.boundingBox();
      assert.equal(
        toggleBox.x,
        passwordBox.x,
        "RTL password toggle sits at inline end",
      );
      await toggle.click();
      assert.equal(await password.getAttribute("type"), "text");
      await toggle.click();
      assert.equal(await password.getAttribute("type"), "password");
      const number = page.getByTestId(`${id}-number`);
      const stepper = number
        .locator("..")
        .getByRole("button", { name: "Increase value" });
      assert.equal(
        (await measure(stepper)).width,
        "44px",
        "number stepper owns its target size",
      );
      assert.equal((await measure(stepper.locator("svg"))).width, "16px");
      assert.equal((await measure(number)).borderRadius, "0px");
      assert.equal(
        await number.evaluate((node) => getComputedStyle(node).appearance),
        "textfield",
      );
      await number.fill("2");
      await stepper.click();
      assert.equal(await number.inputValue(), "3");
      const stepperBox = await stepper.boundingBox();
      const numberBox = await number.boundingBox();
      assert.equal(
        stepperBox.x + stepperBox.width,
        numberBox.x,
        "RTL increment is adjacent to the field",
      );
      for (const field of [password, number])
        assert.equal((await measure(field)).height, "44px");
      assert.equal(
        await password.evaluate(
          (node) => getComputedStyle(node).paddingInlineEnd,
        ),
        "48px",
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-number-plain`))).borderRadius,
        "16px",
      );
      for (const state of ["readonly", "disabled"]) {
        const unavailable = page.getByTestId(`${id}-number-${state}`);
        for (const action of await unavailable
          .locator("..")
          .getByRole("button")
          .all()) {
          assert.equal(await action.isDisabled(), true);
          assert.equal((await measure(action)).height, "44px");
          await action.evaluate((node) => node.click());
        }
        assert.equal(await unavailable.inputValue(), "2");
      }
      const disabledToggle = page
        .getByTestId(`${id}-password-disabled`)
        .locator("..")
        .getByRole("button");
      assert.equal(await disabledToggle.isDisabled(), true);
      // The edge and the ring keep the emotion's fill step; the glyph is text,
      // the emotion's Text role, one step darker (2026-09-22).
      for (const [status, token, emotion] of [
        ["error", "danger-600", "danger"],
        ["warning", "alert-800", "alert"],
        ["success", "success-800", "success"],
      ]) {
        const control = page.getByTestId(`${id}-number-${status}`);
        const tone = await value(
          `${id}-number-${status}`,
          `--primitives-colors-emotional-${token}`,
        );
        assert.equal((await measure(control)).borderTopColor, tone);
        assert.equal(
          (await measure(control)).color,
          await value(
            `${id}-number-${status}`,
            "--primitives-colors-foreground-0",
          ),
        );
        const action = control.locator("..").getByRole("button").first();
        assert.equal((await measure(action)).borderTopColor, tone);
        assert.equal(
          (await measure(action)).color,
          await value(
            `${id}-number-${status}`,
            `--semantics-emotion-${emotion}-text`,
          ),
        );
        await control.focus();
        assert.notEqual((await measure(control)).boxShadow, "none");
      }
      if (mode === "full") {
        // Shared exported helpers reach existing compositions too. These are
        // regression checks, not claims that those whole components migrated.
        assert.equal(
          (await measure(page.getByTestId(`${id}-password`))).height,
          "44px",
        );
        assert.equal(
          (await measure(page.getByTestId(`${id}-number`))).height,
          "44px",
        );
        assert.equal(
          (await measure(page.getByTestId(`${id}-map-control`)))
            .backgroundColor,
          await value(
            `${id}-button`,
            "--components-primary-buttons-themed-button-background-idle",
          ),
        );
        // A labelled map control keeps its gap between the mark and the
        // words in both directions. It was `ml-2` and `text-left`: right to
        // left the mark sits at the start, on the right, and the margin went
        // to the far side of the words, so the two touched.
        const labelGap = (testId) =>
          page.getByTestId(testId).evaluate(async (button) => {
            const [mark, words] = button.children;
            // The words animate their margin, so a flip of direction is read
            // once that settles, not on its first frame.
            await Promise.all(words.getAnimations().map((a) => a.finished));
            const a = mark.getBoundingClientRect();
            const b = words.getBoundingClientRect();
            const rtl = getComputedStyle(button).direction === "rtl";
            return {
              rtl,
              gap: rtl ? a.left - b.right : b.left - a.right,
              align: getComputedStyle(words).textAlign,
            };
          });
        const labelled = `${id}-map-control-labelled`;
        const inRtl = await labelGap(labelled);
        assert.equal(inRtl.rtl, true, "the fixture draws right to left");
        assert(
          inRtl.gap >= 7.5,
          `right to left the words sit ${inRtl.gap}px from the mark`,
        );
        assert.equal(inRtl.align, "start");
        await page
          .getByTestId(labelled)
          .evaluate((node) => node.setAttribute("dir", "ltr"));
        const inLtr = await labelGap(labelled);
        assert(
          !inLtr.rtl && inLtr.gap >= 7.5,
          `left to right the words sit ${inLtr.gap}px from the mark`,
        );
        await page
          .getByTestId(labelled)
          .evaluate((node) => node.removeAttribute("dir"));
        // The assistant's "replying" dots keep their gap before the words
        // right to left too: they were `mr-2`, on the far side of the dots.
        const dotsGap = await page
          .getByTestId(`${id}-ai-streaming`)
          .evaluate((message) => {
            const dots = message.querySelector(
              "[aria-hidden='true']",
            ).parentElement;
            const bubble = dots.parentElement;
            const text = [...bubble.childNodes].find(
              (node) => node.nodeType === 3 && node.textContent.trim(),
            );
            const range = document.createRange();
            range.selectNodeContents(text);
            const a = dots.getBoundingClientRect();
            const words = range.getClientRects()[0];
            const rtl = getComputedStyle(bubble).direction === "rtl";
            return rtl ? a.left - words.right : words.left - a.right;
          });
        assert(
          dotsGap >= 7.5,
          `right to left the replying dots sit ${dotsGap}px from the words`,
        );
      }
      // Decision 40 (Olcay, 2026-09-28): the map controls take the SDK's
      // current look, the Tracking Indicator of Pointr's Location Tracking
      // Buttons (Figma ce7phRJR1sCkH6zT8EMH8I, 434:31572). A 48 square with a
      // 16 corner, no stroke, the page's surface, three drop shadows and a
      // 32px backdrop blur; its words bold 16 on a 16 line, two equal lines,
      // grey while off and navy while on, with no primary edge. In both modes:
      // the surface is what every map control promises, so it cannot live in
      // the utility layer a host without @scope drops.
      {
        const where = `${mode} ${id}`;
        // A computed box-shadow as layers, without the transparent zero
        // layers a ring composes in when it is not drawn.
        const layersOf = (boxShadow) =>
          boxShadow === "none"
            ? []
            : boxShadow
                .split(/,(?![^(]*\))/)
                .map((layer) => {
                  const rgba = layer.match(/rgba?\(([^)]*)\)/);
                  const channels = rgba
                    ? rgba[1].split(",").map((v) => parseFloat(v))
                    : [0, 0, 0, 1];
                  const lengths = layer
                    .replace(/rgba?\([^)]*\)/, "")
                    .match(/-?[\d.]+px/g)
                    .map((v) => parseFloat(v));
                  const [x, y, blur = 0, spread = 0] = lengths;
                  return {
                    rgb: channels.slice(0, 3),
                    a: channels.length > 3 ? channels[3] : 1,
                    x,
                    y,
                    blur,
                    spread,
                  };
                })
                .filter((layer) => layer.a > 0);
        const sameLayers = (got, want) =>
          got.length === want.length &&
          got.every(
            (layer, i) =>
              layer.rgb.every((v, k) => v === want[i].rgb[k]) &&
              Math.abs(layer.a - want[i].a) < 0.005 &&
              layer.x === want[i].x &&
              layer.y === want[i].y &&
              layer.blur === want[i].blur &&
              layer.spread === want[i].spread,
          );
        // A token as it resolves in this control's theme.
        const tokenShadow = (testId, name) =>
          page.getByTestId(testId).evaluate((node, name) => {
            const probe = document.createElement("span");
            probe.style.boxShadow = `var(${name})`;
            node.append(probe);
            const result = getComputedStyle(probe).boxShadow;
            probe.remove();
            return result;
          }, name);
        const elevation = layersOf(
          await tokenShadow(
            `${id}-map-surface`,
            "--semantics-elevation-map-control",
          ),
        );
        // The Figma file's own numbers, light theme ("Shadows/Foating
        // Components BG", as the file spells it).
        const sdkShadow = [
          { rgb: [0, 0, 0], a: 0.16, x: 0, y: 8, blur: 8, spread: 0 },
          { rgb: [0, 0, 0], a: 0.08, x: 0, y: 24, blur: 24, spread: 0 },
          { rgb: [0, 0, 0], a: 0.12, x: 0, y: 0, blur: 32, spread: 0 },
        ];
        if (id === "nested")
          assert(
            sameLayers(elevation, sdkShadow),
            `${where}: the map controls' elevation is not the SDK's three shadows in the light theme: ${JSON.stringify(elevation)}`,
          );
        else
          assert(
            elevation.length === 3 && !sameLayers(elevation, sdkShadow),
            `${where}: the map controls' elevation does not follow the dark theme: ${JSON.stringify(elevation)}`,
          );

        const surface = page.getByTestId(`${id}-map-surface`);
        const look = await surface.evaluate((node) => {
          const s = getComputedStyle(node);
          return {
            size: [s.width, s.height],
            minimum: [s.minWidth, s.minHeight],
            radius: [
              s.borderTopLeftRadius,
              s.borderTopRightRadius,
              s.borderBottomRightRadius,
              s.borderBottomLeftRadius,
            ],
            border: [
              s.borderTopWidth,
              s.borderRightWidth,
              s.borderBottomWidth,
              s.borderLeftWidth,
            ],
            background: s.backgroundColor,
            boxShadow: s.boxShadow,
            backdrop: s.backdropFilter || s.webkitBackdropFilter,
          };
        });
        assert.deepEqual(
          look.size,
          ["48px", "48px"],
          `${where}: a map control is not the SDK's 48 square: ${JSON.stringify(look)}`,
        );
        assert(
          look.minimum.every((length) => parseFloat(length) >= 44),
          `${where}: a map control can shrink below the 44px target: ${JSON.stringify(look.minimum)}`,
        );
        assert.deepEqual(
          look.radius,
          ["16px", "16px", "16px", "16px"],
          `${where}: a map control's corner is not 16: ${JSON.stringify(look.radius)}`,
        );
        assert.deepEqual(
          look.border,
          ["0px", "0px", "0px", "0px"],
          `${where}: a map control draws a border: ${JSON.stringify(look.border)}`,
        );
        assert.equal(
          look.background,
          await value(`${id}-map-surface`, "--primitives-colors-background-0"),
          `${where}: a map control is not the page's surface`,
        );
        assert(
          sameLayers(layersOf(look.boxShadow), elevation),
          `${where}: a map control does not cast the map controls' elevation, and nothing else — no ring for an edge: ${look.boxShadow}`,
        );
        assert.equal(
          look.backdrop,
          "blur(32px)",
          `${where}: a map control does not blur the map behind it by 32px`,
        );

        // Focused from the keyboard, the ring shows on the borderless
        // surface, in the ring's colour and at 3:1 or more against it, and
        // the elevation stays under it. Tabbed to from the control before it:
        // this page has been clicked, and Firefox then shows a programmatic
        // focus without its ring, whatever key went before.
        await page.getByTestId(`${id}-map-control-labelled`).focus();
        await page.keyboard.press("Tab");
        const focused = await surface.evaluate((node) => ({
          visible:
            node === document.activeElement && node.matches(":focus-visible"),
          boxShadow: getComputedStyle(node).boxShadow,
        }));
        await surface.blur();
        assert.equal(focused.visible, true, `${where}: no keyboard focus`);
        const ringColour = await value(
          `${id}-map-surface`,
          "--primitives-colors-theme-600",
        );
        const channels = (colour) =>
          colour
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map((v) => parseFloat(v));
        const focusedLayers = layersOf(focused.boxShadow);
        const ring = focusedLayers.find(
          (layer) =>
            layer.spread >= 2 &&
            layer.rgb.every((v, k) => v === channels(ringColour)[k]),
        );
        assert(
          ring,
          `${where}: a focused map control draws no ring in the ring's colour: ${focused.boxShadow}`,
        );
        assert(
          sameLayers(focusedLayers.slice(-3), elevation),
          `${where}: focusing a map control drops its elevation: ${focused.boxShadow}`,
        );
        const luminance = (rgb) => {
          const [r, g, b] = rgb.map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const [lighter, darker] = [
          luminance(ring.rgb),
          luminance(channels(look.background)),
        ].sort((a, b) => b - a);
        const contrast = (lighter + 0.05) / (darker + 0.05);
        assert(
          contrast >= 3,
          `${where}: a map control's focus ring is ${contrast.toFixed(2)}:1 against its surface`,
        );

        // Decision 39: the map's status pill wears the map controls' surface
        // from the same owned rule — the Control corner, no border, the map
        // controls' elevation and the 32px blur — at least 48 tall, 8 above
        // and below and 12 at the sides, the SDK's words (13 on 16, in
        // foreground/300) and a 24 mark 8 before them, on the side reading
        // starts from. Turn Back is the named alert fill pair.
        const statusLook = (testId) =>
          page.getByTestId(testId).evaluate((node) => {
            const s = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            const mark = node
              .querySelector(".kozmos-map-status-pill-mark")
              ?.getBoundingClientRect();
            const words = node
              .querySelector(".kozmos-map-status-pill-words")
              .getBoundingClientRect();
            const rtl = s.direction === "rtl";
            return {
              height: box.height,
              radius: [
                s.borderTopLeftRadius,
                s.borderTopRightRadius,
                s.borderBottomRightRadius,
                s.borderBottomLeftRadius,
              ],
              border: [
                s.borderTopWidth,
                s.borderRightWidth,
                s.borderBottomWidth,
                s.borderLeftWidth,
              ],
              padding: [
                s.paddingTop,
                s.paddingRight,
                s.paddingBottom,
                s.paddingLeft,
              ],
              background: s.backgroundColor,
              boxShadow: s.boxShadow,
              backdrop: s.backdropFilter || s.webkitBackdropFilter,
              color: s.color,
              type: [s.fontSize, s.lineHeight, s.fontWeight],
              mark: mark && [mark.width, mark.height],
              markInset: mark && (rtl ? box.right - mark.right : mark.left - box.left),
              gap: mark && (rtl ? mark.left - words.right : words.left - mark.right),
              wordsInset: rtl ? box.right - words.right : words.left - box.left,
            };
          });
        const status = await statusLook(`${id}-map-status`);
        assert.equal(
          status.height,
          48,
          `${where}: the status pill is not 48 tall: ${JSON.stringify(status)}`,
        );
        assert.deepEqual(
          status.radius,
          look.radius,
          `${where}: the status pill's corner is not the map controls': ${JSON.stringify(status.radius)}`,
        );
        assert.deepEqual(
          status.border,
          ["0px", "0px", "0px", "0px"],
          `${where}: the status pill draws a border: ${JSON.stringify(status.border)}`,
        );
        assert.deepEqual(
          status.padding,
          ["8px", "12px", "8px", "12px"],
          `${where}: the status pill is not padded 8 by 12: ${JSON.stringify(status.padding)}`,
        );
        assert.equal(
          status.background,
          look.background,
          `${where}: the status pill is not the map controls' surface`,
        );
        assert(
          sameLayers(layersOf(status.boxShadow), elevation),
          `${where}: the status pill does not cast the map controls' elevation: ${status.boxShadow}`,
        );
        assert.equal(
          status.backdrop,
          "blur(32px)",
          `${where}: the status pill does not blur the map behind it by 32px`,
        );
        assert.equal(
          status.color,
          await value(`${id}-map-status`, "--primitives-colors-foreground-300"),
          `${where}: the status pill's words are not foreground/300`,
        );
        assert.equal(
          Math.round(parseFloat(status.type[0])),
          13,
          `${where}: the status pill's words are not 13: ${status.type}`,
        );
        assert.deepEqual(
          status.type.slice(1),
          ["16px", "400"],
          `${where}: the status pill's words are not regular on a 16 line: ${status.type}`,
        );
        assert.deepEqual(
          status.mark,
          [24, 24],
          `${where}: the status pill's mark is not 24: ${JSON.stringify(status.mark)}`,
        );
        assert(
          Math.abs(status.markInset - 12) < 0.5 && Math.abs(status.gap - 8) < 0.5,
          `${where}: the mark is ${status.markInset} in and ${status.gap} from the words, not 12 and 8`,
        );
        // The board's Turn Back: the named alert fill pair (Olcay,
        // 2026-09-28), the SDK's bright amber under black words in both
        // themes; the nested light theme here reads its own.
        const turnBack = await statusLook(`${id}-map-status-warning`);
        const alertFill = await value(
          `${id}-map-status-warning`,
          "--semantics-emotion-alert-fill",
        );
        assert.equal(
          turnBack.background,
          alertFill,
          `${where}: Turn Back does not fill with Emotion/alert/fill (${alertFill})`,
        );
        assert.equal(
          turnBack.color,
          await value(
            `${id}-map-status-warning`,
            "--semantics-emotion-alert-on-fill",
          ),
          `${where}: Turn Back's words are not Emotion/alert/onFill`,
        );
        assert(
          luminance(channels(turnBack.color)) < 0.05,
          `${where}: Turn Back's words are ${turnBack.color}, not dark on its amber`,
        );
        assert(
          turnBack.mark === undefined && Math.abs(turnBack.wordsInset - 12) < 0.5,
          `${where}: Turn Back with no mark starts its words ${turnBack.wordsInset} in, not 12`,
        );

        // The zoom pair is one surface: 48 wide, the control's corner and
        // elevation, and the two buttons in it cast nothing of their own —
        // the lower one's shadow would darken the upper.
        const zoom = await page
          .getByTestId(`${id}-map-zoom`)
          .evaluate((group) => {
            const cluster = group.firstElementChild;
            const s = getComputedStyle(cluster);
            return {
              width: s.width,
              radius: s.borderTopLeftRadius,
              border: s.borderTopWidth,
              background: s.backgroundColor,
              boxShadow: s.boxShadow,
              backdrop: s.backdropFilter || s.webkitBackdropFilter,
              buttons: [...cluster.querySelectorAll("button")].map((button) => {
                const b = getComputedStyle(button);
                return {
                  size: [b.width, b.height],
                  boxShadow: b.boxShadow,
                };
              }),
            };
          });
        assert.equal(
          zoom.width,
          "48px",
          `${where}: the zoom pair is not 48 wide`,
        );
        assert.equal(zoom.radius, "16px", `${where}: the zoom pair's corner`);
        assert.equal(
          zoom.border,
          "0px",
          `${where}: the zoom pair draws a border`,
        );
        assert.equal(
          zoom.background,
          look.background,
          `${where}: the zoom pair is not the map controls' surface`,
        );
        assert(
          sameLayers(layersOf(zoom.boxShadow), elevation),
          `${where}: the zoom pair does not cast the map controls' elevation: ${zoom.boxShadow}`,
        );
        assert.equal(
          zoom.backdrop,
          "blur(32px)",
          `${where}: the zoom pair's blur`,
        );
        assert.equal(zoom.buttons.length, 2);
        for (const button of zoom.buttons) {
          assert.deepEqual(
            button.size,
            ["48px", "48px"],
            `${where}: a zoom button is not 48 square: ${JSON.stringify(zoom.buttons)}`,
          );
          assert.deepEqual(
            layersOf(button.boxShadow),
            [],
            `${where}: a zoom button casts a shadow inside the pair: ${button.boxShadow}`,
          );
        }
        // Hovered, the muted step: background/100, not the border's grey.
        await surface.hover();
        const hovered = await surface.evaluate(async (node) => {
          await Promise.all(node.getAnimations().map((a) => a.finished));
          return getComputedStyle(node).backgroundColor;
        });
        await page.mouse.move(0, 0);
        assert.equal(
          hovered,
          await value(
            `${id}-map-surface`,
            "--primitives-colors-background-100",
          ),
          `${where}: a hovered map control is not the muted step`,
        );
        // Tabbed to, a zoom button draws its ring inside itself, where the
        // pair's clip cannot cut it.
        await surface.focus();
        await page.keyboard.press("Tab");
        const segment = await page
          .getByTestId(`${id}-map-zoom`)
          .evaluate((group) => {
            const button = group.querySelector("button");
            const result = {
              focused:
                button === document.activeElement &&
                button.matches(":focus-visible"),
              boxShadow: getComputedStyle(button).boxShadow,
            };
            button.blur();
            return result;
          });
        assert(segment.focused, `${where}: Tab does not reach the zoom pair`);
        assert(
          /inset/.test(segment.boxShadow) &&
            layersOf(segment.boxShadow).some(
              (layer) =>
                layer.spread >= 2 &&
                layer.rgb.every((v, k) => v === channels(ringColour)[k]),
            ),
          `${where}: a focused zoom button's ring is not drawn inside it: ${segment.boxShadow}`,
        );

        // The location control's words.
        const words = {};
        for (const state of [
          "off",
          "following",
          "heading",
          "heading-paused",
          "unavailable",
        ]) {
          const control = page
            .getByTestId(`${id}-location-${state}`)
            .getByRole("button");
          words[state] = await control.evaluate((button) => {
            const s = getComputedStyle(button);
            const lines = [...button.querySelectorAll("*")]
              .filter((el) =>
                [...el.childNodes].some(
                  (n) => n.nodeType === 3 && n.textContent.trim(),
                ),
              )
              .map((el) => {
                const t = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return {
                  text: el.textContent.trim(),
                  font: [t.fontSize, t.lineHeight, t.fontWeight],
                  colour: t.color,
                  top: r.top,
                  bottom: r.bottom,
                  left: r.left,
                  right: r.right,
                };
              });
            const mark = button.querySelector("svg");
            const box = mark.parentElement.getBoundingClientRect();
            return {
              height: s.height,
              padding: [s.paddingInlineStart, s.paddingInlineEnd],
              border: s.borderTopWidth,
              boxShadow: s.boxShadow,
              name: button.getAttribute("aria-label"),
              text: button.innerText.replace(/\s+/g, " ").trim(),
              lines,
              mark: getComputedStyle(mark).color,
              markBox: { left: box.left, right: box.right, width: box.width },
              rtl: s.direction === "rtl",
            };
          });
        }
        const grey = await value(
          `${id}-location-off`,
          "--primitives-colors-foreground-400",
        );
        const navy = await value(
          `${id}-location-off`,
          "--primitives-colors-theme-1000",
        );
        const blue = await value(
          `${id}-location-off`,
          "--primitives-colors-theme-600",
        );
        const expected = {
          off: { text: ["Focus", "Off"], ink: grey, mark: grey },
          following: { text: ["Focus", "On"], ink: navy, mark: blue },
          heading: { text: ["Focus", "On"], ink: navy, mark: blue },
          // Decision 45: heading remembered while the map is moved away — the
          // SDK's rotational Off, grey.
          "heading-paused": { text: ["Focus", "Off"], ink: grey, mark: grey },
          unavailable: { text: ["No Location"], ink: grey, mark: grey },
        };
        for (const [state, want] of Object.entries(expected)) {
          const read = words[state];
          const at = `${where} ${state}`;
          assert.deepEqual(
            read.lines.map((line) => line.text),
            want.text,
            `${at}: the control reads ${JSON.stringify(read.text)}`,
          );
          for (const line of read.lines) {
            assert.deepEqual(
              line.font,
              ["16px", "16px", "700"],
              `${at}: "${line.text}" is not bold 16 on a 16 line: ${JSON.stringify(line.font)}`,
            );
            assert.equal(
              line.colour,
              want.ink,
              `${at}: "${line.text}" is not the ${want.ink === navy ? "on navy" : "off grey"}`,
            );
          }
          if (read.lines.length === 2)
            assert(
              read.lines[1].top >= read.lines[0].bottom - 0.5,
              `${at}: the state is not set under the name: ${JSON.stringify(read.lines)}`,
            );
          assert.equal(
            read.mark,
            want.mark,
            `${at}: the mark is not the ${want.mark === blue ? "theme blue" : "off grey"}`,
          );
          assert.equal(
            read.height,
            "48px",
            `${at}: the labelled control's height`,
          );
          assert.deepEqual(
            read.padding,
            ["12px", "12px"],
            `${at}: the labelled control's inline padding`,
          );
          assert.equal(read.border, "0px", `${at}: the control draws an edge`);
          assert(
            sameLayers(layersOf(read.boxShadow), elevation),
            `${at}: the control's state changes its edge or its shadow: ${read.boxShadow}`,
          );
          const nearest = read.rtl
            ? Math.min(
                ...read.lines.map((line) => read.markBox.left - line.right),
              )
            : Math.min(
                ...read.lines.map((line) => line.left - read.markBox.right),
              );
          assert(
            read.markBox.width === 24 && Math.abs(nearest - 8) < 0.5,
            `${at}: the mark is not a 24 box 8 from the words: ${JSON.stringify(read.markBox)}, gap ${nearest}`,
          );
        }
        assert.equal(words.off.name, "Focus, Off");
        assert.equal(words.following.name, "Focus, On");
        assert.equal(words.unavailable.name, "Focus, No Location");
        // Heading shows following's words; its mark tells them apart on
        // screen, and its name says more, after the words it shows.
        assert(
          words.heading.name.startsWith("Focus, On, ") &&
            words.heading.name.length > "Focus, On, ".length,
          `${where}: heading's name does not tell it from following's: ${words.heading.name}`,
        );
        // A paused heading shows off's words, and its name says a press
        // brings the turning map back, after them.
        assert(
          words["heading-paused"].name.startsWith("Focus, Off, ") &&
            words["heading-paused"].name.length > "Focus, Off, ".length,
          `${where}: a paused heading's name does not tell it from off's: ${words["heading-paused"].name}`,
        );
        console.log(
          `PASS ${where}: map controls are the SDK's 48 square, 16 corner, no edge, three shadows and 32px blur; the labels bold 16/16, grey off and navy on; the ring shows at ${contrast.toFixed(2)}:1`,
        );
        console.log(
          `PASS ${where}: the map status pill wears their surface, 48 tall and padded 8 by 12, its words 13/16 in foreground/300 after a 24 mark 12 in and 8 before them; Turn Back is Emotion/alert/fill under its onFill`,
        );
      }
      // The search row: the field and what follows it on one line, in a
      // container that puts them on two when the pair is composed by hand.
      //
      // The field is `w-full` and always has been, so a caller who did not know
      // to pass `flex-1` through `containerClassName` got the assistant's
      // button on the next line. Storybook's example knew; the reference site's
      // did not. The row belongs to the component now, and this measures both:
      // by hand it still wraps, through `trailing` it cannot.
      const rowLines = (testId) =>
        page.getByTestId(testId).evaluate((node) => {
          const field = node.querySelector('[role="search"]');
          const assistant = node.querySelector(".kozmos-ai-search");
          const a = field.getBoundingClientRect();
          const b = assistant.getBoundingClientRect();
          return {
            // Centres, not tops: the assistant is 48 and the field 44, so on
            // one line their top edges are two apart by design.
            sameLine: Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) < 2,
            drop: Math.round(b.y - a.y),
            rowHeight: Math.round(node.getBoundingClientRect().height),
            fieldHeight: Math.round(a.height),
          };
        });
      const bySlot = await rowLines(`${id}-row-by-slot`);
      assert.equal(
        bySlot.sameLine,
        true,
        `the assistant is not beside the field through trailing: ${JSON.stringify(bySlot)}`,
      );
      assert.ok(
        bySlot.rowHeight <= 49,
        `the row through trailing is more than one control tall: ${JSON.stringify(bySlot)}`,
      );
      if (mode === "full") {
        // The control: the same container, the same pair, composed by hand.
        // It wraps, which is what makes the row above worth having. Only in
        // this mode — without `@scope` the field's `w-full` is gone with the
        // rest of the utility layer, the field shrinks to its content and the
        // pair fits either way, so the control proves nothing there. The row's
        // own rules are owned CSS precisely so that they do not go with it.
        const byHand = await rowLines(`${id}-row-by-hand`);
        assert.equal(
          byHand.sameLine,
          false,
          `composed by hand the pair no longer wraps — if the field stopped being w-full, say so here and in SearchBar's trailing doc: ${JSON.stringify(byHand)}`,
        );
      }
      assert.equal(await page.getByTestId(`${id}-loading`).isDisabled(), true);
      const loader = await measure(
        page.getByTestId(`${id}-loading`).locator("svg"),
      );
      assert.equal(loader.width, "16px");
      assert.match(loader.animationName, /^kozmos-/);
      assert.notEqual(loader.animationDuration, "0s");
      // One drawing, not four. Until 2026-09-22 React drew lucide's `Loader2`
      // here and in `Spinner`, iOS a tinted `ProgressView`, Android material3's
      // indicator and Figma an ellipse with a dash pattern; no two matched. The
      // arc is three quarters of a circle of radius 9 in the icons' own 24 box,
      // stroke 2, round caps, so it scales as every Kozmos icon does.
      const arc = (testId) =>
        page
          .getByTestId(testId)
          .locator("svg")
          .evaluate((node) => {
            const path = node.querySelector("path");
            return {
              viewBox: node.getAttribute("viewBox"),
              d: path && path.getAttribute("d"),
              width: path && path.getAttribute("stroke-width"),
              cap: path && path.getAttribute("stroke-linecap"),
              paths: node.querySelectorAll("path").length,
              // With the turn running the box is the rotated square's, up to 41 %
              // wider mid-turn; stop it to measure the layout box it occupies.
              box: (() => {
                const own = node.style.animation;
                node.style.animation = "none";
                const width = node.getBoundingClientRect().width;
                node.style.animation = own;
                return width;
              })(),
            };
          });
      const buttonArc = await arc(`${id}-loading`);
      const spinnerArc = await arc(`${id}-spinner`);
      for (const [where, drawn] of [
        ["the button's loader", buttonArc],
        ["the spinner", spinnerArc],
      ]) {
        assert.deepEqual(
          {
            viewBox: drawn.viewBox,
            d: drawn.d,
            width: drawn.width,
            cap: drawn.cap,
            paths: drawn.paths,
          },
          {
            viewBox: "0 0 24 24",
            d: "M12 3a9 9 0 1 1-9 9",
            width: "2",
            cap: "round",
            paths: 1,
          },
          `${where} is not the system's arc: ${JSON.stringify(drawn)}`,
        );
      }
      assert.deepEqual(
        [buttonArc.box, spinnerArc.box, (await arc(`${id}-spinner-xl`)).box],
        [16, 24, 48],
        "the arc's sizes are not the Spinner/size tokens",
      );
      // GAP-56: a Button keeps 8px between its icon and its label, as Figma's Button
      // (itemSpacing 8, bound) and iOS's (HStack spacing 100) do: a caller's icon, and the
      // loading spinner, without a margin of either's own. Measured on the spinner's layout box
      // (mid-turn a rotating square's bounding box is up to 41% wider), and in both directions:
      // the fixture is right-to-left, and a physical margin spaced only one of them.
      for (const testId of [`${id}-icon-label`, `${id}-loading`]) {
        const gaps = await page.getByTestId(testId).evaluate((node) => {
          const measure = () => {
            const svg = node.querySelector("svg");
            svg.style.animation = "none";
            const icon = svg.getBoundingClientRect();
            svg.style.animation = "";
            const label = [...node.childNodes].find(
              (child) =>
                child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
            );
            const range = document.createRange();
            range.selectNodeContents(label);
            const text = range.getBoundingClientRect();
            return Math.round(
              Math.max(text.left - icon.right, icon.left - text.right),
            );
          };
          const own = node.getAttribute("dir");
          const rendered = measure();
          node.setAttribute(
            "dir",
            getComputedStyle(node).direction === "rtl" ? "ltr" : "rtl",
          );
          const flipped = measure();
          if (own === null) node.removeAttribute("dir");
          else node.setAttribute("dir", own);
          return [rendered, flipped];
        });
        assert.deepEqual(
          gaps,
          [8, 8],
          `${testId}: 8px between the icon and the label in both directions (GAP-56)`,
        );
      }
      // GAP-75: the same measurement on the parts that share none of the
      // Button's CSS. `ToggleButton` is a Radix Toggle styled on its own and
      // read 0 — while SwiftUI's `HStack(spacing: spacing100)` and Compose's
      // spacer already drew 8 — and `Tag` takes arbitrary children on React
      // alone, where an icon beside its text touched. `Chip` is not here: its
      // 6 is `Chip/gap`, bound to `Layout/spacing/75` in Figma, and right.
      //
      // The full pass only. Neither part is in the owned slice — their height,
      // padding, colours and this gap are all Tailwind — so without `@scope`
      // the whole component goes, not just its gap, and measuring it there
      // would say nothing about the gap. `Button`'s is an owned rule and is
      // measured in both.
      for (const [testId, expected, within] of mode === "full"
        ? [
            [`${id}-toggle-icon-label`, 8, null],
            [`${id}-tag-icon-label`, 4, null],
            // A segmented item's label is a ReactNode and may be an icon beside
            // text. No platform had an opinion on this gap — iOS spaces the
            // track, Compose's options are plain strings — so it follows the
            // control scale, as `Button` and `ToggleButton` do.
            [`${id}-segmented`, 8, "[data-state='on']"],
          ]
        : []) {
        const host = within
          ? page.getByTestId(testId).locator(within).first()
          : page.getByTestId(testId);
        const gaps = await host.evaluate((node) => {
          const measure = () => {
            const mark = node.querySelector("svg");
            const box = mark.getBoundingClientRect();
            const label = [...node.childNodes].find(
              (child) =>
                child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
            );
            const range = document.createRange();
            range.selectNodeContents(label);
            const text = range.getBoundingClientRect();
            return Math.round(
              Math.max(text.left - box.right, box.left - text.right),
            );
          };
          const own = node.getAttribute("dir");
          const rendered = measure();
          node.setAttribute(
            "dir",
            getComputedStyle(node).direction === "rtl" ? "ltr" : "rtl",
          );
          const flipped = measure();
          if (own === null) node.removeAttribute("dir");
          else node.setAttribute("dir", own);
          return [rendered, flipped];
        });
        assert.deepEqual(
          gaps,
          [expected, expected],
          `${testId}: ${expected}px between the mark and the label in both directions (GAP-75)`,
        );
      }
      // A Tag that can be removed: its cross is spaced by the row's gap and
      // nothing else. The cross carried `ml-1` of its own, so the moment the
      // gap arrived it sat 8 from the label where the rest of the Tag spaces
      // 4 — the same compensating margin GAP-56 took off the Button's loader,
      // reintroduced by the fix for GAP-75. Measured in both directions,
      // because a margin is physical and a gap is not.
      if (mode === "full") {
        const removeGaps = await page
          .getByTestId(`${id}-tag-remove`)
          .evaluate((node) => {
            const measure = () => {
              const label = [...node.childNodes].find(
                (child) =>
                  child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
              );
              const range = document.createRange();
              range.selectNodeContents(label);
              const text = range.getBoundingClientRect();
              const cross = node
                .querySelector("button")
                .getBoundingClientRect();
              return Math.round(
                Math.max(cross.left - text.right, text.left - cross.right),
              );
            };
            const own = node.getAttribute("dir");
            const rendered = measure();
            node.setAttribute(
              "dir",
              getComputedStyle(node).direction === "rtl" ? "ltr" : "rtl",
            );
            const flipped = measure();
            if (own === null) node.removeAttribute("dir");
            else node.setAttribute("dir", own);
            return [rendered, flipped];
          });
        assert.deepEqual(
          removeGaps,
          [4, 4],
          `${id}-tag-remove: the cross is spaced 4 by the row's gap alone, in both directions`,
        );
      }
      const button = page.getByTestId(`${id}-button`);
      await button.hover();
      await page.mouse.down();
      assert.equal(
        await button.evaluate((n) => getComputedStyle(n).transform),
        "matrix(0.98, 0, 0, 0.98, 0, 0)",
        "owned pressed transform works with and without legacy CSS",
      );
      await page.mouse.up();
      // End hover explicitly and wait for the real transition, rather than
      // sampling an intermediate color immediately after releasing the press.
      await page.mouse.move(0, 0);
      const idleColor = await value(
        `${id}-button`,
        "--components-primary-buttons-themed-button-background-idle",
      );
      await page.waitForFunction(
        ({ testId, color }) =>
          getComputedStyle(document.querySelector(`[data-testid="${testId}"]`))
            .backgroundColor === color,
        { testId: `${id}-button`, color: idleColor },
      );
      assert.equal(
        (await measure(button)).backgroundColor,
        await value(
          `${id}-button`,
          "--components-primary-buttons-themed-button-background-idle",
        ),
      );
      await button.hover();
      await page.waitForTimeout(250);
      assert.equal(
        (await measure(button)).backgroundColor,
        await value(
          `${id}-button`,
          "--components-primary-buttons-themed-button-background-hover",
        ),
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-outline`))).color,
        await value(
          `${id}-outline`,
          "--components-secondary-buttons-success-button-foreground-content-idle",
        ),
      );
      assert.equal(
        (await measure(page.getByTestId(`${id}-disabled-button`))).opacity,
        "0.5",
      );
      assert.equal(
        (
          await measure(
            page
              .getByTestId(id)
              .locator("label")
              .filter({ hasText: `${id} name` }),
          )
        ).fontSize,
        "14px",
      );
      await page
        .getByRole("button", { name: `Open ${id}`, exact: true })
        .click();
      const overlay = page.getByTestId(`${id}-popover`);
      await overlay.waitFor();
      await settleLayout(page);
      assert.equal((await measure(overlay)).backgroundColor, s.backgroundColor);
      assert.equal((await measure(overlay)).borderRadius, "16px");
      assert.equal(
        (await measure(page.getByTestId(`${id}-portal-input`))).height,
        "44px",
      );
      await page.getByTestId(`${id}-portal-input`).fill("Pointr");
      const handle = await overlay.elementHandle();
      if (id === "outer") {
        await page.locator("#switch-theme").evaluate((node) => node.click());
        await settleLayout(page);
        assert.equal(await handle.evaluate((node) => node.isConnected), true);
        assert.notEqual(
          (await measure(overlay)).backgroundColor,
          s.backgroundColor,
        );
        await page.locator("#switch-theme").evaluate((node) => node.click());
        await settleLayout(page);
      }
      await page.keyboard.press("Escape");
      await overlay.waitFor({ state: "hidden" });
      assert.equal(
        await page
          .getByRole("button", { name: `Open ${id}`, exact: true })
          .evaluate((node) => node === document.activeElement),
        true,
      );
    }
    assert.notEqual(
      (await measure(page.getByTestId("outer-glass"))).backgroundColor,
      (await measure(page.getByTestId("nested-glass"))).backgroundColor,
    );
    // The glass button is the glass surface: the token's filter and tint.
    const glassButton = await page
      .getByTestId("nested-glass")
      .evaluate((node) => {
        const s = getComputedStyle(node);
        return {
          background: s.backgroundColor,
          filter: s.backdropFilter || s.webkitBackdropFilter,
        };
      });
    assert.match(
      glassButton.filter,
      /blur\(20px\) saturate\(1\.8\)/,
      `${mode}: the glass button's filter: ${glassButton.filter}`,
    );
    const buttonTint = /^rgba\(255, 255, 255, (0\.\d+)\)$/.exec(
      glassButton.background,
    );
    assert(
      buttonTint && Math.abs(Number(buttonTint[1]) - 0.7) < 0.01,
      `${mode}: the glass button's tint: ${glassButton.background}`,
    );
    // The glass surface role reads Semantics.Effect.glass: the theme's glass
    // colour at 0.7, blur 20 and saturation 1.8 on what shows through, a
    // light edge at 0.2; the two themes' tints differ.
    const surface = (id, variant = "glass") =>
      page.getByTestId(`${id}-${variant}-surface`).evaluate((node) => {
        const s = getComputedStyle(node);
        return {
          background: s.backgroundColor,
          filter: s.backdropFilter || s.webkitBackdropFilter,
          edge: s.borderTopColor,
          edgeWidth: s.borderTopWidth,
          edgeStyle: s.borderTopStyle,
          edgeOpacityVar: s.getPropertyValue(
            "--semantics-effect-glass-border-opacity",
          ),
        };
      });
    const nestedSurface = await surface("nested");
    // A browser keeps eight bits of alpha: 0.7 reads back as 0.698 or 0.7.
    const tint = /^rgba\(255, 255, 255, (0\.\d+)\)$/.exec(
      nestedSurface.background,
    );
    assert(
      tint && Math.abs(Number(tint[1]) - 0.7) < 0.01,
      `${mode}: the light glass surface's tint: ${nestedSurface.background}`,
    );
    assert.match(
      nestedSurface.filter,
      /blur\(20px\) saturate\(1\.8\)/,
      `${mode}: the glass surface's filter: ${nestedSurface.filter}`,
    );
    assert.equal(
      nestedSurface.edge,
      "rgba(255, 255, 255, 0.2)",
      `${mode}: the glass surface's edge: ${JSON.stringify(nestedSurface)}`,
    );
    assert.notEqual(
      (await surface("outer")).background,
      nestedSurface.background,
      `${mode}: the two themes' glass tints are the same`,
    );
    // Solid, the default: the background colour whole, with the subtle border.
    const solidSurface = await surface("nested", "solid");
    assert.equal(
      solidSurface.background,
      await value("nested-solid-surface", "--primitives-colors-background-0"),
      `${mode}: the solid surface is not the background colour: ${solidSurface.background}`,
    );
    assert(
      !solidSurface.background.startsWith("rgba("),
      `${mode}: the solid surface is translucent: ${solidSurface.background}`,
    );
    assert.equal(
      solidSurface.edge,
      await value("nested-solid-surface", "--semantics-border-subtle"),
      `${mode}: the solid surface's edge: ${solidSurface.edge}`,
    );
    assert.equal(
      solidSurface.edgeWidth,
      "1px",
      `${mode}: the solid surface has no edge`,
    );
    // Rotate/reflow a narrow host and switch direction without remounting. This
    // checks composition geometry, not certification of physical foldable devices.
    const outer = page.getByTestId("outer");
    await outer.evaluate((node) => {
      node.dir = "ltr";
      node.style.width = "220px";
    });
    const narrowPassword = page.getByTestId("outer-password");
    const narrowToggle = narrowPassword.locator("..").getByRole("button");
    const narrowPasswordBox = await narrowPassword.boundingBox();
    const narrowToggleBox = await narrowToggle.boundingBox();
    assert.equal(
      narrowToggleBox.x + narrowToggleBox.width,
      narrowPasswordBox.x + narrowPasswordBox.width,
    );
    const narrowNumber = page.getByTestId("outer-number");
    assert.equal(
      await narrowNumber
        .locator("..")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
      true,
    );
    const narrowIncrement = narrowNumber
      .locator("..")
      .getByRole("button", { name: "Increase value" });
    const narrowNumberBox = await narrowNumber.boundingBox();
    assert.equal(
      (await narrowIncrement.boundingBox()).x,
      narrowNumberBox.x + narrowNumberBox.width,
    );
    await narrowNumber.focus();
    await page.keyboard.press("ArrowUp");
    assert.equal(await narrowNumber.inputValue(), "4");
    if (mode === "without-scope") {
      const slot = await measure(
        page.getByTestId("outer").locator(".host-slot-button"),
      );
      assert.equal(slot.backgroundColor, "rgb(255, 165, 0)");
      assert.equal(slot.borderTopWidth, "3px");
    }
    // Late generic host resets still cannot override namespaced controls.
    await page.addStyleTag({
      content:
        "input,textarea,button {border-radius:2px;padding:0;background:orange}",
    });
    assert.equal(
      (await measure(page.getByTestId("outer-input"))).borderRadius,
      "16px",
    );
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "20px";
    });
    assert.equal(
      (await measure(page.getByTestId("outer-input"))).height,
      "55px",
    );
    assert.equal(
      (await measure(page.getByTestId("outer-input"))).fontSize,
      "17.5px",
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${mode}: local reset, forms/states, consumer CSS, exported helpers, buttons, loading animation, nested themes, RTL, portal updates and keyboard dismissal`,
    );
    await page.close();
  }

  // Decision 50 (GAP-088): Nearby reads at 4.5:1 or more on each of the
  // result card's four surfaces, in both themes. On a page with no rules of
  // its own, so what paints behind the text is the card's: the passes above
  // give every button the host's orange, and the card's select button has no
  // owned fill to refuse it, which would measure the host rather than Kozmos.
  {
    const clean = await browser.newPage({
      viewport: { width: 1100, height: 1100 },
    });
    const errors = [];
    clean.on("pageerror", (error) => errors.push(error.message));
    await clean.setContent(
      `<!doctype html><html><head></head><body><div id="fixture"></div></body></html>`,
    );
    await clean.addStyleTag({ content: css });
    await clean.addScriptTag({ content: code });
    await clean.getByTestId("outer-travel").waitFor();
    await settleLayout(clean);
    const readings = [];
    for (const [id, theme] of [
      ["outer", "dark"],
      ["nested", "light"],
    ]) {
      for (const {
        surface,
        found,
        color,
        layers,
      } of await nearbyOnEverySurface(clean, id)) {
        assert.equal(found, 1, `${theme}: the ${surface} does not read Nearby`);
        const ratio = contrastRatio(readColour(color), paintedBehind(layers));
        assert(
          ratio >= 4.5,
          `${theme}: Nearby on the ${surface} reads at ${ratio.toFixed(2)}:1, under 4.5:1`,
        );
        readings.push(`${theme} ${surface} ${ratio.toFixed(2)}:1`);
      }
    }
    assert.deepEqual(errors, []);
    console.log(`PASS decision 50: Nearby reads at ${readings.join(", ")}`);
    await clean.close();
  }

  // GAP-50: the spinner, the skeleton and the loading button turned whatever
  // the visitor had asked for. The turn now lives on one owned class, so one
  // media query answers for the arc wherever it is drawn — and the status role
  // still announces the wait when the turn stops.
  const still = await browser.newPage({
    viewport: { width: 600, height: 600 },
    reducedMotion: "reduce",
  });
  await still.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture"></div></body></html>`,
  );
  await still.addScriptTag({ content: code });
  await still.getByTestId("outer-spinner").waitFor();
  for (const testId of ["outer-spinner", "outer-loading", "outer-skeleton"]) {
    const target = still.getByTestId(testId);
    const animation = await (
      testId.endsWith("-skeleton") ? target : target.locator("svg")
    ).evaluate((node) => getComputedStyle(node).animationName);
    assert.equal(
      animation,
      "none",
      `${testId} keeps turning under prefers-reduced-motion: ${animation}`,
    );
  }
  assert.equal(
    await still.getByTestId("outer-spinner").getAttribute("role"),
    "status",
    "a spinner that has stopped must still say it is waiting",
  );
  // A page with no preference set at all, so the media query above cannot be
  // what stops anything here: whatever rests on this page rests because the
  // config said so.
  const moving = await browser.newPage({
    viewport: { width: 600, height: 600 },
    reducedMotion: "no-preference",
  });
  await moving.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture"></div></body></html>`,
  );
  await moving.addScriptTag({ content: code });
  await moving.getByTestId("config-reduced").waitFor();

  // The design config's own `motion: reduced`, with no media query set. It
  // scales `--semantics-motion-duration-scale` to 0.001, which turns a
  // transition into a cut — and a one-second spin into a strobe, so an
  // animation that loops has to be told to stop rather than scaled. The
  // provider marks its scope and the owned rules read the mark (GAP-50).
  for (const [testId, selector] of [
    ["config-reduced-spinner", "svg"],
    ["config-reduced-skeleton", null],
  ]) {
    const target = moving.getByTestId(testId);
    const animation = await (
      selector ? target.locator(selector) : target
    ).evaluate((node) => getComputedStyle(node).animationName);
    assert.equal(
      animation,
      "none",
      `${testId} keeps moving under the config's motion: reduced: ${animation}`,
    );
  }
  const ringUnderConfig = await moving
    .getByTestId("config-reduced")
    .locator(".kozmos-ai-search-ring")
    .evaluate((node) => getComputedStyle(node).animationName);
  assert.equal(
    ringUnderConfig,
    "none",
    `the assistant's ring keeps turning under the config's motion: reduced: ${ringUnderConfig}`,
  );
  // The control: with no preference and no config, they do move.
  const stillMoving = await moving
    .getByTestId("outer-spinner")
    .locator("svg")
    .evaluate((node) => getComputedStyle(node).animationName);
  assert.match(
    stillMoving,
    /^kozmos-/,
    `nothing moves at all, so resting proves nothing: ${stillMoving}`,
  );
  console.log(
    "PASS reduced motion: the arc, the skeleton and the ring rest under the preference and under the config; the status role remains",
  );
  await still.close();
  await moving.close();

  // One grey on every surface: the Skeleton is Figma's Colors/background/200,
  // as iOS and Android draw it (Olcay, 2026-09-27). React drew `bg-muted`,
  // which is background/100. `outer` is the dark theme and `nested` the light
  // one. The token is read through a probe beside each placeholder, so the
  // page resolves it exactly as it resolves the placeholder's own colour.
  const greys = await browser.newPage({
    viewport: { width: 600, height: 600 },
  });
  await greys.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture"></div></body></html>`,
  );
  await greys.addScriptTag({ content: code });
  await greys.getByTestId("outer-skeleton").waitFor();
  const tokens = [];
  for (const testId of ["outer-skeleton", "nested-skeleton"]) {
    const [drawn, token] = await greys.getByTestId(testId).evaluate((node) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--primitives-colors-background-200)";
      node.after(probe);
      const resolved = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return [getComputedStyle(node).backgroundColor, resolved];
    });
    assert.notEqual(
      token,
      "rgba(0, 0, 0, 0)",
      `${testId}: background/200 did not resolve beside it`,
    );
    assert.equal(
      drawn,
      token,
      `${testId} is not background/200: drew ${drawn}, the token is ${token}`,
    );
    tokens.push(token);
  }
  // The two themes' greys differ, so both were really compared.
  assert.notEqual(tokens[0], tokens[1], "both placeholders sat in one theme");
  console.log(
    `PASS the Skeleton is background/200 in the dark (${tokens[0]}) and the light (${tokens[1]}) theme`,
  );
  await greys.close();

  // GAP-082 (row 81): MapOverlay does not cut what floats in it. Its stack is
  // a scroll box, and a scroll box clips at its own edges. It had no room of
  // its own, so it sat exactly on its controls and cut away their floating
  // shadow on every side, and with it the one-pixel ring that is a map
  // control's edge: every engine read 0px of shadow beyond a control in an
  // overlay, where the same control placed by hand showed 4 above, 8 at the
  // sides and 12 below (Chromium, light theme).
  //
  // So: a map board with its controls in MapOverlays, and the same board
  // with the same controls placed by hand at the overlay's insets. They must
  // draw alike, every pixel to within a level — in the dark theme (`outer`) and the light
  // (`nested`), right to left and left to right, at rest and with a
  // control's focus ring showing. A third board's overlay is shorter than
  // its stack, so it scrolls: its controls keep their sides and top, and
  // scrolled to the end, the last one keeps its shadow below.
  const boards = await browser.newPage({
    viewport: { width: 1100, height: 1100 },
  });
  await boards.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light" style="margin:0"><div id="fixture"></div></body></html>`,
  );
  await boards.addScriptTag({ content: code });
  // Where a scrollbar takes room of its own (a classic one, as some Linux
  // engines draw), the scrolling board's would stand in its stack's inline
  // room and narrow it. That is the platform's, and not what this measures.
  await boards.addStyleTag({
    content:
      "[data-testid$='-map-overlay-scrolling'] > div {scrollbar-width: none}",
  });
  await boards.getByTestId("outer-map-board-overlay").waitFor();
  // Every board on whole pixels, pinned to the viewport. In the fixture's
  // flow a board sits below text whose height is the host's font's: on
  // Linux, Firefox captured a board 221 rows tall whose first row was the
  // page above it, so the two drawings were compared a row out of register.
  await boards.evaluate(() => {
    ["outer", "nested"].forEach((id, row) =>
      ["overlay", "by-hand", "scrolling"].forEach((layout, column) => {
        const node = document.querySelector(
          `[data-testid="${id}-map-board-${layout}"]`,
        );
        node.style.setProperty("position", "fixed", "important");
        node.style.setProperty("top", `${16 + row * 240}px`, "important");
        node.style.setProperty("left", `${16 + column * 224}px`, "important");
        node.style.setProperty("z-index", "2147483647", "important");
      }),
    );
  });
  await settleLayout(boards);
  const board = (id, layout) => boards.getByTestId(`${id}-map-board-${layout}`);
  const shoot = async (locator) =>
    (await locator.screenshot()).toString("base64");
  // The boards' own transitions only: the page's spinners turn for ever.
  const settleBoards = () =>
    boards.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll("[data-testid*='-map-board-']")]
          .flatMap((node) => node.getAnimations({ subtree: true }))
          .map((animation) => animation.finished),
      ),
    );
  // Where each control sits in its board, in CSS pixels of the board's
  // drawing: the map buttons, and the floor selector as one part.
  const partsOf = (locator) =>
    locator.evaluate((node) => {
      const origin = node.getBoundingClientRect();
      return [...node.querySelectorAll("button, [role=group]")]
        .filter(
          (part) =>
            part.getAttribute("role") === "group" ||
            !part.closest("[role=group]"),
        )
        .map((part) => {
          const r = part.getBoundingClientRect();
          return {
            name: part.getAttribute("aria-label"),
            left: r.left - origin.left,
            top: r.top - origin.top,
            right: r.right - origin.left,
            bottom: r.bottom - origin.top,
          };
        });
    });
  // Two drawings of one size compared inside a region of each (the whole
  // drawing unless given): how many pixels differ by more than a level, by
  // how much at most, the first that does, and how many differ by one level
  // alone; and how far chosen pixels of the second stand off the bare board.
  // One level is below sight: the cut this is about differed by 28, and a
  // room 4px short below by 2. It is also what the room trims on Linux,
  // where Chromium and Firefox draw the floating shadow's tail a level past
  // its blur distance: 2875 and 2728 pixels on CI, every one beyond the
  // room, none in WebKit, none on macOS. So one-level pixels are counted and
  // reported, never hidden, with how many lie beyond the overlay stacks'
  // boxes in the first drawing (`rooms`), where only a trimmed tail can.
  const compareShots = (
    shotA,
    shotB,
    { regionA, regionB, samples = [], rooms = [] } = {},
  ) =>
    boards.evaluate(
      async ({ shotA, shotB, regionA, regionB, samples, rooms }) => {
        const decode = async (b64) => {
          const image = new Image();
          image.src = "data:image/png;base64," + b64;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height);
        };
        const [A, B] = [await decode(shotA), await decode(shotB)];
        const at = (image, x, y) => {
          const i = (y * image.width + x) * 4;
          return [image.data[i], image.data[i + 1], image.data[i + 2]];
        };
        const whole = { x: 0, y: 0, width: A.width, height: A.height };
        const ra = regionA ?? whole;
        const rb = regionB ?? ra;
        let differing = 0;
        let faint = 0;
        let faintBeyond = 0;
        let maxDelta = 0;
        let first = null;
        for (let y = 0; y < ra.height; y++)
          for (let x = 0; x < ra.width; x++) {
            const p = at(A, ra.x + x, ra.y + y);
            const q = at(B, rb.x + x, rb.y + y);
            const delta = Math.max(...p.map((v, k) => Math.abs(v - q[k])));
            if (delta === 0) continue;
            maxDelta = Math.max(maxDelta, delta);
            if (delta === 1) {
              faint++;
              const [px, py] = [ra.x + x, ra.y + y];
              if (
                !rooms.some(
                  ([l, t, r, b]) => px >= l && px < r && py >= t && py < b,
                )
              )
                faintBeyond++;
              continue;
            }
            differing++;
            first ??= { x: ra.x + x, y: ra.y + y, a: p, b: q };
          }
        // The bare board, from a corner nothing is drawn near.
        const ground = at(B, 1, 1);
        return {
          sizes: [A.width, A.height, B.width, B.height],
          compared: ra.width * ra.height,
          differing,
          faint,
          faintBeyond,
          maxDelta,
          first,
          ground,
          samples: samples.map(([x, y]) =>
            Math.max(...at(B, x, y).map((v, k) => Math.abs(v - ground[k]))),
          ),
        };
      },
      { shotA, shotB, regionA, regionB, samples, rooms },
    );
  // The overlay stacks' boxes in a board: what the stacks' clip keeps.
  const roomsOf = (locator) =>
    locator.evaluate((node) => {
      const origin = node.getBoundingClientRect();
      return [...node.querySelectorAll(".kozmos-map-overlay-stack")].map(
        (stack) => {
          const r = stack.getBoundingClientRect();
          return [
            r.left - origin.left,
            r.top - origin.top,
            r.right - origin.left,
            r.bottom - origin.top,
          ];
        },
      );
    });
  // Two drawings of boards, each exactly 200 by 220, or out of register.
  const faint = [];
  const faintBeyond = [];
  const compareBoards = async (
    shotA,
    shotB,
    options,
    { tally = true } = {},
  ) => {
    const result = await compareShots(shotA, shotB, options);
    assert.deepEqual(
      result.sizes,
      [200, 220, 200, 220],
      `a board was not drawn 200 by 220, so two drawings would be compared out of register: ${JSON.stringify(result.sizes)}`,
    );
    if (tally) {
      faint.push(result.faint);
      faintBeyond.push(result.faintBeyond);
    }
    return result;
  };
  const sum = (counts) => counts.reduce((total, count) => total + count, 0);
  const alike = [];
  const reads = [];
  for (const [id, theme] of [
    ["outer", "dark"],
    ["nested", "light"],
  ]) {
    const overlay = board(id, "overlay");
    const byHand = board(id, "by-hand");
    for (const dir of ["rtl", "ltr"]) {
      for (const layout of ["overlay", "by-hand"])
        await board(id, layout).evaluate((node, value) => {
          node.setAttribute("dir", value);
        }, dir);
      await settleBoards();
      const placedByHand = await partsOf(byHand);
      assert.deepEqual(
        await partsOf(overlay),
        placedByHand.map((part) => ({
          ...part,
          name: part.name.replace("by-hand", "overlay"),
        })),
        `${theme} ${dir}: the overlay no longer puts its controls at the insets a hand places them at`,
      );
      // Just outside each control in the drawing by hand: its edge beside
      // it, its shadow below it. Both must be there, or two blank boards
      // would compare equal and prove nothing.
      const samples = placedByHand.flatMap((part) => [
        [Math.floor(part.left) - 1, Math.round((part.top + part.bottom) / 2)],
        [Math.round((part.left + part.right) / 2), Math.ceil(part.bottom) + 3],
      ]);
      const atRest = await compareBoards(
        await shoot(overlay),
        await shoot(byHand),
        { samples, rooms: await roomsOf(overlay) },
      );
      assert(
        atRest.samples.every((level) => level >= 2),
        `${theme} ${dir}: the controls placed by hand draw no edge or shadow to compare: ${JSON.stringify(atRest)}`,
      );
      assert.equal(
        atRest.differing,
        0,
        `${theme} ${dir}: controls in a MapOverlay draw differently from the same controls placed by hand — ${atRest.differing} of ${atRest.compared} pixels differ by more than a level, by up to ${atRest.maxDelta}; the first at ${JSON.stringify(atRest.first)}, on a board of ${JSON.stringify(atRest.ground)}. The overlay cuts what floats in it.`,
      );
      // With the zoom control's focus ring showing, one board at a time. A
      // key first, so the focus is a keyboard's and the ring shows.
      const focused = {};
      for (const layout of ["overlay", "by-hand"]) {
        const control = board(id, layout).locator("button").first();
        await boards.keyboard.press("Shift");
        await control.focus();
        assert.equal(
          await control.evaluate((node) => node.matches(":focus-visible")),
          true,
          `${theme} ${dir}: the ${layout} zoom control shows no focus ring`,
        );
        await settleBoards();
        focused[layout] = await shoot(board(id, layout));
        await control.blur();
        await settleBoards();
      }
      const ringShows = await compareBoards(
        focused["by-hand"],
        await shoot(byHand),
        {},
        { tally: false },
      );
      assert(
        ringShows.differing > 0,
        `${theme} ${dir}: focusing the control placed by hand draws nothing, so there is no ring to compare`,
      );
      const withRing = await compareBoards(
        focused.overlay,
        focused["by-hand"],
        {
          rooms: await roomsOf(overlay),
        },
      );
      assert.equal(
        withRing.differing,
        0,
        `${theme} ${dir}: a focused control in a MapOverlay draws its focus ring differently from the same control placed by hand — ${withRing.differing} pixels differ by more than a level, by up to ${withRing.maxDelta}; the first at ${JSON.stringify(withRing.first)}. The overlay cuts the ring.`,
      );
      alike.push(`${theme} ${dir}`);
      reads.push(atRest.samples.join("/"));
    }
    for (const layout of ["overlay", "by-hand"])
      await board(id, layout).evaluate((node) => node.removeAttribute("dir"));
    await settleBoards();
    // The scrolling board. Its overlay is 120 tall and its stack of three
    // controls is not, so the stack scrolls; its first control sits where the
    // board by hand places its one.
    const scrolling = board(id, "scrolling");
    const scrollingOverlay = boards.getByTestId(`${id}-map-overlay-scrolling`);
    const stack = scrollingOverlay.locator(":scope > div");
    const scroll = await stack.evaluate((node) => ({
      overflowY: getComputedStyle(node).overflowY,
      scrollable: node.scrollHeight - node.clientHeight,
    }));
    assert.equal(
      scroll.overflowY,
      "auto",
      `${theme}: the overlay's stack no longer scrolls`,
    );
    assert(
      scroll.scrollable > 0,
      `${theme}: the scrolling board's stack fits, so it tests nothing: ${JSON.stringify(scroll)}`,
    );
    const [one] = await partsOf(byHand);
    // The overlay is as wide as the control it holds.
    assert.deepEqual(
      await scrollingOverlay.evaluate((node) => {
        const r = node.getBoundingClientRect();
        const o = node.parentElement.getBoundingClientRect();
        return [r.left - o.left, r.top - o.top, r.width, r.height];
      }),
      [16, 16, one.right - one.left, 120],
      `${theme}: the scrolling overlay is no longer where, or as large as, it was`,
    );
    // The stack's room, which is the reach of the shadows it holds, and its
    // gap: the regions below are read from them, not from one shadow's
    // numbers, so they follow the tokens.
    const room = await stack.evaluate((node) => {
      const s = getComputedStyle(node);
      return {
        top: parseFloat(s.paddingTop),
        bottom: parseFloat(s.paddingBottom),
        inline: parseFloat(s.paddingLeft),
        gap: parseFloat(s.rowGap),
      };
    });
    // Beside and above the first control, down to where the next control's
    // shadow begins: it reaches the room's top above that control, which sits
    // a gap below this one.
    const sides = await compareBoards(
      await shoot(scrolling),
      await shoot(byHand),
      {
        rooms: await roomsOf(scrolling),
        regionA: {
          x: 0,
          y: 0,
          width: Math.ceil(one.right) + room.inline,
          height: Math.floor(
            Math.min(one.bottom, one.bottom + room.gap - room.top),
          ),
        },
        samples: [
          [Math.floor(one.left) - 1, Math.round((one.top + one.bottom) / 2)],
        ],
      },
    );
    assert(
      sides.samples[0] >= 2,
      `${theme}: nothing is drawn beside the control placed by hand: ${JSON.stringify(sides)}`,
    );
    assert.equal(
      sides.differing,
      0,
      `${theme}: while its stack scrolls, a MapOverlay cuts its controls' sides and top — ${sides.differing} of ${sides.compared} pixels differ from the control placed by hand by more than a level, by up to ${sides.maxDelta}; the first at ${JSON.stringify(sides.first)}`,
    );
    // Scrolled to its end, the last control's shadow below it against the
    // shadow below the control placed by hand.
    await stack.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    const last = await scrolling.evaluate((node) => {
      const origin = node.getBoundingClientRect();
      const buttons = node.querySelectorAll("button");
      const r = buttons[buttons.length - 1].getBoundingClientRect();
      return {
        left: r.left - origin.left,
        right: r.right - origin.left,
        bottom: r.bottom - origin.top,
      };
    });
    // Below a control, the room's depth and as wide as the room reaches to
    // either side, within the board.
    const below = (part) => {
      const x = Math.max(0, Math.floor(part.left) - room.inline);
      return {
        x,
        y: Math.ceil(part.bottom),
        width: Math.min(200, Math.ceil(part.right) + room.inline) - x,
        height: room.bottom + 1,
      };
    };
    const end = await compareBoards(
      await shoot(scrolling),
      await shoot(byHand),
      {
        rooms: await roomsOf(scrolling),
        regionA: below(last),
        regionB: below(one),
        samples: [
          [Math.round((one.left + one.right) / 2), Math.ceil(one.bottom) + 3],
        ],
      },
    );
    assert(
      end.samples[0] >= 2,
      `${theme}: no shadow below the control placed by hand: ${JSON.stringify(end)}`,
    );
    assert.equal(
      end.differing,
      0,
      `${theme}: scrolled to its end, a MapOverlay cuts the shadow below its last control — ${end.differing} of ${end.compared} pixels differ by more than a level, by up to ${end.maxDelta}; the first at ${JSON.stringify(end.first)}`,
    );
    await stack.evaluate((node) => {
      node.scrollTop = 0;
    });
  }
  console.log(
    `PASS GAP-082: controls in a MapOverlay draw as placed by hand, to within a level (${alike.join(", ")}; at rest and focused; edge and shadow ${reads.join(", ")} levels off the board; ${sum(faint)} pixels one level apart in all, ${sum(faintBeyond)} of them beyond an overlay's room), and a scrolling overlay keeps its controls' sides, top and last shadow`,
  );

  // Decision 46 (Olcay, 2026-09-28): the room round what an overlay holds is
  // for its shadows, not for presses. Since #127 it took them: a press beside
  // or below a control, inside the room, reached the overlay's stack and never
  // the map, and the map controls' shadow made the room 32px beside and 48px
  // below. Now only what the overlay holds takes a press; the map gets
  // everything else in the room, a press and a drag alike, and the overlay
  // still scrolls when what it holds overflows. While it overflows, and only
  // then, the room is the scroll box's again: in Linux WebKit, as CI runs
  // it, a wheel scrolls a box only if the box takes presses itself, and with
  // a room that took none, the overlay did not scroll there (#148's first CI
  // run).
  //
  // Each board has a map stand-in behind its chrome, as a renderer's canvas
  // is. Points in the room are chosen from the stacks' boxes, inside the board
  // and outside everything a stack holds. Real presses, through the engine's
  // own hit testing.
  await boards.evaluate(() => {
    window.__mapPresses = [];
    for (const map of document.querySelectorAll("[data-testid$='-map']"))
      for (const type of ["pointerdown", "pointermove", "pointerup"])
        map.addEventListener(type, (event) => {
          // As a map canvas does, so a drag stays the map's wherever it goes.
          if (type === "pointerdown") map.setPointerCapture(event.pointerId);
          window.__mapPresses.push({
            type,
            map: map.getAttribute("data-testid"),
            target: event.target === map,
          });
        });
  });
  const bandPoints = (id, layout) =>
    boards.evaluate(
      ({ id, layout }) => {
        const board = document.querySelector(
          `[data-testid="${id}-map-board-${layout}"]`,
        );
        const b = board.getBoundingClientRect();
        const points = [];
        for (const stack of board.querySelectorAll(
          ".kozmos-map-overlay-stack",
        )) {
          const s = stack.getBoundingClientRect();
          const held = [...stack.children].map((child) =>
            child.getBoundingClientRect(),
          );
          const inside = (x, y, r) =>
            x >= r.left && x < r.right && y >= r.top && y < r.bottom;
          for (const r of held) {
            const cx = (r.left + r.right) / 2;
            const cy = (r.top + r.bottom) / 2;
            for (const [x, y, where] of [
              [r.left - 8, cy, "beside"],
              [r.right + 8, cy, "beside"],
              [cx, r.top - 12, "above"],
              [cx, r.bottom + 20, "below"],
            ])
              if (
                inside(x, y, s) &&
                inside(x, y, b) &&
                !held.some((other) => inside(x, y, other))
              )
                points.push({ x: Math.round(x), y: Math.round(y), where });
          }
        }
        return points;
      },
      { id, layout },
    );
  const hitAt = (point) =>
    boards.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return (
        el?.getAttribute("data-testid") || el?.className || el?.tagName || null
      );
    }, point);
  // Presses and drags at the room's points, and every one must reach the map.
  const pressed = [];
  // The points of a scrolling overlay's room, which its scroll box takes.
  let scrollBoxTook = 0;
  const pressInRoom = async (id, layout, state) => {
    const points = await bandPoints(id, layout);
    assert(
      points.length >= 2,
      `${id} ${layout}${state}: no point in an overlay's room to press: ${JSON.stringify(points)}`,
    );
    const map = `${id}-map-board-${layout}-map`;
    for (const point of points) {
      const hit = await hitAt(point);
      assert.equal(
        hit,
        map,
        `${id} ${layout}${state}: a press ${point.where} a control, in the overlay's room at ${point.x},${point.y}, lands on ${hit}, not the map`,
      );
      // A press, then a drag, as a visitor panning the map would.
      await boards.evaluate(() => (window.__mapPresses = []));
      await boards.mouse.click(point.x, point.y);
      await boards.mouse.move(point.x, point.y);
      await boards.mouse.down();
      await boards.mouse.move(point.x + 24, point.y + 16, { steps: 4 });
      await boards.mouse.up();
      const got = await boards.evaluate(() => window.__mapPresses);
      const on = (type) =>
        got.filter((e) => e.type === type && e.map === map && e.target).length;
      assert(
        on("pointerdown") >= 2 &&
          on("pointerup") >= 2 &&
          on("pointermove") >= 1,
        `${id} ${layout}${state}: a press and a drag ${point.where} a control, in the overlay's room, did not reach the map: ${JSON.stringify(got)}`,
      );
      pressed.push(`${id} ${layout}${state} ${point.where}`);
    }
  };
  // Whether MapOverlay has marked a stack as scrolling, once its observers
  // have seen the change.
  const marked = (testId, want) =>
    boards
      .waitForFunction(
        ({ testId, want }) =>
          document
            .querySelector(`[data-testid="${testId}"] > div`)
            .hasAttribute("data-scrolls") === want,
        { testId, want },
        { timeout: 3000 },
      )
      .then(
        () => true,
        () => false,
      );
  for (const id of ["outer", "nested"]) {
    // An overlay that fits takes no press in its room.
    await pressInRoom(id, "overlay", "");
    // What the overlay holds still takes its own presses.
    const zoom = board(id, "overlay").locator("button").first();
    const box = await zoom.boundingBox();
    const target = await boards.evaluate(
      ({ x, y }) =>
        document
          .elementFromPoint(x, y)
          ?.closest("button")
          ?.getAttribute("aria-label") ?? null,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    assert.equal(
      target,
      await zoom.getAttribute("aria-label"),
      `${id}: a press on a control in an overlay no longer reaches it`,
    );
    // And an overlay taller than its room still scrolls, from a wheel over
    // what it holds. Linux WebKit, as CI runs it, scrolls a box from a wheel
    // only if the box takes presses itself: with none, this failed there.
    const scrolling = `${id}-map-overlay-scrolling`;
    const overlay = boards.getByTestId(scrolling);
    const stack = overlay.locator(":scope > div");
    await stack.evaluate((node) => (node.scrollTop = 0));
    const first = await board(id, "scrolling")
      .locator("button")
      .first()
      .boundingBox();
    await boards.mouse.move(
      first.x + first.width / 2,
      first.y + first.height / 2,
    );
    await boards.mouse.wheel(0, 40);
    const scrolled = await boards
      .waitForFunction(
        (testId) =>
          document.querySelector(`[data-testid="${testId}"] > div`).scrollTop >
          0,
        `${id}-map-overlay-scrolling`,
        { timeout: 3000 },
      )
      .then(
        () => true,
        () => false,
      );
    assert(
      scrolled,
      `${id}: an overlay that overflows no longer scrolls from a wheel over what it holds`,
    );
    await stack.evaluate((node) => (node.scrollTop = 0));
    // So while it overflows, the stack is marked as scrolling and takes the
    // presses in its room: the room is the scroll box's while there is
    // something to scroll.
    assert(
      await marked(scrolling, true),
      `${id}: an overlay that overflows is not marked as scrolling (data-scrolls on its stack)`,
    );
    const whileScrolling = await bandPoints(id, "scrolling");
    assert(
      whileScrolling.length >= 2,
      `${id}: no point in a scrolling overlay's room to press: ${JSON.stringify(whileScrolling)}`,
    );
    for (const point of whileScrolling) {
      const onStack = await boards.evaluate(
        ({ x, y, testId }) =>
          document.elementFromPoint(x, y) ===
          document.querySelector(`[data-testid="${testId}"] > div`),
        { ...point, testId: scrolling },
      );
      assert(
        onStack,
        `${id}: while an overlay overflows, a press ${point.where} a control in its room, at ${point.x},${point.y}, lands on ${await hitAt(point)}, not its scroll box, which must take presses for a wheel to scroll it in Linux WebKit`,
      );
      scrollBoxTook += 1;
    }
    // Given the room, the same overlay fits: it is no longer marked, and a
    // press in its room reaches the map again.
    await overlay.evaluate((node) => (node.style.maxHeight = "none"));
    assert(
      await marked(scrolling, false),
      `${id}: an overlay given the room it needs is still marked as scrolling`,
    );
    await pressInRoom(id, "scrolling", " (given room)");
    await overlay.evaluate((node) => (node.style.maxHeight = "120px"));
    assert(
      await marked(scrolling, true),
      `${id}: an overlay that overflows again is not marked as scrolling`,
    );
  }
  console.log(
    `PASS decision 46: a press or a drag in the room of an overlay that fits reaches the map (${pressed.length} points: ${[...new Set(pressed)].join(", ")}); a control in it still takes its press; an overlay that overflows scrolls from a wheel over what it holds, and is marked as scrolling and takes the presses in its room (${scrollBoxTook} points) only while it overflows`,
  );
  await boards.close();

  // The AI search button's gradient ring: a band two and a half wide, all the
  // way round, MEASURED IN THE PAINT.
  //
  // Stacked as a 43 disc inside a 48 circle it measured 1.93 to 3.20 in
  // Chromium — the disc's rounded rect painting 0.44px right and down of the
  // ring's, at every device ratio, animated or frozen, while
  // `getBoundingClientRect` swore they were concentric. WebKit and Firefox drew
  // it evenly, so it looked like nothing, and the only check on it read
  // `offsetWidth` and `offsetLeft` and called the difference the band.
  //
  // Eight device pixels to the CSS pixel, because a 2.5 band is two or three
  // device pixels at 1x and mostly antialiasing: rays through it there read
  // anywhere from 1.45 to 3.50 whatever is drawn. That is why this lives here,
  // on a page whose ratio is ours, and not against a Storybook viewport.
  const sharp = await browser.newPage({
    viewport: { width: 200, height: 200 },
    deviceScaleFactor: 8,
  });
  await sharp.setContent(
    `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light" style="margin:0;background:#fff"><div id="fixture"></div></body></html>`,
  );
  await sharp.addScriptTag({ content: code });
  const ring = sharp.getByTestId("outer-ai-search");
  await ring.waitFor();
  // The turn has to stop, or the screenshot catches the square's rotated box.
  await sharp.addStyleTag({
    content: ".kozmos-ai-search-ring{animation:none !important}",
  });
  await ring.scrollIntoViewIfNeeded();
  const laidOut = await ring.evaluate(
    (node) => node.getBoundingClientRect().width,
  );
  assert.equal(laidOut, 48, `the AI search button is not 48: ${laidOut}`);
  // The element's own screenshot, which is exactly the element once the turn is
  // stopped. While it turns it is the rotated square's bounding box — 49 CSS
  // pixels, not 48 — and every radius measured against it is wrong.
  const shot = await ring.screenshot();
  const measured = await sharp.evaluate(async (b64) => {
    const image = new Image();
    image.src = "data:image/png;base64," + b64;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const { data, width } = context.getImageData(
      0,
      0,
      image.width,
      image.height,
    );
    const at = (x, y) => {
      const i = (Math.round(y) * width + Math.round(x)) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    // Saturation, not lightness: the ring's gradient is the data colours, and
    // everything else here — the disc behind it, the page around it — is
    // neutral. A near-white test only works in the light theme, and the
    // fixture's outer tree is dark.
    const plain = (p) =>
      p[3] < 100 ||
      Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) < 40;
    const perPixel = width / 48;
    const centre = width / 2;
    const widths = [];
    for (let degree = 0; degree < 360; degree += 10) {
      const angle = ((degree - 90) * Math.PI) / 180;
      let outer = null;
      let inner = null;
      for (let r = centre - 1; r > 0; r -= 0.05) {
        const sample = at(
          centre + Math.cos(angle) * r,
          centre + Math.sin(angle) * r,
        );
        if (outer === null && !plain(sample)) outer = r;
        if (outer !== null && plain(sample)) {
          inner = r;
          break;
        }
      }
      if (outer !== null && inner !== null)
        widths.push((outer - inner) / perPixel);
    }
    return {
      min: Math.min(...widths),
      max: Math.max(...widths),
      rays: widths.length,
      width,
    };
  }, shot.toString("base64"));
  assert.equal(
    measured.width,
    48 * 8,
    `the shot is not the button at eight device pixels to the CSS pixel: ${measured.width}`,
  );
  assert.equal(
    measured.rays,
    36,
    `the ring was not found all the way round: ${JSON.stringify(measured)}`,
  );
  // Evenness is the claim, and evenness is what the defect broke. The absolute
  // figure carries the classifier's own bias — saturation falls off across the
  // antialiased inner edge, so the band reads a shade under 2.5 in every engine
  // — but that bias is the same on every ray, and the spread is not. The old
  // drawing measured 1.93 to 3.20 in Chromium: a spread of 1.27 against the
  // 0.24 this leaves.
  const spread = measured.max - measured.min;
  assert.ok(
    spread <= 0.4,
    `the AI search ring's band is not the same width all the way round: ${measured.min.toFixed(2)}–${measured.max.toFixed(2)}, a spread of ${spread.toFixed(2)}`,
  );
  assert.ok(
    measured.min > 2 && measured.max < 3,
    `the AI search ring's band is not two and a half wide: ${measured.min.toFixed(2)}–${measured.max.toFixed(2)}`,
  );
  console.log(
    `PASS the AI search ring's band: ${measured.min.toFixed(2)}–${measured.max.toFixed(2)} of 2.5, a spread of ${spread.toFixed(2)} on 36 rays`,
  );
  await sharp.close();
} finally {
  await browser.close();
}
