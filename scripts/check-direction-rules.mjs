// Kozmos's right-to-left rules, in the engine named by ADAPTIVE_BROWSER, read
// from the built stylesheet twice: as shipped, and as a consumer's build
// lowers it for the package's declared browsers. Vite 8's lightningcss
// rewrote `:dir(rtl)` into a list of `:lang()` guesses for those targets, so
// on the Kozmos site a right-to-left page in English mirrored nothing and an
// Arabic page laid out left to right mirrored everything; Chrome and Edge
// before 120 never matched `:dir()` at all. The rules now read the nearest
// dir attribute through --kozmos-rtl, which nothing rewrites.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const reactDir = path.join(process.cwd(), "packages/react");
const built = fs.readFileSync(path.join(reactDir, "dist/style.css"), "utf8");
const { browserslist } = JSON.parse(
  fs.readFileSync(path.join(reactDir, "package.json"), "utf8"),
);
// lightningcss is Vite 8's, so it is found from the site that builds with it.
const siteRequire = createRequire(path.join(process.cwd(), "apps/site/package.json"));
const viteRequire = createRequire(siteRequire.resolve("vite"));
const lightningcss = viteRequire("lightningcss");
const targets = lightningcss.browserslistToTargets(
  viteRequire("browserslist")(browserslist),
);
const lowered = lightningcss
  .transform({ filename: "style.css", code: Buffer.from(built), targets })
  .code.toString();

assert.ok(
  !built.includes(":dir("),
  "the built stylesheet uses :dir(), which Chrome 118 and 119 never match",
);

// Where the parts sit: each case says which way they should read.
const cases = [
  { name: "an html dir=ltr page", html: 'dir="ltr" lang="en"', wrap: "", rtl: false },
  { name: "an html dir=rtl page in English", html: 'dir="rtl" lang="en"', wrap: "", rtl: true },
  { name: "a dir=rtl box on an English page", html: 'lang="en"', wrap: 'dir="rtl"', rtl: true },
  { name: "a dir=ltr box in a right-to-left page", html: 'dir="rtl" lang="ar"', wrap: 'dir="ltr"', rtl: false },
  { name: "an Arabic page laid out left to right", html: 'dir="ltr" lang="ar"', wrap: "", rtl: false },
  { name: "an English dir=rtl box on an Arabic page", html: 'lang="ar"', wrap: 'dir="rtl" lang="en"', rtl: true },
];

const parts = `
  <svg class="kozmos-rtl-mirror" data-part="mirror" width="16" height="16"></svg>
  <svg class="kozmos-route-preview-back-arrow" data-part="back" width="16" height="16"></svg>
  <div class="kozmos-poi-gallery"><span class="kozmos-poi-gallery-arrow" data-part="gallery" style="display:inline-block;width:8px;height:8px"></span></div>
  <div class="kozmos-progress-track" style="width:200px">
    <div class="kozmos-progress-track-active" data-appearance="gradient" data-part="gradient" style="width:100px;height:6px"></div>
    <div class="kozmos-progress-track-flow" data-part="flow" style="width:200px;height:6px"></div>
  </div>
  <div style="position:relative;width:400px;height:120px;--map-overlay-left:10px;--map-overlay-right:30px">
    <div class="kozmos-map-overlay-start" data-part="overlay-start" style="position:absolute;width:20px;height:20px"></div>
    <div class="kozmos-map-overlay-end" data-part="overlay-end" style="position:absolute;width:20px;height:20px"></div>
  </div>`;

