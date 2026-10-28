/**
 * AdaptiveMapShell's status slot and top corners (GAP-123, SDK-UI-002,
 * decision 119), measured in the built package.
 *
 * The status sits between the bottom corners, level with them, and the
 * credits give way to it, sitting directly above it. The top corners sit under
 * the top bar at the logical start and end, clear of the panel, and the legacy
 * `controls` column moves below a top corner in its way. Nothing the shell
 * places may overlap anything else it places, in either direction, at a phone
 * (sheet) and a tablet (side panel) width, at the touch and the compact
 * density. The slots are reported in the layout snapshot; the status never
 * moves the camera, and the top corners pad it only with `controlsPadCamera`.
 * A floor list opened in the bottom-end corner stays clear of the top corners
 * and the status.
 *
 * Every read is soft: a failure is recorded and the next read runs, so a run
 * against a build without the slots names each read that fails, and the run
 * exits 1 if any did.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   node scripts/check-shell-slots.mjs                # Chromium
 *   ADAPTIVE_BROWSER=webkit node scripts/check-shell-slots.mjs
 *   ADAPTIVE_BROWSER=firefox node scripts/check-shell-slots.mjs
 */
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const STATUS = "Calculating step-free route";
// The top corners' region, found whether or not it is drawn.
const TOP_REGION = '[role="region"][aria-label="Map top corner controls"]';
const reads = new Map();
/** Records one read: its name, whether it held, and what was seen if not. */
function read(name, held, detail) {
  const entry = reads.get(name) ?? { pass: 0, fail: 0, first: undefined };
  if (typeof held === "function") {
    // What is absent reads as a failure, not as an exception.
    try {
      held = held();
    } catch {
      held = false;
    }
  }
  if (held) entry.pass++;
  else {
    entry.fail++;
    entry.first ??= detail;
  }
  reads.set(name, entry);
}
const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;
const overlaps = (a, b) =>
  a.x < b.x + b.width - 0.5 &&
  b.x < a.x + a.width - 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  b.y < a.y + a.height - 0.5;
const right = (r) => r.x + r.width;
const bottom = (r) => r.y + r.height;
const centre = (r) => r.x + r.width / 2;

