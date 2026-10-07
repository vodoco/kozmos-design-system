// The Pointr artwork Compose draws for the names the web registry knows and
// Compose's hand mapping in Icon.kt does not, and for the marks the web's POI
// details summary draws by component (POIDetailContent.tsx's summaryIcons).
//
// Until 2026-10-07 Compose drew nothing for 18 of the web registry's 57 names:
// a chip with iconName = "phone" drew a phone on the web and no icon on
// Android. Each vector here is Pointr's own path data, read from
// packages/icons as syntax (never executed), as
// generate-navigation-glyphs.mjs reads the canonical pointer, so Compose
// draws the outline React draws. IconNamesTest fails when a web registry name
// has no Compose vector; `--check` fails when this output is stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output =
  "packages/android/src/main/java/com/kozmos/components/Icon/PointrIcons.generated.kt";

/** Registry names Compose draws from Pointr's artwork, not a Material glyph. */
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
 * Exports the web's details summary draws by component and the registry
 * does not name: Star01 for a rating, and the accessibility mark.
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

const wanted = [];
for (const name of REGISTRY_NAMES) {
  const component = components.get(name);
  if (!component)
    throw new Error(`${name} is not a name the web registry knows`);
  wanted.push({ name, component });
}
for (const component of SUMMARY_EXPORTS) wanted.push({ name: null, component });
if (new Set(wanted.map((w) => w.component)).size !== wanted.length)
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

const kotlin = `// Generated by scripts/generate-compose-icons.mjs from packages/icons/src (registry.ts, pointr/icons.generated.ts, owned/icons.ts). Edit the sources or the generator's lists, never this file.
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

const filename = path.join(root, output);
if (process.argv.includes("--check")) {
  if (!fs.existsSync(filename) || fs.readFileSync(filename, "utf8") !== kotlin)
    throw new Error(
      `Stale Compose icons: ${output}. Run pnpm icons:compose:generate.`,
    );
} else fs.writeFileSync(filename, kotlin);
console.log(
  `Compose icons: ${REGISTRY_NAMES.length} registry names and ${SUMMARY_EXPORTS.length} summary marks ${process.argv.includes("--check") ? "verified" : "generated"} from Pointr's artwork`,
);
