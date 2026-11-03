// The Pointr artwork Compose and SwiftUI draw for the names the web registry
// knows and their hand mappings (Icon.kt's Material glyphs, Icon.swift's SF
// Symbols) do not, and for the marks the web's POI details summary draws by
// component (POIDetailContent.tsx's summaryIcons), on Compose.
//
// Until 2026-10-07 Compose drew nothing for 18 of the web registry's 57 names,
// and until 2026-10-17 SwiftUI drew its question-mark stand-in for the same 18
// and nothing at all for compass-01, whose SF Symbol, `compass`, no iOS has:
// a chip with iconName = "phone" drew a phone on the web and a question mark on
// iOS. Each outline here is Pointr's own path data, read from packages/icons
// as syntax (never executed), as generate-navigation-glyphs.mjs reads the
// canonical pointer, so both platforms draw the outline React draws.
// IconNamesTest (Compose) and KozmosIconNamesTests (SwiftUI) fail when a web
// registry name draws no artwork; `--check` fails when an output is stale.
//
// It also writes each platform's copy of the web's aliases, which were two
// hand-kept lists until the venue set made them 57 (GAP-105), and the SVGs the
// Figma plugin draws the venue set's two owned names from.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import typescript from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kotlinOutput =
  "packages/android/src/main/java/com/kozmos/components/Icon/PointrIcons.generated.kt";
const swiftOutput =
  "packages/ios/Sources/Components/Icon/PointrIcons.generated.swift";
const pluginOutput = "figma/foundations-importer/code.js";

/**
 * Registry names Compose and SwiftUI both draw from Pointr's artwork: neither
 * a Material glyph nor an SF Symbol in their hand mappings.
 */
const REGISTRY_NAMES = [
  "arrow-down",
  "arrow-up",
  "bookmark",
  "calendar-check-01",
  "clock-plus",
  "eye",
  "feather",
  "flip-backward",
  "globe-02",
  "heart",
  "layout-alt-02",
  "loading-01",
  "mail-01",
  "phone",
  "share-01",
  "shopping-bag-02",
  "stars-01",
  "switch-vertical-01",
  // The venue set (GAP-105): Pointr's outlines, as the web draws them. A
  // platform symbol would be a near-miss in another hand, which is what this
  // list exists to end.
  "battery-charging-01",
  "beaker-01",
  "clapperboard",
  "credit-card-01",
  "droplets-01",
  "graduation-hat-01",
  "luggage-01",
  "medical-cross",
  "package",
  "passport",
  "plane",
  "scissors-01",
  "ticket-01",
];

/**
 * The venue set's names the Pointr library has no outline for: this package's
 * own artwork (owned/icons.ts), which both natives draw from its path data and
 * the Figma plugin carries as SVGs, between the markers in its code.js.
 */
const OWNED_REGISTRY_NAMES = ["accessibility", "utensils"];

/**
 * Registry names SwiftUI alone draws from Pointr's artwork: Compose's hand
 * mapping has a Material glyph for each, Icon.swift no SF Symbol. compass-01
 * was `compass`, a name SF Symbols has never had, so it drew nothing.
 */
const SWIFTUI_REGISTRY_NAMES = ["compass-01"];

/**
 * Names beyond the web registry that both natives draw by name (GAP-181): the
 * map control's layers glyph and MapStatusPill's walking figure, which React
 * passes as components. An outline takes its Pointr name; a solid mark with no
 * Pointr name, the kebab case of its export, as the wayfinding glyphs do.
 */
const BEYOND_REGISTRY = [
  { name: "layers-three-01", component: "LayersThree01" },
  { name: "walking", component: "Walking" },
];

/**
 * An export the web's details summary draws by component and the registry
 * does not name: Star01 for a rating. Compose draws it; SwiftUI's summary
 * draws the product's own symbols.
 */
const SUMMARY_EXPORTS = ["Star01"];

/**
 * Exports a part draws by component, under no name, as React imports them
 * (decision 121: a UI glyph stays a named import and never joins the by-name
 * registry): Link's new-tab icon (GAP-202). Both natives draw them.
 */
const PART_EXPORTS = [
  { component: "LinkExternal01", part: "Link, as its new-tab icon" },
];

