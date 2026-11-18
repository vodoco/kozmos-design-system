/**
 * An option's media (decision 215) is the Avatar's sm, 24 (decision 221), so
 * a row with a logo keeps the list's row height: in a real browser, on the
 * built package (packages/react/tests/integration/option-media-host.tsx),
 * in Listbox, Combobox and MultiSelect, a one-line row with media is as tall
 * as one without (44), and a two-line row with media as one without.
 *
 * Run with ADAPTIVE_BROWSER=firefox or webkit for the other engines, as CI
 * does in test:react-interactions.
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("option-media-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];

async function scenario(name, run) {
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Option media</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await settleLayout(page);
    await run(page);
    assert.deepEqual(errors, [], "no page errors");
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

/** Each option's height and its media's size, in the list `list` names. */
const rows = (page, list) =>
  page.locator(list).evaluate((node) =>
    Object.fromEntries(
      [...node.querySelectorAll('[role="option"]')].map((option) => {
        const media = option.querySelector(".kozmos-option-media");
        const box = media?.getBoundingClientRect();
        return [
          option.querySelector(".kozmos-option-label").textContent,
          {
            height:
              Math.round(option.getBoundingClientRect().height * 100) / 100,
            media: box ? [box.width, box.height] : null,
          },
        ];
      }),
    ),
  );

function heldToTheRowHeight(drawn) {
  assert.deepEqual(drawn.Plain.media, null);
  assert.equal(drawn.Plain.height, 44, "a plain row is 44");
  for (const label of ["Acme Airport", "Pointr Cloud"]) {
    assert.equal(
      drawn[label].height,
      drawn.Plain.height,
      `${label}, with media, is as tall as a row without`,
    );
    assert.deepEqual(drawn[label].media, [24, 24], `${label}'s Avatar is 24`);
  }
  assert.equal(
    drawn.Both.height,
    drawn.Described.height,
    "a two-line row with media is as tall as one without",
  );
}

await scenario("Listbox: a row with media keeps the row height", async (page) =>
  heldToTheRowHeight(
    await rows(page, '[role="listbox"][aria-label="Clients"]'),
  ),
);

for (const [part, name] of [
  ["combobox", "Client"],
  ["multiselect", "Clients"],
]) {
  await scenario(
    `${part}: a row with media keeps the row height`,
    async (page) => {
      await page.getByTestId(part).getByRole("combobox", { name }).click();
      const list = page.locator('[role="listbox"]').last();
      await list.waitFor();
      await settleLayout(page);
      const id = await list.getAttribute("id");
      heldToTheRowHeight(await rows(page, `[id="${id}"]`));
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} option media scenario(s) failed.`);
  process.exit(1);
}
console.log("\nOption media: every scenario passed.");
