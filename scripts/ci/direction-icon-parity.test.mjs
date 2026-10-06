import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Four hand-kept tables say which mark each DirectionType draws: React's
// DIRECTION_ICONS, SwiftUI's mark, Compose's icon() and the Figma plugin's
// DIRECTION_STEP_ICONS. Each platform's own tests restate its own table, so
// a change to one alone passed every check. This reads all four and holds
// them to each other.
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const kebab = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const { glyphs } = JSON.parse(
  read("packages/icons/src/owned/navigation-glyphs.json"),
);
const glyphByName = new Map(glyphs.map((g) => [g.name, g]));
const glyphByKind = new Map(glyphs.map((g) => [g.kind, g]));
const glyphByKebab = new Map(glyphs.map((g) => [kebab(g.name), g]));

/** The text between `start` and the first `end` after it. */
function block(source, start, end, file) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `${file}: ${start} not found`);
  return source.slice(from, source.indexOf(end, from));
}

/** Each table as DirectionType (kebab case) -> a glyph's name, or a non-glyph mark. */
function tables() {
  const reactFile =
    "packages/react/src/components/DirectionStep/DirectionStep.tsx";
  const react = new Map(
    [
      ...block(read(reactFile), "DIRECTION_ICONS", "};", reactFile).matchAll(
        /^\s*"?([a-z-]+)"?:\s*(\w+),/gm,
      ),
    ].map(([, type, mark]) => [
      type,
      glyphByName.has(mark) ? mark : `arrow:${mark}`,
    ]),
  );

  const swiftFile =
    "packages/ios/Sources/Components/DirectionStep/DirectionStep.swift";
  const swift = new Map(
    [
      ...read(swiftFile).matchAll(
        /case \.(\w+): return \.(symbol|wayfinding)\("([^"]+)"\)/g,
      ),
    ].map(([, type, kind, value]) => [
      kebab(type),
      kind === "wayfinding"
        ? (glyphByKind.get(value)?.name ?? `unknown wayfinding kind ${value}`)
        : `arrow:${value}`,
    ]),
  );

  const kotlinFile =
    "packages/android/src/main/java/com/kozmos/components/DirectionStep/DirectionStep.kt";
  const kotlin = new Map(
    [
      ...read(kotlinFile).matchAll(
        /DirectionType\.(\w+) -> (?:KozmosNavigationGlyphs\.(\w+)|Icons\.Default\.(\w+))/g,
      ),
    ].map(([, type, glyph, material]) => [
      kebab(type),
      glyph ?? `arrow:${material}`,
    ]),
  );

  const pluginFile = "figma/foundations-importer/code.js";
  const plugin = new Map(
    [
      ...block(
        read(pluginFile),
        "const DIRECTION_STEP_ICONS = {",
        "};",
        pluginFile,
      ).matchAll(/^\s*(\w+): "([^"]+)",/gm),
    ].map(([, type, icon]) => [
      kebab(type),
      glyphByKebab.get(icon)?.name ?? `arrow:${icon}`,
    ]),
  );
  return { react, swift, kotlin, plugin };
}

/**
 * Which way a platform's own arrow points, from its name: SF Symbols
 * (arrow.up.to.line), Material (ArrowUpward, ArrowRightAlt) and the Pointr
 * icons (arrow-up). Forward is right in a left-to-right layout.
 */
function arrowDirection(mark) {
  const name = String(mark)
    .replace(/^arrow:/, "")
    .toLowerCase();
  if (name.includes("up")) return "up";
  if (name.includes("down")) return "down";
  if (name.includes("right") || name.includes("forward")) return "right";
  if (name.includes("left") || name.includes("back")) return "left";
  return null;
}

test("every platform's direction table names the same nineteen types", () => {
  const { react, swift, kotlin, plugin } = tables();
  const types = [...react.keys()].sort();
  assert.equal(types.length, 19, `React names ${types.length} types`);
  for (const [name, table] of Object.entries({ swift, kotlin, plugin }))
    assert.deepEqual([...table.keys()].sort(), types, `${name}'s types`);
});

test("a type that draws an Express glyph draws the same one on every platform", () => {
  const { react, swift, kotlin, plugin } = tables();
  let express = 0;
  for (const [type, mark] of react) {
    const marks = {
      swift: swift.get(type),
      kotlin: kotlin.get(type),
      plugin: plugin.get(type),
    };
    if (glyphByName.has(mark)) {
      express += 1;
      for (const [name, other] of Object.entries(marks))
        assert.equal(
          other,
          mark,
          `${type}: React draws ${mark}, ${name} ${other}`,
        );
    } else {
      // Straight on, the level changes and the transition keep each
      // platform's own arrow: none may draw an Express glyph React does not,
      // and each points where React's does.
      const direction = arrowDirection(mark);
      assert.ok(direction, `${type}: React's ${mark} points nowhere known`);
      for (const [name, other] of Object.entries(marks)) {
        assert.ok(
          other?.startsWith("arrow:"),
          `${type}: React draws an arrow, ${name} the Express glyph ${other}`,
        );
        assert.equal(
          arrowDirection(other),
          direction,
          `${type}: React's arrow points ${direction}, ${name}'s ${other} ${arrowDirection(other)}`,
        );
      }
    }
  }
  assert.equal(express, 15, `${express} types draw Express glyphs`);
});