const read = (relative) => {
  const file = path.join(root, relative);
  return typescript.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    typescript.ScriptTarget.Latest,
    true,
  );
};

const stringOf = (node, where) => {
  if (!node || !typescript.isStringLiteralLike(node))
    throw new Error(`${where}: expected a string literal`);
  return node.text;
};

/** The registry's definitions: each name and the component it draws. */
function registryComponents() {
  const source = read("packages/icons/src/registry.ts");
  const declaration = source.statements
    .filter(typescript.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => item.name.getText(source) === "kozmosIconDefinitions");
  let list = declaration?.initializer;
  while (list && typescript.isAsExpression(list)) list = list.expression;
  if (!list || !typescript.isArrayLiteralExpression(list))
    throw new Error("registry.ts: kozmosIconDefinitions not found");
  const components = new Map();
  for (const element of list.elements) {
    if (!typescript.isObjectLiteralExpression(element)) continue;
    const field = (key) =>
      element.properties.find(
        (p) =>
          typescript.isPropertyAssignment(p) && p.name.getText(source) === key,
      )?.initializer;
    const name = stringOf(field("name"), "registry.ts: a definition's name");
    const component = field("component");
    if (!component || !typescript.isIdentifier(component))
      throw new Error(`registry.ts: ${name} names no component`);
    components.set(name, component.text);
  }
  return components;
}

/** The aliases the registry accepts, `kozmosIconAliases`, each with the name it stands for. */
function registryAliases() {
  const source = read("packages/icons/src/registry.ts");
  const declaration = source.statements
    .filter(typescript.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => item.name.getText(source) === "kozmosIconAliases");
  let map = declaration?.initializer;
  while (
    map &&
    (typescript.isAsExpression(map) || typescript.isSatisfiesExpression(map))
  )
    map = map.expression;
  if (!map || !typescript.isObjectLiteralExpression(map))
    throw new Error("registry.ts: kozmosIconAliases not found");
  return map.properties.map((property) => {
    if (!typescript.isPropertyAssignment(property))
      throw new Error("registry.ts: an alias is not `key: value`");
    const key = property.name;
    const alias =
      typescript.isIdentifier(key) || typescript.isStringLiteralLike(key)
        ? key.text
        : null;
    if (!alias) throw new Error("registry.ts: an alias has a computed key");
    return [alias, stringOf(property.initializer, `registry.ts: ${alias}`)];
  });
}

/**
 * Every createPointrIcon and createTaxonomyIcon export in a file: its paths,
 * the taxonomy symbol's viewBox, and the Pointr name and node its comment
 * records.
 */
function exportsOf(relative) {
  const source = read(relative);
  const found = new Map();
  for (const statement of source.statements.filter(
    typescript.isVariableStatement,
  )) {
    for (const declaration of statement.declarationList.declarations) {
      const call = declaration.initializer;
      if (!call || !typescript.isCallExpression(call)) continue;
      const factory = call.expression.getText(source);
      if (factory !== "createPointrIcon" && factory !== "createTaxonomyIcon")
        continue;
      const name = declaration.name.getText(source);
      const where = `${relative}: ${name}`;
      const args = [...call.arguments];
      const viewBox =
        factory === "createTaxonomyIcon"
          ? stringOf(args[1], `${where} viewBox`)
              .trim()
              .split(/\s+/)
              .map(Number)
          : null;
      const pathsArgument = args[factory === "createTaxonomyIcon" ? 2 : 1];
      if (!pathsArgument || !typescript.isArrayLiteralExpression(pathsArgument))
        throw new Error(`${where}: paths are not an array`);
      const paths = pathsArgument.elements.map((element) => {
        if (!typescript.isObjectLiteralExpression(element))
          throw new Error(`${where}: a path is not an object`);
        const value = {};
        for (const property of element.properties) {
          if (!typescript.isPropertyAssignment(property))
            throw new Error(`${where}: unexpected path member`);
          value[property.name.getText(source)] = stringOf(
            property.initializer,
            `${where} path`,
          );
        }
        if (!value.d) throw new Error(`${where}: a path has no d`);
        return value;
      });
      const comment = statement
        .getFullText(source)
        .slice(0, statement.getLeadingTriviaWidth(source));
      const provenance = comment.match(/Pointr `([^`]+)`, node `([^`]+)`/);
      found.set(name, {
        name,
        factory,
        viewBox,
        paths,
        pointr: provenance ? provenance[1] : null,
        node: provenance ? provenance[2] : null,
        file: relative,
      });
    }
  }
  return found;
}

