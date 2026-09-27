import {
  Box,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  NavigationItem,
  Stack,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const sides = ["left", "right", "top", "bottom"] as const;

function FromEachSide() {
  return (
    <Box className="site-demo-row">
      {sides.map((side) => (
        <Drawer key={side}>
          <DrawerTrigger asChild>
            <Button variant="outline">From the {side}</Button>
          </DrawerTrigger>
          <DrawerContent side={side}>
            <DrawerHeader>
              <DrawerTitle>Riverside Centre</DrawerTitle>
              <DrawerDescription>A drawer from the {side}.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      ))}
    </Box>
  );
}

function AsNavigation() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Menu</Button>
      </DrawerTrigger>
      <DrawerContent side="left">
        <DrawerHeader>
          <DrawerTitle>Venue Manager</DrawerTitle>
          <DrawerDescription>Where do you want to go?</DrawerDescription>
        </DrawerHeader>
        <Stack gap={1}>
          <NavigationItem selected>Venues</NavigationItem>
          <NavigationItem>Reports</NavigationItem>
          <NavigationItem>Settings</NavigationItem>
        </Stack>
      </DrawerContent>
    </Drawer>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "From each side",
    description:
      "side chooses the edge; left and right take up to 24rem, top and bottom up to 80% of the height.",
    Component: FromEachSide,
  },
  {
    title: "As a navigation menu",
    description:
      "How this site’s reference pages offer their sidebar on a phone.",
    Component: AsNavigation,
  },
];
