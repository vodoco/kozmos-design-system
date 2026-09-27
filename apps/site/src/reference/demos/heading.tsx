import { Heading, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Levels() {
  return (
    <Stack gap={2}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        // The page has its h1 already: level 1 is shown at its size as an h2.
        <Heading
          key={level}
          level={level}
          {...(level === 1 ? { as: "h2" as const } : {})}
        >
          Level {level}: find your way
        </Heading>
      ))}
    </Stack>
  );
}

function LevelAndElement() {
  return (
    <Stack gap={2}>
      <Heading level={2} as="h3">
        Looks like a level 2, is an h3
      </Heading>
      <Heading level={4} color="muted" align="center">
        Muted and centred
      </Heading>
      <Text size="sm" color="muted">
        level sets the size; as sets the element, so the outline and the look
        can differ. The sizes stop at 36px; the tokens go to 60 (GAP-21).
      </Text>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "Six levels", Component: Levels },
  { title: "Level and element apart", Component: LevelAndElement },
];
