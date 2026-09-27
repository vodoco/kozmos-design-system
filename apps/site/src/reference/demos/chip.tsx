import { useState } from "react";
import { Box, Chip, ChipGroup, Icon } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const filters = ["Open now", "Step-free", "Food and drink", "Shops"];

function Filters() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(["Open now"]),
  );
  return (
    // GAP-32: ChipGroup is a plain div; the role makes the label count.
    <ChipGroup role="group" aria-label="Filters">
      {filters.map((filter) => (
        <Chip
          key={filter}
          selected={selected.has(filter)}
          onClick={() =>
            setSelected((current) => {
              const next = new Set(current);
              if (next.has(filter)) next.delete(filter);
              else next.add(filter);
              return next;
            })
          }
        >
          {filter}
        </Chip>
      ))}
    </ChipGroup>
  );
}

function Removable() {
  const [tags, setTags] = useState(["Books", "Café", "Author events"]);
  return (
    // GAP-32: ChipGroup is a plain div; the role makes the label count.
    <ChipGroup role="group" aria-label="Tags">
      {tags.map((tag) => (
        <Chip
          key={tag}
          variant="brand"
          removeLabel={`Remove ${tag}`}
          onRemove={() => setTags(tags.filter((t) => t !== tag))}
        >
          {tag}
        </Chip>
      ))}
    </ChipGroup>
  );
}

function SizesAndVariants() {
  return (
    <Box className="site-demo-row">
      <Chip size="sm">Small</Chip>
      <Chip>Default</Chip>
      <Chip size="lg">Large</Chip>
      <Chip variant="brand" icon={<Icon name="check" />}>
        Brand
      </Chip>
      <Chip variant="destructive">Destructive</Chip>
      <Chip disabled>Disabled</Chip>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Filters",
    description: "Chips with onClick are buttons; selected fills them.",
    Component: Filters,
  },
  {
    title: "Removable",
    description: "onRemove adds a labelled remove button.",
    Component: Removable,
  },
  {
    title: "Sizes and variants",
    Component: SizesAndVariants,
  },
];
