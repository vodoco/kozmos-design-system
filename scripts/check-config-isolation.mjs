import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("config-host.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html data-theme="host"><head><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.getByTestId("right-glass").waitFor();
  const styles = (id) =>
    page.getByTestId(id).evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        blur: style.backdropFilter,
        background: style.backgroundColor,
        noise: style.backgroundImage,
        shadow: style.boxShadow,
        transform: style.transform,
        filter: getComputedStyle(node, "::before").filter,
        spotlight: getComputedStyle(node, "::after").backgroundImage,
        spotlightOpacity: getComputedStyle(node, "::after").opacity,
        x: style.getPropertyValue("--spotlight-x").trim(),
        y: style.getPropertyValue("--spotlight-y").trim(),
      };
    });
  const left = await styles("left-glass");
  const right = await styles("right-glass");
  assert.equal(left.blur, "blur(22px) saturate(1.8)");
  assert.equal(right.blur, "blur(30px) saturate(1.8)");
  assert.equal(
    left.background,
    "rgba(0, 0, 0, 0.7)",
    "dark configuration did not reach the glass surface",
  );
  assert.equal(right.background, "rgba(255, 255, 255, 0.7)");
  // Button's glass variant is the glass role (1f10259): the token's blur and
  // saturation in either module, whatever its configuration, and the
  // theme's tint at the token's opacity (Chromium reads 0.7 back as 0.698).
  const role = (id) =>
    page.getByTestId(id).evaluate((node) => {
      const style = getComputedStyle(node);
      return { blur: style.backdropFilter, background: style.backgroundColor };
    });
  for (const [id, rgb] of [
    ["left-glass-button", "0, 0, 0"],
    ["right-glass-button", "255, 255, 255"],
  ]) {
    const { blur, background } = await role(id);
    assert.equal(
      blur,
      "blur(20px) saturate(1.8)",
      `${id} left the token's blur`,
    );
    assert.match(
      background,
      new RegExp(`^rgba\\(${rgb}, 0\\.(698|7)\\)$`),
      `${id} is not its theme's glass`,
    );
  }
  assert.match(left.noise, /data:image\/svg\+xml/);
  assert.equal(right.noise, "none");
  assert.notEqual(left.filter, right.filter);
  for (const filter of [left.filter, right.filter]) {
    const id = /#([^")]+)/.exec(filter)?.[1];
    assert.ok(id, "computed surface filter has no fragment reference");
    assert.equal(
      await page.evaluate(
        (id) => document.getElementById(id)?.tagName.toLowerCase(),
        id,
      ),
      "filter",
      "surface refers to a missing SVG filter",
    );
  }
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    ),
    "host",
  );
  console.log(
    "PASS independent themed configuration, local noise and filter ownership",
  );

  await page.getByRole("button", { name: "left open", exact: true }).click();
  await page.getByTestId("left-overlay").waitFor();
  await settleLayout(page);
  const overlay = await styles("left-overlay");
  for (const key of ["blur", "background", "noise", "filter", "shadow"])
    assert.equal(overlay[key], left[key], `portal lost ${key}`);
  const existing = await page.getByTestId("left-overlay").elementHandle();
  await page
    .getByRole("button", { name: "left refraction", exact: true })
    .evaluate((node) => node.click());
  await settleLayout(page);
  assert.equal((await styles("left-overlay")).blur, "blur(42px) saturate(1.8)");
  assert.equal(await existing.evaluate((node) => node.isConnected), true);
  assert.equal((await styles("right-glass")).blur, right.blur);
  console.log(
    "PASS live configuration reaches owned overlays without remounts or sibling changes",
  );

  const glass = page.getByTestId("left-overlay");
  const box = await glass.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
  await settleLayout(page);
  const pointer = await styles("left-overlay");
  const dimensions = await glass.evaluate((node) => ({
    width: node.offsetWidth,
    height: node.offsetHeight,
  }));
  assert.ok(Math.abs(parseFloat(pointer.x) - dimensions.width * 0.25) < 2);
  assert.ok(Math.abs(parseFloat(pointer.y) - dimensions.height * 0.25) < 2);
  assert.equal((await styles("right-glass")).x, "50%");
  console.log(
    "PASS portal spotlight uses local surface coordinates, not global pointer state",
  );

  await page
    .getByRole("button", { name: "left simplify", exact: true })
    .evaluate((node) => node.click());
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('[data-testid="left-overlay"]'))
        .backdropFilter === "blur(0px) saturate(1)",
  );
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('[data-testid="left-overlay"]'))
        .boxShadow === "none",
  );
  const simple = await styles("left-overlay");
  assert.equal(simple.noise, "none");
  assert.equal(simple.filter, "none");
  assert.equal(simple.shadow, "none");
  assert.equal(simple.spotlightOpacity, "0");
  assert.equal(simple.transform, "matrix(1, 0, 0, 1, 0, 0)");
  // Reduced transparency reaches the role as well, in its own module only.
  assert.deepEqual(await role("left-glass-button"), {
    blur: "blur(0px) saturate(1.8)",
    background: "rgb(0, 0, 0)",
  });
  assert.equal(
    (await role("right-glass-button")).blur,
    "blur(20px) saturate(1.8)",
  );
  console.log(
    "PASS reduced effects disable noise, texture, bevel and spotlight in portals",
  );
  await page.keyboard.press("Escape");
  await page.getByTestId("left-overlay").waitFor({ state: "hidden" });

  assert.equal(
    await page
      .getByTestId("right-surface")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    "rgb(40, 50, 60)",
  );
  await page.getByRole("button", { name: "Remove declarative tokens" }).click();
  assert.equal(
    await page
      .getByTestId("right-surface")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    "rgb(255, 255, 255)",
  );
  await page
    .getByRole("button", { name: "right override", exact: true })
    .click();
  assert.equal(
    await page
      .getByTestId("right-surface")
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    "rgb(10, 20, 30)",
  );
  const ids = await page
    .locator("filter[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  assert.equal(new Set(ids).size, ids.length);
  await page.getByRole("button", { name: "Unmount modules" }).click();
  assert.equal(
    await page.locator("[data-kozmos-portal], filter[id]").count(),
    0,
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.getAttribute("style")),
    null,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS declarative token removal, compatibility overrides and complete cleanup",
  );
} finally {
  await browser.close();
}
