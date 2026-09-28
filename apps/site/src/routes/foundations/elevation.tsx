import { Box, Stack, Surface, Text } from "@kozmos-ds/react";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { GlassStage } from "../../foundations/GlassStage";
import { SwatchList, TokenTable } from "../../foundations/parts";
import { foundationPage } from "../../foundations/nav";
import { shortName, tokensWithPrefix } from "../../lib/tokens";
import { Section } from "../../site/Section";

const page = foundationPage("elevation");

export function meta() {
  return foundationMeta(page);
}

export default function Elevation() {
  const elevation = tokensWithPrefix("--semantics-elevation-");
  const glass = tokensWithPrefix("--semantics-effect-glass-");
  const opacity = tokensWithPrefix("--primitives-opacity-");
  return (
    <DocsPage page={page}>
      <Section
        title="Elevation roles"
        lead="Three depths, each a role: barely lifted, floating over content it does not belong to, and above everything."
      >
        <Stack gap={4}>
          <Box className="site-side-by-side">
            {elevation.map((entry) => (
              <Surface
                key={entry.name}
                className="site-theme-sample site-elevated"
                style={{ "--shadow": `var(${entry.name})` }}
              >
                <Text weight="semibold">
                  {shortName(entry.name, "--semantics-elevation")}
                </Text>
                <Text size="sm" color="muted">
                  {entry.description}
                </Text>
              </Surface>
            ))}
          </Box>
          <TokenTable
            entries={elevation}
            caption="Elevation tokens"
            labelPrefix="--semantics-elevation"
          />
        </Stack>
      </Section>

      <Section title="Overlay" lead="What sits between a modal and the page.">
        <SwatchList
          entries={tokensWithPrefix("--semantics-overlay-")}
          prefix="--semantics-overlay"
        />
      </Section>

      <Section
        title="Glass"
        lead="A material, chosen per surface: Surface, the manoeuvre card, the route summary and others take variant glass. With transparency reduced — by the design config or the system — it is the plain colour."
      >
        <Stack gap={4}>
          <GlassStage />
          <TokenTable
            entries={glass}
            caption="Glass effect tokens"
            labelPrefix="--semantics-effect-glass"
          />
        </Stack>
      </Section>

      <Section title="Opacity" lead="The steps a component may fade to.">
        <Stack direction="row" wrap="wrap" gap={4}>
          {opacity.map((entry) => (
            <Box key={entry.name} className="site-shape-cell">
              <Box
                className="site-opacity"
                aria-hidden="true"
                style={{ "--level": `var(${entry.name})` }}
              />
              <Text as="span" size="sm" className="site-mono">
                {shortName(entry.name, "--primitives-opacity")}
              </Text>
            </Box>
          ))}
        </Stack>
      </Section>
    </DocsPage>
  );
}
