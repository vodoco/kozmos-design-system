import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Box,
  Button,
  Icon,
  IconButton,
  Navbar,
  NavigationItem,
  Tag,
  Text,
} from "@kozmos/react";
import type { DemoModule } from "../types";

const pages = ["Venues", "Reports", "Settings"];

function Full() {
  const [current, setCurrent] = useState("Venues");
  return (
    <Box className="site-demo-wide">
      <Navbar
        navigationLabel="Venue Manager"
        logo={
          <Text as="span" weight="bold">
            Venue Manager
          </Text>
        }
        context={<Tag variant="secondary">Riverside Centre</Tag>}
        navigation={
          <Box className="site-demo-row">
            {pages.map((page) => (
              <NavigationItem
                key={page}
                placement="top"
                selected={current === page}
                onClick={() => setCurrent(page)}
              >
                {page}
              </NavigationItem>
            ))}
          </Box>
        }
        primaryAction={
          // The icon's space from the words is the site's (GAP-56).
          <Button size="sm" className="site-button-icon">
            <Icon name="plus" size="sm" />
            New venue
          </Button>
        }
        utilities={
          <IconButton aria-label="Notifications">
            <Icon name="bell-01" size="sm" />
          </IconButton>
        }
        account={
          <Avatar role="img" aria-label="Sam Rivera">
            <AvatarFallback aria-hidden="true">SR</AvatarFallback>
          </Avatar>
        }
      />
    </Box>
  );
}

function Minimal() {
  return (
    <Box className="site-demo-wide">
      <Navbar
        navigationLabel="Demo site"
        logo={
          <Text as="span" weight="bold">
            Kozmos
          </Text>
        }
        navigation={
          <Box className="site-demo-row">
            <NavigationItem placement="top" selected>
              Foundations
            </NavigationItem>
            <NavigationItem placement="top">Components</NavigationItem>
          </Box>
        }
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Every slot",
    description:
      "logo, context, navigation, primaryAction, utilities and account. It wraps to its width and is always sticky (GAP-19).",
    Component: Full,
  },
  { title: "Logo and navigation", Component: Minimal },
];
