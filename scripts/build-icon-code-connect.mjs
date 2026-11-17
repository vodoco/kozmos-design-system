// Generate Code Connect for every Icon / * component on the library's Icons page,
// on React, SwiftUI and Compose.
//
// The icon components were the one gap in Code Connect: the components had
// 120 .figma.tsx files between them, and the icons had a single placeholder for
// the instance-swap slot. Dev Mode showed 64 empty "Enter a path" rows.
//
// Until 17 Oct this wrote React's file only. Dev Mode shows another label's
// snippet for a node its own label does not map, so every library icon nested
// in a set read back on SwiftUI and Compose as React's <Icon name=…/>, with no
// `import Kozmos` (58 sets on each, 16 Oct). The native files map the same
// nodes to KozmosIcon, which takes every name the Icons page draws, the
// wayfinding glyphs included, on both platforms. A snippet is the call a
// product writes; whether a platform has artwork for the name is the icon's
// own concern (on 17 Oct SwiftUI drew its stand-in for 18 of the 80).
//
// Both halves are already committed, so this reads truth rather than the live
// file: the node ids come from the Icons page baseline under docs/, and the
// names come from the registry and, for the Pointr Maps - Express wayfinding
// glyphs the plugin draws as sources of their own, from
// packages/icons/src/owned/navigation-glyphs.json. The glyphs are not in the
// registry by design; they reach code as the components @kozmos-ds/icons
// exports. A name that exists on only one side is an error, not something to
// skip - a silent skip is how a mapping goes missing. The output is generated:
// a hand edit fails --check, which CI runs.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const baselinePath =
  process.argv.find((a) => a.endsWith(".json")) ??
  fs
    .readdirSync(path.join(root, "docs"))
    .filter((f) => f.startsWith("figma-icons-") && f.endsWith(".json"))
    .sort()
    .at(-1);

const baseline = JSON.parse(
  fs.readFileSync(path.join(root, "docs", path.basename(baselinePath)), "utf8"),
);

const registry = fs.readFileSync(
  path.join(root, "packages/icons/src/registry.ts"),
  "utf8",
);
const names = new Set(
  [...registry.matchAll(/^ {4}name: "([^"]+)",$/gm)].map((m) => m[1]),
);

// The wayfinding glyphs, by the name the plugin gives their sources (the
// generator's kebab case of the component name) and the component to import.
const kebab = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const glyphs = JSON.parse(
  fs.readFileSync(
    path.join(root, "packages/icons/src/owned/navigation-glyphs.json"),
    "utf8",
  ),
).glyphs;
const wayfinding = new Map(glyphs.map((g) => [kebab(g.name), g.name]));
const both = [...wayfinding.keys()].filter((n) => names.has(n));
if (both.length) {
  throw new Error(
    `${both.length} wayfinding glyph(s) also in the registry, so the mapping is ambiguous: ${both.join(", ")}`,
  );
}

// The importer's UI glyphs (decision 121): drawn inside components, imported
// onto the Icons page by Curated Icons, and never in the by-name registry. A
// React product imports each as a component, as a wayfinding glyph; read from
// the plugin, so a glyph it adds is known here without a copy of the list.
const plugin = fs.readFileSync(
  path.join(root, "figma/foundations-importer/code.js"),
  "utf8",
);
const uiBlock = plugin.match(
  /const IMPORTER_UI_ICON_DEFINITIONS = \[([\s\S]*?)\n\];/,
);
if (!uiBlock) {
  throw new Error("code.js has no IMPORTER_UI_ICON_DEFINITIONS");
}
const pascal = (name) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
const pointrExports = fs.readFileSync(
  path.join(root, "packages/icons/src/pointr/icons.generated.ts"),
  "utf8",
);
const uiGlyphs = new Map(
  [...uiBlock[1].matchAll(/^ {4}name: "([^"]+)",$/gm)].map((m) => [
    m[1],
    pascal(m[1]),
  ]),
);
for (const [name, component] of uiGlyphs) {
  if (names.has(name) || wayfinding.has(name)) {
    throw new Error(
      `${name} is a UI glyph and also in the registry or navigation-glyphs.json, so the mapping is ambiguous`,
    );
  }
  if (!pointrExports.includes(`export const ${component} =`)) {
    throw new Error(`@kozmos-ds/icons exports no ${component} for ${name}`);
  }
}

