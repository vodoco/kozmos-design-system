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
const siteRequire = createRequire(
  path.join(process.cwd(), "apps/site/package.json"),
);
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
  {
    name: "an html dir=ltr page",
    html: 'dir="ltr" lang="en"',
    wrap: "",
    rtl: false,
  },
  {
    name: "an html dir=rtl page in English",
    html: 'dir="rtl" lang="en"',
    wrap: "",
    rtl: true,
  },
  {
    name: "a dir=rtl box on an English page",
    html: 'lang="en"',
    wrap: 'dir="rtl"',
    rtl: true,
  },
  {
    name: "a dir=ltr box in a right-to-left page",
    html: 'dir="rtl" lang="ar"',
    wrap: 'dir="ltr"',
    rtl: false,
  },
  {
    name: "an Arabic page laid out left to right",
    html: 'dir="ltr" lang="ar"',
    wrap: "",
    rtl: false,
  },
  {
    name: "an English dir=rtl box on an Arabic page",
    html: 'lang="ar"',
    wrap: 'dir="rtl" lang="en"',
    rtl: true,
  },
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

/** A linear gradient's angle in degrees, 0 to 359, or NaN without one. */
const gradientAngle = (image) => {
  const run = image.match(
    /linear-gradient\((to (?:left|right)|-?[\d.]+deg)/,
  )?.[1];
  const angle =
    run === "to right"
      ? 90
      : run === "to left"
        ? 270
        : Number(run?.slice(0, -3));
  return ((angle % 360) + 360) % 360;
};

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
      const angle = gradientAngle(drawn.gradient);
      assert.ok(Number.isFinite(angle), `${where}: the gradient has no angle`);
      assert.equal(
        angle,
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
        near(
          drawn.start.right,
          30,
          "the start corner is not 30 from the right",
        );
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
  await page.setContent(
    '<!doctype html><html lang="en"><body><div id="root"></div></body></html>',
  );
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
  // Switch: the thumb sits at the inline start when off and slides to the
  // inline end when on, inside the track, in both directions.
  for (const dir of ["ltr", "rtl"])
    for (const on of [true, false]) {
      const name = `Switch ${on ? "on" : "off"} ${dir}`;
      const thumb = await page
        .getByRole("switch", { name })
        .evaluate((track) => {
          const outer = track.getBoundingClientRect();
          const box = track.firstElementChild.getBoundingClientRect();
          return {
            left: box.left - outer.left,
            right: outer.right - box.right,
          };
        });
      const where = `${name}: ${JSON.stringify(thumb)}`;
      assert.ok(
        thumb.left >= -0.5 && thumb.right >= -0.5,
        `${where}: the thumb leaves the track`,
      );
      const atEnd = (on ? dir === "rtl" : dir === "ltr") ? "left" : "right";
      assert.ok(
        thumb[atEnd] < 3,
        `${where}: the thumb is not at the inline ${on ? "end" : "start"} (${atEnd})`,
      );
      checked += 1;
    }
  // SplitButton: the halves meet square at the inline end of the main one
  // and the inline start of the menu one, its divider on the meeting edge.
  for (const dir of ["ltr", "rtl"]) {
    const halves = await page
      .getByTestId(`split-${dir}`)
      .locator("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const style = getComputedStyle(button);
          return {
            left:
              parseFloat(style.borderTopLeftRadius) +
              parseFloat(style.borderBottomLeftRadius),
            right:
              parseFloat(style.borderTopRightRadius) +
              parseFloat(style.borderBottomRightRadius),
            borderLeft: parseFloat(style.borderLeftWidth),
            borderRight: parseFloat(style.borderRightWidth),
          };
        }),
      );
    const [main, menu] = halves;
    const where = `SplitButton ${dir}: ${JSON.stringify(halves)}`;
    const [meet, outside] =
      dir === "rtl" ? ["left", "right"] : ["right", "left"];
    assert.ok(
      main[meet] === 0 && main[outside] > 0,
      `${where}: the main half is not square at its inline end only`,
    );
    assert.ok(
      menu[outside] === 0 && menu[meet] > 0,
      `${where}: the menu half is not square at its inline start only`,
    );
    const divider = meet === "right" ? "borderRight" : "borderLeft";
    const other = meet === "right" ? "borderLeft" : "borderRight";
    assert.ok(
      main[divider] > main[other],
      `${where}: the divider is not on the main half's inline end`,
    );
    checked += 1;
  }
  // Search: the magnifier sits 12 in from the inline start and the text
  // clears it there, 36 in; the inline end keeps the field's own 12. A
  // physical left-3 / pl-9 put both at the inline end of a right-to-left
  // field, and WebKit's native search field never took pl-9 at all, so in
  // Safari the text ran under the icon.
  for (const dir of ["ltr", "rtl"]) {
    const field = await page
      .getByRole("searchbox", { name: `Search ${dir}` })
      .evaluate((input) => {
        const box = input.getBoundingClientRect();
        const icon = input.parentElement
          .querySelector("svg")
          .getBoundingClientRect();
        const style = getComputedStyle(input);
        return {
          iconLeft: icon.left - box.left,
          iconRight: box.right - icon.right,
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
        };
      });
    const where = `Search ${dir}: ${JSON.stringify(field)}`;
    const [start, end] = dir === "rtl" ? ["Right", "Left"] : ["Left", "Right"];
    assert.ok(
      Math.abs(field[`icon${start}`] - 12) < 0.5,
      `${where}: the icon is not 12 from the inline start (${start.toLowerCase()})`,
    );
    assert.equal(
      field[`padding${start}`],
      36,
      `${where}: the text does not clear the icon at the inline start`,
    );
    assert.equal(
      field[`padding${end}`],
      12,
      `${where}: the inline end lost the field's own padding`,
    );
    checked += 1;
  }
  // ColorPicker: the swatch sits 8 in from the inline start and the open
  // button 4 in from the inline end, each inside the 48 the text keeps at
  // that end. A physical left-2 / right-1 put both at the wrong end of a
  // right-to-left field: the swatch over the end of the text, the button
  // over its start, where the text begins.
  for (const dir of ["ltr", "rtl"]) {
    const picker = await page
      .getByRole("textbox", { name: `Colour ${dir}`, exact: true })
      .evaluate((input) => {
        const box = input.getBoundingClientRect();
        const swatch = input.parentElement
          .querySelector('input[type="color"]')
          .getBoundingClientRect();
        const open = input.parentElement
          .querySelector("button[aria-controls]")
          .getBoundingClientRect();
        const style = getComputedStyle(input);
        return {
          swatchLeft: swatch.left - box.left,
          swatchRight: box.right - swatch.right,
          swatchWidth: swatch.width,
          openLeft: open.left - box.left,
          openRight: box.right - open.right,
          openWidth: open.width,
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
        };
      });
    const where = `ColorPicker ${dir}: ${JSON.stringify(picker)}`;
    const [start, end] = dir === "rtl" ? ["Right", "Left"] : ["Left", "Right"];
    assert.ok(
      Math.abs(picker[`swatch${start}`] - 8) < 0.5,
      `${where}: the swatch is not 8 from the inline start (${start.toLowerCase()})`,
    );
    assert.ok(
      picker[`swatch${start}`] + picker.swatchWidth <=
        picker[`padding${start}`] + 0.5,
      `${where}: the swatch reaches past the room the text keeps at the inline start`,
    );
    assert.ok(
      Math.abs(picker[`open${end}`] - 4) < 0.5,
      `${where}: the open button is not 4 from the inline end (${end.toLowerCase()})`,
    );
    assert.ok(
      picker[`open${end}`] + picker.openWidth <= picker[`padding${end}`] + 0.5,
      `${where}: the open button reaches past the room the text keeps at the inline end`,
    );
    // The panel's hue and opacity sliders are native ranges, which run from
    // the inline start: right to left, the lowest value is at the right. Each
    // gradient must run the same way. Drawn "to right", the opacity slider
    // showed clear under a thumb that said opaque, and the hue under the
    // thumb was not the hue it set.
    for (const name of ["Hue", "Opacity"]) {
      const range = await page
        .locator(`[data-direction="${dir}"]`)
        .getByRole("slider", { name, exact: true })
        .evaluate((input) => {
          const style = getComputedStyle(input);
          return { direction: style.direction, image: style.backgroundImage };
        });
      const there = `ColorPicker ${dir}, ${name}: ${JSON.stringify(range)}`;
      assert.equal(
        range.direction,
        dir,
        `${there}: the range does not read ${dir}`,
      );
      assert.equal(
        gradientAngle(range.image),
        dir === "rtl" ? 270 : 90,
        `${there}: the gradient does not run from the inline start, as the range does`,
      );
    }
    checked += 1;
  }
  // Toast: the close sits 8 from the inline end, the toast keeps 32 there
  // for it and 24 at the start, and its words and action are 16 apart. A
  // physical pr-8 / right-2 put the close and its room at the inline start
  // of a right-to-left toast, and space-x-4's left margin put the space
  // outside the action, which touched the words.
  await page.getByTestId("toast-rtl").waitFor();
  for (const dir of ["ltr", "rtl"]) {
    const toast = await page.getByTestId(`toast-${dir}`).evaluate((root) => {
      const box = root.getBoundingClientRect();
      const close = root
        .querySelector("button[toast-close]")
        .getBoundingClientRect();
      const text = root
        .querySelector('[data-part="toast-text"]')
        .getBoundingClientRect();
      const action = [...root.querySelectorAll("button")]
        .find((button) => button.textContent === "Undo")
        .getBoundingClientRect();
      const style = getComputedStyle(root);
      // From the padding edge, which `end-2` is measured from, inside the
      // toast's 1px border.
      return {
        closeLeft: close.left - box.left - parseFloat(style.borderLeftWidth),
        closeRight:
          box.right - parseFloat(style.borderRightWidth) - close.right,
        paddingLeft: parseFloat(style.paddingLeft),
        paddingRight: parseFloat(style.paddingRight),
        // Along the reading direction: from the words to the action.
        between:
          getComputedStyle(root).direction === "rtl"
            ? text.left - action.right
            : action.left - text.right,
      };
    });
    const where = `Toast ${dir}: ${JSON.stringify(toast)}`;
    const [start, end] = dir === "rtl" ? ["Right", "Left"] : ["Left", "Right"];
    assert.ok(
      Math.abs(toast[`close${end}`] - 8) < 0.5,
      `${where}: the close is not 8 from the inline end (${end.toLowerCase()})`,
    );
    assert.equal(
      toast[`padding${end}`],
      32,
      `${where}: the toast keeps no room for its close at the inline end`,
    );
    assert.equal(
      toast[`padding${start}`],
      24,
      `${where}: the toast's inline start is not its own 24`,
    );
    assert.ok(
      Math.abs(toast.between - 16) < 0.5,
      `${where}: the words and the action are not 16 apart`,
    );
    checked += 1;
  }
  // Tag: the remove mark is drawn 16 and the Tag is no taller for it, but
  // its target is 24 wide and the Tag's whole height, centred on the mark, in
  // both directions; with the spacing a 24 circle round the mark needs, that
  // meets WCAG 2.2's 2.5.8. It was the mark's own 16. The target never
  // reaches past the Tag: at 24 by 24 it stood 1px above and below, so a
  // flush row of Tags that scrolls scrolled a pixel and drew a scrollbar.
  for (const dir of ["ltr", "rtl"]) {
    await page.getByTestId(`tag-${dir}`).scrollIntoViewIfNeeded();
    const tag = await page.getByTestId(`tag-${dir}`).evaluate((root) => {
      const plain = root.parentElement
        .querySelector("[data-testid^='tag-plain']")
        .getBoundingClientRect();
      const box = root.getBoundingClientRect();
      const button = root.querySelector("button");
      const mark = button.getBoundingClientRect();
      const x = mark.left + mark.width / 2;
      const y = mark.top + mark.height / 2;
      const hits = (px, py) => {
        const hit = document.elementFromPoint(px, py);
        return hit === button || button.contains(hit);
      };
      // Just inside each corner and edge of the target: 24 wide, the Tag's
      // height.
      const reach = 11.5;
      const top = box.top + 0.5 - y;
      const bottom = box.bottom - 0.5 - y;
      const probes = [
        [-reach, top],
        [reach, top],
        [-reach, bottom],
        [reach, bottom],
        [-reach, 0],
        [reach, 0],
        [0, top],
        [0, bottom],
      ];
      return {
        mark: { width: mark.width, height: mark.height },
        height: box.height,
        plainHeight: plain.height,
        misses: probes
          .filter(([dx, dy]) => !hits(x + dx, y + dy))
          .map(([dx, dy]) => `${dx},${dy.toFixed(1)}`),
        // A pixel outside the Tag, above and below the mark (half a pixel
        // past an edge still hits in Chromium and WebKit).
        beyond: [box.top - 1, box.bottom + 1].filter((py) => hits(x, py))
          .length,
      };
    });
    const where = `Tag ${dir}: ${JSON.stringify(tag)}`;
    assert.deepEqual(
      tag.mark,
      { width: 16, height: 16 },
      `${where}: the remove mark is not drawn 16`,
    );
    assert.equal(
      tag.height,
      tag.plainHeight,
      `${where}: the remove button makes the Tag taller`,
    );
    assert.deepEqual(
      tag.misses,
      [],
      `${where}: the remove target is not 24 wide and the Tag's height`,
    );
    assert.equal(
      tag.beyond,
      0,
      `${where}: the remove target reaches past the Tag`,
    );
    const row = await page
      .getByTestId(`tag-row-${dir}`)
      .evaluate((element) => ({
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }));
    assert.equal(
      row.scrollHeight,
      row.clientHeight,
      `Tag ${dir}: a flush row of removable Tags scrolls ${row.scrollHeight - row.clientHeight}px up and down`,
    );
    checked += 1;
  }
  await page.close();
} finally {
  await browser.close();
}
console.log(
  `${checked} direction cases passed on ${process.env.ADAPTIVE_BROWSER ?? "chromium"}: mirror, back arrow, gallery arrow, gradient, flow and overlay corners, as built and lowered; Progress's fill; Switch's thumb; SplitButton's corners; Search's icon and padding; ColorPicker's swatch, open button and sliders; Toast's close, padding and gap; Tag's remove target`,
);
