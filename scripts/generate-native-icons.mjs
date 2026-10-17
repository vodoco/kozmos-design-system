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
// registry name draws no artwork; `--check` fails when either output is stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kotlinOutput =
  "packages/android/src/main/java/com/kozmos/components/Icon/PointrIcons.generated.kt";
const swiftOutput =
  "packages/ios/Sources/Components/Icon/PointrIcons.generated.swift";

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
];

/**
 * Registry names SwiftUI alone draws from Pointr's artwork: Compose's hand
 * mapping has a Material glyph for each, Icon.swift no SF Symbol. compass-01
 * was `compass`, a name SF Symbols has never had, so it drew nothing.
 */
const SWIFTUI_REGISTRY_NAMES = ["compass-01"];

/**
 * Exports the web's details summary draws by component and the registry
 * does not name: Star01 for a rating, and the accessibility mark. Compose
 * draws them; SwiftUI's summary draws the product's own symbols.
 */
const SUMMARY_EXPORTS = ["Star01", "Accessibility"];

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
      const comment = statement.getFullText(source).slice(
        0,
        statement.getLeadingTriviaWidth(source),
      );
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

const registered = (names) =>
  names.map((name) => {
    const component = components.get(name);
    if (!component)
      throw new Error(`${name} is not a name the web registry knows`);
    return { name, component };
  });
const wanted = [
  ...registered(REGISTRY_NAMES),
  ...SUMMARY_EXPORTS.map((component) => ({ name: null, component })),
];
const swiftWanted = registered([...REGISTRY_NAMES, ...SWIFTUI_REGISTRY_NAMES]);
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
  .map(({ name, component }) => {
    const icon = art.get(component);
    if (!icon) throw new Error(`${component}: no Pointr artwork in packages/icons`);
    const paths = icon.paths.map((p) => kotlinString(p.d)).join(", ");
    const what = name ? "" : ", drawn by the details summary";
    let doc;
    let body;
    if (icon.factory === "createPointrIcon") {
      if (!icon.pointr || !icon.node)
        throw new Error(`${component}: no Pointr name and node in its comment`);
      if (name && name !== icon.pointr)
        throw new Error(`${name} draws ${component}, Pointr's ${icon.pointr}`);
      doc = `Pointr \`${icon.pointr}\`, node \`${icon.node}\`${what}.`;
      body = `outline("${component}", ${paths})`;
    } else {
      // A taxonomy-style symbol is solid, on its own squared viewBox.
      for (const p of icon.paths)
        if ((p.fillRule ?? "nonzero") !== "nonzero" || (p.clipRule ?? "nonzero") !== "nonzero")
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
 * hand mapping has no glyph for, and the marks the details summary draws.
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
`;

// SwiftUI reads each outline at run time with KozmosPointrGlyph.outline,
// which takes absolute M, L, H, V, C and Z and gives nil for anything else, so
// a path it could not read would draw the stand-in. Read it here as it does.
const SWIFT_ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 };
function swiftOutline(d, where) {
  const commands = [];
  let number = "";
  const flush = () => {
    if (!number) return;
    if (!/^-?\d+(\.\d+)?$/.test(number) || !commands.length)
      throw new Error(`${where}: KozmosPointrGlyph.outline cannot read ${number}`);
    commands.at(-1).values.push(Number(number));
    number = "";
  };
  for (const character of d) {
    if (/[A-Za-z]/.test(character)) {
      flush();
      if (!(character in SWIFT_ARITY))
        throw new Error(`${where}: KozmosPointrGlyph.outline reads no ${character}`);
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

const swiftCases = swiftWanted
  .map(({ name, component }) => {
    const icon = art.get(component);
    if (!icon || icon.factory !== "createPointrIcon")
      throw new Error(`${component}: no Pointr outline in packages/icons`);
    if (!icon.pointr || !icon.node)
      throw new Error(`${component}: no Pointr name and node in its comment`);
    if (name !== icon.pointr)
      throw new Error(`${name} draws ${component}, Pointr's ${icon.pointr}`);
    const paths = icon.paths
      .map((p, index) => swiftOutline(p.d, `${component}, path ${index + 1}`))
      .join(", ");
    return `        // Pointr \`${icon.pointr}\`, node \`${icon.node}\`.\n        case "${name}": return [${paths}]`;
  })
  .join("\n");

const swift = `// Generated by scripts/generate-native-icons.mjs from packages/icons/src (registry.ts, pointr/icons.generated.ts). Edit the sources or the generator's lists, never this file.

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
}
`;

const check = process.argv.includes("--check");
const stale = [];
for (const [relative, content] of [
  [kotlinOutput, kotlin],
  [swiftOutput, swift],
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
  `Native icons ${check ? "verified" : "generated"} from Pointr's artwork: Compose ${REGISTRY_NAMES.length} registry names and ${SUMMARY_EXPORTS.length} summary marks, SwiftUI ${swiftWanted.length} registry names`,
);
