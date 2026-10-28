/**
 * Progress's ring (decision 131, GAP-038), on the built package in a real
 * browser (packages/react/tests/integration/progress-ring-host.tsx). Every
 * claim is read from the pixels the engine paints, not from the markup:
 *
 * - Sweep: walking the ring's middle clockwise from 12 o'clock, half a degree
 *   at a time, the arc is one run from 12 o'clock that covers value / max of
 *   the turn, and the rest is track. 0 draws no arc and the maximum a whole
 *   ring. Right to left draws the same ring: a progress ring does not mirror.
 * - Band: at a full ring, along a ray every 5 degrees, the painted band is
 *   the size's stroke (4, 8 or 12) everywhere, and its middle sits on the
 *   circle, at 1x and 2x. A ring of two discs, one inset in the other, was
 *   1.8 to 3.1 px where it meant 2.5 in Chromium (AISearchButton).
 * - Colour: unset, the arc paints the bar's theme 600; each tone (Tag's and
 *   Button's emotions) paints its emotion's text colour, on a background 100
 *   track, each as computed, and every arc is 3:1 or more on the track and
 *   on the page, in light and dark.
 * - Beside: a label placed at the end sits 12 from the dial at the inline
 *   end, right of it left to right and left of it right to left, centred on
 *   it, and still names the bar once.
 * - Name: a progress bar named by its centre label, "11 Levels Added in
 *   total", or by aria-label with the label as its description, its value
 *   "11 of 15", and the label's words nowhere else in the tree (Playwright's
 *   tree in every engine, and Chromium's own).
 * - Label: every line of the label lies inside the ring's hole.
 * - Motion: a new value sweeps; under reduced motion, the media query's or
 *   the config's ([data-kozmos-motion="reduced"]), it does not.
 * - Forced colours: the arc is the system's Highlight and the track its
 *   GrayText, both painted.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-progress-ring.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("progress-ring-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
const failures = [];
const measured = [];
let reads = 0;

const RINGS = { sm: [48, 4], md: [96, 8], lg: [128, 12] };

const parse = (colour) =>
  colour
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
/** A colour as painted over another: the system's Highlight is translucent. */
const over = (colour, below) => {
  const n = colour.match(/[\d.]+/g).map(Number);
  const alpha = n.length > 3 ? n[3] : 1;
  return [0, 1, 2].map((i) => n[i] * alpha + below[i] * (1 - alpha));
};
const luminance = ([r, g, b]) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const distance = (a, b) =>
  Math.max(...[0, 1, 2].map((i) => Math.abs(a[i] - b[i])));

