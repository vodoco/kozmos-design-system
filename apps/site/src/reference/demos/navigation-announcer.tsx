import { useState } from "react";
import { Button, NavigationAnnouncer, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const steps = [
  "Head towards the atrium",
  "Turn left at the pharmacy in 20 metres",
  "Take the escalator to the first floor",
  "The bookshop is on your left",
];

function Announcements() {
  const [index, setIndex] = useState(0);
  return (
    <Stack gap={3} align="start">
      <Text size="sm" color="muted">
        Invisible on the page, the announcer speaks each new message through an
        assertive live region — what a screen reader hears while navigating.
      </Text>
      <NavigationAnnouncer message={steps[index]} />
      <Text weight="medium" aria-hidden="true">
        {steps[index]}
      </Text>
      <Button
        variant="outline"
        onClick={() => setIndex((value) => (value + 1) % steps.length)}
      >
        Next manoeuvre
      </Button>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Manoeuvres, announced",
    description:
      "message changes are announced once each; isActive false silences it.",
    Component: Announcements,
  },
];
