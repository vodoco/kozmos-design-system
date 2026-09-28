import { Box, Icon, IconButton } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Variants() {
  return (
    <Box className="site-demo-row">
      <IconButton aria-label="Search">
        <Icon name="search-md" size="sm" />
      </IconButton>
      <IconButton variant="default" aria-label="Add">
        <Icon name="plus" size="sm" />
      </IconButton>
      <IconButton variant="outline" aria-label="Settings">
        <Icon name="settings-01" size="sm" />
      </IconButton>
      <IconButton variant="secondary" aria-label="Share">
        <Icon name="share-01" size="sm" />
      </IconButton>
      <IconButton variant="destructive" aria-label="Delete">
        <Icon name="trash-01" size="sm" />
      </IconButton>
    </Box>
  );
}

function Sizes() {
  return (
    <Box className="site-demo-row">
      <IconButton size="sm" variant="outline" aria-label="Small">
        <Icon name="heart" size="xs" />
      </IconButton>
      <IconButton variant="outline" aria-label="Icon size">
        <Icon name="heart" size="sm" />
      </IconButton>
      <IconButton size="lg" variant="outline" aria-label="Large">
        <Icon name="heart" />
      </IconButton>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Variants",
    description:
      "A Button sized for one icon, ghost by default. The accessible name is the aria-label; the icon is decorative.",
    Component: Variants,
  },
  { title: "Sizes", Component: Sizes },
];