// One page decodes every screenshot, and does the sampling where the pixels
// are, so only the results come back.
const decoder = await browser.newPage();
await decoder.setContent("<!doctype html><title>decode</title>");
const analyse = (png, job) =>
  decoder.evaluate(
    async ({ data, job }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const {
        data: px,
        width,
        height,
      } = context.getImageData(0, 0, image.width, image.height);
      const at = (x, y) => {
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        return [px[i], px[i + 1], px[i + 2]];
      };
      // Bilinear, so a band's edge is read to a fraction of a pixel.
      const smooth = (x, y) => {
        const x0 = Math.min(Math.max(Math.floor(x - 0.5), 0), width - 2);
        const y0 = Math.min(Math.max(Math.floor(y - 0.5), 0), height - 2);
        const fx = Math.min(Math.max(x - 0.5 - x0, 0), 1);
        const fy = Math.min(Math.max(y - 0.5 - y0, 0), 1);
        const a = at(x0, y0);
        const b = at(x0 + 1, y0);
        const c = at(x0, y0 + 1);
        const d = at(x0 + 1, y0 + 1);
        return [0, 1, 2].map(
          (k) =>
            a[k] * (1 - fx) * (1 - fy) +
            b[k] * fx * (1 - fy) +
            c[k] * (1 - fx) * fy +
            d[k] * fx * fy,
        );
      };
      const { cx, cy, scale } = job;
      // Clockwise from 12 o'clock, on the screen.
      const point = (degrees, r) => {
        const t = (degrees * Math.PI) / 180;
        return [cx + r * Math.sin(t), cy - r * Math.cos(t)];
      };
      if (job.kind === "pixels") return job.points.map(([x, y]) => at(x, y));
      if (job.kind === "sweep") {
        const near = (c, ref) =>
          Math.hypot(c[0] - ref[0], c[1] - ref[1], c[2] - ref[2]);
        const arc = [];
        for (let degrees = 0; degrees < 360; degrees += 0.5) {
          const colour = at(...point(degrees, job.radius * scale));
          arc.push(near(colour, job.arc) < near(colour, job.track));
        }
        return arc;
      }
      // kind "band": the painted band along each ray, as coverage of the
      // arc's colour over the surface's, integrated outwards.
      const { surface, ink } = job;
      const span = [0, 1, 2].map((k) => ink[k] - surface[k]);
      const norm = span.reduce((s, v) => s + v * v, 0);
      const rays = [];
      for (let degrees = 0; degrees < 360; degrees += 5) {
        let band = 0;
        let first = null;
        let last = null;
        const step = 0.05;
        for (
          let r = (job.inner - 3) * scale;
          r <= (job.outer + 3) * scale;
          r += step
        ) {
          const colour = smooth(...point(degrees, r));
          const cover = Math.min(
            Math.max(
              [0, 1, 2].reduce(
                (s, k) => s + (colour[k] - surface[k]) * span[k],
                0,
              ) / norm,
              0,
            ),
            1,
          );
          band += cover * step;
          if (cover >= 0.5) {
            if (first === null) first = r;
            last = r;
          }
        }
        rays.push({
          degrees,
          band: band / scale,
          middle: first === null ? null : (first + last) / 2 / scale,
        });
      }
      return rays;
    },
    { data: png.toString("base64"), job },
  );

