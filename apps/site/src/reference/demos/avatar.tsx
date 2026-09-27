import { Avatar, AvatarFallback, Box, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const people = [
  { initials: "SR", name: "Sam Rivera" },
  { initials: "AK", name: "Ayşe Kaya" },
  { initials: "JO", name: "Jonah Okafor" },
];

function Initials() {
  return (
    <Box className="site-demo-row">
      {people.map((person) => (
        <Stack key={person.initials} align="center" gap={1}>
          <Avatar role="img" aria-label={person.name}>
            <AvatarFallback aria-hidden="true">
              {person.initials}
            </AvatarFallback>
          </Avatar>
          <Text as="span" size="xs" color="muted">
            {person.name}
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

function WithAnImage() {
  return (
    <Stack gap={2}>
      <Avatar role="img" aria-label="Sam Rivera">
        <AvatarFallback aria-hidden="true">SR</AvatarFallback>
      </Avatar>
      <Text size="sm" color="muted">
        AvatarImage takes a src and shows the fallback until it loads, or if it
        never does. The site has no photographs, so the fallback is what shows.
      </Text>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Initials",
    description:
      "The fallback: two letters in the muted surface. The name is the avatar’s accessible name.",
    Component: Initials,
  },
  {
    title: "With an image",
    description: "AvatarImage over AvatarFallback.",
    Component: WithAnImage,
  },
];
