import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Surface,
  Switch,
  Tag,
  Text,
  ThemeProvider,
} from "@kozmos/react";
import { DirectionSample } from "../../foundations/DirectionSample";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { foundationPage } from "../../foundations/nav";
import themeProvider from "../../generated/components/theme-provider.json";
import { MakeItYours } from "../../home/MakeItYours";
import { CodeBlock } from "../../site/CodeBlock";
import { Section } from "../../site/Section";

const page = foundationPage("theming");

export function meta() {
  return foundationMeta(page);
}

function Sample({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <Surface className="site-theme-sample">
      <Stack direction="row" align="center" justify="between" gap={2}>
        <Text weight="semibold">{label}</Text>
        <Tag emotion="informative" variant="outline">
          Live
        </Tag>
      </Stack>
      <Text size="sm" color="muted">
        The same components, the same tokens, this theme’s values.
      </Text>
      <Switch label="Notifications" checked={on} onCheckedChange={setOn} />
      <Stack direction="row" wrap="wrap" gap={2}>
        <Button emotion="themed">Primary</Button>
        <Button variant="outline">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </Stack>
    </Surface>
  );
}

export default function Theming() {
  return (
    <DocsPage page={page}>
      <Section
        title="Light and dark"
        lead="A ThemeProvider owns its subtree, never the document. Two can sit side by side; each carries its theme into its own overlays."
      >
        <Box className="site-side-by-side">
          <ThemeProvider theme="light">
            <Sample label="Light" />
          </ThemeProvider>
          <ThemeProvider theme="dark">
            <Sample label="Dark" />
          </ThemeProvider>
        </Box>
      </Section>

      <Section
        title="Right to left"
        lead="Set dir on a provider. Layout flips, the keyboard navigation inside Radix parts follows, and nested providers inherit it. Nothing mirrors a glyph that points along the reading direction (GAP-61): the buttons below pick their own arrow from the direction this page set, while the breadcrumb's separator is the component's and keeps pointing right, against the trail. A manoeuvre's arrow is a real direction and stays as it is."
      >
        <DirectionSample />
      </Section>

      <Section
        title="Following the system, and remembering a choice"
        lead="By default a provider follows the system’s preference and its live changes. Persistence is opt-in: give it a storage key your product owns. The site’s own switcher in the header does exactly this."
      >
        {themeProvider.snippets.react ? (
          <CodeBlock
            label="ThemeProvider"
            code={themeProvider.snippets.react}
          />
        ) : null}
      </Section>

      <Section
        title="Re-pointing tokens for a brand"
        lead="The tokens prop overrides variables for a subtree and its overlays. Here it points the theme at one of the two variant ramps the tokens carry."
      >
        <MakeItYours />
      </Section>
    </DocsPage>
  );
}
