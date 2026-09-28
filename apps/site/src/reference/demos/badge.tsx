import { Badge, Box, Icon } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Variants() {
  return (
    <Box className="site-demo-row">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </Box>
  );
}

function WithCounterAndIcon() {
  return (
    <Box className="site-demo-row">
      <Badge counter={3} showCounter>
        Notifications
      </Badge>
      <Badge variant="outline" counter={12} showCounter>
        Open places
      </Badge>
      <Badge variant="secondary" icon={<Icon name="marker-pin-01" size="sm" />}>
        First floor
      </Badge>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Variants",
    description: "Six variants on the button’s shape and sizes.",
    Component: Variants,
  },
  {
    title: "With a counter or an icon",
    description: "counter with showCounter adds a count; icon leads the label.",
    Component: WithCounterAndIcon,
  },
];