const art = new Map([
  ...exportsOf("packages/icons/src/pointr/icons.generated.ts"),
  ...exportsOf("packages/icons/src/owned/icons.ts"),
]);
const components = registryComponents();

const aliases = registryAliases();

const registered = (names) =>
  names.map((name) => {
    const component = components.get(name);
    if (!component)
      throw new Error(`${name} is not a name the web registry knows`);
    return { name, component };
  });
const owned = registered(OWNED_REGISTRY_NAMES);
for (const { name, component } of owned)
  if (art.get(component)?.file !== "packages/icons/src/owned/icons.ts")
    throw new Error(`${name} is not this package's own artwork`);
const ownedComponents = new Set(owned.map((w) => w.component));
for (const { name } of BEYOND_REGISTRY)
  if (components.has(name))
    throw new Error(
      `${name} is in the web registry: list it with the registry's names`,
    );
const wanted = [
  ...registered(REGISTRY_NAMES),
  ...owned,
  ...BEYOND_REGISTRY,
  ...SUMMARY_EXPORTS.map((component) => ({
    name: null,
    component,
    drawnBy: "the details summary",
  })),
  ...PART_EXPORTS.map(({ component, part }) => ({
    name: null,
    component,
    drawnBy: part,
  })),
];
const swiftWanted = [
  ...registered([...REGISTRY_NAMES, ...SWIFTUI_REGISTRY_NAMES]),
  ...owned,
  ...BEYOND_REGISTRY,
];
for (const { component } of PART_EXPORTS)
  if ([...components.values()].includes(component))
    throw new Error(`${component} is in the web registry: a part draws it by name`);
for (const list of [wanted, swiftWanted])
  if (new Set(list.map((w) => w.component)).size !== list.length)
    throw new Error("An export is listed twice");

