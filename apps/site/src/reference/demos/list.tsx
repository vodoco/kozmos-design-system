import { Box, Icon, List, ListItem, Stack, Tag, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const rows = [
  { name: "Bookshop", floor: "First floor", open: true },
  { name: "Information desk", floor: "Ground floor", open: true },
  { name: "Lost property", floor: "First floor", open: false },
];

function Places() {
  return (
    <Box className="site-demo-column">
      <List aria-label="Places">
        {rows.map((row) => (
          <ListItem key={row.name}>
            <Stack direction="row" align="center" justify="between" gap={3}>
              <Stack direction="row" align="center" gap={2}>
                <Icon name="marker-pin-01" color="muted" />
                <Stack gap={0}>
                  <Text as="span" weight="medium">
                    {row.name}
                  </Text>
                  <Text as="span" size="sm" color="muted">
                    {row.floor}
                  </Text>
                </Stack>
              </Stack>
              <Tag emotion={row.open ? "success" : "neutral"} variant="outline">
                {row.open ? "Open" : "Closed"}
              </Tag>
            </Stack>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function Compact() {
  return (
    <Box className="site-demo-column">
      <List density="compact" aria-label="Floors">
        {["Second floor", "First floor", "Ground floor", "Car park"].map(
          (floor) => (
            <ListItem key={floor}>
              <Text as="span" size="sm">
                {floor}
              </Text>
            </ListItem>
          ),
        )}
      </List>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Rows with content",
    description:
      "A ul with rows of at least 48px; what goes in a row is the caller’s.",
    Component: Places,
  },
  {
    title: "Compact",
    description: 'density="compact" for 40px rows.',
    Component: Compact,
  },
];
