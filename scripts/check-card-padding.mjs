/**
 * Card's padding (GAP-194), on the built package in a real browser
 * (packages/react/tests/integration/card-padding-host.tsx), in both of
 * Card's paddings: 24 by default, 16 with `padding="compact"`.
 *
 * CardContent and CardFooter pad their sides and bottom only, because a
 * header above has already paid the top. With no header the content, or a
 * footer, is the card's first child, and it touched the card's top edge.
 * Each part holds a block whose top is where its content starts; the check
 * reads the distance from the card's top edge, inside its border, to that
 * block, and the part's own sides and bottom.
 *
 * - Header-led: the header pays the top, the content and footer start at
 *   its bottom and pay no top of their own — drawn as before.
 * - No header: the content, the content above a footer, or a footer alone
 *   starts the padding below the card's top edge, and pays its sides and
 *   bottom as before.
 * - A form around a header-led card's parts: the content is not the card's
 *   first child and pays no top, so nothing is padded twice.
 * - A caller's own `p-0` or `pt-2` on the content still wins.
 * - A header-led card inside a header-less card's content pays no top for
 *   its content: nothing is inherited from the outer card.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-card-padding.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("card-padding-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 2000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Card padding</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-case]").first().waitFor();
  await settleLayout(page);

  /** Where each probe starts below its card's top edge (inside the border),
   * and the padding its part draws on each side. */
  const read = (shape, padding) =>
    page.evaluate(
      ({ name }) => {
        const card = document.querySelector(`[data-case="${name}"]`);
        const edge =
          card.getBoundingClientRect().top +
          parseFloat(getComputedStyle(card).borderTopWidth);
        const probes = {};
        for (const probe of card.querySelectorAll("[data-probe]")) {
          const part = probe.parentElement.closest(
            "[data-case] > *, [data-case] > form > *, [data-inner] > *",
          );
          const style = getComputedStyle(part);
          probes[probe.dataset.probe] = {
            top: Math.round(probe.getBoundingClientRect().top - edge),
            padding: [
              style.paddingTop,
              style.paddingRight,
              style.paddingBottom,
              style.paddingLeft,
            ].map((value) => Math.round(parseFloat(value))),
          };
        }
        return probes;
      },
      { name: `${shape}-${padding}` },
    );
  const expect = (label, actual, wanted) => {
    checked++;
    if (JSON.stringify(actual) !== JSON.stringify(wanted))
      failures.push(
        `${label}: ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`,
      );
  };

  for (const [padding, p] of [
    ["default", 24],
    ["compact", 16],
  ]) {
    const header = await read("header-led", padding);
    expect(`${padding} header-led: header`, header.header, {
      top: p,
      padding: [p, p, p, p],
    });
    expect(
      `${padding} header-led: content pays no top`,
      header.content.padding,
      [0, p, p, p],
    );
    expect(`${padding} header-led: footer pays no top`, header.footer.padding, [
      0,
      p,
      p,
      p,
    ]);

    const only = await read("content-only", padding);
    expect(`${padding} content only: content`, only.content, {
      top: p,
      padding: [p, p, p, p],
    });

    const pair = await read("content-footer", padding);
    expect(`${padding} content and footer: content`, pair.content, {
      top: p,
      padding: [p, p, p, p],
    });
    expect(
      `${padding} content and footer: footer pays no top`,
      pair.footer.padding,
      [0, p, p, p],
    );

    const footer = await read("footer-only", padding);
    expect(`${padding} footer only: footer`, footer.footer, {
      top: p,
      padding: [p, p, p, p],
    });

    const form = await read("form-header-led", padding);
    expect(`${padding} form, header-led: header`, form.header.top, p);
    expect(
      `${padding} form, header-led: content pays no top`,
      form.content.padding,
      [0, p, p, p],
    );

    const none = await read("caller-p-0", padding);
    expect(`${padding} caller p-0: content`, none.content, {
      top: 0,
      padding: [0, 0, 0, 0],
    });
    const own = await read("caller-pt-2", padding);
    expect(`${padding} caller pt-2: content`, own.content, {
      top: 8,
      padding: [8, p, p, p],
    });

    const nested = await read("nested", padding);
    expect(`${padding} nested: outer content`, nested.content, {
      top: p,
      padding: [p, p, p, p],
    });
    expect(
      `${padding} nested: inner header-led content pays no top`,
      nested["inner-content"].padding,
      [0, p, p, p],
    );
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL card padding (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS card padding: ${checked} measurements, default 24 and compact 16 — a header-led card as before, ` +
    "content and footer as the card's first child pay the top, a form-wrapped header-led card and a nested card " +
    "pay nothing twice, and a caller's p-0 and pt-2 win",
);
