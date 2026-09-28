import assert from "node:assert/strict";
import { test } from "node:test";
import { checkLinks, storybookPaths } from "./check-storybook-links.mjs";

/** A Storybook index.json's shape: entries by id, each a docs page or a story. */
const index = {
  v: 5,
  entries: {
    "components-button--docs": { id: "components-button--docs", type: "docs" },
    "components-button--default": {
      id: "components-button--default",
      type: "story",
    },
    "product-sdk-categoryfield--default": {
      id: "product-sdk-categoryfield--default",
      type: "story",
    },
  },
};

test("a build answers its docs pages and its stories by their paths", () => {
  assert.deepEqual([...storybookPaths(index)].sort(), [
    "/docs/components-button--docs",
    "/story/components-button--default",
    "/story/product-sdk-categoryfield--default",
  ]);
});

test("a link to a page the build lacks is broken; no link at all is reported apart", () => {
  const components = [
    { name: "Button", storybook: "/docs/components-button--docs" },
    {
      name: "CategoryField",
      storybook: "/story/product-sdk-categoryfield--default",
    },
    // A title renamed in the stories and not in the site's data.
    { name: "Alert", storybook: "/docs/feedback-alert--docs" },
    // A story id used as a docs page.
    { name: "Default", storybook: "/docs/components-button--default" },
    { name: "Native", storybook: null },
  ];
  const { broken, unlinked } = checkLinks(components, index);
  assert.deepEqual(
    broken.map((component) => component.name),
    ["Alert", "Default"],
  );
  assert.deepEqual(
    unlinked.map((component) => component.name),
    ["Native"],
  );
});
