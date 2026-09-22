import {
  Box,
  Chip,
  List,
  ListItem,
  ScrollArea,
  Stack,
  Text,
} from "@kozmos/react";
import type { DemoModule } from "../types";

const quickAccess = [
  "Shops",
  "Food and drink",
  "Toilets",
  "Information",
  "Transport",
  "Events",
  "Offices",
  "Wi-Fi",
  "Parking",
  "First aid",
];

function Sideways() {
  return (
    <Box className="site-demo-column">
      <ScrollArea
        orientation="horizontal"
        viewportProps={{ "aria-label": "Quick access" }}
      >
        {/* A ChipGroup is what a quick-access row is made of, but it always
            wraps (GAP-64), so inside a horizontal ScrollArea it makes a
            second line instead of scrolling. A Stack keeps them on one. */}
        <Stack direction="row" gap={2} wrap="nowrap">
          {quickAccess.map((label) => (
            <Chip key={label} size="sm">
              {label}
            </Chip>
          ))}
        </Stack>
      </ScrollArea>
      <Text size="sm" color="muted">
        The scrollbar is hidden by default; the viewport is focusable and
        scrolls with the keyboard.
      </Text>
    </Box>
  );
}

function Vertical() {
  return (
    <Box className="site-demo-column">
      {/* A vertical ScrollArea fills its parent's height, so the parent
          bounds it; a height on the viewport itself loses to the viewport's
          own h-full. */}
      <Box className="site-demo-scroll">
        <ScrollArea
          hideScrollbar={false}
          viewportProps={{ "aria-label": "Floors" }}
        >
          <List density="compact">
            {Array.from({ length: 14 }, (_, index) => (
              <ListItem key={index}>
                <Text as="span" size="sm">
                  Level {14 - index}
                </Text>
              </ListItem>
            ))}
          </List>
        </ScrollArea>
      </Box>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Sideways",
    description:
      'orientation="horizontal" needs no height; a quick-access row scrolls under the thumb.',
    Component: Sideways,
  },
  {
    title: "Up and down",
    description:
      "A vertical scroller needs a bounded height; here the viewport carries it.",
    Component: Vertical,
  },
];
