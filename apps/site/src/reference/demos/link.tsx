import { Link, Stack, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function InText() {
  return (
    <Stack gap={2}>
      <Text>
        The venue’s <Link href="#main">opening hours</Link> are on its page, and
        so is the <Link href="#main">accessibility statement</Link>.
      </Text>
      <Text color="muted">
        A subtle link{" "}
        <Link href="#main" variant="subtle">
          sits in muted text
        </Link>{" "}
        and takes the foreground colour on hover.
      </Text>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "In text",
    description:
      "A real anchor. default is the primary colour; subtle follows muted text. Each click is reported to analytics with its href.",
    Component: InText,
  },
];
