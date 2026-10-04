import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
import {
  sanitize,
  storyNameFromExport,
} from "../apps/site/scripts/generate-reference.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = path.resolve("test-results/route-track", engine);
fs.mkdirSync(output, { recursive: true });
const catalogue = JSON.parse(
  fs.readFileSync(
    new URL("./storybook/catalogue.json", import.meta.url),
    "utf8",
  ),
);
const indexResponse = await fetch(`${base}/index.json`);
assert.ok(indexResponse.ok, "Storybook index must load");
const { entries } = await indexResponse.json();
for (const entry of catalogue.entries)
  for (const name of entry.exports) {
    const id = `${entry.id}--${sanitize(storyNameFromExport(name))}`;
    assert.equal(
      entries[id]?.title,
      entry.title,
      `${id}: built catalogue preserves the story`,
    );
  }
const browser = await launchFixtureBrowser();
let count = 0;
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  // The explicit AxeBuilder scan below is awaited for every route frame.
  // Disable only the competing addon auto-run, never our accessibility checks.
  const assertScanOwnership = async () => {
    assert.equal(
      await page.evaluate(
        () =>
          window.__STORYBOOK_PREVIEW__.storyStore.userGlobals.get().a11y.manual,
      ),
      true,
      "The route check owns Axe execution; Storybook's addon must be manual",
    );
  };
  // Independent app preference and system high-contrast policy. The app signal
  // is the scope attribute emitted by DesignConfigProvider, not the OS query.
  await page.goto(
    `${base}/iframe.html?id=map-routeprogressrail--walking-within-leg&viewMode=story&globals=a11y.manual:!true`,
  );
  const policyFlow = page.getByTestId("progress-directional-flow");
  await policyFlow.waitFor();
  await assertScanOwnership();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await policyFlow.evaluate((node) =>
    node.parentElement.setAttribute("data-kozmos-motion", "reduced"),
  );
  const policyFailures = [];
  if (
    (await policyFlow.evaluate(
      (node) => getComputedStyle(node).animationName,
    )) !== "none"
  )
    policyFailures.push(
      "App reduced-motion preference must stop track animation even when the OS allows motion",
    );
  await policyFlow.evaluate((node) =>
    node.parentElement.removeAttribute("data-kozmos-motion"),
  );
  assert.equal(
    await policyFlow.evaluate((node) => getComputedStyle(node).animationName),
    "kozmos-track-flow",
    "Restoring the app preference resumes the cue",
  );
  await page.emulateMedia({ forcedColors: "active" });
  if (
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches)
  ) {
    const contrast = await page
      .locator(".kozmos-progress-track")
      .evaluate((node) => {
        const active = node.querySelector(
          '[data-testid="progress-active-range"]',
        );
        const track = getComputedStyle(node);
        const fill = getComputedStyle(active);
        return {
          track: track.backgroundColor,
          fill: fill.backgroundColor,
          image: fill.backgroundImage,
        };
      });
    if (
      contrast.track === contrast.fill ||
      /^rgba\([^)]*,\s*0\)$/.test(contrast.fill)
    )
      policyFailures.push(
        `Forced colours must distinguish filled distance from remaining track: ${JSON.stringify(contrast)}`,
      );
    console.log(`Forced-colour policy exercised (${engine}).`);
    await page.screenshot({
      path: path.join(output, "forced-colours-live.png"),
    });
  } else {
    console.log(
      `Forced-colour emulation unavailable (${engine}); not counted as verified.`,
    );
  }
  assert.deepEqual(policyFailures, [], "Progress track accessibility policies");
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" });
  for (const theme of ["light", "dark"])
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 720 });
      for (const [story, position, start, end, staticMode = false] of [
        ["active-leg", null, 0, 0.4, true],
        ["walking-within-leg", 0.2, 0, 0.4],
        ["at-transition", 0.4, 0, 0.4],
        ["after-transition", 0.6, 0.4, 1],
        ["route-position-unknown", null, 0, 0.4],
        ["route-right-to-left", 0.2, 0, 0.4],
        ["static-after-transition", null, 0.4, 1, true],
        ["guidance-paused", 0.2, 0, 0.4],
        ["live-start", 0, 0, 0.4],
      ]) {
        await page.goto(
          `${base}/iframe.html?id=map-routeprogressrail--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        const rail = page.locator(".kozmos-route-rail");
        await rail.waitFor();
        await assertScanOwnership();
        await page.waitForFunction(() =>
          document.querySelector('[data-waypoint-id="lift"]'),
        );
        const geometry = await rail.evaluate((node) => {
          const rect = (selector) => {
            const box = node.querySelector(selector)?.getBoundingClientRect();
            return (
              box && {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                right: box.right,
              }
            );
          };
          return {
            axis: rect(".kozmos-route-track-axis"),
            active: rect('[data-testid="progress-active-range"]'),
            dot: rect('[data-testid="route-user-location"]'),
            lift: rect('[data-waypoint-id="lift"]'),
            gradient: node.querySelector(
              '[data-testid="progress-active-range"]',
            )
              ? getComputedStyle(
                  node.querySelector('[data-testid="progress-active-range"]'),
                ).backgroundImage
              : null,
            flow: rect('[data-testid="progress-directional-flow"]'),
            animation: node.querySelector(
              '[data-testid="progress-directional-flow"]',
            )
              ? getComputedStyle(
                  node.querySelector(
                    '[data-testid="progress-directional-flow"]',
                  ),
                ).animationName
              : null,
            direction: getComputedStyle(node).direction,
            now: node.getAttribute("aria-valuenow"),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        const { axis, active, dot, lift } = geometry;
        const fillStart = staticMode ? start : 0;
        const fillEnd = staticMode ? end : position;
        if (fillEnd != null && fillEnd > fillStart) {
          assert.match(
            geometry.gradient,
            /linear-gradient/,
            `${story}: visible gradient, not an unresolved token`,
          );
          assert.ok(
            Math.abs(active.width - axis.width * (fillEnd - fillStart)) <= 1,
            `${story}: static section or cumulative live progress`,
          );
          const expectedX =
            axis.x +
            axis.width *
              (geometry.direction === "rtl" ? 1 - fillEnd : fillStart);
          assert.ok(
            Math.abs(active.x - expectedX) <= 1,
            `${story}: fill starts at the correct route point`,
          );
        } else
          assert.equal(active, undefined, `${story}: no invented live fill`);
        const flowStart = staticMode ? start : position;
        if (
          story !== "guidance-paused" &&
          flowStart != null &&
          flowStart < end
        ) {
          assert.ok(
            Math.abs(geometry.flow.width - axis.width * (end - flowStart)) <= 1,
            `${story}: directional hint only in current section`,
          );
          assert.equal(
            geometry.animation,
            "none",
            `${story}: respects reduced motion`,
          );
        } else
          assert.equal(
            geometry.flow,
            undefined,
            `${story}: unavailable/paused/at-transition has no flow`,
          );
        assert.ok(
          lift.y + lift.height < axis.y,
          `${story}: transition glyph above position dot`,
        );
        assert.equal(geometry.overflow, false, `${story}: no page overflow`);
        if (position === null) {
          assert.equal(dot, undefined);
          assert.equal(geometry.now, null);
        } else {
          const expected =
            axis.x +
            axis.width *
              (geometry.direction === "rtl" ? 1 - position : position);
          assert.ok(
            Math.abs(dot.x + dot.width / 2 - expected) <= 1,
            `${story}: shared dot/line axis`,
          );
          assert.equal(Number(geometry.now), Math.round(position * 100));
        }
        const violations = (
          await new AxeBuilder({ page }).include(".kozmos-route-rail").analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => v.id),
          [],
          `${story}: accessibility`,
        );
        await page.screenshot({
          path: path.join(output, `${story}-${theme}-${width}.png`),
        });
        count++;
      }
    }
  // Phone localisation fixtures use distance snapshots, not instruction counts.
  for (const [story, percentage] of [
    ["phone-english", 30],
    ["phone-german", 24],
    ["phone-japanese", 30],
  ]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${base}/iframe.html?id=examples-navigation--${story}&viewMode=story&globals=a11y.manual:!true`,
    );
    const rail = page.getByRole("progressbar");
    await rail.waitFor();
    assert.equal(
      await rail.getAttribute("aria-valuenow"),
      String(percentage),
      `${story}: distance-based position`,
    );
    assert.equal(
      await page.getByTestId("progress-active-range").count(),
      1,
      `${story}: cumulative distance fill`,
    );
    count++;
  }
  // A scenario control must move the dot without changing the selected leg.
  await page.goto(
    `${base}/iframe.html?id=examples-navigation--directions&viewMode=story&globals=a11y.manual:!true`,
  );
  await page.getByRole("button", { name: "Advance within leg" }).waitFor();
  const active = page.getByTestId("progress-active-range");
  assert.equal(
    await active.count(),
    0,
    "Real zero location paints no travelled distance",
  );
  for (let step = 0; step < 4; step++)
    await page.getByRole("button", { name: "Advance within leg" }).click();
  const before = await active.getAttribute("style");
  assert.equal(
    await page.getByTestId("progress-directional-flow").count(),
    0,
    "No flow beyond unconfirmed transition",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  assert.equal(
    await active.getAttribute("style"),
    before,
    "Transition does not reset cumulative fill",
  );
  await page.getByRole("button", { name: "Advance within leg" }).click();
  assert.notEqual(
    await active.getAttribute("style"),
    before,
    "Next distance update grows from original start",
  );
  await page
    .getByRole("button", { name: "Live position", exact: true })
    .click();
  assert.equal(
    await page.getByTestId("route-user-location").count(),
    0,
    "Static selection never fabricates a dot",
  );
  const flow = page.getByTestId("progress-directional-flow");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  assert.equal(
    await flow.evaluate((el) => getComputedStyle(el).animationName),
    "kozmos-track-flow",
  );
  const phase = await flow.evaluate(
    (el) => getComputedStyle(el).backgroundPositionX,
  );
  await page.waitForTimeout(250);
  assert.notEqual(
    await flow.evaluate((el) => getComputedStyle(el).backgroundPositionX),
    phase,
    "Direction hint actually animates",
  );
  await page
    .getByRole("button", { name: "Directional motion", exact: true })
    .click();
  assert.equal(await flow.count(), 0, "Host can pause motion");
  console.log(
    `Passed ${count} route frames and host-controlled transition interaction (${engine}).`,
  );
} finally {
  await browser.close();
}
