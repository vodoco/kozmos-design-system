import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generate,
  isComponentName,
  laneOf,
  readDescription,
  readLaneSets,
  readSnippets,
  slugOf,
} from "./generate-reference.mjs";

test("slugs keep acronyms whole", () => {
  assert.equal(slugOf("Button"), "button");
  assert.equal(slugOf("AdaptiveMapShell"), "adaptive-map-shell");
  assert.equal(slugOf("POIDetailPanel"), "poi-detail-panel");
  assert.equal(slugOf("AISearchButton"), "ai-search-button");
  assert.equal(slugOf("OTPInput"), "otp-input");
  assert.equal(slugOf("POICard"), "poi-card");
});

test("lane sets are read from the status script's source", () => {
  const sets = readLaneSets(`
    const INTERNAL_COMPONENT_NAMES = new Set(["GlassSettingsPanel"]);
    const PRODUCT_SDK_COMPONENT_NAMES = new Set([
      "AdaptiveMapShell",
      "MapView",
    ]);
    const CODE_ONLY_UTILITY_COMPONENT_NAMES = new Set(["Text"]);
    const PLATFORM_FORM_FACTOR_COMPONENT_NAMES = new Set(["DynamicIsland"]);
  `);
  assert.equal(laneOf("MapView", sets), "product-sdk");
  assert.equal(laneOf("Text", sets), "code-only");
  assert.equal(laneOf("DynamicIsland", sets), "platform-form-factor");
  assert.equal(laneOf("Button", sets), "core");
  assert.throws(
    () => readLaneSets("nothing here"),
    /INTERNAL_COMPONENT_NAMES not found/,
  );
});

test("the description is the first prose paragraph after the title", () => {
  const mdx = `import { Meta } from "@storybook/blocks";
import * as Stories from "./Surface.stories";

<Meta of={Stories} />

# Surface

What a surface over content is made of. **Solid** is the default on every
platform.

<Canvas of={Stories.Default} />
`;
  assert.equal(
    readDescription(mdx),
    "What a surface over content is made of. Solid is the default on every platform.",
  );
  assert.equal(readDescription("# Tag\n\n<Canvas />\n"), "");
});

test("snippets come from the PlatformSnippets block, dedented, first of each platform", () => {
  const mdx = `
<PlatformSnippets
    react={\`
import { Button } from "@kozmos-ds/react";
export function Example() {
  return <Button>Go</Button>;
}
    \`}
    swift={\`
import SwiftUI

KozmosButton("Go")
    \`}
    kotlin={\`
KozmosButton(text = "Go")
    \`}
/>
<PlatformSnippets react={\`second\`} />
`;
  const snippets = readSnippets(mdx);
  assert.deepEqual(Object.keys(snippets).sort(), ["kotlin", "react", "swift"]);
  assert.equal(
    snippets.react,
    `import { Button } from "@kozmos-ds/react";\nexport function Example() {\n  return <Button>Go</Button>;\n}`,
  );
  assert.equal(snippets.swift, 'import SwiftUI\n\nKozmosButton("Go")');
});

test("helpers and constants are not components", () => {
  assert.equal(isComponentName("Button"), true);
  assert.equal(isComponentName("CardHeader"), true);
  assert.equal(isComponentName("buttonVariants"), false);
  assert.equal(isComponentName("BUTTON_EMOTIONS"), false);
  assert.equal(isComponentName("POIDetailPanel"), true);
});

/**
 * The real thing: the generator over the repository. Slow (a TypeScript
 * program over every component), so one test checks several known facts.
 */
test("the generator reads the repository's components as they are", async () => {
  const { index, components } = await generate();
  const byName = new Map(
    components.map((component) => [component.name, component]),
  );
  assert.ok(
    index.components.length >= 100,
    `only ${index.components.length} components`,
  );

  // A cva-driven part: its own members plus the variants, with defaults.
  const button = byName
    .get("Button")
    .parts.find((part) => part.name === "Button");
  const names = button.props.map((prop) => prop.name);
  assert.deepEqual(names, ["emotion", "isLoading", "size", "variant"]);
  // Every string default is written as the type column writes a string:
  // double-quoted, from cva's defaultVariants as from destructuring.
  assert.equal(
    button.props.find((p) => p.name === "variant").defaultValue,
    '"default"',
  );
  const spinner = byName
    .get("Spinner")
    .parts.find((part) => part.name === "Spinner");
  assert.equal(
    spinner.props.find((p) => p.name === "size").defaultValue,
    '"md"',
  );
  assert.match(
    button.props.find((p) => p.name === "variant").type,
    /"outline"/,
  );
  assert.match(
    button.props.find((p) => p.name === "emotion").description,
    /What the button means/,
  );

  // An alias to a union of literals is spelled out.
  const surface = byName
    .get("Surface")
    .parts.find((part) => part.name === "Surface");
  assert.equal(
    surface.props.find((p) => p.name === "variant").type,
    '"solid" | "glass"',
  );
  assert.equal(
    surface.props.find((p) => p.name === "variant").defaultValue,
    '"solid"',
  );

  // Omit<> hides the element's attributes from docgen; not from this reader.
  const island = byName
    .get("DynamicIsland")
    .parts.find((part) => part.name === "DynamicIsland");
  assert.deepEqual(
    island.props.map((prop) => prop.name),
    [
      "compactLeading",
      "compactTrailing",
      "expandedContent",
      "islandState",
      "minimalContent",
    ],
  );

  // Required props and sub-parts.
  const metaStrip = byName.get("MetaStrip");
  const item = metaStrip.parts.find((part) => part.name === "MetaStripItem");
  assert.equal(item.props.find((p) => p.name === "label").required, true);
  assert.equal(item.props.find((p) => p.name === "showLabel").type, "boolean");

  // Only what the package exports is a part.
  assert.ok(
    !byName.get("Dialog").parts.some((part) => part.name === "ThemePortal"),
  );
  assert.ok(byName.get("Card").parts.some((part) => part.name === "CardTitle"));
});

test("fenced code under a platform's heading fills in what PlatformSnippets lacks", () => {
  const mdx = [
    "## React Usage",
    "",
    "```tsx",
    "<Chip>All</Chip>",
    "```",
    "",
    "## iOS SwiftUI",
    "",
    "```swift",
    'KozmosChip(text: "All")',
    "```",
    "",
    "## Android Jetpack Compose",
    "",
    "```kotlin",
    'KozmosChip(text = "All")',
    "```",
  ].join("\n");
  assert.deepEqual(readSnippets(mdx), {
    react: "<Chip>All</Chip>",
    swift: 'KozmosChip(text: "All")',
    kotlin: 'KozmosChip(text = "All")',
  });
  // PlatformSnippets wins where it has the platform.
  const both = `<PlatformSnippets swift={\`Snippet()\`} />\n\n${mdx}`;
  assert.equal(readSnippets(both).swift, "Snippet()");
  assert.equal(readSnippets(both).kotlin, 'KozmosChip(text = "All")');
});
