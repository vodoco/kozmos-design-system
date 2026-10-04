import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attachedStories,
  generate,
  platformsOf,
  readDescription,
  readDocComment,
  readStories,
  sanitize,
  slugOf,
  storyNameFromExport,
} from "./generate-reference.mjs";

test("slugs keep acronyms whole", () => {
  assert.equal(slugOf("Button"), "button");
  assert.equal(slugOf("AdaptiveMapShell"), "adaptive-map-shell");
  assert.equal(slugOf("POIDetailPanel"), "poi-detail-panel");
  assert.equal(slugOf("AISearchButton"), "ai-search-button");
  assert.equal(slugOf("OTPInput"), "otp-input");
  assert.equal(slugOf("POICard"), "poi-card");
});

/** A status as the status script reports it, everything found unless changed. */
function status(changes = {}) {
  const base = {
    name: "Thing",
    lane: "core",
    codeConnectApplicable: true,
    web: {
      component: true,
      story: true,
      test: true,
      figmaFile: true,
      codeConnect: true,
      barrel: true,
      exported: true,
    },
    ios: { component: true, figmaFile: true, codeConnect: true },
    android: { component: true, figmaFile: true, codeConnect: true },
  };
  return {
    ...base,
    ...changes,
    web: { ...base.web, ...changes.web },
    ios: { ...base.ios, ...changes.ios },
    android: { ...base.android, ...changes.android },
  };
}

test("a platform has a component where its library has it; Figma, where Code Connect links it", () => {
  assert.deepEqual(platformsOf(status()), {
    react: "implemented",
    swiftui: "implemented",
    compose: "implemented",
    figma: "linked",
  });
  // Not yet on iOS or Android, and not linked in Figma: AICompanionPanel's case.
  assert.deepEqual(
    platformsOf(
      status({
        web: { codeConnect: false, figmaFile: false },
        ios: { component: false, codeConnect: false, figmaFile: false },
        android: { component: false, codeConnect: false, figmaFile: false },
      }),
    ),
    {
      react: "implemented",
      swiftui: "not-yet",
      compose: "not-yet",
      figma: "not-yet",
    },
  );
  // A component the package does not export is not implemented in React.
  assert.equal(
    platformsOf(status({ web: { exported: false } })).react,
    "not-yet",
  );
  // A provider has no Figma component set by design: not expected there.
  assert.equal(
    platformsOf(
      status({
        codeConnectApplicable: false,
        web: { codeConnect: false },
        ios: { codeConnect: false },
        android: { codeConnect: false },
      }),
    ).figma,
    "not-expected",
  );
  // A mapping on any platform links the Figma component.
  assert.equal(
    platformsOf(
      status({ web: { codeConnect: false }, android: { codeConnect: false } }),
    ).figma,
    "linked",
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

test("the docs' placeholder sentence is no description (GAP-81)", () => {
  assert.equal(
    readDescription(
      "# Backdrop\n\nDisplays the Backdrop interface topology natively.\n",
    ),
    "",
  );
  // Only the placeholder itself: a real sentence that starts the same way stays.
  assert.equal(
    readDescription("# Map\n\nDisplays the venue's floors, natively.\n"),
    "Displays the venue's floors, natively.",
  );
});

test("the doc comment is the one on the component's own declaration, first paragraph", () => {
  const source = `
/** A helper, not the component. */
const helper = () => null;

/**
 * The search field's form once a category is chosen,
 * as the prototype draws it.
 *
 * Details a page does not need.
 */
const CategoryField = React.forwardRef(() => null);

/** A function component. */
export function Plain() { return null; }
`;
  assert.equal(
    readDocComment(source, "CategoryField"),
    "The search field's form once a category is chosen, as the prototype draws it.",
  );
  assert.equal(readDocComment(source, "Plain"), "A function component.");
  assert.equal(readDocComment(source, "Missing"), "");
});

test("Storybook's ids are made from a title and a story's export as Storybook makes them", () => {
  // Ids read from a Storybook build's index.json.
  assert.equal(
    sanitize("Product SDK/AICompanionPanel"),
    "product-sdk-aicompanionpanel",
  );
  assert.equal(sanitize("Data Display/Accordion"), "data-display-accordion");
  assert.equal(sanitize("Components/Button"), "components-button");
  assert.equal(storyNameFromExport("InTheSearchRow"), "In The Search Row");
  assert.equal(
    sanitize(storyNameFromExport("InTheSearchRow")),
    "in-the-search-row",
  );
  assert.equal(sanitize(storyNameFromExport("Default")), "default");
});

test("the docs name the stories file they attach to, and it names its title", () => {
  const mdx = `import { Meta } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";
import * as Other from "./Other.stories";

<Meta of={ButtonStories} />
`;
  assert.equal(attachedStories(mdx), "./Button.stories");
  assert.equal(attachedStories("# No meta\n"), null);

  const stories = `import type { Meta, StoryObj } from "@storybook/react";
const meta = {
  title: "Components/Button",
  component: Button,
} satisfies Meta<typeof Button>;
export default meta;

export const Default: Story = { args: { title: "Not the meta" } };
export const Outline: Story = {};
`;
  assert.deepEqual(readStories(stories, "Button.stories.tsx"), {
    title: "Components/Button",
    first: "Default",
  });
  assert.throws(
    () => readStories("export default {};", "Bare.stories.tsx"),
    /Bare\.stories\.tsx: no "Group\/Name" title/,
  );
});

test("explicit Storybook IDs survive a title move without reading IDs in fixture data", () => {
  const source = `const data = { id: "fixture-id" };
const meta = { id: "components-button", title: "Core/Actions/Button" } satisfies Meta;
export default meta;
export const Default = {};`;
  assert.equal(
    readStories(source, "Button.stories.tsx").id,
    "components-button",
  );
});

test("a lane the site does not name stops the build", () => {
  assert.throws(
    () =>
      generate({
        lanes: [{ id: "watch", title: "Watch", description: "" }],
        components: [],
      }),
    /lanes the site does not name: watch/,
  );
});

/**
 * The real thing: the generator over the repository, through the status
 * script. One test checks several facts that hold today.
 */
test("the generator reads the repository's components as they are", () => {
  const { lanes, components } = generate();
  const byName = new Map(
    components.map((component) => [component.name, component]),
  );
  assert.ok(components.length >= 100, `only ${components.length} components`);
  assert.equal(
    byName.has("Instruction"),
    false,
    "Internal text helpers are not public components",
  );
  assert.match(lanes.core.description, /Figma/);

  assert.deepEqual(byName.get("Button").platforms, {
    react: "implemented",
    swiftui: "implemented",
    compose: "implemented",
    figma: "linked",
  });
  assert.equal(byName.get("Button").storybook, "/docs/components-button--docs");
  // Not on iOS yet, which is what a SwiftUI tab once failed to say.
  assert.equal(byName.get("AICompanionPanel").platforms.swiftui, "not-yet");
  // A provider: no Figma component set, by design.
  assert.equal(byName.get("ThemeProvider").platforms.figma, "not-expected");
  // No docs page: its first story instead.
  assert.equal(
    byName.get("CategoryField").storybook,
    "/story/product-sdk-categoryfield--default",
  );
  // Every component has a slug, a lane the site names and a Storybook page.
  for (const component of components) {
    assert.ok(
      lanes[component.lane],
      `${component.name}: lane ${component.lane}`,
    );
    assert.match(
      component.storybook ?? "",
      /^\/(docs|story)\/[a-z0-9-]+--[a-z0-9-]+$/,
      component.name,
    );
    assert.doesNotMatch(
      component.description,
      /interface topology/,
      component.name,
    );
  }
});
