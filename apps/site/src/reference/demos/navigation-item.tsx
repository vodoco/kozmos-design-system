import { useState } from "react";
import { Box, Icon, NavigationItem, Stack } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const items = [
  { id: "venues", label: "Venues", icon: "building-01" },
  { id: "reports", label: "Reports", icon: "activity", badge: 4 },
  { id: "settings", label: "Settings", icon: "settings-01" },
] as const;

function Side() {
  const [current, setCurrent] = useState("venues");
  return (
    <Box className="site-demo-column">
      <Stack gap={1}>
        {items.map((item) => (
          <NavigationItem
            key={item.id}
            placement="side"
            icon={<Icon name={item.icon} />}
            badge={"badge" in item ? item.badge : undefined}
            selected={current === item.id}
            onClick={() => setCurrent(item.id)}
          >
            {item.label}
          </NavigationItem>
        ))}
        <NavigationItem
          placement="side"
          icon={<Icon name="lock-01" />}
          disabled
        >
          Billing
        </NavigationItem>
      </Stack>
    </Box>
  );
}

function TopAndRail() {
  return (
    <Stack gap={4}>
      <Box className="site-demo-row">
        <NavigationItem placement="top" selected>
          Overview
        </NavigationItem>
        <NavigationItem placement="top" icon={<Icon name="map-01" />}>
          Explore
        </NavigationItem>
        <NavigationItem
          placement="top"
          trailing={<Icon name="chevron-down" size="sm" />}
        >
          More
        </NavigationItem>
      </Box>
      <Box className="site-demo-row">
        {items.map((item) => (
          <NavigationItem
            key={item.id}
            placement="rail"
            icon={<Icon name={item.icon} />}
            selected={item.id === "venues"}
          >
            {item.label}
          </NavigationItem>
        ))}
      </Box>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "In a sidebar",
    description:
      'placement="side": full width, icon, label, a badge, selected and disabled states. With href it is a link; without, a button.',
    Component: Side,
  },
  {
    title: "In a top bar, and in a rail",
    description:
      'placement="top" is inline; "rail" stacks the icon over the label.',
    Component: TopAndRail,
  },
];