async function open({ scale = 1, forced = "none", reduced, ...mount }) {
  const page = await browser.newPage({
    viewport: { width: 400, height: 260 },
    deviceScaleFactor: scale,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({
    forcedColors: forced,
    reducedMotion: reduced ?? "no-preference",
    colorScheme: mount.theme,
  });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Progress ring</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.evaluate((options) => window.progressRing.mount(options), mount);
  await settleLayout(page);
  return { page, errors };
}

/** The ring's box, its circles' computed strokes, and the page behind it. */
const read = (page) =>
  page.evaluate(() => {
    const ring = document.getElementById("ring");
    const [track, arc] = ring.querySelectorAll("circle");
    // The dial: the ring's own box, whatever a label beside it adds.
    const box = ring
      .querySelector(".kozmos-progress-ring-dial")
      .getBoundingClientRect();
    const label = ring.querySelector(".kozmos-progress-ring-label");
    // Inside the ring's own surface: a system colour resolves by the
    // colour scheme where it is used, and the provider sets the scheme.
    const probe = document.createElement("div");
    probe.style.cssText =
      "forced-color-adjust:none;color:Highlight;background:GrayText";
    document.getElementById("surface").append(probe);
    const system = {
      highlight: getComputedStyle(probe).color,
      grayText: getComputedStyle(probe).backgroundColor,
    };
    probe.remove();
    return {
      box: box.toJSON(),
      root: ring.getBoundingClientRect().toJSON(),
      label: label ? label.getBoundingClientRect().toJSON() : null,
      svg: ring.querySelector("svg").getBoundingClientRect().toJSON(),
      track: getComputedStyle(track).stroke,
      arc: arc ? getComputedStyle(arc).stroke : null,
      arcTransition: arc ? getComputedStyle(arc).transitionDuration : null,
      surface: getComputedStyle(document.getElementById("surface"))
        .backgroundColor,
      system,
    };
  });

async function scenario(name, run) {
  const problems = [];
  try {
    await run(problems);
  } catch (error) {
    problems.push(String(error.stack ?? error.message ?? error));
  }
  if (problems.length) {
    failures.push(...problems.map((p) => `${name}: ${p}`));
    console.error(`FAIL ${name}\n  ${problems.join("\n  ")}`);
  } else console.log(`PASS ${name}`);
}

/** The ring's sweep, read from the screenshot, in degrees clockwise from 12. */
async function sweep(page, state, size, scale) {
  const [diameter, stroke] = RINGS[size];
  const shot = await page.screenshot();
  const cx = (state.box.left + state.box.width / 2) * scale;
  const cy = (state.box.top + state.box.height / 2) * scale;
  const arc = await analyse(shot, {
    kind: "sweep",
    cx,
    cy,
    scale,
    radius: (diameter - stroke) / 2,
    // As painted: the track over the page, the arc over the track.
    arc: over(state.arc, over(state.track, parse(state.surface))),
    track: over(state.track, parse(state.surface)),
  });
  reads += arc.length;
  const degrees = arc.map((_, i) => i / 2);
  const on = degrees.filter((_, i) => arc[i]);
  // The run from 12 o'clock: how far it reaches before the first track.
  const firstTrack = arc.indexOf(false);
  const run = firstTrack === -1 ? 360 : firstTrack / 2;
  const stray = on.filter((d) => d >= run);
  return { total: on.length / 2, run, stray, starts: arc[0] };
}

const SWEEPS = [
  [0, 100],
  [25, 100],
  [11, 15],
  [50, 100],
  [75, 100],
  [99, 100],
  [100, 100],
];

for (const dir of ["ltr", "rtl"])
  await scenario(
    `${dir}: the arc runs clockwise from 12 o'clock for value / max of the turn, at 1x and 2x`,
    async (problems) => {
      for (const scale of [1, 2])
        for (const [value, max] of SWEEPS) {
          const { page, errors } = await open({
            theme: "light",
            dir,
            size: "lg",
            value,
            max,
            scale,
          });
          const state = await read(page);
          const expected = (value / max) * 360;
          const got = await sweep(page, state, "lg", scale);
          const where = `${dir} ${scale}x ${value}/${max}`;
          measured.push(
            `${where}: ${got.total}° drawn, a run of ${got.run}° from 12 o'clock (expected ${expected.toFixed(1)}°)`,
          );
          if (Math.abs(got.total - expected) > 2)
            problems.push(
              `${where}: ${got.total}° of arc, not ${expected.toFixed(1)}°`,
            );
          if (Math.abs(got.run - expected) > 2)
            problems.push(
              `${where}: the arc runs ${got.run}° clockwise from 12 o'clock, not ${expected.toFixed(1)}°`,
            );
          if (got.stray.length > 2)
            problems.push(
              `${where}: arc drawn outside its run, at ${got.stray.slice(0, 6).join("°, ")}° (counter-clockwise or mirrored)`,
            );
          if (errors.length) problems.push(`${where}: ${errors.join("; ")}`);
          await page.close();
        }
    },
  );

await scenario(
  "the band is the size's stroke all the way round, centred on the circle, at 1x and 2x",
  async (problems) => {
    for (const size of ["sm", "md", "lg"])
      for (const scale of [1, 2]) {
        const [diameter, stroke] = RINGS[size];
        const { page } = await open({
          theme: "light",
          size,
          value: 100,
          scale,
        });
        const state = await read(page);
        const where = `${size} ${scale}x`;
        if (
          Math.abs(state.box.width - diameter) > 0.01 ||
          Math.abs(state.box.height - diameter) > 0.01 ||
          Math.abs(state.svg.width - diameter) > 0.01
        )
          problems.push(
            `${where}: the ring is ${state.box.width} by ${state.box.height} (its drawing ${state.svg.width}), not ${diameter}`,
          );
        const radius = (diameter - stroke) / 2;
        const rays = await analyse(await page.screenshot(), {
          kind: "band",
          cx: (state.box.left + state.box.width / 2) * scale,
          cy: (state.box.top + state.box.height / 2) * scale,
          scale,
          inner: radius - stroke / 2,
          outer: radius + stroke / 2,
          surface: parse(state.surface),
          ink: parse(state.arc),
        });
        reads += rays.length;
        const bands = rays.map((ray) => ray.band);
        const middles = rays.map((ray) => ray.middle ?? NaN);
        const min = Math.min(...bands);
        const max = Math.max(...bands);
        const off = Math.max(...middles.map((m) => Math.abs(m - radius)));
        measured.push(
          `${where}: band ${min.toFixed(2)}–${max.toFixed(2)} px (stroke ${stroke}), middle within ${off.toFixed(2)} px of r ${radius}`,
        );
        if (min < stroke - 0.5 || max > stroke + 0.5)
          problems.push(
            `${where}: the band is ${min.toFixed(2)}–${max.toFixed(2)} px, not ${stroke}`,
          );
        if (max - min > 0.5)
          problems.push(
            `${where}: the band varies by ${(max - min).toFixed(2)} px round the ring`,
          );
        if (!(off <= 0.5))
          problems.push(
            `${where}: the band's middle is up to ${off.toFixed(2)} px off the circle`,
          );
        await page.close();
      }
  },
);

const TONES = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
];

for (const theme of ["light", "dark"])
  await scenario(
    `${theme}: each tone's arc is its emotion's text colour on the background 100 track, as computed and drawn, 3:1 on both`,
    async (problems) => {
      for (const tone of [undefined, ...TONES]) {
        const { page } = await open({ theme, size: "lg", value: 25, tone });
        const state = await read(page);
        const named = tone ?? "themed";
        const tokens = await page.evaluate((named) => {
          const style = getComputedStyle(document.getElementById("ring"));
          return {
            fill: style
              .getPropertyValue(`--semantics-emotion-${named}-text`)
              .trim(),
            bar: style.getPropertyValue("--primitives-colors-theme-600").trim(),
            track: style
              .getPropertyValue("--primitives-colors-background-100")
              .trim(),
          };
        }, named);
        const hex = (c) =>
          `#${parse(c)
            .map((v) => Math.round(v).toString(16).padStart(2, "0"))
            .join("")}`;
        const where = `${tone ?? "no tone"}`;
        if (hex(state.arc) !== tokens.fill.toLowerCase())
          problems.push(
            `${where}: the arc is ${state.arc}, not ${named}'s text ${tokens.fill}`,
          );
        // Owner, 28 Oct: unset, the ring's arc is the bar's fill.
        if (!tone && hex(state.arc) !== tokens.bar.toLowerCase())
          problems.push(
            `${where}: the arc is ${state.arc}, not the bar's theme 600 ${tokens.bar}`,
          );
        if (hex(state.track) !== tokens.track.toLowerCase())
          problems.push(
            `${where}: the track is ${state.track}, not background 100 ${tokens.track}`,
          );
        const [diameter, stroke] = RINGS.lg;
        const r = (diameter - stroke) / 2;
        const cx = state.box.left + diameter / 2;
        const cy = state.box.top + diameter / 2;
        // 45° is on the arc, 225° on the track.
        const [onArc, onTrack] = await analyse(await page.screenshot(), {
          kind: "pixels",
          cx,
          cy,
          scale: 1,
          points: [
            [cx + r * Math.SQRT1_2, cy - r * Math.SQRT1_2],
            [cx - r * Math.SQRT1_2, cy + r * Math.SQRT1_2],
          ],
        });
        reads += 2;
        if (distance(onArc, parse(state.arc)) > 6)
          problems.push(
            `${where}: the arc paints rgb(${onArc}), not ${state.arc}`,
          );
        if (distance(onTrack, parse(state.track)) > 6)
          problems.push(
            `${where}: the track paints rgb(${onTrack}), not ${state.track}`,
          );
        const onTrackRatio = contrast(parse(state.arc), parse(state.track));
        const onPageRatio = contrast(parse(state.arc), parse(state.surface));
        if (tone !== undefined)
          measured.push(
            `${theme} ${named}: arc ${state.arc} on track ${state.track} ${onTrackRatio.toFixed(2)}:1, on the page ${onPageRatio.toFixed(2)}:1`,
          );
        if (onTrackRatio < 3)
          problems.push(
            `${where}: the arc reads ${onTrackRatio.toFixed(2)}:1 on the track`,
          );
        if (onPageRatio < 3)
          problems.push(
            `${where}: the arc reads ${onPageRatio.toFixed(2)}:1 on the page`,
          );
        await page.close();
      }
    },
  );

for (const dir of ["ltr", "rtl"])
  await scenario(
    `${dir}: a label placed at the end sits beside the ring at the inline end, centred on it, named once, and the ring still runs clockwise`,
    async (problems) => {
      const { page, errors } = await open({
        theme: "light",
        dir,
        size: "lg",
        value: 2,
        max: 6,
        label: "beside",
        labelPlacement: "end",
      });
      const state = await read(page);
      reads += 1;
      const dial = state.box;
      const label = state.label;
      if (!label) {
        problems.push("no label is drawn");
        await page.close();
        return;
      }
      const gap =
        dir === "ltr" ? label.left - dial.right : dial.left - label.right;
      measured.push(
        `${dir} end label: ${gap.toFixed(2)} px from the dial, its middle ${(label.top + label.height / 2 - (dial.top + dial.height / 2)).toFixed(2)} px off the dial's`,
      );
      if (Math.abs(gap - 12) > 0.5)
        problems.push(
          `the label is ${gap.toFixed(2)} px ${dir === "ltr" ? "right" : "left"} of the dial, not 12 at the inline end`,
        );
      if (
        Math.abs(label.top + label.height / 2 - (dial.top + dial.height / 2)) >
        1
      )
        problems.push("the label is not centred on the dial");
      if (Math.abs(dial.width - 128) > 0.01)
        problems.push(`the dial is ${dial.width} wide, not 128`);
      const name = "2 Levels Added in total";
      const bar = page.getByRole("progressbar", { name, exact: true });
      if ((await bar.count()) !== 1)
        problems.push(`no progress bar is named "${name}"`);
      const snapshot = await page.locator("#surface").ariaSnapshot();
      reads += 1;
      if (
        snapshot
          .split("\n")
          .some(
            (line) =>
              line.includes("Added in total") && !line.includes("progressbar"),
          )
      )
        problems.push(`the label is said twice: ${snapshot}`);
      if (engine === "chromium") {
        const tree = await chromiumTree(page);
        reads += 1;
        if (tree.name !== name)
          problems.push(`Chromium names it "${tree.name}"`);
        const repeated = tree.texts.filter((t) => /Levels|Added/.test(t));
        if (repeated.length)
          problems.push(
            `Chromium also reads ${JSON.stringify(repeated)} as text`,
          );
      }
      const got = await sweep(page, state, "lg", 1);
      if (Math.abs(got.run - 120) > 2 || got.stray.length > 2)
        problems.push(`the arc runs ${got.run}° from 12 o'clock, not 120°`);
      if (errors.length) problems.push(errors.join("; "));
      await page.close();
    },
  );

/** Chromium's own tree: the progress bar, and any text outside it. */
async function chromiumTree(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const live = nodes.filter((node) => !node.ignored);
  const bar = live.find((node) => node.role?.value === "progressbar");
  const texts = live
    .filter((node) => ["StaticText", "text"].includes(node.role?.value))
    .map((node) => node.name?.value ?? "");
  const property = (name) =>
    bar?.properties?.find((p) => p.name === name)?.value?.value;
  return {
    name: bar?.name?.value,
    description: bar?.description?.value,
    valuetext: property("valuetext") ?? bar?.value?.value,
    texts,
  };
}

for (const dir of ["ltr", "rtl"])
  await scenario(
    `${dir}: a progress bar named or described by its centre label, said once, with its value`,
    async (problems) => {
      for (const [ariaLabel, name, description] of [
        [undefined, "11 Levels Added in total", undefined],
        ["Levels", "Levels", "11 Levels Added in total"],
      ]) {
        const { page, errors } = await open({
          theme: "light",
          dir,
          size: "lg",
          value: 11,
          max: 15,
          label: "levels",
          ariaLabel,
          countLabel: true,
        });
        const where = `${dir}, ${ariaLabel ? "aria-label" : "label alone"}`;
        const bar = page.getByRole("progressbar", { name, exact: true });
        reads += 1;
        if ((await bar.count()) !== 1) {
          problems.push(`${where}: no progress bar is named "${name}"`);
          await page.close();
          continue;
        }
        const values = await bar.evaluate((node) => ({
          now: node.getAttribute("aria-valuenow"),
          max: node.getAttribute("aria-valuemax"),
          text: node.getAttribute("aria-valuetext"),
        }));
        if (
          values.now !== "11" ||
          values.max !== "15" ||
          values.text !== "11 of 15"
        )
          problems.push(`${where}: its value is ${JSON.stringify(values)}`);
        // The whole surface, as Playwright's tree has it: the label's words
        // are the bar's, and nowhere else.
        const snapshot = await page.locator("#surface").ariaSnapshot();
        reads += 1;
        const lines = snapshot.split("\n");
        if (!lines.some((line) => line.includes(`progressbar "${name}"`)))
          problems.push(`${where}: the tree reads ${snapshot}`);
        if (
          lines.some(
            (line) =>
              line.includes("Levels Added in total") &&
              !line.includes("progressbar"),
          )
        )
          problems.push(`${where}: the label is said twice: ${snapshot}`);
        if (engine === "chromium") {
          const tree = await chromiumTree(page);
          reads += 1;
          if (tree.name !== name)
            problems.push(`${where}: Chromium names it "${tree.name}"`);
          if (description && tree.description !== description)
            problems.push(
              `${where}: Chromium describes it "${tree.description}", not "${description}"`,
            );
          if (tree.valuetext !== "11 of 15")
            problems.push(`${where}: Chromium's value is "${tree.valuetext}"`);
          const repeated = tree.texts.filter((t) =>
            /Levels Added|^11$/.test(t),
          );
          if (repeated.length)
            problems.push(
              `${where}: Chromium also reads ${JSON.stringify(repeated)} as text`,
            );
          measured.push(
            `chromium ${where}: name "${tree.name}", description "${tree.description ?? ""}", value "${tree.valuetext}"`,
          );
        }
        if (errors.length) problems.push(`${where}: ${errors.join("; ")}`);
        await page.close();
      }
    },
  );

await scenario(
  "every line of the Level Manager's label lies inside the ring's hole",
  async (problems) => {
    for (const dir of ["ltr", "rtl"]) {
      const { page } = await open({
        theme: "light",
        dir,
        size: "lg",
        value: 11,
        max: 15,
        label: "levels",
      });
      const [diameter, stroke] = RINGS.lg;
      // The boxes of the words themselves, line by line: a paragraph's own
      // box is as wide as the label and is not drawn.
      const lines = await page.evaluate(() => {
        const label = document.querySelector(".kozmos-progress-ring-label");
        const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
        const boxes = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          boxes.push(...[...range.getClientRects()].map((r) => r.toJSON()));
        }
        return boxes;
      });
      const state = await read(page);
      const cx = state.box.left + diameter / 2;
      const cy = state.box.top + diameter / 2;
      const hole = diameter / 2 - stroke;
      reads += 1;
      if (!lines.length) problems.push(`${dir}: the label draws no line`);
      let farthest = 0;
      for (const line of lines)
        for (const [x, y] of [
          [line.left, line.top],
          [line.right, line.top],
          [line.left, line.bottom],
          [line.right, line.bottom],
        ])
          farthest = Math.max(farthest, Math.hypot(x - cx, y - cy));
      measured.push(
        `${dir}: ${lines.length} label boxes, the farthest corner ${farthest.toFixed(1)} px from the centre (hole ${hole})`,
      );
      if (farthest > hole)
        problems.push(
          `${dir}: a label corner is ${farthest.toFixed(1)} px from the centre, outside the hole (${hole})`,
        );
      await page.close();
    }
  },
);