const kotlinString = (value) => {
  if (/["\\$\n]/.test(value)) throw new Error(`Unsupported path: ${value}`);
  return `"${value}"`;
};
const float = (n) => {
  if (!Number.isFinite(n)) throw new Error(`Not a number: ${n}`);
  return `${n}f`;
};

const vectors = wanted
  .map(({ name, component, drawnBy }) => {
    const icon = art.get(component);
    if (!icon)
      throw new Error(`${component}: no Pointr artwork in packages/icons`);
    const paths = icon.paths.map((p) => kotlinString(p.d)).join(", ");
    const what = name ? "" : `, drawn by ${drawnBy}`;
    let doc;
    let body;
    if (icon.factory === "createPointrIcon") {
      if (ownedComponents.has(component)) {
        doc = `The outline in ${icon.file}, this package's own.`;
      } else {
        if (!icon.pointr || !icon.node)
          throw new Error(
            `${component}: no Pointr name and node in its comment`,
          );
        if (name && name !== icon.pointr)
          throw new Error(
            `${name} draws ${component}, Pointr's ${icon.pointr}`,
          );
        doc = `Pointr \`${icon.pointr}\`, node \`${icon.node}\`${what}.`;
      }
      body = `outline("${component}", ${paths})`;
    } else {
      // A taxonomy-style symbol is solid, on its own squared viewBox.
      for (const p of icon.paths)
        if (
          (p.fillRule ?? "nonzero") !== "nonzero" ||
          (p.clipRule ?? "nonzero") !== "nonzero"
        )
          throw new Error(`${component}: only nonzero symbols are supported`);
      const [x, y, width, height] = icon.viewBox ?? [];
      if (!(width > 0) || width !== height)
        throw new Error(`${component}: the viewBox is not square`);
      doc = `The solid mark in ${icon.file}, on its own squared viewBox${what}.`;
      body = `symbol("${component}", ${float(x)}, ${float(y)}, ${float(width)}, ${paths})`;
    }
    return `    /** ${doc} */\n    val ${component}: ImageVector by lazy { ${body} }`;
  })
  .join("\n\n");

const named = wanted
  .filter((w) => w.name)
  .map((w) => `        "${w.name}" -> ${w.component}`)
  .join("\n");

const quoted = (value) => {
  if (!/^[a-z0-9-]+$/.test(value))
    throw new Error(`Unsupported name: ${value}`);
  return `"${value}"`;
};

const kotlin = `// Generated by scripts/generate-native-icons.mjs from packages/icons/src (registry.ts, pointr/icons.generated.ts, owned/icons.ts). Edit the sources or the generator's lists, never this file.
package com.kozmos.components.icon

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/**
 * Pointr's own artwork, as React draws it: the web registry's names Compose's
 * hand mapping has no glyph for, the layers glyph and walking figure the map
 * controls draw by name, the marks the details summary draws, and Link's
 * new-tab icon.
 * Outlines are stroked 2 with round caps and joins on the 24 grid; a solid
 * mark fills its own squared viewBox. None is mirrored.
 */
internal object KozmosPointrIcons {
${vectors}

    /** The vector for a web registry name listed in the generator, or null. */
    fun named(name: String): ImageVector? = when (name) {
${named}
        else -> null
    }

    private fun outline(name: String, vararg data: String): ImageVector = ImageVector.Builder(
        name = name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f, autoMirror = false
    ).apply {
        for (d in data) {
            addPath(
                pathData = addPathNodes(d), fill = null, stroke = SolidColor(Color.Black), strokeLineWidth = 2f,
                strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round
            )
        }
    }.build()

    private fun symbol(name: String, x: Float, y: Float, side: Float, vararg data: String): ImageVector = ImageVector.Builder(
        name = name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = side, viewportHeight = side, autoMirror = false
    ).apply {
        addGroup(translationX = -x, translationY = -y)
        for (d in data) addPath(pathData = addPathNodes(d), fill = SolidColor(Color.Black))
        clearGroup()
    }.build()
}

/** The web registry's aliases, \`kozmosIconAliases\`: the name each stands for, or the name itself. */
internal object KozmosIconAliases {
    fun resolve(name: String): String = when (name) {
${aliases.map(([alias, target]) => `        ${quoted(alias)} -> ${quoted(target)}`).join("\n")}
        else -> name
    }
}
`;

// SwiftUI reads each outline at run time with KozmosPointrGlyph.outline,
// which takes absolute M, L, H, V, C and Z and gives nil for anything else, so
// a path it could not read would draw the stand-in. Read it here as it does.
const SWIFT_ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };

const rounded = (n) => String(Math.round(n * 10000) / 10000);

/** An elliptical arc as cubics, by the SVG spec's conversion to centre form. */
function arcToCubics(x1, y1, rx, ry, degrees, large, sweep, x2, y2) {
  if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (degrees * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x = cos * dx + sin * dy;
  const y = -sin * dx + cos * dy;
  const scale = (x * x) / (rx * rx) + (y * y) / (ry * ry);
  if (scale > 1) {
    rx *= Math.sqrt(scale);
    ry *= Math.sqrt(scale);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y * y - ry * ry * x * x;
  const denominator = rx * rx * y * y + ry * ry * x * x;
  const root = Math.sqrt(Math.max(0, numerator / denominator));
  const sign = large === sweep ? -1 : 1;
  const cxp = (sign * root * (rx * y)) / ry;
  const cyp = (sign * root * -(ry * x)) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (x - cxp) / rx, (y - cyp) / ry);
  let delta = angle(
    (x - cxp) / rx,
    (y - cyp) / ry,
    (-x - cxp) / rx,
    (-y - cyp) / ry,
  );
  if (sweep && delta < 0) delta += 2 * Math.PI;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  const count = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9));
  const step = delta / count;
  const k = (4 / 3) * Math.tan(step / 4);
  const point = (t, ax, ay) => [
    cx + cos * rx * (Math.cos(t) + ax) - sin * ry * (Math.sin(t) + ay),
    cy + sin * rx * (Math.cos(t) + ax) + cos * ry * (Math.sin(t) + ay),
  ];
  const cubics = [];
  for (let index = 0; index < count; index += 1) {
    const from = start + index * step;
    const to = from + step;
    const [c1x, c1y] = point(from, -k * Math.sin(from), k * Math.cos(from));
    const [c2x, c2y] = point(to, k * Math.sin(to), -k * Math.cos(to));
    const [ex, ey] = index === count - 1 ? [x2, y2] : point(to, 0, 0);
    cubics.push([c1x, c1y, c2x, c2y, ex, ey]);
  }
  return cubics;
}

