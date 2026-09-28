import { Box, Icon, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const colours = ["default", "muted", "primary", "destructive"] as const;

function Sizes() {
  return (
    <Box className="site-demo-row">
      {sizes.map((size) => (
        <Stack key={size} align="center" gap={1}>
          <Icon name="marker-pin-01" size={size} />
          <Text as="span" size="xs" color="muted">
            {size}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

function Colours() {
  return (
    <Box className="site-demo-row">
      {colours.map((colour) => (
        <Stack key={colour} align="center" gap={1}>
          <Icon name="heart" size="lg" color={colour} />
          <Text as="span" size="xs" color="muted">
            {colour}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

function ByAlias() {
  return (
    <Box className="site-demo-row">
      <Icon name="back" />
      <Icon name="search" />
      <Icon name="close" />
      <Icon name="settings" />
      <Text size="sm" color="muted">
        back, search, close and settings are aliases for arrow-left, search-md,
        x-close and settings-01.
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Sizes",
    description:
      "xs to xl, 12 to 32px. The stroke is 2 of the icon’s 24 units, so it grows with it: 1px at xs, about 2.7px at xl.",
    Component: Sizes,
  },
  {
    title: "Colours",
    description: "current text colour by default, or a role.",
    Component: Colours,
  },
  { title: "By alias", Component: ByAlias },
];
