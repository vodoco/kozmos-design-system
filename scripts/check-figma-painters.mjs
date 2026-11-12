/**
 * Measure what the Figma importer's painters draw, without Figma.
 *
 * The plugin runs inside Figma, so until now a painter's output could only be
 * checked by running the import and reading the file back — one round per
 * try, and `pnpm figma:verify` compares structure, not paint. This evaluates
 * `code.js` against the harness in `scripts/lib/figma-plugin-harness.mjs`,
 * calls a painter the way Build and Update do, and asserts the numbers the
 * component contract names: a 64 square, a counter 4 beyond its edges, a
 * paint bound to the category's variable. Each assertion is a fact about a
 * node the painter wrote; none is a picture.
 *
 * Usage: node scripts/check-figma-painters.mjs [path/to/code.js]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FONTS,
  MockNode,
  boundPaintOpacityDrops,
  boundVariableName,
  createFigmaMock,
  dropGradientStopBindings,
  createMockTextStyle,
  framesLargerThanAsked,
  freshStats,
  hexOf,
  loadPlugin,
  mockComponentSet,
  mockIconComponent,
  mockTextStyleById,
  mockWayfindingIconComponent,
  mockVariables,
  payloadVariables,
  resetSearchStats,
  searchStats,
  withAutoLayout,
  withNodeDefaults,
} from "./lib/figma-plugin-harness.mjs";
import {
  isTypedGlyph,
  layersShortOfTheirFrame,
  strokeLayoutsThatDisagree,
  variantsThatOverlap,
} from "./lib/figma-verify-rules.mjs";
import { expectations } from "./verify-figma-library.mjs";

const ROOT = process.cwd();
const PLUGIN = path.resolve(
  process.argv[2] || "figma/foundations-importer/code.js",
);
const contract = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "packages/tokens/src/component-contracts.json"),
    "utf8",
  ),
).components;

let failures = 0;
let passes = 0;
function ok(condition, message) {
  if (condition) {
    passes += 1;
    return;
  }
  failures += 1;
  console.log(`  FAIL  ${message}`);
}
function section(title) {
  console.log(`\n${title}`);
}

// --- The file the painters expect ------------------------------------------

const CATEGORY_NAMES = [
  "Yellow",
  "Orange",
  "Turquoise",
  "Red",
  "Blue",
  "Navy",
  "Green",
  "Pink",
];

function counterSet() {
  const variants = [];
  for (const tone of ["Neutral", "Brand", "Destructive", "Inverse"]) {
    for (const size of ["Small", "Default"]) {
      variants.push({
        properties: { Tone: tone, Size: size },
        build: (variant) => {
          const height = size === "Small" ? 18 : 20;
          variant.resize(height, height);
          variant.layoutMode = "HORIZONTAL";
          variant.fills = [
            { type: "SOLID", color: { r: 0.07, g: 0.36, b: 0.93 }, opacity: 1 },
          ];
          const text = new MockNode("TEXT", "Counter Text");
          text.characters = "2";
          text.fontSize = size === "Small" ? 11 : 12;
          text.componentPropertyReferences = { characters: "Counter Text#1:0" };
          variant.appendChild(text);
        },
      });
    }
  }
  const set = mockComponentSet("Counter", variants);
  set.componentPropertyDefinitions = {
    "Counter Text#1:0": { type: "TEXT", defaultValue: "2" },
  };
  return set;
}

function pages() {
  const components = new MockNode("PAGE", "Components");
  components.appendChild(counterSet());
  const icons = new MockNode("PAGE", "Icons");
  for (const name of [
    "search-md",
    "x-close",
    "marker-pin-01",
    "arrow-up",
    "arrow-down",
    "arrow-left",
    "arrow-right",
    "flip-backward",
    "map-01",
    "chevron-left",
    "chevron-right",
    "chevron-up",
    "chevron-down",
    "navigation-pointer-01",
    "bookmark",
    "share-01",
    "edit-01",
    "stars-01",
    "plus",
    "minus",
    "compass-01",
    "loading-01",
    "switch-vertical-01",
    "route",
    "qr-code-01",
    "lock-01",
    "info-circle",
    "bus",
    "heart",
    "shopping-bag-02",
    "user-01",
    "check",
    "alert-triangle",
    "alert-circle",
    "calendar",
  ]) {
    icons.appendChild(mockIconComponent(name));
  }
  for (const name of [
    "elevator-up",
    "elevator-down",
    "escalator-up",
    "escalator-down",
    "stairs-up",
    "stairs-down",
    "hard-left",
    "hard-right",
    "turn-back",
    "arriving",
    "follow-the-line",
    "route-enter",
    "route-exit",
    "ramp-up",
    "ramp-down",
  ]) {
    icons.appendChild(mockWayfindingIconComponent(name));
  }
  return [components, icons];
}

const variableByName = mockVariables([
  "Colors/background/0",
  "Colors/foreground/0",
  "Colors/foreground/400",
  "Colors/foreground/500",
  "Colors/foreground/1000",
  "Colors/theme/100",
  "Colors/theme/500",
  "Colors/theme/600",
  "Colors/theme/700",
  "Colors/emotional/alert/900",
  "Colors/emotional/alert/500",
  "Emotion/alert/onFill",
  "Accent/fill",
  "Accent/onFill",
  "Colors/background/100",
  "Colors/background/200",
  "Primary Buttons/themed/button/background/idle",
  "Primary Buttons/themed/button/foreground/content/idle",
  "CategoryField/height",
  "CategoryField/icon/size",
  "CategoryField/pill/height",
  "CategoryField/clear/size",
  "CategoryField/label/font-size",
  "CategoryField/label/line-height",
  "AISearchButton/size",
  "AISearchButton/icon/size",
  "Data/Red",
  "Data/Yellow",
  "Colors/emotional/success/500",
  "Colors/emotional/success/800",
  "Data/Teal",
  "Data/Blue",
  "Data/Purple",
  "DirectionStep/instruction/font-size",
  "DirectionStep/instruction/line-height",
  "DirectionStep/meta/font-size",
  "DirectionStep/meta/line-height",
  "Surface/0",
  "Surface/100",
  "Border/Subtle",
  ...CATEGORY_NAMES.flatMap((name) => [
    `Category/Accent/${name}`,
    `Category/Fill/${name}`,
    `Category/OnFill/${name}`,
  ]),
  "CategoryTile/square/size",
  "CategoryTile/icon/size",
  "CategoryTile/label/font-size",
  "CategoryTile/label/line-height",
  "LocationPin/label/font-size",
  "LocationPin/label/line-height",
  "Colors/transparent/inverted/10",
  "Border/bevel/top",
  "Overlay/Scrim",
]);

const figma = createFigmaMock({ pages: pages() });
const plugin = loadPlugin({ pluginPath: PLUGIN, figma });

const named = (node, name) => node.findOne((child) => child.name === name);

// Figma keeps no paint opacity on a bound colour, so a translucent token wash
// is a layer of its own: the paint bound at full strength, the layer at the
// wash's opacity, first in its parent so the content sits on it, absolute and
// stretched with the parent.
function isWash(parent, name, variable, opacity, width, height) {
  const wash = parent && named(parent, name);
  return Boolean(
    wash &&
    parent.children[0] === wash &&
    wash.fills.length === 1 &&
    boundVariableName(wash.fills[0]) === variable &&
    (wash.fills[0].opacity ?? 1) === 1 &&
    Math.abs(wash.opacity - opacity) < 1e-9 &&
    wash.width === width &&
    wash.height === height &&
    wash.layoutPositioning === "ABSOLUTE" &&
    wash.constraints.horizontal === "STRETCH" &&
    wash.constraints.vertical === "STRETCH",
  );
}

// --- CategoryTile --------------------------------------------------------------

section("CategoryTile");
{
  const tile = contract.categoryTile.content;
  ok(
    Array.isArray(plugin.CATEGORY_TINTS) &&
      plugin.CATEGORY_TINTS.join(",") ===
        ["Theme", ...CATEGORY_NAMES].join(","),
    "CATEGORY_TINTS is Theme plus the taxonomy's eight, in the sprite's order",
  );
  ok(
    typeof plugin.updateCategoryTileVariant === "function" &&
      typeof plugin.categoryTileVariantCombinations === "function",
    "CategoryTile is a planned matrix of State × Tint",
  );
  if (typeof plugin.categoryTileVariantCombinations === "function") {
    ok(
      plugin.categoryTileVariantCombinations().length === 3 * 9,
      "27 variants: three states by nine tints",
    );
  }

  async function paint(state, tint) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateCategoryTileVariant(component, {
      props: { state, tint },
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }

  if (typeof plugin.updateCategoryTileVariant === "function") {
    const { component, stats } = await paint("Selected", "Yellow");
    ok(
      component.name === "State=Selected, Tint=Yellow",
      `variant named by both axes (got "${component.name}")`,
    );
    const square = named(component, "Icon Square");
    ok(square, "an Icon Square");
    if (square) {
      ok(
        square.width === tile.squareSize && square.height === tile.squareSize,
        `the square is ${tile.squareSize} (got ${square.width}×${square.height})`,
      );
      ok(
        square.cornerRadius === plugin.KOZMOS_RADIUS.control,
        "the square's radius is the control role",
      );
      ok(
        boundVariableName(square.strokes[0]) === "Category/Accent/Yellow" &&
          square.strokeWeight === 1,
        "selected: a 1 stroke bound to the category's accent",
      );
      ok(
        square.fills.length === 1 &&
          boundVariableName(square.fills[0]) === "Colors/background/0",
        "selected: the square keeps its background",
      );
      ok(
        isWash(
          square,
          "Selection Wash",
          "Category/Accent/Yellow",
          0.05,
          tile.squareSize,
          tile.squareSize,
        ),
        "selected: the accent at 5 % over it, as a wash layer",
      );
      ok(square.clipsContent === false, "the square does not clip its counter");
      const ring = named(square, "Selection Ring");
      ok(ring, "selected: a Selection Ring");
      if (ring) {
        ok(
          ring.width === tile.squareSize + 2 &&
            ring.height === tile.squareSize + 2 &&
            ring.x === -1 &&
            ring.y === -1 &&
            ring.layoutPositioning === "ABSOLUTE",
          "the ring is 1 outside the square on every side",
        );
        ok(
          boundVariableName(ring.strokes[0]) === "Category/Accent/Yellow" &&
            (ring.strokes[0].opacity ?? 1) === 1 &&
            Math.abs(ring.opacity - 0.2) < 1e-9 &&
            ring.fills.length === 0,
          "the ring is the accent at 20 % by layer opacity, no fill",
        );
      }
      const icon = named(square, "Icon");
      ok(icon && icon.type === "INSTANCE", "the icon is a swappable instance");
      if (icon) {
        ok(
          icon.width === tile.iconSize && icon.height === tile.iconSize,
          `the icon is ${tile.iconSize}`,
        );
        const vector = icon.findOne((node) => node.type === "VECTOR");
        ok(
          vector &&
            boundVariableName(vector.strokes[0]) === "Category/Accent/Yellow",
          "the icon's stroke is bound to the accent",
        );
      }
      const counter = named(square, "Counter");
      ok(
        counter && counter.type === "INSTANCE",
        "the count is the system's Counter",
      );
      if (counter) {
        ok(
          counter.layoutPositioning === "ABSOLUTE" &&
            counter.y === -tile.counterOverhang &&
            counter.x + counter.width ===
              tile.squareSize + tile.counterOverhang,
          `the counter sits ${tile.counterOverhang} beyond the square's top and right edges (x ${counter.x}, y ${counter.y}, w ${counter.width})`,
        );
        ok(
          boundVariableName(counter.fills[0]) === "Category/Fill/Yellow",
          "the counter's fill is the category's fill",
        );
        const digits = counter.findOne((node) => node.type === "TEXT");
        ok(
          digits &&
            boundVariableName(digits.fills[0]) === "Category/OnFill/Yellow",
          "the digits are the fill's ink",
        );
        ok(
          counter.isExposedInstance === true,
          "the counter is exposed for its text",
        );
        ok(
          counter.constraints.horizontal === "MAX" &&
            counter.constraints.vertical === "MIN",
          "the counter is pinned to the top-right",
        );
      }
    }
    const label = named(component, "Label Text");
    ok(label && label.type === "TEXT", "a Label Text");
    if (label) {
      ok(
        label.fontSize === tile.labelFontSize &&
          label.lineHeight.value === tile.labelLineHeight,
        `the label is ${tile.labelFontSize}/${tile.labelLineHeight} (got ${label.fontSize}/${label.lineHeight && label.lineHeight.value})`,
      );
      // line-clamp-2: the height follows the lines, and an ellipsis ends the
      // second. The harness holds Figma's order for these (TEXT_SIZING_FIELDS):
      // the order this painter used until 2026-09-22 left the fixed one-line
      // box the live file read, and fails here.
      ok(
        label.textAutoResize === "HEIGHT" &&
          label.textTruncation === "ENDING" &&
          label.maxLines === 2,
        `the label sizes to two lines at most, then an ellipsis (got ${label.textAutoResize}, ${label.textTruncation}, maxLines ${label.maxLines})`,
      );
      const heightFor = (characters) => {
        label.characters = characters;
        return label.height;
      };
      const one = tile.labelLineHeight;
      ok(
        heightFor("Gates") === one &&
          heightFor("Parking & Ground Transport") === 2 * one &&
          heightFor("Security, Immigration & Passport Control") === 2 * one,
        "a short name takes one line, a long one two, and a longer one stops at two",
      );
      label.characters = "Transport";
      ok(
        boundVariableName(label.fills[0]) === "Colors/foreground/0",
        "the label keeps the foreground colour under a tint",
      );
      ok(label.textAlignHorizontal === "CENTER", "the label is centred");
    }
    ok(
      stats.warnings.length === 0,
      `no warnings (${stats.warnings.join(" | ")})`,
    );
  }

  if (typeof plugin.updateCategoryTileVariant === "function") {
    const { component } = await paint("Default", "Theme");
    const square = named(component, "Icon Square");
    ok(
      square && boundVariableName(square.strokes[0]) === "Border/Subtle",
      "default: the subtle border",
    );
    ok(
      square &&
        square.fills.length === 1 &&
        !named(square, "Selection Wash") &&
        !named(square, "Selection Ring"),
      "default: no accent wash, no ring",
    );
    const icon = square && named(square, "Icon");
    const vector = icon && icon.findOne((node) => node.type === "VECTOR");
    // An icon on the surface is the theme's 600, as React's primary draws
    // it (decision 59); 500 read 3.13:1 on a dark sheet.
    ok(
      vector && boundVariableName(vector.strokes[0]) === "Colors/theme/600",
      `theme: the icon in the theme's 600 (${vector && boundVariableName(vector.strokes[0])})`,
    );
    const counter = square && named(square, "Counter");
    ok(
      counter &&
        hexOf(counter.fills[0]) === "#125CED" &&
        !counter.fills[0].boundVariables,
      "theme: the counter keeps its own brand fill",
    );
    ok(component.opacity === 1, "default: full opacity");
  }

  if (typeof plugin.updateCategoryTileVariant === "function") {
    const { component } = await paint("Disabled", "Red");
    ok(component.opacity === 0.5, "disabled: the tile at 50 %");
    const square = named(component, "Icon Square");
    ok(square && !named(square, "Selection Ring"), "disabled: no ring");
  }

  ok(
    plugin.COMPONENT_FLOAT_TOKENS.some(
      (token) =>
        token.name === "CategoryTile/square/size" &&
        token.value === tile.squareSize,
    ) &&
      plugin.COMPONENT_FLOAT_TOKENS.some(
        (token) =>
          token.name === "CategoryTile/icon/size" &&
          token.value === tile.iconSize,
      ) &&
      plugin.COMPONENT_FLOAT_TOKENS.some(
        (token) =>
          token.name === "CategoryTile/label/font-size" &&
          token.value === tile.labelFontSize,
      ) &&
      plugin.COMPONENT_FLOAT_TOKENS.some(
        (token) =>
          token.name === "CategoryTile/label/line-height" &&
          token.value === tile.labelLineHeight,
      ),
    "the tile's component variables carry the contract's numbers",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("CategoryTile"),
      ) ===
        JSON.stringify({
          State: plugin.CATEGORY_TILE_STATES,
          Tint: plugin.CATEGORY_TINTS,
        }),
    "the set expects State and Tint",
  );
}

// --- LocationPin --------------------------------------------------------------

section("LocationPin");
{
  // The SDK's map result markers (decision 71), against the MAP-474 boards'
  // SVGs (.notes/track2): seven variants, Kind by State by Content.
  ok(
    typeof plugin.locationPinVariantCombinations === "function" &&
      plugin.locationPinVariantCombinations().length === 7,
    "7 variants: a Result's two states by number or dot, a Featured tile's two, a Place",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("LocationPin"),
      ) ===
        JSON.stringify({
          Kind: ["Result", "Featured", "Place"],
          State: ["Default", "Selected"],
          Content: ["Number", "Dot", "None"],
        }),
    "the set expects Kind, State and Content, None on a Featured tile and a Place",
  );
  const parse = (name) =>
    JSON.stringify(plugin.parseLocationPinVariantName(name));
  ok(
    typeof plugin.parseLocationPinVariantName === "function" &&
      parse("Kind=Result, State=Selected, Content=Dot") ===
        JSON.stringify({ kind: "Result", state: "Selected", content: "Dot" }) &&
      parse("Kind=Place, State=Default, Content=None") ===
        JSON.stringify({ kind: "Place", state: "Default", content: "None" }) &&
      parse("Kind=Featured, State=Selected, Content=Number") === "null" &&
      parse("Kind=Result, State=Default, Content=None") === "null",
    "the new variant names read back, and a Content that doesn't fit its Kind is refused",
  );
  // The theme's medium pins become the new markers in place, keeping their
  // node IDs; every other old pin is stale and goes once the new ones exist.
  ok(
    typeof plugin.parseLocationPinVariantName === "function" &&
      parse("State=Default, Size=Md, Tint=Theme") ===
        JSON.stringify({
          kind: "Result",
          state: "Default",
          content: "Number",
        }) &&
      parse("State=Selected, Size=Md") ===
        JSON.stringify({
          kind: "Result",
          state: "Selected",
          content: "Number",
        }) &&
      parse("State=Featured, Size=Md, Tint=Theme") ===
        JSON.stringify({
          kind: "Featured",
          state: "Default",
          content: "None",
        }) &&
      parse("State=OffFloor, Size=Md, Tint=Theme") ===
        JSON.stringify({ stale: true }) &&
      parse("State=Default, Size=Lg, Tint=Red") ===
        JSON.stringify({ stale: true }),
    "old pins: the theme's medium three are renamed in place, the rest stale",
  );
  // The Featured tiles and the Place the 16 Oct Update painted named no
  // Content, which held the live set in error; they read as None, so the next
  // Update renames them in place and they keep their node IDs.
  ok(
    typeof plugin.parseLocationPinVariantName === "function" &&
      parse("Kind=Featured, State=Default") ===
        JSON.stringify({
          kind: "Featured",
          state: "Default",
          content: "None",
        }) &&
      parse("Kind=Place, State=Default") ===
        JSON.stringify({ kind: "Place", state: "Default", content: "None" }),
    "the 16 Oct variants without Content are renamed in place",
  );
  const config =
    typeof plugin.locationPinComponentConfig === "function" &&
    plugin.locationPinComponentConfig();
  ok(
    config && config.removeUnexpectedVariants === true,
    "Update removes the stale pins (after creating the new, so the set keeps its ID)",
  );

  async function paint(props) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateLocationPinVariant(component, {
      props,
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }
  const floating = (node) =>
    node &&
    node.effects &&
    node.effects.length === 1 &&
    node.effects[0].type === "DROP_SHADOW" &&
    node.effects[0].offset.y === 4 &&
    node.effects[0].radius === 8 &&
    node.effects[0].color.a === 0.1;

  if (typeof plugin.updateLocationPinVariant === "function") {
    for (const selected of [false, true]) {
      const state = selected ? "Selected" : "Default";
      const { component, stats } = await paint({
        kind: "Result",
        state,
        content: "Number",
      });
      ok(
        component.name === `Kind=Result, State=${state}, Content=Number`,
        `result, ${state}: named by its three axes (got "${component.name}")`,
      );
      const marker = named(component, "Pin Marker");
      const pill = named(component, "Pill");
      const pointer = named(component, "Pointer");
      const number = named(component, "Number Text");
      ok(
        pill &&
          pill.height === 32 &&
          pill.minWidth === 32 &&
          pill.cornerRadius === 16 &&
          pill.paddingLeft === 8 &&
          pill.paddingRight === 8 &&
          pill.strokeWeight === 2 &&
          pill.strokeAlign === "INSIDE" &&
          boundVariableName(pill.strokes[0]) === "Colors/theme/600" &&
          boundVariableName(pill.fills[0]) ===
            (selected ? "Colors/theme/600" : "Colors/background/0"),
        `result, ${state}: a pill 32 tall, 32 wide at least, 8 from its number, a 2 border of theme 600 inside, ${selected ? "filled theme 600" : "on background/0"} (${pill && boundVariableName(pill.fills[0])})`,
      );
      ok(
        number &&
          number.visible !== false &&
          number.fontSize === 14 &&
          boundVariableName(number.fills[0]) ===
            (selected ? "Colors/foreground/1000" : "Colors/theme/600"),
        `result, ${state}: the number 14 in ${selected ? "foreground/1000" : "theme 600"} (${number && boundVariableName(number.fills[0])})`,
      );
      ok(
        pointer &&
          pointer.type === "VECTOR" &&
          pointer.vectorPaths &&
          pointer.vectorPaths[0].data === "M 0 0 L 12 0 L 6 7 Z" &&
          boundVariableName(pointer.fills[0]) === "Colors/theme/600" &&
          marker &&
          marker.itemSpacing === -1,
        "result: a pointer 12 by 7 in theme 600, its top 1 inside the pill, so its tip is 6 below",
      );
      ok(floating(marker), "result: the md shadow on the pill and its pointer");
      ok(
        stats.warnings.length === 0,
        `result, ${state}: no warnings (${stats.warnings.join(" | ")})`,
      );
    }
    for (const selected of [false, true]) {
      const state = selected ? "Selected" : "Default";
      const { component } = await paint({
        kind: "Result",
        state,
        content: "Dot",
      });
      const number = named(component, "Number Text");
      const dot = named(component, "Pill Dot");
      ok(
        number &&
          number.visible === false &&
          dot &&
          dot.width === 8 &&
          boundVariableName(dot.fills[0]) ===
            (selected ? "Colors/background/0" : "Colors/theme/600"),
        `result, ${state}, no number: an 8 dot in ${selected ? "background/0 (foreground/1000's colours)" : "theme 600"}`,
      );
    }
    for (const selected of [false, true]) {
      const state = selected ? "Selected" : "Default";
      const size = selected ? 52 : 44;
      const { component, stats } = await paint({
        kind: "Featured",
        state,
        content: "None",
      });
      const tile = named(component, "Tile");
      const dot = named(component, "Dot");
      const marker = named(component, "Pin Marker");
      const number = named(component, "Number Text");
      ok(
        component.name === `Kind=Featured, State=${state}, Content=None`,
        `featured, ${state}: named by all three axes, Content None (got "${component.name}")`,
      );
      ok(
        tile &&
          tile.width === size &&
          tile.height === size &&
          tile.cornerRadius === 16 &&
          tile.strokeWeight === 3 &&
          tile.strokeAlign === "INSIDE" &&
          tile.clipsContent === true &&
          boundVariableName(tile.strokes[0]) === "Colors/foreground/0" &&
          boundVariableName(tile.fills[0]) === "Colors/background/0" &&
          floating(tile),
        `featured, ${state}: a ${size} tile, corners of 16, a 3 rim of foreground/0 on background/0, the md shadow; no accent (decision 81)`,
      );
      ok(
        named(component, "Logo") && number && number.visible === false,
        `featured, ${state}: a Logo area inside the rim, and no number`,
      );
      ok(
        dot &&
          dot.width === 6 &&
          boundVariableName(dot.fills[0]) === "Colors/foreground/0" &&
          marker &&
          marker.itemSpacing === 4,
        `featured, ${state}: a 6 dot of foreground/0, 4 below the tile`,
      );
      ok(
        stats.warnings.length === 0,
        `featured, ${state}: no warnings (${stats.warnings.join(" | ")})`,
      );
    }
    {
      const { component, stats } = await paint({
        kind: "Place",
        state: "Default",
        content: "None",
      });
      const pin = named(component, "Teardrop");
      const drop = named(component, "Drop");
      const disc = named(component, "Disc");
      const dot = named(component, "Dot");
      const marker = named(component, "Pin Marker");
      ok(
        component.name === "Kind=Place, State=Default, Content=None",
        `place: named by all three axes, Content None (got "${component.name}")`,
      );
      ok(
        pin &&
          pin.width === 40 &&
          drop &&
          drop.type === "VECTOR" &&
          // The SDK's teardrop, checked by hand against the boards' SVG: the
          // tangents from the tip meet the circle at 45 degrees either side
          // (5.858 and 34.142 at y 34.142), its three quarter-circle cubics
          // have control length 11.046 (0.5523 of 20), and the tip is 48.284
          // below the circle's top.
          drop.vectorPaths[0].data ===
            "M 34.142 34.142 C 41.953 26.331 41.953 13.669 34.142 5.858 C 26.331 -1.953 13.669 -1.953 5.858 5.858 C -1.953 13.669 -1.953 26.331 5.858 34.142 L 20 48.284 Z" &&
          boundVariableName(drop.fills[0]) === "Colors/emotional/success/800" &&
          floating(drop),
        "place: a teardrop of 40 in emotional success 800, with the md shadow",
      );
      ok(
        disc &&
          disc.width === 20 &&
          disc.x === 10 &&
          disc.y === 10 &&
          boundVariableName(disc.fills[0]) === "Colors/background/0",
        "place: a disc of 20 in background/0 at the circle's centre",
      );
      ok(
        dot &&
          dot.width === 6 &&
          boundVariableName(dot.fills[0]) === "Colors/emotional/success/800" &&
          marker &&
          marker.itemSpacing === -3,
        "place: a 6 dot in the green whose top is 6 below the circle (3 above the 49 teardrop)",
      );
      ok(
        stats.warnings.length === 0,
        `place: no warnings (${stats.warnings.join(" | ")})`,
      );
    }
  }
}

// --- IconButton ------------------------------------------------------------------

section("IconButton");
{
  const large = contract.iconButton.sizes.large;
  const token = plugin.COMPONENT_FLOAT_TOKENS.find(
    (entry) => entry.name === "IconButton/size/large",
  );
  ok(
    token && token.value === large.width && token.value === large.height,
    `the large icon button is ${large.width} (token ${token && token.value})`,
  );
  const icon = plugin.COMPONENT_FLOAT_TOKENS.find(
    (entry) => entry.name === "IconButton/icon/size/large",
  );
  ok(
    icon && icon.value === large.iconSize,
    `its icon is ${large.iconSize} (token ${icon && icon.value})`,
  );
}

// --- POIDetailPanel --------------------------------------------------------------

section("POIDetailPanel");
{
  async function paint(value) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updatePOIDetailPanelVariant(component, {
      value,
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }
  const { component: sheet } = await paint("Sheet");
  ok(
    sheet.fills.length === 0 && sheet.strokes.length === 0,
    "sheet: no surface or border of its own",
  );
  ok(
    sheet.topLeftRadius === plugin.KOZMOS_RADIUS.control &&
      sheet.topRightRadius === plugin.KOZMOS_RADIUS.control &&
      sheet.cornerRadius === plugin.KOZMOS_RADIUS.none,
    "sheet: only the top corners round, at the control radius",
  );
  ok(
    !named(sheet, "Grabber"),
    "sheet: no grabber of its own — the sheet draws the handle",
  );
  for (const slot of ["Media Slot", "Services Slot"]) {
    const node = named(sheet, slot);
    ok(
      node && boundVariableName(node.fills[0]) === "Colors/background/0",
      `sheet: ${slot} is white on the sheet's grey`,
    );
  }
  const { component: panel } = await paint("Panel");
  ok(
    boundVariableName(panel.fills[0]) === "Surface/0" &&
      boundVariableName(panel.strokes[0]) === "Border/Subtle",
    "panel: keeps its surface and border",
  );
  const services = named(panel, "Services Slot");
  ok(
    services && boundVariableName(services.fills[0]) === "Surface/100",
    "panel: the services block stays muted",
  );

  // GAP-130: the product's own action, last in the strip, outlined, with its
  // icon before its words, hidden until Host Action shows it. The strip cuts
  // off what passes the card's edge, as the code's strip does before it is
  // scrolled, rather than wrapping or growing the card.
  const strip = named(panel, "Actions Slot");
  const hostAction = strip && strip.children[strip.children.length - 1];
  ok(
    strip &&
      strip.children.map((child) => child.name).join(", ") ===
        "Navigate Action, Save Action, Share Action, Host Action" &&
      strip.clipsContent === true,
    `the strip ends with the host action and clips (${strip && strip.children.map((child) => child.name).join(", ")})`,
  );
  ok(
    hostAction &&
      hostAction.visible === false &&
      boundVariableName(hostAction.fills[0]) === "Surface/0" &&
      boundVariableName(hostAction.strokes[0]) === "Border/Subtle" &&
      hostAction.children.map((child) => child.name).join(", ") ===
        "Host Action Icon, Host Action Label" &&
      hostAction.children[0].type === "INSTANCE" &&
      hostAction.children[1].characters === "Open in app" &&
      hostAction.height === 44,
    `the host action is a hidden 44 outlined button, its icon before its words (${hostAction && hostAction.children.map((child) => `${child.type} ${child.name}`).join(", ")})`,
  );
  const variants = [];
  for (const value of ["Inline", "Panel"])
    variants.push((await paint(value)).component);
  const set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "POIDetailPanel";
  plugin.configurePOIDetailPanelProperties(set, freshStats());
  const definitions = set.componentPropertyDefinitions;
  const byBase = (base, type) =>
    Object.keys(definitions).find(
      (key) => key.split("#")[0] === base && definitions[key].type === type,
    );
  const hostProperty = byBase("Host Action", "BOOLEAN");
  const hostText = byBase("Host Action Text", "TEXT");
  ok(
    hostProperty &&
      definitions[hostProperty].defaultValue === false &&
      hostText &&
      definitions[hostText].defaultValue === "Open in app" &&
      variants.every(
        (variant) =>
          named(variant, "Host Action")?.componentPropertyReferences
            ?.visible === hostProperty &&
          named(variant, "Host Action Label")?.componentPropertyReferences
            ?.characters === hostText,
      ),
    `a Host Action boolean, off, and Host Action Text, on every variant (${Object.keys(definitions).join(", ")})`,
  );
}

// --- CategoryField ---------------------------------------------------------------

section("CategoryField");
{
  ok(
    typeof plugin.updateCategoryFieldVariant === "function" &&
      typeof plugin.buildCategoryFieldComponent === "function" &&
      typeof plugin.updateCategoryFieldComponent === "function",
    "CategoryField has a painter, a Build and an Update",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("CategoryField"),
      ) === JSON.stringify({ Tint: plugin.CATEGORY_TINTS }),
    "the set expects Tint",
  );
  ok(
    Array.isArray(plugin.PRODUCT_SDK_UPDATE_SEQUENCE) &&
      plugin.PRODUCT_SDK_UPDATE_SEQUENCE.some(
        ([name]) => name === "CategoryField",
      ),
    "CategoryField is in the Product / SDK update sequence",
  );

  async function paint(value) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateCategoryFieldVariant(component, {
      value,
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }

  if (typeof plugin.updateCategoryFieldVariant === "function") {
    const { component, stats } = await paint("Yellow");
    ok(
      component.name === "Tint=Yellow",
      `named by its tint (got "${component.name}")`,
    );
    ok(component.height === 48, `48 tall (got ${component.height})`);
    ok(
      component.cornerRadius === plugin.KOZMOS_RADIUS.control,
      "the control radius",
    );
    ok(
      boundVariableName(component.strokes[0]) === "Category/Accent/Yellow" &&
        component.strokeWeight === 1,
      "a 1 border in the accent",
    );
    ok(component.fills.length === 0, "the field paints no fill of its own");
    ok(
      isWash(component, "Tint Wash", "Category/Accent/Yellow", 0.12, 320, 48) &&
        named(component, "Tint Wash").cornerRadius ===
          plugin.KOZMOS_RADIUS.control,
      "the accent at 12 % behind, as a wash layer at the control radius",
    );
    ok(
      component.paddingLeft === 12 && component.paddingRight === 8,
      "12 before the icon, 8 after the clear",
    );
    const icon = named(component, "Icon");
    ok(
      icon && icon.type === "INSTANCE" && icon.width === 28,
      "a 28 icon instance",
    );
    const vector = icon && icon.findOne((node) => node.type === "VECTOR");
    ok(
      vector &&
        boundVariableName(vector.strokes[0]) === "Category/Accent/Yellow" &&
        Math.abs(vector.strokeWeight - (2 * 28) / 24) < 1e-9,
      "the icon in the accent, its stroke scaled to 28",
    );
    const label = named(component, "Label Text");
    ok(
      label &&
        label.fontSize === 15 &&
        label.lineHeight.value === 20 &&
        boundVariableName(label.fills[0]) === "Colors/foreground/0",
      "the label 15/20 in the foreground (Olcay, 2026-09-21)",
    );
    const pill = named(component, "Count Pill");
    ok(
      pill &&
        pill.height === 22 &&
        pill.cornerRadius === plugin.KOZMOS_RADIUS.pill &&
        boundVariableName(pill.fills[0]) === "Category/Fill/Yellow",
      "a 22 pill filled with the category's fill",
    );
    const count = named(component, "Count Text");
    ok(
      count && boundVariableName(count.fills[0]) === "Category/OnFill/Yellow",
      "the digits in the fill's ink",
    );
    const clear = named(component, "Clear Button");
    ok(
      clear &&
        clear.width === 32 &&
        clear.height === 32 &&
        clear.fills.length === 0,
      "a 32 clear with no fill",
    );
    const cross = clear && named(clear, "Clear Icon");
    const crossVector =
      cross && cross.findOne((node) => node.type === "VECTOR");
    ok(
      cross &&
        cross.width === 16 &&
        crossVector &&
        boundVariableName(crossVector.strokes[0]) === "Colors/foreground/0",
      "the clear's cross is a 16 x-close in the foreground",
    );
    ok(
      stats.warnings.length === 0,
      `no warnings (${stats.warnings.join(" | ")})`,
    );
  }

  if (typeof plugin.updateCategoryFieldVariant === "function") {
    const { component } = await paint("Theme");
    const pill = named(component, "Count Pill");
    const count = named(component, "Count Text");
    ok(
      pill &&
        boundVariableName(pill.fills[0]) ===
          "Primary Buttons/themed/button/background/idle" &&
        count &&
        boundVariableName(count.fills[0]) ===
          "Primary Buttons/themed/button/foreground/content/idle",
      "theme: the pill is the themed button's fill and ink",
    );
    // The accent is an edge and an icon on the surface: the theme's 600, as
    // React's CategoryField draws it (decision 59).
    ok(
      boundVariableName(component.strokes[0]) === "Colors/theme/600",
      `theme: the border in the theme's 600 (${boundVariableName(component.strokes[0])})`,
    );
  }

  if (typeof plugin.configureCategoryFieldProperties === "function") {
    const variants = [];
    for (const tint of ["Theme", "Red"]) {
      const { component } = await paint(tint);
      variants.push(component);
    }
    const set = figma.combineAsVariants(variants, figma.currentPage);
    set.name = "CategoryField";
    const stats = freshStats();
    await plugin.configureCategoryFieldProperties(set, stats);
    const definitions = set.componentPropertyDefinitions;
    const byBase = (base, type) =>
      Object.keys(definitions).find(
        (key) => key.split("#")[0] === base && definitions[key].type === type,
      );
    const showCount = byBase("Show Count", "BOOLEAN");
    const iconProperty = byBase("Icon", "INSTANCE_SWAP");
    ok(
      showCount && definitions[showCount].defaultValue === true,
      "a Show Count boolean, on by default",
    );
    ok(
      byBase("Label Text", "TEXT") && byBase("Count Text", "TEXT"),
      "Label Text and Count Text properties",
    );
    ok(iconProperty, "an Icon instance-swap property");
    const pill = named(variants[1], "Count Pill");
    ok(
      pill &&
        pill.componentPropertyReferences &&
        pill.componentPropertyReferences.visible === showCount,
      "the pill's visibility is Show Count",
    );
    const icon = named(variants[1], "Icon");
    ok(
      icon &&
        icon.componentPropertyReferences &&
        icon.componentPropertyReferences.mainComponent === iconProperty,
      "the icon swaps through Icon",
    );
    set.remove();
  }
}

// --- BrowseCategoriesPanel ----------------------------------------------------

section("BrowseCategoriesPanel");
{
  const categories = [
    ["Wayfinding", "Green", "6"],
    ["Check-in", "Turquoise", "14"],
    ["Secure Areas", "Red", "5"],
    ["Nearby", "Yellow", "88"],
    ["Information", "Blue", "9"],
    ["Parking & Ground Transport", "Navy", "22"],
    ["Favourites", "Orange", "37"],
    ["Shopping", "Pink", "41"],
  ];
  // A CategoryTile set for the panel to instance, painted by the plugin itself.
  const tiles = [];
  ok(
    Array.isArray(plugin.CATEGORY_TINTS) &&
      typeof plugin.updateCategoryTileVariant === "function" &&
      typeof plugin.configureCategoryTileProperties === "function",
    "a CategoryTile with a Tint axis to instance",
  );
  for (const tint of plugin.CATEGORY_TINTS || []) {
    const component = figma.createComponent();
    await plugin.updateCategoryTileVariant(component, {
      props: { state: "Default", tint },
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    tiles.push(component);
  }
  const tileSet = figma.combineAsVariants(tiles, figma.currentPage);
  tileSet.name = "CategoryTile";
  for (const variant of tiles) {
    variant.variantProperties = Object.fromEntries(
      variant.name.split(",").map((part) => part.trim().split("=")),
    );
  }
  if (typeof plugin.configureCategoryTileProperties === "function") {
    await plugin.configureCategoryTileProperties(tileSet, freshStats());
  }

  figma.currentPage = figma.root.children[0];

  const component = figma.createComponent();
  const stats = freshStats();
  await plugin.updateBrowseCategoriesPanelVariant(component, {
    value: "Basic",
    variableByName,
    fonts: FONTS,
    stats,
  });
  const grid = named(component, "Category Grid");
  ok(grid, "a Category Grid");
  const rows = grid
    ? grid.children.filter((row) => row.name.startsWith("Category Row"))
    : [];
  ok(
    rows.length === 2 && rows.every((row) => row.children.length === 4),
    "two rows of four",
  );
  // The prototype's grid, measured on 2026-09-22: row-gap 12px, column-gap
  // 8px. The rows were 8 apart until then.
  ok(
    grid &&
      grid.itemSpacing === 12 &&
      rows.every((row) => row.itemSpacing === 8),
    `rows 12 apart, columns 8 (rows ${grid && grid.itemSpacing}, columns ${rows.map((row) => row.itemSpacing).join("/")})`,
  );
  const instances = rows.flatMap((row) => row.children);
  ok(
    instances.length === 8 &&
      instances.every((tile) => tile.type === "INSTANCE"),
    "eight live CategoryTile instances",
  );
  categories.forEach(([label, tint, count], index) => {
    const tile = instances[index];
    const labelNode =
      tile && tile.findOne((node) => node.name === "Label Text");
    const digits = tile && tile.findOne((node) => node.name === "Counter Text");
    ok(
      tile &&
        tile.mainComponent &&
        tile.mainComponent.name === `State=Default, Tint=${tint}` &&
        labelNode &&
        labelNode.characters === label &&
        digits &&
        digits.characters === count,
      `tile ${index + 1} is ${label} in ${tint} with its count ${count} (got ${digits && digits.characters})`,
    );
  });
  // renderIcon's symbol: a curated Pointr icon, in the category's accent.
  const symbolNames = [
    "route",
    "qr-code-01",
    "lock-01",
    "navigation-pointer-01",
    "info-circle",
    "bus",
    "heart",
    "shopping-bag-02",
  ];
  categories.forEach(([label, tint], index) => {
    const icon =
      instances[index] &&
      instances[index].findOne(
        (node) => node.type === "INSTANCE" && node.name === "Icon",
      );
    const shapes = icon ? icon.findAll((node) => node.type === "VECTOR") : [];
    const tintOf = (shape) => {
      const paints = [];
      if (Array.isArray(shape.fills)) paints.push(...shape.fills);
      if (Array.isArray(shape.strokes)) paints.push(...shape.strokes);
      return paints.map(boundVariableName).filter(Boolean);
    };
    ok(
      icon &&
        icon.mainComponent &&
        icon.mainComponent.name === `Icon / ${symbolNames[index]}` &&
        shapes.length > 0 &&
        shapes.every((shape) =>
          tintOf(shape).includes(`Category/Accent/${tint}`),
        ),
      `${label}: the ${symbolNames[index]} symbol in Category/Accent/${tint} (${icon && icon.mainComponent && icon.mainComponent.name}; ${shapes.length} shape(s); ${shapes.map((shape) => tintOf(shape).join("+") || "untinted").join(", ")})`,
    );
  });
  const parking =
    instances[5] && instances[5].findOne((node) => node.name === "Label Text");
  ok(
    parking &&
      parking.maxLines === 2 &&
      parking.height === 2 * contract.categoryTile.content.labelLineHeight,
    `a long name takes the tile's two lines (got ${parking && parking.height} high, maxLines ${parking && parking.maxLines})`,
  );
  ok(
    instances.every((tile) => tile.isExposedInstance === true),
    "each tile is exposed",
  );
  ok(
    stats.warnings.length === 0,
    `no warnings (${stats.warnings.join(" | ")})`,
  );

  // No platform draws the label: React makes it the section's aria-label,
  // SwiftUI its .accessibilityLabel, Compose its contentDescription. Figma drew
  // it as a 16/24 title over the grid until 2026-09-22. The layer stays,
  // hidden, bound to Panel Label Text, which Code Connect reads as `label`.
  const panels = [];
  for (const value of ["Basic", "Search", "Empty"]) {
    const panel = figma.createComponent();
    await plugin.updateBrowseCategoriesPanelVariant(panel, {
      value,
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    panel.name = `Content=${value}`;
    panels.push(panel);
  }
  const panelSet = figma.combineAsVariants(panels, figma.currentPage);
  panelSet.name = "BrowseCategoriesPanel";
  await plugin.configureBrowseCategoriesPanelProperties(panelSet, freshStats());
  const property = Object.keys(panelSet.componentPropertyDefinitions).find(
    (key) => key.split("#")[0] === "Panel Label Text",
  );
  for (const panel of panels) {
    const label = panel.children.find(
      (child) => child.name === "Panel Label Text",
    );
    ok(
      Boolean(
        label &&
        label.type === "TEXT" &&
        label.visible === false &&
        property &&
        label.componentPropertyReferences &&
        label.componentPropertyReferences.characters === property,
      ),
      `${panel.name}: the label layer is hidden and bound to Panel Label Text`,
    );
    ok(
      !panel.findOne(
        (node) =>
          node.type === "TEXT" &&
          node.visible !== false &&
          node.characters === "Browse categories",
      ),
      `${panel.name}: no visible title`,
    );
    const content = panel.children.find((child) => child.name === "Content");
    ok(
      Boolean(
        content &&
        content.paddingTop === 16 &&
        content.paddingLeft === 16 &&
        content.children.length === 1 &&
        content.children[0].name ===
          (panel.name === "Content=Empty"
            ? "Empty State Slot"
            : "Category Grid"),
      ),
      `${panel.name}: the grid or the empty state, padded 16 (p-4)`,
    );
  }
  const [basic, search] = panels;
  ok(
    !basic.findOne(
      (node) => node.name === "Search Header" || node.name === "Divider",
    ),
    "Basic: no search header and no rule",
  );
  const header = search.children.find(
    (child) => child.name === "Search Header",
  );
  const rule = search.children[search.children.indexOf(header) + 1];
  ok(
    Boolean(
      header &&
      header.paddingTop === 16 &&
      header.paddingLeft === 16 &&
      header.children.length === 1 &&
      header.children[0].name === "Search Slot" &&
      rule &&
      rule.name === "Divider" &&
      rule.height === 1 &&
      rule.layoutSizingHorizontal === "FILL" &&
      boundVariableName(rule.fills[0]) === "Border/Subtle" &&
      search.children[search.children.indexOf(rule) + 1].name === "Content",
    ),
    "Search: the search slot in a header padded 16, a 1px Border/Subtle rule, then the grid (border-b p-4)",
  );
  panelSet.remove();
  tileSet.remove();
}

// --- A set runs after the sets it reaches into --------------------------------------

// An Update draws a set's layers anew, under new ids, and Figma keeps an
// override against the id of the layer it changes. On 2026-09-22 the Product /
// SDK run updated BrowseCategoriesPanel, then CategoryTile, and every tile in
// the panel read the Counter's default 12. The map of who writes inside whom
// must cover what the painters do; each bulk run must honour it; and an Update
// that leaves a dependent behind must name it.
section("A set runs after the sets it reaches into");
{
  const map = plugin.SETS_THAT_OVERRIDE_INSIDE;
  ok(map && typeof map === "object", "SETS_THAT_OVERRIDE_INSIDE is declared");
  const core = (plugin.CORE_UPDATE_SEQUENCE || []).map(([name]) => name);
  const product = (plugin.PRODUCT_SDK_UPDATE_SEQUENCE || []).map(
    ([name]) => name,
  );

  // Every painter that finds a layer inside a nested instance and writes to it,
  // read from code.js, so a new one fails here until it is named below and in
  // the map.
  const lines = fs.readFileSync(PLUGIN, "utf8").split("\n");
  const enclosing = (index) => {
    for (let i = index; i >= 0; i -= 1) {
      const fn = lines[i].match(/^(?:async )?function ([A-Za-z0-9_]+)\(/);
      if (fn) return fn[1];
    }
    return null;
  };
  const writersFound = new Set();
  lines.forEach((line, index) => {
    // A declaration prettier breaks after its `=` continues on the next line.
    const joined = /=\s*$/.test(line)
      ? `${line} ${(lines[index + 1] || "").trim()}`
      : line;
    const found = joined.match(
      /const ([A-Za-z0-9_]+) =\s*([A-Za-z0-9_.]+)\.findOne\(/,
    );
    if (!found) return;
    const next = lines.slice(index, index + 30).join("\n");
    // A write by assignment, or through a helper that paints what it is given.
    const write = new RegExp(
      `\\b${found[1]}\\.(characters|setProperties|fills|strokes|visible|fontSize)\\s*[=(]` +
        `|\\b(applyIconColorOverrides|scaleIconStrokes|setTranslucentTokenPaint)\\(\\s*${found[1]}\\b`,
    );
    if (write.test(next)) writersFound.add(enclosing(index));
  });
  // painter: [the set whose layer it writes, the set it paints]
  const reaches = {
    browseCategoriesPanelTile: ["CategoryTile", "BrowseCategoriesPanel"],
    setBrowseCategoriesPanelTileIcon: ["CategoryTile", "BrowseCategoriesPanel"],
    updateCategoryTileVariant: ["Counter", "CategoryTile"],
    // Close's x-close, tinted again after the swap.
    retintTourStepCloseIcon: ["IconButton", "TourStep"],
    // GAP-169: the header action's pencil, tinted again after the swap.
    retintCardHeaderActionIcon: ["IconButton", "Card"],
    // One helper, every shell that composes a navigation row: the writer is a
    // list, not a name.
    retintNavigationItemLeadingIcon: ["NavigationItem", ["Navbar", "Sidebar"]],
  };
  ok(
    [...writersFound].sort().join(",") ===
      Object.keys(reaches).sort().join(","),
    `the painters that write inside a nested instance are the ones named here (found: ${[...writersFound].join(", ")})`,
  );
  for (const [painter, [inside, writer]] of Object.entries(reaches)) {
    for (const one of Array.isArray(writer) ? writer : [writer]) {
      ok(
        Boolean(map) && (map[inside] || []).includes(one),
        `${one} is listed as writing inside ${inside} (${painter})`,
      );
    }
  }
  for (const [inside, writers] of Object.entries(map || {})) {
    for (const writer of writers) {
      const run =
        core.includes(inside) && core.includes(writer)
          ? core
          : product.includes(inside) && product.includes(writer)
            ? product
            : null;
      if (run) {
        ok(
          run.indexOf(inside) < run.indexOf(writer),
          `${writer} runs after ${inside} in their bulk update`,
        );
      } else {
        ok(
          core.includes(inside) && product.includes(writer),
          `${inside} is Core and ${writer} Product / SDK, so Core first holds the order`,
        );
      }
    }
  }

  if (typeof plugin.setsToUpdateAfter === "function") {
    ok(
      plugin.setsToUpdateAfter(["Counter"]).join(",") ===
        "CategoryTile,BrowseCategoriesPanel",
      "after Counter: CategoryTile, then BrowseCategoriesPanel",
    );
    ok(
      plugin.setsToUpdateAfter(["CategoryTile"]).join(",") ===
        "BrowseCategoriesPanel",
      "after CategoryTile: BrowseCategoriesPanel",
    );
    // Both, or the set an Update of IconButton leaves out loses its re-tint.
    ok(
      [...plugin.setsToUpdateAfter(["IconButton"])].sort().join(",") ===
        "Card,TourStep",
      `after IconButton: TourStep and Card (${plugin.setsToUpdateAfter(["IconButton"]).join(", ")})`,
    );
  } else ok(false, "setsToUpdateAfter is reachable");
  if (typeof plugin.noteSetsToUpdateNext === "function") {
    const tile = { updated: true, warnings: [] };
    plugin.noteSetsToUpdateNext("CategoryTile", tile);
    ok(
      tile.warnings.length === 1 &&
        tile.warnings[0].startsWith("Next, update BrowseCategoriesPanel:") &&
        tile.warnings[0].endsWith(
          "Update All Product / SDK runs them in this order.",
        ),
      `CategoryTile's Update names the panel next (${tile.warnings.join(" | ")})`,
    );
    const counter = { updated: true, warnings: [] };
    plugin.noteSetsToUpdateNext("Counter", counter);
    ok(
      counter.warnings.length === 1 &&
        counter.warnings[0].startsWith(
          "Next, update CategoryTile, then BrowseCategoriesPanel:",
        ),
      `Counter's Update names CategoryTile, then the panel (${counter.warnings.join(" | ")})`,
    );
    const missing = { updated: false, warnings: [] };
    plugin.noteSetsToUpdateNext("CategoryTile", missing);
    ok(
      missing.warnings.length === 0,
      "a set that was not updated names nothing",
    );
  } else ok(false, "noteSetsToUpdateNext is reachable");
  for (const [fn, name] of [
    ["updateCategoryTileComponent", "CategoryTile"],
    ["updateCounterComponent", "Counter"],
    ["updateIconButtonComponent", "IconButton"],
  ]) {
    ok(
      typeof plugin[fn] === "function" &&
        plugin[fn].toString().includes(`noteSetsToUpdateNext("${name}"`),
      `${fn} names what to update next`,
    );
  }
  ok(
    typeof plugin.runUpdateSequence === "function" &&
      plugin.runUpdateSequence.toString().includes("updateNextWarning(") &&
      plugin.runUpdateSequence.toString().includes("updatedNames"),
    "a bulk run names the sets it leaves to the other run",
  );
}

// --- Content fits the box it is drawn in -------------------------------------------------

// Two reported findings of figma:verify, from before 2026-09-20: Dialog's and
// Drawer's primary action labels, 94 wide in a 90 box, because the width came
// from 7.5 a character; and DynamicIsland's 24 slots at 26. Those were first
// put down to a label fit that left the stroke no room, and fitting the label
// closer did not move them: each slot was given 12 above and below and then
// its stroke before the fit cut the padding, and the runtime grows a frame
// its padding and stroke outgrow and never shrinks it back (see
// AUTO_LAYOUT_BOX_FIELDS in the harness).
section("Content fits the box it is drawn in");
{
  if (typeof plugin.setDialogFooterActionSizing === "function") {
    // A Button instance as the footer holds it: auto layout, its padding, and
    // a label layer that sizes itself to "Save changes" at 14.
    const footer = figma.createFrame();
    footer.layoutMode = "HORIZONTAL";
    for (const [size, paddingX] of [
      ["Large", 32],
      ["Default", 16],
    ]) {
      const action = new MockNode("INSTANCE", "Primary Action");
      action.layoutMode = "HORIZONTAL";
      action.itemSpacing = 8;
      action.paddingLeft = paddingX;
      action.paddingRight = paddingX;
      const label = figma.createText();
      label.name = "Label Text";
      label.fontSize = 14;
      label.characters = "Save changes";
      const icon = new MockNode("INSTANCE", "Icon");
      icon.visible = false;
      action.appendChild(icon);
      action.appendChild(label);
      footer.appendChild(action);
      plugin.setDialogFooterActionSizing(action, "Save changes", size);
      ok(
        action.width - 2 * paddingX >= label.width,
        `${size}: "Save changes" (${label.width}) fits its button's content box (${action.width - 2 * paddingX})`,
      );
    }
    footer.remove();
  } else ok(false, "setDialogFooterActionSizing is reachable");

  if (typeof plugin.updateDynamicIslandVariant === "function") {
    for (const [value, count] of [
      ["Compact", 2],
      ["Minimal", 1],
      ["Expanded", 1],
    ]) {
      const component = figma.createComponent();
      const stats = freshStats();
      await plugin.updateDynamicIslandVariant(component, {
        value,
        variableByName,
        fonts: FONTS,
        stats,
      });
      const slots = component.children.filter((child) =>
        child.name.endsWith("Slot"),
      );
      ok(
        slots.length === count,
        `${value}: ${count} slot(s) (${slots.length})`,
      );
      for (const slot of slots) {
        const asked = slot.requestedSize || {};
        ok(
          slot.width === asked.width && slot.height === asked.height,
          `${value} ${slot.name}: ${slot.width}×${slot.height}, the ${asked.width}×${asked.height} it was drawn at`,
        );
        const content = slot.children[0];
        const needs =
          (content ? content.height : 0) +
          slot.paddingTop +
          slot.paddingBottom +
          2 * slot.strokeWeight;
        ok(
          needs <= slot.height,
          `${value} ${slot.name}: content, padding and stroke take ${needs} of ${slot.height}`,
        );
      }
      ok(
        !stats.warnings.some((warning) =>
          /where it was drawn at/.test(warning),
        ),
        `${value}: no slot reports a size it was not drawn at (${stats.warnings.join(" | ")})`,
      );
    }
  } else ok(false, "updateDynamicIslandVariant is reachable");
}

// --- DynamicIsland ---------------------------------------------------------------

// The set says it is generated from the React DynamicIsland API, and it was
// drawn at 240×48, 360×180 and 64×48 at 24 while React and Compose draw a
// 240×44 pill, a 360×160 card at 32 and a 56 circle. The sizes are read from
// the React source, so the two cannot part again without this failing.
section("DynamicIsland");
{
  const react = fs.readFileSync(
    path.join(
      ROOT,
      "packages/react/src/components/DynamicIsland/DynamicIsland.tsx",
    ),
    "utf8",
  );
  const width = react.match(
    /width:\s*islandState === "expanded"\s*\?\s*"calc\(100vw - 32px\)"\s*:\s*islandState === "minimal"\s*\?\s*(\d+)\s*:\s*(\d+),\s*maxWidth:\s*(\d+)/,
  );
  const height = react.match(
    /height:\s*islandState === "expanded"\s*\?\s*(\d+)\s*:\s*islandState === "minimal"\s*\?\s*(\d+)\s*:\s*(\d+)/,
  );
  const radius = react.match(
    /borderRadius:\s*islandState === "expanded"\s*\?\s*(\d+)\s*:\s*(\d+)/,
  );
  ok(
    Boolean(width && height && radius),
    "the React island's width, height and radius are readable",
  );
  if (width && height && radius) {
    // CSS clamps a radius to half the shorter side; Figma draws the clamp.
    const pill = (h) => Math.min(Number(radius[2]), h / 2);
    const expected = {
      Compact: [Number(width[2]), Number(height[3])],
      Expanded: [Number(width[3]), Number(height[1])],
      Minimal: [Number(width[1]), Number(height[2])],
    };
    for (const [value, [w, h]] of Object.entries(expected)) {
      const component = figma.createComponent();
      await plugin.updateDynamicIslandVariant(component, {
        value,
        variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      const r = value === "Expanded" ? Number(radius[1]) : pill(h);
      ok(
        component.width === w &&
          component.height === h &&
          component.cornerRadius === r,
        `${value}: ${component.width}×${component.height} at ${component.cornerRadius}, as React draws it (${w}×${h} at ${r})`,
      );
    }
  }

  // One glyph, placed as an icon: a typed "•" is what figma:verify reports
  // as a character where an icon belongs.
  const minimal = figma.createComponent();
  await plugin.updateDynamicIslandVariant(minimal, {
    value: "Minimal",
    variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  const slot = named(minimal, "Minimal Content Slot");
  const glyph = slot && slot.children[0];
  const vector = glyph && glyph.findOne((node) => node.type === "VECTOR");
  ok(
    Boolean(
      glyph &&
      glyph.type === "INSTANCE" &&
      slot.children.length === 1 &&
      !minimal.findOne((node) => node.type === "TEXT") &&
      vector &&
      boundVariableName(vector.strokes[0]) === "Colors/foreground/400",
    ),
    `Minimal: the slot holds one icon instance tinted foreground/400, and no text (${glyph ? glyph.type + " " + glyph.name : "empty"})`,
  );
  ok(
    Boolean(
      glyph &&
      glyph.width === 16 &&
      slot.primaryAxisAlignItems === "CENTER" &&
      slot.counterAxisAlignItems === "CENTER" &&
      slot.paddingLeft + slot.paddingRight + 16 + 2 <= slot.width &&
      slot.paddingTop + slot.paddingBottom + 16 + 2 <= slot.height &&
      slot.cornerRadius === slot.width / 2,
    ),
    `Minimal: a 16 icon centred in a ${slot && slot.width} circle (padding ${slot && [slot.paddingTop, slot.paddingLeft].join("/")}, radius ${slot && slot.cornerRadius})`,
  );
}

// --- The decisions of 2026-09-22: panels, the island's theme, the stepper --------

// The four cards that float over the map are the panel role, 24, as SwiftUI and
// Compose draw them and React since the same day; they were the container, 20.
// Their slots nest in the panel: 24 less the 13 a slot sits in by, not 7.
section("Map cards on the panel radius");
{
  const cards = [
    ["RouteSummary", "updateRouteSummaryVariant", "Preview"],
    ["RoutingInputGroup", "updateRoutingInputGroupVariant", "TwoPoints"],
    ["SaveLocationCard", "updateSaveLocationCardVariant", "Default"],
    ["FeedbackCard", "updateFeedbackCardVariant", "Default"],
  ];
  const tokens = payloadVariables([...variableByName.keys()]);
  const panel = plugin.KOZMOS_RADIUS.panel;
  const slotRadius = plugin.nestedRadius(panel, plugin.PRODUCT_SDK_CARD_INSET);
  const stale = plugin.nestedRadius(
    plugin.KOZMOS_RADIUS.container,
    plugin.PRODUCT_SDK_CARD_INSET,
  );
  for (const [name, painter, value] of cards) {
    const component = figma.createComponent();
    await plugin[painter](component, {
      value,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const radii = component
      .findAll((node) => node !== component && node.cornerRadius > 0)
      .map((node) => node.cornerRadius);
    ok(
      component.cornerRadius === panel && !radii.includes(stale),
      `${name}: the card at ${component.cornerRadius} (panel ${panel}), no slot left at the container's ${stale}${radii.includes(slotRadius) ? `; slots at ${slotRadius}` : ""}`,
    );
  }
}

// The island is black in both themes, as the device's is, and what sits in it
// reads the dark theme: the set takes the Dark mode of every Kozmos collection
// and no other, and the pill is Surface/0. It bound Colors/foreground/1000 —
// white in the Kozmos light ramp — with a near-black fallback.
section("DynamicIsland's own theme");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const product = {
    id: "Primitive Tokens",
    name: "Primitive Tokens",
    modes: [{ modeId: "product-dark", name: "Dark" }],
  };
  const themedFigma = createFigmaMock({
    pages: pages(),
    collections: [...tokens.collections, product],
  });
  const themed = loadPlugin({ pluginPath: PLUGIN, figma: themedFigma });
  const island = themedFigma.createComponent();
  await themed.updateDynamicIslandVariant(island, {
    value: "Compact",
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  const kozmos = tokens.collections.map((collection) => collection.id);
  const modes = island.explicitVariableModes;
  ok(
    kozmos.every((id) => modes[id] === "dark") && !(product.id in modes),
    `the island takes Dark in every Kozmos collection and no other (${JSON.stringify(modes)})`,
  );
  ok(
    boundVariableName(island.fills[0]) === "Surface/0",
    `the pill is Surface/0 (${boundVariableName(island.fills[0])})`,
  );
}

// The stepper's accent is React's primary, theme/600, as the natives draw it
// since the same day, and a completed step's ring is its fill's colour; the
// pending connector is the border role at its own strength. A completed step
// is a prominent fill (decision 59): the theme fill, ring and disc, with its
// check in the theme foreground. The current step's ring stays a border on the
// surface, 600, and the connector a line, as Progress is.
section("Stepper accent");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const step = async (index) =>
    plugin.createStepperStepItem({
      index,
      label: "Step",
      currentIndex: 1,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
  const indicator = (item) =>
    item.findOne((node) => node.name.endsWith("Indicator"));
  const [completed, current, pending] = [
    await step(0),
    await step(1),
    await step(2),
  ].map(indicator);
  ok(
    boundVariableName(completed.fills[0]) ===
      "Primary Buttons/themed/button/background/idle" &&
      boundVariableName(completed.strokes[0]) ===
        "Primary Buttons/themed/button/background/idle",
    `a completed step is the theme fill, ring and disc (${boundVariableName(completed.fills[0])}, ${boundVariableName(completed.strokes[0])})`,
  );
  const check = completed.findOne((node) => node.name === "Completed Icon");
  ok(
    check &&
      check.getSharedPluginData(plugin.RUN_NAMESPACE, "foreground-token") ===
        "Primary Buttons/themed/button/foreground/content/idle",
    `its check is the theme foreground (${check && check.getSharedPluginData(plugin.RUN_NAMESPACE, "foreground-token")})`,
  );
  ok(
    boundVariableName(current.strokes[0]) === "Colors/theme/600" &&
      current.strokeWeight === 2,
    `the current step's ring is theme/600 at 2 (${boundVariableName(current.strokes[0])} at ${current.strokeWeight})`,
  );
  ok(
    boundVariableName(pending.strokes[0]) === "Colors/foreground/500" &&
      pending.strokeWeight === 1,
    `a pending step's ring is foreground/500 at 1 (${boundVariableName(pending.strokes[0])} at ${pending.strokeWeight})`,
  );
  const connector = (active) =>
    plugin.createStepperConnector({
      index: 0,
      active,
      variableByName: tokens.variableByName,
      stats: freshStats(),
    });
  const [done, ahead] = [connector(true), connector(false)];
  ok(
    boundVariableName(done.fills[0]) === "Colors/theme/600" &&
      boundVariableName(ahead.fills[0]) === "Border/Subtle" &&
      ahead.opacity === 1,
    `the connectors are theme/600 and Border/Subtle at full strength (${boundVariableName(ahead.fills[0])} at ${ahead.opacity})`,
  );
}

// GAP-191: Stepper's Variant axis and a Count to 8. Dots draws a tour's
// progress as React does: one dot per step, done and pending 8 by 8 and the
// current one 20 by 8, 6 apart, done and current the theme fill and pending
// foreground/500. Numbered draws five to eight steps as it drew four. A
// variant named before the axis existed parses as Numbered, so Update
// renames it; a Current past its Count is skipped; the set never overlaps.
section("Stepper dots, and Count to 8 (GAP-191)");
{
  const ready =
    Array.isArray(plugin.STEPPER_VARIANTS) &&
    typeof plugin.stepperVariantCombinations === "function" &&
    typeof plugin.updateStepperDotsVariant === "function";
  ok(ready, "Stepper has a Variant axis, its combinations and a dots painter");
  if (ready) {
    const tokens = payloadVariables([...variableByName.keys()]);
    const combinations = plugin.stepperVariantCombinations();
    const counts = [...new Set(combinations.map((c) => c.count))];
    ok(
      JSON.stringify(plugin.STEPPER_VARIANTS) ===
        JSON.stringify(["Numbered", "Dots"]) &&
        JSON.stringify(counts) ===
          JSON.stringify(["2", "3", "4", "5", "6", "7", "8"]) &&
        combinations.length === 70 &&
        combinations.every((c) => Number(c.current) <= Number(c.count)),
      `Numbered and Dots, each at Count 2 to 8 with every Current up to it: 70 variants (${combinations.length}, counts ${counts.join(" ")})`,
    );
    const parsed = [
      "Count=3, Current=2",
      "Variant=Dots, Count=5, Current=2",
      "Variant=Dots, Count=5, Current=6",
      "Variant=Bars, Count=3, Current=1",
    ].map((name) => plugin.parseStepperVariantName(name));
    ok(
      JSON.stringify(parsed) ===
        JSON.stringify([
          { variant: "Numbered", count: "3", current: "2" },
          { variant: "Dots", count: "5", current: "2" },
          null,
          null,
        ]),
      `a variant from before the axis parses as Numbered; a Current past its Count, or an unknown Variant, is not one (${JSON.stringify(parsed)})`,
    );

    const dots = await plugin.createStepperVariant({
      variant: "Dots",
      count: "5",
      current: "2",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const marks = dots.children || [];
    ok(
      dots.name === "Variant=Dots, Count=5, Current=2" &&
        dots.layoutMode === "HORIZONTAL" &&
        dots.itemSpacing === 6 &&
        dots.counterAxisAlignItems === "CENTER" &&
        dots.fills.length === 0 &&
        dots.width === 4 * 8 + 4 * 6 + 20 &&
        dots.height === 8 &&
        marks.length === 5,
      `Dots is a row of 5, 6 apart, 76 by 8, with no fill of its own (${dots.name}, ${dots.layoutMode}, ${dots.itemSpacing}, ${dots.width} by ${dots.height}, ${marks.length} dots)`,
    );
    ok(
      JSON.stringify(marks.map((m) => [m.width, m.height])) ===
        JSON.stringify([
          [8, 8],
          [20, 8],
          [8, 8],
          [8, 8],
          [8, 8],
        ]) && marks.every((m) => m.cornerRadius === 9999),
      `done and pending dots are 8 by 8 and the current one 20 by 8, all pills (${JSON.stringify(marks.map((m) => [m.width, m.height]))})`,
    );
    const paints = marks.map((m) => boundVariableName(m.fills[0]));
    ok(
      JSON.stringify(paints) ===
        JSON.stringify([
          "Primary Buttons/themed/button/background/idle",
          "Primary Buttons/themed/button/background/idle",
          "Colors/foreground/500",
          "Colors/foreground/500",
          "Colors/foreground/500",
        ]),
      `done and current are the theme fill, pending foreground/500 (${paints.join(", ")})`,
    );
    ok(
      marks.map((m) => m.name).join() ===
        "Step 1 Dot,Step 2 Dot,Step 3 Dot,Step 4 Dot,Step 5 Dot",
      "each dot is named by its step",
    );

    const eight = await plugin.createStepperVariant({
      variant: "Numbered",
      count: "8",
      current: "5",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const items = (eight.children || []).filter((c) =>
      /^Step \d+$/.test(c.name),
    );
    const labels = items.map((item) =>
      (item.children || []).find((c) => /Text$/.test(c.name)),
    );
    ok(
      eight.name === "Variant=Numbered, Count=8, Current=5" &&
        items.length === 8 &&
        labels.every(
          (label, i) => label && label.name === `Step ${i + 1} Text`,
        ) &&
        eight.width === 8 * 88 + 7 * 92,
      `Numbered draws 8 steps, each with its Step N Text, ${8 * 88 + 7 * 92} wide (${eight.name}, ${items.length} steps, ${eight.width})`,
    );

    const set = new MockNode("COMPONENT_SET", "Stepper");
    for (const props of combinations) {
      const variant = await plugin.createStepperVariant({
        ...props,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      set.appendChild(variant);
    }
    plugin.layoutStepperVariants(set);
    const boxes = set.children.map((c) => [
      c.x,
      c.y,
      c.x + c.width,
      c.y + c.height,
      c.name,
    ]);
    const overlaps = [];
    for (let i = 0; i < boxes.length; i += 1)
      for (let j = i + 1; j < boxes.length; j += 1) {
        const [a, b] = [boxes[i], boxes[j]];
        if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3])
          overlaps.push(`${a[4]} / ${b[4]}`);
      }
    ok(
      overlaps.length === 0,
      `the laid-out set has no two variants overlapping (${overlaps.slice(0, 3).join("; ")})`,
    );

    // Update, run over the set as it is in the file today: main's nine
    // variants, named before the Variant axis existed. Each must be renamed
    // in place, its node id kept (Code Connect pins the set, and instances
    // pin their variant), and the other 61 created beside them.
    const oldNames = [];
    for (const count of [2, 3, 4])
      for (let current = 1; current <= count; current += 1)
        oldNames.push(`Count=${count}, Current=${current}`);
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "Stepper");
    const oldIds = {};
    for (const name of oldNames) {
      const variant = new MockNode("COMPONENT", name);
      liveSet.appendChild(variant);
      oldIds[name] = variant.id;
    }
    livePage.appendChild(liveSet);
    const setId = liveSet.id;
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({
        pages: [livePage, new MockNode("PAGE", "Icons")],
      }),
      // The file's variables and fonts stand in as they do elsewhere here;
      // what is measured is which nodes Update keeps, renames and adds.
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await updatePlugin.updateStepperComponent();
    const byId = new Map(liveSet.children.map((child) => [child.id, child]));
    const renamed = oldNames.map((name) => byId.get(oldIds[name]));
    const names = liveSet.children.map((child) => child.name);
    ok(
      updated.updated === true &&
        updated.componentSetId === setId &&
        updated.variantsUpdated === 9 &&
        updated.variantsCreated === 61 &&
        liveSet.children.length === 70 &&
        new Set(names).size === 70,
      `Update keeps the set and its 9 variants, and adds 61: 70 in all, each named once (${updated.variantsUpdated} updated, ${updated.variantsCreated} created, ${liveSet.children.length} children)`,
    );
    ok(
      renamed.every(
        (variant, i) =>
          variant && variant.name === `Variant=Numbered, ${oldNames[i]}`,
      ),
      `each of the 9 keeps its node id and is renamed Variant=Numbered (${renamed.map((v) => (v ? v.name : "gone")).join("; ")})`,
    );
    const fourth = byId.get(oldIds["Count=4, Current=3"]);
    ok(
      fourth &&
        fourth.children.filter((child) => /^Step \d+$/.test(child.name))
          .length === 4,
      "a renamed variant is repainted in place: Count=4 still draws its 4 steps",
    );
  }
}

// --- Progress's ring (decision 131, GAP-038) -------------------------------------

// A count out of a total: Progress gains Shape (Linear, Circular), a ring's
// Size (Small 48, Medium 96, Large 128) and its Tone (owner, 28 Oct: a status
// ring, in Tag's emotions). The ring is a Dial holding a track and an arc,
// each an ellipse whose arc is filled, so neither is a disc inset in another;
// the arc is its tone's emotion text colour from 12 o'clock clockwise (Themed
// is theme 600, the bar's own fill), the track background/100, with the label
// in the hole and, hidden until Label Beside, the same label beside the dial.
// The Small ring at 100 draws a check in the hole instead of the label.
section("Progress's ring (decision 131, GAP-038)");
{
  const ready =
    Array.isArray(plugin.PROGRESS_FORMS) &&
    Array.isArray(plugin.PROGRESS_TONES) &&
    typeof plugin.updateProgressRingVariant === "function";
  ok(ready, "Progress has Shape, Size and Tone axes and a ring painter");
  if (ready) {
    const tokens = payloadVariables([...variableByName.keys()]);
    const TONES = [
      "Themed",
      "Neutral",
      "Success",
      "Danger",
      "Informative",
      "Alert",
    ];
    const axes = plugin.expectedVariantAxesForComponentSetName("Progress");
    ok(
      JSON.stringify(axes) ===
        JSON.stringify({
          Shape: ["Linear", "Circular"],
          Size: ["Small", "Medium", "Large"],
          Tone: TONES,
          Value: ["0", "25", "50", "75", "100"],
        }) && plugin.PROGRESS_FORMS.length === 19,
      `the set's axes are Shape, Size, Tone and Value, a bar and 18 rings a value (${JSON.stringify(axes)}, ${plugin.PROGRESS_FORMS.length} forms)`,
    );
    const parsed = [
      "Value=50",
      "Shape=Circular, Size=Large, Value=25",
      "Shape=Circular, Size=Large, Tone=Success, Value=25",
      "Shape=Linear, Size=Large, Value=25",
      "Shape=Linear, Size=Medium, Tone=Danger, Value=25",
      "Shape=Oval, Size=Medium, Value=25",
      "Shape=Circular, Size=Medium, Tone=Warning, Value=25",
      "Shape=Circular, Size=Medium, Value=30",
    ].map((name) => plugin.parseProgressVariantName(name));
    ok(
      JSON.stringify(parsed) ===
        JSON.stringify([
          { value: "50", second: "Linear/Medium/Themed" },
          { value: "25", second: "Circular/Large/Themed" },
          { value: "25", second: "Circular/Large/Success" },
          null,
          null,
          null,
          null,
          null,
        ]),
      `a variant from before the axes parses as the bar, a ring from before Tone as Themed; a sized or toned bar, an unknown Shape, Tone or Value is not one (${JSON.stringify(parsed)})`,
    );

    const ring = async (value, size, tone = "Themed") =>
      plugin.createProgressVariant({
        value,
        second: `Circular/${size}/${tone}`,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
    const close = (a, b) => Math.abs(a - b) < 1e-9;
    for (const [size, diameter, stroke] of [
      ["Small", 48, 4],
      ["Medium", 96, 8],
      ["Large", 128, 12],
    ]) {
      const variant = await ring("25", size);
      const dial = named(variant, "Dial");
      const track = dial && named(dial, "Ring Track");
      const arc = dial && named(dial, "Ring Arc");
      const label = dial && named(dial, "Label");
      const beside = (variant.children || []).find(
        (c) => c.name === "Label Beside",
      );
      const inner = 1 - (2 * stroke) / diameter;
      ok(
        variant.name ===
          `Shape=Circular, Size=${size}, Tone=Themed, Value=25` &&
          variant.layoutMode === "HORIZONTAL" &&
          variant.itemSpacing === 12 &&
          variant.counterAxisAlignItems === "CENTER" &&
          variant.fills.length === 0 &&
          (variant.children || []).map((c) => c.name).join() ===
            "Dial,Label Beside" &&
          dial &&
          dial.width === diameter &&
          dial.height === diameter &&
          (dial.children || []).map((c) => c.name).join() ===
            "Ring Track,Ring Arc,Label",
        `${size}: a row of the ${diameter} Dial, holding the track, the arc and the label, and the label beside it, 12 apart (${variant.name}, ${variant.layoutMode}, ${(variant.children || []).map((c) => c.name).join(", ")}; ${dial && (dial.children || []).map((c) => c.name).join(", ")})`,
      );
      ok(
        track &&
          arc &&
          track.type === "ELLIPSE" &&
          arc.type === "ELLIPSE" &&
          [track, arc].every(
            (node) =>
              node.width === diameter &&
              node.height === diameter &&
              node.x === 0 &&
              node.y === 0 &&
              node.strokes.length === 0 &&
              close(node.arcData.innerRadius, inner),
          ),
        `${size}: the track and the arc are both the whole ${diameter} circle, ${stroke} thick (inner radius ${inner.toFixed(4)}), filled, not stroked or inset (${track && JSON.stringify(track.arcData)}, ${arc && JSON.stringify(arc.arcData)})`,
      );
      ok(
        track &&
          arc &&
          close(track.arcData.startingAngle, 0) &&
          close(track.arcData.endingAngle, 2 * Math.PI) &&
          close(arc.arcData.startingAngle, -Math.PI / 2) &&
          close(arc.arcData.endingAngle, 0) &&
          arc.visible !== false,
        `${size}: the track is the whole turn; at 25 the arc runs from 12 o'clock a quarter turn clockwise (${arc && JSON.stringify(arc.arcData)})`,
      );
      ok(
        track &&
          arc &&
          boundVariableName(track.fills[0]) === "Colors/background/100" &&
          boundVariableName(arc.fills[0]) === "Emotion/themed/text",
        `${size}: the track is background/100 and a Themed arc the themed emotion's text, theme 600 as the bar's fill (${track && boundVariableName(track.fills[0])}, ${arc && boundVariableName(arc.fills[0])})`,
      );
      const width = Math.floor((diameter - 2 * stroke) * Math.SQRT1_2);
      ok(
        label &&
          label.type === "TEXT" &&
          label.width === width &&
          label.fontSize === 12 &&
          label.textAlignHorizontal === "CENTER" &&
          close(label.x, Math.round((diameter - width) / 2)) &&
          boundVariableName(label.fills[0]) === "Colors/foreground/0" &&
          beside &&
          beside.type === "TEXT" &&
          beside.fontSize === 12 &&
          beside.textAutoResize === "WIDTH_AND_HEIGHT" &&
          boundVariableName(beside.fills[0]) === "Colors/foreground/0",
        `${size}: the label is 12, centred, ${width} wide, inside the square the hole holds; the one beside is 12 and hugs its words; both foreground/0 (${label && [label.width, label.fontSize, label.x, label.textAlignHorizontal].join(", ")}; ${beside && beside.textAutoResize})`,
      );
    }
    for (const tone of TONES) {
      const variant = await ring("75", "Medium", tone);
      const arc = named(named(variant, "Dial"), "Ring Arc");
      ok(
        variant.name ===
          `Shape=Circular, Size=Medium, Tone=${tone}, Value=75` &&
          arc &&
          boundVariableName(arc.fills[0]) ===
            `Emotion/${tone.toLowerCase()}/text`,
        `${tone}: the arc is Emotion/${tone.toLowerCase()}/text (${variant.name}, ${arc && boundVariableName(arc.fills[0])})`,
      );
    }
    for (const [value, end, visible] of [
      ["0", null, false],
      ["50", Math.PI / 2, true],
      ["100", (3 * Math.PI) / 2, true],
    ]) {
      const arc = named(named(await ring(value, "Medium"), "Dial"), "Ring Arc");
      ok(
        arc &&
          arc.visible === visible &&
          (end === null || close(arc.arcData.endingAngle, end)),
        `at ${value} the arc is ${visible ? `drawn to ${(end / Math.PI).toFixed(2)}π` : "hidden: an arc whose ends meet would be a whole ring"} (${arc && arc.visible}, ${arc && JSON.stringify(arc.arcData)})`,
      );
    }
    // Owner, 2 Nov: "100%" is 31.8 wide at 12, in the 28.28 square a Small
    // hole holds, so the Small ring at 100 draws the check code draws with no
    // label: the Icons page's check at its own 24, in the ring's tone, where
    // the label was. Figma binds no inverse, so the label cannot stand behind
    // it, and Show Label has nothing to draw on those six variants.
    for (const tone of TONES) {
      const variant = await ring("100", "Small", tone);
      const dial = named(variant, "Dial");
      const check = dial && named(dial, "Done Check");
      const vector = check && check.findOne((n) => n.type === "VECTOR");
      ok(
        dial &&
          check &&
          check.type === "INSTANCE" &&
          check.mainComponent.name === "Icon / check" &&
          check.width === 24 &&
          check.height === 24 &&
          check.x === 12 &&
          check.y === 12 &&
          (dial.children || []).map((c) => c.name).join() ===
            "Ring Track,Ring Arc,Done Check" &&
          vector &&
          boundVariableName(vector.strokes[0]) ===
            `Emotion/${tone.toLowerCase()}/text`,
        `Small at 100, ${tone}: the check at 24, centred in the 48 dial where the label was, in Emotion/${tone.toLowerCase()}/text (${dial && (dial.children || []).map((c) => c.name).join(", ")}; ${check && [check.type, check.width, check.x, check.y].join(", ")}; ${vector && boundVariableName(vector.strokes[0])})`,
      );
    }
    for (const [value, size] of [
      ["75", "Small"],
      ["0", "Small"],
      ["100", "Medium"],
      ["100", "Large"],
    ]) {
      const dial = named(await ring(value, size), "Dial");
      ok(
        dial &&
          !named(dial, "Done Check") &&
          (dial.children || []).map((c) => c.name).join() ===
            "Ring Track,Ring Arc,Label",
        `${size} at ${value} keeps its label and draws no check (${dial && (dial.children || []).map((c) => c.name).join(", ")})`,
      );
    }
    // An Update over a ring from before: the label goes, the check comes,
    // and a second Update leaves one check, retinted.
    {
      const before = await ring("75", "Small");
      const stale = named(named(before, "Dial"), "Label");
      const again = () =>
        plugin.updateProgressRingVariant(before, {
          value: "100",
          size: "Small",
          tone: "Success",
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        });
      await again();
      await again();
      const dial = named(before, "Dial");
      const checks = (dial.children || []).filter(
        (c) => c.name === "Done Check",
      );
      const vector = checks[0] && checks[0].findOne((n) => n.type === "VECTOR");
      ok(
        stale &&
          !named(dial, "Label") &&
          checks.length === 1 &&
          vector &&
          boundVariableName(vector.strokes[0]) === "Emotion/success/text" &&
          named(before, "Label Beside"),
        `an Update over an older ring swaps its label for one check, and keeps the label beside (${(dial.children || []).map((c) => c.name).join(", ")}; ${vector && boundVariableName(vector.strokes[0])})`,
      );
    }
    // A ring drawn before the Dial held its parts directly on the variant.
    {
      const before = await ring("75", "Small");
      before.appendChild(named(named(before, "Dial"), "Label"));
      await plugin.updateProgressRingVariant(before, {
        value: "100",
        size: "Small",
        tone: "Themed",
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      ok(
        !named(before, "Label") && named(before, "Done Check"),
        `an Update over a ring from before the Dial leaves no label behind (${(before.children || []).map((c) => c.name).join(", ")})`,
      );
    }
    const bar = await plugin.createProgressVariant({
      value: "50",
      second: "Linear/Medium/Themed",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    ok(
      bar.name === "Shape=Linear, Size=Medium, Tone=Themed, Value=50" &&
        named(bar, "Progress Track") &&
        !named(bar, "Dial") &&
        !named(bar, "Label"),
      `the bar is drawn as before, named with its Shape, Size and Tone (${bar.name})`,
    );

    // Update over the set as it is in the file today: five bars, named
    // before the axes. Each keeps its node id and is renamed the Linear,
    // Medium, Themed bar; the 90 rings are created beside them, and the
    // label's properties bind every ring's two labels and nothing else.
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "Progress");
    const oldNames = ["0", "25", "50", "75", "100"].map((v) => `Value=${v}`);
    const oldIds = {};
    for (const name of oldNames) {
      const variant = new MockNode("COMPONENT", name);
      liveSet.appendChild(variant);
      oldIds[name] = variant.id;
    }
    livePage.appendChild(liveSet);
    const setId = liveSet.id;
    const liveIcons = new MockNode("PAGE", "Icons");
    liveIcons.appendChild(mockIconComponent("check"));
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({
        pages: [livePage, liveIcons],
      }),
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await updatePlugin.updateProgressComponent();
    const byId = new Map(liveSet.children.map((child) => [child.id, child]));
    const names = liveSet.children.map((child) => child.name);
    ok(
      updated.updated === true &&
        updated.componentSetId === setId &&
        updated.variantsUpdated === 5 &&
        updated.variantsCreated === 90 &&
        liveSet.children.length === 95 &&
        new Set(names).size === 95,
      `Update keeps the set and its 5 bars, and adds 90 rings: 95 in all, each named once (${updated.variantsUpdated} updated, ${updated.variantsCreated} created, ${liveSet.children.length} children)`,
    );
    ok(
      oldNames.every((name) => {
        const variant = byId.get(oldIds[name]);
        return (
          variant &&
          variant.name === `Shape=Linear, Size=Medium, Tone=Themed, ${name}` &&
          named(variant, "Progress Track")
        );
      }),
      `each bar keeps its node id, is renamed Shape=Linear, Size=Medium, Tone=Themed and repainted in place (${oldNames.map((name) => (byId.get(oldIds[name]) || { name: "gone" }).name).join("; ")})`,
    );
    const texts = (name) =>
      liveSet.findAll((node) => node.type === "TEXT" && node.name === name);
    const definitions = liveSet.componentPropertyDefinitions || {};
    const key = (base, type) =>
      Object.keys(definitions).find(
        (k) => k.split("#")[0] === base && definitions[k].type === type,
      );
    const textKey = key("Label", "TEXT");
    const showKey = key("Show Label", "BOOLEAN");
    const besideKey = key("Label Beside", "BOOLEAN");
    const inHole = texts("Label");
    const besides = texts("Label Beside");
    const checks = liveSet.findAll((node) => node.name === "Done Check");
    ok(
      inHole.length === 84 &&
        besides.length === 90 &&
        checks.length === 6 &&
        checks.every(
          (check) =>
            !check.componentPropertyReferences ||
            !check.componentPropertyReferences.visible,
        ) &&
        textKey &&
        showKey &&
        besideKey &&
        definitions[showKey].defaultValue === true &&
        definitions[besideKey].defaultValue === false &&
        inHole.every(
          (label) =>
            label.componentPropertyReferences &&
            label.componentPropertyReferences.characters === textKey &&
            label.componentPropertyReferences.visible === showKey,
        ) &&
        besides.every(
          (label) =>
            label.componentPropertyReferences &&
            label.componentPropertyReferences.characters === textKey &&
            label.componentPropertyReferences.visible === besideKey,
        ),
      `the rings' labels share Label: 84 in the hole, shown by Show Label (on), and 90 beside, by Label Beside (off); the six Small rings at 100 draw a check, bound to neither (${inHole.length} in the hole, ${besides.length} beside, ${checks.length} checks, ${textKey}, ${showKey}, ${besideKey})`,
    );
    const boxes = liveSet.children.map((c) => [
      c.x,
      c.y,
      c.x + c.width,
      c.y + c.height,
      c.name,
    ]);
    const overlaps = [];
    for (let i = 0; i < boxes.length; i += 1)
      for (let j = i + 1; j < boxes.length; j += 1) {
        const [a, b] = [boxes[i], boxes[j]];
        if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3])
          overlaps.push(`${a[4]} / ${b[4]}`);
      }
    ok(
      overlaps.length === 0,
      `the laid-out set has no two variants overlapping (${overlaps.slice(0, 3).join("; ")})`,
    );
  }
}

// GAP-188: TourStep, as React's TourStep draws it, the MAP-64 design's card
// (decision 136). Popover's surface 372 wide (432 for the welcome card), 16
// inside, sections 12 apart, no top edge; an Arrow 24 by 12 out of the flow
// above the card's middle; the header, which hugs the eyebrow (sentence case,
// the theme ink) 8 over the title, Heading 4, both wrapping before Close when
// there is one; Close, IconButton's Ghost with x-close in the ghost's ink, out
// of the flow in the card's top corner, its 16 icon ending on the padding and
// on the eyebrow's line, or the title's first with no eyebrow, taking no row;
// the body in the muted ink; the instruction as
// Notice draws it (its tone's fill at 5 % and edge at 50 % as layers, the
// Container corner, 8/12 inside, a 16 icon, cursor-02's outline for info and
// alert-triangle for the warning); the progress bar of the secondary fill
// with the theme ink to the step and the position beside it; Back, the
// secondary action, Next and the dismiss link live and exposed at Size Small,
// a disabled Next at 50 %. Content is the design's states; the properties
// each bind a layer; and the set is drawn from a file that holds the sets it
// nests, as Build and Update find them. The painters run inside
// `withAutoLayout`, so the numbers read here are the ones the file lays out:
// until 2026-11-01 this section read what the painter wrote, every assertion
// passed, and the Build drew labels out of their buttons, words out of the
// instruction and "2 of 4" over a full bar.
section("TourStep (GAP-188, decision 136)");
{
  const ready =
    Array.isArray(plugin.TOUR_STEP_CONTENT) &&
    typeof plugin.tourStepComponentConfig === "function" &&
    typeof plugin.updateTourStepVariant === "function";
  ok(ready, "TourStep has its Content axis, a planned set and a painter");
  if (ready) {
    ok(
      plugin.TOUR_STEP_CONTENT.join(",") ===
        "First step,Step,Last step,Warning,Coachmark,Welcome" &&
        JSON.stringify(
          plugin.expectedVariantAxesForComponentSetName("TourStep"),
        ) === JSON.stringify({ Content: plugin.TOUR_STEP_CONTENT }),
      "six variants: First step, Step, Last step, Warning, Coachmark and Welcome",
    );
    ok(
      plugin.CORE_UPDATE_SEQUENCE.map(([name]) => name).indexOf("TourStep") >
        Math.max(
          ...["Button", "IconButton", "Backdrop"].map((name) =>
            plugin.CORE_UPDATE_SEQUENCE.map(([n]) => n).indexOf(name),
          ),
        ),
      "Update All runs TourStep after the sets it nests",
    );
    // The pointer is drawn from the icons package's own outline.
    const generated = fs.readFileSync(
      path.join(ROOT, "packages/icons/src/pointr/icons.generated.ts"),
      "utf8",
    );
    const cursor = generated.match(
      /export const Cursor02 = \/\* @__PURE__ \*\/ createPointrIcon\("Cursor02", \[\s*\{\s*d: "([^"]+)"/,
    );
    ok(
      cursor && plugin.TOUR_STEP_POINTER_PATH === cursor[1],
      "the instruction's pointer is cursor-02's outline in packages/icons",
    );

    // The file: Button's Default, Ghost, Outline and Link at Small,
    // IconButton's Ghost and its Icon swap, x-close and alert-triangle on the
    // Icons page.
    // Size=Small as updateButtonVariant draws it: a fixed 96 by 44, 12 either
    // side, the label sizing itself and centred, the outline's stroke laid out.
    const labelled = (variant, name, key) => {
      variant.layoutMode = "HORIZONTAL";
      variant.primaryAxisSizingMode = "FIXED";
      variant.counterAxisSizingMode = "FIXED";
      variant.primaryAxisAlignItems = "CENTER";
      variant.counterAxisAlignItems = "CENTER";
      variant.itemSpacing = 8;
      variant.paddingLeft = 12;
      variant.paddingRight = 12;
      variant.resize(96, 44);
      if (name === "Outline") {
        variant.strokes = [
          { type: "SOLID", color: { r: 0, g: 0, b: 1 }, opacity: 1 },
        ];
      }
      const label = new MockNode("TEXT", "Label Text");
      label.fontSize = 14;
      label.lineHeight = { unit: "PIXELS", value: 20 };
      label.characters = "Button";
      label.componentPropertyReferences = { characters: key };
      variant.appendChild(label);
    };
    const button = mockComponentSet(
      "Button",
      ["Default", "Ghost", "Outline", "Link"].map((variant) => ({
        properties: { Variant: variant, Size: "Small", State: "Default" },
        build: (node) => labelled(node, variant, "Label Text#1:0"),
      })),
    );
    button.componentPropertyDefinitions = {
      "Label Text#1:0": { type: "TEXT", defaultValue: "Button" },
    };
    const plus = mockIconComponent("plus");
    const close = mockIconComponent("x-close");
    const warningMark = mockIconComponent("alert-triangle");
    // IconButton tints its Icon with the Ghost's ink, as configureIconButtonSlot
    // does: a swap takes that tint away with the layers it was laid on.
    const ghostInk = "Secondary Buttons/themed/button/foreground/content/idle";
    const iconButton = mockComponentSet("IconButton", [
      {
        properties: { Variant: "Ghost", Size: "Default", State: "Default" },
        build: (node) => {
          node.layoutMode = "HORIZONTAL";
          node.primaryAxisSizingMode = "FIXED";
          node.counterAxisSizingMode = "FIXED";
          node.resize(44, 44);
          const icon = plus.createInstance();
          icon.name = "Icon";
          icon.resize(16, 16);
          icon.componentPropertyReferences = { mainComponent: "Icon#2:0" };
          for (const layer of icon.children) {
            layer.strokes = [
              {
                type: "SOLID",
                color: { r: 0.05, g: 0.27, b: 0.76 },
                opacity: 1,
                visible: true,
                boundVariables: {
                  color: { type: "VARIABLE_ALIAS", id: ghostInk },
                },
              },
            ];
          }
          node.appendChild(icon);
        },
      },
    ]);
    iconButton.componentPropertyDefinitions = {
      "Icon#2:0": { type: "INSTANCE_SWAP", defaultValue: plus.id },
    };
    const components = new MockNode("PAGE", "Components");
    for (const set of [button, iconButton]) components.appendChild(set);
    const icons = new MockNode("PAGE", "Icons");
    for (const icon of [plus, close, warningMark]) icons.appendChild(icon);
    const fileFigma = createFigmaMock({ pages: [components, icons] });
    const file = loadPlugin({ pluginPath: PLUGIN, figma: fileFigma });
    const tokens = payloadVariables([
      ...variableByName.keys(),
      "Colors/emotional/info/700",
      "Colors/emotional/alert/800",
      "Emotion/informative/text",
      "Emotion/alert/text",
      "Colors/emotional/info/800",
      "Border/bevel/bottom",
      "Colors/background/200",
    ]);
    await file.ensureKozmosTextStyles(FONTS, freshStats());

    const fill = (node) => node && node.fills && node.fills[0];
    const painted = {};
    for (const content of plugin.TOUR_STEP_CONTENT) {
      const component = fileFigma.createComponent();
      const stats = freshStats();
      await withAutoLayout(() =>
        file.updateTourStepVariant(component, {
          props: { content },
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats,
        }),
      );
      painted[content] = component;
      const coachmark = content === "Coachmark";
      const welcome = content === "Welcome";
      const warning = content === "Warning";
      const width = welcome ? 432 : 372;
      const rows = component.children.map((child) => child.name);
      ok(
        component.name === `Content=${content}` &&
          component.width === width &&
          component.layoutMode === "VERTICAL" &&
          component.primaryAxisSizingMode === "AUTO" &&
          component.paddingTop === 16 &&
          component.paddingLeft === 16 &&
          component.paddingRight === 16 &&
          component.paddingBottom === 16 &&
          component.itemSpacing === 12 &&
          component.cornerRadius === 16 &&
          component.clipsContent === false,
        `${content}: ${width} wide, 16 inside, 12 apart, the Control corner, its arrow outside (${component.width}, ${component.paddingTop}/${component.paddingLeft}, ${component.itemSpacing}, ${component.cornerRadius})`,
      );
      ok(
        boundVariableName(fill(component)) === "Surface/0" &&
          boundVariableName(component.strokes[0]) === "Border/Subtle" &&
          component.strokeWeight === 1 &&
          component.effects.length === 1 &&
          component.effects[0].offset.y === 8 &&
          component.effects[0].radius === 16,
        `${content}: Popover's surface, the subtle edge all round and the overlay elevation`,
      );
      const expectedRows = ["Arrow", "Header"];
      if (!welcome) expectedRows.push("Close");
      expectedRows.push("Body Text");
      if (!coachmark && !welcome) expectedRows.push("Instruction", "Progress");
      if (!coachmark) expectedRows.push("Footer");
      ok(
        JSON.stringify(rows) === JSON.stringify(expectedRows) &&
          !named(component, "Top Edge") &&
          !named(component, "Hint") &&
          !named(component, "Dots"),
        `${content}: ${rows.join(", ")}; no top edge, hint or dots`,
      );
      const arrow = component.children[0];
      const arrowFill = arrow && named(arrow, "Arrow Fill");
      ok(
        arrow.layoutPositioning === "ABSOLUTE" &&
          arrow.width === 24 &&
          arrow.height === 12 &&
          arrow.x === (width - 24) / 2 &&
          arrow.y === -11 &&
          arrow.clipsContent === true &&
          arrowFill &&
          boundVariableName(fill(arrowFill)) === "Surface/0" &&
          arrowFill.effects.length === 1 &&
          arrowFill.effects[0].offset.y === 1 &&
          arrowFill.effects[0].radius === 1 &&
          arrowFill.effects[0].boundVariables &&
          arrowFill.effects[0].boundVariables.color.id ===
            tokens.variableByName.get("Border/bevel/bottom").id,
        `${content}: a 24 by 12 arrow above the card's middle, 1 over its edge, Surface/0, a 0 1 1 shadow in the bevel's colour that its frame clips at the edge`,
      );
      const header = named(component, "Header");
      const eyebrow = named(component, "Eyebrow");
      const tour = named(component, "Tour Text");
      const position = eyebrow && named(eyebrow, "Position Text");
      const current = { "First step": 1, Step: 2 }[content] || 4;
      ok(
        coachmark
          ? !eyebrow
          : eyebrow &&
              tour &&
              tour.parent === eyebrow &&
              [tour, position, named(component, "Separator")]
                .filter(Boolean)
                .every(
                  (text) =>
                    text.textCase !== "UPPER" &&
                    text.fontSize === 12 &&
                    boundVariableName(fill(text)) === "Colors/theme/600",
                ) &&
              tour.characters === plugin.TOUR_STEP_SAMPLE.tour &&
              (welcome ? !position : position.characters === `${current} of 4`),
        coachmark
          ? "Coachmark: no tour name and no position"
          : `${content}: "${tour && tour.characters}${position ? ` · ${position.characters}` : ""}", 12 in the theme ink, in sentence case`,
      );
      const closeButton = named(component, "Close");
      ok(
        welcome
          ? !closeButton
          : closeButton &&
              closeButton.type === "INSTANCE" &&
              closeButton.mainComponent.name ===
                "Variant=Ghost, Size=Default, State=Default" &&
              closeButton.componentProperties["Icon#2:0"] === close.id,
        welcome
          ? "Welcome: no Close"
          : `${content}: Close is IconButton's Ghost with x-close`,
      );
      // Close takes no row: out of the flow on the card itself, a full 44, its
      // 16 icon ending on the padding and on the eyebrow's 16 line, or the
      // title's first 28 with no eyebrow. The card's 1 edge is laid out, so
      // the words start 17 in.
      if (!welcome) {
        const line = coachmark ? 28 : 16;
        ok(
          closeButton.parent === component &&
            closeButton.layoutPositioning === "ABSOLUTE" &&
            closeButton.width === 44 &&
            closeButton.height === 44 &&
            closeButton.x === width - 3 - 44 &&
            closeButton.y === 17 + (line - 44) / 2 &&
            closeButton.y + 22 === header.y + line / 2 &&
            closeButton.constraints.horizontal === "MAX" &&
            closeButton.constraints.vertical === "MIN",
          `${content}: Close is out of the flow in the corner, a full 44, its icon on the ${coachmark ? "title's first line" : "eyebrow's line"} (${closeButton.layoutPositioning}, ${closeButton.width} by ${closeButton.height} at ${closeButton.x}, ${closeButton.y}, ${JSON.stringify(closeButton.constraints)})`,
        );
      }
      // The header hugs its words, 8 apart, starts at the top of the card, and
      // leaves Close its room: 30 of it past the padding, and 8.
      const headerTitle = named(component, "Title Text");
      const words = coachmark ? [headerTitle] : [eyebrow, headerTitle];
      const room = welcome ? 0 : 38;
      ok(
        header.layoutMode === "VERTICAL" &&
          header.primaryAxisSizingMode === "AUTO" &&
          header.itemSpacing === 8 &&
          header.paddingRight === room &&
          header.x === 17 &&
          header.y === 17 &&
          header.width === width - 34 &&
          header.children.length === words.length &&
          words.every((text, index) => header.children[index] === text) &&
          words.every((text) => text.width === width - 34 - room) &&
          words[0].y === 0 &&
          header.height ===
            words.reduce((sum, text) => sum + text.height, 0) +
              8 * (words.length - 1),
        `${content}: the header hugs ${words.map((text) => text.name).join(", ")}, ${room ? `wrapping ${room} before Close` : "the whole width"}, 17 from the top (${header.x}, ${header.y}, ${header.width} by ${header.height}, ${header.paddingRight}, ${words.map((text) => text.width)})`,
      );
      // Nothing but its rows: the card has no band the rows do not draw.
      const flow = component.children.filter(
        (child) => child.layoutPositioning !== "ABSOLUTE",
      );
      const rowsHeight = flow.reduce((sum, child) => sum + child.height, 0);
      ok(
        component.height === 34 + rowsHeight + 12 * (flow.length - 1),
        `${content}: the card is its rows, with no empty band (${component.height} for ${flow.map((child) => `${child.name} ${child.height}`).join(", ")})`,
      );
      if (!welcome) {
        // The swap replaces the layer the button's tint was laid on, so
        // x-close came in its source's black. It takes the ghost's ink again,
        // bound to its variable.
        const closeIcon = closeButton.findOne(
          (node) =>
            node.type === "INSTANCE" &&
            node.componentPropertyReferences &&
            node.componentPropertyReferences.mainComponent === "Icon#2:0",
        );
        const closeInk = closeIcon
          ? closeIcon.findAll((node) => (node.strokes || []).length > 0)
          : [];
        ok(
          closeIcon &&
            closeIcon.mainComponent === close &&
            closeInk.length > 0 &&
            closeInk.every(
              (node) =>
                boundVariableName(node.strokes[0]) === ghostInk &&
                Math.abs(node.strokeWeight - 4 / 3) < 1e-6,
            ),
          `${content}: x-close draws in the ghost button's ink, ${ghostInk}, at React's 1.33 (${closeInk.map((node) => `${boundVariableName(node.strokes[0]) || hexOf(node.strokes[0])} ${node.strokeWeight}`).join(", ") || "no stroked layer"})`,
        );
      }
      const title = named(component, "Title Text");
      ok(
        title &&
          title.fontSize === 20 &&
          title.lineHeight.value === 28 &&
          boundVariableName(fill(title)) === "Colors/foreground/0" &&
          title.characters === plugin.TOUR_STEP_SAMPLE.title,
        `${content}: the title Heading 4, 20/28, in the foreground, the one sample ("${title && title.characters}")`,
      );
      const body = named(component, "Body Text");
      ok(
        body &&
          body.fontSize === 14 &&
          boundVariableName(fill(body)) === "Colors/foreground/400" &&
          body.characters === plugin.TOUR_STEP_SAMPLE.body,
        `${content}: the body 14 in the muted ink, the one sample`,
      );
      const instruction = named(component, "Instruction");
      if (coachmark || welcome) {
        ok(!instruction, `${content}: no instruction`);
      } else {
        const toneFill = warning
          ? "Colors/emotional/alert/800"
          : "Colors/emotional/info/700";
        const toneInk = warning
          ? "Emotion/alert/text"
          : "Emotion/informative/text";
        const toneMark = warning
          ? "Colors/emotional/alert/900"
          : "Colors/emotional/info/800";
        const wash = named(instruction, "Instruction Fill");
        const edge = named(instruction, "Instruction Edge");
        const icon = named(instruction, "Instruction Icon");
        const text = named(instruction, "Instruction Text");
        const iconInk = icon
          ? icon.findAll((node) => (node.strokes || []).length > 0)
          : [];
        ok(
          instruction.cornerRadius === 20 &&
            instruction.itemSpacing === 8 &&
            instruction.counterAxisAlignItems === "CENTER" &&
            (instruction.fills || []).length === 0 &&
            wash &&
            wash.layoutPositioning === "ABSOLUTE" &&
            boundVariableName(fill(wash)) === toneFill &&
            Math.abs(wash.opacity - 0.05) < 1e-9 &&
            edge &&
            edge.layoutPositioning === "ABSOLUTE" &&
            (edge.fills || []).length === 0 &&
            boundVariableName(edge.strokes[0]) === toneFill &&
            edge.strokeWeight === 1 &&
            Math.abs(edge.opacity - 0.5) < 1e-9,
          `${content}: the instruction on its tone's fill at 5 % with its edge at 50 %, the Container corner`,
        );
        // Notice's box, with its border in the flow: 8/12 inside a 1 border,
        // so the words are 288 wide and two lines of them make it 56.5, the
        // design's 57. The layers that draw the box are the frame's size: the
        // frame hugged its words in the live file, and the two layers stopped
        // 16 short of it, 39 in 55, with the words running out of what shows.
        const lines = Math.round(text.height / 19.25);
        ok(
          instruction.paddingTop === 9 &&
            instruction.paddingBottom === 9 &&
            instruction.paddingLeft === 13 &&
            instruction.paddingRight === 13 &&
            text.width === 288 &&
            lines === 2 &&
            instruction.height === 18 + 2 * 19.25,
          `${content}: 8/12 inside Notice's 1 border, the words 288 wide on two lines, the box 56.5 (${instruction.paddingTop}/${instruction.paddingLeft}, ${text.width}, ${text.height}, ${instruction.height})`,
        );
        ok(
          [wash, edge].every(
            (layer) =>
              layer.x === 0 &&
              layer.y === 0 &&
              layer.width === instruction.width &&
              layer.height === instruction.height &&
              layer.constraints.horizontal === "STRETCH" &&
              layer.constraints.vertical === "STRETCH",
          ),
          `${content}: the fill and the edge are the instruction's size, and stretch with it from no margin (${wash.width}x${wash.height}, ${edge.width}x${edge.height} in ${instruction.width}x${instruction.height})`,
        );
        ok(
          icon.y === (instruction.height - 16) / 2,
          `${content}: the icon on the middle of the words (${icon.y} in ${instruction.height})`,
        );
        ok(
          icon &&
            icon.width === 16 &&
            icon.height === 16 &&
            iconInk.length > 0 &&
            iconInk.every(
              (node) => boundVariableName(node.strokes[0]) === toneMark,
            ) &&
            (warning
              ? icon.type === "INSTANCE" && icon.mainComponent === warningMark
              : icon.type === "FRAME" &&
                String(icon.svg).includes(plugin.TOUR_STEP_POINTER_PATH)) &&
            text &&
            text.fontSize === 14 &&
            text.lineHeight.value === 19.25 &&
            boundVariableName(fill(text)) === toneInk,
          `${content}: a 16 ${warning ? "alert-triangle" : "cursor-02"} in ${toneMark}, and the words 14 semibold at 19.25 in ${toneInk}`,
        );
        const progress = named(component, "Progress");
        const track = progress && named(progress, "Progress Track");
        const range = track && named(track, "Progress Range");
        const words = progress && named(progress, "Position Text");
        ok(
          progress &&
            progress.itemSpacing === 12 &&
            track.height === 8 &&
            track.cornerRadius === 9999 &&
            boundVariableName(fill(track)) === "Colors/background/200" &&
            boundVariableName(fill(range)) === "Colors/theme/600" &&
            range.constraints.horizontal === "SCALE" &&
            range.cornerRadius === 0 &&
            track.clipsContent === true &&
            Math.abs(range.width - (track.width * current) / 4) <= 1 &&
            words.characters === `${current} of 4` &&
            words.fontSize === 12 &&
            boundVariableName(fill(words)) === "Colors/foreground/400" &&
            progress.children[progress.children.length - 1] === words,
          `${content}: the bar, filled to ${current} of 4 in the theme ink, a square end the track's clip rounds, and "${words && words.characters}" after it in the muted ink`,
        );
      }
      if (!coachmark) {
        const footer = named(component, "Footer");
        const labels = footer
          .findAll((node) => node.type === "INSTANCE")
          .map((instance) =>
            [
              instance.name,
              instance.mainComponent &&
                instance.mainComponent.name.split(",").slice(0, 2).join(","),
              instance.componentProperties &&
                instance.componentProperties["Label Text#1:0"],
              instance.isExposedInstance,
              instance.opacity,
            ].join(" "),
          );
        const expected = {
          "First step": ["Next Variant=Default, Size=Small Next true 1"],
          Step: [
            "Back Variant=Ghost, Size=Small Back true 1",
            "Next Variant=Default, Size=Small Next true 1",
          ],
          "Last step": [
            "Back Variant=Ghost, Size=Small Back true 1",
            "Next Variant=Default, Size=Small Next true 0.5",
          ],
          Warning: [
            "Back Variant=Ghost, Size=Small Back true 1",
            "Secondary Variant=Outline, Size=Small Finish without adding true 1",
          ],
          Welcome: [
            "Dismiss Variant=Link, Size=Small Don't show again true 1",
            "Secondary Variant=Outline, Size=Small Not now true 1",
            "Next Variant=Default, Size=Small Show me the tours true 1",
          ],
        }[content];
        ok(
          JSON.stringify(labels) === JSON.stringify(expected) &&
            footer.primaryAxisAlignItems ===
              (welcome ? "SPACE_BETWEEN" : "MAX"),
          `${content}: ${labels.join("; ")}`,
        );
        // Every button is its words and 12 either side, and the row stays
        // inside the card: the dismiss link's box on the inner edge, the
        // actions ending on the other. Size=Small is a fixed 96 in the file:
        // in the live set "Finish without adding" ran past the card's edge.
        const buttons = footer.findAll((node) => node.type === "INSTANCE");
        const fits = buttons.map((instance) => {
          const label = named(instance, "Label Text");
          const stroke = instance.mainComponent.name.includes("Outline")
            ? 2
            : 0;
          return {
            name: instance.name,
            width: instance.width,
            label: label.width,
            hugs:
              instance.primaryAxisSizingMode === "AUTO" &&
              instance.width === label.width + 24 + stroke &&
              label.x >= 12 &&
              label.x + label.width <= instance.width - 12,
          };
        });
        ok(
          fits.every((button) => button.hugs),
          `${content}: every button hugs its label (${fits.map((button) => `${button.name} ${button.width} for ${button.label}`).join(", ")})`,
        );
        const actions = named(footer, "Actions");
        const dismiss = named(footer, "Dismiss");
        ok(
          actions.x >= 0 &&
            actions.x + actions.width === footer.width &&
            (dismiss
              ? dismiss.x === 0 && dismiss.x + dismiss.width < actions.x
              : true) &&
            footer.height === 44,
          `${content}: the actions end on the card's inner edge, ${dismiss ? "the link starts on the other, " : ""}one line (${dismiss ? `${dismiss.x}+${dismiss.width}, ` : ""}${actions.x}+${actions.width} in ${footer.width})`,
        );
      }
      ok(
        stats.warnings.length === 0,
        `${content}: no warnings (${stats.warnings.join(" | ")})`,
      );
    }

    // The set's properties: four texts and two booleans, each driving a layer.
    // In the order Build and Update run them: the layout, then the properties.
    const set = new MockNode("COMPONENT_SET", "TourStep");
    for (const content of plugin.TOUR_STEP_CONTENT)
      set.appendChild(painted[content]);
    const propertyStats = freshStats();
    await withAutoLayout(async () => {
      file.layoutTourStepVariants(set);
      file.configureTourStepProperties(set, propertyStats);
    });
    const definitions = Object.entries(set.componentPropertyDefinitions).map(
      ([key, definition]) => `${key.split("#")[0]}:${definition.type}`,
    );
    ok(
      JSON.stringify(definitions.sort()) ===
        JSON.stringify(
          [
            "Arrow:BOOLEAN",
            "Body Text:TEXT",
            "Instruction Text:TEXT",
            "Instruction:BOOLEAN",
            "Title Text:TEXT",
            "Tour Text:TEXT",
          ].sort(),
        ),
      `four text properties and two booleans, and no position (${definitions.join(", ")})`,
    );
    const references = (key) =>
      set.findAll(
        (node) =>
          node.componentPropertyReferences &&
          Object.values(node.componentPropertyReferences).some(
            (value) => String(value).split("#")[0] === key,
          ),
      ).length;
    const unbound = [
      "Tour Text",
      "Title Text",
      "Body Text",
      "Instruction Text",
      "Instruction",
      "Arrow",
    ].filter((key) => references(key) === 0);
    ok(
      unbound.length === 0 && propertyStats.warnings.length === 0,
      `every property drives a layer (${unbound.join(", ") || "all bound"}; ${propertyStats.warnings.join(" | ")})`,
    );
    ok(
      references("Instruction") === 4 && references("Arrow") === 6,
      `Instruction drives its layer in the four steps, and Arrow in all six (${references("Instruction")}, ${references("Arrow")})`,
    );

    // What the file shows once the layers are bound. A set's TEXT property has
    // one default and it replaces every bound layer's words, so no variant can
    // keep words of its own there: the sample has to read true on all six, and
    // the position, which the bar beside it decides, cannot be a property.
    const sample = plugin.TOUR_STEP_SAMPLE;
    const defaultOf = (name) =>
      Object.entries(set.componentPropertyDefinitions).find(
        ([key]) => key.split("#")[0] === name,
      )?.[1].defaultValue;
    for (const [name, key] of [
      ["Tour Text", "tour"],
      ["Title Text", "title"],
      ["Body Text", "body"],
      ["Instruction Text", "instruction"],
    ]) {
      const layers = set.findAll(
        (node) => node.type === "TEXT" && node.name === name,
      );
      ok(
        layers.length > 0 &&
          defaultOf(name) === sample[key] &&
          layers.every((layer) => layer.characters === sample[key]),
        `${name}: ${layers.length} bound layers all read the default, "${sample[key]}"`,
      );
    }
    ok(
      [sample.tour, sample.title, sample.body, sample.instruction].every(
        (words) =>
          !/\bnext\b|\bselect\b|\bfinish\b|\bwelcome\b|\d of \d/i.test(words),
      ),
      "the sample names no position and no button a variant may not have",
    );
    for (const content of plugin.TOUR_STEP_CONTENT) {
      const component = painted[content];
      const current = { "First step": 1, Step: 2 }[content] || 4;
      const positions = component.findAll(
        (node) => node.type === "TEXT" && node.name === "Position Text",
      );
      if (content === "Coachmark" || content === "Welcome") {
        ok(positions.length === 0, `${content}: no position`);
        continue;
      }
      const track = named(component, "Progress Track");
      const range = named(component, "Progress Range");
      const said = positions.map((node) => node.characters);
      ok(
        positions.length === 2 &&
          said.every((words) => words === `${current} of 4`) &&
          Math.abs(range.width / track.width - current / 4) < 0.01 &&
          positions.every(
            (node) => !(node.componentPropertyReferences || {}).characters,
          ),
        `${content}: says ${said.join(" and ")} over a bar at ${Math.round((range.width / track.width) * 100)} %, written by the variant and bound to nothing`,
      );
    }
    const tallest = Math.max(...set.children.map((child) => child.height));
    ok(
      set.height === tallest + 20 &&
        set.children.every((child) => child.y === 20),
      `the set's box ends on its tallest card (${set.height} for ${tallest}, each card 20 down for its arrow)`,
    );

    // An Update over what is on the file, keeping every id Code Connect is
    // about to pin. The set as the Build of 2026-11-01 left it: Position Text a
    // property, its layers bound to it. New layer ids in every variant, so the
    // Close's tint and stroke are laid again in the same run.
    const positionKey = set.addComponentProperty(
      "Position Text",
      "TEXT",
      "2 of 4",
    );
    for (const layer of set.findAll(
      (node) => node.type === "TEXT" && node.name === "Position Text",
    )) {
      layer.componentPropertyReferences = { characters: positionKey };
    }
    const ids = {
      set: set.id,
      variants: set.children.map((child) => child.id),
      title: named(set.children[0], "Title Text").id,
    };
    const config = file.tourStepComponentConfig();
    const updateStats = freshStats();
    await withAutoLayout(async () => {
      for (const child of [...set.children]) {
        await config.updateVariant(child, {
          props: config.parseVariantName(child.name),
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: updateStats,
        });
      }
      config.layoutVariants(set);
      await config.configureProperties(set, updateStats, tokens.variableByName);
      file.reportUnboundComponentProperties(set, updateStats);
    });
    ok(
      set.id === ids.set &&
        JSON.stringify(set.children.map((child) => child.id)) ===
          JSON.stringify(ids.variants) &&
        named(set.children[0], "Title Text").id !== ids.title,
      "an Update keeps the set's id and its six variants', and redraws their layers",
    );
    ok(
      !Object.keys(set.componentPropertyDefinitions).some(
        (key) => key.split("#")[0] === "Position Text",
      ) &&
        references("Title Text") === 6 &&
        updateStats.warnings.length === 0,
      `an Update takes Position Text off the set and leaves nothing unbound (${updateStats.warnings.join(" | ")})`,
    );
    for (const child of set.children.filter(
      (variant) => variant.name !== "Content=Welcome",
    )) {
      const closeLayer = named(child, "Close");
      const line = child.name === "Content=Coachmark" ? 28 : 16;
      ok(
        closeLayer.parent === child &&
          closeLayer.layoutPositioning === "ABSOLUTE" &&
          closeLayer.width === 44 &&
          closeLayer.height === 44 &&
          closeLayer.x === 325 &&
          closeLayer.y === 17 + (line - 44) / 2,
        `over the Build, ${child.name}: Close is out of the flow in the corner (${closeLayer.layoutPositioning}, ${closeLayer.width} by ${closeLayer.height} at ${closeLayer.x}, ${closeLayer.y})`,
      );
    }
    const updated = set.children[1];
    const updatedEdge = named(updated, "Instruction Edge");
    const updatedClose = named(updated, "Close").findOne(
      (node) =>
        node.type === "INSTANCE" &&
        node.componentPropertyReferences &&
        node.componentPropertyReferences.mainComponent === "Icon#2:0",
    );
    const updatedInk = updatedClose.findAll(
      (node) => (node.strokes || []).length > 0,
    );
    ok(
      updatedEdge.height === named(updated, "Instruction").height &&
        updatedInk.length > 0 &&
        updatedInk.every(
          (node) =>
            boundVariableName(node.strokes[0]) === ghostInk &&
            Math.abs(node.strokeWeight - 4 / 3) < 1e-6,
        ),
      "over the Build, the instruction's layers still fit and Close keeps its tint and stroke",
    );

    // Figma documents neither default. A new frame that clips, and a stroke
    // that starts outside, leave the drawing as it is.
    const worst = fileFigma.createComponent();
    const worstStats = freshStats();
    await withNodeDefaults(
      {
        FRAME: { clipsContent: true, strokeAlign: "OUTSIDE" },
        COMPONENT: { clipsContent: true, strokeAlign: "OUTSIDE" },
        RECTANGLE: { strokeAlign: "OUTSIDE" },
      },
      () =>
        withAutoLayout(async () => {
          const painting = fileFigma.createComponent();
          await file.updateTourStepVariant(painting, {
            props: { content: "Step" },
            variableByName: tokens.variableByName,
            fonts: FONTS,
            stats: worstStats,
          });
          worst.appendChild(painting);
        }),
    );
    const worstCard = worst.children[0];
    const clipping = worstCard
      .findAll((node) => node.type === "FRAME" && node.clipsContent)
      .map((node) => node.name);
    ok(
      worstCard.strokeAlign === "INSIDE" &&
        worstCard.clipsContent === false &&
        named(worstCard, "Instruction Edge").strokeAlign === "INSIDE" &&
        JSON.stringify(clipping.sort()) ===
          JSON.stringify(["Arrow", "Progress Track"]),
      `whatever a new node starts as, the card's border is inside and only the arrow and the track clip (${worstCard.strokeAlign}, ${clipping.join(", ")})`,
    );
  }
}

// What the stand-in learned from the live TourStep set, on its own: each is a
// behaviour a painter leans on and the stand-in used to pass over, so a check
// that reads layout is reading the file's rules, not this file's hopes. Read
// over REST on 2026-11-01, where the painter that drew the set, replayed in
// `withAutoLayout`, lands within a pixel of its 127 nodes and its 2692 by 388,
// apart from the widths of self-sizing text.
section("The stand-in lays out as the file does (TourStep, 2026-11-01)");
{
  await withAutoLayout(async () => {
    const buttonVariant = new MockNode("COMPONENT", "Size=Small");
    buttonVariant.layoutMode = "HORIZONTAL";
    buttonVariant.primaryAxisSizingMode = "FIXED";
    buttonVariant.counterAxisSizingMode = "FIXED";
    buttonVariant.primaryAxisAlignItems = "CENTER";
    buttonVariant.paddingLeft = 12;
    buttonVariant.paddingRight = 12;
    buttonVariant.resize(96, 44);
    const label = new MockNode("TEXT", "Label Text");
    label.fontSize = 14;
    label.characters = "Next";
    label.componentPropertyReferences = { characters: "Label Text#1:0" };
    buttonVariant.appendChild(label);

    // A fixed primary axis keeps its width when the label changes.
    const kept = buttonVariant.createInstance();
    kept.setProperties({ "Label Text#1:0": "Finish without adding" });
    const keptLabel = named(kept, "Label Text");
    ok(
      kept.width === 96 &&
        keptLabel.width > 72 &&
        keptLabel.x < 0 &&
        keptLabel.x + keptLabel.width > 96,
      `a fixed instance keeps its 96, and a long label runs out of both sides (${kept.width}, the label at ${keptLabel.x}+${keptLabel.width})`,
    );
    // HUG is the shorthand for the sizing mode, and the instance follows.
    const hugged = buttonVariant.createInstance();
    hugged.setProperties({ "Label Text#1:0": "Finish without adding" });
    hugged.layoutSizingHorizontal = "HUG";
    const huggedLabel = named(hugged, "Label Text");
    ok(
      hugged.primaryAxisSizingMode === "AUTO" &&
        hugged.width === huggedLabel.width + 24 &&
        huggedLabel.x === 12,
      `a hugging instance is its label and its padding (${hugged.width}, ${hugged.primaryAxisSizingMode})`,
    );

    // A bound text takes the set's default, in every variant, at once.
    const set = new MockNode("COMPONENT_SET", "Set");
    const key = set.addComponentProperty("Words", "TEXT", "The default");
    const texts = ["One", "Two"].map((words) => {
      const variant = new MockNode("COMPONENT", words);
      const text = new MockNode("TEXT", "Words");
      text.characters = words;
      variant.appendChild(text);
      set.appendChild(variant);
      return text;
    });
    ok(
      texts[0].characters === "One",
      "a text keeps its words until it is bound",
    );
    for (const text of texts) {
      text.componentPropertyReferences = { characters: key };
    }
    ok(
      texts.every((text) => text.characters === "The default"),
      "a bound text takes the set's default, whatever its variant wrote",
    );
    set.editComponentProperty(key, { defaultValue: "Another" });
    ok(
      texts.every((text) => text.characters === "Another"),
      "a new default reaches every bound layer",
    );
    set.deleteComponentProperty(key);
    ok(
      texts.every(
        (text) =>
          text.characters === "Another" &&
          !text.componentPropertyReferences.characters,
      ),
      "a deleted property leaves its layers their words and no reference",
    );

    // A padded hug frame takes an absolute layer in while it is in the flow,
    // and holds the size when it leaves it, so the stretch keeps the padding as
    // a margin however the frame moves after that.
    const frame = new MockNode("FRAME", "Hugging");
    frame.layoutMode = "HORIZONTAL";
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "AUTO";
    frame.paddingTop = 8;
    frame.paddingBottom = 8;
    frame.resizeWithoutConstraints(338, 40);
    const layer = new MockNode("RECTANGLE", "Layer");
    layer.resize(338, 40);
    frame.insertChild(0, layer);
    ok(frame.height === 56, `the flow child and the padding: ${frame.height}`);
    layer.layoutPositioning = "ABSOLUTE";
    layer.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
    ok(frame.height === 56, `no flow child left, it holds: ${frame.height}`);
    const words = new MockNode("TEXT", "Words");
    words.textAutoResize = "HEIGHT";
    words.lineHeight = { unit: "PIXELS", value: 19.25 };
    words.fontSize = 14;
    words.characters = "w".repeat(70);
    words.resizeWithoutConstraints(290, 19.25);
    frame.appendChild(words);
    ok(
      frame.height === 54.5 && layer.height === 38.5,
      `the frame hugs two lines, and the layer stays 16 short: ${layer.height} in ${frame.height}, the live 39 in 55`,
    );

    // A corner layer: a flow child until it leaves the flow, so a frame with
    // words left in it takes it in and gives it back, and only then do x and y
    // mean anything. placeAbsolute's comment says what the file does with one
    // written before: UserLocationMarker's three shapes stacked in a column.
    const card = new MockNode("FRAME", "Card");
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "AUTO";
    card.counterAxisSizingMode = "FIXED";
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.resizeWithoutConstraints(372, 100);
    const line = new MockNode("TEXT", "Line");
    line.lineHeight = { unit: "PIXELS", value: 28 };
    line.fontSize = 20;
    line.characters = "Title";
    card.appendChild(line);
    ok(card.height === 60, `the card hugs its line: ${card.height}`);
    const corner = new MockNode("FRAME", "Corner");
    corner.resizeWithoutConstraints(44, 44);
    card.appendChild(corner);
    ok(
      card.height === 104,
      `in the flow, it takes a row, and the padding around it: ${card.height}`,
    );
    corner.x = 325;
    corner.y = 3;
    ok(
      corner.x === 0 && corner.y === 44,
      `a flow child is where the frame put it, whatever is written (${corner.x}, ${corner.y})`,
    );
    corner.layoutPositioning = "ABSOLUTE";
    ok(
      card.height === 60 && corner.x === 0 && corner.y === 44,
      `out of the flow, a frame with words left hugs them, and the layer stays where it was (${card.height}, ${corner.x}, ${corner.y})`,
    );
    corner.x = 325;
    corner.y = 3;
    corner.constraints = { horizontal: "MAX", vertical: "MIN" };
    card.resize(432, card.height);
    card.appendChild(new MockNode("FRAME", "Next row"));
    ok(
      corner.x === 385 && corner.y === 3 && card.height > 60,
      `held at the top and the end, it follows the card's width, and its height leaves it be (${corner.x}, ${corner.y} in ${card.width} by ${card.height})`,
    );
    let refused = false;
    try {
      new MockNode("FRAME", "Loose").layoutPositioning = "ABSOLUTE";
    } catch {
      refused = true;
    }
    ok(refused, "a layer outside an auto-layout frame cannot go absolute");
  });
}

// figma:verify's two new rules, on nodes shaped as REST returns them. The
// report it missed was not about text at all: over REST on 2026-11-01 the
// instruction's words sat inside their own box and inside the frame, which
// hugged them, and what fell short was the frame's own fill and edge, absolute
// layers its overflow rule skips on purpose.
section(
  "figma:verify reads stretched layers and a separator, and fails on them",
);
{
  const box = (x, y, width, height) => ({ x, y, width, height });
  const stretched = {
    horizontal: "LEFT_RIGHT",
    vertical: "TOP_BOTTOM",
  };
  const layer = (name, bounds, constraints = stretched) => ({
    name,
    type: "RECTANGLE",
    layoutPositioning: "ABSOLUTE",
    constraints,
    absoluteBoundingBox: bounds,
  });
  const frame = (children, height = 55) => ({
    name: "Instruction",
    type: "FRAME",
    layoutMode: "HORIZONTAL",
    absoluteBoundingBox: box(0, 0, 338, height),
    children,
  });
  const short = layersShortOfTheirFrame("TourStep", {
    name: "TourStep",
    children: [
      frame([
        layer("Instruction Fill", box(0, 0, 338, 39)),
        layer("Instruction Edge", box(0, 0, 338, 39)),
      ]),
    ],
  });
  ok(
    short.length === 2 &&
      short[0] ===
        "TourStep / Instruction > Instruction Fill — 338x39 over a 338x55 frame (short by 16)",
    `a layer stretched over its frame and short of it is named (${short.join("; ")})`,
  );
  ok(
    layersShortOfTheirFrame("Set", {
      name: "Set",
      children: [
        frame([
          // On the frame, a focus ring past it, a strip stretched one way, and
          // a hidden layer.
          layer("Fits", box(0, 0, 338, 55)),
          layer("Focus Ring", box(-4, -4, 346, 63)),
          layer("Vertical Scrollbar", box(330, 0, 8, 23), {
            horizontal: "RIGHT",
            vertical: "TOP_BOTTOM",
          }),
          { ...layer("Hidden", box(0, 0, 338, 10)), visible: false },
        ]),
      ],
    }).length === 0,
    "a layer on its frame, one past it, a strip and a hidden layer are left alone",
  );

  const text = (name, characters) => ({ type: "TEXT", name, characters });
  ok(
    !isTypedGlyph(text("Separator", "·")) &&
      isTypedGlyph(text("Label", "·")) &&
      isTypedGlyph(text("Separator", "→")) &&
      isTypedGlyph(text("Close", "×")) &&
      !isTypedGlyph(text("Label", "Next")) &&
      !isTypedGlyph(text("Percent", "%")),
    "a Separator's dot is punctuation; a dot elsewhere, and any other glyph, still counts",
  );

  // The three reports it only printed until their counts reached zero on the
  // live file (2026-11-02): the run itself, on a page that holds every set and
  // variant it expects, passes, and each with one defect added fails, by one.
  const { names, axes } = expectations();
  const variantsOf = (byAxis = {}) => {
    const first = Object.entries(byAxis).map(([axis, [value]]) => [
      axis,
      value,
    ]);
    const combinations = Object.entries(byAxis).flatMap(([axis, values]) =>
      values.map((value) =>
        first.map(([name, start]) =>
          name === axis ? `${name}=${value}` : `${name}=${start}`,
        ),
      ),
    );
    return [...new Set(combinations.map((pairs) => pairs.join(", ")))].map(
      (name) => ({ type: "COMPONENT", name }),
    );
  };
  // A defect goes inside a variant: a set's own children are its variants.
  const page = (defect) => ({
    type: "PAGE",
    children: names.map((name) => ({
      type: "COMPONENT_SET",
      name,
      children: variantsOf(axes[name]).map((variant, index) =>
        defect && name === "TourStep" && index === 0
          ? { ...variant, children: [defect] }
          : variant,
      ),
    })),
  });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "figma-verify-"));
  const run = (saved) => {
    const file = path.join(directory, "page.json");
    fs.writeFileSync(file, JSON.stringify(saved));
    return spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts/verify-figma-library.mjs"), "--page", file],
      { encoding: "utf8" },
    );
  };
  const clean = run(page());
  ok(
    clean.status === 0,
    `a page with every set and nothing wrong passes (exit ${clean.status}: ${clean.stdout.match(/FAIL .*/g)})`,
  );
  const inside = { ...frame([]), paddingLeft: 0, paddingRight: 0 };
  for (const [report, defect] of [
    [
      "children that overflow the box holding them",
      {
        ...inside,
        children: [{ name: "Wide", absoluteBoundingBox: box(0, 0, 400, 20) }],
      },
    ],
    ["icons typed as characters", text("Close", "×")],
    [
      "layers stretched over a frame that stop short of it",
      frame([layer("Instruction Fill", box(0, 0, 338, 39))]),
    ],
  ]) {
    const result = run(page(defect));
    ok(
      result.status === 1 &&
        result.stdout.includes(`FAIL  ${report} — 1`) &&
        result.stdout.includes("\n1 drift item(s)."),
      `figma:verify fails on one finding in "${report}" (exit ${result.status}: ${result.stdout.match(/\d+ drift item|matches what/)})`,
    );
  }
  fs.rmSync(directory, { recursive: true, force: true });
}

// GAP-167: Toast's Tone axis, toast()'s tones. Neutral draws no icon; each
// other tone leads with the Alert set's icon for it, 16, in the tone's text
// colour (Semantics/Emotion/<tone>/text), as React's Toaster draws it, on the
// same surface and edge. A variant named before the axis parses as Neutral,
// so Update renames the two in the file and keeps their node ids.
section("Toast tones (GAP-167)");
{
  const ready =
    Array.isArray(plugin.TOAST_TONES) &&
    typeof plugin.parseToastVariantName === "function";
  ok(ready, "Toast has a Tone axis");
  if (ready) {
    const tokens = payloadVariables([...variableByName.keys()]);
    ok(
      JSON.stringify(plugin.TOAST_TONES) ===
        JSON.stringify(["Neutral", "Success", "Info", "Warning", "Critical"]),
      `the tones are toast()'s (${plugin.TOAST_TONES.join(", ")})`,
    );
    const parsed = [
      "Content=Basic",
      "Content=Action, Tone=Critical",
      "Content=Basic, Tone=Loud",
    ].map((name) => plugin.parseToastVariantName(name));
    ok(
      JSON.stringify(parsed) ===
        JSON.stringify([
          { value: "Basic", second: "Neutral" },
          { value: "Action", second: "Critical" },
          null,
        ]),
      `a variant from before the axis parses as Neutral; an unknown Tone is not one (${JSON.stringify(parsed)})`,
    );
    const expected = {
      Neutral: null,
      Success: ["check", "Emotion/success/text"],
      Info: ["info-circle", "Emotion/informative/text"],
      Warning: ["alert-triangle", "Emotion/alert/text"],
      Critical: ["alert-circle", "Emotion/danger/text"],
    };
    for (const [tone, want] of Object.entries(expected)) {
      const variant = await plugin.createToastVariant({
        value: "Action",
        second: tone,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      const icons = (variant.children || []).filter(
        (child) => child.name === "Icon",
      );
      const [icon] = icons;
      const shapes = icon ? icon.findAll((node) => node.type === "VECTOR") : [];
      const tints = shapes.flatMap((shape) =>
        (shape.strokes || []).map(boundVariableName).filter(Boolean),
      );
      const order = (variant.children || []).map((child) => child.name);
      const surface = [
        boundVariableName(variant.fills[0]),
        boundVariableName(variant.strokes[0]),
      ];
      ok(
        variant.name === `Content=Action, Tone=${tone}` &&
          JSON.stringify(surface) ===
            JSON.stringify(["Surface/0", "Border/Subtle"]) &&
          (want === null
            ? icons.length === 0
            : icons.length === 1 &&
              order[0] === "Icon" &&
              icon.mainComponent &&
              icon.mainComponent.name === `Icon / ${want[0]}` &&
              icon.width === 16 &&
              shapes.length > 0 &&
              tints.length === shapes.length &&
              tints.every((tint) => tint === want[1])),
        want === null
          ? `${tone}: no icon, on Surface/0 and Border/Subtle (${variant.name}; ${order.join(", ")})`
          : `${tone}: ${want[0]} first, 16, in ${want[1]}, on Surface/0 and Border/Subtle (${variant.name}; ${order.join(", ")}; ${icon && icon.mainComponent && icon.mainComponent.name}; ${tints.join("+") || "untinted"})`,
      );
    }

    // Update over the set as it is in the file today: two variants, named
    // before the Tone axis. Each keeps its node id and is renamed Neutral;
    // the other 8 are created beside them.
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "Toast");
    const oldIds = {};
    for (const name of ["Content=Basic", "Content=Action"]) {
      const variant = new MockNode("COMPONENT", name);
      liveSet.appendChild(variant);
      oldIds[name] = variant.id;
    }
    livePage.appendChild(liveSet);
    const setId = liveSet.id;
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({
        pages: [livePage, new MockNode("PAGE", "Icons")],
      }),
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await updatePlugin.updateToastComponent();
    const byId = new Map(liveSet.children.map((child) => [child.id, child]));
    const names = liveSet.children.map((child) => child.name);
    ok(
      updated.updated === true &&
        updated.componentSetId === setId &&
        updated.variantsUpdated === 2 &&
        updated.variantsCreated === 8 &&
        liveSet.children.length === 10 &&
        new Set(names).size === 10,
      `Update keeps the set and its 2 variants, and adds 8: 10 in all, each named once (${updated.variantsUpdated} updated, ${updated.variantsCreated} created, ${liveSet.children.length} children)`,
    );
    ok(
      ["Content=Basic", "Content=Action"].every((name) => {
        const variant = byId.get(oldIds[name]);
        return variant && variant.name === `${name}, Tone=Neutral`;
      }),
      `each keeps its node id and is renamed Tone=Neutral (${["Content=Basic", "Content=Action"].map((name) => (byId.get(oldIds[name]) || { name: "gone" }).name).join("; ")})`,
    );
  }
}

// --- Decision 59: the theme fill and what sits on it ------------------------------

// Olcay, 2026-10-07: a prominent fill is the theme fill, the themed Primary
// Button's background, which aliases theme 500 (#135BEC) in both themes, and
// every word or mark on it is the theme foreground, white in both. Never
// foreground/1000 or background/0 on it: both turn black in the dark, and
// black on 500 reads 3.74:1. A word, mark, edge or focus ring on the surface is
// the theme's 600 (#1051E8, #5887F3 in the dark), as React's primary is. Each
// paint is read in Light and in Dark through the payload's variables, the way
// Audit Library resolves it in the file.
section("Decision 59: the theme fill and what sits on it");
{
  const FILL = "Primary Buttons/themed/button/background/idle";
  const INK = "Primary Buttons/themed/button/foreground/content/idle";
  const ACCENT = "Colors/theme/600";
  const tokens = payloadVariables([...variableByName.keys()]);
  const context = plugin.createVariableContext(
    tokens.collections,
    tokens.variables,
  );
  const toHex = (color) =>
    color
      ? `#${[color.r, color.g, color.b]
          .map((channel) =>
            Math.round(channel * 255)
              .toString(16)
              .padStart(2, "0")
              .toUpperCase(),
          )
          .join("")}`
      : null;
  // "<variable> <light>/<dark>": what a paint binds, and what it draws in
  // each mode.
  const reads = (paint) =>
    paint
      ? `${boundVariableName(paint)} ${toHex(plugin.solidPaintToRgba(paint, context, "Light"))}/${toHex(plugin.solidPaintToRgba(paint, context, "Dark"))}`
      : "no paint";
  const fill = `${FILL} #135BEC/#135BEC`;
  const ink = `${INK} #FFFFFF/#FFFFFF`;
  const accent = `${ACCENT} #1051E8/#5887F3`;
  // Every part painted here, so the scopes can be read against what it binds.
  const paintedHere = [];
  const painted = async (painter, args) => {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin[painter](component, {
      ...args,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats,
    });
    paintedHere.push(component);
    return component;
  };
  // A mark is a vector's stroke (an outline icon) or its fill (a solid glyph).
  const markPaint = (node) => {
    const shape =
      node &&
      (node.type === "VECTOR"
        ? node
        : node.findOne((n) => n.type === "VECTOR"));
    if (!shape) return null;
    return (
      (shape.strokes && shape.strokes[0]) || (shape.fills && shape.fills[0])
    );
  };

  // The controls.
  const checkbox = await painted("updateCheckboxVariant", {
    checked: "Checked",
    state: "Default",
  });
  const box = named(checkbox, "Checkbox Control");
  ok(
    box && reads(box.fills[0]) === fill && reads(box.strokes[0]) === fill,
    `Checkbox, checked: the box and its edge are the theme fill (${box && reads(box.fills[0])}; ${box && reads(box.strokes[0])})`,
  );
  const check = box && named(box, "Checkbox Mark");
  ok(
    reads(markPaint(check)) === ink,
    `Checkbox, checked: the mark is the theme foreground (${reads(markPaint(check))})`,
  );
  const boxRing = box && named(box, "Focus Ring");
  ok(
    boxRing && reads(boxRing.strokes[0]) === accent,
    `Checkbox: the focus ring is the theme's 600 (${boxRing && reads(boxRing.strokes[0])})`,
  );

  const toggle = await painted("updateSwitchVariant", {
    checked: "Checked",
    state: "Default",
  });
  const track = named(toggle, "Switch Track");
  const thumb = track && named(track, "Switch Thumb");
  ok(
    track && reads(track.fills[0]) === fill && reads(track.strokes[0]) === fill,
    `Switch, checked: the track and its edge are the theme fill (${track && reads(track.fills[0])}; ${track && reads(track.strokes[0])})`,
  );
  ok(
    thumb && reads(thumb.fills[0]) === ink,
    `Switch, checked: the thumb on it is the theme foreground (${thumb && reads(thumb.fills[0])})`,
  );
  const off = await painted("updateSwitchVariant", {
    checked: "Unchecked",
    state: "Default",
  });
  const offThumb = named(off, "Switch Thumb");
  ok(
    offThumb && boundVariableName(offThumb.fills[0]) === "Colors/background/0",
    `Switch, unchecked: the thumb keeps the background (${offThumb && reads(offThumb.fills[0])})`,
  );

  const radio = await painted("updateRadioVariant", {
    checked: "Checked",
    state: "Default",
  });
  const ring = named(radio, "Radio Control");
  const dot = ring && named(ring, "Radio Dot");
  ok(
    ring && reads(ring.strokes[0]) === accent,
    `Radio, checked: the ring is a border, the theme's 600 (${ring && reads(ring.strokes[0])})`,
  );
  ok(
    dot && reads(dot.fills[0]) === fill,
    `Radio, checked: the dot is the theme fill (${dot && reads(dot.fills[0])})`,
  );

  // The configs every filled part reads: the pair, with fallbacks equal to
  // the tokens' light values, so the stored colour is not a second truth.
  for (const [label, config] of [
    ["Button, default", plugin.buttonConfig("Default", "Default")],
    ["Tag, default", plugin.tagConfig("Default")],
    ["Badge, default", plugin.badgeConfig("Default")],
    ["Counter, brand", plugin.counterConfig("Brand")],
    ["Chip, selected", plugin.chipConfig("Default", "Selected")],
    ["ToggleButton, on", plugin.toggleButtonConfig("Default", "Pressed")],
    [
      "ToggleButton outline, on",
      plugin.toggleButtonConfig("Outline", "Pressed"),
    ],
  ]) {
    ok(
      config.background === FILL &&
        config.backgroundFallback === "#135BEC" &&
        config.foreground === INK &&
        config.foregroundFallback === "#FFFFFF" &&
        (!config.stroke || config.stroke === FILL),
      `${label}: the theme fill and the theme foreground (${config.background} ${config.backgroundFallback}, ${config.foreground} ${config.foregroundFallback}${config.stroke ? `, edge ${config.stroke}` : ""})`,
    );
  }

  // The map and the floors. LocationPin's selected result is theme 600, as
  // the SDK's sprite draws it (decision 71), not the theme fill.
  const floors = await painted("updateFloorSelectorVariant", {
    value: "VerticalList",
  });
  const tile = named(floors, "Floor Item Selected");
  const tileText = named(floors, "Selected Floor Text");
  ok(
    tile &&
      tileText &&
      reads(tile.fills[0]) === fill &&
      reads(tileText.fills[0]) === ink,
    `FloorSelector: the selected tile is the theme fill, its label the theme foreground (${tile && reads(tile.fills[0])}; ${tileText && reads(tileText.fills[0])})`,
  );

  // The calendars' selected day: the fill was bound, its white was not.
  for (const [label, day] of [
    [
      "DatePicker",
      await plugin.createDatePickerCalendarDay({
        value: "12",
        outsideMonth: false,
        selected: true,
        today: false,
        disabled: false,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    ],
    [
      "DateRangePicker",
      await plugin.createDateRangePickerCalendarDay({
        value: "12",
        outsideMonth: false,
        rangeStart: true,
        rangeEnd: false,
        inRange: false,
        disabled: false,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    ],
  ]) {
    paintedHere.push(day);
    const text = named(day, "Day Text");
    ok(
      reads(day.fills[0]) === fill && text && reads(text.fills[0]) === ink,
      `${label}: the selected day is the theme fill, its number the theme foreground (${reads(day.fills[0])}; ${text && reads(text.fills[0])})`,
    );
  }

  // The CTAs React draws as a default Button are drawn as one: the theme
  // fill, every word and mark on it the theme foreground. They were a tinted
  // pressed control (theme/100, a 500 edge, a 700 mark) or a plain one.
  const onFill = (button) =>
    [
      ...button.findAll((node) => node.type === "TEXT"),
      ...button.findAll((node) => node.type === "INSTANCE"),
    ].map((node) =>
      node.type === "TEXT" ? reads(node.fills[0]) : reads(markPaint(node)),
    );
  for (const [painter, value, name] of [
    ["updateRoutePreviewPanelVariant", "Ready", "Continue Button"],
    ["updateRouteSummaryVariant", "Preview", "Start Navigation Button"],
    ["updateSaveLocationCardVariant", "Default", "Save Toggle Button"],
    ["updateFeedbackCardVariant", "Default", "Submit Button"],
    ["updateFeedbackCardVariant", "Submitting", "Submit Button"],
    ["updatePOIDetailPanelVariant", "Panel", "Navigate Action"],
  ]) {
    const component = await painted(painter, { value });
    const button = named(component, name);
    const marks = button ? onFill(button) : [];
    ok(
      button &&
        reads(button.fills[0]) === fill &&
        button.strokes.length === 0 &&
        marks.length > 0 &&
        marks.every((mark) => mark === ink),
      `${painter.replace(/^update|Variant$/g, "")} ${value}: ${name} is a default Button (${button && reads(button.fills[0])}; ${marks.join(", ")})`,
    );
  }
  // Until a route is ready, Continue is a disabled default Button: the
  // default at 50 %, as the Button set draws a disabled one.
  for (const value of ["Ready", "Calculating"]) {
    const preview = await painted("updateRoutePreviewPanelVariant", { value });
    const proceed = named(preview, "Continue Button");
    ok(
      proceed &&
        reads(proceed.fills[0]) === fill &&
        proceed.opacity === (value === "Ready" ? 1 : 0.5),
      `RoutePreviewPanel ${value}: Continue is the theme fill at ${value === "Ready" ? "full strength" : "50 %"} (${proceed && reads(proceed.fills[0])} at ${proceed && proceed.opacity})`,
    );
  }
  // Their siblings stay off the theme fill: an outline control on the
  // surface, as React draws the first two. A saved location offers Remove as
  // an outline Button. React draws RouteSummary's End as a destructive icon
  // Button, a danger-filled pill; the set still draws it on the surface, a
  // parity gap, but never on the theme fill.
  for (const [painter, value, name] of [
    ["updateSaveLocationCardVariant", "Saved", "Save Toggle Button"],
    ["updatePOIDetailPanelVariant", "Panel", "Save Action"],
    ["updateRouteSummaryVariant", "Active", "End Route Button"],
  ]) {
    const component = await painted(painter, { value });
    const button = named(component, name);
    ok(
      button && boundVariableName(button.fills[0]) === "Surface/0",
      `${painter.replace(/^update|Variant$/g, "")} ${value}: ${name} stays on the surface (${button && reads(button.fills[0])})`,
    );
  }
  const navbarHost = figma.createComponent();
  const navbarAction = await plugin.createNavbarPrimaryActionSlot({
    component: navbarHost,
    reusableSlot: null,
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  if (navbarAction) paintedHere.push(navbarAction);
  const create = navbarAction && named(navbarAction, "Primary Action");
  const createText = navbarAction && named(navbarAction, "Primary Action Text");
  ok(
    create &&
      createText &&
      reads(create.fills[0]) === fill &&
      reads(createText.fills[0]) === ink,
    `Navbar: the primary action is the theme fill, its label the theme foreground (${create && reads(create.fills[0])}; ${createText && reads(createText.fills[0])})`,
  );

  // On the surface: 600, whatever the step it was.
  ok(
    plugin.focusRingVariableForState("Default") === ACCENT &&
      plugin.focusRingFallbackForState("Default") === "#1051E8" &&
      plugin.focusRingVariableForInputStatus("Default") === ACCENT &&
      plugin.focusRingFallbackForInputStatus("Default") === "#1051E8",
    `a control's focus ring is the theme's 600 (${plugin.focusRingVariableForState("Default")}, ${plugin.focusRingVariableForInputStatus("Default")})`,
  );
  ok(
    plugin.inputConfig("Focus", "Default").fieldStroke === ACCENT &&
      plugin.searchBarConfig("Default", "Focus").stroke === ACCENT,
    `a focused field's edge is the theme's 600 (${plugin.inputConfig("Focus", "Default").fieldStroke}, ${plugin.searchBarConfig("Default", "Focus").stroke})`,
  );
  const button = await plugin.createButtonVariant({
    variant: "Default",
    size: "Default",
    state: "Default",
    variableByName: tokens.variableByName,
    fonts: FONTS,
    textStyle: null,
    stats: freshStats(),
  });
  paintedHere.push(button);
  const buttonRing = named(button, "Focus Ring");
  ok(
    reads(button.fills[0]) === fill &&
      buttonRing &&
      reads(buttonRing.strokes[0]) === accent,
    `Button: the theme fill, and its focus ring the theme's 600 (${reads(button.fills[0])}; ${buttonRing && reads(buttonRing.strokes[0])})`,
  );
  const source = fs.readFileSync(PLUGIN, "utf8");
  ok(
    !/variableName: "Colors\/theme\/500"/.test(source),
    "no focus ring in the plugin is drawn in the theme's 500",
  );
  ok(
    !/: "Colors\/theme\/500",\s*\n\s*disabled \? "#747B8B" : "#135BEC"/.test(
      source,
    ),
    "no option's check is drawn in the theme's 500",
  );
  const tileSelected = await painted("updateCategoryTileVariant", {
    props: { state: "Selected", tint: "Theme" },
  });
  const square = named(tileSelected, "Icon Square");
  const tileRing = square && named(square, "Selection Ring");
  ok(
    square &&
      tileRing &&
      reads(square.strokes[0]) === accent &&
      reads(tileRing.strokes[0]) === accent &&
      isWash(square, "Selection Wash", ACCENT, 0.05, 64, 64),
    `CategoryTile, selected: the edge, the ring and the wash are the theme's 600 (${square && reads(square.strokes[0])})`,
  );
  const rail = plugin.createTimelineRail({
    active: true,
    isLast: false,
    height: 64,
    width: 20,
    variableByName: tokens.variableByName,
    stats: freshStats(),
  });
  const railMarker = named(rail, "Timeline Marker");
  const railLine = named(rail, "Timeline Connector");
  ok(
    railMarker &&
      railLine &&
      reads(railMarker.fills[0]) === accent &&
      reads(railLine.fills[0]) === accent,
    `Timeline: the active marker and line are the theme's 600 (${railMarker && reads(railMarker.fills[0])}; ${railLine && reads(railLine.fills[0])})`,
  );

  // MapControlButton's Pressed state is a mode that stays on (following, a
  // layer shown): the nested default Button, so the theme fill, edge and all,
  // with the theme foreground on it. The set paints nothing of its own: what
  // it draws is the Button it nests, so that Button's config is read here. (A
  // state config the painter never called, theme/600 under foreground/1000,
  // was removed on 2026-10-08.)
  const mapNested =
    typeof plugin.mapControlButtonNestedVariant === "function"
      ? plugin.mapControlButtonNestedVariant("Icon", "Pressed")
      : {};
  const mapPressed = mapNested.Variant
    ? plugin.buttonConfig(mapNested.Variant, mapNested.State)
    : {};
  ok(
    mapNested.Variant === "Default" &&
      mapNested.State === "Default" &&
      mapPressed.background === FILL &&
      mapPressed.backgroundFallback === "#135BEC" &&
      (!mapPressed.stroke || mapPressed.stroke === FILL) &&
      mapPressed.foreground === INK &&
      mapPressed.foregroundFallback === "#FFFFFF",
    `MapControlButton, Pressed: the nested default Button, the theme fill with the theme foreground (Button ${mapNested.Variant} ${mapNested.State}; ${mapPressed.background}, ${mapPressed.foreground})`,
  );

  // Avatar's image placeholder is neutral (Olcay, 2026-10-07): React's muted
  // pair, the one AvatarFallback sits on, background/100 under a person mark
  // in the muted foreground, foreground/400. It was theme/600 under
  // foreground/1000, which turns black in the dark.
  const avatar = await painted("updateAvatarVariant", { value: "Image" });
  const person = named(avatar, "Icon");
  ok(
    reads(avatar.fills[0]) === "Colors/background/100 #E3E4E8/#17191C" &&
      person &&
      boundVariableName(markPaint(person)) === "Colors/foreground/400",
    `Avatar, Image: a neutral placeholder, background/100 under a foreground/400 mark (${reads(avatar.fills[0])}; ${reads(markPaint(person))})`,
  );

  // No part binds the theme's 500 itself: a prominent fill reaches it through
  // the theme fill, so a client's base colour moves every one at once, and a
  // word, mark or edge on the surface is the theme's 600. Only the example
  // map stage's route illustration paints it. Read from the source, so a part
  // no check paints is held too; a name built from a template would escape
  // it, so none may be.
  const declarations = [
    ...source.matchAll(
      /^(?:async function|function|const|let|var|class) ([A-Za-z0-9_$]+)/gm,
    ),
  ];
  const ownerOf = (index) => {
    let owner = null;
    for (const declaration of declarations) {
      if (declaration.index > index) break;
      owner = declaration[1];
    }
    return owner;
  };
  const theme500 = [...source.matchAll(/["'`]Colors\/theme\/500["'`]/g)].map(
    (match) => ownerOf(match.index),
  );
  const onStage = theme500.filter((owner) => owner === "createExampleMapStage");
  const stray = theme500.filter((owner) => owner !== "createExampleMapStage");
  const built = /`Colors\/theme\/\$\{/.test(source);
  ok(
    onStage.length > 0 && stray.length === 0 && !built,
    `no part binds Colors/theme/500 outside the example map stage (${onStage.length} on the stage; ${stray.length} elsewhere${stray.length > 0 ? `: ${[...new Set(stray)].join(", ")}` : ""}${built ? "; a name built from a template" : ""})`,
  );

  // Figma offers a variable only where its scopes say, and the payload's
  // suggested scopes are what Update writes. Decision 59 binds the theme fill
  // to the edge of a control it fills, and the theme foreground to every mark
  // on the fill (an icon's stroke, the Switch thumb, ManoeuvreCard's grip), so
  // each binding painted here must be one its variable's scopes allow.
  const manoeuvre = await painted("updateManoeuvreCardVariant", {
    value: "Closed",
    second: "Theme",
  });
  const scopesOf = new Map(
    JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "docs/figma-foundations-payload.json"),
        "utf8",
      ),
    ).variables.map((variable) => [
      variable.figmaName,
      variable.suggestedScopes || [],
    ]),
  );
  const SHAPES = new Set([
    "RECTANGLE",
    "ELLIPSE",
    "VECTOR",
    "POLYGON",
    "STAR",
    "LINE",
    "BOOLEAN_OPERATION",
  ]);
  const scopeFor = (node, property) => {
    if (property === "strokes") return "STROKE_COLOR";
    if (node.type === "TEXT") return "TEXT_FILL";
    return SHAPES.has(node.type) ? "SHAPE_FILL" : "FRAME_FILL";
  };
  const bound = new Set();
  const outOfScope = new Set();
  const visit = (node) => {
    for (const property of ["fills", "strokes"]) {
      for (const paint of Array.isArray(node[property]) ? node[property] : []) {
        const variable = boundVariableName(paint);
        if (variable !== FILL && variable !== INK) continue;
        const scope = scopeFor(node, property);
        const scopes = scopesOf.get(variable) || [];
        const short =
          variable === FILL ? "the theme fill" : "the theme foreground";
        bound.add(`${short} as ${scope}`);
        if (!scopes.includes(scope) && !scopes.includes("ALL_SCOPES")) {
          outOfScope.add(
            `${short} as ${scope} (${node.name}; scoped ${scopes.join(", ")})`,
          );
        }
      }
    }
    for (const child of node.children || []) visit(child);
  };
  for (const root of paintedHere) visit(root);
  ok(
    manoeuvre &&
      outOfScope.size === 0 &&
      [
        "the theme fill as STROKE_COLOR",
        "the theme foreground as SHAPE_FILL",
        "the theme foreground as STROKE_COLOR",
      ].every((use) => bound.has(use)),
    `the theme fill and the theme foreground are scoped for every property painted here (${[...bound].sort().join(", ")}${outOfScope.size > 0 ? `; out of scope: ${[...outOfScope].join(" | ")}` : ""})`,
  );
}

// --- Decision 61: the secondary Button is the neutral fill -------------------------

// Olcay, 2026-10-08: the secondary variant draws the neutral emotion's Primary
// Buttons tokens with their ink on every platform. The painter bound
// background/200 and foreground/0, which read the same in Light but are
// #2E3138 under white in Dark, where the neutral fill is #464A53. Each state
// binds its own tier token, as Default and Destructive do, and every part
// that paints through buttonConfig (Button, IconButton, SplitButton and
// FloatingActionButton) takes it. Read in Light and in Dark through the
// payload's variables.
section("Decision 61: the secondary Button is the neutral fill");
{
  const NEUTRAL = "Primary Buttons/neutral/button";
  const tokens = payloadVariables([...variableByName.keys()]);
  const context = plugin.createVariableContext(
    tokens.collections,
    tokens.variables,
  );
  const toHex = (color) =>
    color
      ? `#${[color.r, color.g, color.b]
          .map((channel) =>
            Math.round(channel * 255)
              .toString(16)
              .padStart(2, "0")
              .toUpperCase(),
          )
          .join("")}`
      : null;
  const reads = (paint) =>
    paint
      ? `${boundVariableName(paint)} ${toHex(plugin.solidPaintToRgba(paint, context, "Light"))}/${toHex(plugin.solidPaintToRgba(paint, context, "Dark"))}`
      : "no paint";
  const fill = `${NEUTRAL}/background/idle #C7CAD1/#464A53`;
  const ink = `${NEUTRAL}/foreground/content/idle #000000/#FFFFFF`;

  for (const state of ["Default", "Loading", "Disabled"]) {
    const tokenState = state === "Disabled" ? "disabled" : "idle";
    const config = plugin.buttonConfig("Secondary", state);
    ok(
      config.background === `${NEUTRAL}/background/${tokenState}` &&
        config.foreground === `${NEUTRAL}/foreground/content/${tokenState}` &&
        !config.stroke,
      `Button, Secondary, ${state}: the neutral Primary Buttons ${tokenState} tokens (${config.background}, ${config.foreground})`,
    );
  }
  for (const [label, config] of [
    ["SplitButton, Secondary", plugin.splitButtonConfig("Secondary", "Focus")],
    [
      "FloatingActionButton, Secondary",
      plugin.floatingActionButtonConfig("Secondary", "Default"),
    ],
  ]) {
    ok(
      config.background === `${NEUTRAL}/background/idle` &&
        config.foreground === `${NEUTRAL}/foreground/content/idle`,
      `${label}: the neutral fill and its ink (${config.background}, ${config.foreground})`,
    );
  }

  const button = await plugin.createButtonVariant({
    variant: "Secondary",
    size: "Default",
    state: "Default",
    variableByName: tokens.variableByName,
    fonts: FONTS,
    textStyle: null,
    stats: freshStats(),
  });
  const label = named(button, "Label Text");
  ok(
    reads(button.fills[0]) === fill,
    `Button, Secondary: the neutral fill, #C7CAD1 in Light and #464A53 in Dark (${reads(button.fills[0])})`,
  );
  ok(
    label && reads(label.fills[0]) === ink,
    `Button, Secondary: its words the neutral ink, black in Light and white in Dark (${label && reads(label.fills[0])})`,
  );
  const loading = await plugin.createButtonVariant({
    variant: "Secondary",
    size: "Default",
    state: "Loading",
    variableByName: tokens.variableByName,
    fonts: FONTS,
    textStyle: null,
    stats: freshStats(),
  });
  const spinner = named(loading, "Loading Indicator");
  ok(
    spinner && reads(spinner.strokes[0]) === ink,
    `Button, Secondary, Loading: the ring the neutral ink (${spinner && reads(spinner.strokes[0])})`,
  );
}

// --- Every frame keeps the size it was drawn at -----------------------------------

// The runtime grows an auto-layout frame its padding and stroke outgrow, and
// says nothing (see AUTO_LAYOUT_BOX_FIELDS in the harness). figma:verify sees
// it only where the grown frame then overflows its parent, as DynamicIsland's
// slots did; a slot drawn at 20 and grown to 26 inside a 44 card passes it.
// So every Product / SDK set is painted here, variant by variant, as its
// Update paints it, and every frame is held to the size it was drawn at. The
// Core sets whose Update goes through the shared single-axis or state and
// status helper are painted too; the rest update through code of their own,
// which this cannot reach.
section("Every frame keeps the size it was drawn at");
{
  // A set's Update hands its painter and its values to a shared helper, which
  // needs the set in the file; returned instead, they can be painted here.
  const capture = [
    "",
    ";updateSingleAxisComponent = async function (config) { return { __singleAxis: config }; };",
    ";updateStateStatusComponent = async function (config) { return { __stateStatus: config }; };",
    "",
  ].join("\n");
  const scanPages = ["Components", "Icons", "Utilities"].map(
    (name) => new MockNode("PAGE", name),
  );
  const scanFigma = createFigmaMock({ pages: scanPages });
  const scan = loadPlugin({
    pluginPath: PLUGIN,
    figma: scanFigma,
    append: capture,
  });
  // The registry's icons and the UI icons it does not name (decision 121).
  for (const definition of scan.KOSMOS_ICON_DEFINITIONS.concat(
    scan.IMPORTER_UI_ICON_DEFINITIONS || [],
  )) {
    scanPages[1].appendChild(mockIconComponent(definition.name));
  }
  const tokens = payloadVariables([...variableByName.keys()]);
  const jobsFor = async (name, update) => {
    const captured = await update();
    if (captured && captured.__singleAxis) {
      const config = captured.__singleAxis;
      return config.values.map((value) => [config.updateVariant, { value }]);
    }
    if (captured && captured.__stateStatus) {
      const config = captured.__stateStatus;
      const jobs = [];
      for (const state of config.states) {
        for (const status of config.statuses) {
          for (const type of config.types || [null]) {
            jobs.push([config.updateVariant, { state, status, type }]);
          }
        }
      }
      return jobs;
    }
    const factory =
      scan[name.charAt(0).toLowerCase() + name.slice(1) + "ComponentConfig"];
    if (typeof factory !== "function") return null;
    const config = factory();
    return config
      .combinations()
      .map((props) => [config.updateVariant, { props }]);
  };
  const paint = async (sequence) => {
    const outcome = {
      reached: [],
      unreached: [],
      variants: 0,
      thrown: [],
      grown: [],
    };
    for (const [name, update] of sequence) {
      const jobs = await jobsFor(name, update);
      if (!jobs) {
        outcome.unreached.push(name);
        continue;
      }
      outcome.reached.push(name);
      for (const [painter, args] of jobs) {
        const component = scanFigma.createComponent();
        scanPages[0].appendChild(component);
        try {
          await painter(component, {
            ...args,
            variableByName: tokens.variableByName,
            fonts: FONTS,
            stats: freshStats(),
          });
        } catch (error) {
          outcome.thrown.push(
            `${name} ${JSON.stringify(args)}: ${error.message}`,
          );
          continue;
        }
        outcome.variants += 1;
        for (const frame of framesLargerThanAsked(component)) {
          outcome.grown.push(
            `${name} / ${component.name} > ${frame.name}: ${frame.width}×${frame.height}, drawn at ${frame.requestedSize.width}×${frame.requestedSize.height}`,
          );
        }
        component.remove();
      }
    }
    return outcome;
  };

  const product = await paint(scan.PRODUCT_SDK_UPDATE_SEQUENCE);
  ok(
    product.unreached.length === 0 && product.thrown.length === 0,
    `every Product / SDK set is painted, all ${product.variants} variants (${product.unreached.join(", ")}${product.thrown.slice(0, 3).join(" | ")})`,
  );
  ok(
    product.grown.length === 0,
    `no Product / SDK frame is larger than it was drawn (${product.grown.length}: ${product.grown.slice(0, 4).join(" | ")})`,
  );
  const core = await paint(scan.CORE_UPDATE_SEQUENCE);
  ok(
    core.reached.length > 0 && core.thrown.length === 0,
    `${core.reached.length} of ${scan.CORE_UPDATE_SEQUENCE.length} Core sets painted, ${core.variants} variants; the other ${core.unreached.length} update through code of their own (${core.thrown.slice(0, 3).join(" | ")})`,
  );
  ok(
    core.grown.length === 0,
    `no Core frame painted here is larger than it was drawn (${core.grown.length}: ${core.grown.slice(0, 4).join(" | ")})`,
  );
}

// --- Every binding is in its variable's scope -------------------------------------

// Figma offers a variable only in the pickers its scopes name, and Update
// writes the payload's suggested scopes, and the plugin's own for its
// component tokens. A paint bound outside them still draws, but a designer who
// detaches it cannot pick the token back, and the file says the token is not
// for that use. On 2026-10-08 the painters bound 45 variables outside their
// scopes: theme/600 on words and edges, the foreground ramp on icon strokes,
// the category tokens on edges and digits, a divider width on a width. So
// every set is built and then updated in place, the way Build and Update draw
// it, with the Core sets the frame check above cannot reach; the example pages
// after them; and every binding on every node is held to its variable's
// scopes, read the way Figma reads them.
section("Every binding is in its variable's scope");
{
  const scopePages = ["Components", "Icons", "Utilities"].map(
    (name) => new MockNode("PAGE", name),
  );
  const scopeFigma = createFigmaMock({ pages: scopePages });
  scopeFigma.createTextStyle = createMockTextStyle;
  scopeFigma.createStar = () => new MockNode("STAR", "Star");
  scopeFigma.createSection = () => new MockNode("SECTION", "Section");
  // Build and Update read the file's variables through this one helper, and
  // the harness creates none: it hands them the payload's and the tokens'.
  const scoped = loadPlugin({
    pluginPath: PLUGIN,
    figma: scopeFigma,
    append:
      "\n;ensureComponentRuntimeVariables = async function () { return figma.__scopeVariables; };\n",
  });
  // The registry's icons and the UI icons it does not name (decision 121).
  for (const definition of scoped.KOSMOS_ICON_DEFINITIONS.concat(
    scoped.IMPORTER_UI_ICON_DEFINITIONS || [],
  )) {
    scopePages[1].appendChild(mockIconComponent(definition.name));
  }
  const componentTokens = scoped.COMPONENT_FLOAT_TOKENS || [];
  scopeFigma.__scopeVariables = payloadVariables(
    componentTokens.map((token) => token.name),
  ).variableByName;

  // Where each variable may be picked: the payload's suggested scopes, or a
  // component token's own. Update writes no scope from an empty list, so a
  // variable it creates keeps Figma's default, every scope.
  const scopesOf = new Map();
  for (const variable of JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "docs/figma-foundations-payload.json"),
      "utf8",
    ),
  ).variables) {
    scopesOf.set(variable.figmaName, variable.suggestedScopes || []);
  }
  for (const token of componentTokens) {
    scopesOf.set(token.name, token.scopes || []);
  }
  const allows = (scopes, scope) =>
    scopes.length === 0 ||
    scopes.includes("ALL_SCOPES") ||
    scopes.includes(scope) ||
    (/_FILL$/.test(scope) && scopes.includes("ALL_FILLS"));

  // Figma's scopes by what is bound: a fill by the node it fills, a stroke's
  // colour wherever it is, a gradient stop as its paint, and the number
  // fields by the property they set (padding is a gap).
  const SHAPE_NODES = new Set([
    "RECTANGLE",
    "ELLIPSE",
    "POLYGON",
    "STAR",
    "VECTOR",
    "LINE",
    "BOOLEAN_OPERATION",
  ]);
  const fillScope = (node) =>
    node.type === "TEXT"
      ? "TEXT_FILL"
      : SHAPE_NODES.has(node.type)
        ? "SHAPE_FILL"
        : "FRAME_FILL";
  const FIELD_SCOPES = {
    width: "WIDTH_HEIGHT",
    height: "WIDTH_HEIGHT",
    minWidth: "WIDTH_HEIGHT",
    maxWidth: "WIDTH_HEIGHT",
    minHeight: "WIDTH_HEIGHT",
    maxHeight: "WIDTH_HEIGHT",
    itemSpacing: "GAP",
    counterAxisSpacing: "GAP",
    paddingLeft: "GAP",
    paddingRight: "GAP",
    paddingTop: "GAP",
    paddingBottom: "GAP",
    cornerRadius: "CORNER_RADIUS",
    topLeftRadius: "CORNER_RADIUS",
    topRightRadius: "CORNER_RADIUS",
    bottomLeftRadius: "CORNER_RADIUS",
    bottomRightRadius: "CORNER_RADIUS",
    strokeWeight: "STROKE_FLOAT",
    strokeTopWeight: "STROKE_FLOAT",
    strokeRightWeight: "STROKE_FLOAT",
    strokeBottomWeight: "STROKE_FLOAT",
    strokeLeftWeight: "STROKE_FLOAT",
    opacity: "OPACITY",
    fontFamily: "FONT_FAMILY",
    fontStyle: "FONT_STYLE",
    fontWeight: "FONT_WEIGHT",
    fontSize: "FONT_SIZE",
    lineHeight: "LINE_HEIGHT",
    letterSpacing: "LETTER_SPACING",
    paragraphSpacing: "PARAGRAPH_SPACING",
    paragraphIndent: "PARAGRAPH_INDENT",
    characters: "TEXT_CONTENT",
  };
  const EFFECT_SCOPES = {
    color: "EFFECT_COLOR",
    radius: "EFFECT_FLOAT",
    spread: "EFFECT_FLOAT",
    offsetX: "EFFECT_FLOAT",
    offsetY: "EFFECT_FLOAT",
  };

  // Every use, once: "<variable> as <scope>", with where it was seen.
  const uses = new Map();
  const unmapped = new Set();
  const record = (alias, scope, node, owner) => {
    if (!alias || !alias.id) return;
    const variable = String(alias.id).replace(/^VariableID:/, "");
    if (!scope) {
      unmapped.add(`${variable} on ${owner} > ${node.name}`);
      return;
    }
    const key = `${variable} as ${scope}`;
    if (!uses.has(key)) uses.set(key, { variable, scope, where: new Set() });
    uses.get(key).where.add(`${owner} > ${node.name}`);
  };
  const visit = (node, owner) => {
    for (const [property, scope] of [
      ["fills", fillScope(node)],
      ["strokes", "STROKE_COLOR"],
    ]) {
      for (const paint of Array.isArray(node[property]) ? node[property] : []) {
        if (!paint) continue;
        if (paint.boundVariables) {
          record(paint.boundVariables.color, scope, node, owner);
        }
        for (const stop of paint.gradientStops || []) {
          if (stop.boundVariables) {
            record(stop.boundVariables.color, scope, node, owner);
          }
        }
      }
    }
    for (const effect of Array.isArray(node.effects) ? node.effects : []) {
      for (const [field, alias] of Object.entries(
        (effect && effect.boundVariables) || {},
      )) {
        record(alias, EFFECT_SCOPES[field], node, owner);
      }
    }
    for (const [field, alias] of Object.entries(node.boundVariables || {})) {
      // Figma mirrors bound paints here too; they are read from the paints.
      if (field === "fills" || field === "strokes" || field === "effects") {
        continue;
      }
      for (const each of Array.isArray(alias) ? alias : [alias]) {
        record(each, FIELD_SCOPES[field], node, owner);
      }
      if (alias && !Array.isArray(alias) && typeof node[field] === "number") {
        written.push({ alias, field, node, owner, value: node[field] });
      }
    }
    for (const child of node.children || []) visit(child, owner);
  };
  // Every number a painter wrote to a field it then bound. Figma draws the
  // variable's value, not the painter's: on 2026-11-04 Card's Compact
  // variants drew 24 all round, because the painter wrote 16 and bound every
  // side to Card/padding, which is 24, and Container's Panel inset drew 24 for
  // its 16 the same way. The harness keeps the painter's number.
  const written = [];

  const sequence = [
    ...scoped.CORE_UPDATE_SEQUENCE,
    ...scoped.PRODUCT_SDK_UPDATE_SEQUENCE,
  ];
  const failed = [];
  let variants = 0;
  for (const [name, update] of sequence) {
    const build = scoped[`build${name}Component`];
    try {
      const built = typeof build === "function" ? await build() : null;
      const updated = await update();
      const set = scopeFigma.root.findOne(
        (node) => node.type === "COMPONENT_SET" && node.name === name,
      );
      const count = set
        ? set.children.filter((child) => child.type === "COMPONENT").length
        : 0;
      if (!built || !built.created || !updated.updated || count === 0) {
        failed.push(
          `${name}: ${(built && built.message) || updated.message || `${count} variants`}`,
        );
        continue;
      }
      variants += count;
      visit(set, name);
    } catch (error) {
      failed.push(`${name}: ${error.message}`);
    }
  }
  ok(
    failed.length === 0,
    `every set builds and updates in place, ${sequence.length} sets, ${variants} variants (${failed.slice(0, 3).join(" | ")})`,
  );
  let examples = [];
  try {
    const result = await scoped.buildAllExamplePages();
    examples = scopeFigma.root.findAll(
      (node) =>
        node.type === "FRAME" &&
        node.parent &&
        node.parent.type === "PAGE" &&
        /^Example \/ /.test(node.name),
    );
    for (const frame of examples) visit(frame, frame.name);
    ok(
      examples.length > 0 && examples.length === result.templateCount,
      `the example pages build, ${examples.length} of ${result.templateCount}`,
    );
  } catch (error) {
    ok(false, `the example pages build (${error.message})`);
  }

  // One line per variable bound outside its scopes, with every use it needs.
  const unknown = new Set();
  const outside = new Map();
  for (const use of uses.values()) {
    if (!scopesOf.has(use.variable)) {
      unknown.add(use.variable);
      continue;
    }
    if (allows(scopesOf.get(use.variable), use.scope)) continue;
    if (!outside.has(use.variable)) outside.set(use.variable, []);
    outside.get(use.variable).push(use);
  }
  for (const [variable, needs] of [...outside].sort()) {
    ok(
      false,
      `${variable} is bound as ${needs.map((use) => use.scope).join(", ")}, outside its scopes ${scopesOf.get(variable).join(", ")} (${needs
        .map((use) => [...use.where].slice(0, 2).join(", "))
        .join("; ")})`,
    );
  }
  ok(
    unknown.size === 0,
    `every bound variable is the payload's or a component token (${[...unknown].join(", ")})`,
  );
  ok(
    unmapped.size === 0,
    `every bound field has a scope here (${[...unmapped].slice(0, 4).join(", ")})`,
  );
  // Variants a painter means to differ, drawn the same: one layer, written a
  // different number in different variants of a set, and bound in all of them
  // to one variable, whose value Figma draws in place of every one of them.
  const byLayer = new Map();
  for (const use of written) {
    const variable = String(use.alias.id).replace(/^VariableID:/, "");
    // A variant's root is named for its variant; it is one layer in all.
    const layer =
      use.node.parent && use.node.parent.type === "COMPONENT_SET"
        ? "variant root"
        : use.node.name;
    const key = `${use.owner} / ${layer} ${use.field} bound to ${variable}`;
    if (!byLayer.has(key))
      byLayer.set(key, { values: new Set(), pills: 0, uses: 0 });
    // A corner at half the shorter side or past it is a pill whatever its
    // number, so FloatingActionButton's 24, 28 and 32 are one drawing.
    const half = Math.min(use.node.width || 0, use.node.height || 0) / 2;
    const layerUses = byLayer.get(key);
    layerUses.values.add(use.value);
    if (/Radius$/i.test(use.field) && half > 0 && use.value >= half) {
      layerUses.pills += 1;
    }
    layerUses.uses += 1;
  }
  const flattened = [...byLayer]
    .filter(([, layer]) => layer.values.size > 1 && layer.pills < layer.uses)
    .map(
      ([key, layer]) => `${key}, written ${[...layer.values].join(" and ")}`,
    );
  ok(
    flattened.length === 0,
    `no axis is undone by a binding: a layer written different numbers in different variants is not bound to one variable (${flattened.join("; ")})`,
  );
  const variables = new Set([...uses.values()].map((use) => use.variable));
  ok(
    uses.size > 500 && outside.size === 0,
    `${uses.size} uses of ${variables.size} variables, each in its scopes (${outside.size} variables outside)`,
  );
  if (uses.size > 500 && outside.size === 0) {
    console.log(
      `  ${uses.size} uses of ${variables.size} variables, across ${sequence.length} sets (${variants} variants) and ${examples.length} example pages, each in its variable's scopes`,
    );
  }
}

// --- POIResultCard's action row ------------------------------------------------------

// Decision 68 (Olcay, 2026-10-08): the Featured tag consumes the accent
// everywhere: the featured card's Featured badge is the accent fill under the
// accent's ink, and its edge is the accent, as the code draws the card's tab
// and edge. It was a background/100 badge under alert 900, on a grey edge.
section("POIResultCard Featured is the accent");
{
  const component = figma.createComponent();
  const stats = freshStats();
  await plugin.updatePOIResultCardVariant(component, {
    value: "Featured",
    variableByName,
    fonts: FONTS,
    stats,
  });
  const badge = named(component, "Featured Badge");
  const words = named(component, "Featured Text");
  ok(
    badge && boundVariableName(badge.fills[0]) === "Accent/fill",
    `the Featured badge is the accent fill (${badge && boundVariableName(badge.fills[0])})`,
  );
  ok(
    words && boundVariableName(words.fills[0]) === "Accent/onFill",
    `its words are the accent's ink (${words && boundVariableName(words.fills[0])})`,
  );
  ok(
    boundVariableName(component.strokes[0]) === "Accent/fill",
    `the featured card's edge is the accent (${boundVariableName(component.strokes[0])})`,
  );
}

// A selected result offers what the product gave it, and the card has to have
// somewhere to put that. The row is drawn on EVERY variant and hidden, because
// an Actions boolean toggles a layer: one that existed only on Selected could
// not be turned on anywhere else.
section("POIResultCard actions");
{
  const component = figma.createComponent();
  const stats = freshStats();
  await plugin.updatePOIResultCardVariant(component, {
    value: "Selected",
    variableByName,
    fonts: FONTS,
    stats,
  });

  const resultRow = named(component, "Result Row");
  const actionsRow = named(component, "Actions Row");
  ok(
    resultRow && actionsRow,
    `a Result Row and an Actions Row (${component.children.map((child) => child.name).join(", ")})`,
  );
  ok(
    component.layoutMode === "VERTICAL",
    `the card stacks them (${component.layoutMode})`,
  );
  ok(
    actionsRow && actionsRow.visible === false,
    "the action row is hidden until the Actions property asks for it",
  );
  const buttons = actionsRow
    ? actionsRow.children.filter((child) => child.name.endsWith("Action"))
    : [];
  ok(
    actionsRow?.height === 56 &&
      buttons.every((button) => button.height === 44),
    "GAP-056: 44px result actions plus the row's 12px bottom inset",
  );
  ok(
    buttons.length === 3 &&
      buttons[0].name === "Primary Action" &&
      buttons[1].name === "Secondary Action" &&
      buttons[2].name === "Host Action",
    `two actions, primary first, then the product's own (${buttons.map((b) => b.name).join(", ")})`,
  );
  ok(
    buttons.length === 3 &&
      boundVariableName(buttons[0].fills[0]) ===
        "Primary Buttons/themed/button/background/idle" &&
      boundVariableName(buttons[1].fills[0]) === "Surface/0" &&
      buttons[1].strokeWeight === 1 &&
      boundVariableName(buttons[2].fills[0]) === "Surface/0" &&
      boundVariableName(buttons[2].strokes[0]) === "Border/Subtle" &&
      buttons[2].strokeWeight === 1,
    `the primary is the theme fill, the secondary and the host action outlined (${buttons.map((b) => boundVariableName(b.fills[0])).join(", ")})`,
  );
  // GAP-028: the product's own action is drawn on every variant and hidden,
  // its icon before its words, until the Host Action property shows it.
  const host = buttons[2];
  ok(
    host &&
      host.visible === false &&
      buttons[0].visible !== false &&
      buttons[1].visible !== false,
    "the host action is hidden until Host Action asks for it; Go and Details are not",
  );
  ok(
    host &&
      host.children.map((child) => child.name).join(", ") ===
        "Host Action Icon, Host Action Text" &&
      host.children[0].type === "INSTANCE" &&
      host.children[1].characters === "Reserve a table" &&
      host.itemSpacing === 8,
    `the host action's icon leads its words, 8 apart (${host && host.children.map((child) => `${child.type} ${child.name}`).join(", ")})`,
  );
  // The primary is drawn as a default Button: its label is the theme
  // foreground, white in both themes. Surface/0 turned black in the dark.
  const primaryLabel =
    buttons[0] && buttons[0].findOne((node) => node.type === "TEXT");
  ok(
    primaryLabel &&
      boundVariableName(primaryLabel.fills[0]) ===
        "Primary Buttons/themed/button/foreground/content/idle",
    `the primary's label is the theme foreground (${primaryLabel && boundVariableName(primaryLabel.fills[0])})`,
  );
  // The selected card's edge is a border on the surface: the theme's 600.
  ok(
    boundVariableName(component.strokes[0]) === "Colors/theme/600",
    `the selected card's edge is the theme's 600 (${boundVariableName(component.strokes[0])})`,
  );
  // The logo and copy must have moved WITH the row, not been left on the card.
  ok(
    resultRow &&
      named(resultRow, "Logo Slot") &&
      named(resultRow, "Result Copy"),
    "the logo and copy live in the result row",
  );
  // named() is findOne, so it reaches descendants: the card must not hold the
  // logo as its OWN child, which is what moving it into the row means.
  ok(
    !component.children.some((child) => child.name === "Logo Slot"),
    `and the card holds only the two rows (${component.children.map((c) => c.name).join(", ")})`,
  );

  // The Host Action property shows the product's own action and Host Action
  // Text says its words, on every variant.
  const variants = [];
  for (const state of ["Default", "Selected"]) {
    const variant = figma.createComponent();
    await plugin.updatePOIResultCardVariant(variant, {
      value: state,
      second: "Card",
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    variants.push(variant);
  }
  const set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "POIResultCard";
  plugin.configurePOIResultCardProperties(set, freshStats());
  const definitions = set.componentPropertyDefinitions;
  const byBase = (base, type) =>
    Object.keys(definitions).find(
      (key) => key.split("#")[0] === base && definitions[key].type === type,
    );
  const hostProperty = byBase("Host Action", "BOOLEAN");
  const hostText = byBase("Host Action Text", "TEXT");
  ok(
    hostProperty &&
      definitions[hostProperty].defaultValue === false &&
      hostText &&
      definitions[hostText].defaultValue === "Reserve a table",
    `a Host Action boolean, off, and Host Action Text (${Object.keys(definitions).join(", ")})`,
  );
  ok(
    Boolean(hostProperty && hostText) &&
      variants.every((variant) => {
        const button = named(variant, "Host Action");
        const words = named(variant, "Host Action Text");
        return (
          button?.componentPropertyReferences?.visible === hostProperty &&
          words?.componentPropertyReferences?.characters === hostText
        );
      }),
    "every variant's host action shows through Host Action and says Host Action Text",
  );
}

// --- Variants keep their own room, and kept defaults are drawn again --------------

// Two things the renders of 2026-11-04 showed that no check read. Card's Full
// grew to 234 on a 220 row step and covered the Compact row under it, as
// EmptyState's did by 8: a row now starts at its step or 24 under the tallest
// variant above it. And an Update kept what a header slot held, so Navbar's
// three oldest variants and Sidebar's Default ones kept a square mark the
// rest drew as a circle, and Sidebar's Default Tools rows kept an older
// drawing 2 to the inline end: the plugin's own mark, name and tool rows are
// drawn again, a designer's content is kept, and the mark is a rounded square
// at 8 (Olcay).
section("Variants keep their own room, and kept defaults are drawn again");
{
  const box = (node) => ({
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  });
  const laidOut = (heights, yStep) => {
    const set = new MockNode("COMPONENT_SET", "Card");
    for (const [index, height] of heights.entries()) {
      const variant = new MockNode("COMPONENT", "");
      variant.name = `Content=${["Basic", "Header", "Full"][index % 3]}, Padding=${index < 3 ? "Default" : "Compact"}`;
      variant.resizeWithoutConstraints(360, height);
      set.appendChild(variant);
    }
    // The layout helper's rows, read by Padding alone: Card's own second
    // axis is Padding, HeaderTone and TitleSize together (CLOUD-UI-001,
    // GAP-035), and these six are its Default tone and title.
    plugin.layoutSingleAxisVariants(set, {
      values: ["Basic", "Header", "Full"],
      axis2Values: ["Default", "Compact"],
      xStep: 420,
      yStep,
      parseVariantName: (name) => {
        const props = plugin.parseCardVariantName(name);
        return (
          props && {
            value: props.value,
            // Guarded: a painter before these axes has no cardSecondParts
            // and its second is the padding itself.
            second:
              typeof plugin.cardSecondParts === "function"
                ? plugin.cardSecondParts(props.second).padding
                : props.second,
          }
        );
      },
    });
    for (const variant of set.children) {
      variant.absoluteBoundingBox = box(variant);
    }
    return set;
  };
  const grown = laidOut([92, 166, 234, 92, 150, 202], 220);
  const covered = variantsThatOverlap("Card", grown);
  const compactTop = grown.children[3].y;
  ok(
    covered.length === 0 && compactTop === 234 + 24,
    `a row starts 24 under the tallest variant above it when its step is short (Compact at ${compactTop}; ${covered.join("; ")})`,
  );
  const roomy = laidOut([92, 120, 150, 92, 110, 130], 220);
  ok(
    roomy.children[3].y === 220,
    `and keeps its step when that is room enough (${roomy.children[3].y})`,
  );

  const tokens = payloadVariables([...variableByName.keys()]);
  const drawn = { variableByName: tokens.variableByName, fonts: FONTS };
  const markIn = (component, slotName) => {
    const slot = named(component, slotName);
    return slot && named(slot, "Brand Mark");
  };
  const checks = [
    {
      what: "Navbar",
      slot: "Logo Slot",
      props: {
        content: "Basic",
        navigationAlign: "Center",
        logoInset: "False",
      },
      create: (props) =>
        plugin.createNavbarVariant({ props, ...drawn, stats: freshStats() }),
      update: (component, props) =>
        plugin.updateNavbarVariant(component, {
          props,
          ...drawn,
          stats: freshStats(),
        }),
    },
    {
      what: "Sidebar",
      slot: "Header Slot",
      props: { content: "Basic", inset: "Default" },
      create: (props) =>
        plugin.createSidebarVariant({ props, ...drawn, stats: freshStats() }),
      update: (component, props) =>
        plugin.updateSidebarVariant(component, {
          props,
          ...drawn,
          stats: freshStats(),
        }),
    },
  ];
  for (const check of checks) {
    const component = await check.create(check.props);
    const fresh = markIn(component, check.slot);
    ok(
      fresh && fresh.cornerRadius === 8,
      `${check.what}: the mark is a rounded square, 8 on its 32 (${fresh ? fresh.cornerRadius : "no mark"})`,
    );
    // As an older painter left it: the control radius, before it grew.
    if (fresh) fresh.cornerRadius = 16;
    await check.update(component, check.props);
    const again = markIn(component, check.slot);
    ok(
      again && again.cornerRadius === 8,
      `${check.what}: an Update draws the plugin's mark again (${again ? again.cornerRadius : "no mark"})`,
    );

    // A designer's logo in the slot keeps the slot as it is.
    const designed = await check.create(check.props);
    const slot = named(designed, check.slot);
    const logo = new MockNode("FRAME", "Customer Logo");
    if (slot) slot.appendChild(logo);
    await check.update(designed, check.props);
    const after = named(designed, check.slot);
    ok(
      after && named(after, "Customer Logo"),
      `${check.what}: a designer's logo in the ${check.slot} is kept`,
    );
  }

  // Sidebar's tool rows, kept from an older drawing, are drawn again.
  const toolsProps = { content: "Tools", inset: "Default" };
  const tools = await plugin.createSidebarVariant({
    props: toolsProps,
    ...drawn,
    stats: freshStats(),
  });
  const toolRow = () => {
    const slot = named(tools, "Tools Slot");
    return slot && named(slot, "Tool Text Row");
  };
  const first = toolRow();
  const freshGap = first && first.itemSpacing;
  if (first) first.itemSpacing = freshGap + 2;
  await plugin.updateSidebarVariant(tools, {
    props: toolsProps,
    ...drawn,
    stats: freshStats(),
  });
  const redrawn = toolRow();
  ok(
    first && redrawn && redrawn !== first && redrawn.itemSpacing === freshGap,
    `Sidebar: an Update draws the Tools rows again (${redrawn ? redrawn.itemSpacing : "none"} of ${freshGap}, ${redrawn === first ? "the kept row" : "a new row"})`,
  );
}

// --- Navbar's kept slots are drawn again ------------------------------------------

// The audit after #463 found the same thing in Navbar's other slots: its
// oldest variant of each Content kept an Action, a Primary Action and a
// Utility Button at radius 8, and an avatar at 16, beside the 16 and 20 the
// variants added since were drawn with. What the plugin put in a slot is
// drawn again on Update, and a designer's own content is kept.
section("Navbar's kept slots are drawn again");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const drawn = { variableByName: tokens.variableByName, fonts: FONTS };
  const variant = (content) => ({
    content,
    navigationAlign: "Center",
    logoInset: "False",
  });
  const paint = (props) =>
    plugin.createNavbarVariant({ props, ...drawn, stats: freshStats() });
  const repaint = (component, props) =>
    plugin.updateNavbarVariant(component, {
      props,
      ...drawn,
      stats: freshStats(),
    });
  const inSlot = (component, slotName, layer) => {
    const slot = named(component, slotName);
    return slot && (slot.children || []).find((c) => c.name === layer);
  };
  for (const [content, slotName, layer] of [
    ["Actions", "Actions Slot", "Action"],
    ["Contextual", "Primary Action Slot", "Primary Action"],
    ["Contextual", "Utility Slot", "Utility Button"],
    ["Contextual", "Account Slot", "Account Avatar"],
  ]) {
    const props = variant(content);
    const component = await paint(props);
    const fresh = inSlot(component, slotName, layer);
    const radius = fresh && fresh.cornerRadius;
    // As an older painter left it.
    if (fresh) fresh.cornerRadius = 8;
    await repaint(component, props);
    const again = inSlot(component, slotName, layer);
    ok(
      fresh && again && again !== fresh && again.cornerRadius === radius,
      `Navbar ${content}: an Update draws the ${layer} in the ${slotName} again (${again ? again.cornerRadius : "none"} of ${radius}, ${again === fresh ? "the kept layer" : "a new layer"})`,
    );
  }
  const designed = await paint(variant("Contextual"));
  const utility = named(designed, "Utility Slot");
  if (utility) utility.appendChild(new MockNode("FRAME", "Help Button"));
  await repaint(designed, variant("Contextual"));
  const kept = named(designed, "Utility Slot");
  ok(
    kept && named(kept, "Help Button"),
    "Navbar: a designer's button in the Utility Slot is kept",
  );
}

// --- Curated Icons ------------------------------------------------------------------

// Every tint an icon slot carries is an override keyed through its icon
// source's layer id, so an Update that draws a source again drops them: until
// 2026-09-22 every Curated Icons → Update did, for every set but the four it
// repaints. A second run keeps every source layer, id for id; a source that is
// no longer right is drawn again and said so; and the icons the Pointr library
// has no outline for are drawn from the SVGs the plugin carries, as shapes that
// scale.
section("Curated Icons");
{
  const library = new Map();
  const iconsPage = new MockNode("PAGE", "Icons");
  const icons = loadPlugin({
    pluginPath: PLUGIN,
    figma: createFigmaMock({ pages: [iconsPage], library }),
  });
  // The registry's icons and the UI icons it does not name (decision 121),
  // which Curated Icons imports beside them.
  const uiDefinitions = icons.IMPORTER_UI_ICON_DEFINITIONS || [];
  const definitions = icons.KOSMOS_ICON_DEFINITIONS.concat(uiDefinitions);
  for (const definition of definitions) {
    if (!definition.componentKey) continue;
    const source = mockIconComponent(definition.name);
    source.key = definition.componentKey;
    library.set(definition.componentKey, source);
  }
  const components = () =>
    iconsPage.children.filter((node) => node.type === "COMPONENT");
  const sourceIds = () =>
    new Map(
      components().map((component) => [
        component.name,
        component.children.map((child) => child.id).join(","),
      ]),
    );

  // Pointr Maps - Express's wayfinding glyphs are drawn from the SVGs the
  // plugin carries (KOZMOS_WAYFINDING_ICONS, generated from the code's
  // navigation-glyphs.json), as solid shapes that scale.
  const wayfinding = icons.KOZMOS_WAYFINDING_ICONS || [];
  const total = definitions.length + wayfinding.length;
  const owned = definitions.filter((definition) => !definition.componentKey);
  const importable = definitions.length - owned.length;
  const first = await icons.syncIconSourceLibrary();
  ok(
    wayfinding.length === 23 &&
      owned.length === 2 &&
      first.created === total &&
      first.imported === importable &&
      first.drawn === wayfinding.length + owned.length &&
      first.failed === 0,
    `a first run makes all ${total}, importing the ${importable} Pointr icons and drawing the ${wayfinding.length} wayfinding glyphs and ${owned.length} owned icons (${JSON.stringify({ created: first.created, imported: first.imported, drawn: first.drawn, failed: first.failed })}; ${first.warnings.slice(0, 2).join(" | ")})`,
  );
  // The venue set's two names the library has no outline for (GAP-105): an
  // Owned Source frame of the package's own artwork, one solid, one stroked,
  // whichever a part's slot then does with it.
  for (const definition of owned) {
    const component = components().find(
      (node) => node.name === `Icon / ${definition.name}`,
    );
    const frame = component && component.children[0];
    ok(
      frame &&
        frame.type === "FRAME" &&
        frame.name === "Owned Source" &&
        frame.width === 24 &&
        frame.children.length > 0 &&
        frame.children.every((shape) => shape.type === "VECTOR") &&
        component.description.includes("packages/icons/src/owned/icons.ts") &&
        component.getSharedPluginData("kozmos_ds_importer", "icon-name") ===
          definition.name,
      `${definition.name} is a 24 Owned Source frame of the package's own artwork`,
    );
  }
  const elevator = components().find(
    (node) => node.name === "Icon / elevator-up",
  );
  const drawnSource = elevator && elevator.children[0];
  ok(
    drawnSource &&
      drawnSource.type === "FRAME" &&
      drawnSource.name === "Wayfinding Source" &&
      drawnSource.width === 24 &&
      drawnSource.children.length > 0 &&
      drawnSource.children.every(
        (shape) =>
          shape.type === "VECTOR" &&
          shape.fills.length === 1 &&
          shape.strokes.length === 0 &&
          shape.constraints.horizontal === "SCALE",
      ) &&
      elevator.description.includes("Pointr Maps - Express") &&
      elevator.getSharedPluginData("kozmos_ds_importer", "icon-name") ===
        "elevator-up",
    "a wayfinding glyph is a 24 frame of solid shapes that scale, from Pointr Maps - Express",
  );
  const before = sourceIds();
  const second = await icons.syncIconSourceLibrary();
  const after = sourceIds();
  ok(
    second.sourcesKept === total &&
      second.sourcesReplaced === 0 &&
      second.drawn === 0 &&
      after.size === total &&
      [...after].every(([name, ids]) => ids && before.get(name) === ids),
    `a second run keeps every source layer, id for id, the drawn ones too (kept ${second.sourcesKept}, drawn again ${second.sourcesReplaced})`,
  );
  ok(
    !second.warnings.some((warning) => /anew/.test(warning)),
    `and reports nothing drawn anew (${second.warnings.join(" | ")})`,
  );
  // And every run after it. A kept source is reset to the library's drawing,
  // and Figma's reset takes the layer's name with it; a run that then looked
  // for "Pointr Source" by name found none and drew all of them again, so
  // every second Curated Icons run orphaned every set's tints (2026-10-05).
  const again = await icons.syncIconSourceLibrary();
  const afterAgain = sourceIds();
  ok(
    again.sourcesKept === total &&
      again.sourcesReplaced === 0 &&
      [...afterAgain].every(([name, ids]) => ids && before.get(name) === ids),
    `a third run keeps every source layer too, id for id (kept ${again.sourcesKept}, drawn again ${again.sourcesReplaced})`,
  );
  ok(
    components()
      .filter((component) =>
        definitions.some(
          (definition) =>
            definition.componentKey &&
            component.name === `Icon / ${definition.name}`,
        ),
      )
      .every(
        (component) =>
          component.children.length === 1 &&
          component.children[0].name === "Pointr Source",
      ),
    "and each Pointr icon's one source is still named Pointr Source",
  );

  // A source that is some other icon's is drawn again, and the run says what
  // that costs.
  const bus = components().find((node) => node.name === "Icon / bus");
  const other = definitions.find((definition) => definition.name === "plus");
  if (bus && other)
    bus.children[0].mainComponent = library.get(other.componentKey);
  const third = await icons.syncIconSourceLibrary();
  ok(
    third.sourcesReplaced === 1 &&
      third.warnings.some(
        (warning) =>
          /anew \(bus\)/.test(warning) && /Update All Core/.test(warning),
      ),
    `a source that is not the icon's is drawn again, and named (${third.warnings.join(" | ")})`,
  );

  // A wayfinding source drawn from other artwork is drawn again, and named.
  const stairs = components().find((node) => node.name === "Icon / stairs-up");
  if (stairs)
    stairs.children[0].setSharedPluginData(
      "kozmos_ds_importer",
      "artwork",
      "x",
    );
  const fourth = await icons.syncIconSourceLibrary();
  ok(
    fourth.sourcesReplaced === 1 &&
      fourth.drawn === 1 &&
      fourth.warnings.some((warning) => /anew \(stairs-up\)/.test(warning)),
    `a wayfinding source with other artwork is drawn again, and named (${fourth.warnings.join(" | ")})`,
  );

  const pointr = components();
  ok(
    pointr.length === total &&
      pointr.every(
        (component) =>
          icons.auditIconSourceComponent(
            component,
            component.name.replace(/^Icon \/ /, ""),
          ).issues.length === 0,
      ),
    `the ${pointr.length} icons, Pointr, owned and wayfinding, audit clean`,
  );

  // Every slot is offered the Pointr outlines. A wayfinding glyph or an owned
  // icon is drawn, so a stroke tint keyed through a Pointr outline's layers
  // cannot reach it; a category's slot, which tints its own, offers the owned.
  const general = await icons.findKozmosIconSourceComponents();
  const isOwnedSource = (component) =>
    owned.some((definition) => component.name === `Icon / ${definition.name}`);
  ok(
    general.length === importable &&
      !general.some(isOwnedSource) &&
      !general.some((component) =>
        wayfinding.some((icon) => component.name === `Icon / ${icon.name}`),
      ),
    `every slot is offered all ${general.length} Pointr icons, and no wayfinding glyph or owned icon, which a stroke tint cannot reach`,
  );
  const categorySlot = await icons.findKozmosIconSourceComponents({
    withOwned: true,
  });
  ok(
    categorySlot.length === definitions.length &&
      owned.every((definition) =>
        categorySlot.some(
          (component) => component.name === `Icon / ${definition.name}`,
        ),
      ),
    `a category's slot is offered the ${categorySlot.length} with the owned icons, utensils and accessibility among them`,
  );
}

// --- DirectionStep ---------------------------------------------------------------

section("DirectionStep");
{
  ok(
    Array.isArray(plugin.DIRECTION_STEP_TYPES) &&
      plugin.DIRECTION_STEP_TYPES.length === 19 &&
      ["Walking", "Enter", "Exit", "RampUp", "RampDown"].every((type) =>
        plugin.DIRECTION_STEP_TYPES.includes(type),
      ) &&
      plugin.DIRECTION_STEP_TYPES.includes("TurnBack"),
    "nineteen direction types, walking, entry, exit and the ramps among them",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("DirectionStep"),
      ) === JSON.stringify({ Type: plugin.DIRECTION_STEP_TYPES }),
    "the set expects the nineteen",
  );
  async function paint(value) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateDirectionStepVariant(component, {
      value,
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }
  // All nineteen types, written out rather than read from the plugin's own
  // table, so a change to that table alone fails here.
  const expectedIcons = [
    ["TurnBack", "turn-back"],
    ["Left", "hard-left"],
    ["Right", "hard-right"],
    ["LiftUp", "elevator-up"],
    ["LiftDown", "elevator-down"],
    ["EscalatorUp", "escalator-up"],
    ["EscalatorDown", "escalator-down"],
    ["StairsUp", "stairs-up"],
    ["StairsDown", "stairs-down"],
    ["Destination", "arriving"],
    ["Straight", "arrow-up"],
    ["LevelUp", "arrow-up"],
    ["LevelDown", "arrow-down"],
    ["Transition", "arrow-right"],
    ["Walking", "follow-the-line"],
    ["Enter", "route-enter"],
    ["Exit", "route-exit"],
    ["RampUp", "ramp-up"],
    ["RampDown", "ramp-down"],
  ];
  ok(
    JSON.stringify(expectedIcons.map(([type]) => type).sort()) ===
      JSON.stringify([...(plugin.DIRECTION_STEP_TYPES || [])].sort()),
    "the check covers every DirectionStep type the plugin draws",
  );
  for (const [type, iconName] of expectedIcons) {
    const { component, stats } = await paint(type);
    const badge = named(component, "Direction Icon");
    const icon = badge && badge.findOne((node) => node.type === "INSTANCE");
    const vector = icon && icon.findOne((node) => node.type === "VECTOR");
    ok(
      badge &&
        badge.width === 40 &&
        badge.fills.length === 0 &&
        isWash(badge, "Direction Wash", "Colors/theme/600", 0.1, 40, 40) &&
        named(badge, "Direction Wash").type === "ELLIPSE",
      `${type}: a 40 disc in the theme's 600 at 10 %, as a wash layer, as React's bg-primary/10 (decision 59)`,
    );
    // A Pointr outline takes the theme through its stroke, a solid
    // wayfinding glyph through its fill.
    const solid =
      /^(elevator|escalator|stairs|hard|route|ramp)-/.test(iconName) ||
      ["turn-back", "arriving", "follow-the-line"].includes(iconName);
    ok(
      icon &&
        icon.width === 24 &&
        icon.mainComponent.name === `Icon / ${iconName}` &&
        vector &&
        boundVariableName(solid ? vector.fills[0] : vector.strokes[0]) ===
          "Colors/theme/600",
      `${type}: a 24 ${iconName} icon in the theme's 600, as React's text-primary (decision 59)`,
    );
    ok(!named(component, "Direction Glyph"), `${type}: no typed glyph`);
    ok(
      stats.warnings.length === 0,
      `${type}: no warnings (${stats.warnings.join(" | ")})`,
    );
  }
}

// --- Itinerary ------------------------------------------------------------------

// The React Itinerary, as Storybook draws it standalone: From and To captions,
// the steps between them with DirectionStep's marks, the current one semibold
// in the theme's 600. A set the importer had never drawn until 2026-10-05.
section("Itinerary");
{
  ok(
    Array.isArray(plugin.ITINERARY_CONTENT) &&
      plugin.ITINERARY_CONTENT.join(",") ===
        "Default,NoCurrentStep,StepMetrics" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("Itinerary"),
      ) === JSON.stringify({ Content: plugin.ITINERARY_CONTENT }),
    "three variants, the stories: Default, NoCurrentStep, StepMetrics",
  );
  const variantTokens = payloadVariables([
    ...variableByName.keys(),
    "Colors/theme/600",
  ]);
  // A Build or Update loads the text styles first (loadButtonFonts): the
  // captions' upper case is the style's.
  await plugin.ensureKozmosTextStyles(FONTS, freshStats());
  async function paint(value) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateItineraryVariant(component, {
      value,
      variableByName: variantTokens.variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }
  const fill = (node) => node && node.fills && node.fills[0];
  for (const value of plugin.ITINERARY_CONTENT || []) {
    const { component, stats } = await paint(value);
    const rows = component.children;
    const steps = rows.filter((row) => /^Step \d+$/.test(row.name));
    ok(
      component.name === `Content=${value}` &&
        component.width === 340 &&
        component.fills.length === 0 &&
        component.itemSpacing === 8 &&
        rows[0].name === "Origin Row" &&
        rows[rows.length - 1].name === "Destination Row" &&
        steps.length === 4,
      `${value}: 340 wide, no surface, From, four steps and To, 8 apart`,
    );
    const originLabel = named(component, "Origin Label");
    const destination = named(component, "Destination Text");
    ok(
      originLabel &&
        originLabel.textCase === "UPPER" &&
        originLabel.width === 40 &&
        boundVariableName(fill(originLabel)) === "Colors/foreground/400" &&
        boundVariableName(fill(named(component, "Origin Text"))) ===
          "Colors/foreground/400" &&
        boundVariableName(fill(destination)) === "Colors/foreground/0",
      `${value}: the captions uppercase and muted in a 40 column, the origin muted, the destination in the text colour`,
    );
    const current = steps.filter((step) => {
      const text = named(step, "Instruction Text");
      return boundVariableName(fill(text)) === "Colors/theme/600";
    });
    const marks = steps.map((step) => {
      const icon = named(step, "Step Mark");
      const instance = icon && icon.findOne((node) => node.type === "INSTANCE");
      const shape =
        instance && instance.findOne((node) => node.type === "VECTOR");
      return shape
        ? boundVariableName(fill(shape)) ||
            boundVariableName(shape.strokes && shape.strokes[0])
        : null;
    });
    const expectedCurrent = value === "NoCurrentStep" ? 0 : 1;
    ok(
      current.length === expectedCurrent &&
        marks.filter((token) => token === "Colors/theme/600").length ===
          expectedCurrent &&
        marks.every((token) =>
          ["Colors/theme/600", "Colors/foreground/400"].includes(token),
        ),
      `${value}: ${expectedCurrent} current step in the theme's 600, with its mark; the other marks muted (${marks.join(", ")})`,
    );
    const metrics = component.findAll((node) => node.name === "Metrics Text");
    ok(
      value === "StepMetrics" ? metrics.length === 3 : metrics.length === 0,
      `${value}: ${value === "StepMetrics" ? "three steps carry" : "no step carries"} metrics`,
    );
    ok(
      stats.warnings.length === 0,
      `${value}: no warnings (${stats.warnings.join(" | ")})`,
    );
  }
}

// --- ManoeuvreCard ---------------------------------------------------------------

// The React ManoeuvreCard, as Storybook draws it in its 402 frame: closed, the
// manoeuvre; open, the itinerary's rows; the grab bar under both. Theme is the
// brand card, a prominent fill (decision 59): every word, mark and the grip in
// the theme foreground, white in both themes, on the theme fill, theme 500 in
// both; it was foreground/1000 on the theme's 600, black on blue in the dark.
// Background is the solid surface. A set the importer had never drawn until 2026-10-05.
section("ManoeuvreCard");
{
  ok(
    Array.isArray(plugin.MANOEUVRE_CARD_STATES) &&
      plugin.MANOEUVRE_CARD_STATES.join(",") === "Closed,Open" &&
      Array.isArray(plugin.MANOEUVRE_CARD_APPEARANCES) &&
      plugin.MANOEUVRE_CARD_APPEARANCES.join(",") === "Theme,Background" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("ManoeuvreCard"),
      ) ===
        JSON.stringify({
          State: plugin.MANOEUVRE_CARD_STATES,
          Appearance: plugin.MANOEUVRE_CARD_APPEARANCES,
        }),
    "four variants: State Closed and Open by Appearance Theme and Background",
  );
  const variantTokens = payloadVariables([
    ...variableByName.keys(),
    "Colors/theme/600",
    "Colors/foreground/1000",
    "Colors/background/300",
  ]);
  const fill = (node) => node && node.fills && node.fills[0];
  const token = (node) => boundVariableName(fill(node));
  const markToken = (box) => {
    const instance = box && box.findOne((node) => node.type === "INSTANCE");
    const shape =
      instance && instance.findOne((node) => node.type === "VECTOR");
    return shape
      ? boundVariableName(fill(shape)) ||
          boundVariableName(shape.strokes && shape.strokes[0])
      : null;
  };
  for (const value of plugin.MANOEUVRE_CARD_STATES || []) {
    for (const appearance of plugin.MANOEUVRE_CARD_APPEARANCES || []) {
      const label = `${value}, ${appearance}`;
      const theme = appearance === "Theme";
      const component = figma.createComponent();
      const stats = freshStats();
      await plugin.updateManoeuvreCardVariant(component, {
        value,
        second: appearance,
        variableByName: variantTokens.variableByName,
        fonts: FONTS,
        stats,
      });
      const shadow = component.effects && component.effects[0];
      ok(
        component.name === `State=${value}, Appearance=${appearance}` &&
          component.width === 378 &&
          component.paddingLeft === 16 &&
          component.paddingRight === 16 &&
          component.paddingTop === 16 &&
          component.paddingBottom === 4 &&
          component.itemSpacing === 12 &&
          component.cornerRadius === 20 &&
          component.effects.length === 1 &&
          shadow.type === "DROP_SHADOW" &&
          shadow.offset.y === 4 &&
          shadow.radius === 8,
        `${label}: 378 wide, padding 16 16 4 16, 12 apart, radius 20, the floating shadow`,
      );
      ok(
        theme
          ? token(component) ===
              "Primary Buttons/themed/button/background/idle" &&
              component.strokes.length === 0
          : token(component) === "Surface/0" &&
              boundVariableName(component.strokes[0]) === "Border/Subtle",
        `${label}: ${theme ? "the theme fill, no border" : "the solid surface and its subtle border"} (${token(component)})`,
      );
      const first = component.children[0];
      const bar = component.children[1];
      const grip = bar && named(bar, "Grip");
      ok(
        component.children.length === 2 &&
          bar.name === "Grab Bar" &&
          bar.height === 5 &&
          bar.counterAxisAlignItems === "MAX" &&
          grip &&
          grip.width === 36 &&
          grip.height === 5 &&
          grip.cornerRadius === 9999 &&
          grip.opacity === (theme ? 0.62 : 1) &&
          token(grip) ===
            (theme
              ? "Primary Buttons/themed/button/foreground/content/idle"
              : "Colors/background/300"),
        `${label}: the grab bar, the pill's own 5 high, holds a 36 by 5 pill in ${theme ? "the theme foreground at 62%" : "background/300"} (${grip && token(grip)}, ${bar && bar.counterAxisAlignItems}, opacity ${grip && grip.opacity})`,
      );
      if (value === "Closed") {
        const mark = named(first, "Manoeuvre Mark");
        const instruction = named(first, "Manoeuvre Instruction");
        const detail = named(first, "Manoeuvre Detail");
        ok(
          first.name === "Instruction Row" &&
            first.itemSpacing === 12 &&
            mark &&
            mark.width === 32 &&
            mark.height === 32 &&
            instruction &&
            detail &&
            named(first, "Manoeuvre Copy").itemSpacing === 2,
          `${label}: the instruction row, a 32 mark box 12 from the instruction and the detail 2 under it`,
        );
        const expected = theme
          ? {
              mark: "Primary Buttons/themed/button/foreground/content/idle",
              instruction:
                "Primary Buttons/themed/button/foreground/content/idle",
              detail: "Primary Buttons/themed/button/foreground/content/idle",
            }
          : {
              mark: "Colors/theme/600",
              instruction: "Colors/foreground/0",
              detail: "Colors/foreground/400",
            };
        const actual = {
          mark: markToken(mark),
          instruction: token(instruction),
          detail: token(detail),
        };
        ok(
          JSON.stringify(actual) === JSON.stringify(expected),
          `${label}: mark, instruction and detail ${JSON.stringify(actual)}`,
        );
      } else {
        const rows = first.children;
        const steps = rows.filter((row) => /^Step \d+$/.test(row.name));
        ok(
          first.name === "Itinerary" &&
            first.width === 346 &&
            first.itemSpacing === 8 &&
            first.paddingBottom === 23 &&
            rows[0].name === "Origin Row" &&
            rows[rows.length - 1].name === "Destination Row" &&
            steps.length === 4 &&
            !component.findOne((node) => node.name === "Manoeuvre Instruction"),
          `${label}: the itinerary in the instruction's place, 346 wide: From, four steps and To, 8 apart, 23 under them so the card ends 44 under its rows, clear of the grab bar's target (padding ${first.paddingBottom})`,
        );
        const texts = first.findAll((node) => node.type === "TEXT");
        const textTokens = [...new Set(texts.map(token))].sort();
        const marks = steps.map((step) => markToken(named(step, "Step Mark")));
        const current = steps.filter(
          (step) =>
            token(named(step, "Instruction Text")) ===
            (theme
              ? "Primary Buttons/themed/button/foreground/content/idle"
              : "Colors/theme/600"),
        );
        ok(
          theme
            ? textTokens.join(",") ===
                "Primary Buttons/themed/button/foreground/content/idle" &&
                marks.every(
                  (mark) =>
                    mark ===
                    "Primary Buttons/themed/button/foreground/content/idle",
                )
            : textTokens.join(",") ===
                "Colors/foreground/0,Colors/foreground/400,Colors/theme/600" &&
                current.length === 1 &&
                marks.filter((mark) => mark === "Colors/theme/600").length ===
                  1 &&
                marks.filter((mark) => mark === "Colors/foreground/400")
                  .length === 3,
          `${label}: ${theme ? "every word and mark in the theme foreground" : "Itinerary's own colours, one current step in the theme's 600"} (${textTokens.join(", ")}; marks ${marks.join(", ")})`,
        );
      }
      ok(
        stats.warnings.length === 0,
        `${label}: no warnings (${stats.warnings.join(" | ")})`,
      );
    }
  }
}

// --- Text styles stay attached ---------------------------------------------------

// Figma detaches a text style from a text when the painter writes one of the
// style's own fields with another value afterwards. Itinerary set its From and
// To captions to upper case after attaching Itinerary / Caption, and on
// 2026-10-05 the live file read back six captions with no style. Here the mock
// knows the styles the plugin creates, so it detaches as Figma does.
section("Text styles stay attached");
{
  const styleFigma = createFigmaMock({ pages: pages() });
  styleFigma.createTextStyle = createMockTextStyle;
  const stylePlugin = loadPlugin({ pluginPath: PLUGIN, figma: styleFigma });
  const tokens = payloadVariables([
    ...variableByName.keys(),
    "Colors/theme/600",
    "Colors/foreground/1000",
    "Colors/background/300",
  ]);
  const styles = await stylePlugin.ensureKozmosTextStyles(FONTS, freshStats());
  // A pin's side label, painted with the library's styles present, as in
  // Figma: code's 12/16 semibold, Medium by the three weights (Olcay, 16 Oct).
  // Field / Meta, which it took before, set it Regular.
  {
    const pin = styleFigma.createComponent();
    await stylePlugin.updateLocationPinVariant(pin, {
      props: { kind: "Result", state: "Default", content: "Number" },
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const sideLabel = pin.findOne((node) => node.name === "Label Text");
    ok(
      sideLabel &&
        sideLabel.textStyleId === styles.locationPinLabel?.id &&
        sideLabel.fontName.style === "Medium" &&
        sideLabel.fontSize === 12,
      `LocationPin's side label is LocationPin / Label, 12 Medium (got ${sideLabel && sideLabel.fontName && sideLabel.fontName.style} ${sideLabel && sideLabel.fontSize}, style ${sideLabel && sideLabel.textStyleId})`,
    );
  }
  const caption = styles.itineraryCaption;
  ok(
    caption &&
      caption.name === "Itinerary / Caption" &&
      caption.textCase === "UPPER",
    `Itinerary / Caption is upper case in the style itself (${caption && caption.textCase})`,
  );
  const painted = [];
  for (const value of stylePlugin.ITINERARY_CONTENT || []) {
    painted.push([`Itinerary ${value}`, "updateItineraryVariant", { value }]);
  }
  for (const value of stylePlugin.MANOEUVRE_CARD_STATES || []) {
    for (const second of stylePlugin.MANOEUVRE_CARD_APPEARANCES || []) {
      painted.push([
        `ManoeuvreCard ${value}, ${second}`,
        "updateManoeuvreCardVariant",
        { value, second },
      ]);
    }
  }
  for (const [label, painter, args] of painted) {
    const component = styleFigma.createComponent();
    await stylePlugin[painter](component, {
      ...args,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const texts = component.findAll((node) => node.type === "TEXT");
    const unstyled = texts.filter(
      (text) => !String(text.textStyleId).startsWith("S:mock-"),
    );
    ok(
      texts.length > 0 && unstyled.length === 0,
      `${label}: every text keeps its style (${texts.length} texts; without one: ${
        unstyled.map((text) => text.name).join(", ") || "none"
      })`,
    );
    const captions = texts.filter((text) =>
      /^(Origin|Destination) Label$/.test(text.name),
    );
    if (captions.length > 0) {
      ok(
        caption &&
          captions.every(
            (text) =>
              text.textCase === "UPPER" && text.textStyleId === caption.id,
          ),
        `${label}: From and To are upper case through Itinerary / Caption`,
      );
    }
  }
}

// --- UserLocationMarker ----------------------------------------------------------

// The marker as SwiftUI and Compose draw it, which React follows (Olcay,
// 2026-10-05): halo 64 at 14 %, pulse 48 at 30 %, native's cone with its
// radial fade, the 18 dot with a 3 white ring inside, no shadow, in the
// marker's fixed blue. The painter drew theme/100 and theme/500, a solid
// wedge and a 20 dot until then.
section("UserLocationMarker");
{
  // Map marker/dot and /ring come from the payload, so a payload without
  // them fails here rather than being stood in for.
  const tokens = payloadVariables([...variableByName.keys()]);
  const fill = (node) => node && node.fills && node.fills[0];
  const token = (node) => boundVariableName(fill(node));
  const near = (a, b, e = 0.01) => Math.abs(a - b) < e;
  const paintMarker = async (component, value, stats) =>
    plugin.updateUserLocationMarkerVariant(component, {
      value,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats,
    });
  ok(
    JSON.stringify(plugin.USER_LOCATION_MARKER_HEADINGS) ===
      JSON.stringify(["Hidden", "Visible"]),
    "two variants, Heading Hidden and Visible",
  );
  for (const value of plugin.USER_LOCATION_MARKER_HEADINGS || []) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateUserLocationMarkerVariant(component, {
      value,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats,
    });
    const halo = named(component, "Accuracy Halo");
    const pulse = named(component, "Pulse");
    const dot = named(component, "Location Dot");
    ok(
      component.width === 64 &&
        component.height === 64 &&
        halo &&
        halo.type === "ELLIPSE" &&
        halo.width === 64 &&
        token(halo) === "Map marker/dot" &&
        near(halo.opacity, 0.14) &&
        pulse &&
        pulse.width === 48 &&
        pulse.x === 8 &&
        pulse.y === 8 &&
        token(pulse) === "Map marker/dot" &&
        near(pulse.opacity, 0.3),
      `${value}: the 64 halo at 14 % and the 48 pulse at 30 %, in the marker's blue (${token(halo)} ${halo && halo.opacity}; ${token(pulse)} ${pulse && pulse.opacity})`,
    );
    ok(
      dot &&
        dot.width === 18 &&
        dot.x === 23 &&
        dot.y === 23 &&
        token(dot) === "Map marker/dot" &&
        boundVariableName(dot.strokes[0]) === "Map marker/ring" &&
        dot.strokeWeight === 3 &&
        dot.strokeAlign === "INSIDE" &&
        (dot.effects || []).length === 0,
      `${value}: the 18 dot in the marker's blue, its 3 white ring inside, no shadow`,
    );
    const cone = named(component, "Heading Cone");
    if (value === "Hidden") {
      ok(!cone, "Hidden: no cone");
    } else {
      const wedge = cone && named(cone, "Cone");
      const paint = fill(wedge);
      // Where the gradient's unit space puts a point of the 64 frame.
      const toGradient = (fx, fy) => {
        const t = paint.gradientTransform;
        const nx = (fx - wedge.x) / wedge.width;
        const ny = (fy - wedge.y) / wedge.height;
        return [
          t[0][0] * nx + t[0][1] * ny + t[0][2],
          t[1][0] * nx + t[1][1] * ny + t[1][2],
        ];
      };
      const centre = paint && toGradient(32, 32);
      const right = paint && toGradient(64, 32);
      const up = paint && toGradient(32, 0);
      ok(
        cone &&
          cone.width === 64 &&
          near(cone.opacity, 0.4) &&
          cone.clipsContent === false &&
          wedge &&
          wedge.path === "M32 32 L9.6 0 Q32 -6.4 54.4 0 Z" &&
          near(wedge.x, 9.6) &&
          near(wedge.y, -3.2) &&
          paint.type === "GRADIENT_RADIAL" &&
          boundVariableName(paint.gradientStops[0]) === "Map marker/dot" &&
          paint.gradientStops[1].color.a === 0 &&
          !paint.gradientStops[1].boundVariables,
        `Visible: native's cone at 40 %, unclipped, its fade from the marker's blue to transparent (${wedge && [wedge.x, wedge.y, wedge.width, wedge.height]})`,
      );
      ok(
        paint &&
          near(centre[0], 0.5) &&
          near(centre[1], 0.5) &&
          near(right[0], 1) &&
          near(right[1], 0.5) &&
          near(up[0], 0.5) &&
          near(up[1], 0),
        `Visible: the fade is centred on the marker's centre with radius 32 (centre ${centre}, 32 right ${right}, 32 up ${up})`,
      );
    }
    ok(
      stats.warnings.length === 0,
      `${value}: no warnings (${stats.warnings.join(" | ")})`,
    );
  }

  // Figma documents no default for whether a new frame clips or where a new
  // shape's stroke sits, so the painter must set both: run it with frames
  // clipping and strokes centred.
  await withNodeDefaults(
    { FRAME: { clipsContent: true }, ELLIPSE: { strokeAlign: "CENTER" } },
    async () => {
      const component = figma.createComponent();
      await paintMarker(component, "Visible", freshStats());
      const cone = named(component, "Heading Cone");
      const dot = named(component, "Location Dot");
      ok(
        cone &&
          cone.clipsContent === false &&
          dot &&
          dot.strokeAlign === "INSIDE",
        "whatever Figma's defaults, the cone does not clip and the ring sits inside",
      );
    },
  );

  // An Update redraws the shapes but keeps the variant: a shadow it carried
  // must go too.
  {
    const component = figma.createComponent();
    component.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.2 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
    await paintMarker(component, "Hidden", freshStats());
    ok(
      component.effects.length === 0,
      "an Update clears a shadow the variant carried",
    );
  }

  // If Figma keeps the cone's gradient but drops its stop's binding, the
  // painter says so rather than leaving a plain blue unremarked.
  {
    const original = figma.createNodeFromSvg;
    figma.createNodeFromSvg = (svg) => {
      const frame = original(svg);
      for (const child of frame.children) dropGradientStopBindings(child);
      return frame;
    };
    try {
      const stats = freshStats();
      await paintMarker(figma.createComponent(), "Visible", stats);
      ok(
        stats.warnings.some((warning) =>
          warning.includes("not its stop's binding"),
        ),
        `a dropped stop binding is reported (${stats.warnings.join(" | ")})`,
      );
    } finally {
      figma.createNodeFromSvg = original;
    }
  }
}

// --- RouteProgressRail -----------------------------------------------------------

// The React RouteProgressRail's stories in a 360 frame, measured in Storybook
// on 2026-10-05: the step disc, and the route mode's active leg with its
// transitions and the position. A set the importer had never drawn.
section("RouteProgressRail");
{
  ok(
    Array.isArray(plugin.ROUTE_PROGRESS_RAIL_CONTENT) &&
      plugin.ROUTE_PROGRESS_RAIL_CONTENT.length === 13 &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("RouteProgressRail"),
      ) === JSON.stringify({ Content: plugin.ROUTE_PROGRESS_RAIL_CONTENT }),
    "thirteen variants: the step disc's five stories and the route mode's eight",
  );
  // Every token the rail binds comes from the payload, so a token the
  // payload lost fails here rather than being stood in for.
  const tokens = payloadVariables([...variableByName.keys()]);
  const near = (a, b) => Math.abs(a - b) < 0.05;
  const fill = (node) => node && node.fills && node.fills[0];
  const token = (node) => boundVariableName(fill(node));
  const markOf = (disc) => {
    const icon = disc && disc.findOne((node) => node.type === "INSTANCE");
    const vector = icon && icon.findOne((node) => node.type === "VECTOR");
    return {
      icon: icon && icon.mainComponent && icon.mainComponent.name,
      tint: vector
        ? boundVariableName(fill(vector)) ||
          boundVariableName(vector.strokes && vector.strokes[0])
        : null,
      size: icon ? `${icon.width}x${icon.height}` : null,
    };
  };
  const box = (node) => node && [node.x, node.y, node.width, node.height];
  const at = (node, x, y, w, h) =>
    node &&
    near(node.x, x) &&
    near(node.y, y) &&
    near(node.width, w) &&
    near(node.height, h);
  // Story -> what React draws, from the measurements.
  const step = {
    Start: { disc: 10, mark: "Icon / arrow-up" },
    Midway: { disc: 163, mark: "Icon / hard-left" },
    Arriving: { disc: 267.04, mark: "Icon / arriving" },
    Unknown: { disc: null },
    Waypoints: { disc: 71.2, mark: "Icon / hard-left", completed: 78.2 },
  };
  const route = {
    ActiveLeg: {
      fill: [12, 134.4],
      gradient: true,
      flow: [12, 134.4, "white"],
      dot: null,
    },
    WalkingWithinLeg: {
      fill: [12, 67.2],
      gradient: true,
      flow: [79.2, 67.2, "Colors/background/600"],
      dot: 70.2,
    },
    // Measured 2026-10-06: the position on the transition, the leg filled to
    // it, no flow left in the leg, and the dot over the transition's stem.
    AtTransition: {
      fill: [12, 134.4],
      gradient: true,
      flow: null,
      dot: 137.4,
    },
    AfterTransition: {
      fill: [12, 201.6],
      gradient: true,
      flow: [213.6, 134.4, "Colors/background/600"],
      dot: 204.6,
    },
    RoutePositionUnknown: { fill: null, flow: null, dot: null },
    ThemeRoute: {
      fill: [12, 67.2],
      gradient: false,
      flow: [79.2, 67.2, "Colors/background/600"],
      dot: 70.2,
    },
    GuidancePaused: { fill: [12, 67.2], gradient: true, flow: null, dot: 70.2 },
    // Measured 2026-10-06: the live start, nothing filled, the flow across
    // the leg, and the dot over the start's endpoint and stem.
    LiveStart: {
      fill: null,
      flow: [12, 134.4, "Colors/background/600"],
      dot: 3,
    },
  };
  for (const value of plugin.ROUTE_PROGRESS_RAIL_CONTENT || []) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateRouteProgressRailVariant(component, {
      value,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats,
    });
    const isStep = value in step;
    ok(
      component.name === `Content=${value}` &&
        component.width === 360 &&
        component.height === (isStep ? 34 : 48) &&
        component.fills.length === 0,
      `${value}: 360 by ${isStep ? 34 : 48}, no surface`,
    );
    const track = named(component, "Track");
    if (isStep) {
      const want = step[value];
      const disc = named(component, "Progress Disc");
      const known = want.disc !== null;
      ok(
        at(track, 10, 14, 340, 6) &&
          token(track) === "Colors/background/100" &&
          at(named(component, "Start Dot"), 0, 12, 10, 10) &&
          token(named(component, "Start Dot")) ===
            (known ? "Colors/theme/600" : "Colors/background/100") &&
          at(named(component, "End Dot"), 350, 12, 10, 10) &&
          token(named(component, "End Dot")) === "Colors/background/100",
        `${value}: the 6 track from 10 in background/100, the start dot ${known ? "theme/600" : "muted"}, the end dot muted (${box(track)})`,
      );
      const mark = markOf(disc);
      ok(
        known
          ? at(disc, want.disc, 0, 34, 34) &&
              token(disc) === "Colors/theme/600" &&
              mark.icon === want.mark &&
              mark.tint === "Colors/foreground/1000" &&
              mark.size === "16x16"
          : !disc,
        `${value}: ${known ? `the 34 disc at ${want.disc}, ${want.mark} 16 in foreground/1000` : "no disc"} (${box(disc)}; ${JSON.stringify(mark)})`,
      );
      if (value === "Waypoints") {
        const completed = named(component, "Completed Track");
        const points = [1, 2, 3].map((i) => named(component, `Waypoint ${i}`));
        const marks = points.map(markOf);
        ok(
          at(completed, 10, 14, want.completed, 6) &&
            token(completed) === "Colors/theme/600" &&
            [15, 168, 321].every((x, i) => at(points[i], x, 5, 24, 24)) &&
            !named(component, "Waypoint 4") &&
            points.every(
              (p) =>
                token(p) === "Colors/background/100" &&
                boundVariableName(p.strokes[0]) === "Border/Subtle" &&
                p.strokeWeight === 1 &&
                p.strokeAlign === "INSIDE",
            ) &&
            marks.map((m) => m.icon).join() ===
              "Icon / arrow-up,Icon / hard-left,Icon / arriving" &&
            marks.every((m) => m.tint === "Colors/foreground/0"),
          `Waypoints: the completed track to 88.2, three 24 waypoints and no more at 15, 168 and 321, muted with the subtle edge inside, marks in foreground/0 (${points.map(box).join(" | ")})`,
        );
      }
    } else {
      const want = route[value];
      ok(
        at(track, 12, 35, 336, 6) &&
          token(track) === "Colors/background/300" &&
          at(named(component, "Start Endpoint"), 7, 33, 10, 10) &&
          token(named(component, "Start Endpoint")) ===
            "Colors/background/500" &&
          at(named(component, "End Endpoint"), 343, 33, 10, 10) &&
          token(named(component, "End Endpoint")) === "Colors/background/500",
        `${value}: the 6 track at 35 from 12 in background/300, the 10 endpoints at 7 and 343 in background/500`,
      );
      const active = named(component, "Active Leg");
      const paint = fill(active);
      const stops =
        paint && paint.gradientStops
          ? paint.gradientStops
              .map((stop) => boundVariableName(stop))
              .join(" -> ")
          : null;
      ok(
        want.fill
          ? at(active, want.fill[0], 35, want.fill[1], 6) &&
              (want.gradient
                ? paint.type === "GRADIENT_LINEAR" &&
                  JSON.stringify(paint.gradientTransform) ===
                    "[[1,0,0],[0,1,0]]" &&
                  stops === "Colors/theme/600 -> Colors/emotional/success/600"
                : token(active) === "Colors/theme/600")
          : !active,
        `${value}: ${want.fill ? `the active leg ${want.fill[1]} wide from ${want.fill[0]}, ${want.gradient ? "theme to success, left to right" : "theme/600"}` : "no active leg"} (${box(active)}; ${stops || token(active)})`,
      );
      const flow = named(component, "Directional Flow");
      const dots = flow ? flow.children : [];
      // A dot at the middle of every 20 whose left edge is inside the flow.
      const expectedDots = want.flow
        ? [...Array(20).keys()].filter((k) => 10 + 20 * k - 4 < want.flow[1])
            .length
        : 0;
      ok(
        want.flow
          ? at(flow, want.flow[0], 35, want.flow[1], 6) &&
              flow.clipsContent === true &&
              flow.cornerRadius === 9999 &&
              dots.length === expectedDots &&
              dots.every(
                (dot, k) =>
                  near(dot.x, 6 + 20 * k) &&
                  near(dot.y, 1.5) &&
                  dot.width === 8 &&
                  dot.height === 3 &&
                  (want.flow[2] === "white"
                    ? fill(dot).color.r === 1 && near(fill(dot).opacity, 0.65)
                    : token(dot) === want.flow[2]),
              )
          : !flow,
        `${value}: ${want.flow ? `the still flow from ${want.flow[0]}, ${dots.length} dots 8 by 3 every 20 in ${want.flow[2]}` : "no flow"} (${box(flow)})`,
      );
      const points = [1, 2, 3].map((i) => named(component, `Waypoint ${i}`));
      const stems = [1, 2, 3].map((i) =>
        named(component, `Waypoint ${i} Stem`),
      );
      const marks = points.map(markOf);
      ok(
        [0, 134.4, 336].every((x, i) => at(points[i], x, 0, 24, 24)) &&
          !named(component, "Waypoint 4") &&
          points.every(
            (p) =>
              token(p) === "Colors/background/0" &&
              boundVariableName(p.strokes[0]) === "Colors/background/400" &&
              p.strokeWeight === 1 &&
              p.strokeAlign === "INSIDE",
          ) &&
          [11.5, 145.9, 347.5].every((x, i) => at(stems[i], x, 24, 1, 11)) &&
          stems.every((stem) => token(stem) === "Colors/background/500") &&
          marks.map((m) => m.icon).join() ===
            "Icon / follow-the-line,Icon / elevator-up,Icon / arriving" &&
          marks.every((m) => m.tint === "Colors/foreground/100"),
        `${value}: the three transitions and no more at 0, 134.4 and 336 in background/0 with a 1 background/400 edge, 11 stems to the track, marks in foreground/100 (${points.map(box).join(" | ")})`,
      );
      const dot = named(component, "Location Dot");
      const shadow = dot && dot.effects && dot.effects[0];
      ok(
        want.dot === null
          ? !dot
          : at(dot, want.dot, 29, 18, 18) &&
              token(dot) === "Map marker/dot" &&
              boundVariableName(dot.strokes[0]) === "Colors/background/0" &&
              dot.strokeWeight === 3 &&
              dot.strokeAlign === "INSIDE" &&
              !shadow &&
              component.children[component.children.length - 1] === dot,
        `${value}: ${want.dot === null ? "no position dot" : `the 18 dot at ${want.dot} in the map marker's blue with a 3 background/0 ring and no shadow, drawn on top`} (${box(dot)})`,
      );
    }
    ok(
      stats.warnings.length === 0,
      `${value}: no warnings (${stats.warnings.join(" | ")})`,
    );
  }

  // If Figma keeps the active leg's gradient but drops its stops' bindings,
  // the painter says so rather than leaving plain colours unremarked.
  {
    const original = figma.createRectangle;
    figma.createRectangle = () => dropGradientStopBindings(original());
    try {
      const stats = freshStats();
      await plugin.updateRouteProgressRailVariant(figma.createComponent(), {
        value: "ActiveLeg",
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats,
      });
      ok(
        stats.warnings.some((warning) =>
          warning.includes("not its stops' bindings"),
        ),
        `ActiveLeg: dropped stop bindings are reported (${stats.warnings.join(" | ")})`,
      );
    } finally {
      figma.createRectangle = original;
    }
  }
}

// --- AISearchButton --------------------------------------------------------------

section("AISearchButton");
{
  ok(
    Array.isArray(plugin.AI_SEARCH_BUTTON_STATES) &&
      plugin.AI_SEARCH_BUTTON_STATES.join(",") === "Default,Disabled",
    "Default and Disabled",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("AISearchButton"),
      ) === JSON.stringify({ State: plugin.AI_SEARCH_BUTTON_STATES }),
    "the set expects State",
  );
  ok(
    plugin.PRODUCT_SDK_UPDATE_SEQUENCE.some(
      ([name]) => name === "AISearchButton",
    ),
    "AISearchButton is in the Product / SDK update sequence",
  );
  async function paint(value) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateAISearchButtonVariant(component, {
      value,
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }
  const painted =
    typeof plugin.updateAISearchButtonVariant === "function"
      ? await paint("Default")
      : { component: figma.createComponent(), stats: freshStats() };
  const { component, stats } = painted;
  ok(
    typeof plugin.updateAISearchButtonVariant === "function",
    "AISearchButton has a painter",
  );
  ok(
    component.width === 48 &&
      component.height === 48 &&
      component.cornerRadius === plugin.KOZMOS_RADIUS.pill,
    "a 48 circle",
  );
  const ring = named(component, "Ring");
  ok(ring && ring.type === "ELLIPSE" && ring.width === 48, "a 48 ring");
  const gradient = ring && ring.fills[0];
  const stops = (gradient && gradient.gradientStops) || [];
  const stopNames = stops.map((stop) =>
    boundVariableName({ boundVariables: stop.boundVariables }),
  );
  ok(
    gradient && gradient.type === "GRADIENT_ANGULAR" && stops.length === 7,
    "the ring is a conic gradient of seven stops",
  );
  ok(
    stopNames.join(",") ===
      "Data/Red,Data/Yellow,Colors/emotional/success/500,Data/Teal,Data/Blue,Data/Purple,Data/Red",
    `the stops are the six data colours, red back to red (got ${stopNames.join(",")})`,
  );
  const disc = named(component, "Disc");
  ok(
    disc &&
      disc.width === 43 &&
      disc.x === 2.5 &&
      disc.y === 2.5 &&
      boundVariableName(disc.fills[0]) === "Colors/background/0",
    "a 43 disc inset 2.5, in the background colour",
  );
  const icon = named(component, "Icon");
  const vector = icon && icon.findOne((node) => node.type === "VECTOR");
  ok(
    icon &&
      icon.width === 16 &&
      icon.mainComponent.name === "Icon / stars-01" &&
      vector &&
      boundVariableName(vector.strokes[0]) === "Colors/theme/600",
    `a 16 sparkles icon in the theme's 600, as React's text-primary (decision 59) (${vector && boundVariableName(vector.strokes[0])})`,
  );
  ok(
    stats.warnings.length === 0,
    `no warnings (${stats.warnings.join(" | ")})`,
  );
  if (typeof plugin.updateAISearchButtonVariant === "function") {
    const { component: disabled } = await paint("Disabled");
    ok(disabled.opacity === 0.5, "disabled: at 50 %");
  }
  // If Figma keeps the ring's gradient but drops its stops' bindings, the
  // painter says so rather than leaving plain colours unremarked.
  if (typeof plugin.updateAISearchButtonVariant === "function") {
    const original = figma.createEllipse;
    figma.createEllipse = () => dropGradientStopBindings(original());
    try {
      const { stats: dropped } = await paint("Default");
      ok(
        dropped.warnings.some((warning) =>
          warning.includes("not its stops' bindings"),
        ),
        `a dropped stop binding is reported (${dropped.warnings.join(" | ")})`,
      );
    } finally {
      figma.createEllipse = original;
    }
  }
}

// --- Typed glyphs become icons -----------------------------------------------------

section("Glyphs");
{
  const stats = freshStats();
  const header = await plugin.productSdkPanelHeader({
    title: "Kozmos Cafe",
    titleNodeName: "Title Text",
    closeGlyph: "×",
    width: 348,
    fonts: FONTS,
    variableByName,
    stats,
  });
  const close = named(header, "Close Slot");
  const icon = close && named(close, "Close Slot Icon");
  ok(
    icon &&
      icon.type === "INSTANCE" &&
      icon.mainComponent.name === "Icon / x-close",
    "the panel header's close is an x-close icon",
  );
  ok(!named(header, "Close Slot Glyph"), "no typed × remains");
  const component = figma.createComponent();
  await plugin.updatePOIDetailPanelVariant(component, {
    value: "Panel",
    variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  for (const [action, iconName] of [
    ["Navigate", "navigation-pointer-01"],
    ["Save", "bookmark"],
    ["Share", "share-01"],
  ]) {
    const button = named(component, `${action} Action`);
    const mark = button && named(button, `${action} Action Icon`);
    ok(
      mark &&
        mark.mainComponent.name === `Icon / ${iconName}` &&
        !named(button, `${action} Action Glyph`),
      `the POI panel's ${action} is a ${iconName} icon`,
    );
  }
}

// --- Icon fallbacks -----------------------------------------------------------------

section("Icon fallbacks");
{
  const token = { name: "Colors/foreground/0", fallback: "#000000" };
  const stats = freshStats();
  const helper = typeof plugin.productSdkIconInstance === "function";
  ok(helper, "the plugin has the curated-icon helper");
  const symbol = !helper
    ? undefined
    : await plugin.productSdkIconInstance({
        iconName: "no-such-icon",
        token,
        size: 16,
        sizeToken: null,
        variableByName,
        stats,
        owner: "Test",
      });
  ok(
    symbol === null,
    "a symbol the file lacks draws nothing, never the default",
  );
  ok(
    helper &&
      stats.warnings.length === 1 &&
      /Curated Icons/.test(stats.warnings[0]),
    "and says to run Curated Icons",
  );
  const slot = !helper
    ? null
    : await plugin.productSdkIconInstance({
        iconName: "no-such-icon",
        token,
        size: 24,
        sizeToken: null,
        variableByName,
        stats: freshStats(),
        owner: "Test",
        fallbackToDefault: true,
      });
  ok(
    slot &&
      slot.mainComponent.name === `Icon / ${plugin.DEFAULT_CURATED_ICON_NAME}`,
    "a slot whose symbol is product data takes the library's default",
  );
}

// --- FloorSelector and MapControlsGroup ----------------------------------------------

section("FloorSelector");
{
  const component = figma.createComponent();
  const stats = freshStats();
  await plugin.updateFloorSelectorVariant(component, {
    value: "CompactStepper",
    variableByName,
    fonts: FONTS,
    stats,
  });
  for (const [name, iconName] of [
    ["Stepper Up", "chevron-up"],
    ["Stepper Down", "chevron-down"],
  ]) {
    const stepper = named(component, name);
    const icon = stepper && named(stepper, `${name} Icon`);
    ok(
      icon &&
        icon.mainComponent.name === `Icon / ${iconName}` &&
        !named(stepper, `${name} Glyph`),
      `${name} is a ${iconName} icon`,
    );
  }
}

section("MapControlsGroup");
{
  const component = figma.createComponent();
  const stats = freshStats();
  await plugin.updateMapControlsGroupVariant(component, {
    value: "IconOnly",
    variableByName,
    fonts: FONTS,
    stats,
  });
  for (const [name, iconName] of [
    ["Zoom In Button", "plus"],
    ["Zoom Out Button", "minus"],
    ["Compass Button", "compass-01"],
  ]) {
    const button = named(component, name);
    const icon = button && named(button, `${name} Icon`);
    ok(
      icon &&
        icon.mainComponent.name === `Icon / ${iconName}` &&
        !named(button, `${name} Glyph`),
      `${name} is a ${iconName} icon`,
    );
  }
}

section("AdaptiveMapShell's map slots (GAP-123, SDK-UI-002)");
{
  // Where React's shell puts what it places over the map: the top corners
  // under the top bar, the controls column below the top end, and the bottom
  // row with its corners and, between them, the status with the credits
  // above it. Rows in flow, so they follow the surface's width.
  for (const value of ["Start", "End"]) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateAdaptiveMapShellVariant(component, {
      value,
      variableByName,
      fonts: FONTS,
      stats,
    });
    const surface = named(component, "Map Surface");
    const names = (node) => (node ? node.children.map((c) => c.name) : []);
    ok(
      surface &&
        surface.layoutMode === "VERTICAL" &&
        names(surface).join() ===
          "Top Corners,Controls Column,Map Space,Bottom Row",
      `${value}: the map surface stacks the top corners, the controls, the map and the bottom row`,
    );
    const top = surface && named(surface, "Top Corners");
    ok(
      top &&
        top.primaryAxisAlignItems === "SPACE_BETWEEN" &&
        top.layoutSizingHorizontal === "FILL" &&
        names(top).join() === "Top Start Slot,Top End Slot",
      `${value}: the top corners share a row, the start first and the end at the end`,
    );
    const column = surface && named(surface, "Controls Column");
    ok(
      column &&
        column.primaryAxisAlignItems === "MAX" &&
        names(column).join() === "Controls Slot",
      `${value}: the controls column sits at the end, below the top corners`,
    );
    const space = surface && named(surface, "Map Space");
    ok(
      space &&
        space.layoutSizingVertical === "FILL" &&
        space.fills.length === 0 &&
        space.strokes.length === 0,
      `${value}: the map between the rows is undrawn and takes what they leave`,
    );
    const bottom = surface && named(surface, "Bottom Row");
    ok(
      bottom &&
        bottom.primaryAxisAlignItems === "SPACE_BETWEEN" &&
        bottom.counterAxisAlignItems === "MAX" &&
        names(bottom).join() ===
          "Bottom Start Slot,Status And Credits,Bottom End Slot",
      `${value}: the bottom row puts the status between the corners, level with their bottom edge`,
    );
    const middle = bottom && named(bottom, "Status And Credits");
    ok(
      middle && names(middle).join() === "Attribution Slot,Status Slot",
      `${value}: the credits sit directly above the status`,
    );
    for (const name of [
      "Top Start Slot",
      "Top End Slot",
      "Bottom Start Slot",
      "Bottom End Slot",
      "Status Slot",
      "Attribution Slot",
    ]) {
      const slot = surface && named(surface, name);
      ok(
        slot &&
          slot.cornerRadius ===
            plugin.nestedRadius(
              plugin.KOZMOS_RADIUS.control,
              plugin.PRODUCT_SDK_CARD_INSET,
            ),
        `${value}: ${name} takes the radius the map surface's inset leaves it`,
      );
    }
  }
}

// --- An icon that lost its tint is repaired on Update -----------------------------

section("Icon tint repair");
{
  const token = "Primary Buttons/themed/button/foreground/content/idle";
  const config = { foreground: token, foregroundFallback: "#FFFFFF" };
  const source = figma.root.findOne(
    (node) => node.type === "COMPONENT" && node.name === "Icon / search-md",
  );
  const ready =
    source &&
    typeof plugin.createIconSlotInstance === "function" &&
    typeof plugin.syncIconSlotInstance === "function";
  ok(ready, "the icon slot helpers and a source icon");
  if (ready) {
    const icon = plugin.createIconSlotInstance(
      source,
      token,
      "#FFFFFF",
      variableByName,
      freshStats(),
      16,
      null,
    );
    const vector = icon.findOne((node) => node.type === "VECTOR");
    ok(
      vector && boundVariableName(vector.strokes[0]) === token,
      "a fresh icon is bound to its token",
    );
    // What the file held on 2026-09-21: the right label, a plain black paint.
    vector.strokes = [
      { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    const stats = freshStats();
    plugin.syncIconSlotInstance(icon, config, variableByName, stats, 16, null);
    ok(
      boundVariableName(vector.strokes[0]) === token,
      "Update re-binds a black icon whose label was already right",
    );
    ok(stats.iconSlotPaintRepairs === 1, "and counts the repair");
    const again = freshStats();
    plugin.syncIconSlotInstance(icon, config, variableByName, again, 16, null);
    ok(
      !again.iconSlotPaintRepairs && again.iconSlotRetintsSkipped === 1,
      "a second Update finds the paint right and skips",
    );

    // The dark-mode failures in the 2026-09-21 audit: Secondary, Glass,
    // Outline and Ghost take Colors/foreground/0, whose light value is the
    // Icons page glyph's own black. An unbound black glyph matched the
    // fallback, passed as right, and stayed black on the dark surfaces (1.0
    // on Outline and Ghost, 1.61 on Secondary, 1.2 on Glass). A variable in
    // the file must be bound; the fallback serves only when it is missing.
    const neutralToken = "Colors/foreground/0";
    const neutral = { foreground: neutralToken, foregroundFallback: "#000000" };
    const neutralIcon = plugin.createIconSlotInstance(
      source,
      neutralToken,
      "#000000",
      variableByName,
      freshStats(),
      16,
      null,
    );
    const neutralVector = neutralIcon.findOne((node) => node.type === "VECTOR");
    neutralVector.strokes = [
      { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    const neutralStats = freshStats();
    plugin.syncIconSlotInstance(
      neutralIcon,
      neutral,
      variableByName,
      neutralStats,
      16,
      null,
    );
    ok(
      boundVariableName(neutralVector.strokes[0]) === neutralToken,
      "an unbound black icon is bound to Colors/foreground/0, though its colour matches the fallback",
    );
    ok(neutralStats.iconSlotPaintRepairs === 1, "and the repair is counted");

    const missingToken = "Colors/not-in-this-file/500";
    const missing = { foreground: missingToken, foregroundFallback: "#000000" };
    const loneIcon = plugin.createIconSlotInstance(
      source,
      missingToken,
      "#000000",
      variableByName,
      freshStats(),
      16,
      null,
    );
    const loneVector = loneIcon.findOne((node) => node.type === "VECTOR");
    loneVector.strokes = [
      { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    const loneStats = freshStats();
    plugin.syncIconSlotInstance(
      loneIcon,
      missing,
      variableByName,
      loneStats,
      16,
      null,
    );
    ok(
      !loneStats.iconSlotPaintRepairs && loneStats.iconSlotRetintsSkipped === 1,
      "with its variable missing from the file, the fallback colour is right",
    );
  }
}

// --- Translucent token paints ---------------------------------------------------

section("Translucent token paints");
{
  const frame = figma.createFrame();
  frame.layoutMode = "VERTICAL";
  frame.resize(320, 240);
  const ready = typeof plugin.appendScrollAreaScrollbar === "function";
  ok(ready, "ScrollArea's scrollbar helper");
  if (ready) {
    plugin.appendScrollAreaScrollbar({
      component: frame,
      name: "Vertical Scrollbar",
      vertical: true,
      metrics: { width: 320, height: 240 },
      variableByName,
      stats: freshStats(),
    });
    const track = named(frame, "Vertical Scrollbar");
    ok(
      track &&
        boundVariableName(track.fills[0]) === "Colors/foreground/500" &&
        (track.fills[0].opacity ?? 1) === 1 &&
        Math.abs(track.opacity - 0.32) < 1e-9,
      "ScrollArea's track is foreground/500 at 32 % by layer opacity",
    );
  }
  const source = fs.readFileSync(PLUGIN, "utf8");
  ok(
    !/paintFromVariableWithOpacity/.test(source),
    "no helper gives a bound paint an opacity",
  );
  ok(
    /setTranslucentTokenPaint\(\s*handle,\s*"fills",\s*\{ name: "Colors\/foreground\/500", fallback: "#747B8B" \},\s*0\.36,/.test(
      source,
    ),
    "BottomSheet's handle is foreground/500 at 36 % by layer opacity",
  );
}

section("A translucent token rides on the paint");
{
  // What the file draws, rendered over REST on 2026-09-21: a bound paint's
  // opacity shows and the variable's own alpha does not. Build ed50a03a1912
  // bound every paint at 1, and Button's Glass came out opaque: a near-white
  // pill under a near-white label in Dark, 1.03 to 1.
  const alphaOf = (hex) => Number.parseInt(hex.slice(7, 9), 16) / 255;
  const near = (a, b) => typeof a === "number" && Math.abs(a - b) < 0.002;
  const ready =
    typeof plugin.createButtonVariant === "function" &&
    typeof plugin.createBackdropVariant === "function" &&
    typeof plugin.solidPaintToRgba === "function";
  ok(ready, "Button's and Backdrop's painters and the audit's paint reader");
  if (ready) {
    const glass = await plugin.createButtonVariant({
      variant: "Glass",
      size: "Default",
      state: "Default",
      variableByName,
      fonts: FONTS,
      textStyle: null,
      stats: freshStats(),
    });
    const fill = glass.fills[0];
    const stroke = glass.strokes[0];
    ok(
      boundVariableName(fill) === "Colors/transparent/inverted/10" &&
        near(fill.opacity, alphaOf("#FCFCFD1A")),
      `Glass's fill is transparent/inverted/10 at its 10 % (${fill && fill.opacity})`,
    );
    ok(
      boundVariableName(stroke) === "Border/bevel/top" &&
        near(stroke.opacity, alphaOf("#FFFFFF80")),
      `Glass's bevel is Border/bevel/top at its 50 % (${stroke && stroke.opacity})`,
    );
    // The audit, as in Dark: the label (foreground/0, #FFFFFF) on the Glass
    // fill over Surface/0 (#000000). Its paint reader takes the paint's
    // opacity, as the file draws.
    const context = plugin.createVariableContext([], []);
    const read = plugin.solidPaintToRgba(fill, context, "Dark");
    const onBlack = {
      r: read.r * read.a,
      g: read.g * read.a,
      b: read.b * read.a,
    };
    const lin = (v) =>
      v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    const lum = (c) =>
      0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const darkRatio = (1 + 0.05) / (lum(onBlack) + 0.05);
    ok(
      darkRatio >= 4.5,
      `the audit reads Glass's label in Dark at 4.5 or more (${darkRatio.toFixed(2)})`,
    );
    // And the audit's traversal measures a Glass variant, in both modes,
    // rather than passing over it: that reading caught ed50a03a1912's Glass.
    if (typeof plugin.auditComponentContrast === "function") {
      const tokens = payloadVariables([...variableByName.keys()]);
      const painted = await plugin.createButtonVariant({
        variant: "Glass",
        size: "Default",
        state: "Default",
        variableByName: tokens.variableByName,
        fonts: FONTS,
        textStyle: null,
        stats: freshStats(),
      });
      painted.name = "Variant=Glass, Size=Default, State=Default";
      const glassSet = new MockNode("COMPONENT_SET", "Button");
      glassSet.appendChild(painted);
      const measured = plugin.auditComponentContrast(
        glassSet,
        glassSet.children,
        plugin.createVariableContext(tokens.collections, tokens.variables),
      );
      ok(
        measured.byMode.length === 2 &&
          measured.byMode.every(
            (mode) => mode.textPairs >= 1 && mode.minTextContrast >= 4.5,
          ),
        `the audit measures a Glass variant's label in Light and Dark (${measured.byMode
          .map((mode) => `${mode.mode} ${mode.minTextContrast}`)
          .join(", ")})`,
      );
    }

    const backdrop = await plugin.createBackdropVariant({
      props: { visibility: "Visible" },
      variableByName,
      stats: freshStats(),
    });
    ok(
      boundVariableName(backdrop.fills[0]) === "Overlay/Scrim" &&
        near(backdrop.fills[0].opacity, alphaOf("#00000080")),
      `Backdrop's scrim is Overlay/Scrim at its 50 % (${backdrop.fills[0] && backdrop.fills[0].opacity})`,
    );
  }

  // The mock itself: it keeps a bound paint at its token's own alpha and
  // drops a strength laid on an opaque token, which is what the file did.
  const before = boundPaintOpacityDrops.length;
  const probe = figma.createRectangle();
  probe.name = "Probe";
  probe.fills = [
    {
      type: "SOLID",
      color: { r: 1, g: 1, b: 1 },
      opacity: alphaOf("#FCFCFD1A"),
      boundVariables: {
        color: {
          type: "VARIABLE_ALIAS",
          id: "VariableID:Colors/transparent/inverted/10",
        },
      },
    },
  ];
  const keptAlpha = probe.fills[0].opacity;
  probe.fills = [
    {
      type: "SOLID",
      color: { r: 0, g: 0, b: 0 },
      opacity: 0.05,
      boundVariables: {
        color: { type: "VARIABLE_ALIAS", id: "VariableID:Colors/theme/500" },
      },
    },
  ];
  const droppedStrength = probe.fills[0].opacity;
  const recorded = boundPaintOpacityDrops.length - before;
  boundPaintOpacityDrops.splice(before);
  ok(
    near(keptAlpha, alphaOf("#FCFCFD1A")) &&
      droppedStrength === undefined &&
      recorded === 1,
    "the mock keeps a token's own alpha on the paint and drops a laid-on strength",
  );
}

// GAP-189: Backdrop's Target axis. Cut-out leaves an example control out of
// the dim, as React's `target` does: the scrim is an even-odd vector whose
// hole is the 120 by 44 control padded 8 (layout.spacing.100) and rounded 16
// (radius.control), and the ring is theme/600, 2 outside it, its radius 18.
// The variant draws no fill of its own, so what is under an instance shows
// through the hole. A variant named before the axis existed parses as
// Target=None, so Update renames it; Hidden has no Cut-out.
section("Backdrop cut-out (GAP-189)");
{
  const ready =
    typeof plugin.createBackdropVariant === "function" &&
    typeof plugin.parseBackdropVariantName === "function" &&
    typeof plugin.backdropVariantCombinations === "function" &&
    Array.isArray(plugin.BACKDROP_TARGETS);
  ok(ready, "Backdrop has a Target axis and a cut-out painter");
  if (ready) {
    const tokens = payloadVariables([...variableByName.keys()]);
    const paint = (props) =>
      plugin.createBackdropVariant({
        props,
        variableByName: tokens.variableByName,
        stats: freshStats(),
      });
    ok(
      JSON.stringify(plugin.backdropVariantCombinations()) ===
        JSON.stringify([
          { visibility: "Visible", target: "None" },
          { visibility: "Visible", target: "Cut-out" },
          { visibility: "Hidden", target: "None" },
        ]),
      `the set is Visible and Hidden with no target, and Visible with a cut-out (${JSON.stringify(plugin.backdropVariantCombinations())})`,
    );
    const parsed = [
      "Visibility=Visible",
      "Visibility=Hidden",
      "Visibility=Visible, Target=Cut-out",
      "Visibility=Hidden, Target=Cut-out",
    ].map((name) => plugin.parseBackdropVariantName(name));
    ok(
      JSON.stringify(parsed) ===
        JSON.stringify([
          { visibility: "Visible", target: "None" },
          { visibility: "Hidden", target: "None" },
          { visibility: "Visible", target: "Cut-out" },
          null,
        ]),
      `a variant from before the axis parses as Target=None, and Hidden has no cut-out (${JSON.stringify(parsed)})`,
    );

    const plain = await paint({ visibility: "Visible", target: "None" });
    ok(
      plain.name === "Visibility=Visible, Target=None" &&
        boundVariableName(plain.fills[0]) === "Overlay/Scrim" &&
        plain.children.length === 0,
      `with no target the variant is the scrim alone (${plain.name}, ${boundVariableName(plain.fills[0])}, ${plain.children.length} children)`,
    );

    const lit = await paint({ visibility: "Visible", target: "Cut-out" });
    const scrim = lit.findOne((node) => node.name === "Scrim");
    const ring = lit.findOne((node) => node.name === "Cut-out Ring");
    ok(
      lit.name === "Visibility=Visible, Target=Cut-out" &&
        lit.fills.length === 0 &&
        lit.width === 320 &&
        lit.height === 180,
      `a cut-out variant is 320 by 180 with no fill of its own (${lit.name}, ${lit.fills.length} fills, ${lit.width} by ${lit.height})`,
    );
    const path = scrim && scrim.vectorPaths && scrim.vectorPaths[0];
    ok(
      scrim &&
        scrim.type === "VECTOR" &&
        path &&
        path.windingRule === "EVENODD" &&
        boundVariableName(scrim.fills[0]) === "Overlay/Scrim",
      `its scrim is an even-odd vector in Overlay/Scrim (${scrim && scrim.type}, ${path && path.windingRule}, ${scrim && boundVariableName(scrim.fills[0])})`,
    );
    // The hole: the box round every point after the scrim's own outline.
    const numbers = path
      ? path.data
          .split(/ (?=M)/)
          .map((sub) => [...sub.matchAll(/-?[\d.]+/g)].map((m) => Number(m[0])))
      : [];
    const holeXs = (numbers[1] || []).filter((_, i) => i % 2 === 0);
    const holeYs = (numbers[1] || []).filter((_, i) => i % 2 === 1);
    const hole = holeXs.length
      ? [
          Math.min(...holeXs),
          Math.min(...holeYs),
          Math.max(...holeXs),
          Math.max(...holeYs),
        ]
      : null;
    ok(
      JSON.stringify(numbers[0]) ===
        JSON.stringify([0, 0, 320, 0, 320, 180, 0, 180]) &&
        JSON.stringify(hole) === JSON.stringify([92, 60, 228, 120]) &&
        /^[MLCZ\d.\s-]+$/.test(path ? path.data : ""),
      `the scrim covers the variant and its hole is the control padded 8, from 92, 60 to 228, 120, in M, L, C and Z alone (${JSON.stringify(hole)})`,
    );
    ok(
      ring &&
        ring.x === 90 &&
        ring.y === 58 &&
        ring.width === 140 &&
        ring.height === 64 &&
        ring.cornerRadius === 18 &&
        ring.strokeWeight === 2 &&
        ring.strokeAlign === "INSIDE" &&
        ring.fills.length === 0 &&
        boundVariableName(ring.strokes[0]) === "Colors/theme/600",
      `the ring is theme/600 at 2, inside a 140 by 64 box at 90, 58 rounded 18 (${ring && [ring.x, ring.y, ring.width, ring.height, ring.cornerRadius, ring.strokeWeight, boundVariableName(ring.strokes[0])].join(", ")})`,
    );
    const hidden = await paint({ visibility: "Hidden", target: "None" });
    ok(
      hidden.name === "Visibility=Hidden, Target=None" &&
        hidden.fills.length === 0 &&
        hidden.children.length === 0,
      `Hidden draws nothing (${hidden.name})`,
    );
  }
}

section("Surface QA specs name real variants");
{
  const groups = plugin.SURFACE_QA_COMPONENT_GROUPS;
  const ready =
    Array.isArray(groups) &&
    typeof plugin.expectedVariantAxesForComponentSetName === "function";
  ok(ready, "the Surface QA specs and the expected axes are reachable");
  if (ready) {
    const specs = groups.flatMap((group) => group.rows.flat());
    const wrong = specs.filter((spec) => {
      const axes = plugin.expectedVariantAxesForComponentSetName(
        spec.componentSetName,
      );
      if (!axes) return true;
      const pairs = spec.variantName.split(", ").map((pair) => pair.split("="));
      const named = pairs.map(([key]) => key);
      return (
        named.length !== Object.keys(axes).length ||
        !Object.keys(axes).every((key) => named.includes(key)) ||
        !pairs.every(([key, value]) => (axes[key] || []).includes(value))
      );
    });
    ok(
      specs.length > 0 && wrong.length === 0,
      `every Surface QA instance names a variant its set has (${wrong
        .map((spec) => `${spec.componentSetName} / ${spec.variantName}`)
        .join("; ")})`,
    );
  }
}

// --- Typography: the audit's guess follows the field painters -----------------------

section("Typography inference");
{
  // Each field painter draws its label-like texts with the Medium label style;
  // the audit guesses a style from the set and the node's name. On 2026-09-21
  // the guess called 160 of those texts stale in the live file.
  const cases = [
    ["DateRangePicker", "Start Label Text", "fieldLabel"],
    ["DateRangePicker", "End Label Text", "fieldLabel"],
    ["DateRangePicker", "Start Month Text", "fieldLabel"],
    ["DatePicker", "Month Text", "fieldLabel"],
    ["FormField", "Required Mark", "fieldLabel"],
    ["FileUpload", "Browse Text", "fieldLabel"],
    ["FileUpload", "Drop Text", "fieldText"],
    ["Input", "Label Text", "fieldLabel"],
    ["Input", "Optional Text", "fieldMeta"],
    ["Input", "Value Text", "fieldText"],
    // The 12/16 readouts, which the guess called field text until Apply Text
    // Styles restyled 656 of them at 14/20 in the live file (2026-09-21).
    ["DatePicker", "Weekday Text", "fieldMeta"],
    ["DateRangePicker", "Weekday Text", "fieldMeta"],
    ["FileUpload", "Description Text", "fieldMeta"],
    ["FileUpload", "File Meta Text", "fieldMeta"],
    ["FileUpload", "File Meta Text 2", "fieldMeta"],
    ["ColorPicker", "Hue Value Text", "fieldMeta"],
    ["ColorPicker", "Alpha Value Text", "fieldMeta"],
    ["ColorPicker", "Alpha Unit Text", "fieldMeta"],
    ["ColorPicker", "Mode Text", "fieldMeta"],
    ["ColorPicker", "Value Text", "fieldMeta", "ColorPicker Hex Field"],
    ["ColorPicker", "Value Text", "fieldText", "ColorPicker Field"],
    ["FormField", "Description Text", "fieldText"],
    // GAP-162: a control's description and Switch's state words are regular,
    // React's text-sm text-muted-foreground; GAP-158: a tile's description
    // is 12/16. Guessed Medium, the audit called them stale and Apply Text
    // Styles restyled them as labels.
    ["Checkbox", "Label Text", "controlLabel"],
    ["Checkbox", "Description Text", "fieldText", "Description Row"],
    ["Switch", "Description Text", "fieldText", "Description Row"],
    ["Switch", "State Label", "fieldText", "Label Row"],
    ["Radio", "Description Text", "fieldText", "Description Row"],
    [
      "Radio",
      "Description Text",
      "fieldText",
      "Text",
      "Checked=Checked, State=Default, Variant=Card",
    ],
    [
      "Radio",
      "Description Text",
      "fieldMeta",
      undefined,
      "Checked=Checked, State=Default, Variant=Tile",
    ],
    [
      "Radio",
      "Label Text",
      "controlLabel",
      undefined,
      "Checked=Checked, State=Default, Variant=Tile",
    ],
  ];
  const ready = typeof plugin.inferTextStyleKeyForComponentText === "function";
  ok(ready, "the audit's style guess is reachable");
  for (const [setName, textName, expected, parentName, variantName] of ready
    ? cases
    : []) {
    const set = new MockNode("COMPONENT_SET", setName);
    const component = new MockNode("COMPONENT", variantName || "State=Default");
    const text = new MockNode("TEXT", textName);
    if (parentName) {
      const parent = new MockNode("FRAME", parentName);
      parent.appendChild(text);
      component.appendChild(parent);
    } else {
      component.appendChild(text);
    }
    set.appendChild(component);
    const key = plugin.inferTextStyleKeyForComponentText(text, set);
    ok(
      key === expected,
      `${setName}${variantName ? ` (${variantName})` : ""} · ${textName}${parentName ? ` in ${parentName}` : ""} is ${expected} (got ${key})`,
    );
  }
  const source = fs.readFileSync(PLUGIN, "utf8");
  ok(
    /browse\.name = "Browse Text";[\s\S]{0,400}?applyFieldLabelTypography\(\s*browse,/.test(
      source,
    ) && !/browse\.fontName = fonts\.medium/.test(source),
    "FileUpload's browse text takes the Medium label style, no weight override",
  );
}

// --- Component lookups -------------------------------------------------------------

// Painters ask for an icon once per variant: 1,044 times in the Tree block. A
// lookup that searched the pages in order walked the whole Components page,
// 27k nodes in the live file, before it reached Icons, 28.7 million node
// visits for the three Tree sets, and Update All Core stalled there. An icon
// is looked up on Icons first and kept while it is still in the file under
// its name.
section("Component lookups");
{
  const registry = fs.readFileSync(
    path.join(ROOT, "packages/icons/src/registry.ts"),
    "utf8",
  );
  const iconNames = [
    ...registry
      .slice(
        registry.indexOf("export const kozmosIconNames = ["),
        registry.indexOf("] as const"),
      )
      .matchAll(/^\s+"([a-z0-9-]+)",$/gm),
  ].map((match) => match[1]);
  const components = new MockNode("PAGE", "Components");
  const decoy = mockIconComponent("chevron-down");
  const decoyHolder = new MockNode("FRAME", "Pasted Example");
  decoyHolder.appendChild(decoy);
  components.appendChild(decoyHolder);
  for (let index = 0; index < 200; index += 1) {
    components.appendChild(new MockNode("FRAME", `Filler ${index}`));
  }
  const elsewhere = new MockNode("PAGE", "Examples");
  const strayIcon = new MockNode("COMPONENT", "Icon / only-in-examples");
  elsewhere.appendChild(strayIcon);
  const icons = new MockNode("PAGE", "Icons");
  for (const name of iconNames) icons.appendChild(mockIconComponent(name));
  const lookupFigma = createFigmaMock({
    pages: [components, icons, elsewhere],
  });
  const lookupPlugin = loadPlugin({ pluginPath: PLUGIN, figma: lookupFigma });
  const ready =
    typeof lookupPlugin.findKozmosIconSourceComponent === "function" &&
    typeof lookupPlugin.treeItemComponentConfig === "function";
  ok(ready, "the icon lookup and the Tree painter are reachable");
  if (ready) {
    const find = lookupPlugin.findKozmosIconSourceComponent;
    const canonical = icons.findChild(
      (node) => node.name === "Icon / chevron-down",
    );

    resetSearchStats();
    const first = await find("chevron-down");
    ok(
      first === canonical,
      "an icon comes from the Icons page, not a same-named copy on Components",
    );
    ok(
      !searchStats.pageSearches.Components,
      `an icon on Icons is found without searching Components (searched: ${JSON.stringify(searchStats.pageSearches)})`,
    );

    resetSearchStats();
    const again = await find("chevron-down");
    ok(
      again === canonical && searchStats.visits === 0,
      `an icon found once is not searched for again (${searchStats.visits} nodes visited)`,
    );

    canonical.remove();
    const replacement = mockIconComponent("chevron-down");
    icons.appendChild(replacement);
    const afterRemoval = await find("chevron-down");
    ok(
      afterRemoval === replacement,
      "a removed icon is not handed out; its replacement on Icons is",
    );

    replacement.name = "Icon / chevron-down-renamed";
    const afterRename = await find("chevron-down");
    ok(
      afterRename !== replacement,
      "a renamed icon is not handed out under its old name",
    );

    const stray = await find("only-in-examples");
    ok(
      stray === strayIcon,
      "an icon missing from Icons is still found on another page",
    );

    const config = lookupPlugin.treeItemComponentConfig();
    const actionRow = config
      .combinations()
      .find(
        (props) =>
          props.content === "Actions" &&
          props.state === "Selected" &&
          props.type === "Parent",
      );
    ok(Boolean(actionRow), "the Tree has a selected parent row with actions");
    if (actionRow) {
      resetSearchStats();
      const row = lookupFigma.createComponent();
      await config.updateVariant(row, {
        props: actionRow,
        variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      const searched = Object.keys(searchStats.pageSearches);
      ok(
        searched.every((page) => page === "Icons"),
        `a Tree row's icons are read from Icons alone (searched: ${searched.join(", ") || "none"})`,
      );
      const instances = row.findAll((node) => node.type === "INSTANCE");
      ok(
        instances.length >= 3 &&
          instances.every(
            (instance) =>
              instance.mainComponent && instance.mainComponent.parent === icons,
          ),
        `every icon in the row is an instance of an Icons page component (${instances.length} instances)`,
      );
    }
  }
}

// --- What the audit reads under a wash ----------------------------------------------

// A translucent wash is a layer of its own at the back of the frame. The
// contrast audit composites it, at the paint's alpha times the layer's
// opacity, into what the frame's content sits on: CategoryField's yellow
// label on its 12 % wash is 1.77, not the 1.92 of the label on white the
// audit would read if it skipped the layer, nor 1.0 if it took the layer
// opaque.
section("What the audit reads under a wash");
{
  const ready =
    typeof plugin.contrastChildBackground === "function" &&
    typeof plugin.createVariableContext === "function" &&
    typeof plugin.updateCategoryFieldVariant === "function" &&
    typeof plugin.updateDirectionStepVariant === "function";
  ok(ready, "the audit's background and the two painters are reachable");
  if (ready) {
    const context = plugin.createVariableContext([], []);
    const white = { r: 1, g: 1, b: 1, a: 1 };
    const rgb = (paint) => ({ ...paint.color, a: 1 });
    const luminance = (c) => {
      const lin = (v) =>
        v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    };
    const ratio = (a, b) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const over = (top, alpha, under) => ({
      r: top.r * alpha + under.r * (1 - alpha),
      g: top.g * alpha + under.g * (1 - alpha),
      b: top.b * alpha + under.b * (1 - alpha),
      a: 1,
    });

    const field = figma.createComponent();
    await plugin.updateCategoryFieldVariant(field, {
      value: "Yellow",
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const wash = named(field, "Tint Wash");
    const icon = named(field, "Icon");
    const glyph = icon && icon.findOne((node) => node.type === "VECTOR");
    // A build without the wash layer fails here rather than stopping the run.
    ok(wash && glyph, "the field draws its wash layer and an icon glyph");
    if (wash && glyph) {
      const read = plugin.contrastChildBackground(
        field,
        white,
        context,
        "Light",
      );
      const expected = over(rgb(wash.fills[0]), wash.opacity, white);
      ok(
        ["r", "g", "b"].every((k) => Math.abs(read[k] - expected[k]) < 1e-6),
        "the audit reads the field's content on its 12 % wash, composited",
      );
      const measured = ratio(rgb(glyph.strokes[0]), read);
      ok(
        Math.abs(measured - 1.77) < 0.01 &&
          measured < ratio(rgb(glyph.strokes[0]), white) - 0.1,
        `the yellow icon reads ${measured.toFixed(2)} on the wash, below its ${ratio(rgb(glyph.strokes[0]), white).toFixed(2)} on white`,
      );
    }

    const step = figma.createComponent();
    await plugin.updateDirectionStepVariant(step, {
      value: "Straight",
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const disc = named(step, "Direction Icon");
    const discWash = disc && named(disc, "Direction Wash");
    ok(disc && discWash, "the step draws its disc's wash layer");
    if (disc && discWash) {
      const discRead = plugin.contrastChildBackground(
        disc,
        white,
        context,
        "Light",
      );
      const discTruth = over(rgb(discWash.fills[0]), discWash.opacity, white);
      ok(
        Math.abs(discRead.r - discTruth.r) < 1e-6 &&
          Math.abs(discRead.g - discTruth.g) < 1e-6 &&
          Math.abs(discRead.b - discTruth.b) < 1e-6,
        "the direction glyph is read on its disc's 10 % wash",
      );
    }
  }
}

// --- Decorative icons -------------------------------------------------------------------

// The category tile's and field's symbol is named by the label beside it, so
// WCAG 1.4.11 does not ask 3:1 of it (Olcay, 2026-09-21). The painters mark
// it; the audit measures it apart and reports a shortfall as an advisory,
// never as a failure and never silently. A control's glyph stays held to 3:1.
section("Decorative icons");
{
  const ready =
    typeof plugin.isDecorativeIcon === "function" &&
    typeof plugin.auditNodeContrast === "function" &&
    typeof plugin.createContrastAuditResult === "function";
  ok(ready, "the decorative mark and the audit's traversal are reachable");
  if (ready) {
    const tile = figma.createComponent();
    await plugin.updateCategoryTileVariant(tile, {
      props: { state: "Default", tint: "Yellow" },
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const tileIcon = tile.findOne(
      (node) => node.type === "INSTANCE" && node.name === "Icon",
    );
    ok(
      tileIcon && plugin.isDecorativeIcon(tileIcon),
      "the tile's category icon is marked decorative",
    );
    const field = figma.createComponent();
    await plugin.updateCategoryFieldVariant(field, {
      value: "Yellow",
      variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const fieldIcon = named(field, "Icon");
    const clearIcon = named(field, "Clear Icon");
    ok(
      fieldIcon &&
        plugin.isDecorativeIcon(fieldIcon) &&
        clearIcon &&
        !plugin.isDecorativeIcon(clearIcon),
      "the field's category icon is decorative; its clear's cross is not",
    );

    const context = plugin.createVariableContext([], []);
    const result = plugin.createContrastAuditResult();
    plugin.auditNodeContrast(
      tile,
      { r: 1, g: 1, b: 1, a: 1 },
      false,
      result,
      context,
      tile.name,
      "Light",
    );
    ok(
      result.nonTextFailures === 0 &&
        result.decorativePairs >= 1 &&
        result.decorativeBelowThree >= 1 &&
        result.decorativeShortfalls[0].kind === "decorative",
      `the yellow tile's icon is measured as decorative: ${result.decorativeBelowThree} below 3:1, ${result.nonTextFailures} failures`,
    );
    const source = fs.readFileSync(PLUGIN, "utf8");
    ok(
      /record\.contrast\.decorativeBelowThree > 0[\s\S]{0,400}?record\.advisories\.push\(/.test(
        source,
      ),
      "a decorative shortfall is reported as an advisory",
    );
  }
}

// --- The audit reads every fill ----------------------------------------------------

// Figma paints a node's fills bottom to top, so a second fill covers the first.
// c7d1d88351a7 drew each Selected CategoryTile square white under an opaque
// tint, its icon in the tint: rendered over REST the icon is not there to see,
// while the audit, reading the first fill alone, measured it on white at 1.92
// and passed six of the nine tints (2026-09-21).
section("The audit reads every fill");
{
  const ready =
    typeof plugin.auditNodeContrast === "function" &&
    typeof plugin.createContrastAuditResult === "function" &&
    typeof plugin.createVariableContext === "function";
  ok(ready, "the audit's traversal is reachable");
  if (ready) {
    const context = plugin.createVariableContext([], []);
    const white = { r: 1, g: 1, b: 1 };
    const black = { r: 0, g: 0, b: 0 };
    const yellow = { r: 0xf9 / 255, g: 0xac / 255, b: 0x17 / 255 };
    const solid = (color, opacity = 1) => ({
      type: "SOLID",
      color,
      opacity,
      visible: true,
    });
    const luminance = (c) => {
      const lin = (v) =>
        v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    };
    const ratio = (a, b) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const audit = (frame) => {
      const result = plugin.createContrastAuditResult();
      plugin.auditNodeContrast(
        frame,
        { ...white, a: 1 },
        false,
        result,
        context,
        "Stacked",
        "Light",
      );
      return result;
    };
    const square = (fills, glyphColor) => {
      const frame = new MockNode("FRAME", "Icon Square");
      frame.fills = fills;
      const glyph = new MockNode("VECTOR", "Glyph");
      glyph.strokes = [solid(glyphColor)];
      frame.appendChild(glyph);
      return frame;
    };

    const covered = audit(square([solid(white), solid(yellow)], yellow));
    ok(
      covered.nonTextFailures === 1 &&
        Math.abs(covered.minNonTextContrast - 1) < 1e-9,
      `a glyph in the colour of the fill on top reads 1:1 (read ${covered.minNonTextContrast && covered.minNonTextContrast.toFixed(2)})`,
    );
    const tint = 0.2;
    const washed = audit(square([solid(white), solid(yellow, tint)], yellow));
    const under = {
      r: yellow.r * tint + white.r * (1 - tint),
      g: yellow.g * tint + white.g * (1 - tint),
      b: yellow.b * tint + white.b * (1 - tint),
    };
    ok(
      Math.abs(washed.minNonTextContrast - ratio(yellow, under)) < 1e-9,
      `a translucent fill on top is composited: ${washed.minNonTextContrast && washed.minNonTextContrast.toFixed(2)}, expected ${ratio(yellow, under).toFixed(2)}`,
    );

    const panel = new MockNode("FRAME", "Panel");
    panel.fills = [solid(white), solid(black)];
    const label = new MockNode("TEXT", "Label Text");
    label.characters = "Label";
    label.fills = [solid(white)];
    panel.appendChild(label);
    const text = audit(panel);
    ok(
      text.textFailures === 0 && Math.abs(text.minTextContrast - 21) < 1e-9,
      `white text on a black fill over white reads 21:1 (read ${text.minTextContrast && text.minTextContrast.toFixed(2)})`,
    );
  }
}

// --- Every set's text carries a style ------------------------------------------------

// The audit held a hand-kept list of the sets to hold to their text styles, and
// FileUpload was not on it: its 32 browse labels lost their style on
// c7d1d88351a7, a weight set after the style detaching it, and no audit said
// so (2026-09-21).
section("Every set's text carries a style");
{
  const ready =
    typeof plugin.auditComponentSet === "function" &&
    typeof plugin.createAuditPerformance === "function";
  ok(ready, "the set audit is reachable");
  if (ready) {
    const textWarnings = (name, withUnstyled) => {
      const set = mockComponentSet(name, [
        {
          properties: { State: "Default" },
          build: (variant) => {
            variant.resize(320, 48);
            const styled = new MockNode("TEXT", "Label Text");
            styled.characters = "Label";
            styled.textStyleId = "S:field-label,";
            variant.appendChild(styled);
            if (withUnstyled) {
              const bare = new MockNode("TEXT", "Browse Text");
              bare.characters = "Click to upload";
              variant.appendChild(bare);
            }
          },
        },
      ]);
      const record = plugin.auditComponentSet(
        set,
        "Components",
        plugin.createVariableContext([], []),
        plugin.createAuditPerformance(),
      );
      return record.warnings.filter((warning) =>
        /text style|typography/i.test(warning),
      );
    };
    const fileUpload = textWarnings("FileUpload", true);
    ok(
      fileUpload.length === 1 &&
        /^1 text node\(s\) are missing Figma text styles/.test(fileUpload[0]),
      `FileUpload's unstyled label is reported: ${JSON.stringify(fileUpload)}`,
    );
    const button = textWarnings("Button", true);
    ok(
      button.length === 1,
      `a set with no bound typography reports its unstyled text once, not twice (${button.length})`,
    );
    ok(
      textWarnings("FileUpload", false).length === 0,
      "a set whose text all carries styles reports nothing",
    );
  }
}

// --- The product sets audit clean ------------------------------------------------------

// Figma reads a component set's properties only when every variant names the
// same ones: one variant without an axis the others have leaves the whole set
// in error ("Component set has existing errors"), with no property panel and
// nothing for Code Connect to read. LocationPin's Featured and Place variants
// named no Content on 16 Oct and did exactly that live. So every planned set
// is painted here as Update paints it: each variant's name must carry the same
// axes as its siblings', no two may be equal, and each must read back as the
// variant it was painted for.
section("Every planned set's variants name the same axes");
{
  const parseAxes = (name) =>
    Object.fromEntries(
      name.split(",").map((part) => {
        const [axis, ...value] = part.split("=");
        return [axis.trim(), value.join("=").trim()];
      }),
    );
  const configs = Object.keys(plugin)
    .filter(
      (name) =>
        /ComponentConfig$/.test(name) && typeof plugin[name] === "function",
    )
    .sort();
  ok(configs.length >= 18, `${configs.length} planned sets found`);
  for (const configName of configs) {
    const config = plugin[configName]();
    if (
      !config ||
      typeof config.combinations !== "function" ||
      typeof config.updateVariant !== "function"
    )
      continue;
    const names = [];
    for (const props of config.combinations()) {
      const component = figma.createComponent();
      await config.updateVariant(component, {
        props,
        variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      names.push({ name: component.name, key: config.keyForProps(props) });
    }
    const axes = (name) => Object.keys(parseAxes(name)).sort().join(", ");
    const first = names.length ? axes(names[0].name) : "";
    const uneven = names.filter(({ name }) => axes(name) !== first);
    ok(
      uneven.length === 0,
      `${config.componentSetName}: all ${names.length} variants name ${first}${uneven.length ? `, but ${uneven.map(({ name }) => `"${name}"`).join(", ")} do not` : ""}`,
    );
    const repeated = names.filter(
      ({ name }, index) => names.findIndex((n) => n.name === name) !== index,
    );
    ok(
      repeated.length === 0,
      `${config.componentSetName}: no two variants share a name${repeated.length ? ` (${repeated.map(({ name }) => `"${name}"`).join(", ")} repeat)` : ""}`,
    );
    const misread = names.filter(({ name, key }) => {
      const props = config.parseVariantName(name);
      return !props || props.stale || config.keyForProps(props) !== key;
    });
    ok(
      misread.length === 0,
      `${config.componentSetName}: each variant reads back as itself${misread.length ? ` (${misread.map(({ name }) => `"${name}"`).join(", ")} do not)` : ""}`,
    );
  }
}

// Every variant of the four sets the audit of 2026-09-21 20:38 warned on,
// painted as Update paints it and audited in Light and Dark with the token
// values the importer writes: no text below 4.5:1, no control below 3:1, and
// the category symbols, named by their labels, measured apart as decorative.
// Their c7d1d88351a7 drawings read five warnings live; replayed through this
// build's Update, none.
section("The product sets audit clean");
{
  const painters = [
    "updateDirectionStepVariant",
    "updateLocationPinVariant",
    "updateCategoryTileVariant",
    "updateCategoryFieldVariant",
  ];
  const ready =
    painters.every((name) => typeof plugin[name] === "function") &&
    typeof plugin.auditComponentContrast === "function";
  ok(ready, "the four painters and the contrast audit are reachable");
  if (ready) {
    const tokens = payloadVariables([...variableByName.keys()]);
    const context = plugin.createVariableContext(
      tokens.collections,
      tokens.variables,
    );
    const tints = plugin.CATEGORY_TINTS;
    const sets = [
      [
        "DirectionStep",
        plugin.DIRECTION_STEP_TYPES.map((value) => [
          "updateDirectionStepVariant",
          { value },
        ]),
      ],
      [
        "LocationPin",
        plugin
          .locationPinVariantCombinations()
          .map((props) => ["updateLocationPinVariant", { props }]),
      ],
      [
        "CategoryTile",
        plugin.CATEGORY_TILE_STATES.flatMap((state) =>
          tints.map((tint) => [
            "updateCategoryTileVariant",
            { props: { state, tint } },
          ]),
        ),
      ],
      [
        "CategoryField",
        tints.map((value) => ["updateCategoryFieldVariant", { value }]),
      ],
      [
        "Itinerary",
        (plugin.ITINERARY_CONTENT || []).map((value) => [
          "updateItineraryVariant",
          { value },
        ]),
      ],
      [
        "RouteProgressRail",
        (plugin.ROUTE_PROGRESS_RAIL_CONTENT || []).map((value) => [
          "updateRouteProgressRailVariant",
          { value },
        ]),
      ],
      [
        "TourStep",
        (plugin.TOUR_STEP_CONTENT || []).map((content) => [
          "updateTourStepVariant",
          { props: { content } },
        ]),
      ],
      [
        "ManoeuvreCard",
        (plugin.MANOEUVRE_CARD_STATES || []).flatMap((value) =>
          (plugin.MANOEUVRE_CARD_APPEARANCES || []).map((second) => [
            "updateManoeuvreCardVariant",
            { value, second },
          ]),
        ),
      ],
    ];
    for (const [name, variants] of sets) {
      const set = new MockNode("COMPONENT_SET", name);
      for (const [painter, args] of variants) {
        const component = figma.createComponent();
        await plugin[painter](component, {
          ...args,
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        });
        set.appendChild(component);
      }
      const contrast = plugin.auditComponentContrast(
        set,
        set.children,
        context,
      );
      const modes = contrast.byMode
        .map(
          (mode) =>
            `${mode.mode} text ${mode.minTextContrast}, non-text ${mode.minNonTextContrast}`,
        )
        .join("; ");
      // A set with no variants measures nothing, and would pass.
      ok(
        variants.length > 0 &&
          contrast.byMode.length === 2 &&
          contrast.textFailures === 0 &&
          contrast.nonTextFailures === 0,
        `${name}: ${variants.length} variants, no failure in Light or Dark (${modes}; ${contrast.failures
          .slice(0, 3)
          .map((f) => `${f.mode} ${f.node} ${f.ratio}`)
          .join(", ")})`,
      );
      if (name === "CategoryTile" || name === "CategoryField") {
        ok(
          contrast.decorativeBelowThree > 0 &&
            contrast.decorativeShortfalls.every(
              (shortfall) => shortfall.kind === "decorative",
            ),
          `${name}: the category symbols below 3:1 are measured as decorative (${contrast.decorativeBelowThree})`,
        );
        // Rounded to the nearest, the turquoise symbol's 2.996 read "3 < 3".
        ok(
          contrast.decorativeShortfalls.every(
            (shortfall) => shortfall.ratio < shortfall.required,
          ),
          `${name}: every shortfall prints below 3 (${contrast.decorativeShortfalls
            .map((shortfall) => shortfall.ratio)
            .join(", ")})`,
        );
      }
    }
  }
}

// --- Apply Text Styles leaves styled text alone ------------------------------------

// Run on the live file on 2026-09-21, after the audit named FileUpload's 32
// unstyled labels and the panel's next step said to run it, Apply Text Styles
// restyled every text it could guess a style for: it wrote each one's size and
// leading, which dropped their variables (4,957 texts in 46 sets), and it set
// 656 of the pickers' 12/16 readouts at 14/20. It now styles only text without
// a style and binds its size and leading back; the audit and the panel name
// the set's Update, which draws both.
section("Apply Text Styles leaves styled text alone");
{
  // Figma's own rule, which the mock keeps: a literal drops a binding.
  const probe = new MockNode("TEXT", "Probe");
  probe.setBoundVariable("fontSize", { id: "VariableID:Probe/size" });
  probe.fontSize = 14;
  ok(
    probe.boundVariables.fontSize === undefined,
    "the mock drops a text's size variable when a literal size is written",
  );

  const pagesForRun = () => {
    const components = new MockNode("PAGE", "Components");
    const icons = new MockNode("PAGE", "Icons");
    return [components, icons];
  };
  const runFigma = createFigmaMock({ pages: pagesForRun() });
  const runPlugin = loadPlugin({ pluginPath: PLUGIN, figma: runFigma });
  let styleIds = 0;
  runFigma.createTextStyle = () => ({ id: `S:created-${(styleIds += 1)}` });
  runFigma.variables.getVariableByIdAsync = async (id) => ({
    id,
    name: String(id).replace(/^VariableID:/, ""),
  });
  const ready =
    typeof runPlugin.applyTextStylesToComponentLibrary === "function" &&
    typeof runPlugin.resetTextStyleCache === "function";
  ok(ready, "Apply Text Styles runs in the harness");
  if (ready) {
    runPlugin.resetTextStyleCache();
    const bound = (text, prefix) => {
      text.setBoundVariable("fontSize", {
        id: `VariableID:${prefix}/font-size`,
      });
      text.setBoundVariable("lineHeight", {
        id: `VariableID:${prefix}/line-height`,
      });
    };
    const components = runFigma.root.children.find(
      (page) => page.name === "Components",
    );
    const picker = mockComponentSet("DatePicker", [
      {
        properties: { State: "Default" },
        build: (variant) => {
          const weekdays = new MockNode("FRAME", "DatePicker Weekdays");
          const weekday = new MockNode("TEXT", "Weekday Text");
          weekday.characters = "Mo";
          weekday.fontSize = 12;
          weekday.lineHeight = { unit: "PIXELS", value: 16 };
          weekday.textStyleId = "S:field-meta-as-drawn";
          bound(weekday, "DatePicker/weekday");
          weekdays.appendChild(weekday);
          variant.appendChild(weekdays);
        },
      },
    ]);
    const upload = mockComponentSet("FileUpload", [
      {
        properties: { State: "Default" },
        build: (variant) => {
          const browse = new MockNode("TEXT", "Browse Text");
          browse.characters = "Click to upload";
          browse.fontSize = 14;
          browse.lineHeight = { unit: "PIXELS", value: 20 };
          bound(browse, "FileUpload/label");
          variant.appendChild(browse);
        },
      },
    ]);
    components.appendChild(picker);
    components.appendChild(upload);
    const result = await runPlugin.applyTextStylesToComponentLibrary();
    const weekday = picker.findOne((node) => node.name === "Weekday Text");
    const browse = upload.findOne((node) => node.name === "Browse Text");
    ok(
      weekday.textStyleId === "S:field-meta-as-drawn" &&
        weekday.fontSize === 12 &&
        weekday.boundVariables.fontSize &&
        weekday.boundVariables.fontSize.id ===
          "VariableID:DatePicker/weekday/font-size" &&
        weekday.boundVariables.lineHeight &&
        weekday.boundVariables.lineHeight.id ===
          "VariableID:DatePicker/weekday/line-height",
      `a styled text keeps its style, its 12 and its variables (style ${weekday.textStyleId}, ${weekday.fontSize}, size variable ${weekday.boundVariables.fontSize && weekday.boundVariables.fontSize.id})`,
    );
    ok(
      /^S:created-/.test(browse.textStyleId) &&
        browse.boundVariables.fontSize &&
        browse.boundVariables.fontSize.id ===
          "VariableID:FileUpload/label/font-size" &&
        browse.boundVariables.lineHeight &&
        browse.boundVariables.lineHeight.id ===
          "VariableID:FileUpload/label/line-height",
      `an unstyled text is styled and keeps its variables (style ${browse.textStyleId || "none"}, size variable ${browse.boundVariables.fontSize && browse.boundVariables.fontSize.id})`,
    );
    ok(
      result.textNodesStyled === 1 && result.textNodesAlreadyStyled === 1,
      `it counts one styled and one left as drawn (${result.textNodesStyled}, ${result.textNodesAlreadyStyled})`,
    );
    runPlugin.resetTextStyleCache();
  }

  const source = fs.readFileSync(PLUGIN, "utf8");
  const ui = fs.readFileSync(
    path.join(path.dirname(PLUGIN), "ui.html"),
    "utf8",
  );
  const missingStyles = source.match(
    /text node\(s\) are missing Figma text styles\.[^`]*`/,
  );
  ok(
    missingStyles &&
      /Update this set/.test(missingStyles[0]) &&
      !/Apply Text Styles/.test(missingStyles[0]),
    "the audit names the set's Update for text without a style, not Apply Text Styles",
  );
  const nextStep = ui.match(
    /warning\.includes\("missing Figma text styles"\)[\s\S]{0,200}?return "([^"]+)"/,
  );
  ok(
    nextStep && !/Apply Text Styles/.test(nextStep[1]),
    `the panel's next step for it is not Apply Text Styles (${nextStep && nextStep[1]})`,
  );
}

// --- One run at a time, and a long set says where it is ------------------------------

// On 2026-09-21 Update All Core ran with the panel frozen on "Updating
// NavigationItem" while the file had reached SearchBar: a set's variants ran
// without one real yield, so Figma neither redrew the panel nor saved the file,
// and TreeItem went over ten minutes without a save before Figma was quit. The
// two bulk buttons also stayed enabled during a run, and a press then started a
// second sequence alongside the first. A long set now reports each variant and
// phase and yields; the panel disables the bulk buttons while busy; the plugin
// refuses a second run.
section("One run at a time, and a long set says where it is");
{
  const ui = fs.readFileSync(
    path.join(path.dirname(PLUGIN), "ui.html"),
    "utf8",
  );
  const controls = ui.match(/function renderControls\(\) \{[\s\S]*?\n {6}\}/);
  ok(
    controls &&
      /updateAllProductSdkButton\.disabled = busy/.test(controls[0]) &&
      /updateAllCoreButton\.disabled = busy/.test(controls[0]),
    "the panel disables both bulk updates while a run is busy",
  );

  // A file for the run: the Icons the Tree rows use, and stand-ins for the
  // variable and text-style API a Build creates on demand.
  const runPages = () => {
    const components = new MockNode("PAGE", "Components");
    const icons = new MockNode("PAGE", "Icons");
    for (const name of [
      "chevron-down",
      "chevron-right",
      "map-01",
      "marker-pin-01",
      "edit-01",
      "lock-01",
      "trash-01",
      "download-01",
      "settings-01",
      "x-close",
      "eye",
    ]) {
      icons.appendChild(mockIconComponent(name));
    }
    return [components, icons, new MockNode("PAGE", "Utilities")];
  };
  const runFigma = createFigmaMock({ pages: runPages() });
  const withPluginData = (extra) =>
    Object.assign(
      {
        data: {},
        setSharedPluginData(_namespace, key, value) {
          this.data[key] = value;
        },
        getSharedPluginData(_namespace, key) {
          return this.data[key] || "";
        },
      },
      extra,
    );
  const collections = [];
  const variables = [];
  runFigma.variables.getLocalVariableCollectionsAsync = async () => collections;
  runFigma.variables.getLocalVariablesAsync = async () => variables;
  runFigma.variables.getVariableByIdAsync = async (id) =>
    variables.find((variable) => variable.id === id) || null;
  runFigma.variables.createVariableCollection = (name) => {
    const collection = withPluginData({
      id: `VariableCollectionId:${name}`,
      name,
      modes: [{ modeId: "m1", name: "Mode 1" }],
      renameMode(id, next) {
        const mode = this.modes.find((m) => m.modeId === id);
        if (mode) mode.name = next;
      },
      addMode(next) {
        const id = `m${this.modes.length + 1}`;
        this.modes.push({ modeId: id, name: next });
        return id;
      },
    });
    collections.push(collection);
    return collection;
  };
  runFigma.variables.createVariable = (name, collection, type) => {
    const variable = withPluginData({
      id: `VariableID:${name}`,
      name,
      resolvedType: type,
      variableCollectionId:
        typeof collection === "string" ? collection : collection.id,
      valuesByMode: {},
      scopes: [],
      codeSyntax: {},
      setValueForMode(mode, value) {
        this.valuesByMode[mode] = value;
      },
      setVariableCodeSyntax(platform, value) {
        this.codeSyntax[platform] = value;
      },
    });
    variables.push(variable);
    return variable;
  };
  let styleCount = 0;
  runFigma.createTextStyle = () => ({ id: `S:run-${(styleCount += 1)}` });
  const notices = [];
  runFigma.notify = (text) => notices.push(String(text));
  const posted = [];
  runFigma.ui.postMessage = (message) => posted.push(message);
  const runPlugin = loadPlugin({ pluginPath: PLUGIN, figma: runFigma });

  const ready =
    typeof runPlugin.buildTreeItemComponent === "function" &&
    typeof runPlugin.updateTreeItemComponent === "function" &&
    typeof runPlugin.reportSetProgress === "function";
  ok(
    ready,
    "TreeItem's Build and Update and the progress report are reachable",
  );
  if (ready) {
    await runPlugin.buildTreeItemComponent();
    posted.length = 0;
    await runPlugin.updateTreeItemComponent();
    const progress = posted
      .filter((message) => message && message.type === "audit-progress")
      .map((message) => `${message.title} — ${message.detail}`);
    ok(
      progress.some((line) =>
        /Updating TreeItem — variant 1 of 216$/.test(line),
      ) &&
        progress.some((line) =>
          /Updating TreeItem — component properties$/.test(line),
        ) &&
        progress.some((line) => /Updating TreeItem — layout$/.test(line)),
      `TreeItem's Update reports its variants and phases (${progress.length} reports: ${progress.slice(0, 3).join("; ")})`,
    );
  }

  ok(
    typeof runPlugin.slowestSetsText === "function" &&
      runPlugin.slowestSetsText([
        { name: "Link", seconds: 2 },
        { name: "TreeItem", seconds: 842 },
        { name: "Tag", failed: "x", seconds: 0 },
        { name: "NavigationItem", seconds: 371 },
      ]) === " Slowest: TreeItem 842 s, NavigationItem 371 s, Link 2 s.",
    "a run's result names its slowest sets with their times",
  );

  // Two presses: the second, while the first runs, is refused with a notice.
  const first = runFigma.ui.onmessage({ type: "update-all-product-sdk" });
  const second = runFigma.ui.onmessage({ type: "update-all-core" });
  await second;
  await first;
  ok(
    notices.length === 1 && /still running/.test(notices[0]),
    `a second run during the first is refused (${notices.join(" | ") || "no notice"})`,
  );
  await runFigma.ui.onmessage({ type: "update-all-product-sdk" });
  ok(notices.length === 1, "a run after the first has finished is not refused");
}

// --- Layout sizing Figma accepts ---------------------------------------------------

// A run on 2026-09-21 logged 319 layout sizing calls Figma refused: HUG on
// icon instances and a rectangle, which have no content to hug, and FILL on
// a node outside an auto-layout parent or before it was appended. The harness
// refuses what Figma refuses; every config painter, and the Slider, must ask
// for sizing Figma accepts.
section("Layout sizing Figma accepts");
{
  const sizingIcons = new MockNode("PAGE", "Icons");
  const registry = fs.readFileSync(
    path.join(ROOT, "packages/icons/src/registry.ts"),
    "utf8",
  );
  for (const match of registry
    .slice(
      registry.indexOf("export const kozmosIconNames = ["),
      registry.indexOf("] as const"),
    )
    .matchAll(/^\s+"([a-z0-9-]+)",$/gm)) {
    sizingIcons.appendChild(mockIconComponent(match[1]));
  }
  const sizingFigma = createFigmaMock({
    pages: [new MockNode("PAGE", "Components"), sizingIcons],
  });
  const sizingPlugin = loadPlugin({ pluginPath: PLUGIN, figma: sizingFigma });
  const ready =
    Array.isArray(sizingPlugin.layoutSizingFailures) &&
    typeof sizingPlugin.resetLayoutSizingFailures === "function";
  ok(ready, "the plugin records the sizing Figma refuses");
  const source = fs.readFileSync(PLUGIN, "utf8");
  const configNames = [
    ...source.matchAll(/^function ([a-zA-Z]+ComponentConfig)\(\)/gm),
  ].map((match) => match[1]);
  const painters = configNames
    .filter((name) => typeof sizingPlugin[name] === "function")
    .map((name) => {
      const config = sizingPlugin[name]();
      return {
        name: config.componentName || name,
        variants: config.combinations(),
        paint: (component, props) =>
          config.updateVariant(component, {
            props,
            variableByName,
            fonts: FONTS,
            stats: freshStats(),
          }),
      };
    });
  if (typeof sizingPlugin.updateSliderVariant === "function") {
    const variants = [];
    for (const state of sizingPlugin.SLIDER_STATES) {
      for (const status of sizingPlugin.SLIDER_STATUSES) {
        for (const type of sizingPlugin.SLIDER_TYPES) {
          variants.push({ state, status, type });
        }
      }
    }
    painters.push({
      name: "Slider",
      variants,
      paint: (component, props) =>
        sizingPlugin.updateSliderVariant(component, {
          ...props,
          variableByName,
          fonts: FONTS,
          stats: freshStats(),
        }),
    });
  }
  ok(painters.length >= 19, `${painters.length} painters are measured`);
  for (const painter of ready ? painters : []) {
    sizingPlugin.resetLayoutSizingFailures();
    for (const props of painter.variants) {
      await painter.paint(sizingFigma.createComponent(), props);
    }
    const refused = sizingPlugin.layoutSizingFailures.slice();
    ok(
      refused.length === 0,
      `${painter.name} asks only for sizing Figma accepts${
        refused.length
          ? ` (${refused.length} refused, e.g. ${refused
              .slice(0, 2)
              .map((f) => `${f.node} ${f.axis}=${f.value}`)
              .join("; ")})`
          : ""
      }`,
    );
  }
}

// --- The build a run names ---------------------------------------------------------

// A pasted audit or a panel is only evidence about the build that produced it,
// and Figma can keep an older import running. The panel asks once it loads and
// shows the answer; the audit report carries it.
section("The build a run names");
{
  const posted = [];
  const buildFigma = createFigmaMock({ pages: pages() });
  buildFigma.ui.postMessage = (message) => posted.push(message);
  const buildPlugin = loadPlugin({ pluginPath: PLUGIN, figma: buildFigma });
  const stamp = (fs
    .readFileSync(PLUGIN, "utf8")
    .match(/const PLUGIN_BUILD = "([0-9a-f]+)";/) || [])[1];
  ok(Boolean(stamp), "the plugin carries a build stamp");
  const handler = buildFigma.ui.onmessage;
  ok(typeof handler === "function", "the plugin listens to the panel");
  if (typeof handler === "function") {
    await handler({ type: "ui-ready" });
    const reply = posted.find((message) => message.type === "plugin-build");
    ok(
      Boolean(reply) && reply.build === stamp,
      `the panel's ready message is answered with the build (${reply ? reply.build : "no answer"})`,
    );
  }
  const source = fs.readFileSync(PLUGIN, "utf8");
  ok(
    /const audit = \{[\s\S]{0,400}?pluginBuild: PLUGIN_BUILD,/.test(source),
    "the audit report names the build that wrote it",
  );
  ok(Boolean(buildPlugin), "the plugin loads for the build check");
}

section("Bound paint opacities");
// Every painter above ran against a mock that keeps a bound paint at its
// token's own alpha and drops any other opacity; a strength goes on the layer.
ok(
  boundPaintOpacityDrops.length === 0,
  `no painter laid a strength on a bound paint (${boundPaintOpacityDrops
    .slice(0, 6)
    .map((drop) => `${drop.node}: ${drop.token} at ${drop.opacity}`)
    .join(", ")})`,
);

section("Icon slots repaired from what they record");
// Navbar sat at 0 of 5 tinted and Sidebar at 8 of 18 through repeated Updates
// on 2026-09-23: every slot named Colors/foreground/400 in its own plugin data
// and was painted plain black, because the three generic updaters never looked
// at an icon's paint. repairIconSlotTints reads the record back.
{
  const NS = "kozmos_ds_importer";
  const makeSlot = () => {
    const slot = new MockNode("INSTANCE", "Icon");
    slot.setSharedPluginData(NS, "kind", "icon-slot-instance");
    slot.setSharedPluginData(NS, "foreground-token", "Colors/foreground/400");
    slot.setSharedPluginData(NS, "foreground-fallback", "#000000");
    const glyph = new MockNode("VECTOR", "glyph");
    glyph.fills = [
      { type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0 } },
    ];
    slot.appendChild(glyph);
    return { slot, glyph };
  };

  ok(
    typeof plugin.repairIconSlotTints === "function",
    "the plugin exposes a tint repair the generic updaters can call",
  );

  const set = new MockNode("COMPONENT_SET", "Navbar");
  const variant = new MockNode("COMPONENT", "Size=Md");
  set.appendChild(variant);
  const orphan = makeSlot();
  variant.appendChild(orphan.slot);

  const stats = freshStats();
  const first = plugin.repairIconSlotTints(set, variableByName, stats);
  ok(first.repaired === 1, "an orphaned slot that records a token is repaired");
  ok(
    boundVariableName(orphan.glyph.fills[0]) === "Colors/foreground/400",
    "the repaired paint binds the token the slot recorded",
  );
  const again = plugin.repairIconSlotTints(set, variableByName, stats);
  ok(again.repaired === 0, "a second run writes nothing");

  // A slot with no visible paint cannot be re-tinted, and the predicate cannot
  // say so: it returns `seen && expected`, so "no paint" reads exactly like
  // "wrong paint". Repairing it writes nothing, so the next run finds it
  // unchanged and repairs it again, for ever, pushing "Could not find tintable
  // fill or stroke layers" into the warnings each time.
  const paintlessSet = new MockNode("COMPONENT_SET", "Paintless");
  const paintlessVariant = new MockNode("COMPONENT", "Size=Md");
  paintlessSet.appendChild(paintlessVariant);
  const bare = makeSlot();
  bare.glyph.fills = [];
  paintlessVariant.appendChild(bare.slot);

  const bareStats = freshStats();
  const bareFirst = plugin.repairIconSlotTints(
    paintlessSet,
    variableByName,
    bareStats,
  );
  const bareSecond = plugin.repairIconSlotTints(
    paintlessSet,
    variableByName,
    bareStats,
  );
  ok(
    bareFirst.repaired === 0 && bareSecond.repaired === 0,
    "a slot with no visible paint is never reported as repaired",
  );
  ok(
    bareFirst.paintless === 1,
    "it is counted as paintless so the run can still say so",
  );
  ok(
    bareStats.warnings.length === 0,
    "and neither run pushes a warning about it",
  );

  // Sidebar's remaining ten live inside another instance, where Figma owns the
  // children. Say so rather than failing silently.
  const nestedSet = new MockNode("COMPONENT_SET", "Sidebar");
  const nestedVariant = new MockNode("COMPONENT", "Size=Md");
  nestedSet.appendChild(nestedVariant);
  const host = new MockNode("INSTANCE", "NavigationItem");
  nestedVariant.appendChild(host);
  const nested = makeSlot();
  host.appendChild(nested.slot);

  const nestedStats = freshStats();
  const result = plugin.repairIconSlotTints(
    nestedSet,
    variableByName,
    nestedStats,
  );
  ok(
    result.repaired === 0 && result.unreachable.length === 1,
    "a slot inside another instance is counted, not written",
  );
  ok(
    nestedStats.warnings.some((warning) => /nested instance/.test(warning)),
    "and the run warns which slots it could not reach",
  );
}

section("A navigation row keeps its tint through the icon swap");
// Sidebar's four Selected rows — Item 1 in each Side variant, Item 2 in Rail —
// sat flat #000000 through Update All Core on 2026-09-27, while its other
// fourteen icons were fine. Setting the Leading Icon property replaces the
// layer the tint was laid on, and repairIconSlotTints will not follow into a
// nested instance (the section above asserts it says so instead). The painter
// that made the swap is the one that has to lay the tint again.
{
  const makeRow = (name) => {
    const row = new MockNode("INSTANCE", name);
    const frame = new MockNode("FRAME", "Leading Icon Frame");
    const icon = new MockNode("INSTANCE", "Leading Icon");
    const glyph = new MockNode("VECTOR", "glyph");
    glyph.fills = [
      { type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0 } },
    ];
    icon.appendChild(glyph);
    frame.appendChild(icon);
    row.appendChild(frame);
    return { row, glyph };
  };

  const hasRetint =
    typeof plugin.retintNavigationItemLeadingIcon === "function";
  ok(
    hasRetint,
    "the plugin exposes the re-tint the row painter calls after a swap",
  );

  // Guarded, so this section reports four failures against a build without the
  // fix rather than throwing on the first call and taking the rest of the run
  // with it — a control that crashes proves nothing about what it was testing.
  if (!hasRetint) {
    ok(
      false,
      "a Selected row's icon binds the theme tint (not run: no re-tint)",
    );
    ok(
      false,
      "a Default row's icon binds the foreground tint (not run: no re-tint)",
    );
    ok(false, "a row with no icon layer warns (not run: no re-tint)");
  }

  if (hasRetint) {
    const selected = makeRow("Item 1 Text Row");
    const selectedStats = freshStats();
    plugin.retintNavigationItemLeadingIcon(
      selected.row,
      "Selected",
      variableByName,
      selectedStats,
    );
    ok(
      boundVariableName(selected.glyph.fills[0]) === "Colors/theme/600",
      "a Selected row's icon binds the theme's 600, not the source's black (decision 59)",
    );

    const plain = makeRow("Item 2 Text Row");
    const plainStats = freshStats();
    plugin.retintNavigationItemLeadingIcon(
      plain.row,
      "Default",
      variableByName,
      plainStats,
    );
    ok(
      boundVariableName(plain.glyph.fills[0]) === "Colors/foreground/400",
      "a Default row's icon binds the foreground tint",
    );

    // The two paths of one function must agree about what Selected looks like:
    // a live row and the frame drawn when NavigationItem is missing.
    const source = fs.readFileSync(PLUGIN, "utf8");
    ok(
      source.includes(
        'state === "Selected" ? "Colors/theme/600" : "Colors/foreground/400"',
      ),
      "the fallback row paints the same two tokens the re-tint does",
    );

    // A row whose icon layer is gone must say so, not throw mid-update.
    const bare = new MockNode("INSTANCE", "Item 3 Text Row");
    const bareStats = freshStats();
    plugin.retintNavigationItemLeadingIcon(
      bare,
      "Selected",
      variableByName,
      bareStats,
    );
    ok(
      bareStats.warnings.some((warning) =>
        /no Leading Icon layer/.test(warning),
      ),
      "a row with no icon layer warns instead of failing",
    );
  }

  // The label is the theme as text too (Olcay, 2026-10-07): a Selected
  // NavigationItem's label is theme 600, as React, SwiftUI and Compose draw
  // it, in the set and in the frame drawn when the set is missing. It was 700.
  ok(
    plugin.navigationItemTextColorToken({ state: "Selected" }) ===
      "Colors/theme/600" &&
      plugin.navigationItemTextColorFallback({ state: "Selected" }) ===
        "#1051E8",
    "a Selected NavigationItem's label binds the theme's 600, not 700",
  );
  ok(
    fs
      .readFileSync(PLUGIN, "utf8")
      .includes(
        'state === "Selected" ? "Colors/theme/600" : "Colors/foreground/0"',
      ),
    "the fallback row's label paints the theme's 600 too",
  );
}

// --- Rating's two scales -------------------------------------------------------------

section("Rating");
{
  ok(
    typeof plugin.updateRatingVariant === "function" &&
      typeof plugin.buildRatingComponent === "function" &&
      typeof plugin.updateRatingComponent === "function",
    "Rating has a painter, a Build and an Update",
  );
  // Named explicitly rather than compared as JSON against a plugin constant:
  // `JSON.stringify` drops an undefined key, so `{ Scale: undefined, ... }`
  // matched the old two-axis shape exactly and the assertion passed on a
  // painter that had no Scale at all.
  const ratingAxes = plugin.expectedVariantAxesForComponentSetName("Rating");
  ok(
    JSON.stringify(ratingAxes && ratingAxes.Scale) ===
      JSON.stringify(["Stars", "Thumbs"]),
    `the set expects a Scale of Stars and Thumbs (got ${JSON.stringify(ratingAxes && ratingAxes.Scale)})`,
  );
  ok(
    Array.isArray(ratingAxes && ratingAxes.Value) &&
      Array.isArray(ratingAxes && ratingAxes.State),
    "beside Value and State",
  );

  // The theme steps this painter binds — Colors/theme/0 and /600 — are in the
  // payload rather than in the bare mock list, so the map is built the way the
  // Stepper and card checks build theirs. Without it the paint falls back to
  // its hex and the binding assertions below would be measuring the harness.
  const ratingTokens = payloadVariables([...variableByName.keys()]);

  async function paint(scale, value, state = "Default") {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateRatingVariant(component, {
      scale,
      value,
      state,
      variableByName: ratingTokens.variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }

  if (typeof plugin.updateRatingVariant === "function") {
    const stars = (await paint("Stars", "3")).component;
    ok(
      stars.name === "Scale=Stars, Value=3, State=Default",
      `a star variant carries all three axes (got "${stars.name}")`,
    );
    ok(stars.children.length === 5, "the stars scale draws five cells");

    const thumbs = (await paint("Thumbs", "2")).component;
    ok(
      thumbs.name === "Scale=Thumbs, Value=2, State=Default",
      `a thumbs variant is named for its scale (got "${thumbs.name}")`,
    );
    ok(thumbs.children.length === 2, "the thumbs scale draws two cells");
    ok(
      thumbs.children[0].name === "Rating Thumb Down" &&
        thumbs.children[1].name === "Rating Thumb Up",
      "down first, then up — 1 is the lowest on both scales",
    );
    ok(
      thumbs.children.every((cell) => cell.width === 44 && cell.height === 44),
      "each thumb keeps a 44 target",
    );

    const discOf = (cell) => cell.children[0];
    ok(
      thumbs.children.every(
        (cell) => discOf(cell).width === 40 && discOf(cell).height === 40,
      ),
      "with a 40 disc inside it",
    );

    // Exactly the one chosen fills. A thumbs-up is not "two thumbs", so the
    // cumulative rule the stars follow must NOT apply here.
    ok(
      discOf(thumbs.children[1]).strokeWeight === 2 &&
        boundVariableName(discOf(thumbs.children[1]).strokes[0]) ===
          "Colors/theme/600",
      "the chosen thumb takes a 2 ring in the theme",
    );
    ok(
      discOf(thumbs.children[0]).strokes.length === 0,
      "and the other takes none — thumbs do not fill cumulatively",
    );

    const down = (await paint("Thumbs", "1")).component;
    ok(
      discOf(down.children[0]).strokeWeight === 2 &&
        discOf(down.children[1]).strokes.length === 0,
      "choosing down rings down and not up",
    );

    const none = (await paint("Thumbs", "0")).component;
    ok(
      none.children.every((cell) => discOf(cell).strokes.length === 0),
      "0 is unanswered: neither is ringed",
    );

    const readonly = (await paint("Thumbs", "2", "Readonly")).component;
    ok(
      readonly.children.every((cell) => cell.opacity === 0.72),
      "a read-only rating is drawn quieter, as the stars are",
    );
  }

  // The name a variant built before the Scale axis carries. Update has to read
  // it as Stars and RENAME it, because replacing it would change the node id
  // Code Connect pins.
  ok(
    typeof plugin.parseRatingVariantName === "function" &&
      JSON.stringify(
        plugin.parseRatingVariantName("Value=3, State=Default"),
      ) === JSON.stringify({ scale: "Stars", value: "3", state: "Default" }),
    "a variant with no Scale reads as Stars, so Update renames rather than replaces",
  );
  ok(
    plugin.parseRatingVariantName("Scale=Thumbs, Value=4, State=Default") ===
      null,
    "thumbs has no fourth value, and the set refuses to draw one",
  );
  ok(
    JSON.stringify(
      plugin.parseRatingVariantName("Scale=Thumbs, Value=2, State=Readonly"),
    ) === JSON.stringify({ scale: "Thumbs", value: "2", state: "Readonly" }),
    "and accepts the three values it does have",
  );
}

// --- Card's padding, and the second axis the helper now takes ------------------------

section("Card");
{
  const cardAxes = plugin.expectedVariantAxesForComponentSetName("Card");
  ok(
    JSON.stringify(cardAxes && cardAxes.Padding) ===
      JSON.stringify(["Default", "Compact"]),
    `the set expects a Padding of Default and Compact (got ${JSON.stringify(cardAxes && cardAxes.Padding)})`,
  );

  const cardTokens = payloadVariables([...variableByName.keys()]);
  async function card(value, second) {
    const component = figma.createComponent();
    await plugin.updateCardVariant(component, {
      value,
      second,
      variableByName: cardTokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  }

  const full = await card("Full", "Default");
  ok(
    full.name ===
      "Content=Full, Padding=Default, HeaderTone=Default, TitleSize=Large",
    `a variant carries every axis, a bare padding its Default tone and title (got "${full.name}")`,
  );

  const compact = await card("Full", "Compact");
  const padsOf = (component) =>
    ["Card Header", "Card Body", "Card Footer"]
      .map((name) => named(component, name))
      .filter(Boolean)
      .map((node) => node.paddingLeft);

  ok(
    padsOf(full).length >= 2 && padsOf(full).every((v) => v === 24),
    `default pads 24 throughout (got ${JSON.stringify(padsOf(full))})`,
  );
  // The whole card, not just the header: 16 at the top and 24 at the bottom
  // is the bug, not the fix.
  ok(
    padsOf(compact).length === padsOf(full).length &&
      padsOf(compact).every((v) => v === 16),
    `compact pads 16 throughout (got ${JSON.stringify(padsOf(compact))})`,
  );

  ok(
    JSON.stringify(plugin.parseCardVariantName("Content=Full")) ===
      JSON.stringify({ value: "Full", second: "Default|Default|Large" }),
    "a variant with no Padding, HeaderTone or TitleSize reads as Default, Default and Large, so Update renames rather than replaces",
  );
  ok(
    plugin.parseCardVariantName("Content=Full, Padding=Roomy") === null,
    "and an unknown padding is refused",
  );

  // The generic helper grew the second axis; these are the two facts every
  // set built through it now depends on.
  ok(
    typeof plugin.generatedVariantCombinations === "function" &&
      plugin.generatedVariantCombinations({
        values: ["a", "b"],
        axis2Values: ["x", "y"],
      }).length === 4,
    "the helper crosses both axes",
  );
  // Guarded, like the assertion above it. Calling a helper that a previous
  // build did not have throws a TypeError, which aborts the whole run — so a
  // negative control against the old painter would stop here and every
  // section after it would silently never execute.
  ok(
    typeof plugin.generatedVariantCombinations === "function" &&
      plugin.generatedVariantCombinations({ values: ["a", "b"] }).length ===
        2 &&
      plugin.generatedVariantCombinations({ values: ["a"] })[0].second === null,
    "and a set with one axis is untouched",
  );
}

// --- GAP-200, CLOUD-UI-001, GAP-035: Button's subtle variant, CardHeader's subtle
// tone and CardTitle's size ---------------------------------------------------------

// Decision 135 (28 Oct): Button gets a subtle variant with a token tier of its
// own, and the form panel's tinted header is CardHeader's subtle tone, a 52
// strip with a 14 title (decision 139); CardTitle gets a size (decision 132).
// Each painter binds the new tier, draws the strip in theme 0 inside the
// card's corners, and sets each title size in its own style and tokens.
// Guarded, so a run against the old painter fails here and goes on.
section("Button subtle, CardHeader subtle and CardTitle size");
{
  const SUBTLE = "Subtle Buttons/themed/button";
  const tokens = payloadVariables([...variableByName.keys()]);
  const context = plugin.createVariableContext(
    tokens.collections,
    tokens.variables,
  );
  const toHex = (color) =>
    color
      ? `#${[color.r, color.g, color.b]
          .map((channel) =>
            Math.round(channel * 255)
              .toString(16)
              .padStart(2, "0")
              .toUpperCase(),
          )
          .join("")}`
      : null;
  const reads = (paint) =>
    paint
      ? `${boundVariableName(paint)} ${toHex(plugin.solidPaintToRgba(paint, context, "Light"))}/${toHex(plugin.solidPaintToRgba(paint, context, "Dark"))}`
      : "no paint";

  const buttonAxes = plugin.expectedVariantAxesForComponentSetName("Button");
  const iconAxes = plugin.expectedVariantAxesForComponentSetName("IconButton");
  ok(
    buttonAxes?.Variant?.includes("Subtle") &&
      !iconAxes?.Variant?.includes("Subtle"),
    `Button's Variant has Subtle; IconButton's does not (${JSON.stringify(buttonAxes?.Variant)}; ${JSON.stringify(iconAxes?.Variant)})`,
  );
  for (const state of ["Default", "Loading"]) {
    const config = plugin.buttonConfig("Subtle", state);
    ok(
      config.background === `${SUBTLE}/background/idle` &&
        config.foreground === `${SUBTLE}/foreground/content/idle` &&
        !config.stroke,
      `Button, Subtle, ${state}: the Subtle Buttons idle tokens (${config.background}, ${config.foreground})`,
    );
  }
  // Disabled is the filled Buttons' disabled pair, the same in every tier.
  const disabled = plugin.buttonConfig("Subtle", "Disabled");
  ok(
    disabled.background ===
      "Primary Buttons/themed/button/background/disabled" &&
      disabled.foreground ===
        "Primary Buttons/themed/button/foreground/content/disabled",
    `Button, Subtle, Disabled: the filled Buttons' disabled pair (${disabled.background}, ${disabled.foreground})`,
  );
  let subtle = null;
  try {
    subtle = await plugin.createButtonVariant({
      variant: "Subtle",
      size: "Default",
      state: "Default",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      textStyle: null,
      stats: freshStats(),
    });
  } catch {
    // An old painter has no Subtle and may throw: the asserts below say so.
    subtle = null;
  }
  const subtleLabel = subtle && named(subtle, "Label Text");
  ok(
    subtle &&
      reads(subtle.fills[0]) === `${SUBTLE}/background/idle #F1F5FE/#051C4F`,
    `Button, Subtle: theme 0, #F1F5FE in Light and #051C4F in Dark (${subtle && reads(subtle.fills[0])})`,
  );
  ok(
    subtleLabel &&
      reads(subtleLabel.fills[0]) ===
        `${SUBTLE}/foreground/content/idle #1051E8/#5887F3`,
    `Button, Subtle: its words theme 600, #1051E8 in Light and #5887F3 in Dark (${subtleLabel && reads(subtleLabel.fills[0])})`,
  );

  // Card: the axes, the strip and the title sizes.
  const cardAxes = plugin.expectedVariantAxesForComponentSetName("Card");
  ok(
    JSON.stringify(cardAxes?.HeaderTone) ===
      JSON.stringify(["Default", "Subtle"]) &&
      JSON.stringify(cardAxes?.TitleSize) ===
        JSON.stringify(["Large", "Medium", "Small"]),
    `Card expects a HeaderTone and a TitleSize (${JSON.stringify(cardAxes?.HeaderTone)}; ${JSON.stringify(cardAxes?.TitleSize)})`,
  );
  const combos =
    typeof plugin.generatedVariantCombinations === "function" &&
    typeof plugin.cardHasCombination === "function"
      ? plugin.generatedVariantCombinations({
          values: plugin.CARD_CONTENT,
          axis2Values: plugin.CARD_SECONDS,
          hasCombination: plugin.cardHasCombination,
        })
      : [];
  ok(
    combos.length === 18,
    `the set is 18 cards: Basic in each padding, and Header and Full in each padding with the three title sizes and the strip (${combos.length})`,
  );
  const paintCard = async (value, second) => {
    const component = figma.createComponent();
    try {
      await plugin.updateCardVariant(component, {
        value,
        second,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
    } catch {
      return null;
    }
    return component;
  };
  const strip = await paintCard("Header", "Compact|Subtle|Small");
  const stripHeader = strip && named(strip, "Card Header");
  const stripTitle = strip && named(strip, "Title Text");
  const stripBody = strip && named(strip, "Card Content");
  ok(
    strip?.name ===
      "Content=Header, Padding=Compact, HeaderTone=Subtle, TitleSize=Small",
    `the strip's variant is named for its axes (${strip?.name})`,
  );
  ok(
    stripHeader &&
      reads(stripHeader.fills[0]) === "Colors/theme/0 #F1F5FE/#051C4F",
    `the strip is theme 0, #F1F5FE in Light and #051C4F in Dark (${stripHeader && reads(stripHeader.fills[0])})`,
  );
  ok(
    stripHeader &&
      stripHeader.paddingTop === 12 &&
      stripHeader.paddingBottom === 12 &&
      stripHeader.paddingLeft === 16 &&
      stripHeader.topLeftRadius === 20 &&
      stripHeader.topRightRadius === 20 &&
      stripHeader.counterAxisAlignItems === "CENTER",
    `12 above and below its words, the card's 16 at its sides, the card's 20 at its top corners, centred (${stripHeader && [stripHeader.paddingTop, stripHeader.paddingBottom, stripHeader.paddingLeft, stripHeader.topLeftRadius, stripHeader.topRightRadius, stripHeader.counterAxisAlignItems].join(", ")})`,
  );
  ok(
    stripBody && stripBody.paddingTop === 16,
    `the content under the strip keeps the card's padding above it (${stripBody?.paddingTop})`,
  );
  ok(
    stripTitle && stripTitle.fontSize === 14,
    `the strip's title is 14, its Small size (${stripTitle?.fontSize})`,
  );
  for (const [size, want] of [
    ["Large", 24],
    ["Medium", 18],
    ["Small", 14],
  ]) {
    const sized = await paintCard("Header", `Default|Default|${size}`);
    const title = sized && named(sized, "Title Text");
    const header = sized && named(sized, "Card Header");
    const actions = header && named(header, "Header Actions");
    ok(
      title?.fontSize === want &&
        title?.lineHeight?.value === want &&
        actions?.height === want &&
        header?.fills?.length === 0,
      `TitleSize=${size}: a ${want} title on a ${want} line, its actions centred on it, on the card's own surface (${title?.fontSize}/${title?.lineHeight?.value}, actions ${actions?.height})`,
    );
  }
}

// --- EmptyState's size, Container's inset, POIResultCard's appearance ----------------

section("The rest of the batch");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const paint = async (painter, value, second) => {
    const component = figma.createComponent();
    await plugin[painter](component, {
      value,
      second,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  };
  const axis = (set, name) => {
    const axes = plugin.expectedVariantAxesForComponentSetName(set);
    return axes && axes[name];
  };

  // EmptyState
  ok(
    JSON.stringify(axis("EmptyState", "Size")) ===
      JSON.stringify(["Default", "Compact"]),
    `EmptyState expects a Size (got ${JSON.stringify(axis("EmptyState", "Size"))})`,
  );
  const esFull = await paint("updateEmptyStateVariant", "Icon", "Default");
  const esCompact = await paint("updateEmptyStateVariant", "Icon", "Compact");
  ok(
    esFull.name === "Content=Icon, Size=Default",
    `EmptyState carries both axes (got "${esFull.name}")`,
  );
  ok(
    esFull.paddingTop === 32 && esCompact.paddingTop === 16,
    `32 by default, 16 compact (got ${esFull.paddingTop} and ${esCompact.paddingTop})`,
  );
  ok(
    named(esFull, "Icon Container").width === 64 &&
      named(esCompact, "Icon Container").width === 40,
    "and the icon box shrinks with it",
  );
  ok(
    JSON.stringify(plugin.parseEmptyStateVariantName("Content=Icon")) ===
      JSON.stringify({ value: "Icon", second: "Default" }),
    "EmptyState: no Size reads as Default, so Update renames rather than replaces",
  );

  // Container
  ok(
    JSON.stringify(axis("Container", "Inset")) ===
      JSON.stringify(["Window", "Panel"]),
    `Container expects an Inset (got ${JSON.stringify(axis("Container", "Inset"))})`,
  );
  const ctWindow = await paint("updateContainerVariant", "True", "Window");
  const ctPanel = await paint("updateContainerVariant", "True", "Panel");
  ok(
    ctWindow.name === "Centered=True, Inset=Window",
    `Container carries both axes (got "${ctWindow.name}")`,
  );
  ok(
    ctWindow.paddingLeft === 24 && ctPanel.paddingLeft === 16,
    `the window's widest step against the panel's fixed 16 (got ${ctWindow.paddingLeft} and ${ctPanel.paddingLeft})`,
  );
  ok(
    JSON.stringify(plugin.parseContainerVariantName("Centered=True")) ===
      JSON.stringify({ value: "True", second: "Window", centered: "True" }),
    "Container: no Inset reads as Window",
  );

  // POIResultCard
  ok(
    JSON.stringify(axis("POIResultCard", "Appearance")) ===
      JSON.stringify(["Card", "Row"]),
    `POIResultCard expects an Appearance (got ${JSON.stringify(axis("POIResultCard", "Appearance"))})`,
  );
  const asCard = await paint("updatePOIResultCardVariant", "Selected", "Card");
  const asRow = await paint("updatePOIResultCardVariant", "Selected", "Row");
  ok(
    asCard.name === "State=Selected, Appearance=Card",
    `POIResultCard carries both axes (got "${asCard.name}")`,
  );
  // A row sits in a list that already draws the edges, so it has none of its
  // own and states its selection with the fill instead.
  ok(
    asCard.strokes.length === 1 && asRow.strokes.length === 0,
    "a card has a border and a row has none",
  );
  ok(
    asCard.cornerRadius === plugin.KOZMOS_RADIUS.container &&
      asRow.cornerRadius === plugin.KOZMOS_RADIUS.none,
    "a card is rounded and a row is not",
  );
  const featuredRow = await paint(
    "updatePOIResultCardVariant",
    "Featured",
    "Row",
  );
  const featuredCard = await paint(
    "updatePOIResultCardVariant",
    "Featured",
    "Card",
  );
  ok(
    featuredCard.findOne((n) => /Featured|Tab/.test(n.name || "")) !== null &&
      featuredRow.findOne((n) => /Featured|Tab/.test(n.name || "")) === null,
    "the tab hangs from a card's edge, and a row has no edge to hang it from",
  );
  ok(
    JSON.stringify(plugin.parsePOIResultCardVariantName("State=Selected")) ===
      JSON.stringify({ value: "Selected", second: "Card" }),
    "POIResultCard: no Appearance reads as Card",
  );
}

// --- Tabs: React's raised segment (decision 65) ---------------------------------

section("Decision 65: Tabs draw React's raised segment");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const context = plugin.createVariableContext(
    tokens.collections,
    tokens.variables,
  );
  const toHex = (color) =>
    color
      ? `#${[color.r, color.g, color.b]
          .map((channel) =>
            Math.round(channel * 255)
              .toString(16)
              .padStart(2, "0")
              .toUpperCase(),
          )
          .join("")}`
      : null;
  // "<variable> <light>/<dark>": what a paint binds, and what it draws in
  // each mode.
  const reads = (paint) =>
    paint
      ? `${boundVariableName(paint)} ${toHex(plugin.solidPaintToRgba(paint, context, "Light"))}/${toHex(plugin.solidPaintToRgba(paint, context, "Dark"))}`
      : "no paint";
  const tabs = async (count, active, state) => {
    const component = figma.createComponent();
    await plugin.updateTabsVariant(component, {
      count,
      active,
      state,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  };
  const raised = JSON.stringify([plugin.elevationEffect("raised")]);
  const shadowOf = (node) => JSON.stringify((node && node.effects) || []);
  // Every colour a variant binds, fills and strokes, on every node in it.
  const boundColours = (component) =>
    [component]
      .concat(component.findAll(() => true))
      .flatMap((node) =>
        [].concat(node.fills || [], node.strokes || []).map(boundVariableName),
      )
      .filter(Boolean);

  const two = await tabs("Two", "One", "Default");
  ok(
    reads(two.fills[0]) === "Colors/background/100 #E3E4E8/#17191C",
    `the list is the background/100 track (${reads(two.fills[0])})`,
  );
  const first = named(two, "Tab 1 Trigger");
  const second = named(two, "Tab 2 Trigger");
  ok(
    first && reads(first.fills[0]) === "Colors/background/0 #FFFFFF/#000000",
    `the active tab is a background/0 segment (${first && reads(first.fills[0])})`,
  );
  ok(
    shadowOf(first) === raised,
    `and it is raised, as React's shadow-raised (${shadowOf(first)})`,
  );
  ok(
    reads(named(two, "Tab 1 Text").fills[0]) ===
      "Colors/foreground/0 #000000/#FFFFFF",
    `its words are foreground/0 (${reads(named(two, "Tab 1 Text").fills[0])})`,
  );
  ok(
    second && second.fills.length === 0 && shadowOf(second) === "[]",
    `an inactive tab draws no segment and casts nothing (${second && second.fills.length} fills, ${shadowOf(second)})`,
  );
  ok(
    reads(named(two, "Tab 2 Text").fills[0]) ===
      "Colors/foreground/400 #5D626F/#A29D90",
    `its words are foreground/400 (${reads(named(two, "Tab 2 Text").fills[0])})`,
  );
  ok(
    boundColours(two).every((name) => !/^Colors\/theme\//.test(name)),
    `nothing at rest is the theme's colour (${boundColours(two).join(", ")})`,
  );

  // Focused, the ring is theme 600 as React's ring, and the segment follows
  // the active tab, not the first.
  const focused = await tabs("Three", "Two", "Focus");
  ok(
    shadowOf(named(focused, "Tab 2 Trigger")) === raised &&
      shadowOf(named(focused, "Tab 1 Trigger")) === "[]" &&
      shadowOf(named(focused, "Tab 3 Trigger")) === "[]",
    "focused, only the active tab is raised",
  );
  ok(
    boundColours(focused).every(
      (name) => !/^Colors\/theme\//.test(name) || name === "Colors/theme/600",
    ) && boundColours(focused).indexOf("Colors/theme/500") === -1,
    `focused, the only theme colour is the ring's 600 (${boundColours(focused).join(", ")})`,
  );
}

section("Decisions 115 and 26: the list rows draw React's rows");
{
  // Figma comes from the developed components: Combobox's, MultiSelect's,
  // TimePicker's and the standalone Listbox's rows are #372's .kozmos-option.
  // 44 tall, the Button's default height (40 at compact density, decision
  // 82; Figma has no Density modes yet, GAP-146), 12 at the sides, the Marker
  // corner, 2 between rows (the standalone Listbox 4), the words 14/20
  // regular in full ink; the active row background/50, the chosen row
  // background/100 with its check at the end in theme 600; and, reached by
  // the keyboard (State=Focus), the active row's 2px inset theme-600 ring.
  // A bound property shows its variable's value, not the painter's write, so
  // every size is read through its binding.
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const payload = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "docs/figma-foundations-payload.json"),
      "utf8",
    ),
  );
  const payloadValue = new Map(
    payload.variables.map((variable) => [
      variable.figmaName,
      variable.values.light,
    ]),
  );
  const byCanonical = new Map(
    payload.variables.map((variable) => [
      variable.canonicalName,
      variable.figmaName,
    ]),
  );
  // A float variable's value and the names its aliases pass through.
  const resolve = (name, chain = []) => {
    if (!name || chain.length > 8) return { value: undefined, chain };
    const token = floats.get(name);
    if (token)
      return token.alias
        ? resolve(token.alias, chain.concat(name))
        : { value: token.value, chain: chain.concat(name) };
    const value = payloadValue.get(name);
    if (value && value.kind === "alias")
      return resolve(byCanonical.get(value.path), chain.concat(name));
    return { value: value && value.value, chain: chain.concat(name) };
  };
  const boundName = (node, field) => {
    const alias = node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  // What Figma shows for a size: its variable's value when bound.
  const shown = (node, field) => {
    const name = boundName(node, field);
    return name ? resolve(name).value : node[field];
  };
  // A text's size and leading, through their bindings when bound.
  const type = (text) => {
    const leading = shown(text, "lineHeight");
    return `${shown(text, "fontSize")}/${typeof leading === "number" ? leading : leading && leading.value}`;
  };
  const tokens = payloadVariables(
    [...floats.keys()].concat([...variableByName.keys()]),
  );
  const draw = async (fn, props) => {
    const component = figma.createComponent();
    await plugin[fn](component, {
      ...props,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  };
  const colours = (node) =>
    [node]
      .concat(node.findAll ? node.findAll(() => true) : [])
      .flatMap((n) => [].concat(n.fills || [], n.strokes || []))
      .map(boundVariableName)
      .filter(Boolean);
  const fill = (node) =>
    node.fills && node.fills.length ? boundVariableName(node.fills[0]) : null;

  const parts = [
    {
      name: "Combobox",
      fn: "updateComboboxVariant",
      props: (state) => ({ state, status: "Default", content: "Open" }),
      list: "Combobox Listbox",
      row: 44,
      gap: 2,
    },
    {
      name: "MultiSelect",
      fn: "updateMultiSelectVariant",
      props: (state) => ({ state, status: "Default", content: "Open" }),
      list: "MultiSelect Listbox",
      row: 44,
      gap: 2,
    },
    {
      name: "TimePicker",
      fn: "updateTimePickerVariant",
      props: (state) => ({ state, status: "Default", content: "Open" }),
      list: "TimePicker Listbox",
      row: 44,
      gap: 2,
    },
    {
      // The standalone Listbox draws a description under each label: 8 +
      // 20 + 16 + 8, as React's row measures with one, at either density.
      name: "Listbox",
      fn: "updateListboxVariant",
      props: (state) => ({ selection: "Single", state }),
      list: null,
      row: 52,
      gap: 4,
      restingActive: 0,
    },
  ];
  for (const part of parts) {
    const heights = {};
    for (const state of ["Default", "Focus"]) {
      const label = `${part.name} ${state}`;
      const component = await draw(part.fn, part.props(state));
      const list = part.list ? named(component, part.list) : component;
      const rows = component.findAll(
        (node) => node.type === "FRAME" && / Option \d+$/.test(node.name),
      );
      ok(list && rows.length >= 3, `${label}: the list and its rows`);
      if (!list || rows.length < 3) continue;
      ok(
        shown(list, "itemSpacing") === part.gap,
        `${label}: ${part.gap} between rows (${boundName(list, "itemSpacing")} = ${shown(list, "itemSpacing")})`,
      );
      heights[state] = rows.map((row) => shown(row, "height"));
      for (const row of rows) {
        const at = `${label}, ${row.name}`;
        ok(
          shown(row, "height") === part.row,
          `${at}: ${part.row} tall (${boundName(row, "height")} = ${shown(row, "height")}; the painter writes ${row.height})`,
        );
        if (part.row === 44)
          ok(
            resolve(boundName(row, "height")).chain.indexOf(
              "Button/height/default",
            ) !== -1,
            `${at}: the height is the Button's default, so compact draws 40 (${resolve(boundName(row, "height")).chain.join(" > ")})`,
          );
        ok(
          shown(row, "paddingLeft") === 12 && shown(row, "paddingRight") === 12,
          `${at}: 12 at the sides (${shown(row, "paddingLeft")}/${shown(row, "paddingRight")})`,
        );
        ok(
          shown(row, "cornerRadius") === 4,
          `${at}: the Marker corner, 4 (${shown(row, "cornerRadius")})`,
        );
        const words = row.findOne(
          (node) => node.type === "TEXT" && / Text$/.test(node.name),
        );
        ok(
          words &&
            type(words) === "14/20" &&
            words.fontName.style === "Regular" &&
            fill(words) === "Colors/foreground/0",
          `${at}: the words 14/20 regular in foreground/0 (${words && `${type(words)} ${words.fontName.style} ${fill(words)}`})`,
        );
        const description = row.findOne(
          (node) => node.type === "TEXT" && / Description$/.test(node.name),
        );
        if (description)
          ok(
            type(description) === "12/16" &&
              description.fontName.style === "Regular" &&
              fill(description) === "Colors/foreground/400",
            `${at}: the description 12/16 regular in foreground/400 (${type(description)} ${description.fontName.style} ${fill(description)})`,
          );
        if (part.name === "Listbox")
          ok(
            shown(row, "paddingTop") === 8 && shown(row, "paddingBottom") === 8,
            `${at}: 8 above and below (${shown(row, "paddingTop")}/${shown(row, "paddingBottom")})`,
          );
      }
      const chosen = rows.filter((row) => named(row, "Icon"));
      ok(chosen.length >= 1, `${label}: a chosen row`);
      for (const row of chosen) {
        ok(
          fill(row) === "Colors/background/100",
          `${label}, ${row.name}: chosen, background/100 (${fill(row)})`,
        );
        const icon = named(row, "Icon");
        ok(
          row.children[row.children.length - 1] === icon &&
            row.primaryAxisAlignItems === "SPACE_BETWEEN",
          `${label}, ${row.name}: the check ends the row`,
        );
        ok(
          colours(icon).indexOf("Colors/theme/600") !== -1,
          `${label}, ${row.name}: the check is theme 600 (${colours(icon).join(", ")})`,
        );
      }
      const active = rows.filter((row) => fill(row) === "Colors/background/50");
      const wantActive =
        state === "Default" && part.restingActive !== undefined
          ? part.restingActive
          : 1;
      ok(
        active.length === wantActive &&
          active.every((row) => !named(row, "Icon")),
        `${label}: ${wantActive} active row on background/50 (${active.map((row) => row.name).join(", ") || "none"})`,
      );
      const ringed = rows.filter((row) => (row.strokes || []).length > 0);
      if (state === "Default")
        ok(
          ringed.length === 0,
          `${label}: under the pointer no row is ringed (${ringed.map((row) => row.name).join(", ") || "none"})`,
        );
      else {
        const ring = active[0];
        ok(
          ring &&
            ringed.length === 1 &&
            ringed[0] === ring &&
            ring.strokes.length === 1 &&
            boundVariableName(ring.strokes[0]) === "Colors/theme/600" &&
            ring.strokeAlign === "INSIDE" &&
            shown(ring, "strokeWeight") === 2 &&
            boundName(ring, "strokeWeight") === "Border Width/md",
          `${label}: reached by the keyboard, the active row draws a 2px inset theme-600 ring, the Focused row (${ring ? `${(ring.strokes || []).map(boundVariableName).join(",") || "no stroke"} ${ring.strokeAlign} ${shown(ring, "strokeWeight")} ${boundName(ring, "strokeWeight")}` : "no active row"}; ringed: ${ringed.map((row) => row.name).join(", ") || "none"})`,
        );
        ok(
          !ring || ring.strokesIncludedInLayout !== true,
          `${label}: the ring is no part of the layout`,
        );
      }
    }
    ok(
      JSON.stringify(heights.Focus) === JSON.stringify(heights.Default),
      `${part.name}: the ring moves nothing (${JSON.stringify(heights.Default)} / ${JSON.stringify(heights.Focus)})`,
    );
  }
}

section("GAP-192: the option lists draw their groups' labels");
{
  // Combobox's, MultiSelect's and Listbox's lists draw a label row before
  // option 1 (Group 1, options 1 and 2) and before option 3 (Group 2), as
  // React's .kozmos-option-group-label draws it, SelectLabel's: 14/20
  // semibold in foreground/0, 12 at the sides through the rows' padding
  // variable, 6 above and below, 32 tall. Hidden until the set's Show Group
  // Labels boolean, off by default, so the lists draw as before; Group 1 Text
  // and Group 2 Text name them, and an Update keeps their words.
  const tokens = payloadVariables(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => token.name).concat([
      ...variableByName.keys(),
    ]),
  );
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const valueOf = (name) => {
    for (let hops = 0; name && hops < 8; hops += 1) {
      const token = floats.get(name);
      if (!token) return undefined;
      if (!token.alias || !floats.has(token.alias)) return token.value;
      name = token.alias;
    }
    return undefined;
  };
  const boundName = (node, field) => {
    const alias = node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  const shown = (node, field) =>
    boundName(node, field) ? valueOf(boundName(node, field)) : node[field];
  const draw = async (fn, props, component = figma.createComponent()) => {
    await plugin[fn](
      component,
      Object.assign({}, props, {
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    return component;
  };
  const parts = [
    {
      name: "Combobox",
      fn: "updateComboboxVariant",
      configure: "configureComboboxProperties",
      props: { state: "Default", status: "Default", content: "Open" },
      list: "Combobox Listbox",
    },
    {
      name: "MultiSelect",
      fn: "updateMultiSelectVariant",
      configure: "configureMultiSelectProperties",
      props: { state: "Default", status: "Default", content: "Open" },
      list: "MultiSelect Listbox",
    },
    {
      name: "Listbox",
      fn: "updateListboxVariant",
      configure: "configureListboxProperties",
      props: { selection: "Single", state: "Default" },
      list: null,
    },
  ];
  for (const part of parts) {
    const component = await draw(part.fn, part.props);
    const list = part.list ? named(component, part.list) : component;
    const order = (list ? list.children : [])
      .map((child) => child.name)
      .filter((name) => /^Group \d Label$| Option \d+$/.test(name));
    ok(
      JSON.stringify(order) ===
        JSON.stringify([
          "Group 1 Label",
          `${part.name} Option 1`,
          `${part.name} Option 2`,
          "Group 2 Label",
          `${part.name} Option 3`,
        ]),
      `${part.name}: Group 1 heads options 1 and 2, Group 2 option 3 (${order.join(", ")})`,
    );
    const words = { "Group 1": "Transit", "Group 2": "Cycling" };
    for (const group of ["Group 1", "Group 2"]) {
      const row = list && named(list, `${group} Label`);
      const at = `${part.name}, ${group}`;
      ok(row && row.type === "FRAME", `${at}: a label row`);
      if (!row) continue;
      ok(row.visible === false, `${at}: hidden until Show Group Labels`);
      ok(
        row.getSharedPluginData(plugin.RUN_NAMESPACE, "kind") ===
          "option-group-label",
        `${at}: marked as a group label`,
      );
      ok(
        shown(row, "paddingLeft") === 12 &&
          shown(row, "paddingRight") === 12 &&
          boundName(row, "paddingLeft") === `${part.name}/option/padding/x`,
        `${at}: 12 at the sides, the rows' padding (${boundName(row, "paddingLeft")} = ${shown(row, "paddingLeft")})`,
      );
      ok(
        row.paddingTop === 6 && row.paddingBottom === 6 && row.height === 32,
        `${at}: 6 above and below, 32 tall (${row.paddingTop}/${row.paddingBottom}, ${row.height})`,
      );
      ok(
        (row.fills || []).length === 0 && (row.strokes || []).length === 0,
        `${at}: no fill or stroke, as SelectLabel`,
      );
      ok(
        row.layoutSizingHorizontal === "FILL",
        `${at}: as wide as the list (${row.layoutSizingHorizontal})`,
      );
      const text = named(row, `${group} Text`);
      ok(
        text &&
          text.type === "TEXT" &&
          text.fontSize === 14 &&
          text.lineHeight &&
          text.lineHeight.value === 20 &&
          text.fontName.style ===
            plugin.textFontForWeight("Semibold", FONTS).style &&
          boundVariableName(text.fills[0]) === "Colors/foreground/0",
        `${at}: the words 14/20 semibold in foreground/0 (${text && `${text.fontSize}/${text.lineHeight && text.lineHeight.value} ${text.fontName.style} ${boundVariableName(text.fills[0])}`})`,
      );
      ok(
        text && text.characters === words[group],
        `${at}: "${words[group]}" by default (${text && text.characters})`,
      );
    }

    // An Update keeps a label's words, as it keeps an option's.
    const kept = list && named(list, "Group 1 Text");
    if (kept) {
      kept.characters = "Interior Asset";
      const redrawn = await draw(part.fn, part.props, component);
      const again =
        (part.list ? named(redrawn, part.list) : redrawn) || redrawn;
      const text = named(again, "Group 1 Text");
      ok(
        text && text.characters === "Interior Asset",
        `${part.name}: an Update keeps Group 1's words (${text && text.characters})`,
      );
    }

    // The set's properties: Show Group Labels drives both rows, and each
    // label's words are a text property.
    const variants = [await draw(part.fn, part.props)];
    const set = figma.combineAsVariants(variants, figma.currentPage);
    set.name = part.name;
    await plugin[part.configure](set, freshStats());
    const definitions = set.componentPropertyDefinitions;
    const byBase = (base, type) =>
      Object.keys(definitions).find(
        (key) => key.split("#")[0] === base && definitions[key].type === type,
      );
    const show = byBase("Show Group Labels", "BOOLEAN");
    ok(
      show && definitions[show].defaultValue === false,
      `${part.name}: a Show Group Labels boolean, off by default`,
    );
    for (const [group, word] of [
      ["Group 1", "Transit"],
      ["Group 2", "Cycling"],
    ]) {
      const textProperty = byBase(`${group} Text`, "TEXT");
      ok(
        textProperty && definitions[textProperty].defaultValue === word,
        `${part.name}: a ${group} Text property, "${word}" by default`,
      );
      const row = named(variants[0], `${group} Label`);
      ok(
        row &&
          row.componentPropertyReferences &&
          row.componentPropertyReferences.visible === show,
        `${part.name}: ${group}'s row shows with Show Group Labels`,
      );
      const text = row && named(row, `${group} Text`);
      ok(
        text &&
          text.componentPropertyReferences &&
          text.componentPropertyReferences.characters === textProperty,
        `${part.name}: ${group}'s words are ${group} Text`,
      );
    }
    set.remove();
  }
}

section(
  "Since #397: Combobox's and MultiSelect's field actions are React's buttons",
);
{
  // React draws the clear and open at the field's end as buttons
  // (field-actions.ts): each as tall and wide as the field, 44 at touch (40
  // compact once Figma has density modes: bound to the field's height), the
  // 16px icon centred, out of the field's line, inside its border, the open
  // button last; the field keeps the room at its end. Combobox draws a clear
  // as MultiSelect does, with a value and not disabled or read only, and
  // keeps its leading search icon, which React does not draw.
  const tokens = payloadVariables(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => token.name).concat([
      ...variableByName.keys(),
    ]),
  );
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const valueOf = (name) => {
    for (let hops = 0; name && hops < 8; hops += 1) {
      const token = floats.get(name);
      if (!token) return undefined;
      if (!token.alias || !floats.has(token.alias)) return token.value;
      name = token.alias;
    }
    return undefined;
  };
  const boundName = (node, field) => {
    const alias = node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  const shown = (node, field) =>
    boundName(node, field) ? valueOf(boundName(node, field)) : node[field];
  const cases = [
    [
      "Combobox",
      "updateComboboxVariant",
      "Combobox/field/height",
      { state: "Default", status: "Default", content: "Closed" },
      ["Open Button"],
    ],
    [
      "Combobox",
      "updateComboboxVariant",
      "Combobox/field/height",
      { state: "Focus", status: "Default", content: "Open" },
      ["Clear Button", "Open Button"],
    ],
    [
      "Combobox",
      "updateComboboxVariant",
      "Combobox/field/height",
      { state: "Disabled", status: "Default", content: "Open" },
      ["Open Button"],
    ],
    [
      "Combobox",
      "updateComboboxVariant",
      "Combobox/field/height",
      { state: "Readonly", status: "Default", content: "Open" },
      ["Open Button"],
    ],
    [
      "MultiSelect",
      "updateMultiSelectVariant",
      "MultiSelect/field/min-height",
      { state: "Default", status: "Default", content: "Empty" },
      ["Open Button"],
    ],
    [
      "MultiSelect",
      "updateMultiSelectVariant",
      "MultiSelect/field/min-height",
      { state: "Default", status: "Default", content: "Selected" },
      ["Clear Button", "Open Button"],
    ],
    [
      "MultiSelect",
      "updateMultiSelectVariant",
      "MultiSelect/field/min-height",
      { state: "Disabled", status: "Default", content: "Selected" },
      ["Open Button"],
    ],
  ];
  for (const [part, fn, sizeToken, props, expected] of cases) {
    const label = `${part} ${props.state}/${props.content}`;
    const component = figma.createComponent();
    await plugin[fn](
      component,
      Object.assign({}, props, {
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    const field = named(component, `${part} Field`);
    const row = field && named(field, "Field Actions");
    ok(row, `${label}: the field draws its actions`);
    if (!row) continue;
    ok(
      row.layoutPositioning === "ABSOLUTE" &&
        row.constraints &&
        row.constraints.horizontal === "MAX",
      `${label}: out of the field's line, held at its end (${row.layoutPositioning}, ${row.constraints && row.constraints.horizontal})`,
    );
    ok(
      Math.abs(row.x + row.width - field.width) <= 0.5 && row.y >= 0,
      `${label}: at the field's end, inside it (x ${row.x} + ${row.width} of ${field.width})`,
    );
    const buttons = row.children.filter((child) => child.type === "FRAME");
    ok(
      JSON.stringify(buttons.map((button) => button.name)) ===
        JSON.stringify(expected),
      `${label}: ${expected.join(", ")} (${buttons.map((button) => button.name).join(", ")})`,
    );
    for (const button of buttons) {
      ok(
        boundName(button, "width") === sizeToken &&
          boundName(button, "height") === sizeToken &&
          shown(button, "width") === 44 &&
          shown(button, "height") === 44,
        `${label}, ${button.name}: as tall and wide as the field, 44, bound to ${sizeToken} (${boundName(button, "width")} ${shown(button, "width")}x${shown(button, "height")})`,
      );
      ok(
        button.primaryAxisAlignItems === "CENTER" &&
          button.counterAxisAlignItems === "CENTER" &&
          (button.fills || []).length === 0 &&
          (button.strokes || []).length === 0,
        `${label}, ${button.name}: the icon centred, on no fill`,
      );
      const icons = button.children.filter(
        (child) => child.type === "INSTANCE",
      );
      ok(
        icons.length === 1 && icons[0].width === 16 && icons[0].height === 16,
        `${label}, ${button.name}: one 16px icon (${icons.map((icon) => `${icon.width}x${icon.height}`).join(", ")})`,
      );
    }
    const room = expected.length === 2 ? 96 : 48;
    ok(
      field.paddingRight === room && !boundName(field, "paddingRight"),
      `${label}: the field keeps ${room} at its end for them (${field.paddingRight}, bound ${boundName(field, "paddingRight")})`,
    );
    ok(
      !field.children.some(
        (child) =>
          child.type === "INSTANCE" &&
          child !== field.children[0] &&
          /chevron|close/i.test(child.name),
      ),
      `${label}: no bare icon left in the field's line`,
    );
    if (part === "Combobox")
      ok(
        field.children[0] && field.children[0].type === "INSTANCE",
        `${label}: the leading search icon is kept`,
      );
  }
}

// --- GAP-196, GAP-199, GAP-201: the shells and the tree rows take React's layout props ---

// The harness lays nothing out, so these measure one auto-layout frame the way
// Figma lays it out: the padding, the gaps, and the room left over handed to
// the child that fills; and where a frame packs its own items. Hidden and
// absolute children take no room.
function flowOf(frame) {
  return (frame.children || []).filter(
    (child) =>
      child.visible !== false && child.layoutPositioning !== "ABSOLUTE",
  );
}
function layOutAxis(frame, axis) {
  const horizontal = axis === "x";
  const size = (node) => (horizontal ? node.width : node.height);
  const fills = (node) =>
    node.layoutGrow === 1 ||
    (horizontal ? node.layoutSizingHorizontal : node.layoutSizingVertical) ===
      "FILL";
  const flow = flowOf(frame);
  const lead = horizontal ? frame.paddingLeft : frame.paddingTop;
  const tail = horizontal ? frame.paddingRight : frame.paddingBottom;
  const fixed = flow
    .filter((child) => !fills(child))
    .reduce((sum, child) => sum + size(child), 0);
  const growing = flow.filter(fills).length;
  const room =
    size(frame) -
    lead -
    tail -
    fixed -
    frame.itemSpacing * Math.max(0, flow.length - 1);
  const boxes = new Map();
  let at = lead;
  for (const child of flow) {
    const length = fills(child) ? room / growing : size(child);
    boxes.set(child, { start: at, length, end: at + length });
    at += length + frame.itemSpacing;
  }
  return { flow, boxes };
}
function packedSpan(frame, length, axis) {
  const horizontal = axis === "x";
  const items = flowOf(frame);
  const content =
    items.reduce(
      (sum, item) => sum + (horizontal ? item.width : item.height),
      0,
    ) +
    frame.itemSpacing * Math.max(0, items.length - 1);
  const lead = horizontal ? frame.paddingLeft : frame.paddingTop;
  const tail = horizontal ? frame.paddingRight : frame.paddingBottom;
  const free = length - lead - tail - content;
  const offset = { MIN: 0, CENTER: free / 2, MAX: free }[
    frame.primaryAxisAlignItems
  ];
  const start = lead + (offset === undefined ? NaN : offset);
  return { start, end: start + content };
}
function overlapsIn(set) {
  const boxes = set.children.map((c) => [
    c.x,
    c.y,
    c.x + c.width,
    c.y + c.height,
    c.name,
  ]);
  const found = [];
  for (let i = 0; i < boxes.length; i += 1)
    for (let j = i + 1; j < boxes.length; j += 1) {
      const [a, b] = [boxes[i], boxes[j]];
      if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3])
        found.push(`${a[4]} / ${b[4]}`);
    }
  return found;
}
const topLeftOf = (set) =>
  set.children.slice().sort((a, b) => a.y - b.y || a.x - b.x)[0];

// Update, run over a set as it is in the file today: its variants named as
// they are there, each an empty component. The file's variables and fonts
// stand in as they do in the Stepper replay; what is measured is which nodes
// Update keeps, renames and adds, and what it declares.
async function replayUpdate(setName, oldNames, update, extraPages = []) {
  const livePage = new MockNode("PAGE", "Components");
  const liveSet = new MockNode("COMPONENT_SET", setName);
  const oldIds = {};
  for (const name of oldNames) {
    const variant = new MockNode("COMPONENT", name);
    liveSet.appendChild(variant);
    oldIds[name] = variant.id;
  }
  livePage.appendChild(liveSet);
  const setId = liveSet.id;
  const updatePlugin = loadPlugin({
    pluginPath: PLUGIN,
    figma: createFigmaMock({
      pages: [livePage].concat(
        extraPages.length ? extraPages : [new MockNode("PAGE", "Icons")],
      ),
    }),
    append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
  });
  const result = await updatePlugin[update]();
  const byId = new Map(liveSet.children.map((child) => [child.id, child]));
  return {
    result,
    liveSet,
    setId,
    kept: oldNames.map((name) => byId.get(oldIds[name])),
    names: liveSet.children.map((child) => child.name),
  };
}

// GAP-196: React's navigation grows into the room between the leading slots
// (logo, context, primary action) and the trailing ones (actions, utilities,
// account), and navigationAlign places its items there: centred (center, the
// default), packed after the leading slots (start) or before the trailing
// ones (end), a gap from them. Figma's Navigation Slot fills the same room and
// its alignment places the items. A variant named before the axis existed
// parses as Center, so Update renames it and keeps its node id.
section("Navbar's NavigationAlign (GAP-196)");
{
  const aligns = plugin.NAVBAR_NAVIGATION_ALIGN || [];
  const combinations = plugin.navbarVariantCombinations();
  ok(
    [...aligns].sort().join() === "Center,End,Start" && aligns[0] === "Center",
    `NavigationAlign is Start, Center and End, Center, React's default, first (${aligns.join(", ")})`,
  );
  const axes = plugin.expectedVariantAxesForComponentSetName("Navbar") || {};
  ok(
    aligns.length === 3 &&
      JSON.stringify(axes.NavigationAlign) === JSON.stringify(aligns) &&
      JSON.stringify(axes.Content) ===
        JSON.stringify(["Basic", "Actions", "Contextual"]),
    `the set declares Content and NavigationAlign (${Object.keys(axes).join(", ")})`,
  );
  const keys = new Set(combinations.map((c) => plugin.navbarVariantKey(c)));
  ok(
    combinations.length === 18 &&
      keys.size === 18 &&
      ["Basic", "Actions", "Contextual"].every((content) =>
        ["Start", "Center", "End"].every((navigationAlign) =>
          ["False", "True"].every((logoInset) =>
            combinations.some(
              (c) =>
                c.content === content &&
                c.navigationAlign === navigationAlign &&
                c.logoInset === logoInset,
            ),
          ),
        ),
      ),
    `each Content at each NavigationAlign, with and without LogoInset: 18 variants with 18 keys (${combinations.length}, ${keys.size} keys)`,
  );
  const parsed = [
    "Content=Basic",
    "Content=Actions, NavigationAlign=End",
    "Content=Product",
    "Content=Basic, NavigationAlign=Middle",
  ].map((name) => plugin.parseNavbarVariantName(name));
  ok(
    JSON.stringify(parsed) ===
      JSON.stringify([
        { content: "Basic", navigationAlign: "Center", logoInset: "False" },
        { content: "Actions", navigationAlign: "End", logoInset: "False" },
        {
          content: "Contextual",
          navigationAlign: "Center",
          logoInset: "False",
        },
        null,
      ]),
    `a variant from before the axis parses as Center, the legacy Product as Contextual, an unknown value as none (${JSON.stringify(parsed)})`,
  );

  const tokens = payloadVariables([...variableByName.keys()]);
  const drawn = [];
  for (const content of ["Basic", "Actions", "Contextual"]) {
    for (const navigationAlign of ["Start", "Center", "End"]) {
      const component = await plugin.createNavbarVariant({
        props: { content, navigationAlign, logoInset: "False" },
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      drawn.push(component);
      const at = `${content}, ${navigationAlign}`;
      const slot = named(component, "Navigation Slot");
      const { flow, boxes } = layOutAxis(component, "x");
      const index = slot ? flow.indexOf(slot) : -1;
      if (index < 1) {
        ok(false, `${at}: a Navigation Slot after the leading slots`);
        continue;
      }
      const box = boxes.get(slot);
      const after = flow[index + 1];
      const gap = component.itemSpacing;
      // The room React's navigation grows into: a gap after the leading
      // slots, to a gap before the trailing ones or the bar's end padding.
      const roomStart = boxes.get(flow[index - 1]).end + gap;
      const roomEnd = after
        ? boxes.get(after).start - gap
        : component.width - component.paddingRight;
      const span = packedSpan(slot, box.length, "x");
      const first = box.start + span.start;
      const last = box.start + span.end;
      const placed =
        navigationAlign === "Start"
          ? Math.abs(first - roomStart) < 0.01
          : navigationAlign === "End"
            ? Math.abs(roomEnd - last) < 0.01
            : first - roomStart > 1 &&
              Math.abs(first - roomStart - (roomEnd - last)) < 0.01;
      const said = {
        Start: `packed ${gap} after the leading slots`,
        Center: "centred between the leading and trailing slots",
        End: after
          ? `packed ${gap} before the trailing slots`
          : "packed at the bar's end",
      }[navigationAlign];
      ok(
        component.name ===
          `Content=${content}, NavigationAlign=${navigationAlign}, LogoInset=False` &&
          slot.layoutGrow === 1 &&
          slot.layoutSizingHorizontal === "FILL" &&
          Math.abs(box.start - roomStart) < 0.01 &&
          Math.abs(box.end - roomEnd) < 0.01 &&
          placed,
        `${at}: named by both axes, the slot fills the room (${box.start}–${box.end}) and its items are ${said} (items ${first}–${last}, room ${roomStart}–${roomEnd}, ${slot.primaryAxisAlignItems}; ${component.name})`,
      );
    }
  }

  for (const content of ["Basic", "Actions", "Contextual"])
    for (const navigationAlign of ["Start", "Center", "End"])
      drawn.push(
        await plugin.createNavbarVariant({
          props: { content, navigationAlign, logoInset: "True" },
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        }),
      );
  const set = new MockNode("COMPONENT_SET", "Navbar");
  for (const component of drawn) set.appendChild(component);
  plugin.layoutNavbarVariants(set);
  const overlaps = overlapsIn(set);
  const corner = topLeftOf(set);
  ok(
    overlaps.length === 0 &&
      corner.name === "Content=Basic, NavigationAlign=Center, LogoInset=False",
    `the laid-out set has no two variants overlapping, and its top-left, Figma's default, is Basic at Center without LogoInset (${corner.name}; ${overlaps.slice(0, 2).join("; ")})`,
  );

  // The three variants in the file today, named before the axis existed.
  const oldNames = ["Content=Basic", "Content=Actions", "Content=Contextual"];
  const replay = await replayUpdate(
    "Navbar",
    oldNames,
    "updateNavbarComponent",
  );
  ok(
    replay.result.updated === true &&
      replay.result.componentSetId === replay.setId &&
      replay.result.variantsUpdated === 3 &&
      replay.result.variantsCreated === 15 &&
      replay.result.variantsRemoved === 0 &&
      replay.liveSet.children.length === 18 &&
      new Set(replay.names).size === 18,
    `Update keeps the set and its 3 variants, and adds 15: 18 in all, each named once (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created, ${replay.result.variantsRemoved} removed)`,
  );
  ok(
    replay.kept.every(
      (variant, i) =>
        variant &&
        variant.name ===
          `${oldNames[i]}, NavigationAlign=Center, LogoInset=False`,
    ),
    `each of the 3 keeps its node id and is renamed NavigationAlign=Center, LogoInset=False (${replay.kept.map((v) => (v ? v.name : "gone")).join("; ")})`,
  );
  const contextual = replay.kept[2];
  const contextualSlot = contextual && named(contextual, "Navigation Slot");
  ok(
    contextualSlot && contextualSlot.primaryAxisAlignItems === "CENTER",
    `a renamed variant is repainted in place: Contextual now centres its navigation (${contextualSlot && contextualSlot.primaryAxisAlignItems})`,
  );
}

// GAP-208, decisions 147 and 150: React sets the logo in a column as wide as
// Sidebar's rail, from the bar's edge: a 96 box pulled 16 back. Figma's bar
// pads 16 too, so LogoInset is that padding at 0 and a Logo Slot fixed at the
// rail's own variable, the logo centred in it. The variable is the same node
// the rail's width is bound to, so the two can't part.
section("Navbar's LogoInset (GAP-208)");
{
  const insets = plugin.NAVBAR_LOGO_INSET || [];
  const axes = plugin.expectedVariantAxesForComponentSetName("Navbar") || {};
  ok(
    JSON.stringify(insets) === JSON.stringify(["False", "True"]) &&
      JSON.stringify(axes.LogoInset) === JSON.stringify(insets),
    `the set declares LogoInset, False, React's default, first (${Object.keys(axes).join(", ")}: ${insets.join(", ")})`,
  );
  const parsed = [
    "Content=Basic, NavigationAlign=End",
    "Content=Actions, NavigationAlign=Start, LogoInset=True",
    "Content=Basic, NavigationAlign=End, LogoInset=Maybe",
  ].map((name) => plugin.parseNavbarVariantName(name));
  ok(
    JSON.stringify(parsed) ===
      JSON.stringify([
        { content: "Basic", navigationAlign: "End", logoInset: "False" },
        { content: "Actions", navigationAlign: "Start", logoInset: "True" },
        null,
      ]),
    `a variant from before the axis parses as False, an unknown value as none (${JSON.stringify(parsed)})`,
  );

  const tokens = payloadVariables([
    ...variableByName.keys(),
    "Sidebar/width/rail",
    "Navbar/padding/x",
  ]);
  const railVariable = tokens.variableByName.get("Sidebar/width/rail");
  const padVariable = tokens.variableByName.get("Navbar/padding/x");
  const widthBound = (node, variable) =>
    variable &&
    node.boundVariables &&
    node.boundVariables.width &&
    node.boundVariables.width.id === variable.id;
  const rail = await plugin.createSidebarVariant({
    props: { content: "Rail", inset: "Flush" },
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  for (const content of ["Basic", "Actions", "Contextual"]) {
    const component = await plugin.createNavbarVariant({
      props: { content, navigationAlign: "End", logoInset: "True" },
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const logo = named(component, "Logo Slot");
    const { flow, boxes } = layOutAxis(component, "x");
    const box = logo && boxes.get(logo);
    const next = flow[flow.indexOf(logo) + 1];
    ok(
      logo &&
        component.name ===
          `Content=${content}, NavigationAlign=End, LogoInset=True` &&
        component.paddingLeft === 0 &&
        component.paddingRight === 16 &&
        !(component.boundVariables && component.boundVariables.paddingLeft) &&
        box.start === 0 &&
        box.end === rail.width &&
        rail.width === 96 &&
        logo.layoutSizingHorizontal === "FIXED" &&
        logo.primaryAxisAlignItems === "CENTER" &&
        widthBound(logo, railVariable) &&
        widthBound(rail, railVariable),
      `${content}: the Logo Slot is the rail: from the bar's edge, ${rail.width} wide by the rail's own variable, its logo centred (${box && box.start}–${box && box.end}, padding ${component.paddingLeft}, ${logo && logo.layoutSizingHorizontal}, ${logo && logo.primaryAxisAlignItems})`,
    );
    ok(
      next && boxes.get(next).start === rail.width + 16,
      `${content}: what follows starts 16 past the column, as React's gap (${next && boxes.get(next).start})`,
    );
  }
  // A real SLOT may refuse a frame's field: the Update says so.
  const descriptor = Object.getOwnPropertyDescriptor(
    MockNode.prototype,
    "primaryAxisAlignItems",
  );
  const refusing = new WeakMap();
  Object.defineProperty(MockNode.prototype, "primaryAxisAlignItems", {
    configurable: true,
    get() {
      return refusing.get(this) ?? "MIN";
    },
    set(value) {
      if (this.name === "Logo Slot" || this.name === "Navigation Slot")
        if (value !== "MIN") return;
      refusing.set(this, value);
    },
  });
  const refused = freshStats();
  await plugin.createNavbarVariant({
    props: { content: "Basic", navigationAlign: "End", logoInset: "True" },
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: refused,
  });
  if (descriptor)
    Object.defineProperty(
      MockNode.prototype,
      "primaryAxisAlignItems",
      descriptor,
    );
  else delete MockNode.prototype.primaryAxisAlignItems;
  ok(
    ["Logo Slot refused", "Navigation Slot refused"].every((said) =>
      refused.warnings.some((warning) => warning.includes(said)),
    ),
    `a Logo Slot or Navigation Slot that refuses its alignment is reported, not lost (${refused.warnings.join("; ")})`,
  );
  const plain = await plugin.createNavbarVariant({
    props: { content: "Basic", navigationAlign: "End", logoInset: "False" },
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  const plainLogo = named(plain, "Logo Slot");
  ok(
    plain.paddingLeft === 16 &&
      plain.boundVariables.paddingLeft.id === padVariable.id &&
      plainLogo.layoutSizingHorizontal === "HUG" &&
      plainLogo.primaryAxisAlignItems !== "CENTER",
    `without it the bar pads 16 by its own variable, and the slot hugs its logo (${plain.paddingLeft}, ${plainLogo.layoutSizingHorizontal})`,
  );
  // The set as it is after #433's first Update: each repaint keeps its id.
  const oldNames = [];
  for (const content of ["Basic", "Actions", "Contextual"])
    for (const align of ["Center", "Start", "End"])
      oldNames.push(`Content=${content}, NavigationAlign=${align}`);
  const replay = await replayUpdate(
    "Navbar",
    oldNames,
    "updateNavbarComponent",
  );
  ok(
    replay.result.variantsUpdated === 9 &&
      replay.result.variantsCreated === 9 &&
      replay.result.variantsRemoved === 0 &&
      replay.kept.every(
        (variant, i) =>
          variant && variant.name === `${oldNames[i]}, LogoInset=False`,
      ),
    `Update over the 9 keeps their node ids, renames them LogoInset=False and adds the 9 with it (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created)`,
  );
}

// GAP-198, decisions 139 and 148: a left or right inline Drawer floats in its
// region. In Figma, Placement=Inline draws that card: 420 wide by its own
// variable, as tall as its content, its border all the way round and the
// container's corners. 16 from every edge of the region is where a designer
// puts it, as React's region does, so the set says so and draws no region. A
// top or bottom inline Drawer stays at its edge, as drawn at Fixed.
section("Drawer's floating form (GAP-198)");
{
  const placements = plugin.DRAWER_PLACEMENTS || [];
  const axes = plugin.expectedVariantAxesForComponentSetName("Drawer") || {};
  ok(
    JSON.stringify(placements) === JSON.stringify(["Fixed", "Inline"]) &&
      JSON.stringify(axes.Placement) === JSON.stringify(placements) &&
      JSON.stringify(axes.Side) ===
        JSON.stringify(["Right", "Left", "Top", "Bottom"]),
    `the set declares Side and Placement, Fixed, React's default, first (${Object.keys(axes).join(", ")}: ${placements.join(", ")})`,
  );
  const parsed = [
    "Side=Right",
    "Side=Left, Placement=Inline",
    "Side=Left, Placement=Floating",
  ].map((name) => plugin.parseDrawerVariantName(name));
  ok(
    JSON.stringify(parsed) ===
      JSON.stringify([
        { value: "Right", second: "Fixed" },
        { value: "Left", second: "Inline" },
        null,
      ]),
    `a variant from before the axis parses as Fixed, an unknown value as none (${JSON.stringify(parsed)})`,
  );

  const tokens = payloadVariables([
    ...variableByName.keys(),
    "Drawer/width/inline",
    "Drawer/radius/inline",
  ]);
  const widthToken = tokens.variableByName.get("Drawer/width/inline");
  const radiusToken = tokens.variableByName.get("Drawer/radius/inline");
  const floatToken = (name) =>
    plugin.COMPONENT_FLOAT_TOKENS.find((token) => token.name === name);
  ok(
    floatToken("Drawer/width/inline")?.value === 420 &&
      floatToken("Drawer/radius/inline")?.alias === "Radius/Container",
    `Drawer/width/inline is 420 and Drawer/radius/inline is the container's corner (${JSON.stringify(floatToken("Drawer/width/inline"))}, ${JSON.stringify(floatToken("Drawer/radius/inline"))})`,
  );
  // Figma splits cornerRadius into the four corners; the harness keeps it.
  const boundToRadius = (node, variable) =>
    ["cornerRadius", "topLeftRadius"].some(
      (field) =>
        node.boundVariables[field] &&
        node.boundVariables[field].id === variable.id,
    );
  const draw = (value, second) =>
    plugin.createDrawerVariant({
      value,
      second,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
  const shapes = [];
  for (const side of ["Right", "Left"]) {
    const card = await draw(side, "Inline");
    shapes.push(card);
    const body = named(card, "Drawer Body");
    const slot = body && named(body, "Content Slot");
    const footer = named(card, "Drawer Footer");
    ok(
      card.name === `Side=${side}, Placement=Inline` &&
        card.width === 420 &&
        card.boundVariables.width.id === widthToken.id &&
        card.primaryAxisSizingMode === "AUTO" &&
        !card.boundVariables.height &&
        body.layoutSizingVertical === "HUG" &&
        body.primaryAxisSizingMode === "AUTO" &&
        slot.layoutSizingVertical === "HUG" &&
        footer.layoutSizingHorizontal === "FILL",
      `${side}, Inline: 420 by its own variable and as tall as its content, body and slot hugging (${card.name}, ${card.width}, ${card.primaryAxisSizingMode}, body ${body && body.layoutSizingVertical}, slot ${slot && slot.layoutSizingVertical})`,
    );
    ok(
      card.cornerRadius === 20 &&
        boundToRadius(card, radiusToken) &&
        card.strokes.length === 1 &&
        card.strokeWeight === 1 &&
        card.strokeAlign !== "OUTSIDE" &&
        [
          "strokeTopWeight",
          "strokeRightWeight",
          "strokeBottomWeight",
          "strokeLeftWeight",
        ].every((side) => card[side] === undefined || card[side] === 1),
      `${side}, Inline: the container's corners and its border all the way round (${card.cornerRadius}, ${card.strokeWeight})`,
    );
    ok(
      card.paddingTop === 24 &&
        card.paddingLeft === 24 &&
        card.itemSpacing === 16 &&
        card.effects.length === 1 &&
        card.fills.length === 1,
      `${side}, Inline: the fixed drawer's padding, gap, surface and shadow (${card.paddingTop}, ${card.itemSpacing}, ${card.effects.length})`,
    );
  }
  for (const side of ["Top", "Bottom"]) {
    const inline = await draw(side, "Inline");
    const fixed = await draw(side, "Fixed");
    ok(
      inline.name === `Side=${side}, Placement=Inline` &&
        inline.width === fixed.width &&
        inline.height === fixed.height &&
        inline.primaryAxisSizingMode === "FIXED" &&
        [
          "cornerRadius",
          "topLeftRadius",
          "topRightRadius",
          "bottomLeftRadius",
          "bottomRightRadius",
        ].every((field) => inline[field] === fixed[field]),
      `${side}: inline stays at its edge, drawn as Fixed (${inline.width}×${inline.height})`,
    );
  }
  // Its corners, the edge's two square since 4 Nov, are read through their
  // bindings in "Figma draws React's values".
  const fixed = await draw("Right", "Fixed");
  ok(
    fixed.name === "Side=Right, Placement=Fixed" &&
      fixed.width === 408 &&
      fixed.height === 360 &&
      fixed.primaryAxisSizingMode === "FIXED",
    `Fixed is the Drawer as it was: 408×360 (${fixed.name}, ${fixed.width}×${fixed.height})`,
  );
  const issues = [];
  const auditSet = new MockNode("COMPONENT_SET", "Drawer");
  for (const card of shapes) auditSet.appendChild(card);
  auditSet.appendChild(fixed);
  plugin.auditDrawerAutoLayoutIntegrity(auditSet, issues);
  ok(
    issues.length === 0,
    `the audit passes a floating card that hugs, and a fixed one that fills (${issues.map((i) => `${i.kind} on ${i.variant}`).join("; ")})`,
  );
  const filling = await draw("Right", "Inline");
  named(filling, "Drawer Body").layoutSizingVertical = "FILL";
  const hugging = await draw("Right", "Fixed");
  named(hugging, "Drawer Body").layoutSizingVertical = "HUG";
  const wrongSet = new MockNode("COMPONENT_SET", "Drawer");
  wrongSet.appendChild(filling);
  wrongSet.appendChild(hugging);
  const wrong = [];
  plugin.auditDrawerAutoLayoutIntegrity(wrongSet, wrong);
  ok(
    JSON.stringify(
      wrong
        .filter((issue) => issue.kind === "drawer-body-vertical-sizing")
        .map((issue) => issue.variant),
    ) === JSON.stringify([filling.name, hugging.name]),
    `the audit fails a floating card whose body fills, and a fixed one whose body hugs (${wrong.map((i) => `${i.kind} on ${i.variant}`).join("; ")})`,
  );

  // The four variants in the file today, named before the axis existed.
  const oldNames = ["Side=Right", "Side=Left", "Side=Top", "Side=Bottom"];
  const replay = await replayUpdate(
    "Drawer",
    oldNames,
    "updateDrawerComponent",
  );
  ok(
    replay.result.updated === true &&
      replay.result.componentSetId === replay.setId &&
      replay.result.variantsUpdated === 4 &&
      replay.result.variantsCreated === 4 &&
      replay.liveSet.children.length === 8 &&
      new Set(replay.names).size === 8,
    `Update keeps the set and its 4 variants, and adds 4: 8 in all, each named once (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created)`,
  );
  ok(
    replay.kept.every(
      (variant, i) =>
        variant && variant.name === `${oldNames[i]}, Placement=Fixed`,
    ),
    `each of the 4 keeps its node id and is renamed Placement=Fixed (${replay.kept.map((v) => (v ? v.name : "gone")).join("; ")})`,
  );
  const overlaps = overlapsIn(replay.liveSet);
  const corner = topLeftOf(replay.liveSet);
  ok(
    overlaps.length === 0 && corner.name === "Side=Right, Placement=Fixed",
    `the updated set has no two variants overlapping, and its top-left, Figma's default, is Right at Fixed (${corner.name}; ${overlaps.slice(0, 2).join("; ")})`,
  );
}

// GAP-199: React's aside pads 24 above and below, and its navigation 16.
// Flush drops the aside's top padding; with a header, the header starts at
// the edge and the navigation keeps its room under it (a rail with no header
// loses that too, but every Figma Content draws a Header Slot, Rail's the
// compact mark). Figma draws the room above the header as its 16 top padding,
// so Flush is that padding at 0 and nothing else: the header at the edge, the
// gap under it and the bottom as they were.
section("Sidebar's Inset (GAP-199)");
{
  const insets = plugin.SIDEBAR_INSETS || [];
  const combinations = plugin.sidebarVariantCombinations();
  const axes = plugin.expectedVariantAxesForComponentSetName("Sidebar") || {};
  ok(
    JSON.stringify(insets) === JSON.stringify(["Default", "Flush"]) &&
      JSON.stringify(axes.Inset) === JSON.stringify(insets) &&
      JSON.stringify(axes.Content) ===
        JSON.stringify(["Basic", "Sections", "Tools", "Rail"]),
    `the set declares Content and Inset, Default first (${Object.keys(axes).join(", ")}: ${insets.join(", ")})`,
  );
  const keys = new Set(combinations.map((c) => plugin.sidebarVariantKey(c)));
  ok(
    combinations.length === 8 &&
      keys.size === 8 &&
      ["Basic", "Sections", "Tools", "Rail"].every((content) =>
        ["Default", "Flush"].every((inset) =>
          combinations.some((c) => c.content === content && c.inset === inset),
        ),
      ),
    `each Content at each Inset: 8 variants with 8 keys (${combinations.length}, ${keys.size} keys)`,
  );
  const parsed = [
    "Content=Rail",
    "Content=Tools, Inset=Flush",
    "Content=Rail, Inset=Tight",
  ].map((name) => plugin.parseSidebarVariantName(name));
  ok(
    JSON.stringify(parsed) ===
      JSON.stringify([
        { content: "Rail", inset: "Default" },
        { content: "Tools", inset: "Flush" },
        null,
      ]),
    `a variant from before the axis parses as Default; an unknown value as none (${JSON.stringify(parsed)})`,
  );

  const tokens = payloadVariables([...variableByName.keys()]);
  const drawn = [];
  const measured = {};
  for (const content of ["Basic", "Sections", "Tools", "Rail"]) {
    for (const inset of ["Default", "Flush"]) {
      const component = await plugin.createSidebarVariant({
        props: { content, inset },
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      drawn.push(component);
      const header = named(component, "Header Slot");
      const navigation = named(component, "Navigation Slot");
      const footer = named(component, "Footer Slot");
      const { boxes } = layOutAxis(component, "y");
      const headerBox = header && boxes.get(header);
      const navBox = navigation && boxes.get(navigation);
      const footerBox = footer && boxes.get(footer);
      const firstItem =
        navBox &&
        navBox.start + packedSpan(navigation, navBox.length, "y").start;
      measured[`${content}/${inset}`] = {
        name: component.name,
        header: headerBox && headerBox.start,
        firstItem,
        gap: headerBox && navBox && navBox.start - headerBox.end,
        bottom: footerBox && component.height - footerBox.end,
        itemSpacing: component.itemSpacing,
      };
    }
  }
  for (const content of ["Basic", "Sections", "Tools", "Rail"]) {
    const base = measured[`${content}/Default`];
    const flush = measured[`${content}/Flush`];
    ok(
      base.name === `Content=${content}, Inset=Default` &&
        flush.name === `Content=${content}, Inset=Flush` &&
        base.header === 16 &&
        flush.header === 0 &&
        flush.firstItem === base.firstItem - 16 &&
        flush.gap === base.gap &&
        flush.gap === base.itemSpacing &&
        flush.bottom === 16 &&
        base.bottom === 16,
      `${content}: Default draws the header at 16 and the first navigation item at ${base.firstItem}; Flush the header at the edge and the item at ${base.firstItem - 16}, the ${base.itemSpacing} under the header and the 16 at the bottom kept (Flush: header ${flush.header}, item ${flush.firstItem}, gap ${flush.gap}, bottom ${flush.bottom}; ${flush.name})`,
    );
  }

  const set = new MockNode("COMPONENT_SET", "Sidebar");
  for (const component of drawn) set.appendChild(component);
  plugin.layoutSidebarVariants(set);
  const overlaps = overlapsIn(set);
  const corner = topLeftOf(set);
  ok(
    overlaps.length === 0 && corner.name === "Content=Basic, Inset=Default",
    `the laid-out set has no two variants overlapping, and its top-left is Basic at Default (${corner.name}; ${overlaps.slice(0, 2).join("; ")})`,
  );

  const oldNames = [
    "Content=Basic",
    "Content=Sections",
    "Content=Tools",
    "Content=Rail",
  ];
  const replay = await replayUpdate(
    "Sidebar",
    oldNames,
    "updateSidebarComponent",
  );
  ok(
    replay.result.updated === true &&
      replay.result.componentSetId === replay.setId &&
      replay.result.variantsUpdated === 4 &&
      replay.result.variantsCreated === 4 &&
      replay.result.variantsRemoved === 0 &&
      replay.liveSet.children.length === 8 &&
      new Set(replay.names).size === 8,
    `Update keeps the set and its 4 variants, and adds 4: 8 in all, each named once (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created, ${replay.result.variantsRemoved} removed)`,
  );
  ok(
    replay.kept.every(
      (variant, i) =>
        variant && variant.name === `${oldNames[i]}, Inset=Default`,
    ),
    `each of the 4 keeps its node id and is renamed Inset=Default (${replay.kept.map((v) => (v ? v.name : "gone")).join("; ")})`,
  );
  const created = replay.liveSet.children.filter((c) =>
    /Inset=Flush$/.test(c.name),
  );
  ok(
    created.length === 4 && created.every((c) => c.paddingTop === 0),
    `the 4 created are the Flush variants, each with no top padding (${created.map((c) => `${c.name} ${c.paddingTop}`).join("; ")})`,
  );
}

// GAP-201: a divided row draws a 1px border under it, edge to edge, and an
// open parent row that is not selected sits on background/50, under a
// selected row's fill; hover and the focus ring draw as before. TreeItem is
// the largest set in the library, so Divided is a boolean on the three row
// sets, not an axis: a Divider layer on every row and a Divided Surface behind
// each open parent row that is neither selected nor hovered, both hidden until
// Divided, off by default, shows them. The corners stay rounded, which a
// boolean cannot change; the sets say so.
section("Tree rows' Divided (GAP-201)");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const draw = async (fn, props) => {
    const component = figma.createComponent();
    await plugin[fn](component, {
      props,
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  };
  const layer = (row, name) =>
    (row.children || []).find((child) => child.name === name) || null;
  const open = {
    content: "Basic",
    expanded: "True",
    depth: "1",
    density: "Default",
    state: "Idle",
  };

  for (const density of ["Default", "Compact"]) {
    const row = await draw(
      "updateTreeParentItemVariant",
      Object.assign({}, open, { density }),
    );
    const height = density === "Compact" ? 32 : 40;
    const divider = layer(row, "Divider");
    ok(
      divider &&
        divider.type === "RECTANGLE" &&
        row.height === height &&
        divider.width === row.width &&
        divider.width === 320 &&
        divider.height === 1 &&
        divider.x === 0 &&
        divider.y === height - 1 &&
        divider.layoutPositioning === "ABSOLUTE" &&
        divider.constraints.horizontal === "STRETCH" &&
        divider.constraints.vertical === "MAX",
      `${density}: a Divider 320 by 1 along the row's bottom edge, at y ${height - 1}, absolute and stretched with the row (${divider && `${divider.width}x${divider.height} at ${divider.x},${divider.y}, ${divider.layoutPositioning}`})`,
    );
    ok(
      divider &&
        divider.fills.length === 1 &&
        boundVariableName(divider.fills[0]) === "Border/Subtle" &&
        divider.cornerRadius === 0 &&
        divider.visible === false,
      `${density}: the divider is the border role, Border/Subtle (background/200), square, and hidden until Divided (${divider && `${boundVariableName(divider.fills[0])}, visible ${divider.visible}`})`,
    );
    const surface = row.children[0];
    ok(
      surface &&
        surface.name === "Divided Surface" &&
        surface.type === "RECTANGLE" &&
        surface.width === 320 &&
        surface.height === height &&
        surface.x === 0 &&
        surface.y === 0 &&
        surface.cornerRadius === 0 &&
        surface.layoutPositioning === "ABSOLUTE" &&
        surface.constraints.horizontal === "STRETCH" &&
        surface.constraints.vertical === "STRETCH" &&
        surface.fills.length === 1 &&
        boundVariableName(surface.fills[0]) === "Colors/background/50" &&
        surface.visible === false,
      `${density}: an open parent row draws a Divided Surface first, behind the row, full bleed and square, background/50, hidden until Divided (${surface && `${surface.name} ${surface.width}x${surface.height} ${boundVariableName(surface.fills[0])}`})`,
    );
  }

  // Which rows draw the surface: an open parent row that is neither selected
  // nor hovered. A child row, a closed one, a selected and a hovered one draw
  // the divider alone.
  const cases = [
    ["updateTreeParentItemVariant", { expanded: "True", state: "Idle" }, true],
    ["updateTreeParentItemVariant", { expanded: "True", state: "Focus" }, true],
    [
      "updateTreeParentItemVariant",
      { expanded: "True", state: "Hover" },
      false,
    ],
    [
      "updateTreeParentItemVariant",
      { expanded: "True", state: "Selected" },
      false,
    ],
    [
      "updateTreeParentItemVariant",
      { expanded: "False", state: "Idle" },
      false,
    ],
    ["updateTreeChildItemVariant", { expanded: "False", state: "Idle" }, false],
    [
      "updateTreeItemVariant",
      { type: "Parent", expanded: "True", state: "Focus" },
      true,
    ],
    [
      "updateTreeItemVariant",
      { type: "Child", expanded: "False", state: "Idle" },
      false,
    ],
  ];
  const wrong = [];
  for (const [fn, props, expectSurface] of cases) {
    const row = await draw(fn, Object.assign({}, open, props));
    const surfaces = row.children.filter((c) => c.name === "Divided Surface");
    const dividers = row.children.filter((c) => c.name === "Divider");
    if (dividers.length !== 1 || surfaces.length !== (expectSurface ? 1 : 0))
      wrong.push(
        `${row.name}: ${dividers.length} divider, ${surfaces.length} surface`,
      );
  }
  ok(
    wrong.length === 0,
    `every row draws one divider, and only an open parent row that is Idle or Focus a surface (${wrong.join("; ") || "all as expected"})`,
  );

  // The set's property: Divided, off by default, drives both layers.
  const variants = [
    await draw("updateTreeParentItemVariant", open),
    await draw(
      "updateTreeParentItemVariant",
      Object.assign({}, open, { state: "Selected" }),
    ),
  ];
  const set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "TreeParentItem";
  await plugin.configureTreeItemProperties(
    set,
    freshStats(),
    tokens.variableByName,
  );
  const definitions = set.componentPropertyDefinitions;
  const divided = Object.keys(definitions).find(
    (key) =>
      key.split("#")[0] === "Divided" && definitions[key].type === "BOOLEAN",
  );
  const driven = set.findAll(
    (node) =>
      node.componentPropertyReferences &&
      node.componentPropertyReferences.visible === divided,
  );
  ok(
    divided &&
      definitions[divided].defaultValue === false &&
      driven.length === 3 &&
      driven.every((node) => /^(Divider|Divided Surface)$/.test(node.name)),
    `a Divided boolean, off by default, shows the two rows' dividers and the open row's surface, and nothing else (${divided}, ${driven.map((node) => node.name).join(", ")})`,
  );
  set.remove();

  // Update over the three sets as they are in the file today: every variant
  // keeps its node id and its name, none is added or removed, and the set
  // gains Divided, off, driving a divider on each row and a surface on each
  // open parent row that is Idle or Focus.
  const treeIcons = () => {
    const icons = new MockNode("PAGE", "Icons");
    for (const name of [
      "chevron-down",
      "chevron-right",
      "map-01",
      "marker-pin-01",
      "edit-01",
      "lock-01",
      "trash-01",
      "download-01",
      "settings-01",
      "x-close",
    ])
      icons.appendChild(mockIconComponent(name));
    return [icons];
  };
  const fileNames = (setName) => {
    const names = [];
    const types = setName === "TreeItem" ? ["Parent", "Child"] : [null];
    for (const type of types)
      for (const content of ["Basic", "Count", "Actions"])
        for (const expanded of setName === "TreeChildItem" || type === "Child"
          ? ["False"]
          : ["False", "True"])
          for (const depth of ["0", "1", "2"])
            for (const density of ["Default", "Compact"])
              for (const state of ["Idle", "Hover", "Selected", "Focus"])
                names.push(
                  [
                    type ? `Type=${type}` : null,
                    `Content=${content}`,
                    setName === "TreeChildItem" ? null : `Expanded=${expanded}`,
                    `Depth=${depth}`,
                    `Density=${density}`,
                    `State=${state}`,
                  ]
                    .filter(Boolean)
                    .join(", "),
                );
    return names;
  };
  for (const [setName, update, total, openRows] of [
    ["TreeParentItem", "updateTreeParentItemComponent", 144, 36],
    ["TreeChildItem", "updateTreeChildItemComponent", 72, 0],
    ["TreeItem", "updateTreeItemComponent", 216, 36],
  ]) {
    const oldNames = fileNames(setName);
    const replay = await replayUpdate(setName, oldNames, update, treeIcons());
    const defs = replay.liveSet.componentPropertyDefinitions;
    const key = Object.keys(defs).find(
      (k) => k.split("#")[0] === "Divided" && defs[k].type === "BOOLEAN",
    );
    const dividers = replay.liveSet.findAll((n) => n.name === "Divider");
    const surfaces = replay.liveSet.findAll(
      (n) => n.name === "Divided Surface",
    );
    const surfaced = surfaces.map((s) => s.parent && s.parent.name);
    ok(
      oldNames.length === total &&
        replay.result.updated === true &&
        replay.result.componentSetId === replay.setId &&
        replay.result.variantsUpdated === total &&
        replay.result.variantsCreated === 0 &&
        replay.result.variantsRemoved === 0 &&
        replay.kept.every(
          (variant, i) => variant && variant.name === oldNames[i],
        ) &&
        key &&
        defs[key].defaultValue === false,
      `${setName}: Update keeps all ${total} variants, their node ids and names, adds none, and declares Divided off by default (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created, ${replay.result.variantsRemoved} removed, ${key})`,
    );
    ok(
      key &&
        dividers.length === total &&
        surfaces.length === openRows &&
        surfaced.every((name) =>
          /Expanded=True, .*State=(Idle|Focus)$/.test(name),
        ) &&
        dividers
          .concat(surfaces)
          .every(
            (n) =>
              n.visible === false &&
              n.componentPropertyReferences &&
              n.componentPropertyReferences.visible === key,
          ),
      `${setName}: a divider on each of its ${total} rows and a surface on its ${openRows} open Idle and Focus rows, every one hidden and shown by Divided (${dividers.length} dividers, ${surfaces.length} surfaces)`,
    );
  }
}

// --- Accordion's boxed form (decision 149) -----------------------------------

// A new axis on the live set, painted as Update paints it. The set is first
// drawn as the file holds it, two variants named by State alone, under ids
// Code Connect pins, then Updated: the ids stay, the Default variants draw as
// they did, and four Boxed ones join them. Under withAutoLayout, because the
// last Build passed a check that laid nothing out and was visibly wrong.
section("Decision 149: Accordion's boxed form");
boxedAccordion: {
  const axes = plugin.expectedVariantAxesForComponentSetName("Accordion");
  ok(
    JSON.stringify(axes && axes.Variant) ===
      JSON.stringify(["Default", "Boxed"]) &&
      JSON.stringify(axes && axes.State) ===
        JSON.stringify(["Closed", "Open", "Disabled", "Loading"]),
    `the set expects Variant and State (got ${JSON.stringify(axes)})`,
  );
  const parse = plugin.parseAccordionVariantName;
  ok(
    parse("State=Closed").second === "Default",
    "a variant with no Variant reads as Default, so Update renames rather than replaces",
  );
  ok(
    parse("Variant=Default, State=Disabled") === null &&
      parse("Variant=Default, State=Loading") === null &&
      parse("Variant=Roomy, State=Closed") === null,
    "the default form is only Closed and Open, and an unknown form is refused",
  );

  const tokens = payloadVariables([
    ...variableByName.keys(),
    ...plugin.COMPONENT_FLOAT_TOKENS.map((token) => token.name),
    "Colors/theme/300",
    "Colors/theme/900",
  ]);
  const components = new MockNode("PAGE", "Components");
  const [, icons] = pages();
  // The icon the boxed variants paint. Left out of the page, it would fall
  // back to the slot default, and the Icon property would agree by accident.
  icons.appendChild(mockIconComponent("home-line"));
  const fileFigma = createFigmaMock({
    pages: [components, icons],
    collections: tokens.collections,
  });
  fileFigma.createTextStyle = createMockTextStyle;
  fileFigma.accordionTokens = tokens.variableByName;
  // The file's variables and fonts stand in as they do elsewhere here.
  const file = loadPlugin({
    pluginPath: PLUGIN,
    figma: fileFigma,
    append: `
ensureComponentRuntimeVariables = async () => figma.accordionTokens;
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
  });
  await file.ensureKozmosTextStyles(FONTS, freshStats());
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const unresolved = [...floats.values()]
    .filter((token) => token.name.startsWith("Accordion/boxed/") && token.alias)
    .filter(
      (token) =>
        !floats.has(token.alias) &&
        !tokens.variables.some((variable) => variable.name === token.alias),
    );
  ok(
    unresolved.length === 0,
    `every boxed token aliases a variable the file has (${unresolved.map((token) => token.alias).join(", ")})`,
  );
  const defaults = { closed: null, open: null };
  const paintDefault = async (value) => {
    const component = fileFigma.createComponent();
    await withAutoLayout(() =>
      file.updateAccordionVariant(component, {
        value,
        second: "Default",
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    component.name = `State=${value}`;
    return component;
  };
  defaults.closed = await paintDefault("Closed");
  defaults.open = await paintDefault("Open");
  const shape = (node) =>
    JSON.stringify(
      node
        .findAll(() => true)
        .map((child) => ({
          name: child.name,
          type: child.type,
          width: child.width,
          height: child.height,
          layoutMode: child.layoutMode,
          paddingBottom: child.paddingBottom,
          itemSpacing: child.itemSpacing,
          characters: child.characters,
          strokeBottomWeight: child.strokeBottomWeight,
        })),
    );
  const before = {
    Closed: shape(defaults.closed),
    Open: shape(defaults.open),
  };
  const set = fileFigma.combineAsVariants(
    [defaults.closed, defaults.open],
    components,
  );
  set.name = "Accordion";
  const pinned = {
    set: set.id,
    Closed: defaults.closed.id,
    Open: defaults.open.id,
  };

  const stats = await withAutoLayout(() => file.updateAccordionComponent());
  ok(
    stats.updated === true && stats.componentSetId === pinned.set,
    `Update keeps the set's node id (${stats.componentSetId}, ${stats.message || "updated"})`,
  );
  const variants = new Map(set.children.map((child) => [child.name, child]));
  const expected = [
    "Variant=Default, State=Closed",
    "Variant=Default, State=Open",
    "Variant=Boxed, State=Closed",
    "Variant=Boxed, State=Open",
    "Variant=Boxed, State=Disabled",
    "Variant=Boxed, State=Loading",
  ];
  ok(
    set.children.length === 6 && expected.every((name) => variants.has(name)),
    `the set is six variants (${[...variants.keys()].join("; ")})`,
  );
  ok(
    variants.get("Variant=Default, State=Closed")?.id === pinned.Closed &&
      variants.get("Variant=Default, State=Open")?.id === pinned.Open,
    "the two the file had are renamed in place: their node ids stay",
  );
  for (const value of ["Closed", "Open"]) {
    const after = variants.get(`Variant=Default, State=${value}`);
    ok(
      after && shape(after) === before[value],
      `Default, ${value} draws as it did`,
    );
  }

  // Against a plugin with no boxed form, the rest has nothing to read.
  if (!variants.has("Variant=Boxed, State=Open")) break boxedAccordion;

  const boxed = (state) => variants.get(`Variant=Boxed, State=${state}`);
  const part = (state, name) => named(boxed(state), name);
  const bound = (paint) => (paint ? boundVariableName(paint) : null);
  const variableNamed = (alias) =>
    tokens.variables.find((variable) => variable.id === alias?.id)?.name ??
    alias?.id?.replace("VariableID:", "");
  const swapDefault = () =>
    Object.entries(set.componentPropertyDefinitions).find(
      ([key, definition]) =>
        key.split("#")[0] === "Icon" && definition.type === "INSTANCE_SWAP",
    )?.[1].defaultValue;
  const paints = {
    Closed: [
      "Colors/background/0",
      "Colors/foreground/0",
      "Colors/foreground/400",
    ],
    Open: ["Colors/theme/900", "Colors/foreground/1000", "Colors/theme/300"],
    Disabled: [
      "Colors/background/100",
      "Colors/foreground/400",
      "Colors/foreground/400",
    ],
    Loading: [
      "Colors/background/100",
      "Colors/foreground/400",
      "Colors/foreground/400",
    ],
  };
  for (const state of Object.keys(paints)) {
    const trigger = part(state, "Accordion Trigger");
    const column = part(state, "Accordion Text");
    const label = part(state, "Label Text");
    const title = part(state, "Trigger Text");
    const [fill, ink, labelInk] = paints[state];
    ok(
      trigger.width === 408 && trigger.height === 44,
      `${state}: the header is 408 by 44 (${trigger.width} by ${trigger.height})`,
    );
    ok(
      trigger.layoutSizingVertical === "HUG" &&
        trigger.minHeight === 44 &&
        variableNamed(trigger.boundVariables?.minHeight) ===
          "Accordion/boxed/trigger/height",
      `${state}: the header hugs, with a bound floor of 44, as every platform's grows (${trigger.layoutSizingVertical}, ${trigger.minHeight}, ${variableNamed(trigger.boundVariables?.minHeight)})`,
    );
    ok(
      trigger.cornerRadius === 16 &&
        trigger.boundVariables?.cornerRadius &&
        trigger.paddingLeft === 8 &&
        trigger.paddingRight === 8 &&
        trigger.paddingTop === 2 &&
        trigger.paddingBottom === 2 &&
        trigger.boundVariables?.paddingTop &&
        trigger.boundVariables?.paddingBottom &&
        trigger.itemSpacing === 8,
      `${state}: corners 16, bound, 8 in and between, and 2 above and below, as React's py-0.5`,
    );
    ok(
      bound(trigger.fills[0]) === fill,
      `${state}: the fill is ${fill} (${bound(trigger.fills[0])})`,
    );
    // The edge stays laid out while open: it wears the fill, so it doesn't
    // show, and a frame with no stroke would lay out 1 less on every side.
    ok(
      bound(trigger.strokes[0]) ===
        (state === "Open" ? fill : "Border/Subtle") &&
        trigger.strokeWeight === 1,
      `${state}: a 1 edge of ${state === "Open" ? fill : "Border/Subtle"} (${bound(trigger.strokes[0])} at ${trigger.strokeWeight})`,
    );
    ok(
      bound(title.fills[0]) === ink && bound(label.fills[0]) === labelInk,
      `${state}: title ${ink} and label ${labelInk} (${bound(title.fills[0])}, ${bound(label.fills[0])})`,
    );

    // What the eye reads first: the marks' ink, state by state. An icon's
    // paint is an override on its vector, so it is read there.
    const mark = part(state, "Icon");
    const inkOf = (instance) =>
      bound(instance?.findOne((node) => node.type === "VECTOR")?.strokes[0]);
    ok(inkOf(mark) === ink, `${state}: the icon is ${ink} (${inkOf(mark)})`);
    ok(
      mark?.mainComponent?.name === "Icon / home-line" &&
        mark.mainComponent.id === swapDefault(),
      `${state}: the Icon property's default is the icon painted (${mark?.mainComponent?.name} ${mark?.mainComponent?.id}, default ${swapDefault()})`,
    );

    // The title is regular on every platform, as the live page draws it, and
    // the type comes from the set's own style.
    for (const [text, styleName] of [
      [title, "Accordion / Boxed Title"],
      [label, "Accordion / Boxed Label"],
    ]) {
      const style = mockTextStyleById(text.textStyleId);
      ok(
        text.fontName.style === "Regular" &&
          style?.name === styleName &&
          style.fontName.style === "Regular",
        `${state}: ${text.name} is Regular, from ${styleName} (${text.fontName.style}, ${style?.name}, ${style?.fontName.style})`,
      );
    }

    // The labels hug: each line is as wide as the column and as tall as its
    // words, and the column as tall as the two, inside the header.
    ok(
      label.layoutSizingHorizontal === "FILL" &&
        title.layoutSizingHorizontal === "FILL" &&
        label.layoutSizingVertical === "HUG" &&
        title.layoutSizingVertical === "HUG" &&
        label.layoutGrow === 0 &&
        title.layoutGrow === 0 &&
        label.textAutoResize === "HEIGHT" &&
        title.textAutoResize === "HEIGHT",
      `${state}: both lines fill the column and hug their words`,
    );
    ok(
      column.layoutSizingHorizontal === "FILL" &&
        column.layoutSizingVertical === "HUG" &&
        column.height === label.height + title.height,
      `${state}: the column hugs the two lines (${column.height} of ${label.height} and ${title.height})`,
    );
    ok(
      column.y >= 0 &&
        column.y + column.height <= trigger.height &&
        Math.abs(column.y - (trigger.height - column.height) / 2) <= 0.5,
      `${state}: the lines sit in the middle of the header (${column.y} of ${column.height} in ${trigger.height})`,
    );
    const last = trigger.children[trigger.children.length - 1];
    ok(
      (last === column || column.x + column.width <= last.x) &&
        last.x + last.width <= trigger.width,
      `${state}: nothing leaves the header (the column ends ${column.x + column.width}, its last child ${last.x + last.width})`,
    );
    ok(
      plugin.inferTextStyleKeyForComponentText
        ? file.inferTextStyleKeyForComponentText(title, set) ===
            "accordionBoxedTitle" &&
            file.inferTextStyleKeyForComponentText(label, set) ===
              "accordionBoxedLabel"
        : false,
      `${state}: Apply Text Styles keeps the boxed type, and would not put it back to 14`,
    );
  }

  const chevron = (state) => part(state, "Accordion Chevron");
  ok(
    chevron("Closed")?.width === 20 && chevron("Open")?.width === 20,
    "Closed and Open draw a 20 chevron",
  );
  for (const [state, source, ink] of [
    ["Closed", "chevron-down", "Colors/foreground/0"],
    ["Open", "chevron-up", "Colors/foreground/1000"],
  ]) {
    const drawn = chevron(state);
    const paint = bound(
      drawn?.findOne((node) => node.type === "VECTOR")?.strokes[0],
    );
    ok(
      drawn?.mainComponent?.name === `Icon / ${source}` && paint === ink,
      `${state}: the chevron is ${source} in ${ink} (${drawn?.mainComponent?.name}, ${paint})`,
    );
  }
  ok(!chevron("Disabled"), "Disabled draws no chevron");
  ok(
    !chevron("Loading") && part("Loading", "Loading Indicator")?.width === 20,
    "Loading draws a 20 spinner where the chevron is",
  );
  ok(
    bound(part("Loading", "Loading Indicator")?.strokes[0]) ===
      "Colors/foreground/400",
    `Loading's spinner is the greyed ink (${bound(part("Loading", "Loading Indicator")?.strokes[0])})`,
  );
  ok(
    part("Open", "Accordion Text").x === part("Closed", "Accordion Text").x &&
      part("Open", "Accordion Text").width ===
        part("Closed", "Accordion Text").width,
    `opening moves nothing: the lines sit where they did (${part("Closed", "Accordion Text").x}, ${part("Open", "Accordion Text").x})`,
  );
  ok(
    !part("Closed", "Accordion Content") &&
      !part("Disabled", "Accordion Content") &&
      !part("Loading", "Accordion Content"),
    "only Open has content",
  );
  const content = part("Open", "Accordion Content");
  ok(
    content?.paddingTop === 8 &&
      content.paddingLeft === 0 &&
      content.boundVariables?.paddingTop,
    "Open's content is 8 under its header, in the panel's flow",
  );

  // A bound text draws the set's one default: a variant that wrote a sample
  // of its own would read true here and false in the file.
  const definitions = set.componentPropertyDefinitions;
  const defaultOf = (base) =>
    Object.entries(definitions).find(
      ([key, definition]) =>
        key.split("#")[0] === base && definition.type === "TEXT",
    )?.[1].defaultValue;
  ok(
    defaultOf("Label Text") === "Step 1/5" &&
      defaultOf("Trigger Text") === "Is it accessible?",
    `each text property has its default (${defaultOf("Label Text")}, ${defaultOf("Trigger Text")})`,
  );
  for (const base of ["Label Text", "Trigger Text", "Content Text"]) {
    const texts = set.findAll((node) => node.name === base);
    ok(
      texts.length > 0 &&
        texts.every(
          (text) =>
            text.componentPropertyReferences?.characters &&
            text.characters === defaultOf(base),
        ),
      `all ${texts.length} ${base} layers are bound, and read the set's one default`,
    );
  }
  const boundTo = (base, field) =>
    Object.entries(definitions)
      .filter(([key]) => key.split("#")[0] === base)
      .flatMap(([key]) =>
        set.findAll(
          (node) => node._componentPropertyReferences?.[field] === key,
        ),
      );
  ok(
    boundTo("Show Label", "visible").length === 4 &&
      boundTo("Show Icon", "visible").length === 4 &&
      boundTo("Icon", "mainComponent").length === 4,
    `the label and the icon are the four Boxed variants' to turn off, and the icon to swap (${boundTo("Show Label", "visible").length}, ${boundTo("Show Icon", "visible").length}, ${boundTo("Icon", "mainComponent").length})`,
  );

  // The plugin's own audit reads the same shape.
  const layoutIssues = [];
  file.auditAccordionAutoLayoutIntegrity(set, layoutIssues);
  ok(
    layoutIssues.length === 0,
    `the set's auto layout audits clean (${layoutIssues.map((issue) => `${issue.variant}: ${issue.kind}`).join("; ")})`,
  );

  // A title that wraps grows the header, as React's min-height, SwiftUI's
  // frame and Compose's defaultMinSize do. Two lines are 14, 2 by 17.5, 2 by 2
  // of padding and 2 of hairline, 55, as React's header measures, in every
  // state; a third is 72.5. Read on instances, as a designer's title arrives,
  // at the set's width and on one resized to 300.
  const titleKey = Object.keys(definitions).find(
    (key) => key.split("#")[0] === "Trigger Text",
  );
  const words = "A building details section ".repeat(5);
  for (const state of Object.keys(paints)) {
    const instance = boxed(state).createInstance();
    components.appendChild(instance);
    const header = () => named(instance, "Accordion Trigger");
    const column = () => named(instance, "Accordion Text");
    const measure = async (text, width) =>
      withAutoLayout(async () => {
        instance.setProperties({ [titleKey]: text });
        if (width) instance.resize(width, instance.height);
        return {
          height: header().height,
          columnBottom: column().y + column().height,
          words: named(column(), "Trigger Text").height,
        };
      });
    const two = await measure(words.slice(0, 80));
    ok(
      two.words === 35 && two.height === 55,
      `${state}: two lines grow the header to 55 (${two.words} of words, ${two.height})`,
    );
    const three = await measure(words.slice(0, 110));
    ok(
      three.words === 52.5 &&
        three.height === 72.5 &&
        three.columnBottom <= three.height,
      `${state}: three lines to 72.5, inside it (${three.words} of words, ${three.height}, ending ${three.columnBottom})`,
    );
    const narrow = await measure(words.slice(0, 80), 300);
    ok(
      header().width === 300 &&
        narrow.height > 55 &&
        narrow.columnBottom <= narrow.height,
      `${state}: at 300 the same words grow it again (${narrow.words} of words, ${narrow.height}, at ${header().width})`,
    );
    const short = await measure("Levels", 408);
    ok(
      short.height === 44,
      `${state}: back to one line, the floor holds it at 44 (${short.height})`,
    );
    instance.remove();
  }

  // Audited in Light and Dark with the token values the importer writes: the
  // label's theme 300 and the title's foreground 1000 on theme 900 turn over
  // together, so both modes clear 4.5:1.
  const measured = file.auditComponentContrast(
    set,
    set.children,
    file.createVariableContext(tokens.collections, tokens.variables),
  );
  ok(
    measured.byMode.length === 2 &&
      measured.byMode.every(
        (mode) => mode.textPairs >= 12 && mode.minTextContrast >= 4.5,
      ),
    `every text in the set clears 4.5:1 in both modes (${measured.byMode
      .map(
        (mode) =>
          `${mode.mode} ${mode.minTextContrast} over ${mode.textPairs} pairs`,
      )
      .join(", ")})`,
  );
}

// --- GAP-197, GAP-169, GAP-154: the controls' new props --------------------------

// Three React props reach Figma (27 Oct 2026). IconButton's `counter` is a
// brand Counter at size sm over the icon's top-end corner, its start and
// bottom edges 2 past the button's centre; CardHeader's `actions` sit at the
// header's end on the title's line, 16 from the text; Input's `action` is a
// copy or toggle button inside the field's end, drawn as PasswordInput's
// reveal. The copy, star and pencil are UI icons the by-name registry does
// not name (decision 121), imported beside it. Every value asserted here is
// computed in a guard, so against an importer without them each assertion
// fails on its own rather than the run stopping at the first missing helper.
section(
  "Control props: IconButton's counter, CardHeader's actions, Input's action (GAP-197, GAP-169, GAP-154)",
);
{
  const attempt = async (fn) => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };
  const boundFloat = (node, field) => {
    const alias = node && node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  const definitionsOf = (set, type) =>
    Object.entries((set && set.componentPropertyDefinitions) || {}).filter(
      ([, definition]) => definition.type === type,
    );
  const propertyNamed = (set, base, type) =>
    (definitionsOf(set, type).find(([key]) => key.split("#")[0] === base) ||
      [])[0] || null;
  const tokens = payloadVariables(
    (plugin.COMPONENT_FLOAT_TOKENS || [])
      .map((token) => token.name)
      .concat([...variableByName.keys()]),
  );
  const catalog = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "docs/figma-pointr-icon-catalog.json"),
      "utf8",
    ),
  );
  const catalogKey = new Map(
    (Array.isArray(catalog) ? catalog : catalog.icons || []).map((item) => [
      item.name,
      item.componentKey,
    ]),
  );

  // A file of its own: Counter, the curated icons and the three UI icons on
  // their pages, and an IconButton set for the card's action to nest.
  const uiIcons = ["copy-01", "pencil-01", "star-01"];
  const controlsPages = () => {
    const [components, icons] = pages();
    for (const name of uiIcons) icons.appendChild(mockIconComponent(name));
    return [components, icons];
  };
  const [componentsPage, iconsPage] = controlsPages();
  const controls = loadPlugin({
    pluginPath: PLUGIN,
    figma: createFigmaMock({ pages: [componentsPage, iconsPage] }),
  });
  const iconComponent = (name) =>
    iconsPage.children.find((node) => node.name === `Icon / ${name}`);

  // UI icons (decision 121) ----------------------------------------------------
  const uiList = controls.IMPORTER_UI_ICON_DEFINITIONS || [];
  ok(
    JSON.stringify(uiList.map((definition) => definition.name)) ===
      JSON.stringify(uiIcons) &&
      uiList.every(
        (definition) =>
          definition.componentKey &&
          definition.componentKey === catalogKey.get(definition.name) &&
          !controls.KOSMOS_ICON_DEFINITIONS.some(
            (registry) => registry.name === definition.name,
          ),
      ),
    `the importer's UI icons are copy-01, pencil-01 and star-01, each with the catalog's key and none a registry icon (${uiList.map((d) => `${d.name} ${d.componentKey}`).join(", ")})`,
  );
  {
    const library = new Map();
    const page = new MockNode("PAGE", "Icons");
    const run = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({ pages: [page], library }),
    });
    const all = run.KOSMOS_ICON_DEFINITIONS.concat(
      run.IMPORTER_UI_ICON_DEFINITIONS || [],
    );
    for (const definition of all) {
      if (!definition.componentKey) continue;
      const source = mockIconComponent(definition.name);
      source.key = definition.componentKey;
      library.set(definition.componentKey, source);
    }
    const synced = await attempt(() => run.syncIconSourceLibrary());
    const placed = (name) =>
      page.children.find((node) => node.name === `Icon / ${name}`);
    const registryCount = run.KOSMOS_ICON_DEFINITIONS.length;
    const wayfindingCount = (run.KOZMOS_WAYFINDING_ICONS || []).length;
    const slotOf = (index) => [
      80 + (index % 8) * 120,
      80 + Math.floor(index / 8) * 96,
    ];
    const at = (node) => (node ? [node.x, node.y] : null);
    ok(
      synced &&
        synced.failed === 0 &&
        uiIcons.every((name, offset) => {
          const node = placed(name);
          return (
            node &&
            node.children.length === 1 &&
            node.children[0].type === "INSTANCE" &&
            node.children[0].mainComponent ===
              library.get(catalogKey.get(name)) &&
            JSON.stringify(at(node)) ===
              JSON.stringify(slotOf(registryCount + wayfindingCount + offset))
          );
        }),
      `Curated Icons imports the three by their catalog keys, after the wayfinding glyphs (${uiIcons.map((name) => `${name} ${JSON.stringify(at(placed(name)))}`).join(", ")})`,
    );
    const lastRegistry = run.KOSMOS_ICON_DEFINITIONS[registryCount - 1];
    const lastGlyph = (run.KOZMOS_WAYFINDING_ICONS || [])[wayfindingCount - 1];
    ok(
      synced &&
        uiIcons.every((name) => placed(name)) &&
        JSON.stringify(at(placed(lastRegistry.name))) ===
          JSON.stringify(slotOf(registryCount - 1)) &&
        lastGlyph &&
        JSON.stringify(at(placed(lastGlyph.name))) ===
          JSON.stringify(slotOf(registryCount + wayfindingCount - 1)),
      "and every icon already on the page keeps its place",
    );
    const offered = await attempt(() => run.findKozmosIconSourceComponents());
    ok(
      offered &&
        uiIcons.every((name) =>
          offered.some((component) => component.name === `Icon / ${name}`),
        ),
      "the swaps are offered them too",
    );
  }
  {
    const empty = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({ pages: pages() }),
    });
    const missingStats = freshStats();
    const missing =
      typeof empty.findImporterIconSource === "function"
        ? await empty.findImporterIconSource("copy-01", "Input", missingStats)
        : undefined;
    const found =
      typeof controls.findImporterIconSource === "function"
        ? await controls.findImporterIconSource(
            "copy-01",
            "Input",
            freshStats(),
          )
        : undefined;
    ok(
      missing === null &&
        missingStats.warnings.some(
          (warning) =>
            /Icon \/ copy-01 is not on the Icons page/.test(warning) &&
            /Run Curated Icons, then Update Input/.test(warning),
        ) &&
        found === iconComponent("copy-01"),
      `a UI icon not on the Icons page is drawn as no icon and named, never as another glyph (${missing === null ? "null" : String(missing && missing.name)}; ${missingStats.warnings.join(" | ")})`,
    );
  }

  // IconButton's counter (GAP-197) ---------------------------------------------
  const counterCases = [
    ["Default", 44],
    ["Small", 44],
    ["Large", 48],
  ];
  for (const [size, box] of counterCases) {
    const button = await attempt(() =>
      controls.createIconButtonVariant({
        variant: "Ghost",
        size,
        state: "Default",
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    const counter =
      button &&
      button.children.find(
        (child) => child.name === "Counter" && child.type === "FRAME",
      );
    const digits = counter && named(counter, "Counter Text");
    // Its bottom on the centre line (decision 139: on the design's 28 help
    // button, 4 above it); its start 2 past the centre.
    const x = box / 2 + 2;
    const bottom = box / 2;
    ok(
      counter &&
        counter.layoutPositioning === "ABSOLUTE" &&
        counter.x === x &&
        counter.y + counter.height === bottom &&
        counter.height === 18 &&
        counter.minWidth === 18 &&
        counter.paddingLeft === 5 &&
        counter.paddingRight === 5 &&
        counter.constraints.horizontal === "CENTER" &&
        counter.constraints.vertical === "CENTER",
      `${size} (${box}): the counter is 18 tall, at least 18 wide, its start edge at ${x}, 2 past the centre, and its bottom at ${bottom}, on it, held to it (${counter ? `${counter.layoutPositioning} x ${counter.x}, bottom ${counter.y + counter.height}, ${counter.width}x${counter.height}, min ${counter.minWidth}` : "none"})`,
    );
    ok(
      counter &&
        boundVariableName(counter.fills[0]) ===
          "Primary Buttons/themed/button/background/idle" &&
        boundFloat(counter, "height") === "Counter/height/small" &&
        boundFloat(counter, "paddingLeft") === "Counter/padding/x/small" &&
        boundFloat(counter, "cornerRadius") === "Counter/radius" &&
        digits &&
        digits.type === "TEXT" &&
        digits.characters === "3" &&
        boundVariableName(digits.fills[0]) ===
          "Primary Buttons/themed/button/foreground/content/idle" &&
        boundFloat(digits, "fontSize") === "Counter/font-size/small" &&
        boundFloat(digits, "lineHeight") === "Counter/line-height/small",
      `${size}: the theme fill, white digits on it, and the small Counter's metrics, bound as the Counter's painter binds them (${counter ? boundVariableName(counter.fills[0]) : "none"}, ${digits ? boundVariableName(digits.fills[0]) : "no digits"})`,
    );
    ok(
      button &&
        counter &&
        button.width === 44 &&
        button.height === 44 &&
        button.children[button.children.length - 1] === counter &&
        counter.visible === false,
      `${size}: hidden by default, drawn over everything else, and the button keeps its size (${button ? `${button.width}x${button.height}, last ${button.children.length && button.children[button.children.length - 1].name}` : "none"})`,
    );
  }
  ok(
    controls.inferTextStyleKeyForComponentText &&
      controls.inferTextStyleKeyForComponentText(
        new MockNode("TEXT", "Counter Text"),
        new MockNode("COMPONENT_SET", "IconButton"),
      ) === "counterSmall",
    "the audit expects the counter's digits in the Counter's small style",
  );
  {
    const set = new MockNode("COMPONENT_SET", "IconButton");
    for (const size of ["Default", "Large"]) {
      const variant = await attempt(() =>
        controls.createIconButtonVariant({
          variant: "Ghost",
          size,
          state: "Default",
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        }),
      );
      if (variant) set.appendChild(variant);
    }
    componentsPage.appendChild(set);
    const stats = Object.assign(freshStats(), { iconSlotsBound: 0 });
    await attempt(() =>
      controls.configureIconButtonSlot(
        set,
        iconComponent("search-md"),
        tokens.variableByName,
        stats,
      ),
    );
    await attempt(() =>
      controls.configureIconButtonCounterProperties(set, stats),
    );
    const flag = propertyNamed(set, "Counter", "BOOLEAN");
    const text = propertyNamed(set, "Counter Text", "TEXT");
    ok(
      flag &&
        set.componentPropertyDefinitions[flag].defaultValue === false &&
        text &&
        set.componentPropertyDefinitions[text].defaultValue === "3",
      `IconButton gains Counter (a boolean, off) and Counter Text ("3") (${definitionsOf(
        set,
        "BOOLEAN",
      )
        .map(([key]) => key)
        .join(", ")}; ${definitionsOf(set, "TEXT")
        .map(([key]) => key)
        .join(", ")})`,
    );
    const variants = set.children;
    ok(
      variants.length === 2 &&
        variants.every((variant) => {
          const counter = variant.children.find((c) => c.name === "Counter");
          const digits = counter && named(counter, "Counter Text");
          return (
            counter &&
            counter.componentPropertyReferences &&
            counter.componentPropertyReferences.visible === flag &&
            digits.componentPropertyReferences &&
            digits.componentPropertyReferences.characters === text &&
            variant.children[variant.children.length - 1] === counter &&
            variant.children.some((c) => c.name === "Icon")
          );
        }),
      "Counter shows each variant's counter and Counter Text is its digits; the counter stays over the icon the slot appends",
    );
  }
  {
    // Update over the 63 variants in the file today: each keeps its node id
    // and gains a hidden counter, and none is added.
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "IconButton");
    const ids = new Map();
    for (const variant of [
      "Default",
      "Destructive",
      "Outline",
      "Secondary",
      "Ghost",
      "Link",
      "Glass",
    ]) {
      for (const size of ["Default", "Small", "Large"]) {
        for (const state of ["Default", "Disabled", "Loading"]) {
          const name = `Variant=${variant}, Size=${size}, State=${state}`;
          const node = new MockNode("COMPONENT", name);
          liveSet.appendChild(node);
          ids.set(name, node.id);
        }
      }
    }
    livePage.appendChild(liveSet);
    const [, liveIcons] = controlsPages();
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({ pages: [livePage, liveIcons] }),
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await attempt(() =>
      updatePlugin.updateIconButtonComponent(),
    );
    const kept = [...ids].every(([name, id]) =>
      liveSet.children.some((child) => child.id === id && child.name === name),
    );
    ok(
      updated &&
        updated.updated === true &&
        updated.variantsUpdated === 63 &&
        updated.variantsMissing === 0 &&
        liveSet.children.length === 63 &&
        kept &&
        liveSet.children.every((child) => {
          const counter = child.children.find((c) => c.name === "Counter");
          return counter && counter.visible === false;
        }),
      `Update keeps the 63 IconButtons, id for id, each with a hidden counter (${updated ? `${updated.variantsUpdated} updated, ${updated.variantsMissing} missing` : "threw"}, ${liveSet.children.length} children)`,
    );
    ok(
      updated &&
        updated.warnings.some((warning) =>
          warning.startsWith("Next, update Card"),
        ),
      "and names Card next, whose header action is an IconButton",
    );
  }

  // CardHeader's actions (GAP-169) ---------------------------------------------
  const card = async (value, second, file) => {
    const node = new MockNode("COMPONENT", "Card");
    componentsPage.appendChild(node);
    const stats = freshStats();
    await attempt(() =>
      (file || controls).updateCardVariant(node, {
        value,
        second,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats,
      }),
    );
    return { node, stats };
  };
  const ghost = controls.buttonConfig("Ghost", "Default").foreground;
  for (const [value, padding] of [
    ["Header", "Default"],
    ["Full", "Compact"],
  ]) {
    const { node } = await card(value, padding);
    const header = node.children.find((child) => child.name === "Card Header");
    const column =
      header &&
      header.children.find((child) => child.name === "Card Header Text");
    const actions =
      header &&
      header.children.find((child) => child.name === "Header Actions");
    const slot =
      actions &&
      actions.children.find((child) => child.name === "Header Actions Slot");
    const title = column && named(column, "Title Text");
    const label = `${value}/${padding}`;
    ok(
      header &&
        header.layoutMode === "HORIZONTAL" &&
        header.itemSpacing === 16 &&
        !boundFloat(header, "itemSpacing") &&
        header.counterAxisAlignItems === "MIN" &&
        column &&
        header.children.indexOf(column) === 0 &&
        column.layoutSizingHorizontal === "FILL" &&
        column.itemSpacing === 6 &&
        boundFloat(column, "itemSpacing") === "Card/header/gap" &&
        title &&
        named(column, "Description Text"),
      `${label}: the header is a row, the title and description in a column that fills it, 6 apart, then the actions 16 after (${header ? `${header.layoutMode}, gap ${header.itemSpacing} bound ${boundFloat(header, "itemSpacing")}` : "no header"})`,
    );
    ok(
      actions &&
        header.children[header.children.length - 1] === actions &&
        actions.visible === false &&
        actions.layoutMode === "HORIZONTAL" &&
        actions.counterAxisSizingMode === "FIXED" &&
        actions.height === 24 &&
        title &&
        actions.height === title.lineHeight.value &&
        actions.counterAxisAlignItems === "CENTER" &&
        actions.primaryAxisAlignItems === "MAX",
      `${label}: the actions are hidden by default at the header's end, as tall as the title's 24 line and centred on it, so the header is no taller for them (${actions ? `${actions.width}x${actions.height}, ${actions.counterAxisAlignItems}, visible ${actions.visible}` : "none"})`,
    );
    const action = slot && slot.children[0];
    const swapped =
      action &&
      Object.entries(action.componentProperties || {}).find(
        ([key]) => key.split("#")[0] === "Icon",
      );
    const actionIcon =
      action &&
      action.findOne(
        (child) => child.type === "INSTANCE" && child.name === "Icon",
      );
    const strokes =
      actionIcon &&
      actionIcon.findAll((child) => (child.strokes || []).length > 0);
    ok(
      slot &&
        slot.type === "SLOT" &&
        slot.itemSpacing === 8 &&
        slot.counterAxisAlignItems === "CENTER" &&
        slot.height === 44 &&
        (24 - slot.height) / 2 === -10,
      `${label}: the Header Actions Slot hugs its actions, 8 apart, and is centred on the line: a 44 button hangs 10 into the padding above and below, React's margin (${slot ? `${slot.type} ${slot.width}x${slot.height}, gap ${slot.itemSpacing}` : "none"})`,
    );
    ok(
      action &&
        action.type === "INSTANCE" &&
        action.name === "Edit Action" &&
        action.mainComponent &&
        action.mainComponent.name ===
          "Variant=Ghost, Size=Default, State=Default" &&
        swapped &&
        swapped[1] === iconComponent("pencil-01").id &&
        strokes &&
        strokes.length > 0 &&
        strokes.every((child) => boundVariableName(child.strokes[0]) === ghost),
      `${label}: it holds a ghost IconButton with the pencil, tinted as the ghost button tints its icon (${action ? `${action.name}, ${action.mainComponent && action.mainComponent.name}, icon ${swapped && swapped[1]}` : "none"})`,
    );
  }
  {
    const bare = await card("Header", "Default", plugin);
    const slot = bare.node.findOne(
      (child) => child.name === "Header Actions Slot",
    );
    ok(
      slot &&
        slot.children.length === 0 &&
        bare.stats.warnings.some((warning) =>
          /Icon \/ pencil-01 is not on the Icons page/.test(warning),
        ),
      `with no pencil on the Icons page the slot is left empty and the run says so (${slot ? slot.children.length : "no slot"}; ${bare.stats.warnings.filter((w) => /pencil/.test(w)).join(" | ")})`,
    );
  }
  {
    const set = new MockNode("COMPONENT_SET", "Card");
    componentsPage.appendChild(set);
    for (const value of ["Basic", "Header", "Full"]) {
      for (const second of ["Default", "Compact"]) {
        const node = new MockNode("COMPONENT", "Card");
        set.appendChild(node);
        await attempt(() =>
          controls.updateCardVariant(node, {
            value,
            second,
            variableByName: tokens.variableByName,
            fonts: FONTS,
            stats: freshStats(),
          }),
        );
      }
    }
    const stats = freshStats();
    await attempt(() => controls.configureCardProperties(set, stats));
    const flag = propertyNamed(set, "Header Actions", "BOOLEAN");
    const slotProperty = propertyNamed(set, "Header Actions Slot", "SLOT");
    const slots = set.findAll((node) => node.name === "Header Actions Slot");
    const frames = set.findAll((node) => node.name === "Header Actions");
    ok(
      flag &&
        set.componentPropertyDefinitions[flag].defaultValue === false &&
        slotProperty &&
        definitionsOf(set, "SLOT").length === 1,
      `Card gains Header Actions (a boolean, off) and one Header Actions Slot (${definitionsOf(
        set,
        "BOOLEAN",
      )
        .map(([key]) => key)
        .join(", ")}; ${definitionsOf(set, "SLOT")
        .map(([key]) => key)
        .join(", ")})`,
    );
    ok(
      frames.length === 4 &&
        slots.length === 4 &&
        frames.every(
          (frame) =>
            frame.componentPropertyReferences &&
            frame.componentPropertyReferences.visible === flag,
        ) &&
        slots.every(
          (slot) =>
            slot.type === "SLOT" &&
            Object.values(slot.componentPropertyReferences || {}).includes(
              slotProperty,
            ),
        ),
      `the Header and Full variants' actions show with it, and their four slots bind the slot property; Basic, with no header, has none (${frames.length} frames, ${slots.length} slots)`,
    );
  }
  {
    // Update over the six cards in the file today, drawn before the column:
    // the title and description sit in the header itself. Each variant keeps
    // its node id, and so does each text, moved into the column.
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "Card");
    const ids = new Map();
    const textIds = [];
    for (const value of ["Basic", "Header", "Full"]) {
      for (const second of ["Default", "Compact"]) {
        const name = `Content=${value}, Padding=${second}`;
        const node = new MockNode("COMPONENT", name);
        liveSet.appendChild(node);
        ids.set(name, node.id);
        if (value === "Basic") continue;
        const header = new MockNode("FRAME", "Card Header");
        header.layoutMode = "VERTICAL";
        header.itemSpacing = 6;
        for (const textName of ["Title Text", "Description Text"]) {
          const text = new MockNode("TEXT", textName);
          header.appendChild(text);
          textIds.push([name, textName, text.id]);
        }
        node.appendChild(header);
      }
    }
    livePage.appendChild(liveSet);
    const [, liveIcons] = controlsPages();
    const iconButtons = new MockNode("COMPONENT_SET", "IconButton");
    iconButtons.appendChild(
      new MockNode("COMPONENT", "Variant=Ghost, Size=Default, State=Default"),
    );
    livePage.appendChild(iconButtons);
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({ pages: [livePage, liveIcons] }),
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await attempt(() => updatePlugin.updateCardComponent());
    const byId = new Map(liveSet.children.map((child) => [child.id, child]));
    const textsKept = textIds.every(([name, textName, id]) => {
      const variant = byId.get(ids.get(name));
      const column = variant && named(variant, "Card Header Text");
      const text = column && named(column, textName);
      return text && text.id === id;
    });
    // The six are renamed with the Default tone and title, and Update adds
    // the twelve the HeaderTone and TitleSize axes bring (CLOUD-UI-001,
    // GAP-035): the strip, and the Medium and Small titles, on Header and
    // Full in both paddings.
    ok(
      updated &&
        updated.updated === true &&
        updated.variantsUpdated === 6 &&
        updated.variantsCreated === 12 &&
        [...ids].every(
          ([name, id]) =>
            byId.get(id) &&
            byId.get(id).name ===
              `${name}, HeaderTone=Default, TitleSize=Large`,
        ) &&
        textsKept &&
        propertyNamed(liveSet, "Header Actions", "BOOLEAN") &&
        propertyNamed(liveSet, "Header Actions Slot", "SLOT"),
      `Update keeps the six cards, id for id, and moves each title and description into the column with its node id, adding Header Actions and its slot (${updated ? `${updated.variantsUpdated} updated, ${updated.variantsCreated} created, texts kept ${textsKept}` : "threw"})`,
    );
  }

  // Input's action (GAP-154) ---------------------------------------------------
  const axes = controls.expectedVariantAxesForComponentSetName("Input");
  ok(
    axes &&
      JSON.stringify(axes.Action) ===
        JSON.stringify(["None", "Copy", "Toggle", "TogglePressed"]) &&
      JSON.stringify(axes.State) ===
        JSON.stringify(["Default", "Focus", "Disabled", "Readonly", "Mixed"]) &&
      JSON.stringify(axes.Status) ===
        JSON.stringify(["Default", "Error", "Warning", "Success"]),
    `Input gains an Action axis: None, Copy, Toggle, TogglePressed, beside State (with Mixed, GAP-153) and Status: 80 variants (${JSON.stringify(axes && axes.Action)})`,
  );
  ok(
    JSON.stringify(
      [
        "State=Readonly, Status=Default",
        "State=Readonly, Status=Default, Action=Copy",
        "State=Default, Status=Error, Action=TogglePressed",
        "State=Default, Status=Default, Action=Star",
      ].map((name) => controls.parseInputVariantName(name)),
    ) ===
      JSON.stringify([
        { state: "Readonly", status: "Default", action: "None" },
        { state: "Readonly", status: "Default", action: "Copy" },
        { state: "Default", status: "Error", action: "TogglePressed" },
        null,
      ]),
    "a variant from before the axis parses as Action=None; an unknown Action is not one",
  );
  const input = async (state, status, action) => {
    const node = new MockNode("COMPONENT", "Input");
    componentsPage.appendChild(node);
    await attempt(() =>
      controls.updateInputVariant(node, {
        state,
        status,
        action,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    return node;
  };
  const inputCases = [
    ["Readonly", "Default", "Copy", "copy-01", "Colors/foreground/400"],
    ["Default", "Default", "Toggle", "star-01", "Colors/foreground/400"],
    [
      "Default",
      "Default",
      "TogglePressed",
      "star-01",
      "Primary Buttons/themed/button/foreground/content/idle",
    ],
    ["Disabled", "Default", "Toggle", "star-01", "Colors/foreground/500"],
  ];
  for (const [state, status, action, iconName, tint] of inputCases) {
    const node = await input(state, status, action);
    const field = named(node, "Input Field");
    const button = field && named(field, "Input Action");
    const icon =
      button && button.children.find((child) => child.type === "INSTANCE");
    const strokes = icon
      ? icon.findAll((child) => (child.strokes || []).length > 0)
      : [];
    const label = `${state}/${action}`;
    ok(
      node.name === `State=${state}, Status=${status}, Action=${action}` &&
        button &&
        button.layoutPositioning === "ABSOLUTE" &&
        button.x + button.width === field.width &&
        button.y === 0 &&
        button.width === 44 &&
        button.height === field.height &&
        boundFloat(button, "width") === "Input/field/height" &&
        boundFloat(button, "height") === "Input/field/height" &&
        button.constraints.horizontal === "MAX" &&
        (button.fills || []).length === 0 &&
        (button.strokes || []).length === 0,
      `${label}: the action is a transparent square inside the field's end, as tall as the field and bound to its height (${button ? `x ${button.x}+${button.width} of ${field.width}, ${button.height} of ${field.height}` : "none"})`,
    );
    ok(
      field &&
        field.paddingRight === 48 &&
        !boundFloat(field, "paddingRight") &&
        field.paddingLeft === 12,
      `${label}: the text is kept clear of it, the field's height and 4: 48 at the end (${field && field.paddingRight}, bound ${field && boundFloat(field, "paddingRight")})`,
    );
    ok(
      icon &&
        icon.mainComponent === iconComponent(iconName) &&
        icon.width === 16 &&
        icon.height === 16 &&
        strokes.length > 0 &&
        strokes.every((child) => boundVariableName(child.strokes[0]) === tint),
      `${label}: ${iconName} at 16 in ${tint} (${icon ? `${icon.mainComponent && icon.mainComponent.name}, ${strokes.map((child) => boundVariableName(child.strokes[0])).join(" ")}` : "no icon"})`,
    );
    // Pressed is a shape, not a colour alone (WCAG 1.4.1): a 32 disc of the
    // theme fill under the icon, as a pressed ToggleButton is and as the
    // MAP-64 design draws its Featured star (decision 139).
    const disc = button && named(button, "Pressed Fill");
    if (action === "TogglePressed") {
      ok(
        disc &&
          button.children.indexOf(disc) < button.children.indexOf(icon) &&
          disc.layoutPositioning === "ABSOLUTE" &&
          disc.width === 32 &&
          disc.height === 32 &&
          disc.x === (button.width - 32) / 2 &&
          disc.y === (button.height - 32) / 2 &&
          disc.constraints.horizontal === "CENTER" &&
          disc.constraints.vertical === "CENTER" &&
          disc.cornerRadius === 16 &&
          boundVariableName((disc.fills || [])[0]) ===
            "Primary Buttons/themed/button/background/idle",
        `${label}: a 32 disc of the theme fill under the icon, held to the button's centre (${disc ? `${disc.width}x${disc.height} at ${disc.x},${disc.y}, ${boundVariableName((disc.fills || [])[0])}, index ${button.children.indexOf(disc)} of the icon's ${button.children.indexOf(icon)}` : "none"})`,
      );
    } else {
      ok(!disc, `${label}: no pressed disc`);
    }
  }
  {
    const node = await input("Default", "Default", "None");
    const field = named(node, "Input Field");
    ok(
      node.name === "State=Default, Status=Default, Action=None" &&
        field &&
        !named(field, "Input Action") &&
        boundFloat(field, "paddingRight") === "Input/field/padding/x",
      "None is the field as it was: no action, its end padding the field's own",
    );
  }
  {
    const set = new MockNode("COMPONENT_SET", "Input");
    for (const action of ["None", "Copy", "Toggle", "TogglePressed"]) {
      const node = await input("Default", "Default", action);
      set.appendChild(node);
    }
    const stats = freshStats();
    await attempt(() => controls.configureInputActionIconProperty(set, stats));
    const swap = propertyNamed(set, "Action Icon", "INSTANCE_SWAP");
    const bound = set.children.map((variant) => {
      const icon = variant.findOne(
        (child) => child.type === "INSTANCE" && child.name === "Action Icon",
      );
      return Boolean(
        icon &&
        icon.componentPropertyReferences &&
        icon.componentPropertyReferences.mainComponent === swap,
      );
    });
    ok(
      swap &&
        set.componentPropertyDefinitions[swap].defaultValue ===
          iconComponent("star-01").id &&
        JSON.stringify(bound) === JSON.stringify([false, false, true, true]),
      `Action Icon swaps the toggle's star, at rest and pressed; Copy keeps copy-01 (${swap}; ${JSON.stringify(bound)})`,
    );
  }
  {
    // Update over the 16 variants in the file before the Action axis: each
    // keeps its node id and is renamed Action=None, and the other 64 are
    // created: 48 Action bands, and the Mixed row of each (GAP-153).
    const livePage = new MockNode("PAGE", "Components");
    const liveSet = new MockNode("COMPONENT_SET", "Input");
    const ids = new Map();
    for (const state of ["Default", "Focus", "Disabled", "Readonly"]) {
      for (const status of ["Default", "Error", "Warning", "Success"]) {
        const name = `State=${state}, Status=${status}`;
        const node = new MockNode("COMPONENT", name);
        liveSet.appendChild(node);
        ids.set(name, node.id);
      }
    }
    livePage.appendChild(liveSet);
    const setId = liveSet.id;
    const [, liveIcons] = controlsPages();
    const updatePlugin = loadPlugin({
      pluginPath: PLUGIN,
      figma: createFigmaMock({ pages: [livePage, liveIcons] }),
      append: `
ensureComponentRuntimeVariables = async () => new Map();
loadButtonFonts = async () => (${JSON.stringify(FONTS)});
`,
    });
    const updated = await attempt(() => updatePlugin.updateInputComponent());
    const byId = new Map(liveSet.children.map((child) => [child.id, child]));
    const names = liveSet.children.map((child) => child.name);
    ok(
      updated &&
        updated.componentSetId === setId &&
        updated.variantsUpdated === 16 &&
        updated.variantsCreated === 64 &&
        liveSet.children.length === 80 &&
        new Set(names).size === 80,
      `Update keeps the set and its 16 variants, and adds 64: 80 in all, each named once (${updated ? `${updated.variantsUpdated} updated, ${updated.variantsCreated} created` : "threw"}, ${liveSet.children.length} children)`,
    );
    ok(
      [...ids].every(([name, id]) => {
        const node = byId.get(id);
        return (
          node &&
          node.name === `${name}, Action=None` &&
          !named(node, "Input Action")
        );
      }),
      "each of the 16 keeps its node id, is renamed Action=None and draws no action",
    );
    const at = (name) => {
      const node = liveSet.children.find((child) => child.name === name);
      return node ? [node.x, node.y] : null;
    };
    ok(
      JSON.stringify(at("State=Readonly, Status=Success, Action=None")) ===
        JSON.stringify([3 * 360, 3 * 126]) &&
        JSON.stringify(at("State=Default, Status=Default, Action=Copy")) ===
          JSON.stringify([0, 4 * 126]),
      `the 16 keep their places and the new bands lie under them (${JSON.stringify(at("State=Readonly, Status=Success, Action=None"))}, ${JSON.stringify(at("State=Default, Status=Default, Action=Copy"))})`,
    );
    ok(
      JSON.stringify(
        at("State=Readonly, Status=Success, Action=TogglePressed"),
      ) === JSON.stringify([3 * 360, 15 * 126]) &&
        JSON.stringify(at("State=Mixed, Status=Default, Action=None")) ===
          JSON.stringify([0, 16 * 126]) &&
        JSON.stringify(
          at("State=Mixed, Status=Success, Action=TogglePressed"),
        ) === JSON.stringify([3 * 360, 19 * 126]),
      `the Mixed rows lie under every band, so no variant drawn before them moves (GAP-153) (${JSON.stringify(at("State=Mixed, Status=Default, Action=None"))}, ${JSON.stringify(at("State=Mixed, Status=Success, Action=TogglePressed"))})`,
    );
    const outside = liveSet.children.filter(
      (child) =>
        child.x + child.width > liveSet.width ||
        child.y + child.height > liveSet.height,
    );
    ok(
      liveSet.children.length === 80 && outside.length === 0,
      `and the set grows to hold all 80 (${liveSet.width}x${liveSet.height}, ${outside.length} outside)`,
    );
    const reset = propertyNamed(liveSet, "Reset Mixed", "BOOLEAN");
    const resetBound = liveSet.children.filter((variant) => {
      const layer = named(variant, "Reset Mixed");
      return (
        layer &&
        layer.componentPropertyReferences &&
        layer.componentPropertyReferences.visible === reset
      );
    });
    const mixedRows = liveSet.children.filter((variant) =>
      variant.name.startsWith("State=Mixed"),
    );
    const resetWords = propertyNamed(liveSet, "Reset Mixed Text", "TEXT");
    const mixedWords = propertyNamed(liveSet, "Mixed Text", "TEXT");
    const wordsBound = (layerName, key) =>
      liveSet.children
        .map((variant) => named(variant, layerName))
        .filter(Boolean)
        .every(
          (layer) =>
            layer.componentPropertyReferences &&
            layer.componentPropertyReferences.characters === key,
        );
    ok(
      reset &&
        liveSet.componentPropertyDefinitions[reset].defaultValue === false &&
        resetBound.length === 64 &&
        mixedRows.length === 16 &&
        mixedRows.every((variant) => !named(variant, "Reset Mixed")),
      `Reset Mixed is a boolean, off, showing the Reset Mixed layer of every variant but the 16 Mixed ones, which have none, so mixed and its way back cannot be drawn together (GAP-153) (${reset}, ${resetBound.length} bound)`,
    );
    ok(
      resetWords &&
        mixedWords &&
        liveSet.componentPropertyDefinitions[resetWords].defaultValue ===
          "Reset to multiple values" &&
        liveSet.componentPropertyDefinitions[mixedWords].defaultValue ===
          "Multiple values" &&
        wordsBound("Reset Mixed", resetWords) &&
        wordsBound("Mixed Text", mixedWords) &&
        mixedRows.every((variant) => named(variant, "Mixed Text")),
      `Reset Mixed Text and Mixed Text are text properties a product localises, bound to every reset and every Mixed variant's words (${resetWords}, ${mixedWords})`,
    );
  }

  // GAP-153: a mixed field, State=Mixed, and its way back, Reset Mixed --------
  {
    const axesOf = (name) =>
      JSON.stringify(
        (controls.expectedVariantAxesForComponentSetName(name) || {}).State,
      );
    ok(
      axesOf("NumberInput") ===
        JSON.stringify(["Default", "Focus", "Disabled", "Readonly", "Mixed"]) &&
        axesOf("Combobox") ===
          JSON.stringify([
            "Default",
            "Focus",
            "Disabled",
            "Readonly",
            "Mixed",
          ]) &&
        axesOf("Select") ===
          JSON.stringify(["Default", "Focus", "Disabled", "Mixed"]) &&
        axesOf("PasswordInput") ===
          JSON.stringify(["Default", "Focus", "Disabled", "Readonly"]) &&
        axesOf("OTPInput") ===
          JSON.stringify(["Default", "Focus", "Disabled", "Readonly"]),
      `Input, NumberInput, Combobox and Select gain State=Mixed; PasswordInput and OTPInput, which share Input's states, do not (${axesOf("Select")}, ${axesOf("PasswordInput")})`,
    );
    const paint = async (update, args) => {
      const node = new MockNode("COMPONENT", "Field");
      componentsPage.appendChild(node);
      await attempt(() =>
        controls[update](
          node,
          Object.assign(
            {
              variableByName: tokens.variableByName,
              fonts: FONTS,
              stats: freshStats(),
            },
            args,
          ),
        ),
      );
      return node;
    };
    const cases = [
      ["Input", "updateInputVariant", { action: "None" }, ["Placeholder Text"]],
      [
        "NumberInput",
        "updateNumberInputVariant",
        { steppers: "True" },
        ["Value Text", "Placeholder Text"],
      ],
      [
        "Combobox",
        "updateComboboxVariant",
        { content: "Closed" },
        ["Placeholder Text"],
      ],
      ["Select", "updateSelectVariant", {}, ["Placeholder Text"]],
    ];
    for (const [setName, update, extra, hidden] of cases) {
      const mixed = await paint(
        update,
        Object.assign({ state: "Mixed", status: "Default" }, extra),
      );
      const plain = await paint(
        update,
        Object.assign({ state: "Default", status: "Default" }, extra),
      );
      const text = named(mixed, "Mixed Text");
      const placeholder = named(mixed, "Placeholder Text");
      ok(
        mixed.name.startsWith("State=Mixed, Status=Default") &&
          text &&
          text.characters === "Multiple values" &&
          text.parent === placeholder.parent &&
          text.parent.children.indexOf(text) ===
            text.parent.children.indexOf(placeholder) + 1 &&
          boundVariableName((text.fills || [])[0]) ===
            boundVariableName((placeholder.fills || [])[0]) &&
          hidden.every((name) => named(mixed, name).visible === false) &&
          // Outside Mixed, none: the field shows its own (NumberInput its
          // value, its placeholder hidden as before).
          !named(plain, "Mixed Text") &&
          named(plain, hidden[0]).visible !== false,
        `${setName}: Mixed draws Multiple values after the placeholder, in its colour (${text && boundVariableName((text.fills || [])[0])}), and hides ${hidden.join(" and ")}; Default draws none`,
      );
      ok(
        !named(mixed, "Reset Mixed"),
        `${setName}: State=Mixed draws no Reset Mixed layer`,
      );
      for (const node of [plain]) {
        const reset = named(node, "Reset Mixed");
        const field = reset && node.children[node.children.indexOf(reset) - 1];
        ok(
          reset &&
            reset.type === "TEXT" &&
            reset.characters === "Reset to multiple values" &&
            reset.visible === false &&
            boundVariableName((reset.fills || [])[0]) === "Colors/theme/600" &&
            field &&
            field.getSharedPluginData(plugin.RUN_NAMESPACE, "kind") ===
              "input-field",
          `${setName} ${node.name}: Reset Mixed, hidden, Reset to multiple values in theme 600, right under the field (${reset ? `${reset.characters}, after ${field && field.name}` : "none"})`,
        );
      }
    }
    {
      // Updated again, the reset is the same layer, so an instance's
      // override of it survives an Update.
      const node = await paint("updateInputVariant", {
        state: "Default",
        status: "Default",
        action: "None",
      });
      const before = named(node, "Reset Mixed");
      await attempt(() =>
        controls.updateInputVariant(node, {
          state: "Default",
          status: "Default",
          action: "None",
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        }),
      );
      const after = named(node, "Reset Mixed");
      ok(
        before && after && before.id === after.id,
        `an Update keeps Input's Reset Mixed layer, id for id (${before && before.id} → ${after && after.id})`,
      );
    }
    {
      // Decision of 11 Nov: Mixed's steppers are disabled, drawn as Disabled's.
      const mixed = await paint("updateNumberInputVariant", {
        state: "Mixed",
        status: "Default",
        steppers: "True",
      });
      const plain = await paint("updateNumberInputVariant", {
        state: "Default",
        status: "Default",
        steppers: "True",
      });
      const tint = (node) =>
        node
          .findAll((child) => /Stepper$/.test(child.name))
          .flatMap((stepper) =>
            stepper.findAll((child) => (child.strokes || []).length > 0),
          )
          .map((child) => boundVariableName(child.strokes[0]));
      ok(
        tint(mixed).length > 0 &&
          tint(mixed).every((name) => name === "Colors/foreground/500") &&
          tint(plain).every((name) => name === "Colors/foreground/0"),
        `NumberInput Mixed draws its steppers disabled, in foreground 500 (${[...new Set(tint(mixed))].join(" ")}; Default ${[...new Set(tint(plain))].join(" ")})`,
      );
    }
    {
      const open = await paint("updateComboboxVariant", {
        state: "Mixed",
        status: "Default",
        content: "Open",
      });
      const checks = open.findAll(
        (child) =>
          child.type === "INSTANCE" &&
          /^Combobox Option/.test(child.parent && child.parent.name) &&
          child.mainComponent &&
          /check/.test(child.mainComponent.name),
      );
      ok(
        named(open, "Combobox Listbox") && checks.length === 0,
        `Combobox Mixed and Open checks no option (${checks.length})`,
      );
    }
    {
      const set = new MockNode("COMPONENT_SET", "Select");
      for (const state of ["Default", "Mixed"]) {
        set.appendChild(
          await paint("updateSelectVariant", { state, status: "Default" }),
        );
      }
      const stats = freshStats();
      controls.configureSelectProperties(set, stats);
      const key = propertyNamed(set, "Reset Mixed", "BOOLEAN");
      ok(
        key &&
          set.children.every((variant) => {
            const layer = named(variant, "Reset Mixed");
            return variant.name.startsWith("State=Mixed")
              ? !layer
              : layer.componentPropertyReferences.visible === key;
          }) &&
          set.children.every((variant) => variant.itemSpacing === 6),
        `Select: Reset Mixed is bound on every variant but Mixed, which has none, 6 under the trigger as React's field gap (${key})`,
      );
    }
  }

  // GAP-165: EmptyState's list ------------------------------------------------
  {
    const variant = async (value, second) => {
      const node = new MockNode("COMPONENT", "EmptyState");
      componentsPage.appendChild(node);
      await attempt(() =>
        controls.updateEmptyStateVariant(node, {
          value,
          second,
          variableByName: tokens.variableByName,
          fonts: FONTS,
          stats: freshStats(),
        }),
      );
      return node;
    };
    const set = new MockNode("COMPONENT_SET", "EmptyState");
    for (const value of ["Basic", "Icon", "Action"]) {
      for (const second of ["Default", "Compact"]) {
        set.appendChild(await variant(value, second));
      }
    }
    const lists = set.children.map((node) => named(node, "List"));
    const order = set.children.map((node) =>
      node.children.map((child) => child.name).join(" > "),
    );
    ok(
      lists.every(
        (list, index) =>
          list &&
          list.visible === false &&
          list.width === 280 &&
          list.itemSpacing === 4 &&
          set.children[index].children.indexOf(list) ===
            set.children[index].children.indexOf(
              named(set.children[index], "Content"),
            ) +
              1,
      ),
      `every variant has a hidden List, 280 wide, 4 between items, right under the title and description (${order[4]})`,
    );
    const words = lists[0]
      ? lists[0].findAll((child) => child.type === "TEXT")
      : [];
    ok(
      lists[0] &&
        JSON.stringify(
          lists[0].children.map(
            (row) => named(row, `${row.name} Text`).characters,
          ),
        ) ===
          JSON.stringify([
            "Check the building and level",
            "Clear the type filters",
            "Search by another name or an ID",
          ]) &&
        words.every(
          (text) =>
            boundVariableName((text.fills || [])[0]) ===
            "Colors/foreground/400",
        ),
      `the list's three items, each a bullet and its words in foreground 400 (${words.map((text) => text.characters).join(" | ")})`,
    );
    controls.configureEmptyStateProperties(set, freshStats());
    const list = propertyNamed(set, "List", "BOOLEAN");
    const texts = [1, 2, 3].map((index) =>
      propertyNamed(set, `List Item ${index} Text`, "TEXT"),
    );
    ok(
      list &&
        set.componentPropertyDefinitions[list].defaultValue === false &&
        lists.every(
          (layer) =>
            layer && layer.componentPropertyReferences.visible === list,
        ) &&
        texts.every(Boolean),
      `List is a boolean, off, showing each variant's list; List Item 1 Text to List Item 3 Text are its words (${list}, ${texts.join(", ")})`,
    );
  }

  // --- A field another part nests: Action=None, named (GAP-154) ----------------
  // The importer picked a nested Input by State and Status alone, so a set whose
  // first State=Default, Status=Default variant drew a copy or a toggle lent it
  // to Dialog's field, the bottom sheet's and the composites'. A set from before
  // the Action axis still gives its plain field.
  {
    const variantsOf = (names) => {
      const set = new MockNode("COMPONENT_SET", "Input");
      for (const name of names)
        set.appendChild(new MockNode("COMPONENT", name));
      return set;
    };
    const nestedPlugin = (set) => {
      const page = new MockNode("PAGE", "Components");
      page.appendChild(set);
      return loadPlugin({
        pluginPath: PLUGIN,
        figma: createFigmaMock({ pages: [page] }),
      });
    };
    const copyFirst = [
      "State=Default, Status=Default, Action=Copy",
      "State=Default, Status=Default, Action=TogglePressed",
      "State=Default, Status=Default, Action=None",
    ];
    for (const [painter, call] of [
      [
        "Dialog's field",
        (plugin, body, stats) =>
          plugin.syncDialogInput({
            body,
            name: "Dialog Input",
            label: "Name",
            placeholder: "Gate",
            stats,
          }),
      ],
      [
        "the bottom sheet's field",
        (plugin, body, stats) =>
          plugin.syncBottomSheetInput({
            body,
            name: "Bottom Sheet Input",
            label: "Name",
            placeholder: "Gate",
            stats,
          }),
      ],
    ]) {
      const set = variantsOf(copyFirst);
      const plugin = nestedPlugin(set);
      const body = new MockNode("FRAME", "Body");
      const stats = freshStats();
      await attempt(() => call(plugin, body, stats));
      const nested = body.findOne((node) => node.type === "INSTANCE");
      ok(
        nested &&
          nested.mainComponent &&
          nested.mainComponent.name ===
            "State=Default, Status=Default, Action=None",
        `${painter} nests the field with no action, whatever the set's order (${nested && nested.mainComponent ? nested.mainComponent.name : "none"})`,
      );
    }
    {
      // The cases above read what a painter ends up drawing, and three of the
      // four picks are set back afterwards, so this reads the picks: an
      // example has no second chance. A pick of State and Status alone takes
      // whichever comes first in the set, a copy or a toggle.
      const picks = [
        ...fs
          .readFileSync(PLUGIN, "utf8")
          .matchAll(
            /componentSetName: "Input",\s+variantProperties: ([^\n]+)/g,
          ),
      ].map((pick) => pick[1]);
      ok(
        picks.length === 4 &&
          picks.every((pick) => pick === "NESTED_INPUT_VARIANTS,"),
        `every nested Input is picked with Action=None named (${picks.length}: ${[...new Set(picks)].join(" ")})`,
      );
    }
    {
      // A set from before the axis: its plain field, with no warning.
      const set = variantsOf([
        "State=Default, Status=Error",
        "State=Default, Status=Default",
      ]);
      const plugin = nestedPlugin(set);
      const body = new MockNode("FRAME", "Body");
      const stats = freshStats();
      await attempt(() =>
        plugin.syncDialogInput({
          body,
          name: "Dialog Input",
          label: "Name",
          placeholder: "Gate",
          stats,
        }),
      );
      const nested = body.findOne((node) => node.type === "INSTANCE");
      ok(
        nested &&
          nested.mainComponent &&
          nested.mainComponent.name === "State=Default, Status=Default" &&
          !stats.warnings.some((w) => /missing variant/.test(w)),
        `a set from before the Action axis still lends its plain field (${nested && nested.mainComponent ? nested.mainComponent.name : "none"}; ${stats.warnings.join(" | ")})`,
      );
    }
    {
      // An instance already nested with an action is set back to none.
      const set = variantsOf(copyFirst);
      const plugin = nestedPlugin(set);
      const input = set.children[0].createInstance();
      const stats = freshStats();
      await attempt(() =>
        plugin.applyCompositeInputInstanceProperties({
          input,
          inputSet: set,
          label: "Name",
          name: "Field",
          ownerName: "Dialog",
          placeholder: "Gate",
          stats,
        }),
      );
      ok(
        input.mainComponent &&
          input.mainComponent.name ===
            "State=Default, Status=Default, Action=None",
        `a nested field drawn with a copy is set back to Action=None (${input.mainComponent && input.mainComponent.name})`,
      );
    }
  }
}

section("GAP-202: Link's External shows the new-tab icon");
{
  // Each Link variant draws the new-tab icon after its words, as React draws
  // LinkExternal01 at the link's end: the text's size, 14 (Link/icon/size,
  // React's 1em), its outline stroked 2 × 14 / 24 with round caps and joins
  // in the variant's colour (theme/600, or foreground/400 for Subtle), 4 after
  // the words (Link/gap, the no-break space). Hidden until the set's External
  // boolean, off by default, so a Link draws as it did; decorative, as the
  // code hides it. The path is the package's, and an Update draws one icon.
  const tokens = payloadVariables(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => token.name).concat([
      ...variableByName.keys(),
    ]),
  );
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const valueOf = (name) => {
    for (let hops = 0; name && hops < 8; hops += 1) {
      const token = floats.get(name);
      if (!token) return undefined;
      if (!token.alias || !floats.has(token.alias)) return token.value;
      name = token.alias;
    }
    return undefined;
  };
  const boundName = (node, field) => {
    const alias = node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  const draw = async (props, component = figma.createComponent()) => {
    await plugin.updateLinkVariant(
      component,
      Object.assign({}, props, {
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    return component;
  };

  // The outline is Pointr's link-external-01 as @kozmos-ds/icons exports it.
  const icons = fs.readFileSync(
    path.join(ROOT, "packages/icons/src/pointr/icons.generated.ts"),
    "utf8",
  );
  const exported = icons.match(
    /export const LinkExternal01 = [^(]*\(\s*"LinkExternal01",\s*\[\s*\{\s*d: "([^"]+)"/,
  );
  ok(
    exported && exported[1] === plugin.LINK_EXTERNAL_ICON_PATH,
    "the icon's path is LinkExternal01's in packages/icons",
  );

  for (const [variant, colour] of [
    ["Default", "Colors/theme/600"],
    ["Subtle", "Colors/foreground/400"],
  ]) {
    for (const state of ["Default", "Focus"]) {
      const at = `${variant}/${state}`;
      const component = await draw({ variant, state });
      const order = component.children.map((child) => child.name);
      const text = order.indexOf("Link Text");
      const iconAt = order.indexOf("External Icon");
      ok(
        text >= 0 && iconAt === text + 1,
        `${at}: the icon follows the words (${order.join(", ")})`,
      );
      ok(
        order.filter((name) => name === "External Icon").length === 1,
        `${at}: one icon`,
      );
      const icon = named(component, "External Icon");
      if (!icon) continue;
      ok(icon.visible === false, `${at}: hidden until External`);
      ok(
        icon.width === 14 &&
          icon.height === 14 &&
          boundName(icon, "width") === "Link/icon/size" &&
          boundName(icon, "height") === "Link/icon/size" &&
          valueOf("Link/icon/size") === 14,
        `${at}: 14 square, Link/icon/size (${icon.width}x${icon.height}, ${boundName(icon, "width")} = ${valueOf("Link/icon/size")})`,
      );
      ok(
        floats.get("Link/icon/size").alias === "Link/font-size",
        "Link/icon/size is the text's size, Link/font-size",
      );
      ok(
        component.itemSpacing === 4 &&
          boundName(component, "itemSpacing") === "Link/gap" &&
          valueOf("Link/gap") === 4,
        `${at}: 4 after the words, Link/gap (${component.itemSpacing}, ${boundName(component, "itemSpacing")})`,
      );
      const vectors = icon.findAll((node) => node.type === "VECTOR");
      ok(vectors.length === 1, `${at}: one outline (${vectors.length})`);
      for (const vector of vectors) {
        ok(
          (vector.fills || []).length === 0 &&
            vector.strokes.length === 1 &&
            boundVariableName(vector.strokes[0]) === colour,
          `${at}: stroked in ${colour}, unfilled (${boundVariableName(vector.strokes[0])})`,
        );
        ok(
          Math.abs(vector.strokeWeight - (2 * 14) / 24) < 0.001 &&
            vector.strokeCap === "ROUND" &&
            vector.strokeJoin === "ROUND",
          `${at}: stroke 2 × 14 / 24, round (${vector.strokeWeight}, ${vector.strokeCap}, ${vector.strokeJoin})`,
        );
      }
      ok(
        icon.getSharedPluginData(plugin.RUN_NAMESPACE, "decorative") ===
          "label-names-it",
        `${at}: decorative`,
      );
      const words = named(component, "Link Text");
      ok(
        words &&
          boundVariableName(words.fills[0]) === colour &&
          component.width === 128 &&
          component.height === 44,
        `${at}: the words and the 128 by 44 frame as before`,
      );

      // An Update draws the icon again, once.
      await draw({ variant, state }, component);
      ok(
        component.children.filter((child) => child.name === "External Icon")
          .length === 1 &&
          component.children
            .map((child) => child.name)
            .indexOf("External Icon") ===
            component.children.map((child) => child.name).indexOf("Link Text") +
              1,
        `${at}: an Update keeps one icon after the words`,
      );
    }
  }

  // The set's External boolean, off by default, shows the icon in every
  // variant.
  const variants = [];
  for (const variant of ["Default", "Subtle"])
    for (const state of ["Default", "Focus"]) {
      const component = await draw({ variant, state });
      component.name = `Variant=${variant}, State=${state}`;
      variants.push(component);
    }
  const set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "Link";
  plugin.configureLinkProperties(set, freshStats());
  const definitions = set.componentPropertyDefinitions;
  const external = Object.keys(definitions).find(
    (key) =>
      key.split("#")[0] === "External" && definitions[key].type === "BOOLEAN",
  );
  ok(
    external && definitions[external].defaultValue === false,
    "Link: an External boolean, off by default",
  );
  ok(
    variants.every((variant) => {
      const icon = named(variant, "External Icon");
      return (
        icon &&
        icon.componentPropertyReferences &&
        icon.componentPropertyReferences.visible === external
      );
    }),
    "Link: External shows the icon in all four variants",
  );
  ok(
    Object.keys(definitions).some((key) => key.split("#")[0] === "Link Text"),
    "Link: Link Text is kept",
  );
  set.remove();

  // A set's description names its own properties: External is Link's. Read
  // from the source, since an Update writes these on the live set.
  const describing = [
    ...fs
      .readFileSync(PLUGIN, "utf8")
      .matchAll(/applyComponentSetDescription\(\s*\w+,\s*"(\w+)"[^]*?\]\);/g),
  ]
    .filter(([call]) => call.includes("Link.external"))
    .map(([, component]) => component);
  ok(
    describing.length === 2 && describing.every((name) => name === "Link"),
    `only Link's Build and Update describe External (${describing.join(", ")})`,
  );
}

// --- An edge takes room in every variant or in none ------------------------------

// Whether an auto-layout frame's edge takes room inside it is set when Figma
// makes the frame, and the default moved: frames an Update keeps from before
// leave the edge out, and frames it makes now lay it in. The Update of 3 Nov
// 2026 added variants to seven old sets, and each came out a pixel smaller
// inside on each side than its siblings: Sidebar's Flush slots 246 beside
// Default's 248, Navbar's new Action 74 by 22 beside 72 by 20. Here each set's
// older variants are drawn under the old default and its newer ones under
// today's, and figma:verify's rule reads the set; then Navbar is updated over
// an Action the last Update left laid in.
section("An edge takes room in every variant or in none");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const drawn = { variableByName: tokens.variableByName, fonts: FONTS };
  const era = (laidIn, paint) =>
    withNodeDefaults(
      {
        FRAME: { strokesIncludedInLayout: laidIn },
        COMPONENT: { strokesIncludedInLayout: laidIn },
      },
      paint,
    );
  const variants = {
    Card: (pair) =>
      plugin.createCardVariant({
        value: pair[0],
        second: pair[1],
        ...drawn,
        stats: freshStats(),
      }),
    Container: (pair) =>
      plugin.createContainerVariant({
        value: pair[0],
        second: pair[1],
        ...drawn,
        stats: freshStats(),
      }),
    Navbar: (pair) =>
      plugin.createNavbarVariant({
        props: {
          content: pair[0],
          navigationAlign: pair[1],
          logoInset: pair[2],
        },
        ...drawn,
        stats: freshStats(),
      }),
    Sidebar: (pair) =>
      plugin.createSidebarVariant({
        props: { content: pair[0], inset: pair[1] },
        ...drawn,
        stats: freshStats(),
      }),
    Drawer: (pair) =>
      plugin.createDrawerVariant({
        value: pair[0],
        second: pair[1],
        ...drawn,
        stats: freshStats(),
      }),
    Input: (pair) =>
      plugin.createInputVariant({
        state: pair[0],
        status: pair[1],
        action: pair[2],
        ...drawn,
        stats: freshStats(),
      }),
    Toast: (pair) =>
      plugin.createToastVariant({
        value: pair[0],
        second: pair[1],
        ...drawn,
        stats: freshStats(),
      }),
  };
  // The variants each set had before, and the ones the Update added to it.
  const eras = {
    Card: [
      [
        ["Basic", "Default"],
        ["Full", "Default"],
      ],
      [
        ["Basic", "Compact"],
        ["Full", "Compact"],
      ],
    ],
    Container: [[["True", "Window"]], [["True", "Panel"]]],
    Navbar: [
      [
        ["Basic", "Center", "False"],
        ["Actions", "Center", "False"],
        ["Contextual", "Center", "False"],
      ],
      [
        ["Basic", "Start", "True"],
        ["Actions", "Start", "True"],
        ["Contextual", "End", "False"],
      ],
    ],
    Sidebar: [
      [
        ["Basic", "Default"],
        ["Tools", "Default"],
        ["Rail", "Default"],
      ],
      [
        ["Basic", "Flush"],
        ["Tools", "Flush"],
        ["Rail", "Flush"],
      ],
    ],
    Drawer: [[["Right", "Fixed"]], [["Right", "Inline"]]],
    Input: [
      [["Default", "Default", "None"]],
      [
        ["Default", "Default", "Copy"],
        ["Focus", "Error", "Toggle"],
      ],
    ],
    Toast: [
      [
        ["Basic", "Neutral"],
        ["Action", "Neutral"],
      ],
      [
        ["Basic", "Success"],
        ["Action", "Info"],
      ],
    ],
  };
  for (const [name, [before, added]] of Object.entries(eras)) {
    const set = new MockNode("COMPONENT_SET", name);
    let drew = true;
    try {
      for (const pair of before)
        set.appendChild(await era(false, () => variants[name](pair)));
      for (const pair of added)
        set.appendChild(await era(true, () => variants[name](pair)));
    } catch (error) {
      drew = false;
      ok(false, `${name}: its variants draw (${error.message})`);
    }
    if (!drew) continue;
    const disagree = strokeLayoutsThatDisagree(name, set);
    ok(
      disagree.length === 0,
      `${name}: an edge takes room in every variant or in none, drawn before the default moved and after${disagree.length ? ` (${disagree.join("; ")})` : ""}`,
    );
  }

  // Slot content an Update keeps is not drawn again: the plugin's own is,
  // but beside a designer's layer the slot is kept as it stands, so the
  // Action the last Update laid in is kept out where it stands.
  const kept = await variants.Navbar(["Actions", "Start", "True"]);
  const action = named(kept, "Action");
  if (action) action.strokesIncludedInLayout = true;
  const actionsSlot = named(kept, "Actions Slot");
  if (actionsSlot)
    actionsSlot.appendChild(new MockNode("FRAME", "Help Button"));
  await plugin.updateNavbarVariant(kept, {
    props: { content: "Actions", navigationAlign: "Start", logoInset: "True" },
    ...drawn,
    stats: freshStats(),
  });
  const after = named(kept, "Action");
  ok(
    action && after === action && after.strokesIncludedInLayout === false,
    `Navbar: the kept Action's edge is out of the layout after an Update (${after ? after.strokesIncludedInLayout : "no Action"}, ${after === action ? "the same layer" : "a new layer"})`,
  );
}

// --- A token split in two keeps its bindings ---------------------------------------

// Card, Container and EmptyState bound one padding token for every variant, so
// Compact and Panel drew as Default (2026-11-04). Each token is now two, and
// the old name becomes the default one in place: Import Foundations renames
// the variable, so it keeps its id and every node bound to it, and makes the
// new sibling beside it. Run twice, the second run changes nothing.
section("A token split in two keeps its bindings");
{
  const tokenFigma = createFigmaMock({
    pages: [new MockNode("PAGE", "Components")],
  });
  const holder = (extra) =>
    Object.assign(
      {
        data: {},
        setSharedPluginData(_namespace, key, value) {
          this.data[key] = value;
        },
        getSharedPluginData(_namespace, key) {
          return this.data[key] || "";
        },
      },
      extra,
    );
  const collections = [];
  const variables = [];
  tokenFigma.variables.getLocalVariableCollectionsAsync = async () =>
    collections;
  tokenFigma.variables.getLocalVariablesAsync = async () => variables;
  tokenFigma.variables.createVariableCollection = (name) => {
    const collection = holder({
      id: `VariableCollectionId:${name}`,
      name,
      modes: [
        { modeId: "light", name: "Light" },
        { modeId: "dark", name: "Dark" },
      ],
      renameMode() {},
      addMode(next) {
        this.modes.push({ modeId: next.toLowerCase(), name: next });
        return next.toLowerCase();
      },
    });
    collections.push(collection);
    return collection;
  };
  let made = 0;
  tokenFigma.variables.createVariable = (name, collection, type) => {
    made += 1;
    const variable = holder({
      id: `VariableID:made-${made}`,
      name,
      resolvedType: type,
      variableCollectionId:
        typeof collection === "string" ? collection : collection.id,
      valuesByMode: {},
      scopes: [],
      codeSyntax: {},
      setValueForMode(mode, value) {
        this.valuesByMode[mode] = value;
      },
      setVariableCodeSyntax(platform, value) {
        this.codeSyntax[platform] = value;
      },
    });
    variables.push(variable);
    return variable;
  };
  const tokenPlugin = loadPlugin({ pluginPath: PLUGIN, figma: tokenFigma });
  const renamed = tokenPlugin.RENAMED_COMPONENT_TOKENS || [];
  ok(
    renamed.length === 6,
    `six tokens are split: Card's padding, Container's inset, EmptyState's padding, gap, icon and text gap (${renamed.length})`,
  );
  // The file as it stands: each old token, bound by id.
  const components = tokenFigma.variables.createVariableCollection(
    tokenPlugin.COMPONENT_COLLECTION_NAME,
  );
  const before = new Map();
  for (const [from] of renamed) {
    const variable = tokenFigma.variables.createVariable(
      from,
      components,
      "FLOAT",
    );
    before.set(from, variable.id);
  }
  const runOnce = async () => {
    const stats = freshStats();
    await tokenPlugin.ensureComponentRuntimeVariables(stats);
    return stats;
  };
  const first = await runOnce();
  const named = (name) => variables.filter((v) => v.name === name);
  for (const [from, to] of renamed) {
    const kept = variables.find((v) => v.id === before.get(from));
    const sibling = to.replace(/\/(default|window)$/, (_m, which) =>
      which === "window" ? "/panel" : "/compact",
    );
    ok(
      kept &&
        kept.name === to &&
        named(from).length === 0 &&
        named(to).length === 1 &&
        named(sibling).length === 1,
      `${from} becomes ${to} in place, with ${sibling} beside it (${kept ? kept.name : "gone"}; ${named(from).length} left under the old name)`,
    );
  }
  const count = variables.length;
  const second = await runOnce();
  ok(
    variables.length === count &&
      renamed.every(([, to]) => named(to).length === 1) &&
      !(second.componentVariablesRenamed > 0) &&
      first.componentVariablesRenamed === renamed.length,
    `a second run renames and makes nothing (${first.componentVariablesRenamed} renamed, then ${second.componentVariablesRenamed || 0}; ${count} then ${variables.length} variables)`,
  );
}

// --- Figma draws React's values ----------------------------------------------------

// The triage of 4 Nov read the live file against React and found parts drawn
// at another value: an alias that beat a right literal, a token that said the
// old number, a text style that drew its own size over the variables bound
// to it, and Examples sized past their parts. Figma follows the built parts
// (GAP-184), with the owner's rulings of 4 Nov: a container's corner is 20
// everywhere, Sidebar is 256, Tabs 40 and 32. Every number here is the one
// Figma draws: a bound field's variable resolved through its aliases, and a
// styled text's style.
section("Figma draws React's values (the 4 Nov triage)");
{
  const floats = new Map(
    plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
  );
  const payload = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "docs/figma-foundations-payload.json"),
      "utf8",
    ),
  );
  const payloadValue = new Map(
    payload.variables.map((variable) => [
      variable.figmaName,
      variable.values.light,
    ]),
  );
  const byCanonical = new Map(
    payload.variables.map((variable) => [
      variable.canonicalName,
      variable.figmaName,
    ]),
  );
  // A variable's value, through every alias it passes.
  const resolve = (name, depth = 0) => {
    if (!name || depth > 8) return undefined;
    const token = floats.get(name);
    if (token)
      return token.alias ? resolve(token.alias, depth + 1) : token.value;
    const value = payloadValue.get(name);
    if (value && value.kind === "alias")
      return resolve(byCanonical.get(value.path), depth + 1);
    return value && value.value;
  };
  const boundName = (node, field) => {
    const alias = node && node.boundVariables && node.boundVariables[field];
    return alias && alias.id
      ? String(alias.id).replace(/^VariableID:/, "")
      : null;
  };
  // What Figma draws for a number: its variable's, when one is bound.
  const shown = (node, field) => {
    if (!node) return undefined;
    const name = boundName(node, field);
    return name ? resolve(name) : node[field];
  };
  // A corner: its own binding, else the one cornerRadius binds all four by,
  // else its own value, else the frame's.
  const corner = (node, field) => {
    if (!node) return undefined;
    const own = boundName(node, field);
    if (own) return resolve(own);
    const all = boundName(node, "cornerRadius");
    if (all) return resolve(all);
    return typeof node[field] === "number" ? node[field] : node.cornerRadius;
  };
  const corners = (node) =>
    [
      "topLeftRadius",
      "topRightRadius",
      "bottomRightRadius",
      "bottomLeftRadius",
    ].map((field) => corner(node, field));
  // A styled text draws its style's size and leading; the variables bound
  // to its own fields are inert under it (the triage's first finding).
  const typeOf = (text) => {
    if (!text) return "no text";
    const style = text.textStyleId && mockTextStyleById(text.textStyleId);
    if (style) return `${style.fontSize}/${style.lineHeight.value}`;
    const leading = shown(text, "lineHeight");
    return `${shown(text, "fontSize")}/${typeof leading === "number" ? leading : leading && leading.value}`;
  };

  // The file as Update paints it: its tokens, its text styles and its icons.
  const tokens = payloadVariables(
    [...floats.keys()].concat([...variableByName.keys()]),
  );
  const [components, icons] = pages();
  const look = (properties, width, height, layoutMode) => ({
    properties,
    build: (variant) => {
      variant.layoutMode = layoutMode || "HORIZONTAL";
      variant.resize(width, height);
    },
  });
  // The parts the Examples place, at their own sizes.
  components.appendChild(
    mockComponentSet("Navbar", [look({ Content: "Actions" }, 880, 64)]),
  );
  components.appendChild(
    mockComponentSet("Sidebar", [
      look({ Content: "Sections" }, 256, 360, "VERTICAL"),
    ]),
  );
  components.appendChild(
    mockComponentSet(
      "Chip",
      ["Small", "Default"].map((size) =>
        look(
          {
            Variant: "Brand",
            Size: size,
            State: "Selected",
            Removable: "True",
          },
          80,
          size === "Small" ? 28 : 32,
        ),
      ),
    ),
  );
  components.appendChild(
    mockComponentSet("Switch", [
      look({ Checked: "Checked", State: "Default" }, 220, 44),
    ]),
  );
  components.appendChild(
    mockComponentSet("Button", [
      look({ Variant: "Default", Size: "Default", State: "Default" }, 112, 44),
    ]),
  );
  components.appendChild(
    mockComponentSet("Progress", [
      look(
        { Shape: "Linear", Size: "Medium", Tone: "Themed", Value: "50" },
        320,
        8,
        "NONE",
      ),
    ]),
  );
  const fileFigma = createFigmaMock({
    pages: [components, icons],
    collections: tokens.collections,
  });
  fileFigma.createTextStyle = createMockTextStyle;
  const file = loadPlugin({ pluginPath: PLUGIN, figma: fileFigma });
  await file.ensureKozmosTextStyles(FONTS, freshStats());
  const args = {
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  };
  // A painter that throws on an older build fails its assertions here
  // instead of stopping the run.
  const paint = async (painter, props) => {
    try {
      const component = fileFigma.createComponent();
      await file[painter](component, Object.assign({}, args, props));
      return component;
    } catch (error) {
      ok(false, `${painter} paints (${error.message})`);
      return null;
    }
  };
  const find = (root, name) =>
    root ? root.findOne((node) => node.name === name) : null;

  // A container's corner is 20 everywhere (owner, 4 Nov; decision 118).
  const card = await paint("updateCardVariant", {
    value: "Full",
    second: "Default",
  });
  ok(
    shown(card, "cornerRadius") === 20,
    `Card draws React's rounded-container, 20 (${shown(card, "cornerRadius")} through ${boundName(card, "cornerRadius")})`,
  );
  const dialog = await paint("updateDialogVariant", { value: "Footer" });
  ok(
    shown(dialog, "cornerRadius") === 20,
    `Dialog draws 20 (${shown(dialog, "cornerRadius")})`,
  );
  const alert = await paint("updateAlertVariant", { value: "Default" });
  ok(
    shown(alert, "cornerRadius") === 20 && alert && alert.cornerRadius === 20,
    `Alert draws 20, and the painter writes it (${shown(alert, "cornerRadius")}, written ${alert && alert.cornerRadius})`,
  );
  const sheet = await paint("updateBottomSheetVariant", {
    props: { content: "Footer" },
  });
  ok(
    JSON.stringify(corners(sheet)) === JSON.stringify([20, 20, 0, 0]),
    `BottomSheet rounds its top two corners 20, React's rounded-t-container (${JSON.stringify(corners(sheet))}, top-left clockwise)`,
  );
  // A drawer at its edge rounds the two corners that face the page; a
  // floating one all four. Top-left, top-right, bottom-right, bottom-left.
  const drawerCorners = {
    "Right, Fixed": [20, 0, 0, 20],
    "Left, Fixed": [0, 20, 20, 0],
    "Top, Fixed": [0, 0, 20, 20],
    "Bottom, Fixed": [20, 20, 0, 0],
    "Top, Inline": [0, 0, 20, 20],
    "Bottom, Inline": [20, 20, 0, 0],
    "Right, Inline": [20, 20, 20, 20],
    "Left, Inline": [20, 20, 20, 20],
  };
  for (const [key, expected] of Object.entries(drawerCorners)) {
    const [side, placement] = key.split(", ");
    const drawer = await paint("updateDrawerVariant", {
      value: side,
      second: placement,
    });
    ok(
      JSON.stringify(corners(drawer)) === JSON.stringify(expected),
      `Drawer ${key} draws ${JSON.stringify(expected)} (${JSON.stringify(corners(drawer))})`,
    );
  }
  // Updated over a Drawer an older painter bound all round, the edge's two
  // corners come square.
  const kept = await paint("updateDrawerVariant", {
    value: "Right",
    second: "Fixed",
  });
  if (kept) {
    kept.setBoundVariable(
      "cornerRadius",
      tokens.variableByName.get("Drawer/radius"),
    );
    kept.cornerRadius = 16;
    await file.updateDrawerVariant(
      kept,
      Object.assign({}, args, { value: "Right", second: "Fixed" }),
    );
  }
  ok(
    JSON.stringify(corners(kept)) === JSON.stringify([20, 0, 0, 20]),
    `an Update squares the edge of a Drawer bound all round (${JSON.stringify(corners(kept))})`,
  );
  const upload = await paint("updateFileUploadVariant", {
    state: "Default",
    status: "Default",
    content: "Dropzone",
  });
  const dropzone = find(upload, "FileUpload Dropzone");
  ok(
    shown(dropzone, "cornerRadius") === 20 &&
      shown(dropzone, "paddingLeft") === 16 &&
      shown(dropzone, "paddingRight") === 16,
    `FileUpload's dropzone draws 20 corners and React's px-4 (${shown(dropzone, "cornerRadius")}, ${shown(dropzone, "paddingLeft")} through ${boundName(dropzone, "paddingLeft")})`,
  );

  // The control's corner, 16.
  const toggle = await paint("updateToggleButtonVariant", {
    variant: "Default",
    size: "Default",
    state: "Pressed",
  });
  const toggleRing = find(toggle, "Focus Ring");
  ok(
    shown(toggle, "cornerRadius") === 16 &&
      toggle.cornerRadius === 16 &&
      toggleRing &&
      toggleRing.cornerRadius === 16 + 4,
    `ToggleButton draws 16, its ring 4 outside it concentric (${shown(toggle, "cornerRadius")}, written ${toggle && toggle.cornerRadius}, ring ${toggleRing && toggleRing.cornerRadius})`,
  );
  const floors = await paint("updateFloorSelectorVariant", {
    value: "VerticalList",
  });
  const floorItems = floors
    ? floors.children.filter((node) => /^Floor Item/.test(node.name))
    : [];
  ok(
    floorItems.length === 3 &&
      floorItems.every(
        (item) =>
          boundName(item, "cornerRadius") === "FloorSelector/item/radius" &&
          shown(item, "cornerRadius") === 16,
      ),
    `each floor is a Button, 16, through FloorSelector/item/radius (${floorItems.map((item) => `${shown(item, "cornerRadius")} via ${boundName(item, "cornerRadius")}`).join(", ")})`,
  );
  // A control keeps its corner inside the tray: tokens:radius:nesting reads
  // what carries the stamp as a control, and the 20 tray hugs its 16 floors
  // across the 4 inset either way.
  ok(
    floorItems.length === 3 &&
      floorItems.every(
        (item) =>
          item.getSharedPluginData("kozmos_ds_importer", "surface") ===
          "control",
      ),
    `and each is stamped a control, so the nesting check reads it as one (${floorItems.map((item) => item.getSharedPluginData("kozmos_ds_importer", "surface") || "none").join(", ")})`,
  );
  ok(
    floors && corner(floors, "topLeftRadius") === 20,
    `and the tray is a container, 20, the floors' 16 across its 4 inset (${floors && corner(floors, "topLeftRadius")})`,
  );
  const picker = await paint("updateColorPickerVariant", {
    state: "Default",
    status: "Default",
    content: "Open",
    format: "HEX",
  });
  const presets = picker
    ? picker.findAll((node) => /^Preset Swatch /.test(node.name))
    : [];
  const presetRow = find(picker, "ColorPicker Preset Row 1");
  const perRow = presetRow ? presetRow.children.length : 0;
  ok(
    presets.length > 0 &&
      presets.every(
        (preset) =>
          shown(preset, "width") === 32 &&
          shown(preset, "height") === 32 &&
          shown(preset, "cornerRadius") === 16,
      ),
    `ColorPicker's presets are 32 squares at 16, React's h-8 rounded-control (${presets.length} presets, the first ${shown(presets[0], "width")}×${shown(presets[0], "height")} r${shown(presets[0], "cornerRadius")})`,
  );
  ok(
    perRow > 0 && perRow * 32 + (perRow - 1) * 8 <= 296,
    `and a row holds as many as fit the popover's 296, 8 apart (${perRow})`,
  );
  const toast = await paint("updateToastVariant", {
    value: "Action",
    second: "Neutral",
  });
  const toastClose = find(toast, "Toast Close");
  ok(
    toastClose && shown(toastClose, "cornerRadius") === 16,
    `Toast's close is rounded-control, 16 (${toastClose && shown(toastClose, "cornerRadius")})`,
  );

  // Gaps.
  const dialogHeader = find(dialog, "Dialog Header Content");
  ok(
    shown(dialog, "itemSpacing") === 24 && dialog.itemSpacing === 24,
    `Dialog's parts are 24 apart, React's gap-6 (${shown(dialog, "itemSpacing")}, written ${dialog && dialog.itemSpacing})`,
  );
  const drawerForHeader = await paint("updateDrawerVariant", {
    value: "Right",
    second: "Fixed",
  });
  const headers = [
    ["Dialog", dialogHeader],
    ["Drawer", find(drawerForHeader, "Drawer Header Content")],
    ["BottomSheet", find(sheet, "BottomSheet Header Content")],
  ];
  for (const [name, header] of headers) {
    ok(
      header && shown(header, "itemSpacing") === 8 && header.itemSpacing === 8,
      `${name}'s title is 8 over its description, React's gap-2 (${header && shown(header, "itemSpacing")}, written ${header && header.itemSpacing})`,
    );
  }
  ok(
    shown(sheet, "itemSpacing") === 16 && sheet && sheet.itemSpacing === 16,
    `BottomSheet's parts are 16 apart, DrawerContent's gap-4 (${shown(sheet, "itemSpacing")}, written ${sheet && sheet.itemSpacing})`,
  );
  for (const [size, gap] of [
    ["Compact", 2],
    ["Default", 4],
  ]) {
    const empty = await paint("updateEmptyStateVariant", {
      value: "Icon",
      second: size,
    });
    const content = find(empty, "Content");
    ok(
      content &&
        shown(content, "itemSpacing") === gap &&
        content.itemSpacing === gap,
      `EmptyState ${size}: the title is ${gap} over its description (${content && shown(content, "itemSpacing")} through ${boundName(content, "itemSpacing")})`,
    );
  }
  const counter = await paint("updateCounterVariant", {
    tone: "Brand",
    size: "Small",
  });
  ok(
    shown(counter, "paddingLeft") === 5 &&
      shown(counter, "paddingRight") === 5 &&
      shown(counter, "minWidth") === 18,
    `Counter Small is React's px-[5px] and at least 18 wide (padding ${shown(counter, "paddingLeft")}, min width ${shown(counter, "minWidth")})`,
  );

  // Sizes.
  const tabs = await paint("updateTabsVariant", {
    count: "Three",
    active: "One",
    state: "Focus",
  });
  const trigger = find(tabs, "Tab 1 Trigger");
  const tabsRing = find(trigger, "Focus Ring");
  ok(
    shown(tabs, "height") === 40 && tabs.height === 40,
    `Tabs is React's h-10, 40 (${shown(tabs, "height")}, drawn ${tabs && tabs.height})`,
  );
  ok(
    shown(trigger, "height") === 32 &&
      trigger.height === 32 &&
      tabsRing &&
      tabsRing.height === 32 + 4 * 2,
    `a tab is 32, inside 4 all round, its ring 4 outside it (${shown(trigger, "height")}, drawn ${trigger && trigger.height}, ring ${tabsRing && tabsRing.height})`,
  );
  let sidebar = null;
  try {
    sidebar = await file.createSidebarVariant(
      Object.assign({}, args, {
        props: { content: "Tools", inset: "Default" },
      }),
    );
  } catch (error) {
    ok(false, `Sidebar paints (${error.message})`);
  }
  const slots = sidebar
    ? sidebar.children.filter((node) => / Slot$/.test(node.name))
    : [];
  ok(
    shown(sidebar, "width") === 256 &&
      sidebar.width === 256 &&
      slots.length > 0 &&
      slots.every((slot) => slot.width === 224),
    `Sidebar is React's w-64, 256, its slots 224 inside 16 each side (${shown(sidebar, "width")}; slots ${slots.map((slot) => slot.width).join(", ")})`,
  );
  const sidebarIssues = [];
  if (sidebar) {
    const sidebarSet = new MockNode("COMPONENT_SET", "Sidebar");
    sidebarSet.appendChild(sidebar);
    file.auditSidebarAutoLayoutIntegrity(sidebarSet, sidebarIssues);
  }
  ok(
    sidebar && sidebarIssues.length === 0,
    `and the audit reads it clean (${sidebarIssues.map((issue) => issue.kind).join(", ")})`,
  );

  // Text: the style draws, so the style is React's.
  const poi = await paint("updatePOICardVariant", { value: "Basic" });
  const poiTitle = find(poi, "Title Text");
  ok(
    typeOf(poiTitle) === "20/28" &&
      `${resolve("POICard/title/font-size")}/${resolve("POICard/title/line-height")}` ===
        "20/28",
    `POICard's title is React's text-xl, 20/28, in its style and its tokens (${typeOf(poiTitle)})`,
  );
  const route = await paint("updateWayfindingCardVariant", {
    value: "Titled",
  });
  const routeTitle = find(route, "Title Text");
  ok(
    typeOf(routeTitle) === "14/20" &&
      `${resolve("WayfindingCard/title/font-size")}/${resolve("WayfindingCard/title/line-height")}` ===
        "14/20",
    `WayfindingCard's title is React's text-sm, 14/20, in its style and its tokens (${typeOf(routeTitle)})`,
  );
  const listbox = await paint("updateListboxVariant", {
    selection: "Single",
    state: "Default",
  });
  const description = find(listbox, "Option 1 Description");
  ok(
    typeOf(description) === "12/16",
    `Listbox's option description is React's text-xs, 12/16 (${typeOf(description)})`,
  );
  // No style is 10/12, so the attribution's style still draws Field / Meta's
  // 12/16 (reported, not invented); its tokens say React's 10/12.
  ok(
    `${resolve("MapView/attribution/font-size")}/${resolve("MapView/attribution/line-height")}` ===
      "10/12",
    `MapView's attribution tokens are React's 10 at 1.2 (${resolve("MapView/attribution/font-size")}/${resolve("MapView/attribution/line-height")})`,
  );
  // An alias that drew another size than the token's own.
  const textSizes = {
    "Text/font-size/base": 16,
    "Text/font-size/xl": 20,
    "Text/font-size/2xl": 24,
    "EmptyState/title/font-size": 16,
  };
  for (const [name, size] of Object.entries(textSizes)) {
    ok(
      resolve(name) === size,
      `${name} draws ${size} (${resolve(name)}${floats.get(name) && floats.get(name).alias ? ` through ${floats.get(name).alias}` : ""})`,
    );
  }

  // The Examples, as their parts are drawn.
  const example = async (builder, key) => {
    try {
      const root = await file[builder]({
        config: file.EXAMPLE_TEMPLATE_CONFIGS[key],
        fonts: FONTS,
        variableByName: tokens.variableByName,
        stats: file.createExampleStats(key),
      });
      file.normalizeExampleDeferredChildSizing(root);
      return root;
    } catch (error) {
      ok(false, `${builder} draws (${error.message})`);
      return null;
    }
  };
  const operations = await example(
    "buildOperationsConsoleExampleTemplate",
    "operationsConsole",
  );
  const navbar = find(operations, "Operations Navbar");
  ok(
    navbar &&
      navbar.type === "INSTANCE" &&
      navbar.height === 64 &&
      navbar.layoutSizingVertical === "FIXED",
    `Operations Console: the Navbar is 64 and holds it, React's min-block-size (${navbar && navbar.height}, ${navbar && navbar.layoutSizingVertical})`,
  );
  const opsSidebar = find(operations, "Operations Sidebar");
  ok(
    opsSidebar && opsSidebar.width === 256,
    `Operations Console: the Sidebar is 256 (${opsSidebar && opsSidebar.width})`,
  );
  const chip = find(operations, "Live Filter Chip");
  ok(
    chip &&
      chip.mainComponent &&
      /Size=Default/.test(chip.mainComponent.name) &&
      chip.height === 32,
    `Operations Console: the 32 filter chip is the Default chip, React's h-8 (${chip && chip.mainComponent && chip.mainComponent.name}, ${chip && chip.height})`,
  );
  const kiosk = await example(
    "buildKioskHandoffExampleTemplate",
    "kioskHandoff",
  );
  const routeSwitch = find(kiosk, "Accessible Route Switch");
  ok(
    routeSwitch &&
      routeSwitch.height === 44 &&
      routeSwitch.width === 220 &&
      routeSwitch.layoutSizingVertical === "HUG",
    `Kiosk: the route switch is React's min-h-11 row, 44, and hugs its height, so Show Description grows it rather than clipping it (GAP-162) (${routeSwitch && routeSwitch.height}, ${routeSwitch && routeSwitch.layoutSizingVertical})`,
  );
  const findRoute = find(kiosk, "Kiosk Find Route Button");
  ok(
    findRoute &&
      findRoute.height === 44 &&
      findRoute.layoutSizingVertical === "FIXED" &&
      findRoute.layoutSizingHorizontal === "FILL",
    `Kiosk: Find route is 44 and holds it across the panel (${findRoute && findRoute.height}, ${findRoute && findRoute.layoutSizingHorizontal}/${findRoute && findRoute.layoutSizingVertical})`,
  );
  const sdk = await example("buildSdkRouteFlowExampleTemplate", "sdkRouteFlow");
  const progress = find(sdk, "Route Progress");
  ok(
    progress &&
      progress.height === 8 &&
      progress.layoutSizingVertical === "FIXED",
    `SDK Route Flow: the progress bar is React's h-2, 8 (${progress && progress.height}, ${progress && progress.layoutSizingVertical})`,
  );
}

// The component float tokens, resolved through their aliases, and the names a
// node's field is bound to: shared by the two sections below.
const menusTokens = payloadVariables(
  plugin.COMPONENT_FLOAT_TOKENS.map((token) => token.name).concat([
    ...variableByName.keys(),
  ]),
);
const menusFloats = new Map(
  plugin.COMPONENT_FLOAT_TOKENS.map((token) => [token.name, token]),
);
const menusValueOf = (name) => {
  for (let hops = 0; name && hops < 8; hops += 1) {
    const token = menusFloats.get(name);
    if (!token) return undefined;
    if (!token.alias || !menusFloats.has(token.alias)) return token.value;
    name = token.alias;
  }
  return undefined;
};
const menusBound = (node, field) => {
  const alias = node && node.boundVariables && node.boundVariables[field];
  return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
};

section("GAP-156: Kbd draws a key cap, one key or a combination");
{
  // React's Kbd: a cap h-5 (20) min-w-5 (20) px-1 (4), rounded-marker (4), a 1
  // border in the border colour (Border/Subtle) on bg-muted (background/100),
  // its key text-xs font-medium (12/16) in the foreground; a combination's
  // caps gap-1 (4) apart with a "+" in the muted foreground (foreground/400).
  // The edge is laid inside the cap, as CSS's border-box draws it.
  const kbdPainted =
    typeof plugin.updateKbdVariant === "function" &&
    typeof plugin.configureKbdProperties === "function";
  ok(kbdPainted, "Kbd's painter and properties are reachable");
  const draw = async (value, component = figma.createComponent()) => {
    await withAutoLayout(() =>
      plugin.updateKbdVariant(component, {
        value,
        variableByName: menusTokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    return component;
  };
  ok(
    JSON.stringify(plugin.KBD_KEYS) ===
      JSON.stringify(["Single", "Combination"]) &&
      JSON.stringify(plugin.expectedVariantAxesForComponentSetName("Kbd")) ===
        JSON.stringify({ Keys: ["Single", "Combination"] }),
    `Kbd's one axis is Keys: Single, Combination (${JSON.stringify(plugin.expectedVariantAxesForComponentSetName("Kbd"))})`,
  );
  const layers = {
    Single: ["Key"],
    Combination: ["Modifier Key", "Plus", "Key"],
  };
  const words = { "Modifier Key": "Modifier Text", Key: "Key Text" };
  const painted = {};
  for (const value of kbdPainted ? plugin.KBD_KEYS : []) {
    const component = await draw(value);
    painted[value] = component;
    const order = component.children.map((child) => child.name);
    ok(
      component.name === `Keys=${value}` &&
        plugin.parseKbdVariantName(component.name).value === value,
      `${value}: named Keys=${value}, and reads back as itself (${component.name})`,
    );
    ok(
      JSON.stringify(order) === JSON.stringify(layers[value]),
      `${value}: ${layers[value].join(", ")} (${order.join(", ")})`,
    );
    ok(
      component.itemSpacing === 4 &&
        menusBound(component, "itemSpacing") === "Kbd/gap" &&
        menusValueOf("Kbd/gap") === 4 &&
        component.fills.length === 0 &&
        component.strokes.length === 0 &&
        component.height === 20,
      `${value}: an unpainted row 20 tall, its caps 4 apart, Kbd/gap (${component.itemSpacing}, ${menusBound(component, "itemSpacing")}, ${component.height})`,
    );
    for (const cap of component.children.filter(
      (child) => child.type === "FRAME",
    )) {
      const at = `${value} / ${cap.name}`;
      ok(
        cap.height === 20 &&
          menusBound(cap, "height") === "Kbd/height" &&
          menusValueOf("Kbd/height") === 20 &&
          cap.minWidth === 20 &&
          menusBound(cap, "minWidth") === "Kbd/min-width" &&
          menusValueOf("Kbd/min-width") === 20,
        `${at}: 20 tall and at least 20 wide, Kbd/height and Kbd/min-width (${cap.height}, ${cap.minWidth})`,
      );
      ok(
        cap.paddingLeft === 4 &&
          cap.paddingRight === 4 &&
          menusBound(cap, "paddingLeft") === "Kbd/padding/x" &&
          menusBound(cap, "paddingRight") === "Kbd/padding/x" &&
          menusValueOf("Kbd/padding/x") === 4,
        `${at}: 4 each side, Kbd/padding/x (${cap.paddingLeft}, ${cap.paddingRight})`,
      );
      ok(
        cap.cornerRadius === 4 &&
          menusBound(cap, "cornerRadius") === "Kbd/radius" &&
          menusValueOf("Kbd/radius") === plugin.KOZMOS_RADIUS.marker,
        `${at}: the marker radius, 4, Kbd/radius (${cap.cornerRadius})`,
      );
      ok(
        cap.strokeWeight === 1 &&
          menusBound(cap, "strokeWeight") === "Kbd/stroke/width" &&
          cap.strokeAlign === "INSIDE" &&
          cap.strokesIncludedInLayout === true &&
          cap.strokes.length === 1 &&
          boundVariableName(cap.strokes[0]) === "Border/Subtle",
        `${at}: a 1 edge in Border/Subtle, inside and laid out (${cap.strokeWeight}, ${cap.strokeAlign}, ${cap.strokesIncludedInLayout}, ${boundVariableName(cap.strokes[0])})`,
      );
      ok(
        cap.fills.length === 1 &&
          boundVariableName(cap.fills[0]) === "Colors/background/100",
        `${at}: on the muted fill, background/100 (${boundVariableName(cap.fills[0])})`,
      );
      const texts = cap.children.filter((child) => child.type === "TEXT");
      const text = texts[0];
      ok(
        texts.length === 1 && text.name === words[cap.name],
        `${at}: one text, ${words[cap.name]} (${texts.map((t) => t.name)})`,
      );
      if (!text) continue;
      ok(
        text.fontName.style === "Medium" &&
          text.fontSize === 12 &&
          text.lineHeight.value === 16 &&
          menusBound(text, "fontSize") === "Kbd/font-size" &&
          menusBound(text, "lineHeight") === "Kbd/line-height" &&
          boundVariableName(text.fills[0]) === "Colors/foreground/0",
        `${at}: 12/16 medium in the foreground (${text.fontName.style}, ${text.fontSize}/${text.lineHeight.value}, ${boundVariableName(text.fills[0])})`,
      );
      ok(
        Math.abs(cap.width - (text.width + 2 * 4 + 2 * 1)) < 0.01,
        `${at}: the cap hugs its key, 4 and the 1 edge each side (${cap.width} for ${text.width})`,
      );
    }
    // An Update redraws the same layers, once.
    await draw(value, component);
    ok(
      JSON.stringify(component.children.map((child) => child.name)) ===
        JSON.stringify(layers[value]),
      `${value}: an Update keeps ${layers[value].join(", ")} once`,
    );
  }
  const plus = painted.Combination && named(painted.Combination, "Plus");
  ok(
    plus &&
      plus.type === "TEXT" &&
      plus.characters === "+" &&
      boundVariableName(plus.fills[0]) === "Colors/foreground/400" &&
      plus.fontSize === 12 &&
      menusBound(plus, "fontSize") === "Kbd/font-size",
    `Combination: a "+" between the caps, 12 in the muted foreground (${plus && plus.characters}, ${plus && boundVariableName(plus.fills[0])})`,
  );
  ok(
    plus &&
      !isTypedGlyph(plus) &&
      isTypedGlyph({ type: "TEXT", name: "Label", characters: "+" }) &&
      isTypedGlyph({ type: "TEXT", name: "Plus", characters: "×" }),
    "Kbd's Plus is punctuation to the glyph rule; a plus elsewhere, or another glyph in Plus, still counts",
  );

  // The set's texts: Key Text in both variants, Modifier Text in the chord's.
  const variants = [];
  for (const value of kbdPainted ? plugin.KBD_KEYS : [])
    variants.push(await draw(value));
  const set = kbdPainted
    ? figma.combineAsVariants(variants, figma.currentPage)
    : figma.createComponent();
  set.name = "Kbd";
  if (kbdPainted) plugin.configureKbdProperties(set, freshStats());
  const definitions = set.componentPropertyDefinitions || {};
  const keyOf = (name, type) =>
    Object.keys(definitions).find(
      (key) => key.split("#")[0] === name && definitions[key].type === type,
    );
  const keyText = keyOf("Key Text", "TEXT");
  const modifierText = keyOf("Modifier Text", "TEXT");
  ok(
    keyText && modifierText,
    `Kbd: Key Text and Modifier Text properties (${Object.keys(definitions).join(", ")})`,
  );
  const boundTo = (variant, layer) => {
    const node = named(variant, layer);
    return (
      node &&
      node.componentPropertyReferences &&
      node.componentPropertyReferences.characters
    );
  };
  ok(
    variants.length === 2 &&
      variants.every((variant) => boundTo(variant, "Key Text") === keyText) &&
      boundTo(variants[1], "Modifier Text") === modifierText,
    "Kbd: Key Text drives each variant's key, Modifier Text the chord's first",
  );
  const textInSet = variants[0] && named(variants[0], "Key Text");
  ok(
    textInSet &&
      plugin.inferTextStyleKeyForComponentText(textInSet, set) ===
        plugin.textStyleKeyForText("XS", "Medium"),
    `Kbd: the audit expects Text / XS / Medium on its keys (${textInSet && plugin.inferTextStyleKeyForComponentText(textInSet, set)})`,
  );
  set.remove();

  // Registered everywhere a set is: the Core sequence, the actions the UI
  // sends, the Components page's layout and the audit's axes.
  const core = plugin.CORE_UPDATE_SEQUENCE.map(([name]) => name);
  const handlers = plugin.additionalComponentActionHandlers();
  const { names, axes } = expectations();
  for (const [name, slug] of [
    ["Kbd", "kbd"],
    ["ContextMenu", "context-menu"],
  ]) {
    ok(
      core.includes(name) &&
        ["build", "update", "rebuild"].every(
          (verb) => typeof handlers[`${verb}-${slug}`] === "function",
        ) &&
        names.includes(name) &&
        axes[name],
      `${name} is in the Core sequence, the UI's actions, the page's layout and the audit's axes`,
    );
  }
  ok(
    core.indexOf("ContextMenu") === core.indexOf("Menu") + 1,
    "ContextMenu updates right after Menu, whose painter it shares",
  );
}

section("Decision 152: Menu's and ContextMenu's items take External");
{
  // A plain item that opens a page draws Link's new-tab icon at its end, as
  // React's MenuItem and ContextMenuItem `external` do: the menu's glyph size,
  // 16 (Menu/icon/size, React's h-4 w-4), stroked 2 × 16 / 24 in the item's
  // colour (foreground/0, currentColor), after the words, which take the rest
  // of the row. Basic's and Submenu's second item carry it, hidden until the
  // set's External boolean, off by default; checkbox and radio items take no
  // `external`, so those variants carry none. ContextMenu is Menu's panel,
  // painted by the same painter.
  ok(
    typeof plugin.updateContextMenuVariant === "function",
    "ContextMenu's painter is reachable",
  );
  const painters = { Menu: plugin.updateMenuVariant };
  if (typeof plugin.updateContextMenuVariant === "function")
    painters.ContextMenu = plugin.updateContextMenuVariant;
  const draw = async (setName, value, component = figma.createComponent()) => {
    await painters[setName](component, {
      value,
      variableByName: menusTokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    return component;
  };
  const carriers = {
    Basic: true,
    Submenu: true,
    Checkbox: false,
    Radio: false,
  };
  const icons = (component) =>
    component.findAll((node) => node.name === "External Icon");
  for (const setName of Object.keys(painters)) {
    for (const value of plugin.MENU_CONTENT) {
      const at = `${setName} / ${value}`;
      const component = await draw(setName, value);
      const found = icons(component);
      if (!carriers[value]) {
        ok(found.length === 0, `${at}: no new-tab icon (${found.length})`);
        continue;
      }
      ok(found.length === 1, `${at}: one new-tab icon (${found.length})`);
      const icon = found[0];
      if (!icon) continue;
      const row = icon.parent;
      const order = row.children.map((child) => child.name);
      ok(
        row.name === "Menu Item 2" &&
          order[order.length - 1] === "External Icon" &&
          order.indexOf("Item 2 Text") === order.length - 2,
        `${at}: at the end of the second item, after its words (${row.name}: ${order.join(", ")})`,
      );
      const label = named(row, "Item 2 Text");
      ok(
        label && label.layoutGrow === 1,
        `${at}: the words take the rest of the row, so the icon sits at its end`,
      );
      ok(icon.visible === false, `${at}: hidden until External`);
      ok(
        icon.width === 16 &&
          icon.height === 16 &&
          menusBound(icon, "width") === "Menu/icon/size" &&
          menusBound(icon, "height") === "Menu/icon/size" &&
          menusValueOf("Menu/icon/size") === 16,
        `${at}: 16 square, Menu/icon/size (${icon.width}x${icon.height}, ${menusBound(icon, "width")})`,
      );
      const vectors = icon.findAll((node) => node.type === "VECTOR");
      ok(
        vectors.length === 1 &&
          vectors.every(
            (vector) =>
              (vector.fills || []).length === 0 &&
              boundVariableName(vector.strokes[0]) === "Colors/foreground/0" &&
              Math.abs(vector.strokeWeight - (2 * 16) / 24) < 0.001 &&
              vector.strokeCap === "ROUND" &&
              vector.strokeJoin === "ROUND",
          ),
        `${at}: one outline stroked 2 × 16 / 24, round, in the item's foreground/0 (${vectors.map((v) => `${boundVariableName(v.strokes[0])} ${v.strokeWeight}`)})`,
      );
      ok(
        icon.getSharedPluginData(plugin.RUN_NAMESPACE, "decorative") ===
          "label-names-it" &&
          icon.getSharedPluginData(plugin.RUN_NAMESPACE, "kind") ===
            "menu-external-icon",
        `${at}: decorative, a menu's new-tab icon`,
      );
      await draw(setName, value, component);
      ok(
        icons(component).length === 1,
        `${at}: an Update keeps one icon (${icons(component).length})`,
      );
    }
  }

  // The panel ContextMenu paints is Menu's, layer for layer.
  const shape = (node) => ({
    type: node.type,
    name: node.name,
    size: [node.width, node.height],
    visible: node.visible,
    characters: node.characters,
    bound: Object.entries(node.boundVariables || {})
      .filter(([, alias]) => alias && !Array.isArray(alias))
      .map(([field, alias]) => `${field}=${alias.id}`)
      .sort(),
    fills: (node.fills || []).map(boundVariableName),
    strokes: (node.strokes || []).map(boundVariableName),
    children: (node.children || []).map(shape),
  });
  for (const value of painters.ContextMenu ? plugin.MENU_CONTENT : []) {
    const menu = await draw("Menu", value);
    const context = await draw("ContextMenu", value);
    ok(
      JSON.stringify(shape(menu)) === JSON.stringify(shape(context)) &&
        context.name === `Content=${value}` &&
        context.getSharedPluginData(plugin.RUN_NAMESPACE, "component") ===
          "ContextMenu" &&
        menu.getSharedPluginData(plugin.RUN_NAMESPACE, "component") === "Menu",
      `ContextMenu / ${value}: Menu's panel, layer for layer, marked as ContextMenu's`,
    );
  }
  ok(
    JSON.stringify(
      plugin.expectedVariantAxesForComponentSetName("ContextMenu"),
    ) === JSON.stringify({ Content: plugin.MENU_CONTENT }),
    "ContextMenu's axis is Menu's Content",
  );

  // The set's External boolean, off by default, shows the icon in Basic and
  // Submenu; Menu's texts are kept. One configuration serves both sets.
  for (const setName of Object.keys(painters)) {
    const variants = [];
    for (const value of plugin.MENU_CONTENT)
      variants.push(await draw(setName, value));
    const set = figma.combineAsVariants(variants, figma.currentPage);
    set.name = setName;
    plugin.configureMenuProperties(set, freshStats());
    const definitions = set.componentPropertyDefinitions;
    const external = Object.keys(definitions).find(
      (key) =>
        key.split("#")[0] === "External" && definitions[key].type === "BOOLEAN",
    );
    ok(
      external && definitions[external].defaultValue === false,
      `${setName}: an External boolean, off by default`,
    );
    const shown = variants.flatMap(icons);
    ok(
      shown.length === 2 &&
        shown.every(
          (icon) =>
            icon.componentPropertyReferences &&
            icon.componentPropertyReferences.visible === external,
        ),
      `${setName}: External shows the icon in Basic and Submenu (${shown.length})`,
    );
    const texts = [
      "Label Text",
      "Item 1 Text",
      "Item 2 Text",
      "Item 3 Text",
      "Shortcut Text",
    ];
    ok(
      texts.every((name) =>
        Object.keys(definitions).some(
          (key) =>
            key.split("#")[0] === name && definitions[key].type === "TEXT",
        ),
      ),
      `${setName}: its texts are kept (${Object.keys(definitions)
        .map((key) => key.split("#")[0])
        .join(", ")})`,
    );
    set.remove();
  }
}

// GAP-158 (decision 132): Radio gains a Variant axis, Default, Card and Tile,
// React's RadioGroupItem `variant`. A card is a box 240 wide, 12 in: the
// Media over the ring and a column of the title and the description; a tile
// a box 112 wide, at least 96 tall, its Media, title and description centred,
// and, chosen, a check badge 8 in from its top-end corner. Chosen, the edge is
// theme 600 and 2 wide (React's 1px border and its 1px outline inside), and
// the ring's dot or the tile's check shows: never colour alone. A variant
// from before the axis parses as Default, so Update renames it in place.
section("GAP-158: Radio draws cards and tiles");
{
  const tokens = payloadVariables([...variableByName.keys()]);
  const axes = plugin.expectedVariantAxesForComponentSetName("Radio") || {};
  ok(
    JSON.stringify(axes.Variant) ===
      JSON.stringify(["Default", "Card", "Tile"]) &&
      JSON.stringify(axes.Checked) ===
        JSON.stringify(["Unchecked", "Checked"]) &&
      JSON.stringify(axes.State) ===
        JSON.stringify(["Default", "Disabled", "Error"]),
    `Radio declares Checked, State and Variant, Default first (${JSON.stringify(axes)})`,
  );
  const combinations =
    typeof plugin.radioVariantCombinations === "function"
      ? plugin.radioVariantCombinations()
      : [];
  ok(
    combinations.length === 18 &&
      new Set(combinations.map((c) => plugin.radioVariantKey(c))).size === 18,
    `each Variant at each Checked and State: 18 variants (${combinations.length})`,
  );
  const parsed = [
    "Checked=Checked, State=Default",
    "Checked=Unchecked, State=Error, Variant=Tile",
    "Checked=Checked, State=Default, Variant=Chip",
  ].map((name) => plugin.parseRadioVariantName(name));
  ok(
    JSON.stringify(parsed) ===
      JSON.stringify([
        { variant: "Default", checked: "Checked", state: "Default" },
        { variant: "Tile", checked: "Unchecked", state: "Error" },
        null,
      ]),
    `a variant from before the axis parses as Default; an unknown one as none (${JSON.stringify(parsed)})`,
  );

  const drawRadio = async (variant, checked, state) =>
    withAutoLayout(async () => {
      const component = figma.createComponent();
      await plugin.updateRadioVariant(component, {
        variant,
        checked,
        state,
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      });
      return component;
    });

  for (const variant of ["Card", "Tile"]) {
    const chosen = await drawRadio(variant, "Checked", "Default");
    const open = await drawRadio(variant, "Unchecked", "Default");
    const wrong = await drawRadio(variant, "Checked", "Error");
    const off = await drawRadio(variant, "Unchecked", "Disabled");
    const tile = variant === "Tile";
    ok(
      chosen.name === `Checked=Checked, State=Default, Variant=${variant}` &&
        chosen.width === (tile ? 112 : 240) &&
        chosen.paddingLeft === 12 &&
        chosen.paddingTop === 12 &&
        chosen.cornerRadius === 20 &&
        (!tile || chosen.height >= 96) &&
        boundVariableName(chosen.fills[0]) === "Colors/background/0",
      `${variant}: a box ${tile ? 112 : 240} wide, 12 in, the container corner, on background/0 (${chosen.name}, ${chosen.width}x${chosen.height}, pad ${chosen.paddingLeft}, r${chosen.cornerRadius})`,
    );
    ok(
      boundVariableName(chosen.strokes[0]) === "Colors/theme/600" &&
        chosen.strokeWeight === 2 &&
        chosen.strokeAlign === "INSIDE" &&
        boundVariableName(open.strokes[0]) === "Border/Subtle" &&
        open.strokeWeight === 1 &&
        boundVariableName(wrong.strokes[0]) === "Colors/emotional/danger/600",
      `${variant}: the edge is Border/Subtle at 1, theme 600 at 2 inside when chosen, danger 600 on error (${boundVariableName(open.strokes[0])} ${open.strokeWeight}; ${boundVariableName(chosen.strokes[0])} ${chosen.strokeWeight} ${chosen.strokeAlign}; ${boundVariableName(wrong.strokes[0])})`,
    );
    ok(
      off.opacity === 0.5 && chosen.opacity === 1,
      `${variant}: disabled, the whole box is at half (${off.opacity})`,
    );
    const title = named(chosen, "Label Text");
    const description = named(chosen, "Description Text");
    const media = named(chosen, "Media");
    ok(
      title &&
        title.type === "TEXT" &&
        description &&
        description.type === "TEXT" &&
        description.visible === false &&
        media &&
        chosen.children[0] === media,
      `${variant}: the Media first, then the title and a hidden description (${chosen.children.map((c) => c.name).join(", ")})`,
    );
    if (tile) {
      const badge = named(chosen, "Check Badge");
      ok(
        badge &&
          badge.layoutPositioning === "ABSOLUTE" &&
          badge.width === 20 &&
          badge.x === 112 - 8 - 20 &&
          badge.y === 8 &&
          boundVariableName(badge.fills[0]) === plugin.THEME_FILL.name &&
          !named(open, "Check Badge"),
        `Tile: chosen, a 20 check badge 8 in from the top-end corner, out of the flow, on the theme fill; none unchosen (${badge && `${badge.x},${badge.y} ${badge.width} ${badge.layoutPositioning} ${boundVariableName(badge.fills[0])}`})`,
      );
      ok(
        chosen.primaryAxisAlignItems === "CENTER" &&
          chosen.counterAxisAlignItems === "CENTER" &&
          !named(chosen, "Radio Control"),
        `Tile: everything centred, and no ring (${chosen.counterAxisAlignItems})`,
      );
    } else {
      const body = named(chosen, "Body");
      const ring = body && named(body, "Radio Control");
      ok(
        body &&
          ring &&
          body.children[0] === ring &&
          named(ring, "Radio Dot") &&
          !named(named(open, "Body"), "Radio Dot") &&
          body.itemSpacing === 8 &&
          title.parent &&
          title.parent.name === "Text",
        `Card: the Body is the ring, its dot when chosen, and the title's column, 8 apart (${body && body.children.map((c) => c.name).join(", ")})`,
      );
    }
  }

  const oldNames = [];
  for (const checked of ["Unchecked", "Checked"]) {
    for (const state of ["Default", "Disabled", "Error"]) {
      oldNames.push(`Checked=${checked}, State=${state}`);
    }
  }
  const replay = await withAutoLayout(() =>
    replayUpdate("Radio", oldNames, "updateRadioComponent"),
  );
  ok(
    replay.result.updated === true &&
      replay.result.componentSetId === replay.setId &&
      replay.result.variantsUpdated === 6 &&
      replay.result.variantsCreated === 12 &&
      replay.liveSet.children.length === 18 &&
      new Set(replay.names).size === 18,
    `Update keeps the set and its 6 variants, and adds the 12 cards and tiles (${replay.result.variantsUpdated} updated, ${replay.result.variantsCreated} created, ${replay.liveSet.children.length} in all)`,
  );
  ok(
    replay.kept.every(
      (variant, i) =>
        variant && variant.name === `${oldNames[i]}, Variant=Default`,
    ),
    `each of the 6 keeps its node id and is renamed Variant=Default (${replay.kept.map((v) => (v ? v.name : "gone")).join("; ")})`,
  );
  const radioOverlaps = overlapsIn(replay.liveSet);
  ok(
    radioOverlaps.length === 0 &&
      topLeftOf(replay.liveSet).name ===
        "Checked=Unchecked, State=Default, Variant=Default",
    `the laid-out set has no two variants overlapping, its top-left the default (${topLeftOf(replay.liveSet).name}; ${radioOverlaps.slice(0, 2).join("; ")})`,
  );
  const definitions = replay.liveSet.componentPropertyDefinitions;
  const propertyNamed = (name, type) =>
    Object.keys(definitions).find(
      (key) => key.split("#")[0] === name && definitions[key].type === type,
    );
  const media = propertyNamed("Show Media", "BOOLEAN");
  const shown = propertyNamed("Show Description", "BOOLEAN");
  const words = propertyNamed("Description Text", "TEXT");
  const drivenBy = (key, field) =>
    replay.liveSet.findAll(
      (node) =>
        node.componentPropertyReferences &&
        node.componentPropertyReferences[field] === key,
    );
  ok(
    media &&
      definitions[media].defaultValue === true &&
      drivenBy(media, "visible").length === 12 &&
      drivenBy(media, "visible").every((node) => node.name === "Media"),
    `Show Media, on by default, shows each card's and tile's Media (${media}: ${drivenBy(media, "visible").length})`,
  );
  ok(
    shown &&
      words &&
      definitions[shown].defaultValue === false &&
      drivenBy(words, "characters").length === 18 &&
      drivenBy(shown, "visible").length === 24,
    `Description Text writes all 18 descriptions, and Show Description, off, shows them: the 6 Default rows with their texts and the 12 boxes' texts (${drivenBy(words, "characters").length} texts, ${drivenBy(shown, "visible").length} layers)`,
  );
  ok(
    propertyNamed("Label Text", "TEXT") &&
      propertyNamed("Focus Visible", "BOOLEAN"),
    `Label Text and Focus Visible are kept (${Object.keys(definitions)
      .map((key) => key.split("#")[0])
      .join(", ")})`,
  );
}

// GAP-162 (decision 132): Checkbox, Switch and a Default radio draw their
// label row and, under it, a description; Switch can say On or Off beside
// its track. Each is a column at least 44 tall (X/height/default, its
// minimum now): the Label Row, the control, the State Label (Switch) and the
// label, 8 apart (X/gap); then the Description Row, indented to start under
// the label. Hidden, as their booleans are off by default, the control draws
// as it did: 176 by 44, centred.
section("GAP-162: the controls draw a description, and Switch its state");
{
  const tokens = payloadVariables([
    ...variableByName.keys(),
    ...["Checkbox", "Radio", "Switch"].flatMap((kind) => [
      `${kind}/height/default`,
      `${kind}/gap`,
    ]),
  ]);
  const drawControl = async (fn, props) =>
    withAutoLayout(async () => {
      const component = figma.createComponent();
      await plugin[fn](
        component,
        Object.assign(
          {
            variableByName: tokens.variableByName,
            fonts: FONTS,
            stats: freshStats(),
          },
          props,
        ),
      );
      return component;
    });
  const kinds = [
    ["Checkbox", "updateCheckboxVariant", "Checkbox Control", 28],
    ["Radio", "updateRadioVariant", "Radio Control", 28],
    ["Switch", "updateSwitchVariant", "Switch Track", 52],
  ];
  for (const [kind, fn, controlName, indent] of kinds) {
    const component = await drawControl(fn, {
      checked: "Checked",
      state: "Default",
    });
    const row = named(component, "Label Row");
    const descriptionRow = named(component, "Description Row");
    const description =
      descriptionRow && named(descriptionRow, "Description Text");
    ok(
      component.layoutMode === "VERTICAL" &&
        component.width === 176 &&
        component.height === 44 &&
        component.minHeight === 44 &&
        menusBound(component, "minHeight") === `${kind}/height/default` &&
        menusBound(component, "height") === null &&
        component.primaryAxisAlignItems === "CENTER",
      `${kind}: a column 176 wide, at least 44 (${kind}/height/default) and 44 with its description hidden, centred (${component.layoutMode} ${component.width}x${component.height}, min ${menusBound(component, "minHeight")}, height ${menusBound(component, "height")})`,
    );
    ok(
      row &&
        row.children[0] &&
        row.children[0].name === controlName &&
        row.children[row.children.length - 1].name === "Label Text" &&
        row.itemSpacing === 8 &&
        menusBound(row, "itemSpacing") === `${kind}/gap` &&
        row.counterAxisAlignItems === "CENTER",
      `${kind}: the Label Row is the control then the label, 8 apart (${kind}/gap), centred on each other (${row && row.children.map((c) => c.name).join(", ")})`,
    );
    ok(
      descriptionRow &&
        component.children[1] === descriptionRow &&
        descriptionRow.paddingLeft === indent &&
        descriptionRow.visible === false &&
        description &&
        description.type === "TEXT" &&
        description.textAutoResize === "HEIGHT" &&
        boundVariableName(description.fills[0]) === "Colors/foreground/400" &&
        description.fontSize === 14,
      `${kind}: the Description Row starts ${indent} in, under the label; its text 14/20 in foreground/400, wrapping; hidden until shown (${descriptionRow && descriptionRow.paddingLeft}, ${description && boundVariableName(description.fills[0])})`,
    );
  }

  const on = await drawControl("updateSwitchVariant", {
    checked: "Checked",
    state: "Default",
  });
  const offSwitch = await drawControl("updateSwitchVariant", {
    checked: "Unchecked",
    state: "Default",
  });
  const stateOf = (component) => {
    const row = named(component, "Label Row");
    return row ? named(row, "State Label") : null;
  };
  ok(
    stateOf(on) &&
      stateOf(on).characters === "On" &&
      stateOf(offSwitch).characters === "Off" &&
      named(on, "Label Row") &&
      named(on, "Label Row").children[1] === stateOf(on) &&
      stateOf(on).visible === false &&
      boundVariableName(stateOf(on).fills[0]) === "Colors/foreground/400" &&
      on.itemSpacing === 0,
    `Switch: the State Label sits between the track and the label, On or Off by Checked, muted, hidden until shown; the column has no gap (${stateOf(on) && stateOf(on).characters}/${stateOf(offSwitch) && stateOf(offSwitch).characters}, gap ${on.itemSpacing})`,
  );

  for (const [kind, update] of [
    ["Checkbox", "updateCheckboxComponent"],
    ["Switch", "updateSwitchComponent"],
  ]) {
    const names = [];
    for (const checked of ["Unchecked", "Checked"]) {
      for (const state of ["Default", "Disabled", "Error"]) {
        names.push(`Checked=${checked}, State=${state}`);
      }
    }
    const replay = await withAutoLayout(() =>
      replayUpdate(kind, names, update),
    );
    const definitions = replay.liveSet.componentPropertyDefinitions;
    const propertyNamed = (name, type) =>
      Object.keys(definitions).find(
        (key) => key.split("#")[0] === name && definitions[key].type === type,
      );
    const shown = propertyNamed("Show Description", "BOOLEAN");
    const words = propertyNamed("Description Text", "TEXT");
    const state = propertyNamed("Show State Label", "BOOLEAN");
    const drivenBy = (key, field) =>
      key
        ? replay.liveSet.findAll(
            (node) =>
              node.componentPropertyReferences &&
              node.componentPropertyReferences[field] === key,
          )
        : [];
    ok(
      replay.kept.every((variant, i) => variant && variant.name === names[i]) &&
        replay.liveSet.children.length === 6,
      `${kind}: Update keeps its 6 variants, ids and names (${replay.names.join("; ")})`,
    );
    ok(
      shown &&
        words &&
        definitions[shown].defaultValue === false &&
        drivenBy(shown, "visible").length === 6 &&
        drivenBy(shown, "visible").every(
          (node) => node.name === "Description Row",
        ) &&
        drivenBy(words, "characters").length === 6,
      `${kind}: Show Description, off, shows each variant's Description Row, and Description Text writes it (${drivenBy(shown, "visible").length} rows, ${drivenBy(words, "characters").length} texts)`,
    );
    ok(
      kind === "Switch"
        ? state &&
            definitions[state].defaultValue === false &&
            drivenBy(state, "visible").length === 6 &&
            drivenBy(state, "visible").every(
              (node) => node.name === "State Label",
            )
        : !state,
      `${kind}: ${kind === "Switch" ? "Show State Label, off, shows each variant's State Label" : "no Show State Label"} (${state || "none"}: ${drivenBy(state, "visible").length})`,
    );
  }
}

// --- Decision 132's fields: Search's clear, NumberInput's unit, Slider's readout ---

section(
  "Search clears, NumberInput takes a unit, Slider's readout stays (GAP-161, GAP-098, GAP-163)",
);
{
  const tokens = payloadVariables(
    (plugin.COMPONENT_FLOAT_TOKENS || [])
      .map((token) => token.name)
      .concat([...variableByName.keys()]),
  );
  const draw = async (fn, props) => {
    const component = figma.createComponent();
    await plugin[fn](
      component,
      Object.assign({}, props, {
        variableByName: tokens.variableByName,
        fonts: FONTS,
        stats: freshStats(),
      }),
    );
    return component;
  };
  const child = (node, name) =>
    (node && node.children ? node.children : []).find(
      (each) => each.name === name,
    ) || null;
  const boundFloat = (node, field) => {
    const alias = node && node.boundVariables && node.boundVariables[field];
    return alias ? String(alias.id).replace(/^VariableID:/, "") : null;
  };
  const propertyNamed = (set, base, type) =>
    Object.keys(set.componentPropertyDefinitions || {}).find(
      (key) =>
        key.split("#")[0] === base &&
        set.componentPropertyDefinitions[key].type === type,
    ) || null;
  const drivenBy = (set, property, field) =>
    set.findAll(
      (node) =>
        node.componentPropertyReferences &&
        node.componentPropertyReferences[field] === property,
    );
  const combine = async (name, variants, configure) => {
    const set = figma.combineAsVariants(variants, figma.currentPage);
    set.name = name;
    await plugin[configure](set, freshStats());
    return set;
  };

  // Search (GAP-161) ---------------------------------------------------------
  const searches = [];
  for (const state of plugin.SEARCH_STATES)
    searches.push(
      await draw("updateSearchVariant", { state, status: "Default" }),
    );
  const field = child(searches[0], "Search Field");
  const clear = child(field, "Clear Button");
  const clearIcon = child(clear, "Clear Icon");
  ok(
    clear &&
      clear.type === "FRAME" &&
      clear.width === 44 &&
      clear.height === 44 &&
      clear.layoutPositioning === "ABSOLUTE" &&
      clear.x === field.width - 44 &&
      clear.constraints.horizontal === "MAX" &&
      clear.fills.length === 0 &&
      clear.strokes.length === 0 &&
      clear.visible === false &&
      boundFloat(clear, "width") === "Search/field/height" &&
      boundFloat(clear, "height") === "Search/field/height",
    `Search: a Clear Button at the field's end, 44 square and bound to the field's height, absolute and held to the end, no fill at rest (decision 164), hidden until Show Clear (${clear && `${clear.width}x${clear.height} at x ${clear.x} of ${field.width}, ${clear.layoutPositioning}, fills ${clear.fills.length}, visible ${clear.visible}, ${boundFloat(clear, "width")}`})`,
  );
  ok(
    clearIcon &&
      clearIcon.type === "INSTANCE" &&
      /x-close/.test(
        clearIcon.mainComponent ? clearIcon.mainComponent.name : "",
      ) &&
      clearIcon.width === 16,
    `Search: the clear is the 16 x-close (${clearIcon && clearIcon.mainComponent && clearIcon.mainComponent.name}, ${clearIcon && clearIcon.width})`,
  );
  const again = await draw("updateSearchVariant", {
    state: "Default",
    status: "Default",
  });
  await plugin.updateSearchVariant(again, {
    state: "Default",
    status: "Default",
    variableByName: tokens.variableByName,
    fonts: FONTS,
    stats: freshStats(),
  });
  ok(
    child(again, "Search Field").children.filter(
      (each) => each.name === "Clear Button",
    ).length === 1,
    "Search: an Update draws one Clear Button, never a second",
  );
  again.remove();
  const searchSet = await combine(
    "Search",
    searches,
    "configureSearchProperties",
  );
  const showClear = propertyNamed(searchSet, "Show Clear", "BOOLEAN");
  const clears = showClear ? drivenBy(searchSet, showClear, "visible") : [];
  ok(
    showClear &&
      searchSet.componentPropertyDefinitions[showClear].defaultValue ===
        false &&
      clears.length === searches.length &&
      clears.every((node) => node.name === "Clear Button"),
    `Search: a Show Clear boolean, off by default, shows each variant's Clear Button and nothing else (${showClear}, ${clears.length} of ${searches.length})`,
  );
  searchSet.remove();

  // NumberInput (GAP-098) ------------------------------------------------------
  const numbers = [];
  for (const steppers of plugin.NUMBER_INPUT_STEPPERS)
    numbers.push(
      await draw("updateNumberInputVariant", {
        state: "Default",
        status: "Default",
        steppers,
      }),
    );
  const unitFacts = numbers.map((variant) => {
    const field = child(variant, "NumberInput Field");
    const slot = child(field, "NumberInput Value Slot");
    const names = slot ? slot.children.map((each) => each.name) : [];
    const unit = child(slot, "Unit Text");
    return { field, slot, names, unit };
  });
  ok(
    unitFacts.every(
      ({ names, unit }) =>
        unit &&
        unit.type === "TEXT" &&
        unit.characters === "m" &&
        unit.visible === false &&
        names.indexOf("Unit Text") === names.length - 1 &&
        names.indexOf("Value Text") < names.indexOf("Unit Text") &&
        unit.layoutSizingHorizontal === "HUG" &&
        boundVariableName(unit.fills[0]) === "Colors/foreground/400",
    ),
    `NumberInput: a Unit Text "m" in the value slot after the value, before the increment stepper, hugging its words in the field's muted foreground (foreground/400), hidden until Show Unit (${unitFacts
      .map(
        ({ names, unit }) =>
          `${names.join(" > ")}: ${unit && `"${unit.characters}" ${unit.layoutSizingHorizontal} ${boundVariableName(unit.fills[0])} visible ${unit.visible}`}`,
      )
      .join("; ")})`,
  );
  ok(
    unitFacts.every(({ field, slot }) => {
      const order = field.children.map((each) => each.name);
      return (
        order.indexOf("NumberInput Value Slot") <
          (order.indexOf("Increment Stepper") === -1
            ? Infinity
            : order.indexOf("Increment Stepper")) && slot.itemSpacing === 4
      );
    }),
    "NumberInput: the slot, and the unit in it, come before the increment stepper, 4 after the value",
  );
  {
    const kept = numbers[0];
    const unit = child(
      child(child(kept, "NumberInput Field"), "NumberInput Value Slot"),
      "Unit Text",
    );
    if (unit) unit.characters = "km";
    await plugin.updateNumberInputVariant(kept, {
      state: "Default",
      status: "Default",
      steppers: "True",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const redrawn = child(
      child(child(kept, "NumberInput Field"), "NumberInput Value Slot"),
      "Unit Text",
    );
    ok(
      redrawn && redrawn.characters === "km",
      `NumberInput: an Update keeps the unit's words (${redrawn && redrawn.characters})`,
    );
  }
  const numberSet = await combine(
    "NumberInput",
    numbers,
    "configureNumberInputProperties",
  );
  const showUnit = propertyNamed(numberSet, "Show Unit", "BOOLEAN");
  const unitText = propertyNamed(numberSet, "Unit Text", "TEXT");
  const shownUnits = showUnit ? drivenBy(numberSet, showUnit, "visible") : [];
  const wordedUnits = unitText
    ? drivenBy(numberSet, unitText, "characters")
    : [];
  ok(
    showUnit &&
      numberSet.componentPropertyDefinitions[showUnit].defaultValue === false &&
      unitText &&
      numberSet.componentPropertyDefinitions[unitText].defaultValue === "m" &&
      shownUnits.length === numbers.length &&
      wordedUnits.length === numbers.length &&
      shownUnits.concat(wordedUnits).every((node) => node.name === "Unit Text"),
    `NumberInput: Show Unit (off) and Unit Text ("m") drive each variant's Unit Text and nothing else (${showUnit}, ${unitText}; ${shownUnits.length} and ${wordedUnits.length} of ${numbers.length})`,
  );
  numberSet.remove();

  // Slider (GAP-163) -------------------------------------------------------------
  const sliders = [];
  for (const type of plugin.SLIDER_TYPES)
    sliders.push(
      await draw("updateSliderVariant", {
        state: "Default",
        status: "Default",
        type,
      }),
    );
  const sliderFacts = sliders.map((variant) => {
    const row = child(variant, "Slider Row");
    const names = row ? row.children.map((each) => each.name) : [];
    return {
      variant,
      row,
      names,
      control: child(row, "Slider Control"),
      readout: child(row, "Value Text"),
    };
  });
  ok(
    sliderFacts.every(
      ({ variant, row, names, control }) =>
        row &&
        row.layoutMode === "HORIZONTAL" &&
        row.counterAxisAlignItems === "CENTER" &&
        row.height === 44 &&
        row.layoutSizingHorizontal === "FILL" &&
        JSON.stringify(names) ===
          JSON.stringify(["Slider Control", "Value Text"]) &&
        !child(variant, "Slider Control") &&
        control.layoutSizingHorizontal === "FILL" &&
        control.layoutGrow === 1 &&
        control.height === 44 &&
        boundFloat(control, "width") === null &&
        boundFloat(child(control, "Slider Track"), "width") === null,
    ),
    `Slider: a Slider Row across the set's width, the control filling what the readout leaves (unbound width, grow 1) and the readout at its end (${sliderFacts
      .map(
        ({ row, names, control }) =>
          `${names.join(" > ")} ${row && row.layoutSizingHorizontal}; control ${control && `${control.layoutSizingHorizontal} grow ${control.layoutGrow} w-bound ${boundFloat(control, "width")}`}`,
      )
      .join("; ")})`,
  );
  ok(
    sliderFacts.every(
      ({ readout }) =>
        readout &&
        readout.type === "TEXT" &&
        readout.characters === "50%" &&
        readout.visible === false &&
        readout.layoutSizingHorizontal === "HUG" &&
        readout.fontSize === 14 &&
        boundVariableName(readout.fills[0]) === "Colors/foreground/400",
    ),
    `Slider: the readout, "50%" at 14 in the muted foreground (foreground/400), hugging its words, hidden until Show Value (${sliderFacts
      .map(
        ({ readout }) =>
          readout &&
          `"${readout.characters}" ${readout.fontSize} ${boundVariableName(readout.fills[0])} ${readout.layoutSizingHorizontal} visible ${readout.visible}`,
      )
      .join("; ")})`,
  );
  {
    // A Slider drawn before the row: its control is the component's own
    // child. Update moves that node into the row, so it keeps its id.
    const legacy = sliders[0];
    const row = child(legacy, "Slider Row");
    const control =
      child(row, "Slider Control") || child(legacy, "Slider Control");
    legacy.appendChild(control);
    if (row) row.remove();
    await plugin.updateSliderVariant(legacy, {
      state: "Default",
      status: "Default",
      type: "Single",
      variableByName: tokens.variableByName,
      fonts: FONTS,
      stats: freshStats(),
    });
    const moved = child(child(legacy, "Slider Row"), "Slider Control");
    ok(
      moved === control &&
        !child(legacy, "Slider Control") &&
        legacy.findAll((node) => node.name === "Slider Control").length === 1,
      "Slider: an Update over a set drawn before the row moves its control into the row, the same node, and draws no second",
    );
  }
  const sliderSet = await combine(
    "Slider",
    sliders,
    "configureSliderProperties",
  );
  const showValue = propertyNamed(sliderSet, "Show Value", "BOOLEAN");
  const valueText = propertyNamed(sliderSet, "Value Text", "TEXT");
  const shownValues = showValue
    ? drivenBy(sliderSet, showValue, "visible")
    : [];
  const wordedValues = valueText
    ? drivenBy(sliderSet, valueText, "characters")
    : [];
  ok(
    showValue &&
      sliderSet.componentPropertyDefinitions[showValue].defaultValue ===
        false &&
      valueText &&
      sliderSet.componentPropertyDefinitions[valueText].defaultValue ===
        "50%" &&
      shownValues.length === sliders.length &&
      wordedValues.length === sliders.length &&
      shownValues
        .concat(wordedValues)
        .every((node) => node.name === "Value Text"),
    `Slider: Show Value (off) and Value Text ("50%") drive each variant's readout and nothing else (${showValue}, ${valueText}; ${shownValues.length} and ${wordedValues.length} of ${sliders.length})`,
  );
  sliderSet.remove();
}

// --- Summary ---------------------------------------------------------------------

console.log(
  `\n${passes} passed, ${failures} failed — ${path.relative(ROOT, PLUGIN)}`,
);
process.exit(failures === 0 ? 0 : 1);