await scenario(
  "a new value sweeps; under reduced motion, the media query's or the config's, it does not",
  async (problems) => {
    for (const [name, options] of [
      ["with motion", {}],
      ["under prefers-reduced-motion", { reduced: "reduce" }],
      ['inside [data-kozmos-motion="reduced"]', { configReduced: true }],
    ]) {
      const { page } = await open({
        theme: "light",
        size: "lg",
        value: 25,
        ...options,
      });
      const before = await read(page);
      // The dash an instant after the value moves to 75: on its way while
      // it sweeps, already there when it does not.
      const dash = await page.evaluate(() => {
        window.progressRing.update(75);
        const arc = document.querySelector(".kozmos-progress-ring-arc");
        return {
          now: parseFloat(getComputedStyle(arc).strokeDasharray),
          target: parseFloat(arc.getAttribute("stroke-dasharray")),
        };
      });
      reads += 2;
      const moving = before.arcTransition
        .split(",")
        .some((t) => parseFloat(t) > 0);
      const sweeping = Math.abs(dash.now - dash.target) > 1;
      const expected = name === "with motion";
      if (moving !== expected)
        problems.push(
          `${name}: the arc ${moving ? "transitions" : "does not transition"} (${before.arcTransition})`,
        );
      if (sweeping !== expected)
        problems.push(
          `${name}: the dash is ${dash.now.toFixed(1)} on its way to ${dash.target.toFixed(1)}`,
        );
      await page.close();
    }
  },
);

