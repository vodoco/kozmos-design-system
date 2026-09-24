// Real distributed Input/Textarea CSS, not a CSSScopeRule feature-presence check.
// This is an investigative release gate: pinned WebKit 26.0 currently fails it.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css: builtCss } = await buildReactFixture("forms-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const stylesheet = require("postcss").parse(builtCss);
if (process.env.KOZMOS_TEST_WITHOUT_SCOPE === "1") {
  stylesheet.walkAtRules("scope", (rule) => rule.remove());
  console.log("Testing with all native @scope rules removed");
}
const css = stylesheet.toString();
const browser = await launchFixtureBrowser();
const failures = [];
const check = async (name, test) => {
  try {
    await test();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}: ${error.message}`);
  }
};
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    colorScheme: "light",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(`<!doctype html><html><head><style>
    html { font-size:16px; }
    input, textarea { border-radius:3px; border:3px solid purple; background:orange; }
  </style></head><body><input id="host-input" aria-label="Host input"><textarea id="host-textarea" aria-label="Host textarea"></textarea><div id="fixture"></div></body></html>`);
  const styles = (locator) =>
    locator.evaluate((node) => {
      const s = getComputedStyle(node);
      return {
        background: s.backgroundColor,
        radius: s.borderRadius,
        border: s.borderTopWidth,
        height: s.height,
        padding: s.paddingLeft,
        display: s.display,
        controlRadius: s.getPropertyValue("--semantics-radius-control").trim(),
        direction: s.direction,
      };
    });
  const hostBefore = await Promise.all([
    styles(page.locator("#host-input")),
    styles(page.locator("#host-textarea")),
  ]);
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("outer-input").waitFor();
  await settleLayout(page);
  console.log(
    JSON.stringify(
      await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        cssScopeRule: typeof CSSScopeRule !== "undefined",
      })),
    ),
  );
  await check("unrelated host form controls retain their styles", async () => {
    assert.deepEqual(
      await Promise.all([
        styles(page.locator("#host-input")),
        styles(page.locator("#host-textarea")),
      ]),
      hostBefore,
    );
  });
  const checkFields = async (id) => {
    const surface = await page
      .getByTestId(`${id}-surface`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.notEqual(
      surface,
      "rgba(0, 0, 0, 0)",
      "reference tokens must resolve without @scope",
    );
    for (const kind of ["input", "textarea"]) {
      await check(
        `${id} ${kind} uses actual scoped background, radius, border and sizing`,
        async () => {
          const actual = await styles(page.getByTestId(`${id}-${kind}`));
          console.log(`${id}-${kind}: ${JSON.stringify(actual)}`);
          assert.equal(
            actual.background,
            surface,
            "component background differs from its theme surface",
          );
          assert.equal(
            actual.radius,
            `${Number(actual.controlRadius)}px`,
            "semantic control radius did not apply",
          );
          assert.equal(actual.border, "1px");
          assert.equal(actual.padding, "12px");
          assert.equal(actual.display, "flex");
          if (kind === "input") assert.equal(actual.height, "44px");
          else assert.ok(parseFloat(actual.height) >= 80);
        },
      );
    }
  };
  for (const id of ["outer", "nested-light", "sibling-light"])
    await checkFields(id);
  await page.getByRole("button", { name: "Open form", exact: true }).click();
  await page.getByTestId("portal-input").waitFor();
  await settleLayout(page);
  await checkFields("portal");
  await check("owned form portal is contained and editable", async () => {
    assert.equal(
      await page
        .getByTestId("portal-input")
        .evaluate((node) => node.closest("[data-kozmos-portal]") !== null),
      true,
    );
    await page.getByLabel("portal name", { exact: true }).fill("Pointr");
    assert.equal(await page.getByTestId("portal-input").inputValue(), "Pointr");
    await page.getByLabel("portal notes", { exact: true }).fill("Notes");
    assert.equal(
      await page.getByTestId("portal-textarea").inputValue(),
      "Notes",
    );
  });
  await page.keyboard.press("Escape");
  await page.getByTestId("portal-input").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Toggle outer theme", exact: true })
    .click();
  await settleLayout(page);
  await checkFields("outer");
  await check("no client-side errors", async () =>
    assert.deepEqual(errors, []),
  );
  console.log(
    `${failures.length ? "BLOCKED" : "PASS"}: ${browser.browserType().name()} ${browser.version()}; ${failures.length} failing compatibility checks`,
  );
} finally {
  await browser.close();
}
if (failures.length) process.exitCode = 1;
