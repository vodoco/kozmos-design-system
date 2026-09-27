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
import fs from "node:fs";
import path from "node:path";
import {
  FONTS,
  MockNode,
  boundPaintOpacityDrops,
  boundVariableName,
  createFigmaMock,
  framesLargerThanAsked,
  freshStats,
  hexOf,
  loadPlugin,
  mockComponentSet,
  mockIconComponent,
  mockVariables,
  payloadVariables,
  resetSearchStats,
  searchStats,
} from "./lib/figma-plugin-harness.mjs";

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
  ]) {
    icons.appendChild(mockIconComponent(name));
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
  "Colors/theme/700",
  "Colors/emotional/alert/900",
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
    ok(
      vector && boundVariableName(vector.strokes[0]) === "Colors/theme/500",
      "theme: the icon in the theme's colour",
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
  const pin = contract.locationPin;
  ok(
    typeof plugin.locationPinVariantCombinations === "function" &&
      plugin.locationPinVariantCombinations().length === 5 * 3 * 9,
    "135 variants: five states by three sizes by nine tints",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("LocationPin"),
      ) ===
        JSON.stringify({
          State: plugin.LOCATION_PIN_STATES,
          Size: plugin.LOCATION_PIN_SIZES,
          Tint: plugin.CATEGORY_TINTS,
        }),
    "the set expects State, Size and Tint",
  );
  ok(
    typeof plugin.parseLocationPinVariantName === "function" &&
      JSON.stringify(
        plugin.parseLocationPinVariantName("State=Selected, Size=Lg"),
      ) === JSON.stringify({ state: "Selected", size: "Lg", tint: "Theme" }),
    "a pre-Tint variant name reads as the theme's",
  );

  async function paint(state, size, tint) {
    const component = figma.createComponent();
    const stats = freshStats();
    await plugin.updateLocationPinVariant(component, {
      props: { state, size, tint },
      variableByName,
      fonts: FONTS,
      stats,
    });
    return { component, stats };
  }

  if (typeof plugin.updateLocationPinVariant === "function") {
    const { component, stats } = await paint("Default", "Md", "Red");
    ok(
      component.name === "State=Default, Size=Md, Tint=Red",
      `variant named by three axes (got "${component.name}")`,
    );
    const marker = named(component, "Pin Marker");
    ok(marker, "a Pin Marker");
    if (marker) {
      ok(
        marker.width === pin.sizes.default.diameter,
        `the md marker is ${pin.sizes.default.diameter} (got ${marker.width})`,
      );
      ok(
        boundVariableName(marker.fills[0]) === "Category/Fill/Red",
        "tinted: the marker is the category's fill",
      );
    }
    const number = named(component, "Number Text");
    ok(
      number && boundVariableName(number.fills[0]) === "Category/OnFill/Red",
      "tinted: the number is the fill's ink",
    );
    ok(
      stats.warnings.length === 0,
      `no warnings (${stats.warnings.join(" | ")})`,
    );
  }

  if (typeof plugin.updateLocationPinVariant === "function") {
    const { component } = await paint("Featured", "Md", "Red");
    const marker = named(component, "Pin Marker");
    ok(
      marker &&
        boundVariableName(marker.fills[0]) === "Colors/emotional/alert/900",
      "featured: keeps the alert colour under a tint",
    );
    const number = named(component, "Number Text");
    ok(
      number && boundVariableName(number.fills[0]) === "Colors/foreground/1000",
      "featured: the number stays white",
    );
  }

  if (typeof plugin.updateLocationPinVariant === "function") {
    const { component } = await paint("OffFloor", "Sm", "Blue");
    const marker = named(component, "Pin Marker");
    ok(
      marker &&
        boundVariableName(marker.fills[0]) === "Colors/background/0" &&
        boundVariableName(marker.strokes[0]) === "Category/Fill/Blue",
      "off the floor: a hollow ring stroked in the category's fill",
    );
    const number = named(component, "Number Text");
    ok(
      number && boundVariableName(number.fills[0]) === "Colors/foreground/0",
      "off the floor: the number in the foreground on the white disc (Olcay, 2026-09-21)",
    );
  }

  if (typeof plugin.updateLocationPinVariant === "function") {
    const { component } = await paint("Disabled", "Lg", "Green");
    const marker = named(component, "Pin Marker");
    ok(
      component.opacity === 0.5 &&
        marker &&
        boundVariableName(marker.fills[0]) === "Category/Fill/Green",
      "disabled: the category's fill at 50 %",
    );
  }

  if (typeof plugin.updateLocationPinVariant === "function") {
    const { component } = await paint("Selected", "Md", "Theme");
    const marker = named(component, "Pin Marker");
    ok(
      marker &&
        boundVariableName(marker.fills[0]) === "Colors/theme/700" &&
        marker.width === pin.sizes.default.diameter + 8,
      "theme: the theme's colour, and a selected pin grows by 8",
    );
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
    ok(
      boundVariableName(component.strokes[0]) === "Colors/theme/500",
      "theme: the border in the theme's colour",
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
  };
  ok(
    [...writersFound].sort().join(",") ===
      Object.keys(reaches).sort().join(","),
    `the painters that write inside a nested instance are the ones named here (found: ${[...writersFound].join(", ")})`,
  );
  for (const [painter, [inside, writer]] of Object.entries(reaches)) {
    ok(
      Boolean(map) && (map[inside] || []).includes(writer),
      `${writer} is listed as writing inside ${inside} (${painter})`,
    );
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
// pending connector is the border role at its own strength.
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
    boundVariableName(completed.fills[0]) === "Colors/theme/600" &&
      boundVariableName(completed.strokes[0]) === "Colors/theme/600",
    `a completed step is theme/600, ring and fill (${boundVariableName(completed.fills[0])}, ${boundVariableName(completed.strokes[0])})`,
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
  for (const definition of scan.KOSMOS_ICON_DEFINITIONS) {
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

// --- POIResultCard's action row ------------------------------------------------------

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
    buttons.length === 2 &&
      buttons[0].name === "Primary Action" &&
      buttons[1].name === "Secondary Action",
    `two actions, primary first (${buttons.map((b) => b.name).join(", ")})`,
  );
  ok(
    buttons.length === 2 &&
      boundVariableName(buttons[0].fills[0]) === "Colors/theme/500" &&
      boundVariableName(buttons[1].fills[0]) === "Surface/0" &&
      buttons[1].strokeWeight === 1,
    `the primary is filled and the secondary is outlined (${buttons.map((b) => boundVariableName(b.fills[0])).join(", ")})`,
  );
  // The logo and copy must have moved WITH the row, not been left on the card.
  ok(
    resultRow && named(resultRow, "Logo Slot") && named(resultRow, "Result Copy"),
    "the logo and copy live in the result row",
  );
  // named() is findOne, so it reaches descendants: the card must not hold the
  // logo as its OWN child, which is what moving it into the row means.
  ok(
    !component.children.some((child) => child.name === "Logo Slot"),
    `and the card holds only the two rows (${component.children.map((c) => c.name).join(", ")})`,
  );
}

// --- Curated Icons ------------------------------------------------------------------

// Every tint an icon slot carries is an override keyed through its icon
// source's layer id, so an Update that draws a source again drops them: until
// 2026-09-22 every Curated Icons → Update did, for every set but the four it
// repaints. A second run keeps every source layer, id for id; a source that is
// no longer right is drawn again and said so; and the taxonomy's symbols are
// drawn from the SVGs the plugin carries, as filled shapes that scale.
section("Curated Icons");
{
  const library = new Map();
  const iconsPage = new MockNode("PAGE", "Icons");
  const icons = loadPlugin({
    pluginPath: PLUGIN,
    figma: createFigmaMock({ pages: [iconsPage], library }),
  });
  const definitions = icons.KOSMOS_ICON_DEFINITIONS;
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

  const first = await icons.syncIconSourceLibrary();
  ok(
    first.created === definitions.length &&
      first.drawn === 0 &&
      first.failed === 0,
    `a first run makes all ${definitions.length}, importing every one and drawing none (${JSON.stringify({ created: first.created, drawn: first.drawn, failed: first.failed })}; ${first.warnings.slice(0, 2).join(" | ")})`,
  );
  const before = sourceIds();
  const second = await icons.syncIconSourceLibrary();
  const after = sourceIds();
  ok(
    second.sourcesKept === definitions.length &&
      second.sourcesReplaced === 0 &&
      after.size === definitions.length &&
      [...after].every(([name, ids]) => ids && before.get(name) === ids),
    `a second run keeps every source layer, id for id (kept ${second.sourcesKept}, drawn again ${second.sourcesReplaced})`,
  );
  ok(
    !second.warnings.some((warning) => /anew/.test(warning)),
    `and reports nothing drawn anew (${second.warnings.join(" | ")})`,
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

  const pointr = components();
  ok(
    pointr.every(
      (component) =>
        icons.auditIconSourceComponent(
          component,
          component.name.replace(/^Icon \/ /, ""),
        ).issues.length === 0,
    ),
    `the ${pointr.length} Pointr icons audit clean`,
  );

  // Every source is a Pointr outline now, so every slot is offered all of them:
  // the taxonomy's filled symbols, which a stroke tint could not reach, are
  // gone from the package and from here.
  const general = await icons.findKozmosIconSourceComponents();
  ok(
    general.length === definitions.length &&
      !general.some((component) => /taxonomy-/.test(component.name)),
    `every slot is offered all ${general.length} Pointr icons`,
  );
}

// --- DirectionStep ---------------------------------------------------------------

section("DirectionStep");
{
  ok(
    Array.isArray(plugin.DIRECTION_STEP_TYPES) &&
      plugin.DIRECTION_STEP_TYPES.length === 14 &&
      plugin.DIRECTION_STEP_TYPES.includes("TurnBack"),
    "fourteen direction types",
  );
  ok(
    typeof plugin.expectedVariantAxesForComponentSetName === "function" &&
      JSON.stringify(
        plugin.expectedVariantAxesForComponentSetName("DirectionStep"),
      ) === JSON.stringify({ Type: plugin.DIRECTION_STEP_TYPES }),
    "the set expects the fourteen",
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
  for (const [type, iconName] of [
    ["TurnBack", "flip-backward"],
    ["LiftDown", "arrow-down"],
    ["Destination", "marker-pin-01"],
    ["Straight", "arrow-up"],
  ]) {
    const { component, stats } = await paint(type);
    const badge = named(component, "Direction Icon");
    const icon = badge && badge.findOne((node) => node.type === "INSTANCE");
    const vector = icon && icon.findOne((node) => node.type === "VECTOR");
    ok(
      badge &&
        badge.width === 40 &&
        badge.fills.length === 0 &&
        isWash(badge, "Direction Wash", "Colors/theme/500", 0.1, 40, 40) &&
        named(badge, "Direction Wash").type === "ELLIPSE",
      `${type}: a 40 disc in the theme's colour at 10 %, as a wash layer`,
    );
    ok(
      icon &&
        icon.width === 24 &&
        icon.mainComponent.name === `Icon / ${iconName}` &&
        vector &&
        boundVariableName(vector.strokes[0]) === "Colors/theme/500",
      `${type}: a 24 ${iconName} icon in the theme's colour`,
    );
    ok(!named(component, "Direction Glyph"), `${type}: no typed glyph`);
    ok(
      stats.warnings.length === 0,
      `${type}: no warnings (${stats.warnings.join(" | ")})`,
    );
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
      boundVariableName(vector.strokes[0]) === "Colors/theme/500",
    "a 16 sparkles icon in the theme's colour",
  );
  ok(
    stats.warnings.length === 0,
    `no warnings (${stats.warnings.join(" | ")})`,
  );
  if (typeof plugin.updateAISearchButtonVariant === "function") {
    const { component: disabled } = await paint("Disabled");
    ok(disabled.opacity === 0.5, "disabled: at 50 %");
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
  ];
  const ready = typeof plugin.inferTextStyleKeyForComponentText === "function";
  ok(ready, "the audit's style guess is reachable");
  for (const [setName, textName, expected, parentName] of ready ? cases : []) {
    const set = new MockNode("COMPONENT_SET", setName);
    const component = new MockNode("COMPONENT", "State=Default");
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
      `${setName} · ${textName}${parentName ? ` in ${parentName}` : ""} is ${expected} (got ${key})`,
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
        plugin.LOCATION_PIN_STATES.flatMap((state) =>
          plugin.LOCATION_PIN_SIZES.flatMap((size) =>
            tints.map((tint) => [
              "updateLocationPinVariant",
              { props: { state, size, tint } },
            ]),
          ),
        ),
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
      ok(
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
      JSON.stringify(plugin.parseRatingVariantName("Value=3, State=Default")) ===
        JSON.stringify({ scale: "Stars", value: "3", state: "Default" }),
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
    full.name === "Content=Full, Padding=Default",
    `a variant carries both axes (got "${full.name}")`,
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
      JSON.stringify({ value: "Full", second: "Default" }),
    "a variant with no Padding reads as Default, so Update renames rather than replaces",
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
      plugin.generatedVariantCombinations({ values: ["a", "b"] }).length === 2 &&
      plugin.generatedVariantCombinations({ values: ["a"] })[0].second === null,
    "and a set with one axis is untouched",
  );
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
  const featuredRow = await paint("updatePOIResultCardVariant", "Featured", "Row");
  const featuredCard = await paint("updatePOIResultCardVariant", "Featured", "Card");
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

// --- Summary ---------------------------------------------------------------------

console.log(
  `\n${passes} passed, ${failures} failed — ${path.relative(ROOT, PLUGIN)}`,
);
process.exit(failures === 0 ? 0 : 1);
