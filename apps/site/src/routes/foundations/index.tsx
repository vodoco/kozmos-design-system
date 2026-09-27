import {
  Box,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Icon,
  Stack,
  Text,
  ThemeProvider,
  type IconProps,
} from "@kozmos-ds/react";
import { foundationPages, foundationsSection } from "../../foundations/nav";
import { Specimen } from "../../foundations/parts";
import { pageTitle } from "../../lib/site";
import { ramp, tokens } from "../../lib/tokens";
import { SiteLink } from "../../site/links";
import { PageHeader, Section } from "../../site/Section";

export function meta() {
  return [
    { title: pageTitle("Foundations") },
    { name: "description", content: foundationsSection.summary },
  ];
}

const previewIcons: NonNullable<IconProps["name"]>[] = [
  "map-01",
  "marker-pin-01",
  "route",
  "compass-01",
  "search-md",
  "heart",
  "bell-01",
  "settings-01",
];

/** A glimpse of each page, drawn from the same tokens the page is. */
function Preview({ slug }: { slug: string }) {
  switch (slug) {
    case "colour":
      return (
        <Box className="site-swatch-row" aria-hidden="true">
          {ramp("--primitives-colors-theme")
            .filter((entry) => entry.name.match(/-(100|300|500|600|700|900)$/))
            .map((entry) => (
              <Box
                key={entry.name}
                className="site-swatch-cell"
                style={{ "--swatch": `var(${entry.name})` }}
              />
            ))}
        </Box>
      );
    case "typography":
      return (
        <Stack direction="row" align="baseline" gap={3} aria-hidden="true">
          <Specimen
            size="--primitives-typography-font-size-headings-h2"
            lineHeight="--primitives-typography-line-height-600"
          >
            Aa
          </Specimen>
          <Specimen
            size="--primitives-typography-font-size-headings-h4"
            lineHeight="--primitives-typography-line-height-400"
          >
            Aa
          </Specimen>
          <Specimen
            size="--primitives-typography-font-size-paragraph-regular"
            lineHeight="--primitives-typography-line-height-200"
            weight="normal"
          >
            Aa
          </Specimen>
        </Stack>
      );
    case "layout":
      return (
        <Stack gap={1} aria-hidden="true">
          {["100", "200", "300", "400", "600"].map((step) => (
            <Box
              key={step}
              className="site-bar"
              style={{
                "--len": `calc(var(--primitives-layout-spacing-${step}) * 4)`,
              }}
            />
          ))}
        </Stack>
      );
    case "elevation":
      return (
        <Stack direction="row" gap={3} aria-hidden="true">
          {["raised", "floating", "overlay"].map((role) => (
            <Box
              key={role}
              className="site-swatch-cell site-elevated"
              style={{
                "--swatch": "var(--primitives-colors-background-0)",
                "--shadow": `var(--semantics-elevation-${role})`,
              }}
            />
          ))}
        </Stack>
      );
    case "motion":
      return (
        <Stack gap={1} aria-hidden="true">
          {["quick", "standard", "deliberate"].map((name) => (
            <Text key={name} as="span" size="sm" className="site-mono">
              {name} ·{" "}
              {
                tokens.find(
                  (t) => t.name === `--semantics-motion-duration-${name}`,
                )?.light
              }
            </Text>
          ))}
        </Stack>
      );
    case "icons":
      return (
        <Box className="site-icon-grid" aria-hidden="true">
          {previewIcons.map((name) => (
            <Box key={name} className="site-icon-cell">
              <Icon name={name} />
            </Box>
          ))}
        </Box>
      );
    case "theming":
      return (
        <Box className="site-swatch-row" aria-hidden="true">
          <ThemeProvider theme="light">
            <Box
              className="site-swatch-cell site-swatch-cell-wide"
              style={{ "--swatch": "var(--primitives-colors-background-25)" }}
            />
          </ThemeProvider>
          <ThemeProvider theme="dark">
            <Box
              className="site-swatch-cell site-swatch-cell-wide"
              style={{ "--swatch": "var(--primitives-colors-background-25)" }}
            />
          </ThemeProvider>
        </Box>
      );
    default:
      return null;
  }
}

export default function Foundations() {
  return (
    <Container className="site-page">
      <PageHeader
        title="Foundations"
        lead={`${tokens.length} tokens from one source: all of them on the web, and the colours, spacing, radii, shadows and motion in Swift and Kotlin. These pages read them live, so what you see here is what the components use.`}
      />
      {/* CardTitle is always an h3 (GAPS.md, GAP-14), so the cards sit under an h2. */}
      <Section
        title={`${foundationPages.length} pages`}
        lead="Each one is drawn from the tokens it describes."
      >
        <Box className="site-grid site-grid-wide">
          {foundationPages.map((page) => (
            <Card key={page.slug} className="site-card-fill">
              <CardHeader>
                <Preview slug={page.slug} />
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.summary}</CardDescription>
                <Text size="sm">
                  <SiteLink to={`/foundations/${page.slug}`}>
                    Open {page.title}
                  </SiteLink>
                </Text>
              </CardHeader>
            </Card>
          ))}
        </Box>
      </Section>
    </Container>
  );
}
