import figma from "@figma/code-connect";
import { CategoryTile, type CategoryTileProps } from "./CategoryTile";

const categoryTileUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8039";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const categoryIcon: CategoryTileProps["icon"];
declare const selectCategory: CategoryTileProps["onSelect"];

// The Tint axis: Theme is a tile with no tint; the eight are the taxonomy's
// quick-access colours as the Semantics.Category tokens' CSS variables — the
// accent, the fill and the ink that reads on it. Code Connect takes literals
// only, so each is written out.
figma.connect(CategoryTile, categoryTileUrl, {
  props: {
    label: figma.string("Label Text"),
    selected: figma.enum("State", {
      Default: false,
      Selected: true,
      Disabled: false,
    }),
    disabled: figma.enum("State", {
      Default: false,
      Selected: false,
      Disabled: true,
    }),
    tint: figma.enum("Tint", {
      Theme: undefined,
      Yellow: {
        accent: "var(--semantics-category-accent-yellow)",
        fill: "var(--semantics-category-fill-yellow)",
        onFill: "var(--semantics-category-on-fill-yellow)",
      },
      Orange: {
        accent: "var(--semantics-category-accent-orange)",
        fill: "var(--semantics-category-fill-orange)",
        onFill: "var(--semantics-category-on-fill-orange)",
      },
      Turquoise: {
        accent: "var(--semantics-category-accent-turquoise)",
        fill: "var(--semantics-category-fill-turquoise)",
        onFill: "var(--semantics-category-on-fill-turquoise)",
      },
      Red: {
        accent: "var(--semantics-category-accent-red)",
        fill: "var(--semantics-category-fill-red)",
        onFill: "var(--semantics-category-on-fill-red)",
      },
      Blue: {
        accent: "var(--semantics-category-accent-blue)",
        fill: "var(--semantics-category-fill-blue)",
        onFill: "var(--semantics-category-on-fill-blue)",
      },
      Navy: {
        accent: "var(--semantics-category-accent-navy)",
        fill: "var(--semantics-category-fill-navy)",
        onFill: "var(--semantics-category-on-fill-navy)",
      },
      Green: {
        accent: "var(--semantics-category-accent-green)",
        fill: "var(--semantics-category-fill-green)",
        onFill: "var(--semantics-category-on-fill-green)",
      },
      Pink: {
        accent: "var(--semantics-category-accent-pink)",
        fill: "var(--semantics-category-fill-pink)",
        onFill: "var(--semantics-category-on-fill-pink)",
      },
    }),
    // Show Count is category.resultCount being set; the number itself is the
    // nested Counter's text, which is product data.
    resultCount: figma.boolean("Show Count", {
      true: 12,
      false: undefined,
    }),
  },
  // category is a CategoryPresentation from @kozmos-ds/product-contracts; the
  // Figma set carries the label, the selection state and the count, so the
  // rest of the object is product data supplied by the caller.
  example: ({ label, selected, disabled, tint, resultCount }) => (
    <CategoryTile
      category={{ id: "transport", label, selected, disabled, resultCount }}
      icon={categoryIcon}
      tint={tint}
      onSelect={(categoryId) => selectCategory(categoryId)}
    />
  ),
});