/** Every box the shell places, in page pixels; null for what is absent or not drawn. */
function measure() {
  const visible = (node) => {
    if (!node) return false;
    for (let n = node; n; n = n.parentElement) {
      const style = getComputedStyle(n);
      if (style.display === "none" || style.visibility === "hidden")
        return false;
      // The status slot's way of keeping a status announced but not drawn.
      if (n.hasAttribute("data-kozmos-map-status") && style.clipPath !== "none")
        return false;
    }
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const box = (node) => {
    if (!visible(node)) return null;
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const button = (name) =>
    [...document.querySelectorAll("button")].find((b) =>
      (b.getAttribute("aria-label") ?? b.textContent ?? "").startsWith(name),
    );
  const region = (name) =>
    document.querySelector(
      `[role="region"][aria-label="${name}"], section[aria-label="${name}"]`,
    );
  const slot = document.querySelector("[data-kozmos-map-status]");
  // The pill is its own live region, drawn or not.
  const pill =
    slot?.querySelector('[role="status"]') ??
    document.querySelector(".kozmos-map-status-pill");
  const shell = document.querySelector('[data-testid="shell"]');
  return {
    shell: box(shell),
    map: box(document.querySelector('section[aria-label="Map"]')),
    search: box(button("Search")),
    exit: box(button("Exit Main Mall")),
    info: box(button("Info")),
    legacy: box(button("Legacy control")),
    stepFree: box(button("Step-free")),
    floors: box(
      document.querySelector('[role="group"][aria-label="Floor selector"]'),
    ),
    zoom: box(document.querySelector(".kozmos-map-controls-group")),
    status: box(pill),
    statusInTree: Boolean(
      pill?.getAttribute("role") === "status" &&
      pill.closest("[data-kozmos-map-status]") &&
      !pill.closest("[aria-hidden='true'], [hidden]") &&
      getComputedStyle(pill).visibility !== "hidden",
    ),
    statusSlot: slot ? { height: slot.getBoundingClientRect().height } : null,
    attribution: box(region("Map attribution")),
    panel: box(document.querySelector('[data-slot="map-shell-panel"]')),
    topRegion: box(region("Map top corner controls")),
    popup: box(document.querySelector('[role="dialog"]')),
    dir: shell ? getComputedStyle(shell).direction : null,
  };
}

const fixture = await buildReactFixture("shell-slots.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<!doctype html><div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  const render = async (config) => {
    await page.evaluate((c) => window.renderShellSlots(c), config);
    await page.getByRole("button", { name: "Map surface" }).waitFor();
    await settleLayout(page);
    await page.waitForFunction(
      () =>
        !document.querySelector('[data-slot="map-shell-panel"][data-settling]'),
    );
    await settleLayout(page);
    return {
      boxes: await page.evaluate(measure),
      layout: await page.evaluate(() => window.shellLayout),
    };
  };

  // ---------------------------------------------------------------- layouts
  const hosts = [
    { name: "phone sheet", width: 390, height: 844, panel: true },
    { name: "phone, no panel", width: 390, height: 844 },
    { name: "tablet side panel", width: 1024, height: 700, panel: true },
    {
      name: "tablet side panel at start",
      width: 1024,
      height: 700,
      panel: true,
      panelPlacement: "start",
    },
    {
      name: "phone sheet, legacy controls",
      width: 390,
      height: 844,
      panel: true,
      legacy: true,
    },
    {
      name: "tablet, legacy controls",
      width: 1024,
      height: 700,
      panel: true,
      legacy: true,
    },
    { name: "phone, no top bar", width: 390, height: 844, topBar: false },
    {
      name: "narrow phone, wrapped top corners",
      width: 340,
      height: 760,
      wideTopEnd: true,
    },
  ];
  const geometry = new Map();
  for (const host of hosts)
    for (const dir of ["ltr", "rtl"])
      for (const density of ["touch", "compact"]) {
        const config = { ...host, dir, density, status: STATUS };
        const label = `${host.name}, ${dir}, ${density}`;
        const { boxes: b, layout } = await render(config);
        const side = Boolean(host.panel) && b.panel && host.width >= 720;
        const panelOnLeft =
          side &&
          ((host.panelPlacement ?? "end") === "end") === (dir === "rtl");
        const leftEdge =
          side && panelOnLeft ? right(b.panel) + 16 : b.map?.x + 16;
        const rightEdge =
          side && !panelOnLeft ? b.panel.x - 16 : right(b.map ?? b.shell) - 16;
        const rtl = dir === "rtl";

        read(
          "the top corners region holds Exit and Info",
          () => Boolean(b.topRegion && b.exit && b.info),
          { label, b },
        );
        const wrapped = Boolean(host.wideTopEnd);
        read(
          "the top-start corner sits at the inline start, 16 from the edge or the panel",
          () =>
            rtl ? near(right(b.exit), rightEdge) : near(b.exit.x, leftEdge),
          { label, exit: b.exit, leftEdge, rightEdge },
        );
        read(
          "the top-end corner sits at the inline end, or under the start corner when both do not fit",
          () =>
            (rtl ? near(b.info.x, leftEdge) : near(right(b.info), rightEdge)) &&
            (wrapped
              ? near(b.info.y, bottom(b.exit) + 16)
              : near(b.info.y, b.exit.y)),
          { label, info: b.info, exit: b.exit, leftEdge, rightEdge },
        );
        read(
          "the top corners sit 16 under the top bar, or 16 from the map's top",
          () => near(b.exit.y, b.search ? bottom(b.search) + 16 : b.map.y + 16),
          { label, exit: b.exit, search: b.search, map: b.map },
        );
        if (host.legacy)
          read(
            "legacy controls start 16 below the top corners",
            () =>
              near(b.legacy.y, Math.max(bottom(b.exit), bottom(b.info)) + 16),
            { label, legacy: b.legacy, exit: b.exit, info: b.info },
          );
        read(
          "the status is centred on the full map",
          () => near(centre(b.status), centre(b.map)),
          { label, status: b.status, map: b.map },
        );
        read(
          "the status sits level with the bottom corners",
          () =>
            near(bottom(b.status), bottom(b.stepFree)) &&
            near(bottom(b.status), bottom(b.zoom)),
          { label, status: b.status, stepFree: b.stepFree, zoom: b.zoom },
        );
        read(
          "the credits sit directly above the status, centred",
          () =>
            near(bottom(b.attribution) + 16, b.status.y) &&
            near(centre(b.attribution), centre(b.map)),
          { label, attribution: b.attribution, status: b.status },
        );

        const placed = Object.entries({
          search: b.search,
          exit: b.exit,
          info: b.info,
          legacy: b.legacy,
          status: b.status,
          attribution: b.attribution,
          stepFree: b.stepFree,
          floors: b.floors,
          zoom: b.zoom,
          panel: b.panel,
        }).filter(([, r]) => r);
        const clashes = [];
        for (let i = 0; i < placed.length; i++)
          for (let j = i + 1; j < placed.length; j++)
            if (overlaps(placed[i][1], placed[j][1]))
              clashes.push(`${placed[i][0]} × ${placed[j][0]}`);
        read(
          "nothing the shell places overlaps anything else, the new slots included",
          b.status && b.exit && b.info && clashes.length === 0,
          { label, clashes },
        );
        read(
          "the new slots stay inside the map",
          [b.status, b.exit, b.info].every(
            (r) =>
              r &&
              r.x >= b.map.x - 0.5 &&
              r.y >= b.map.y - 0.5 &&
              right(r) <= right(b.map) + 0.5 &&
              bottom(r) <= bottom(b.map) + 0.5,
          ),
          { label, b },
        );

        // The snapshot reports what was drawn, in shell-local pixels.
        const local = (r) =>
          r && {
            x: r.x - b.shell.x,
            y: r.y - b.shell.y,
            w: r.width,
            h: r.height,
          };
        const status = layout?.occlusions.find((o) => o.kind === "status");
        const pill = local(b.status);
        read(
          "the snapshot reports the status's slot, which holds the drawn pill",
          () =>
            near(status.bounds.y, pill.y) &&
            near(status.bounds.height, pill.h) &&
            status.bounds.x <= pill.x + 0.5 &&
            pill.x + pill.w <= status.bounds.x + status.bounds.width + 0.5,
          { label, status, drawn: pill },
        );
        const exit = local(b.exit);
        const info = local(b.info);
        read(
          "the snapshot reports the top corners' region, which holds both",
          () =>
            layout.occlusions.some(
              ({ kind, bounds: o }) =>
                kind === "controls" &&
                near(o.y, Math.min(exit.y, info.y)) &&
                near(
                  o.y + o.height,
                  Math.max(exit.y + exit.h, info.y + info.h),
                ) &&
                [exit, info].every(
                  (r) => o.x <= r.x + 0.5 && r.x + r.w <= o.x + o.width + 0.5,
                ),
            ),
          { label, controls: layout?.occlusions, exit, info },
        );
        geometry.set(`${host.name}, ${dir}, ${density}`, b);
      }

  // Decision 89: the shell's chrome keeps the touch geometry under compact.
  for (const host of hosts)
    for (const dir of ["ltr", "rtl"]) {
      const touch = geometry.get(`${host.name}, ${dir}, touch`);
      const compact = geometry.get(`${host.name}, ${dir}, compact`);
      read(
        "the new slots are placed the same at the touch and the compact density",
        touch.status &&
          ["status", "exit", "info", "attribution"].every(
            (key) =>
              touch[key] &&
              compact[key] &&
              near(touch[key].x, compact[key].x) &&
              near(touch[key].y, compact[key].y) &&
              near(touch[key].width, compact[key].width) &&
              near(touch[key].height, compact[key].height),
          ),
        {
          host: host.name,
          dir,
          differs: Object.keys(touch).filter(
            (key) =>
              JSON.stringify(touch[key]) !== JSON.stringify(compact[key]),
          ),
          touch: touch.status,
          compact: compact.status,
        },
      );
    }

  // ---------------------------------------------------------------- the camera
  for (const dir of ["ltr", "rtl"]) {
    const base = {
      dir,
      density: "touch",
      width: 390,
      height: 844,
      panel: true,
    };
    const without = (await render(base)).layout;
    const shown = await render({ ...base, status: STATUS });
    read(
      "a status shown leaves the camera's insets as they were",
      shown.layout.occlusions.some((o) => o.kind === "status") &&
        JSON.stringify(shown.layout.collisionInsets) ===
          JSON.stringify(without.collisionInsets),
      {
        dir,
        with: shown.layout.collisionInsets,
        without: without.collisionInsets,
      },
    );
    const empty = await render({ ...base, status: "" });
    read(
      "an empty status pill keeps its slot, takes no room and leaves the credits at the bottom",
      empty.boxes.statusSlot &&
        empty.boxes.statusSlot.height === 0 &&
        empty.boxes.statusInTree &&
        !empty.layout.occlusions.some((o) => o.kind === "status") &&
        near(bottom(empty.boxes.attribution), bottom(empty.boxes.stepFree)),
      { dir, empty: empty.boxes },
    );
    const unpadded = await render({ ...base, status: STATUS });
    const padded = await render({ ...base, status: STATUS, padCamera: true });
    const map = padded.layout.mapBounds;
    const cornerBottom = Math.max(
      ...padded.layout.occlusions
        .filter((o) => o.kind === "controls" && o.bounds.y < map.height / 2)
        .map((o) => o.bounds.y + o.bounds.height - map.y),
    );
    read(
      "the top corners pad the camera's top only with controlsPadCamera",
      padded.boxes.exit &&
        near(padded.layout.collisionInsets.top, cornerBottom) &&
        unpadded.layout.collisionInsets.top < cornerBottom - 1,
      {
        dir,
        padded: padded.layout.collisionInsets,
        unpadded: unpadded.layout.collisionInsets,
        cornerBottom,
      },
    );
  }

  // ------------------------------------------------- no middle slot, no room
  for (const dir of ["ltr", "rtl"]) {
    const { boxes: b } = await render({
      dir,
      density: "touch",
      width: 360,
      height: 760,
      wideStart: true,
      status: STATUS,
    });
    read(
      "with no middle slot the status rises above the corners, and the credits above it",
      b.status &&
        near(bottom(b.status) + 16, Math.min(b.stepFree.y, b.floors.y)) &&
        near(centre(b.status), centre(b.map)) &&
        b.attribution &&
        near(bottom(b.attribution) + 16, b.status.y),
      {
        dir,
        status: b.status,
        stepFree: b.stepFree,
        floors: b.floors,
        attribution: b.attribution,
      },
    );
    const full = await render({
      dir,
      density: "touch",
      width: 390,
      height: 600,
      panel: true,
      detent: { fraction: 0.8 },
      status: STATUS,
    });
    const f = full.boxes;
    read(
      "with no room above the sheet the status is not drawn, still announces, and pads nothing",
      f.statusSlot &&
        !f.status &&
        f.statusInTree &&
        !full.layout.occlusions.some((o) => o.kind === "status"),
      { dir, f },
    );
    read(
      "with no room above the sheet the top corners leave, and leave no empty landmark",
      (await page
        .getByRole("region", { name: "Map top corner controls", exact: true })
        .count()) === 0 &&
        (await page.locator(TOP_REGION).count()) === 1 &&
        !f.exit,
      { dir, f },
    );
  }

  // ------------------------------------------------------ the floor popup
  for (const dir of ["ltr", "rtl"]) {
    await render({
      dir,
      density: "touch",
      width: 390,
      height: 844,
      floors: 14,
      status: STATUS,
    });
    await page
      .getByRole("group", { name: "Floor selector" })
      .getByRole("button")
      .first()
      .click();
    await page.getByRole("dialog", { name: "Floor selector" }).waitFor();
    await settleLayout(page);
    const b = await page.evaluate(measure);
    read(
      "an opened floor list stays clear of the top corners and the status",
      b.popup &&
        b.exit &&
        b.info &&
        b.status &&
        !overlaps(b.popup, b.exit) &&
        !overlaps(b.popup, b.info) &&
        !overlaps(b.popup, b.status),
      { dir, popup: b.popup, exit: b.exit, info: b.info, status: b.status },
    );
    await page.keyboard.press("Escape");
  }

  // ---------------------------------------------- landmarks, state, presses
  await render({
    dir: "ltr",
    density: "touch",
    width: 390,
    height: 844,
    panel: true,
    legacy: true,
    status: STATUS,
  });
  const regions = await new AxeBuilder({ page })
    .withRules(["region"])
    .analyze();
  read(
    "axe's region rule passes with every map slot filled",
    (await page
      .getByRole("region", { name: "Map top corner controls", exact: true })
      .getByRole("button", { name: "Exit Main Mall" })
      .count()) === 1 && regions.violations.length === 0,
    regions.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
  );
  const exits = await page.evaluate(() => window.exits);
  await page
    .getByRole("button", { name: "Exit Main Mall" })
    .click({
      timeout: 2000,
    })
    .catch(() => undefined);
  read(
    "a press on the top-start corner reaches its control, not the map",
    (await page.evaluate(() => window.exits)) === exits + 1,
    { exits },
  );
  const notifications = await page.evaluate(() => window.shellNotifications);
  await settleLayout(page);
  read(
    "a settled layout with every slot filled does not loop",
    (await page.evaluate(() => window.shellNotifications)) === notifications &&
      (await page.locator(TOP_REGION).count()) === 1,
    { notifications },
  );
  if (errors.length) {
    console.log(`FAIL page errors: ${JSON.stringify(errors)}`);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}

let failed = 0;
for (const [name, { pass, fail, first }] of reads) {
  if (fail) {
    failed++;
    console.log(`FAIL ${name} (${fail} failed, ${pass} passed)`);
    console.log(`     first: ${JSON.stringify(first)}`.slice(0, 1200));
  } else console.log(`PASS ${name} (${pass})`);
}
console.log(
  failed
    ? `\n${failed} of ${reads.size} shell slot reads failed`
    : `\nAll ${reads.size} shell slot reads passed`,
);
if (failed) process.exitCode = 1;
