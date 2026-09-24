import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("token-alpha-host.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><div id="fixture"></div>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("outer-alpha").waitFor();
  await page.getByRole("button", { name: "Open alpha portal" }).click();
  await page.getByTestId("portal-alpha").waitFor();
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch theme" }).click();
    await settleLayout(page);
    for (const prefix of ["outer", "nested", "portal"]) {
      for (const [part, property, token, factor] of [
        ["plain", "backgroundColor", "--primitives-colors-background-0", 1],
        ["alpha", "backgroundColor", "--primitives-colors-background-0", 0.9],
        ["text", "color", "--primitives-colors-foreground-0", 0.5],
        ["border", "borderTopColor", "--semantics-border-subtle", 0.7],
      ]) {
        const result = await page.getByTestId(`${prefix}-${part}`).evaluate(
          (node, { property, token, factor }) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d");
            function rgba(color) {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return [...context.getImageData(0, 0, 1, 1).data];
            }
            const actual = rgba(getComputedStyle(node)[property]);
            const probe = document.createElement("span");
            probe.style.color = `var(${token})`;
            node.append(probe);
            const expected = rgba(getComputedStyle(probe).color);
            probe.remove();
            expected[3] = Math.round(expected[3] * factor);
            return { actual, expected };
          },
          { property, token, factor },
        );
        result.actual.forEach((channel, index) =>
          assert(
            Math.abs(channel - result.expected[index]) <= 2,
            `${theme}/${prefix}/${part}: ${JSON.stringify(result)}`,
          ),
        );
      }
    }
  }
  console.log(
    "PASS token alpha: 24 rendered pairs, nested themes, rgba/hex overrides and owned portal",
  );
} finally {
  await browser.close();
}
