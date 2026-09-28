import { Container, Surface, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Centred() {
  return (
    <Container>
      <Surface className="site-theme-sample">
        <Text size="sm">
          A Container centres its content up to a maximum width and adds the
          page’s side padding — 16px on a phone, more on wider screens. Every
          page of this site sits in one.
        </Text>
      </Surface>
    </Container>
  );
}

function Fluid() {
  return (
    <Container centered={false}>
      <Surface className="site-theme-sample">
        <Text size="sm">
          centered=false keeps the padding and drops the maximum width.
        </Text>
      </Surface>
    </Container>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "Centred", Component: Centred },
  { title: "Fluid", Component: Fluid },
];