await scenario(
  "forced colours: the arc is Highlight and the track GrayText, both painted",
  async (problems) => {
    for (const theme of ["light", "dark"]) {
      const { page } = await open({
        theme,
        size: "lg",
        value: 25,
        forced: "active",
      });
      const state = await read(page);
      reads += 1;
      if (state.arc !== state.system.highlight)
        problems.push(
          `${theme}: the arc is ${state.arc}, not Highlight (${state.system.highlight})`,
        );
      if (state.track !== state.system.grayText)
        problems.push(
          `${theme}: the track is ${state.track}, not GrayText (${state.system.grayText})`,
        );
      const got = await sweep(page, state, "lg", 1);
      if (Math.abs(got.run - 90) > 2)
        problems.push(`${theme}: the arc runs ${got.run}°, not 90°`);
      await page.close();
    }
  },
);

await browser.close();
for (const line of measured) console.log(`  measured  ${line}`);
if (failures.length) {
  console.error(
    `\nFAIL progress ring: ${failures.length} problem(s) in ${reads} reads`,
  );
  process.exit(1);
}
console.log(
  `\nPASS progress ring (${engine}): ${reads} reads; the arc runs clockwise from 12 o'clock for value / max of the turn, left to right and right to left, at 1x and 2x; the band is the stroke all the way round and centred, at 48, 96 and 128; unset, the arc is the bar's theme 600, and each of the six tones its emotion's text colour, on background 100, 3:1 or more on the track and the page, light and dark; a label at the end sits 12 from the dial at the inline end, centred, named once; the bar is named or described by its centre label once, with its value; the label fits the hole; reduced motion stills the sweep; forced colours paint Highlight on GrayText`,
);
