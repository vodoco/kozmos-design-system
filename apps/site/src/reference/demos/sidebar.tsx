import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Box,
  Button,
  Icon,
  NavigationItem,
  Sidebar,
  Stack,
  Switch,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const items = [
  { id: "venues", label: "Venues", icon: "building-01" },
  { id: "reports", label: "Reports", icon: "activity" },
  { id: "settings", label: "Settings", icon: "settings-01" },
] as const;

function Expanded() {
  const [current, setCurrent] = useState("venues");
  return (
    <Box className="site-demo-map">
      <Sidebar
        aria-label="Venue Manager"
        header={
          <Text as="span" weight="bold">
            Venue Manager
          </Text>
        }
        navigation={
          <Stack gap={1}>
            {items.map((item) => (
              <NavigationItem
                key={item.id}
                icon={<Icon name={item.icon} />}
                selected={current === item.id}
                onClick={() => setCurrent(item.id)}
              >
                {item.label}
              </NavigationItem>
            ))}
          </Stack>
        }
        tools={
          <Button size="sm" variant="outline">
            Invite
          </Button>
        }
        footer={
          <Stack direction="row" align="center" gap={2}>
            <Avatar role="img" aria-label="Sam Rivera">
              <AvatarFallback aria-hidden="true">SR</AvatarFallback>
            </Avatar>
            <Text as="span" size="sm">
              Sam Rivera
            </Text>
          </Stack>
        }
      />
    </Box>
  );
}

function Collapsible() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Stack gap={3}>
      <Switch
        label="Collapsed"
        checked={collapsed}
        onCheckedChange={setCollapsed}
      />
      <Box className="site-demo-map">
        <Sidebar
          aria-label="Rail"
          collapsed={collapsed}
          collapsible
          navigation={
            <Stack gap={1}>
              {items.map((item) => (
                <NavigationItem
                  key={item.id}
                  placement={collapsed ? "rail" : "side"}
                  icon={<Icon name={item.icon} />}
                  selected={item.id === "venues"}
                >
                  {item.label}
                </NavigationItem>
              ))}
            </Stack>
          }
        />
      </Box>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Header, navigation, tools, footer",
    description: "An aside that fills its parent’s height, with four slots.",
    Component: Expanded,
    tall: true,
  },
  {
    title: "Collapsing to a rail",
    description:
      'collapsed switches to a 5rem rail; collapsible animates the width. The items follow with placement="rail".',
    Component: Collapsible,
    tall: true,
  },
];
