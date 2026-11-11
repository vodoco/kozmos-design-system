/**
 * Kbd (GAP-156) and ContextMenu's keyboard path (GAP-155), on the built
 * package in a real browser (packages/react/tests/integration/kbd-host.tsx).
 *
 * - A hint is named as it is read: "Press Escape to clear, or Control+K to
 *   search." — each key by its name, the glyphs not read.
 * - It is copied as it is drawn: selecting the hint and copying it gives
 *   "Press Esc to clear, or Ctrl+K to search." on one line, no name copied
 *   and no line broken around a key.
 * - A cap is 20 tall and at least 20 wide, on the muted fill with the
 *   border colour, light and dark.
 * - The context-menu key opens the menu at the focused row, and a
 *   `contextmenu` fired in the open menu (Chromium on Windows fires one on
 *   the key's keyup) is cancelled, so the browser's own menu never opens
 *   on top of it.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-kbd.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("kbd-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
const expect = (label, ok, detail) => {
  checked++;
  if (!ok) failures.push(`${label}: ${detail}`);
};
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Kbd</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-case]").first().waitFor();
  await settleLayout(page);

  for (const name of ["light", "dark"]) {
    const hint = page.locator(`[data-case="${name}"]`);
    // Each key by its name, the glyphs not read; an engine may part the
    // keys of a combination from its "+" with spaces.
    const named = await page.locator(`[data-name="${name}"]`).ariaSnapshot();
    expect(
      `${name}: named as it is read`,
      /^- button "Press Escape to clear, or Control ?\+ ?K to search\."$/.test(
        named.trim(),
      ),
      named,
    );
    const copied = await hint.evaluate((element) => {
      const selection = getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.addRange(range);
      const text = selection.toString();
      selection.removeAllRanges();
      return text.replace(/ /g, " ").replace(/\s+$/, "");
    });
    expect(
      `${name}: copied as it is drawn`,
      copied === "Press Esc to clear, or Ctrl+K to search.",
      JSON.stringify(copied),
    );
    const caps = await hint.evaluate((element) =>
      [...element.querySelectorAll("kbd")]
        .filter((kbd) => !kbd.querySelector("kbd"))
        .map((kbd) => {
          const box = kbd.getBoundingClientRect();
          const style = getComputedStyle(kbd);
          return {
            text:
              kbd.querySelector("[aria-hidden]")?.textContent ??
              kbd.textContent,
            width: box.width,
            height: box.height,
            fill: style.backgroundColor,
            border: `${style.borderTopWidth} ${style.borderTopStyle}`,
          };
        }),
    );
    expect(`${name}: three caps`, caps.length === 3, JSON.stringify(caps));
    for (const cap of caps) {
      expect(
        `${name} ${cap.text}: 20 tall, at least 20 wide`,
        Math.abs(cap.height - 20) < 0.01 && cap.width >= 20 - 0.01,
        `${cap.width}×${cap.height}`,
      );
      expect(
        `${name} ${cap.text}: a filled, bordered cap`,
        !/rgba\(.*,\s*0\)|transparent/.test(cap.fill) &&
          cap.border === "1px solid",
        `${cap.fill}, ${cap.border}`,
      );
    }
  }

  // ContextMenu from the keyboard, at the row.
  const row = page.locator('[data-case="row"]');
  await row.focus();
  const rowBox = await row.boundingBox();
  await row.press("ContextMenu");
  const menu = page.getByRole("menu");
  await menu.waitFor();
  await settleLayout(page);
  const menuBox = await menu.boundingBox();
  expect(
    "the context-menu key opens the menu at the row",
    Math.abs(menuBox.y - (rowBox.y + rowBox.height)) <= 12 &&
      Math.abs(menuBox.x - rowBox.x) <= 12,
    `menu at ${menuBox.x},${menuBox.y}; row ${rowBox.x},${rowBox.y + rowBox.height}`,
  );
  const cancelled = await page.evaluate(() => {
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    return !document.activeElement.dispatchEvent(event);
  });
  expect(
    "a contextmenu in the open menu is cancelled",
    cancelled,
    "the browser's own menu would open over it",
  );
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL kbd (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS kbd: ${checked} reads — a hint named by its keys' names and copied as drawn on one line, caps 20 tall and ` +
    "at least 20 wide, light and dark, and the context-menu key opening the menu at the row, its own contextmenu cancelled",
);
