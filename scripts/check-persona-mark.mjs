/**
 * PersonaMark (GAP-106) on the built package in a real browser
 * (packages/react/tests/integration/persona-mark-host.tsx), light and dark.
 *
 * - A checkbox labelled with a persona's mark and name is named by the name
 *   alone; a mark standing alone is an image named by the persona; a group is
 *   one image, "Assigned personas: Customer, Visitor, Staff".
 * - The diamond is 12 by 12 in the persona's colour, as given, in both
 *   themes; a group's marks are 2 apart; a mark sits on its label's middle,
 *   as vertical-align: middle puts it, within 1.5.
 * - In forced colours (where the engine emulates them) the diamond is
 *   CanvasText, so the shape survives the system's colours.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-persona-mark.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("persona-mark-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
let checked = 0;
const expect = (label, ok, detail) => {
  checked++;
  if (!ok) failures.push(`${label}: ${detail}`);
};

async function open(forced) {
  const page = await browser.newPage({ viewport: { width: 600, height: 500 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ forcedColors: forced });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>PersonaMark</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-case]").first().waitFor();
  await settleLayout(page);
  return { page, errors };
}

/** Each mark's diamond: its box, its fill, and its text's middle. */
const shapes = (page, name, part) =>
  page
    .locator(`[data-case="${name}"] [data-part="${part}"] svg`)
    .evaluateAll((nodes) =>
      nodes.map((svg) => {
        const box = svg.getBoundingClientRect();
        const host = svg.closest("[data-part]").parentElement;
        const line = host.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          height: box.height,
          middle: box.top + box.height / 2,
          lineMiddle: line.top + line.height / 2,
          fill: getComputedStyle(svg).fill,
        };
      }),
    );

const ORANGE = "rgb(255, 152, 0)";
const GROUP = ["rgb(255, 152, 0)", "rgb(33, 150, 243)", "rgb(76, 175, 80)"];

try {
  const { page, errors } = await open("none");
  for (const name of ["light", "dark"]) {
    const scope = page.locator(`[data-case="${name}"]`);
    const tree = (await scope.ariaSnapshot()).trim();
    expect(
      `${name}: the checkbox is named by the persona's name alone`,
      /- checkbox "Customer"/.test(tree),
      tree,
    );
    expect(
      `${name}: the group is one image, named by its label and every name`,
      tree.includes('img "Assigned personas: Customer, Visitor, Staff"'),
      tree,
    );
    expect(
      `${name}: a mark standing alone is an image named by the persona`,
      tree.includes('img "Visitor"'),
      tree,
    );
    expect(
      `${name}: nothing else is an image`,
      (tree.match(/\bimg\b/g) || []).length === 2,
      tree,
    );

    const [beside] = await shapes(page, name, "beside");
    expect(
      `${name}: the diamond is 12 by 12 in the persona's colour`,
      beside &&
        Math.abs(beside.width - 12) < 0.01 &&
        Math.abs(beside.height - 12) < 0.01 &&
        beside.fill === ORANGE,
      JSON.stringify(beside),
    );
    // vertical-align: middle centres it on the lower-case letters, a pixel
    // or so under the line box's middle in every engine.
    expect(
      `${name}: the mark sits on its label's middle, within 1.5`,
      beside && Math.abs(beside.middle - beside.lineMiddle) <= 1.5,
      JSON.stringify(beside),
    );
    const group = await shapes(page, name, "group");
    expect(
      `${name}: the group's marks, in order, in their colours`,
      JSON.stringify(group.map((mark) => mark.fill)) === JSON.stringify(GROUP),
      JSON.stringify(group.map((mark) => mark.fill)),
    );
    expect(
      `${name}: the group's marks are 12 and 2 apart`,
      group.length === 3 &&
        group.every(
          (mark) =>
            Math.abs(mark.width - 12) < 0.01 &&
            Math.abs(mark.height - 12) < 0.01,
        ) &&
        group
          .slice(1)
          .every((mark, index) => Math.abs(mark.left - group[index].right - 2) < 0.01),
      JSON.stringify(group),
    );
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
  await page.close();

  if (engine !== "webkit") {
    // Forced colours: the system's colours replace the product's, and the
    // diamond keeps its shape in CanvasText. WebKit emulates no forced
    // colours.
    const forced = await open("active");
    const canvasText = await forced.page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "forced-color-adjust:none;color:CanvasText";
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    const active = await forced.page.evaluate(
      () => matchMedia("(forced-colors: active)").matches,
    );
    if (active) {
      for (const name of ["light", "dark"]) {
        const marks = [
          ...(await shapes(forced.page, name, "beside")),
          ...(await shapes(forced.page, name, "group")),
          ...(await shapes(forced.page, name, "alone")),
        ];
        expect(
          `${name}, forced colours: every diamond is CanvasText (${canvasText})`,
          marks.length === 5 &&
            marks.every(
              (mark) => mark.fill === canvasText && mark.width === 12,
            ),
          JSON.stringify(marks.map((mark) => mark.fill)),
        );
      }
    } else {
      console.log(`${engine} emulates no forced colours: that read is skipped`);
    }
    if (forced.errors.length)
      failures.push(`page errors: ${forced.errors.join("; ")}`);
    await forced.page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL persona-mark (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS persona-mark (${engine}): ${checked} reads — a labelled checkbox named by the persona alone, a mark alone and ` +
    "a group each one image, diamonds 12 by 12 in the persona's colour on their label's middle, a group's 2 apart, " +
    `light and dark${engine === "webkit" ? "" : ", and CanvasText in forced colours"}`,
);
