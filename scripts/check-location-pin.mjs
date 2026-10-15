/**
 * LocationPin draws the SDK's map result markers (decision 71, GAP-120), on
 * the built React package in a real browser: measured against the SVGs the
 * MAP-474 boards export (the zip of 15 Oct; .notes/track2), in a light and a
 * dark root, left to right and right to left, with and without @scope.
 *
 * - A result: a pill 32 tall, at least 32 wide and its number's width plus 16,
 *   a 2 border in theme 600 on background/0 (filled theme 600 under
 *   foreground/1000 when selected), a pointer whose tip is 6 below the pill
 *   and is the anchor. Without a number, an 8 dot.
 * - A featured place: a 44 tile (52 selected) with a 3 rim in foreground/0 on
 *   background/0, corners of 16, its logo inside; a 6 dot 4 below; the dot's
 *   centre is the anchor.
 * - A place on its own: a 40 teardrop in emotional success 800 round a 20
 *   disc in background/0, on a 6 dot whose top is 6 below the circle; the
 *   dot's centre is the anchor.
 * - The md shadow on the body, a 44 target round a pressable marker.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-location-pin.mjs
 */
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("location-pin.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const unscoped = postcss.parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

const browser = await launchFixtureBrowser();
const failures = [];
let reads = 0;
const near = (actual, expected, what, tolerance = 0.75) => {
  reads += 1;
  if (!(Math.abs(actual - expected) <= tolerance))
    failures.push(`${what}: ${actual.toFixed(2)}, expected ${expected}`);
};
const same = (actual, expected, what) => {
  reads += 1;
  if (actual !== expected)
    failures.push(`${what}: ${actual}, expected ${expected}`);
};

try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
    });
    await page.setContent('<!doctype html><div id="fixture"></div>');
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await page.locator("[data-pin]").first().waitFor();
    await settleLayout(page);
    const measured = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const rgb = (value) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].join(",");
      };
      const token = (board, name) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${name})`;
        board.append(probe);
        const value = rgb(getComputedStyle(probe).color);
        probe.remove();
        return value;
      };
      const out = {};
      for (const board of document.querySelectorAll("[data-board]")) {
        const key = board.dataset.board;
        out[key] = {
          tokens: {
            theme600: token(board, "--primitives-colors-theme-600"),
            background0: token(board, "--primitives-colors-background-0"),
            foreground0: token(board, "--primitives-colors-foreground-0"),
            foreground1000: token(board, "--primitives-colors-foreground-1000"),
            success800: token(
              board,
              "--primitives-colors-emotional-success-800",
            ),
          },
          pins: {},
        };
        for (const point of board.querySelectorAll("[data-point]")) {
          const id = point.dataset.point.replace(`${key}-`, "");
          const pin = board.querySelector(
            `[data-pin="${point.dataset.point}"]`,
          );
          const p = point.getBoundingClientRect();
          const box = (selector) => {
            const node = selector ? pin.querySelector(selector) : pin;
            if (!node) return null;
            const r = node.getBoundingClientRect();
            const s = getComputedStyle(node);
            return {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
              bottom: r.bottom,
              right: r.right,
              background: rgb(s.backgroundColor),
              color: rgb(s.color),
              border: parseFloat(s.borderTopWidth),
              borderColor: rgb(s.borderTopColor),
              radius: parseFloat(s.borderTopLeftRadius),
              fill: s.fill && s.fill !== "none" ? rgb(s.fill) : null,
              filter: s.filter,
              boxShadow: s.boxShadow,
            };
          };
          const pinBox = pin.getBoundingClientRect();
          const target =
            pin.dataset.interactive !== undefined
              ? (() => {
                  // The target is 44 square round the body: presses 21 off
                  // its centre, either way, still reach the pin.
                  const cx = pinBox.left + pinBox.width / 2;
                  const cy = pinBox.top + pinBox.height / 2;
                  return [
                    [cx - 21, cy],
                    [cx + 21, cy],
                    [cx, cy - 21],
                    [cx, cy + 21],
                  ].every(([x, y]) => {
                    const hit = document.elementFromPoint(x, y);
                    return Boolean(hit && pin.contains(hit));
                  });
                })()
              : null;
          // A marker nothing presses passes a press at its body's centre to
          // what lies under it, as on iOS and Compose.
          const body = pin.querySelector(".kozmos-location-pin-body");
          const passes =
            pin.dataset.interactive === undefined && body
              ? (() => {
                  const r = body.getBoundingClientRect();
                  const hit = document.elementFromPoint(
                    r.left + r.width / 2,
                    r.top + r.height / 2,
                  );
                  return !(hit && pin.contains(hit));
                })()
              : null;
          out[key].pins[id] = {
            kind: pin.dataset.kind,
            point: { x: p.left + 36, y: p.top },
            pin: box(),
            pill: box(".kozmos-location-pin-pill"),
            pillDot: box(".kozmos-location-pin-pill-dot"),
            pointer: box(".kozmos-location-pin-pointer"),
            body: box(".kozmos-location-pin-body"),
            tile: box(".kozmos-location-pin-tile"),
            logo: box(".kozmos-location-pin-logo img"),
            dot: box(".kozmos-location-pin-dot"),
            teardrop: box(".kozmos-location-pin-teardrop"),
            teardropPath: box(".kozmos-location-pin-teardrop > path"),
            disc: box(".kozmos-location-pin-teardrop > circle"),
            number:
              pin.querySelector(".kozmos-location-pin-pill")?.textContent ??
              null,
            target,
            passes,
            label: box(".kozmos-location-pin-label"),
          };
        }
      }
      return out;
    });

    for (const [board, { tokens, pins }] of Object.entries(measured)) {
      const at = (id, what) => `${mode} ${board} ${id}: ${what}`;
      // The md shadow, as the boards draw it: black at 10% in light and 40% in
      // dark, 4 down, 8 of blur, whether a box-shadow or a drop-shadow filter.
      const alpha = board.startsWith("dark") ? 0.4 : 0.1;
      const isMd = (value) => {
        const colour = /rgba\(0, 0, 0, ([\d.]+)\)/.exec(value || "");
        const lengths = (value || "")
          .replace(/rgba?\([^)]*\)/g, "")
          .match(/-?[\d.]+px/g);
        return (
          Boolean(colour) &&
          Math.abs(parseFloat(colour[1]) - alpha) < 0.01 &&
          Boolean(lengths) &&
          parseFloat(lengths[0]) === 0 &&
          parseFloat(lengths[1]) === 4 &&
          parseFloat(lengths[2]) === 8
        );
      };
      const noShadow = (m) =>
        (m.filter === "none" || !m.filter) &&
        (m.boxShadow === "none" || !m.boxShadow);
      // A result: the pill on its pointer, anchored at the pointer's tip.
      for (const id of [
        "result-1",
        "result-128",
        "result-selected",
        "dot",
        "dot-selected",
      ]) {
        const m = pins[id];
        if (!m.pill || !m.pointer) {
          reads += 1;
          failures.push(at(id, `no pill or pointer (kind ${m.kind})`));
          continue;
        }
        const selected = id.endsWith("selected");
        near(m.pill.height, 32, at(id, "pill height"));
        reads += 1;
        if (m.pill.width < 31.5)
          failures.push(at(id, `pill ${m.pill.width} wide, under 32`));
        same(m.pill.border, 2, at(id, "pill border"));
        same(
          m.pill.borderColor,
          tokens.theme600,
          at(id, "pill border colour (theme 600)"),
        );
        same(
          m.pill.background,
          selected ? tokens.theme600 : tokens.background0,
          at(id, `pill fill (${selected ? "theme 600" : "background/0"})`),
        );
        const ink = selected ? tokens.foreground1000 : tokens.theme600;
        same(
          m.pillDot ? m.pillDot.background : m.pill.color,
          ink,
          at(
            id,
            `${m.pillDot ? "dot" : "number"} (${selected ? "foreground/1000" : "theme 600"})`,
          ),
        );
        if (id.startsWith("dot")) {
          near(m.pillDot?.width ?? 0, 8, at(id, "dot width"));
        }
        near(m.pointer.width, 12, at(id, "pointer width"));
        near(
          m.pointer.bottom - m.pill.bottom,
          6,
          at(id, "pointer tip below the pill"),
        );
        same(
          m.pointer.fill,
          tokens.theme600,
          at(id, "pointer fill (theme 600)"),
        );
        near(
          m.pointer.bottom,
          m.point.y,
          at(id, "anchor: the pointer's tip on the point (y)"),
        );
        near(
          m.pointer.left + m.pointer.width / 2,
          m.point.x,
          at(id, "anchor: the pointer's tip on the point (x)"),
        );
        reads += 1;
        if (!/drop-shadow/.test(m.body.filter) || !isMd(m.body.filter))
          failures.push(
            at(id, `no md shadow on the body (filter ${m.body.filter})`),
          );
      }
      // The pill grows with its number: 128 is wider than 1, 8 from each side.
      reads += 1;
      if (!(pins["result-128"].pill?.width > pins["result-1"].pill?.width + 8))
        failures.push(
          `${mode} ${board}: the pill does not grow with its number (1: ${pins["result-1"].pill?.width}, 128: ${pins["result-128"].pill?.width})`,
        );
      // A featured place: its logo in the tile, on a dot.
      for (const id of ["featured", "featured-selected"]) {
        const m = pins[id];
        if (!m.tile || !m.dot) {
          reads += 1;
          failures.push(at(id, `no tile or dot (kind ${m.kind})`));
          continue;
        }
        const size = id === "featured" ? 44 : 52;
        near(m.tile.width, size, at(id, "tile width"));
        near(m.tile.height, size, at(id, "tile height"));
        same(m.tile.border, 3, at(id, "rim"));
        same(
          m.tile.borderColor,
          tokens.foreground0,
          at(id, "rim colour (foreground/0)"),
        );
        same(
          m.tile.background,
          tokens.background0,
          at(id, "tile fill (background/0)"),
        );
        near(m.tile.radius, 16, at(id, "tile corner"));
        reads += 1;
        if (
          !m.logo ||
          m.logo.width > size - 6 + 0.5 ||
          m.logo.left < m.tile.left + 3 - 0.5
        )
          failures.push(
            at(
              id,
              `the logo is not inside the rim (${JSON.stringify(m.logo && { left: m.logo.left - m.tile.left, width: m.logo.width })})`,
            ),
          );
        near(m.dot.width, 6, at(id, "dot"));
        near(m.dot.top - m.tile.bottom, 4, at(id, "dot 4 below the tile"));
        same(
          m.dot.background,
          tokens.foreground0,
          at(id, "dot colour (foreground/0)"),
        );
        near(
          m.dot.top + 3,
          m.point.y,
          at(id, "anchor: the dot's centre on the point (y)"),
        );
        near(
          m.dot.left + 3,
          m.point.x,
          at(id, "anchor: the dot's centre on the point (x)"),
        );
        reads += 1;
        if (!isMd(m.tile.boxShadow))
          failures.push(at(id, "no md shadow on the tile"));
        same(m.number, null, at(id, "a featured tile shows no number"));
      }
      // A place on its own: the green pin, over featured and a number.
      {
        const m = pins.place;
        if (!m.teardrop || !m.dot) reads += 1;
        if (!m.teardrop || !m.dot)
          failures.push(at("place", `no teardrop or dot (kind ${m.kind})`));
        else {
          same(m.kind, "place", at("place", "kind"));
          near(m.teardrop.width, 40, at("place", "teardrop width"));
          same(
            m.teardropPath.fill,
            tokens.success800,
            at("place", "teardrop fill (success 800)"),
          );
          same(
            m.disc.fill,
            tokens.background0,
            at("place", "disc fill (background/0)"),
          );
          near(m.disc.width, 20, at("place", "disc"));
          near(m.dot.width, 6, at("place", "dot"));
          same(
            m.dot.background,
            tokens.success800,
            at("place", "dot colour (success 800)"),
          );
          near(
            m.dot.top - (m.teardrop.top + 40),
            6,
            at("place", "dot 6 below the circle"),
          );
          near(
            m.dot.top + 3,
            m.point.y,
            at("place", "anchor: the dot's centre on the point (y)"),
          );
          near(
            m.dot.left + 3,
            m.point.x,
            at("place", "anchor: the dot's centre on the point (x)"),
          );
          reads += 1;
          if (
            !/drop-shadow/.test(m.teardrop.filter) ||
            !isMd(m.teardrop.filter)
          )
            failures.push(at("place", "no md shadow on the teardrop"));
        }
      }
      // The dots a tile and a place stand on carry no shadow.
      for (const id of ["featured", "featured-selected", "place"]) {
        reads += 1;
        if (pins[id].dot && !noShadow(pins[id].dot))
          failures.push(
            at(
              id,
              `the dot carries a shadow (${pins[id].dot.filter}; ${pins[id].dot.boxShadow})`,
            ),
          );
      }
      // A marker nothing presses lets a press through to the map.
      for (const id of ["dot", "featured-selected"]) {
        reads += 1;
        if (pins[id].passes !== true)
          failures.push(
            at(id, "a static marker takes the press at its centre"),
          );
      }
      // The words beside a marker: 4 from it, centred on its shape.
      {
        const m = pins["result-128"];
        if (!m.label) failures.push(at("result-128", "no label"));
        else {
          near(
            m.label.top + m.label.height / 2,
            m.pill.top + m.pill.height / 2,
            at("result-128", "a label at the side is centred on the pill"),
          );
          near(
            m.label.left - m.pin.right,
            4,
            at("result-128", "a label at the side is 4 from the marker"),
          );
        }
        const f = pins["featured-selected"];
        if (!f.label) failures.push(at("featured-selected", "no label"));
        else {
          near(
            f.label.top + f.label.height / 2,
            f.tile.top + f.tile.height / 2,
            at(
              "featured-selected",
              "a label at the side is centred on the tile",
            ),
          );
          near(
            f.pin.left - f.label.right,
            4,
            at("featured-selected", "a label at the side is 4 from the marker"),
          );
        }
      }
      // A 44 target round a pressable marker: the pill on its pointer is 38
      // tall and the teardrop 40 wide, so a press 21 off their centre lands
      // outside the body and must still reach the marker.
      for (const id of ["result-1", "place"]) {
        reads += 1;
        if (pins[id].target !== true)
          failures.push(at(id, "a press 21 off the marker's centre misses it"));
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(
    `FAIL LocationPin markers (decision 71): ${failures.length} of ${reads} reads\n- ${failures.slice(0, 60).join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS LocationPin markers (decision 71): ${reads} reads — the result pill (32 tall, at least 32 wide and growing with its number, a 2 border in theme 600, filled when selected), its pointer's tip 6 below and on the point, the dot without a number; the featured tile (44, 52 selected, a 3 rim in foreground/0, corners of 16, the logo inside) on a dot 4 below whose centre is the point; the place's green teardrop of 40 round a disc of 20 on a dot 6 below; the md shadow on each body and a 44 target, in light and dark, left to right and right to left, with and without @scope`,
);
