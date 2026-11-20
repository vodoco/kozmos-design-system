/**
 * OTPInput's typing in a real browser, on the built package
 * (packages/react/tests/integration/otp-input-host.tsx), GAP-239: a digit
 * typed into a filled cell replaces its digit, whether the cell was clicked,
 * reached by the field moving the focus on, or holds a caret the user moved;
 * so overtyping a full code replaces every digit.
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

const { code, css } = await buildReactFixture("otp-input-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];

async function scenario(name, mount, run) {
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>OTPInput</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.otpInput.mount(mount), mount);
    await settleLayout(page);
    await run(page);
    assert.deepEqual(errors, [], "no page errors or warnings");
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

const cell = (page, n) => page.getByLabel(`Digit ${n} of 6`);
const cells = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("input")]
      .map((input) => input.value)
      .join(""),
  );
const focused = (page) =>
  page.evaluate(() => document.activeElement?.getAttribute("aria-label"));

for (const controlled of [false, true]) {
  const how = controlled ? "controlled" : "uncontrolled";
  const mount = controlled
    ? { props: {}, controlled: "123456" }
    : { props: { defaultValue: "123456" } };

  await scenario(
    `a clicked filled cell takes the digit typed and moves on (${how})`,
    mount,
    async (page) => {
      await cell(page, 3).click();
      await page.keyboard.type("9");
      assert.equal(await cells(page), "129456", "the third digit replaced");
      assert.equal(await focused(page), "Digit 4 of 6", "the focus moves on");
      assert.deepEqual(await page.evaluate(() => window.otpInput.changes), [
        "129456",
      ]);
    },
  );

  await scenario(
    `overtyping a full code replaces every digit (${how})`,
    mount,
    async (page) => {
      await cell(page, 1).click();
      await page.keyboard.type("987654");
      assert.equal(
        await cells(page),
        "987654",
        `every digit replaced: ${JSON.stringify(await page.evaluate(() => window.otpInput.changes))}`,
      );
      assert.equal(
        (await page.evaluate(() => window.otpInput.changes)).at(-1),
        "987654",
      );
    },
  );

  await scenario(
    `a filled cell with its caret after the digit takes the digit typed (${how})`,
    mount,
    async (page) => {
      await cell(page, 2).click();
      await page.keyboard.press("End");
      await page.keyboard.type("7");
      assert.equal(await cells(page), "173456", "the second digit replaced");
      assert.equal(await focused(page), "Digit 3 of 6");
    },
  );

  await scenario(
    `a click selects a filled cell's digit, as Tab does (${how})`,
    mount,
    async (page) => {
      await cell(page, 4).click();
      assert.deepEqual(
        await page.evaluate(() => [
          document.activeElement.selectionStart,
          document.activeElement.selectionEnd,
        ]),
        [0, 1],
      );
    },
  );

  // A touch keyboard names no key: its digit arrives as text, over the
  // selected digit, so the same digit typed over itself changes nothing.
  // Chromium's insertText is that input event; WebKit's and Firefox's in
  // Playwright are not (an empty insertText, a composition), so it runs in
  // Chromium only.
  if (browser.browserType().name() === "chromium")
    await scenario(
      `a touch keyboard's digits overtype, the same digit moving on too (${how})`,
      mount,
      async (page) => {
        await cell(page, 1).click();
        for (const digit of "927") await page.keyboard.insertText(digit);
        assert.equal(await cells(page), "927456", "the first three replaced");
        assert.equal(await focused(page), "Digit 4 of 6", "the focus moved on");
      },
    );
}

await scenario(
  "a read-only code takes no key",
  { props: { defaultValue: "123456", readOnly: true } },
  async (page) => {
    await cell(page, 3).click();
    await page.keyboard.type("9");
    assert.equal(await cells(page), "123456");
    assert.deepEqual(await page.evaluate(() => window.otpInput.changes), []);
  },
);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} OTPInput scenario(s) failed.`);
  process.exit(1);
}
console.log("\nOTPInput: every scenario passed.");