const browser = await launchFixtureBrowser();
let checked = 0;
try {
  for (const [mode, css] of [
    ["as built", built],
    ["lowered for the declared browsers", lowered],
  ])
    for (const scenario of cases) {
      const label = `${scenario.name}, ${mode}`;
      const page = await browser.newPage({ reducedMotion: "no-preference" });
      await page.setContent(
        `<!doctype html><html ${scenario.html}><head><style>${css}</style></head>` +
          `<body><div data-kozmos-root><div ${scenario.wrap}>${parts}</div></div></body></html>`,
      );
      await settleLayout(page);
      const drawn = await page.evaluate(() => {
        const part = (name) => document.querySelector(`[data-part="${name}"]`);
        const style = (name) => getComputedStyle(part(name));
        // The flow's direction, from two moments a quarter apart: whether it
        // moves right or left, however the rule writes it.
        const flow = part("flow").getAnimations()[0];
        const flowAt = (time) => {
          flow.currentTime = time;
          return parseFloat(style("flow").backgroundPositionX);
        };
        if (flow) flow.pause();
        const overlay = (name) => {
          const box = part(name).getBoundingClientRect();
          const host = part(name).parentElement.getBoundingClientRect();
          return { left: box.left - host.left, right: host.right - box.right };
        };
        return {
          mirror: style("mirror").transform,
          back: style("back").transform,
          gallery: style("gallery").transform,
          gradient: style("gradient").backgroundImage,
          flow: flow ? Math.sign(flowAt(750) - flowAt(250)) : "no animation",
          start: overlay("overlay-start"),
          end: overlay("overlay-end"),
        };
      });
      const where = `${label}: ${JSON.stringify(drawn)}`;
      const flipped = "matrix(-1, 0, 0, 1, 0, 0)";
      // rotate(180deg), whose sine each engine rounds its own way.
      const turned = (value) => {
        const m = value.match(/^matrix\(([^)]*)\)$/);
        if (!m) return false;
        const [a, b, c, d] = m[1].split(",").map(Number);
        return a === -1 && d === -1 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9;
      };
      for (const name of ["mirror", "back"])
        assert.ok(
          scenario.rtl ? drawn[name] === flipped : drawn[name] !== flipped,
          `${where}: ${name} ${scenario.rtl ? "is not mirrored" : "is mirrored"}`,
        );
      assert.ok(
        scenario.rtl ? turned(drawn.gallery) : !turned(drawn.gallery),
        `${where}: the gallery arrow ${scenario.rtl ? "is not turned" : "is turned"}`,
      );
      const run = drawn.gradient.match(/linear-gradient\((to (?:left|right)|-?[\d.]+deg)/)?.[1];
      const angle =
        run === "to right" ? 90 : run === "to left" ? 270 : Number(run?.slice(0, -3));
      assert.ok(Number.isFinite(angle), `${where}: the gradient has no angle`);
      assert.equal(
        ((angle % 360) + 360) % 360,
        scenario.rtl ? 270 : 90,
        `${where}: the gradient does not run from the inline start`,
      );
      assert.equal(
        drawn.flow,
        scenario.rtl ? -1 : 1,
        `${where}: the flow does not move toward the inline end`,
      );
      // The start corner takes the left inset left to right, the right one
      // right to left; the end corner the other.
      const near = (actual, expected, message) =>
        assert.ok(Math.abs(actual - expected) < 0.5, `${where}: ${message}`);
      if (scenario.rtl) {
        near(drawn.start.right, 30, "the start corner is not 30 from the right");
        near(drawn.end.left, 10, "the end corner is not 10 from the left");
      } else {
        near(drawn.start.left, 10, "the start corner is not 10 from the left");
        near(drawn.end.right, 30, "the end corner is not 30 from the right");
      }
      checked += 1;
      await page.close();
    }
  // The real components, which set a direction through their own markup
  // rather than a rule: Progress fills from the inline start.
  const fixture = await buildReactFixture("direction-host.tsx");
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html lang="en"><body><div id="root"></div></body></html>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  await page.getByRole("progressbar", { name: "Progress rtl" }).waitFor();
  await settleLayout(page);
  for (const dir of ["ltr", "rtl"]) {
    const fill = await page
      .getByRole("progressbar", { name: `Progress ${dir}` })
      .evaluate((bar) => {
        // What shows: the indicator as the track clips it, however it is
        // placed (a width, or a translated full-width bar).
        const track = bar.getBoundingClientRect();
        const box = bar.firstElementChild.getBoundingClientRect();
        const left = Math.max(box.left, track.left);
        const right = Math.min(box.right, track.right);
        return {
          left: left - track.left,
          right: track.right - right,
          share: Math.max(0, right - left) / track.width,
        };
      });
    const where = `Progress ${dir}: ${JSON.stringify(fill)}`;
    assert.ok(Math.abs(fill.share - 0.3) < 0.01, `${where}: not 30% filled`);
    assert.ok(
      Math.abs(dir === "rtl" ? fill.right : fill.left) < 0.5,
      `${where}: does not fill from the inline start`,
    );
    checked += 1;
  }
  await page.close();
} finally {
  await browser.close();
}
console.log(
  `${checked} direction cases passed on ${process.env.ADAPTIVE_BROWSER ?? "chromium"}: mirror, back arrow, gallery arrow, gradient, flow and overlay corners, as built and lowered; Progress's fill`,
);