// SwiftUI and Compose draw no UI glyph by name: KozmosIcon would draw its
// stand-in. A glyph a native part draws maps to the system symbol that part
// draws, read from the file named here, so the two cannot drift (Olcay, 16 Nov
// 2026); every other one says which native part, if any, it belongs to.
// A UI glyph with no entry here is an error: someone decides, nothing guesses.
const UI_GLYPH_NATIVES = {
  "copy-01": {
    swift: 'Image(systemName: "doc.on.doc")',
    swiftFrom: "packages/ios/Sources/Components/Input/Input.swift",
    kotlin: "Icon(Icons.Default.ContentCopy, contentDescription = null)",
    kotlinImports: ["androidx.compose.material.icons.filled.ContentCopy"],
    kotlinFrom:
      "packages/android/src/main/java/com/kozmos/components/Input/Input.kt",
  },
  "star-01": {
    swift: 'Image(systemName: "star")',
    swiftFrom: "packages/ios/Sources/Components/Input/Input.figma.swift",
    kotlin: "Icon(Icons.Default.Star, contentDescription = null)",
    kotlinImports: ["androidx.compose.material.icons.filled.Star"],
    kotlinFrom:
      "packages/android/src/main/java/com/kozmos/components/Input/Input.figma.kt",
  },
  "pencil-01": {
    none: "A Card header's actions are the product's own (GAP-169): no Kozmos part draws pencil-01 here.",
  },
};
const DASHBOARD_ONLY =
  "MapEditToolbar's (CLOUD-UI-005), a Dashboard module: web only (decision 183).";