/**
 * An SVG path in the absolute M, L, H, V, C and Z KozmosPointrGlyph.outline
 * reads: this package's own artwork is written with relative commands and
 * arcs, which Pointr's export is not. A path that is already absolute is left
 * as it is.
 */
function absolutePath(d, where) {
  if (/^[MLHVCZ0-9 ,.-]*$/.test(d)) return d;
  const parameters = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, A: 7, Z: 0 };
  let at = 0;
  const skip = () => {
    while (at < d.length && /[\s,]/.test(d[at])) at += 1;
  };
  const number = () => {
    skip();
    const pattern = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
    pattern.lastIndex = at;
    const match = pattern.exec(d);
    if (!match) throw new Error(`${where}: expected a number at ${at}`);
    at += match[0].length;
    return Number(match[0]);
  };
  const flag = () => {
    skip();
    const value = d[at];
    if (value !== "0" && value !== "1")
      throw new Error(`${where}: expected an arc flag at ${at}`);
    at += 1;
    return value === "1";
  };
  const output = [];
  const emit = (command, ...values) =>
    output.push(command + values.map(rounded).join(" "));
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = null;
  let lastControlY = null;
  let command = null;
  for (skip(); at < d.length; skip()) {
    if (/[A-Za-z]/.test(d[at])) {
      command = d[at];
      at += 1;
      if (!(command.toUpperCase() in parameters))
        throw new Error(`${where}: absolutePath reads no ${command}`);
    } else if (!command) throw new Error(`${where}: a path begins with M`);
    const upper = command.toUpperCase();
    const relative = command !== upper;
    if (upper === "Z") {
      output.push("Z");
      x = startX;
      y = startY;
      lastControlX = null;
      continue;
    }
    if (upper === "M") {
      x = number() + (relative ? x : 0);
      y = number() + (relative ? y : 0);
      startX = x;
      startY = y;
      emit("M", x, y);
      // Further pairs after an M are lines.
      command = relative ? "l" : "L";
      lastControlX = null;
    } else if (upper === "L") {
      x = number() + (relative ? x : 0);
      y = number() + (relative ? y : 0);
      emit("L", x, y);
      lastControlX = null;
    } else if (upper === "H") {
      x = number() + (relative ? x : 0);
      emit("H", x);
      lastControlX = null;
    } else if (upper === "V") {
      y = number() + (relative ? y : 0);
      emit("V", y);
      lastControlX = null;
    } else if (upper === "C" || upper === "S") {
      const base = relative ? [x, y] : [0, 0];
      const smooth = upper === "S";
      const c1x = smooth
        ? lastControlX === null
          ? x
          : 2 * x - lastControlX
        : number() + base[0];
      const c1y = smooth
        ? lastControlY === null
          ? y
          : 2 * y - lastControlY
        : number() + base[1];
      const c2x = number() + base[0];
      const c2y = number() + base[1];
      const endX = number() + base[0];
      const endY = number() + base[1];
      emit("C", c1x, c1y, c2x, c2y, endX, endY);
      lastControlX = c2x;
      lastControlY = c2y;
      x = endX;
      y = endY;
    } else {
      const rx = number();
      const ry = number();
      const rotation = number();
      const large = flag();
      const sweep = flag();
      const endX = number() + (relative ? x : 0);
      const endY = number() + (relative ? y : 0);
      for (const cubic of arcToCubics(
        x,
        y,
        rx,
        ry,
        rotation,
        large,
        sweep,
        endX,
        endY,
      ))
        emit("C", ...cubic);
      x = endX;
      y = endY;
      lastControlX = null;
    }
  }
  return output.join("");
}

