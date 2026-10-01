import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
import { assertFirefoxScopeFloor } from "./lib/firefox-support.mjs";

// Exercise remaining scope-dependent parts, not only the migrated form controls.
// KOZMOS_TEST_WITHOUT_SCOPE=1 is a negative control: it MUST fail this check.
const require = createRequire(
  new URL("../packages/react/package.json", import.meta.url),
);
assertFirefoxScopeFloor(require("./package.json").browserslist);
const { code, css: builtCss } = await buildReactFixture(
  "scoped-utilities-host.tsx",
);
const stylesheet = require("postcss").parse(builtCss);
let scopes = 0;
stylesheet.walkAtRules("scope", (rule) => {
  scopes++;
  if (process.env.KOZMOS_TEST_WITHOUT_SCOPE === "1") rule.remove();
});
assert.ok(
  scopes > 0,
  "Revisit the browser prerequisite when scoped CSS is removed",
);
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => route.abort());
  await page.setContent(
    '<!doctype html><html><head><style>html{font-size:16px}#host{height:33px;background:orange}</style></head><body><div id="host">Host content</div><div id="fixture"></div></body></html>',
  );
  await page.addStyleTag({ content: stylesheet.toString() });
  await page.addScriptTag({ content: code });
  await page.getByTestId("light-badge").waitFor();
  await settleLayout(page);
  const samples = await page.locator("[data-testid]").evaluateAll((nodes) =>
    Object.fromEntries(
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return [
          node.getAttribute("data-testid"),
          {
            height: node.getBoundingClientRect().height,
            display: style.display,
            background: style.backgroundColor,
            padding: style.paddingLeft,
          },
        ];
      }),
    ),
  );
  for (const id of ["dark", "nested-light", "light"]) {
    for (const [component, height] of [
      ["badge", 44],
      ["separator", 1],
      ["button", 44],
      ["input", 44],
    ]) {
      assert.equal(
        samples[`${id}-${component}`].height,
        height,
        `${id}-${component} must retain its intended height`,
      );
    }
    assert.equal(samples[`${id}-badge`].display, "inline-flex");
    assert.equal(samples[`${id}-badge`].padding, "16px");
    for (const component of ["badge", "separator"]) {
      assert.notEqual(
        samples[`${id}-${component}`].background,
        "rgba(0, 0, 0, 0)",
      );
    }
    console.log(
      `PASS ${id}: scoped Badge and Separator plus owned Button and Input geometry`,
    );
  }
  for (const component of ["badge", "separator"]) {
    assert.deepEqual(
      samples[`nested-light-${component}`],
      samples[`light-${component}`],
      "Outer dark scope must not style a nested light provider",
    );
    assert.notEqual(
      samples[`dark-${component}`].background,
      samples[`light-${component}`].background,
    );
  }
  assert.equal(
    await page
      .locator("#host")
      .evaluate((node) => node.getBoundingClientRect().height),
    33,
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS scoped utilities and nested theme boundary: ${browser.browserType().name()} ${browser.version()}`,
  );
} finally {
  await browser.close();
}
