/**
 * Link's `external` (GAP-202, decision 122), on the built package in a real
 * browser (packages/react/tests/integration/link-external-host.tsx).
 *
 * - It opens a new tab: `target="_blank"` with `rel="noopener noreferrer"`,
 *   and a caller's own `target` and `rel` win. A link without `external`
 *   keeps neither and draws no icon.
 * - Its name says so: the link's words, a space, then "opens in a new tab"
 *   (or the product's own words), as the engine lays its text out
 *   (`innerText`, where WebKit runs a hidden span into the word before it)
 *   and as Playwright names it. The words themselves are never drawn.
 * - Its icon is decoration (`aria-hidden`), the text's size (1em) and its
 *   colour, idle and hovered, light and dark, at the link's inline end,
 *   after a gap, pointing to it: mirrored right to left.
 * - The icon never starts a line alone: each paragraph is narrowed a pixel
 *   at a time, from 40 to 400, and at every width the icon's middle is on
 *   the line of the link's last character. Touch and compact alike.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-link-external.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("link-external-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
const expect = (label, ok, detail) => {
  checked++;
  if (!ok) failures.push(`${label}: ${detail}`);
};
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 1400 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Link external</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-case]").first().waitFor();
  await settleLayout(page);

  /** What a case's link is and draws. */
  const read = (name) =>
    page.evaluate((name) => {
      const box = document.querySelector(`[data-case="${name}"]`);
      const link = box.querySelector("a");
      const icon = link.querySelector("svg");
      const text = [...link.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.data.trim(),
      );
      const range = document.createRange();
      range.setStart(text, text.length - 1);
      range.setEnd(text, text.length);
      const last = range.getBoundingClientRect();
      const linkStyle = getComputedStyle(link);
      const iconBox = icon?.getBoundingClientRect();
      const iconStyle = icon && getComputedStyle(icon);
      const label = link.querySelector(".kozmos-link-external-label");
      const labelBox = label?.getBoundingClientRect();
      return {
        target: link.getAttribute("target"),
        rel: link.getAttribute("rel"),
        innerText: link.innerText,
        colour: linkStyle.color,
        fontSize: parseFloat(linkStyle.fontSize),
        hasIcon: Boolean(icon),
        ariaHidden: icon?.getAttribute("aria-hidden") ?? null,
        iconColour: iconStyle?.color ?? null,
        iconStroke: iconStyle?.stroke ?? null,
        iconWidth: iconBox?.width ?? null,
        iconHeight: iconBox?.height ?? null,
        iconLeft: iconBox?.left ?? null,
        iconRight: iconBox?.right ?? null,
        iconMiddle: iconBox ? (iconBox.top + iconBox.bottom) / 2 : null,
        transform: iconStyle?.transform ?? null,
        lastLeft: last.left,
        lastRight: last.right,
        lastTop: last.top,
        lastBottom: last.bottom,
        labelSize: labelBox
          ? [Math.round(labelBox.width), Math.round(labelBox.height)]
          : null,
        labelClip: label ? getComputedStyle(label).clip : null,
      };
    }, name);

  /** The name Playwright gives the case's link, from its own accname. */
  const named = async (name, wanted) =>
    page
      .locator(`[data-case="${name}"]`)
      .getByRole("link", { name: wanted, exact: true })
      .count();

  const words = (text) => text.replace(/\s+/g, " ").trim();
  const near = (a, b) => Math.abs(a - b) <= 0.5;

  for (const [name, link, label, end] of [
    ["light", "Privacy Policy", "opens in a new tab", "right"],
    ["light-subtle", "Privacy Policy", "opens in a new tab", "right"],
    ["dark", "Privacy Policy", "opens in a new tab", "right"],
    ["dark-subtle", "Privacy Policy", "opens in a new tab", "right"],
    ["compact", "Privacy Policy", "opens in a new tab", "right"],
    ["localised", "Privacy Policy", "öffnet in einem neuen Tab", "right"],
    ["large", "Terms of Service", "opens in a new tab", "right"],
    ["rtl", "سياسة الخصوصية", "يفتح في علامة تبويب جديدة", "left"],
  ]) {
    const r = await read(name);
    expect(`${name}: target`, r.target === "_blank", r.target);
    expect(`${name}: rel`, r.rel === "noopener noreferrer", r.rel);
    // The name, then a space, then the announcement, as laid out.
    expect(
      `${name}: innerText`,
      words(r.innerText) === `${link} ${label}`,
      JSON.stringify(r.innerText),
    );
    expect(
      `${name}: Playwright's name`,
      (await named(name, `${link} ${label}`)) === 1,
      `no link named "${link} ${label}"`,
    );
    expect(
      `${name}: the announcement is not drawn`,
      JSON.stringify(r.labelSize) === "[1,1]" && /rect\(0(px)?,/.test(r.labelClip),
      `${JSON.stringify(r.labelSize)} ${r.labelClip}`,
    );
    expect(`${name}: icon`, r.hasIcon, "no icon");
    expect(`${name}: icon hidden`, r.ariaHidden === "true", r.ariaHidden);
    expect(
      `${name}: icon is the text's size`,
      near(r.iconWidth, r.fontSize) && near(r.iconHeight, r.fontSize),
      `${r.iconWidth}×${r.iconHeight}, text ${r.fontSize}`,
    );
    expect(
      `${name}: icon is the text's colour`,
      r.iconColour === r.colour && r.iconStroke === r.colour,
      `colour ${r.iconColour}, stroke ${r.iconStroke}, text ${r.colour}`,
    );
    // At the inline end, after a gap: a no-break space, 2px or more.
    const gap = end === "right" ? r.iconLeft - r.lastRight : r.lastLeft - r.iconRight;
    expect(`${name}: icon at the ${end}, after a gap`, gap >= 2 && gap <= r.fontSize, `gap ${gap}`);
    // Mirrored right to left: a scaleX of -1, and none left to right.
    const mirrored = /^matrix\(-1, 0, 0, 1, 0, 0\)$/.test(r.transform);
    expect(
      `${name}: icon ${end === "left" ? "mirrored" : "unmirrored"}`,
      end === "left" ? mirrored : !mirrored,
      r.transform,
    );
  }

  // Hovered, the subtle link turns the foreground colour, and so does its
  // icon.
  for (const name of ["light-subtle", "dark-subtle"]) {
    const before = await read(name);
    await page.locator(`[data-case="${name}"] a`).hover();
    await settleLayout(page);
    const after = await read(name);
    expect(
      `${name}: hover changes the colour`,
      after.colour !== before.colour,
      `${before.colour} → ${after.colour}`,
    );
    expect(
      `${name}: hovered icon is the text's colour`,
      after.iconStroke === after.colour,
      `stroke ${after.iconStroke}, text ${after.colour}`,
    );
    await page.mouse.move(0, 0);
    await settleLayout(page);
  }

  // A caller's own target and rel win; a plain link opens in this tab.
  const caller = await read("caller");
  expect(
    "caller: own target and rel",
    caller.target === "docs" && caller.rel === "noopener",
    `${caller.target} ${caller.rel}`,
  );
  const plain = await read("same-tab");
  expect(
    "same tab: no target, rel or icon",
    plain.target === null && plain.rel === null && !plain.hasIcon,
    JSON.stringify(plain),
  );
  expect(
    "same tab: named by its words alone",
    (await named("same-tab", "Browse venues")) === 1,
    "no link named Browse venues",
  );

  // Narrowed a pixel at a time, the icon is always on the line of the
  // link's last character.
  for (const name of ["light", "compact", "rtl", "large"]) {
    const alone = [];
    for (let width = 40; width <= 400; width++) {
      await page.evaluate(
        ({ name, width }) => {
          document.querySelector(`[data-case="${name}"]`).style.width =
            `${width}px`;
        },
        { name, width },
      );
      const r = await read(name);
      if (r.iconMiddle < r.lastTop || r.iconMiddle > r.lastBottom)
        alone.push(width);
    }
    expect(
      `${name}: the icon never starts a line alone`,
      alone.length === 0,
      `alone at ${alone.length} widths, from ${alone[0]}`,
    );
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL link external (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS link external: ${checked} reads — a new tab with noopener noreferrer and a caller's own target and rel ` +
    "winning; the name, a space and the announcement, never drawn; the icon hidden, the text's size and colour " +
    "(hovered too), at the inline end and mirrored right to left; and never alone on a line from 40 to 400px, " +
    "touch, compact, large and right to left",
);
