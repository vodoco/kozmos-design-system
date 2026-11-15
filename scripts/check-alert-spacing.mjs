/**
 * Alert's space above and below its words (GAP-269), on the built package in
 * a real browser (packages/react/tests/integration/alert-spacing-host.tsx),
 * in every variant.
 *
 * A description straight after the icon, with no title, was lifted 3 with a
 * transform (`[&>svg+div]:translate-y-[-3px]`). A transform moves what is
 * drawn and leaves the box where it was, so the words had 13 above them and
 * 19 below. The check reads, inside the alert's border, the space above its
 * first content and below its last, as drawn (transforms included), and
 * where the icon's middle sits against the middle of the words' first line.
 *
 * - Title-less, one line and two: 14 above and 14 below, the description's
 *   first line centred on the icon.
 * - Title-less with an action in the description: as much above as below.
 * - Titled, and with no icon: 16 above and 16 below, as before; a titled
 *   alert's icon centred on its title.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-alert-spacing.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const VARIANTS = ["default", "destructive", "success", "warning", "info"];

const { code, css } = await buildReactFixture("alert-spacing-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 600, height: 2400 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Alert spacing</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-case]").first().waitFor();
  await settleLayout(page);

  /** The space above the first content and below the last, inside the
   * border, and how far the icon's middle is from the first line's. */
  const read = (name) =>
    page.evaluate((name) => {
      const alert = document.querySelector(`[data-case="${name}"]`);
      const box = alert.getBoundingClientRect();
      const style = getComputedStyle(alert);
      const top = box.top + parseFloat(style.borderTopWidth);
      const bottom = box.bottom - parseFloat(style.borderBottomWidth);
      const part = (name) => alert.querySelector(`[data-part~="${name}"]`);
      const first = part("first").getBoundingClientRect();
      const last = part("last").getBoundingClientRect();
      const icon = part("icon");
      const line = parseFloat(getComputedStyle(part("first")).lineHeight);
      const round = (value) => Math.round(value * 10) / 10;
      return {
        above: round(first.top - top),
        below: round(bottom - last.bottom),
        iconOffFirstLine: icon
          ? round(
              (icon.getBoundingClientRect().top +
                icon.getBoundingClientRect().bottom) /
                2 -
                (first.top + line / 2),
            )
          : null,
      };
    }, name);
  const expect = (label, actual, wanted) => {
    checked++;
    if (JSON.stringify(actual) !== JSON.stringify(wanted))
      failures.push(
        `${label}: ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`,
      );
  };

  for (const variant of VARIANTS) {
    const titled = await read(`titled-${variant}`);
    expect(`${variant} titled`, titled, {
      above: 16,
      below: 16,
      iconOffFirstLine: 0,
    });
    for (const shape of ["title-less", "title-less-two-lines"]) {
      expect(`${variant} ${shape}`, await read(`${shape}-${variant}`), {
        above: 14,
        below: 14,
        iconOffFirstLine: 0,
      });
    }
    const action = await read(`title-less-action-${variant}`);
    expect(
      `${variant} title-less with an action, below less above (${action.above} above, ${action.below} below)`,
      Math.round((action.below - action.above) * 10) / 10,
      0,
    );
    const plain = await read(`no-icon-${variant}`);
    expect(`${variant} no icon`, plain, {
      above: 16,
      below: 16,
      iconOffFirstLine: null,
    });
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
if (failures.length) {
  console.error(`FAIL alert spacing in ${engine} (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS alert spacing in ${engine}: ${checked} alerts, ${VARIANTS.length} variants — a title-less description ` +
    "14 above and 14 below on one line and two, centred on the icon, as much above as below with an action, " +
    "and a titled or icon-less alert 16 and 16 as before",
);