function swiftOutline(d, where) {
  const commands = [];
  let number = "";
  const flush = () => {
    if (!number) return;
    if (!/^-?\d+(\.\d+)?$/.test(number) || !commands.length)
      throw new Error(
        `${where}: KozmosPointrGlyph.outline cannot read ${number}`,
      );
    commands.at(-1).values.push(Number(number));
    number = "";
  };
  for (const character of d) {
    if (/[A-Za-z]/.test(character)) {
      flush();
      if (!(character in SWIFT_ARITY))
        throw new Error(
          `${where}: KozmosPointrGlyph.outline reads no ${character}`,
        );
      commands.push({ command: character, values: [] });
    } else if (character === " " || character === ",") flush();
    else if (character === "-") {
      flush();
      number = "-";
    } else number += character;
  }
  flush();
  if (commands[0]?.command !== "M")
    throw new Error(`${where}: an outline begins with M`);
  for (const { command, values } of commands) {
    const arity = SWIFT_ARITY[command];
    if (arity === 0 ? values.length : !values.length || values.length % arity)
      throw new Error(`${where}: ${command} has ${values.length} values`);
  }
  if (/["\\\n]/.test(d)) throw new Error(`${where}: unsupported path ${d}`);
  return `"${d}"`;
}

const swiftIcon = ({ component }) => {
  const icon = art.get(component);
  if (!icon) throw new Error(`${component}: no artwork in packages/icons`);
  return icon;
};
const swiftCases = swiftWanted
  .filter((w) => swiftIcon(w).factory === "createPointrIcon")
  .map(({ name, component }) => {
    const icon = art.get(component);
    const swiftPaths = icon.paths
      .map((p, index) => {
        const where = `${component}, path ${index + 1}`;
        return swiftOutline(absolutePath(p.d, where), where);
      })
      .join(", ");
    if (ownedComponents.has(component))
      return `        // The outline \`${component}\` in ${icon.file}, this package's own, in absolute commands.\n        case "${name}": return [${swiftPaths}]`;
    if (!icon.pointr || !icon.node)
      throw new Error(`${component}: no Pointr name and node in its comment`);
    if (name !== icon.pointr)
      throw new Error(`${name} draws ${component}, Pointr's ${icon.pointr}`);
    return `        // Pointr \`${icon.pointr}\`, node \`${icon.node}\`.\n        case "${name}": return [${swiftPaths}]`;
  })
  .join("\n");

// A solid mark: its paths filled with the nonzero rule, on its own squared
// viewBox, which KozmosPointrGlyph fits to the 24 grid.
const swiftSymbolCases = swiftWanted
  .filter((w) => swiftIcon(w).factory === "createTaxonomyIcon")
  .map(({ name, component }) => {
    const icon = art.get(component);
    for (const p of icon.paths)
      if (
        (p.fillRule ?? "nonzero") !== "nonzero" ||
        (p.clipRule ?? "nonzero") !== "nonzero"
      )
        throw new Error(`${component}: only nonzero symbols are supported`);
    const [x, y, width, height] = icon.viewBox ?? [];
    if (!(width > 0) || width !== height)
      throw new Error(`${component}: the viewBox is not square`);
    const paths = icon.paths
      .map((p, index) => {
        const where = `${component}, path ${index + 1}`;
        return swiftOutline(absolutePath(p.d, where), where);
      })
      .join(", ");
    return `        // The solid mark \`${component}\` in ${icon.file}, on its own squared viewBox.\n        case "${name}": return (${x}, ${y}, ${width}, [${paths}])`;
  })
  .join("\n");

// The outlines a part draws by component, under no name.
const swiftPartCases = PART_EXPORTS.map(({ component, part }) => {
  const icon = art.get(component);
  if (!icon) throw new Error(`${component}: no Pointr artwork in packages/icons`);
  if (icon.factory !== "createPointrIcon" || !icon.pointr || !icon.node)
    throw new Error(`${component}: a part's glyph is a Pointr outline`);
  const paths = icon.paths
    .map((p, index) => swiftOutline(p.d, `${component}, path ${index + 1}`))
    .join(", ");
  return `        // Pointr \`${icon.pointr}\`, node \`${icon.node}\`, drawn by ${part}.\n        case "${component}": return [${paths}]`;
}).join("\n");

const swift = `// Generated by scripts/generate-native-icons.mjs from packages/icons/src (registry.ts, pointr/icons.generated.ts, owned/icons.ts). Edit the sources or the generator's lists, never this file.

/// Pointr's own outlines, as React draws them: the web registry's names
/// \`KozmosIcon\`'s SF Symbols mapping has no symbol for. \`KozmosPointrGlyph\`
/// reads each with \`outline\` and strokes it 2 on the 24 grid with round caps
/// and joins, unmirrored.
enum KozmosPointrIconPaths {
    /// The path data of a web registry name listed in the generator, one
    /// string per path as icons.generated.ts spells it; nil for any other name.
    static func data(_ name: String) -> [String]? {
        switch name {
${swiftCases}
        default: return nil
        }
    }

    /// A solid mark drawn by name: its viewBox's origin and side, and its
    /// path data, filled with the nonzero rule; nil for any other name.
    static func symbol(_ name: String) -> (x: Double, y: Double, side: Double, paths: [String])? {
        switch name {
${swiftSymbolCases}
        default: return nil
        }
    }

    /// The path data of an outline a part draws by its export's name, never
    /// by a name \`KozmosIcon\` takes (decision 121); nil for any other.
    static func part(_ component: String) -> [String]? {
        switch component {
${swiftPartCases}
        default: return nil
        }
    }
}

/// The web registry's aliases, \`kozmosIconAliases\`: the name each stands for,
/// or the name itself.
enum KozmosIconAliases {
    static func resolve(_ name: String) -> String {
        switch name {
${aliases.map(([alias, target]) => `        case ${quoted(alias)}: return ${quoted(target)}`).join("\n")}
        default: return name
        }
    }
}
`;

// The artwork the Figma plugin draws for the owned names (the Pointr library
// it imports the rest from has no such outline), as code.js carries it between
// its markers. A hand edit there fails --check, as the two outputs above do.
const svgOf = (component) => {
  const icon = art.get(component);
  const open = (viewBox) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${viewBox}" fill="none">`;
  if (icon.factory === "createPointrIcon")
    return `${open("0 0 24 24")}${icon.paths
      .map(
        (p) =>
          `<path d="${p.d}" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      )
      .join("")}</svg>`;
  return `${open(icon.viewBox.join(" "))}${icon.paths
    .map((p) => `<path d="${p.d}" fill="black"/>`)
    .join("")}</svg>`;
};
const pluginFile = path.join(root, pluginOutput);
const pluginSource = fs.readFileSync(pluginFile, "utf8");
const openMarker = "// <owned-icons:generated>\n";
const closeMarker = "// </owned-icons:generated>\n";
const openAt = pluginSource.indexOf(openMarker);
const closeAt = pluginSource.indexOf(closeMarker);
if (openAt < 0 || closeAt < openAt)
  throw new Error(`${pluginOutput}: owned icon markers not found`);
const pluginBlock = await prettier.format(
  `// Generated by scripts/generate-native-icons.mjs from packages/icons/src/owned/icons.ts. Edit the source, never this block.\nconst KOZMOS_OWNED_ICON_SVGS = ${JSON.stringify(
    Object.fromEntries(owned.map((w) => [w.name, svgOf(w.component)])),
  )};\n`,
  { ...(await prettier.resolveConfig(pluginFile)), filepath: pluginFile },
);
const plugin =
  pluginSource.slice(0, openAt + openMarker.length) +
  pluginBlock +
  pluginSource.slice(closeAt);

const check = process.argv.includes("--check");
const stale = [];
for (const [relative, content] of [
  [kotlinOutput, kotlin],
  [swiftOutput, swift],
  [pluginOutput, plugin],
]) {
  const filename = path.join(root, relative);
  const current = fs.existsSync(filename)
    ? fs.readFileSync(filename, "utf8")
    : null;
  if (current === content) continue;
  if (check) stale.push(relative);
  // An unchanged file is left alone, so its timestamp moves only with it.
  else fs.writeFileSync(filename, content);
}
if (stale.length)
  throw new Error(
    `Stale native icons: ${stale.join(", ")}. Run pnpm icons:native:generate.`,
  );
console.log(
  `Native icons ${check ? "verified" : "generated"} from Pointr's artwork: Compose ${REGISTRY_NAMES.length + owned.length} registry names, ${BEYOND_REGISTRY.length} beyond it, ${SUMMARY_EXPORTS.length} summary marks and ${PART_EXPORTS.length} part glyph, SwiftUI ${swiftWanted.length - BEYOND_REGISTRY.length} registry names, ${BEYOND_REGISTRY.length} beyond it and ${PART_EXPORTS.length} part glyph, ${aliases.length} aliases on both, and the plugin's ${owned.length} owned SVGs`,
);
