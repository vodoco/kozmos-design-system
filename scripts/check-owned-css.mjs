import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

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
      }
      assert.equal(await page.getByTestId(`${id}-loading`).isDisabled(), true);
      const loader = await measure(
        page.getByTestId(`${id}-loading`).locator("svg"),
      );
      assert.equal(loader.width, "16px");
      assert.match(loader.animationName, /^kozmos-/);
      assert.notEqual(loader.animationDuration, "0s");
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
              (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
            );
            const range = document.createRange();
            range.selectNodeContents(label);
            const text = range.getBoundingClientRect();
            return Math.round(Math.max(text.left - icon.right, icon.left - text.right));
          };
          const own = node.getAttribute("dir");
          const rendered = measure();
          node.setAttribute("dir", getComputedStyle(node).direction === "rtl" ? "ltr" : "rtl");
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
    const glassButton = await page.getByTestId("nested-glass").evaluate((node) => {
      const s = getComputedStyle(node);
      return { background: s.backgroundColor, filter: s.backdropFilter || s.webkitBackdropFilter };
    });
    assert.match(glassButton.filter, /blur\(20px\) saturate\(1\.8\)/, `${mode}: the glass button's filter: ${glassButton.filter}`);
    const buttonTint = /^rgba\(255, 255, 255, (0\.\d+)\)$/.exec(glassButton.background);
    assert(buttonTint && Math.abs(Number(buttonTint[1]) - 0.7) < 0.01, `${mode}: the glass button's tint: ${glassButton.background}`);
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
          edgeOpacityVar: s.getPropertyValue("--semantics-effect-glass-border-opacity"),
        };
      });
    const nestedSurface = await surface("nested");
    // A browser keeps eight bits of alpha: 0.7 reads back as 0.698 or 0.7.
    const tint = /^rgba\(255, 255, 255, (0\.\d+)\)$/.exec(nestedSurface.background);
    assert(tint && Math.abs(Number(tint[1]) - 0.7) < 0.01, `${mode}: the light glass surface's tint: ${nestedSurface.background}`);
    assert.match(nestedSurface.filter, /blur\(20px\) saturate\(1\.8\)/, `${mode}: the glass surface's filter: ${nestedSurface.filter}`);
    assert.equal(nestedSurface.edge, "rgba(255, 255, 255, 0.2)", `${mode}: the glass surface's edge: ${JSON.stringify(nestedSurface)}`);
    assert.notEqual((await surface("outer")).background, nestedSurface.background, `${mode}: the two themes' glass tints are the same`);
    // Solid, the default: the background colour whole, with the subtle border.
    const solidSurface = await surface("nested", "solid");
    assert.equal(solidSurface.background, await value("nested-solid-surface", "--primitives-colors-background-0"), `${mode}: the solid surface is not the background colour: ${solidSurface.background}`);
    assert(!solidSurface.background.startsWith("rgba("), `${mode}: the solid surface is translucent: ${solidSurface.background}`);
    assert.equal(solidSurface.edge, await value("nested-solid-surface", "--semantics-border-subtle"), `${mode}: the solid surface's edge: ${solidSurface.edge}`);
    assert.equal(solidSurface.edgeWidth, "1px", `${mode}: the solid surface has no edge`);
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
} finally {
  await browser.close();
}
