import { Box, Icon, MetaStrip, MetaStripItem } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Facts() {
  return (
    <Box className="site-demo-column">
      <MetaStrip aria-label="About the bookshop">
        <MetaStripItem
          label="Floor"
          icon={<Icon name="building-01" size="sm" />}
        >
          First floor
        </MetaStripItem>
        <MetaStripItem label="Walk" icon={<Icon name="route" size="sm" />}>
          3 min
        </MetaStripItem>
        <MetaStripItem label="Hours" icon={<Icon name="clock" size="sm" />}>
          Until 20:00
        </MetaStripItem>
      </MetaStrip>
    </Box>
  );
}

function WithVisibleLabels() {
  return (
    <Box className="site-demo-column">
      <MetaStrip aria-label="Venue">
        <MetaStripItem label="Floors" showLabel>
          3
        </MetaStripItem>
        <MetaStripItem label="Places" showLabel>
          148
        </MetaStripItem>
        <MetaStripItem label="Updated" showLabel>
          Today
        </MetaStripItem>
      </MetaStrip>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Small facts with icons",
    description:
      "A row of label-and-value pairs; the label is read even when only the icon shows.",
    Component: Facts,
  },
  {
    title: "With visible labels",
    description: "showLabel draws the label too.",
    Component: WithVisibleLabels,
  },
];
