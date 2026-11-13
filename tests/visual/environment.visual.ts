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

test("each weight Kozmos uses draws as itself in the system stack", async ({
  page,
}) => {
  // A weight is part of what a baseline records. Measured on 2026-11-13:
  // the image resolved the stack to WenQuanYi Zen Hei, which drew 700
  // exactly like 400 (and, on 16 Oct, 600 like 500), so a story could lose
  // its bold and still match.
  const weights = [400, 500, 600, 700];
  await page.setContent(`<!doctype html><style>
    span { display: block; width: 480px; font: 32px/40px ${systemStack}; color: #000; background: #fff; }
  </style>${weights
    .map(
      (w) =>
        `<span id="w${w}" style="font-weight: ${w}">Kozmos 0123 Heading</span>`,
    )
    .join("")}`);
  const drawn = new Map<number, Buffer>();
  for (const weight of weights) {
    const font = await platformFonts(page, `#w${weight}`);
    console.log(`system stack draws ${weight} in ${font}`);
    // The review's own face (tests/visual/fonts), the one every baseline
    // is drawn in.
    expect(font, `weight ${weight}`).toBe("Roboto");
    drawn.set(weight, await page.locator(`#w${weight}`).screenshot());
  }
  for (const [i, a] of weights.entries()) {
    for (const b of weights.slice(i + 1)) {
      expect(
        drawn.get(a)!.equals(drawn.get(b)!),
        `${b} drew exactly like ${a}`,
      ).toBe(false);
    }
  }
});
