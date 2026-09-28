import {
  Button,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Switch,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Settings() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Map settings</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Stack gap={3}>
          <Text weight="semibold">Map settings</Text>
          <Switch label="Show step-free routes" defaultChecked />
          <Switch label="Show closed places" />
        </Stack>
      </PopoverContent>
    </Popover>
  );
}

function WithAnArrow() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">What is this?</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <Text size="sm">A small explanation, pointed at what it explains.</Text>
      </PopoverContent>
    </Popover>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A small panel",
    description:
      "Non-modal, anchored to its trigger, owned by the nearest ThemeProvider’s overlay root.",
    Component: Settings,
  },
  { title: "With an arrow", Component: WithAnArrow },
];
