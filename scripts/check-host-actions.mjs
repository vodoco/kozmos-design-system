/**
 * The product's own actions (GAP-028, GAP-130), on the built package in a real
 * browser (packages/react/tests/integration/host-actions-host.tsx).
 *
 * - On a selected result: the row holds Go, Details, then the product's three
 *   in the order given, as buttons. Each is 44 by 44 or more and stays inside
 *   the card, its words wrapping in German at 280 wide; the first's icon is a
 *   20 by 20 mark hidden from readers, at the start of its words in both
 *   directions; the second has no icon; the third is disabled and out of the
 *   tab order.
 * - The keyboard: Tab from the result reaches Go, Details and then the
 *   product's two; Enter and Space run them, each once, with its id and the
 *   POI's, and never select the result.
 * - On the details card, 320 wide: the product's actions come last in the
 *   strip, after book and call; the first is out of view until Tab reaches
 *   it, when the strip scrolls it whole into view; Enter runs it; its icon is
 *   24 by 24 and hidden from readers.
 * - axe finds nothing on either card.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-host-actions.mjs
 */
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("host-actions-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
let reads = 0;
const fail = (where, message) => failures.push(`${where}: ${message}`);

async function open(mount) {
  const context = await browser.newContext({
    viewport: { width: 480, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Host actions</title><style>body{margin:0}</style><style>${css}</style></head><body><main><div id="fixture"></div></main></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.evaluate((mount) => window.hostActions.mount(mount), mount);
  await settleLayout(page);
  return { context, page, errors };
}

/** The buttons in `selector`, in document order: words, box, icon, state. */
const buttons = (page, selector) =>
  page.evaluate((selector) => {
    const scope = document.querySelector(selector);
    if (!scope) return null;
    return [...scope.querySelectorAll("button")].map((button) => {
      const svg = button.querySelector("svg");
      const words = [...button.querySelectorAll("span")].find((span) =>
        span.textContent.trim(),
      );
      const box = (node) => node && node.getBoundingClientRect().toJSON();
      return {
        text: button.textContent.trim(),
        box: box(button),
        disabled: button.disabled,
        tabIndex: button.tabIndex,
        icon: svg && {
          box: box(svg),
          hidden: svg.getAttribute("aria-hidden"),
          first: button.firstElementChild === svg,
        },
        words: box(words ?? button),
      };
    });
  }, selector);

const card = (page) =>
  page.evaluate(() => document.getElementById("card").getBoundingClientRect().toJSON());

/** Presses Tab until `text` has focus, at most `limit` times; what had it. */
async function tabTo(page, text, limit = 12) {
  const seen = [];
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const at = await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? "",
    );
    seen.push(at);
    if (at === text) return seen;
  }
  return seen;
}

const german = [
  "Einen Tisch für heute Abend reservieren",
  "Speisekarte ansehen",
  "Auf die Warteliste",
];

// ------------------------------------------------------------ the result card

for (const [width, dir, labels] of [
  [360, "ltr", ["Reserve a table", "See the menu", "Join the waitlist"]],
  [360, "rtl", ["احجز طاولة", "القائمة", "قائمة الانتظار"]],
  [280, "ltr", german],
]) {
  const where = `result ${width} ${dir}`;
  const { context, page, errors } = await open({
    part: "result",
    width,
    dir,
    labels,
  });
  reads += 1;
  const row = await buttons(page, '[role="group"]');
  const box = await card(page);
  if (!row) {
    fail(where, "no action row");
    await context.close();
    continue;
  }
  const order = row.map((button) => button.text);
  if (order.join(" | ") !== ["Go", "Details", ...labels].join(" | "))
    fail(where, `the row reads ${JSON.stringify(order)}`);
  const host = row.slice(2);
  for (const button of host) {
    if (button.box.width < 44 - 0.5 || button.box.height < 44 - 0.5)
      fail(where, `"${button.text}" is ${button.box.width}×${button.box.height}, under 44`);
    if (button.box.left < box.left - 0.5 || button.box.right > box.right + 0.5)
      fail(where, `"${button.text}" leaves the card (${button.box.left}–${button.box.right} in ${box.left}–${box.right})`);
  }
  const [reserve, menu, waitlist] = host;
  if (!reserve?.icon) fail(where, "the first host action draws no icon");
  else {
    const { icon, words } = reserve;
    if (Math.abs(icon.box.width - 20) > 0.5 || Math.abs(icon.box.height - 20) > 0.5)
      fail(where, `its icon is ${icon.box.width}×${icon.box.height}, not 20×20`);
    if (icon.hidden !== "true" || !icon.first)
      fail(where, `its icon is not a hidden first mark (${JSON.stringify(icon)})`);
    const leads =
      dir === "ltr"
        ? icon.box.right <= words.left + 0.5
        : icon.box.left >= words.right - 0.5;
    if (!leads)
      fail(where, `its icon does not lead its words (${JSON.stringify({ icon: icon.box, words })})`);
  }
  if (menu?.icon) fail(where, "an action with no iconName draws an icon");
  if (!waitlist?.disabled) fail(where, "the disabled host action can be pressed");
  if (width === 280 && reserve && reserve.box.height <= 44)
    fail(where, `the long German words did not wrap (${reserve.box.height} tall)`);

  // The keyboard, from the result itself.
  await page.locator("#card button").first().focus();
  const seen = await tabTo(page, labels[1]);
  const expected = ["Go", "Details", labels[0], labels[1]];
  if (seen.join(" | ") !== expected.join(" | "))
    fail(where, `Tab from the result went ${JSON.stringify(seen)}`);
  await page.keyboard.press(" ");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  const pressed = await page.evaluate(() => [...window.hostActions.pressed]);
  if (pressed.join(", ") !== "menu trattoria/1, reserve trattoria/1")
    fail(where, `Space and Enter ran ${JSON.stringify(pressed)}`);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const after = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (after === labels[2]) fail(where, "Tab reached the disabled host action");

  const axe = await new AxeBuilder({ page }).include("#card").analyze();
  for (const violation of axe.violations)
    fail(where, `axe ${violation.id}: ${violation.help}`);
  for (const error of errors) fail(where, `page error: ${error}`);
  await context.close();
}

// ------------------------------------------------------------ the details card

{
  const where = "details 320";
  const handOff = "Get live directions in Pointr Express";
  const { context, page, errors } = await open({
    part: "details",
    width: 320,
    labels: [handOff, "Report a problem", "Later"],
  });
  reads += 1;
  const strip = await buttons(page, ".kozmos-poi-actions");
  const order = strip?.map((button) => button.text) ?? [];
  const expected = ["Go", "Share", "Order ahead", "Call", handOff, "Report a problem", "Later"];
  if (order.join(" | ") !== expected.join(" | "))
    fail(where, `the strip reads ${JSON.stringify(order)}`);
  const visible = () =>
    page.evaluate((text) => {
      const strip = document.querySelector(".kozmos-poi-actions")?.getBoundingClientRect();
      const button = [...document.querySelectorAll(".kozmos-poi-actions button")]
        .find((node) => node.textContent.trim() === text)
        ?.getBoundingClientRect();
      if (!strip || !button) return null;
      return button.left >= strip.left - 0.5 && button.right <= strip.right + 0.5;
    }, handOff);
  const before = await visible();
  if (before === null) fail(where, "no hand-off in the strip");
  else if (before) fail(where, "the hand-off is in view before it is reached: the case is not tested");
  await page.locator("#card .kozmos-poi-actions button").first().focus();
  const seen = await tabTo(page, handOff);
  if (seen[seen.length - 1] !== handOff)
    fail(where, `Tab never reached the hand-off (${JSON.stringify(seen)})`);
  await settleLayout(page);
  if ((await visible()) !== true) fail(where, "the strip did not bring the focused hand-off into view");
  await page.keyboard.press("Enter");
  const pressed = await page.evaluate(() => [...window.hostActions.pressed]);
  if (pressed.join(", ") !== "open-in-app trattoria/1")
    fail(where, `Enter ran ${JSON.stringify(pressed)}`);
  const hand = strip?.find((button) => button.text === handOff);
  if (!hand?.icon) fail(where, "the hand-off draws no icon");
  else if (
    Math.abs(hand.icon.box.width - 24) > 0.5 ||
    hand.icon.hidden !== "true" ||
    !hand.icon.first
  )
    fail(where, `its icon is not a hidden 24 first mark (${JSON.stringify(hand.icon)})`);
  if (!strip?.find((button) => button.text === "Later")?.disabled)
    fail(where, "the disabled host action can be pressed");
  const axe = await new AxeBuilder({ page }).include("#card").analyze();
  for (const violation of axe.violations)
    fail(where, `axe ${violation.id}: ${violation.help}`);
  for (const error of errors) fail(where, `page error: ${error}`);
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(
    `FAIL host actions (${engine}): ${failures.length} problem(s) in ${reads} cards\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS host actions (${engine}): ${reads} cards; a result's host actions follow Go and Details in order, 44 or more and inside the card in both directions and in German at 280, the icon a hidden 20 mark at their start, none for no name, the disabled one inert and out of the tab order; Tab reaches them after the card's own and Enter and Space run each once with its id; on the details card they end the strip, the focused one scrolled whole into view, Enter runs it, its icon a hidden 24 mark; axe finds nothing`,
);
