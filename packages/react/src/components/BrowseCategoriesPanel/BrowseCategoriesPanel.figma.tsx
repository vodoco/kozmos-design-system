import figma from "@figma/code-connect";
import { EmptyState } from "../EmptyState/EmptyState";
import { SearchBar } from "../SearchBar/SearchBar";
import {
  BrowseCategoriesPanel,
  type BrowseCategoriesPanelProps,
} from "./BrowseCategoriesPanel";

const browseCategoriesPanelUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8026";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const categories: BrowseCategoriesPanelProps["categories"];
declare const renderCategoryIcon: BrowseCategoriesPanelProps["renderIcon"];
declare const selectCategory: BrowseCategoriesPanelProps["onSelect"];

// Content's SearchBar and EmptyState are drawn only by mappings, which Code
// Connect does not collect imports from: they are listed here.
figma.connect(BrowseCategoriesPanel, browseCategoriesPanelUrl, {
  imports: [
    "import { BrowseCategoriesPanel, SearchBar, EmptyState } from '@kozmos-ds/react';",
  ],
  props: {
    label: figma.string("Panel Label Text"),
    search: figma.enum("Content", {
      Basic: undefined,
      Search: <SearchBar />,
      Empty: undefined,
    }),
    emptyState: figma.enum("Content", {
      Basic: undefined,
      Search: undefined,
      Empty: <EmptyState title="No categories match" />,
    }),
  },
  example: ({ label, search, emptyState }) => (
    <BrowseCategoriesPanel
      label={label}
      categories={categories}
      renderIcon={(category) => renderCategoryIcon(category)}
      onSelect={(categoryId) => selectCategory(categoryId)}
      search={search}
      emptyState={emptyState}
    />
  ),
});