const uiNative = (name) => {
  const entry = UI_GLYPH_NATIVES[name];
  if (entry) return entry;
  const description =
    uiBlock[1]
      .split(/\n {2}\{/)
      .find((definition) => definition.includes(`name: "${name}",`)) ?? "";
  if (description.includes("MapEditToolbar")) return { none: DASHBOARD_ONLY };
  throw new Error(
    `UI glyph ${name} has no native snippet: add it to UI_GLYPH_NATIVES`,
  );
};
for (const name of uiGlyphs.keys()) {
  const entry = uiNative(name);
  for (const [symbol, from] of [
    [entry.swift, entry.swiftFrom],
    [entry.kotlin, entry.kotlinFrom],
  ]) {
    if (!symbol) continue;
    // The symbol itself: a part may choose it in an expression
    // (`copied ? "checkmark" : "doc.on.doc"`).
    const used = symbol.match(/"[^"]+"|Icons\.Default\.\w+/)[0];
    if (!fs.readFileSync(path.join(root, from), "utf8").includes(used)) {
      throw new Error(`${name}: ${from} no longer draws ${used}`);
    }
  }
}

const icons = baseline.icons
  .map((icon) => ({ name: icon.name.replace(/^Icon \/ /, ""), id: icon.id }))
  .sort((a, b) => a.name.localeCompare(b.name));

const unknown = icons.filter(
  (icon) =>
    !names.has(icon.name) &&
    !wayfinding.has(icon.name) &&
    !uiGlyphs.has(icon.name),
);
if (unknown.length) {
  throw new Error(
    `Icons page has ${unknown.length} component(s) neither the registry, navigation-glyphs.json nor the plugin's UI glyphs name: ${unknown.map((i) => i.name).join(", ")}`,
  );
}
// The names the registry holds before the Icons page draws them: the venue set
// (GAP-105). The plugin draws them on the owner's Curated Icons → Update, which
// gives each a node id, and a connection needs that id: until a baseline records
// them they have none, and Dev Mode has no node to show one on. List only what
// such an Update is still to draw, and empty this when its baseline lands: a
// name here that the page draws is an error, so the list cannot go stale.
const AWAITING_THE_ICONS_PAGE = new Set([]);
const drawnAlready = [...AWAITING_THE_ICONS_PAGE].filter((n) =>
  icons.some((i) => i.name === n),
);
if (drawnAlready.length) {
  throw new Error(
    `the Icons page draws ${drawnAlready.join(", ")}: take them off AWAITING_THE_ICONS_PAGE`,
  );
}
const notInRegistry = [...AWAITING_THE_ICONS_PAGE].filter((n) => !names.has(n));
if (notInRegistry.length) {
  throw new Error(
    `AWAITING_THE_ICONS_PAGE names ${notInRegistry.join(", ")}, which the registry does not`,
  );
}
const undrawn = [...names].filter(
  (n) => !AWAITING_THE_ICONS_PAGE.has(n) && !icons.some((i) => i.name === n),
);
if (undrawn.length) {
  throw new Error(
    `registry names ${undrawn.length} icon(s) the Icons page does not draw: ${undrawn.join(", ")}`,
  );
}
const undrawnGlyphs = [...wayfinding.keys()].filter(
  (n) => !icons.some((i) => i.name === n),
);
if (undrawnGlyphs.length) {
  throw new Error(
    `navigation-glyphs.json names ${undrawnGlyphs.length} glyph(s) the Icons page does not draw: ${undrawnGlyphs.join(", ")}`,
  );
}

const FILE = "Yj4O8p6Y9h2Sa9zJVoAiVY";
// The component a glyph reaches React as: a wayfinding glyph's or a UI
// glyph's; a registry icon has none and goes by its name.
const componentOf = (icon) =>
  wayfinding.get(icon.name) ?? uiGlyphs.get(icon.name);
const example = (icon) =>
  componentOf(icon)
    ? `<Icon icon={${componentOf(icon)}} />`
    : `<Icon name="${icon.name}" />`;
// Code Connect writes the imports of the components an example draws, not of a
// value passed in a prop, so a glyph's snippet names both imports itself:
// without them a copied snippet does not compile.
const imports = (icon) =>
  componentOf(icon)
    ? `
    imports: [
      "import { Icon } from '@kozmos-ds/react';",
      "import { ${componentOf(icon)} } from '@kozmos-ds/icons';",
    ],`
    : "";
const body = icons
  .map(
    (icon) => `figma.connect(
  Icon,
  "https://figma.com/design/${FILE}?node-id=${icon.id.replace(":", "-")}",
  {${imports(icon)}
    example: () => ${example(icon)},
  },
);`,
  )
  .join("\n\n");
const glyphImports = icons
  .filter((icon) => componentOf(icon))
  .map((icon) => componentOf(icon))
  .sort();

const out = `// Generated by scripts/build-icon-code-connect.mjs. Do not edit by hand.
//
// One connection per Icon / * component on the library's Icons page, from the
// node id recorded in ${path.basename(baselinePath)}. A registry icon
// reaches code through Icon's name prop, so the mapping survives a change of
// which component the registry resolves that name to; a Pointr Maps - Express
// wayfinding glyph or a UI glyph (decision 121), which the registry does not
// name, through its icon prop.
import figma from "@figma/code-connect";
${
  glyphImports.length
    ? `import {\n${glyphImports.map((n) => `  ${n},`).join("\n")}\n} from "@kozmos-ds/icons";\n`
    : ""
}import { Icon } from "./Icon";

${body}
`;

// The natives draw a wayfinding glyph by the same name as any other icon, so
// one example serves every icon. Each connection is its own type, named from
// the icon: two names that spell the same type are an error, not a collision
// the compiler reports later.
const typeName = (name) => `KozmosIconLibrary${pascal(name)}Connect`;
const typeNames = new Map();
for (const icon of icons) {
  const type = typeName(icon.name);
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(type)) {
    throw new Error(`${icon.name} does not make a Swift or Kotlin type name`);
  }
  if (typeNames.has(type)) {
    throw new Error(
      `${icon.name} and ${typeNames.get(type)} both make the type ${type}`,
    );
  }
  typeNames.set(type, icon.name);
}
const nodeUrl = (icon) =>
  `https://figma.com/design/${FILE}?node-id=${icon.id.replace(":", "-")}`;
const nativeHeader = (
  comment,
) => `// Generated by scripts/build-icon-code-connect.mjs. Do not edit by hand.
//
// One connection per Icon / * component on the library's Icons page, from the
// node id recorded in ${path.basename(baselinePath)}, as React's
// IconLibrary.figma.tsx maps them. ${comment}`;

