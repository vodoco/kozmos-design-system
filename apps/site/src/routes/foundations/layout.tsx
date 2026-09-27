import { Box, List, ListItem, Stack, Surface, Text } from "@kozmos-ds/react";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { TokenTable } from "../../foundations/parts";
import { foundationPage } from "../../foundations/nav";
import { shortName, tokensWithPrefix } from "../../lib/tokens";
import { Section } from "../../site/Section";

const page = foundationPage("layout");

export function meta() {
  return foundationMeta(page);
}

/** A scale of unitless pixel tokens, each drawn as a bar of its length. */
function Scale({ prefix, caption }: { prefix: string; caption: string }) {
  const entries = tokensWithPrefix(`${prefix}-`);
  return (
    <List density="compact" aria-label={caption}>
      {entries.map((entry) => (
        <ListItem key={entry.name}>
          {/* ListItem lays out as a flex row of its own (GAP-04); the
              scale's three columns are a Box inside it. */}
          <Box className="site-scale-row">
            <Text as="span" size="sm" className="site-mono">
              {shortName(entry.name, prefix)}
            </Text>
            <Box
              className="site-bar"
              style={{ "--len": `var(${entry.name})` }}
              aria-hidden="true"
            />
            <Text as="span" size="sm" color="muted" className="site-mono">
              {entry.light}
            </Text>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}

function Shapes({
  entries,
  prefix,
  unitless,
}: {
  entries: readonly { name: string; light: string }[];
  prefix: string;
  unitless: boolean;
}) {
  return (
    <Box className="site-shape-row">
      {entries.map((entry) => (
        <Box key={entry.name} className="site-shape-cell">
          <Surface
            className="site-shape"
            aria-hidden="true"
            style={{
              "--radius": unitless
                ? `calc(var(${entry.name}) * 1px)`
                : `var(${entry.name})`,
            }}
          >
            <Box className="site-shape-fill" />
          </Surface>
          <Text as="span" size="sm" className="site-mono">
            {shortName(entry.name, prefix)}
          </Text>
          <Text as="span" size="xs" color="muted" className="site-mono">
            {entry.light}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

export default function Layout() {
  const semanticRadius = tokensWithPrefix("--semantics-radius-");
  const primitiveRadius = tokensWithPrefix("--primitives-radius-");
  const screens = tokensWithPrefix("--primitives-screen-");
  const touch = tokensWithPrefix("--primitives-touch-");
  return (
    <DocsPage page={page}>
      <Section
        title="Spacing"
        lead="Unitless pixels, so one scale serves CSS, SwiftUI and Compose. On the web, multiply by 1px."
      >
        <Scale prefix="--primitives-layout-spacing" caption="Spacing scale" />
      </Section>

      <Section
        title="Sizing"
        lead="Control and icon sizes, on the same footing."
      >
        <Scale prefix="--primitives-layout-sizing" caption="Sizing scale" />
      </Section>

      <Section
        title="Radius roles"
        lead="Six roles, unitless like the spacing, each an alias of the layout radius scale. Re-point one and the components that read it follow; a few still name a primitive radius or a pixel value of their own."
      >
        <Stack gap={6}>
          <Shapes
            entries={semanticRadius}
            prefix="--semantics-radius"
            unitless
          />
          <TokenTable
            entries={semanticRadius}
            caption="Radius roles"
            labelPrefix="--semantics-radius"
          />
        </Stack>
      </Section>

      <Section
        title="Radius primitives"
        lead="The older rem-based scale and its per-part aliases (card, input, button, default), which some components still read. The roles above do not come from it: they alias the unitless layout radius scale."
      >
        <Shapes
          entries={primitiveRadius}
          prefix="--primitives-radius"
          unitless={false}
        />
      </Section>

      <Section title="Border widths">
        <TokenTable
          entries={tokensWithPrefix("--primitives-border-width-")}
          caption="Border widths"
          labelPrefix="--primitives-border-width"
        />
      </Section>

      <Section
        title="Breakpoints"
        lead="Named for the device class and part of the Tailwind theme Kozmos builds with, though no component uses them yet: the few that change with the viewport use Tailwind’s own steps, and the map shell measures its container. CSS variables cannot appear in a media query, so on the web these are documentation, and values in the native token files."
      >
        <List density="compact" aria-label="Breakpoints">
          {screens.map((entry) => (
            <ListItem key={entry.name}>
              <Box className="site-scale-row">
                <Text as="span" size="sm" className="site-mono">
                  {shortName(entry.name, "--primitives-screen")}
                </Text>
                <Box
                  className="site-bar"
                  aria-hidden="true"
                  style={{ "--len": `calc(${parseInt(entry.light, 10)} / 4)` }}
                />
                <Text as="span" size="sm" color="muted" className="site-mono">
                  {entry.light}
                </Text>
              </Box>
            </ListItem>
          ))}
        </List>
      </Section>

      <Section
        title="Touch targets"
        lead="The smallest target a control may present, and the comfortable one. Not every Kozmos control meets the minimum yet: chips, toggle buttons, tab triggers, the slider’s thumb and the rating’s stars are smaller today. The clear buttons show how: a 44 target around a 24 circle in the search bar, a 32 one in the category field."
      >
        <Box className="site-shape-row">
          {touch.map((entry) => (
            <Box key={entry.name} className="site-shape-cell">
              <Surface
                className="site-shape"
                aria-hidden="true"
                style={{ "--radius": "var(--site-radius-control)" }}
              >
                <Box className="site-shape-fill" />
              </Surface>
              <Text as="span" size="sm" className="site-mono">
                {shortName(entry.name, "--primitives-touch")} · {entry.light}
              </Text>
            </Box>
          ))}
        </Box>
      </Section>

      <Section
        title="Layers"
        lead="The z-index steps, for the components' stacking."
      >
        <TokenTable
          entries={tokensWithPrefix("--primitives-layer-")}
          caption="Layers"
          labelPrefix="--primitives-layer"
        />
      </Section>
    </DocsPage>
  );
}
