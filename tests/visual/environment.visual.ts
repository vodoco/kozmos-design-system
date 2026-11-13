import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// What the review's browser must be able to show before any baseline means
// anything. Each promise here was once broken without a story noticing.

// Kozmos's own system font stack, as the tokens publish it.
const tokens = JSON.parse(
  readFileSync("packages/tokens/src/tokens-light.json", "utf8"),
) as {
  Semantics: { Typography: { Family: { System: { $value: string } } } };
};
const systemStack = tokens.Semantics.Typography.Family.System.$value;

test("the page prefers reduced motion, as the config promises", async ({
  page,
}) => {
  // Components that move rest under this preference (GAP-50), and the
  // review draws their still state. `use.reducedMotion` is no Playwright
  // option and was ignored; the preference reaches the page only through
  // the context's own options.
  await page.setContent("<!doctype html><title>motion</title>");
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
});

async function platformFonts(page: Page, selector: string) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector,
  });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  await cdp.detach();
  return fonts.map((font) => font.familyName).join(", ");
}

test("bold text draws differently from regular in the system stack", async ({
  page,
}) => {
  // A Heading's weight is part of what a baseline records. Measured on
  // 2026-11-12: in this image a computed weight of 700 drew exactly like
  // 400, so a story could lose its bold and still match.
  await page.setContent(`<!doctype html><style>
    span { display: inline-block; width: 480px; font: 32px/40px ${systemStack}; color: #000; background: #fff; }
  </style><span id="regular" style="font-weight: 400">Kozmos 0123 Heading</span>
  <span id="bold" style="font-weight: 700">Kozmos 0123 Heading</span>`);
  const regularFont = await platformFonts(page, "#regular");
  const boldFont = await platformFonts(page, "#bold");
  test.info().annotations.push({
    type: "fonts",
    description: `regular: ${regularFont}; bold: ${boldFont}`,
  });
  console.log(
    `system stack draws regular in ${regularFont}, bold in ${boldFont}`,
  );
  const regular = await page.locator("#regular").screenshot();
  const bold = await page.locator("#bold").screenshot();
  expect(bold.equals(regular), `bold drew like regular in ${boldFont}`).toBe(
    false,
  );
});