const nativeNote = `KozmosIcon takes every one of them by its
// Kozmos name, a Pointr Maps - Express wayfinding glyph too, except the
// importer's UI glyphs (decision 121): one a native part draws maps to that
// part's system symbol, and the rest say where they belong.`;
const swiftBody = (icon) => {
  if (!uiGlyphs.has(icon.name)) return `KozmosIcon("${icon.name}")`;
  const entry = uiNative(icon.name);
  // SwiftUI's Code Connect parser drops comments, so the note is the
  // snippet's own words: help text on a view that draws nothing.
  return entry.swift
    ? entry.swift
    : `EmptyView().help(${JSON.stringify(`${icon.name}: ${entry.none}`)})`;
};
const kotlinBody = (icon) => {
  if (!uiGlyphs.has(icon.name)) return `KozmosIcon(name = "${icon.name}")`;
  const entry = uiNative(icon.name);
  // Compose's parser keeps comments, but takes a snippet's first call as its
  // component and imports it: with a comment alone it imported the function's
  // own name from another file (`feedbackcard.ComponentExample`, 17 Nov 2026).
  // So the note is followed by a view that draws nothing, as SwiftUI's is.
  return entry.kotlin
    ? entry.kotlin
    : `// ${icon.name}: ${entry.none}\n        Spacer(Modifier)`;
};
const kotlinNotes = icons.some(
  (icon) => uiGlyphs.has(icon.name) && !uiNative(icon.name).kotlin,
);
const kotlinImports = [
  ...new Set(
    icons.flatMap((icon) =>
      uiGlyphs.has(icon.name) ? (uiNative(icon.name).kotlinImports ?? []) : [],
    ),
  ),
].sort();
const kotlinDrawsSymbols = kotlinImports.length > 0;

const swift = `${nativeHeader(nativeNote)}
import SwiftUI
import Figma

${icons
  .map(
    (icon) => `struct ${typeName(icon.name)}: FigmaConnect {
    let component = KozmosIcon.self
    let figmaNodeUrl = "${nodeUrl(icon)}"

    var body: some View {
        ${swiftBody(icon)}
    }
}`,
  )
  .join("\n\n")}
`;

const kotlin = `${nativeHeader(nativeNote)}
package com.kozmos.components.icon

${[
  ...(kotlinNotes ? ["androidx.compose.foundation.layout.Spacer"] : []),
  ...(kotlinDrawsSymbols
    ? [
        "androidx.compose.material.icons.Icons",
        ...kotlinImports,
        "androidx.compose.material3.Icon",
      ]
    : []),
  "androidx.compose.runtime.Composable",
  ...(kotlinNotes ? ["androidx.compose.ui.Modifier"] : []),
  "com.figma.code.connect.FigmaConnect",
]
  .map((name) => `import ${name}`)
  .join("\n")}

${icons
  .map(
    (icon) => `@FigmaConnect("${nodeUrl(icon)}")
class ${typeName(icon.name)} {
    @Composable
    fun ComponentExample() {
        ${kotlinBody(icon)}
    }
}`,
  )
  .join("\n\n")}
`;

const targets = [
  ["packages/react/src/components/Icon/IconLibrary.figma.tsx", out],
  ["packages/ios/Sources/Components/Icon/IconLibrary.figma.swift", swift],
  [
    "packages/android/src/main/java/com/kozmos/components/Icon/IconLibrary.figma.kt",
    kotlin,
  ],
];
if (check) {
  const stale = targets.filter(([target, content]) => {
    const file = path.join(root, target);
    return (
      (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "") !== content
    );
  });
  if (stale.length) {
    for (const [target] of stale) {
      console.error(
        `${target} is stale: run \`pnpm figma:iconconnect\` and commit the result.`,
      );
    }
    process.exit(1);
  }
  console.log(
    `${icons.length} icon connections on each of React, SwiftUI and Compose are current (from ${path.basename(baselinePath)})`,
  );
} else {
  for (const [target, content] of targets) {
    const file = path.join(root, target);
    // An unchanged file keeps its time: a rewrite makes React's file newer
    // than dist/style.css, and components:classes:check then refuses to
    // trust the stylesheet until React is rebuilt.
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (current !== content) fs.writeFileSync(file, content);
    console.log(
      `${icons.length} icon connections -> ${target}${current === content ? " (unchanged)" : ""} (from ${path.basename(baselinePath)})`,
    );
  }
}
