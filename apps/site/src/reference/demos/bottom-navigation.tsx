import { useState } from "react";
import { BottomNavigation, Box, Icon, Switch, Text } from "@kozmos-ds/react";
import { Screen } from "../Screen";
import type { DemoModule } from "../types";

const tabs = [
  { id: "explore", label: "Explore", icon: "map-01" },
  { id: "search", label: "Search", icon: "search-md" },
  { id: "saved", label: "Saved", icon: "heart" },
  { id: "you", label: "You", icon: "user-01" },
] as const;

function Summon() {
  // Kozmos's default is compact; switching it off asks for the taller items.
  const [compact, setCompact] = useState(true);
  const [active, setActive] = useState("explore");
  return (
    <Box className="site-demo-column">
      <Screen>
        <BottomNavigation
          aria-label="App sections"
          density={compact ? "compact" : "default"}
          items={tabs.map((tab) => ({
            label: tab.label,
            icon: <Icon name={tab.icon} />,
            active: active === tab.id,
            onClick: () => setActive(tab.id),
            badge: tab.id === "saved" ? 2 : undefined,
          }))}
        />
      </Screen>
      <Text size="sm" color="muted">
        The bar pins itself to the bottom of the window and takes no placement
        from the page around it (GAP-29). The screen above is its window, so the
        bar is as wide as the app it belongs to, not as the browser. Its items
        sit 8px from the edges, which a rounded screen’s corner cuts into: the
        first and last fills are sliced, as they would be on a phone (GAP-53).
      </Text>
      <Box className="site-demo-row">
        <Switch
          label="Compact"
          checked={compact}
          onCheckedChange={setCompact}
        />
        <Text size="sm" color="muted" aria-live="polite">
          {tabs.find((tab) => tab.id === active)?.label} is the current tab.
        </Text>
      </Box>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Summon the bar",
    description:
      'A phone app’s bottom bar: four tabs, active marks the current one, badge counts what is waiting. Compact is the default; switching it off sets density="default", which makes each item 72px tall and pads it by 8 — and the bar stays 64px, so the items spill out of it (GAP-68). Nothing else changes: the icons, labels and badges are the same size in both.',
    Component: Summon,
    tall: true,
  },
];
