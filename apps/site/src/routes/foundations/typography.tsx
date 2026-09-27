import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@kozmos-ds/react";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { Specimen, TokenTable } from "../../foundations/parts";
import { foundationPage } from "../../foundations/nav";
import { tokensWithPrefix } from "../../lib/tokens";
import { Section } from "../../site/Section";

const page = foundationPage("typography");

export function meta() {
  return foundationMeta(page);
}

const textSizes = [
  "4xl",
  "3xl",
  "2xl",
  "xl",
  "lg",
  "base",
  "sm",
  "xs",
] as const;
const weights = ["normal", "medium", "semibold", "bold"] as const;

/** The heading tokens paired with the line-height token nearest above each. */
const headingScale = [
  { level: "h1", lineHeight: "700" },
  { level: "h2", lineHeight: "600" },
  { level: "h3", lineHeight: "500" },
  { level: "h4", lineHeight: "400" },
  { level: "h5", lineHeight: "300" },
  { level: "h6", lineHeight: "200" },
];

const paragraphScale = [
  { name: "xlarge", lineHeight: "400" },
  { name: "large", lineHeight: "300" },
  { name: "regular", lineHeight: "200" },
  { name: "small", lineHeight: "100" },
  { name: "xsmall", lineHeight: "50" },
];

/**
 * The Text component's scale, with each size measured in the browser after
 * mount rather than restated: the values live in the package's stylesheet.
 */
function TextScale() {
  const rows = useRef<Map<string, HTMLElement>>(new Map());
  const [measured, setMeasured] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const [size, element] of rows.current) {
      const style = getComputedStyle(element);
      next[size] = `${style.fontSize} / ${style.lineHeight}`;
    }
    setMeasured(next);
  }, []);

  return (
    <Box className="site-type-scale">
      {textSizes.map((size) => (
        <Stack key={size} direction="row" align="baseline" gap={4}>
          <Text as="span" size="sm" color="muted" className="site-mono">
            {size}
            {measured[size] ? ` · ${measured[size]}` : ""}
          </Text>
          <Text
            as="span"
            size={size}
            weight="medium"
            ref={(element) => {
              if (element) rows.current.set(size, element);
            }}
          >
            The quick brown fox jumps over the lazy dog
          </Text>
        </Stack>
      ))}
    </Box>
  );
}

export default function Typography() {
  const families = tokensWithPrefix("--semantics-typography-family-");
  const weightTokens = tokensWithPrefix("--primitives-typography-font-weight-");
  return (
    <DocsPage page={page}>
      <Section
        title="Families"
        lead="Three roles. The system stack is the default everywhere — SF Pro on Apple platforms, Roboto on Android, Segoe on Windows — so text matches the host. Mono is for code. Brand is opt-in and falls back to the system stack when its font is not loaded; nothing loads it today."
      >
        <Stack gap={4}>
          <Box className="site-side-by-side">
            <Stack gap={1}>
              <Text size="sm" color="muted">
                system
              </Text>
              <Text size="xl">The quick brown fox jumps over the lazy dog</Text>
            </Stack>
            <Stack gap={1}>
              <Text size="sm" color="muted">
                mono
              </Text>
              <Text size="xl" className="site-mono">
                The quick brown fox jumps over the lazy dog
              </Text>
            </Stack>
          </Box>
          <TokenTable
            entries={families}
            caption="Family tokens"
            labelPrefix="--semantics-typography-family"
          />
        </Stack>
      </Section>

      <Section
        title="The scale the components use"
        lead="Text takes a size from xs to 4xl and a weight; Heading maps its levels onto the top six. The values are measured here in your browser, from the package’s stylesheet."
      >
        <TextScale />
      </Section>

      <Section
        title="The heading tokens"
        lead="The tokens carry a heading scale of their own, from 60px down to 20px, as Figma draws it. Heading’s largest size is 36px: the two scales are not the same (GAP-21). This site sets its page and section titles from the tokens directly."
      >
        <Stack gap={6}>
          {headingScale.map((entry) => (
            <Stack key={entry.level} gap={1}>
              <Text size="sm" color="muted" className="site-mono">
                headings-{entry.level} · line-height-{entry.lineHeight}
              </Text>
              <Specimen
                size={`--primitives-typography-font-size-headings-${entry.level}`}
                lineHeight={`--primitives-typography-line-height-${entry.lineHeight}`}
              >
                Find your way
              </Specimen>
            </Stack>
          ))}
        </Stack>
        <Alert variant="info" role="note">
          <AlertDescription>
            The pairing of each size with a line height is this page’s, the
            nearest line-height token above the size; the tokens themselves pair
            nothing.
          </AlertDescription>
        </Alert>
      </Section>

      <Section title="The paragraph tokens">
        <Stack gap={4}>
          {paragraphScale.map((entry) => (
            <Stack key={entry.name} gap={1}>
              <Text size="sm" color="muted" className="site-mono">
                paragraph-{entry.name} · line-height-{entry.lineHeight}
              </Text>
              <Specimen
                size={`--primitives-typography-font-size-paragraph-${entry.name}`}
                lineHeight={`--primitives-typography-line-height-${entry.lineHeight}`}
                weight="normal"
              >
                Kozmos gives maps, places and wayfinding one set of parts.
              </Specimen>
            </Stack>
          ))}
        </Stack>
      </Section>

      <Section
        title="Weights"
        lead="Text takes four weights. The weight tokens carry Figma’s style names rather than numeric weights, so CSS cannot use them (GAP-22)."
      >
        <Stack gap={4}>
          <Stack direction="row" wrap="wrap" gap={6}>
            {weights.map((weight) => (
              <Stack key={weight} gap={0}>
                <Text size="sm" color="muted" className="site-mono">
                  {weight}
                </Text>
                <Text size="2xl" weight={weight}>
                  Aa
                </Text>
              </Stack>
            ))}
          </Stack>
          <TokenTable
            entries={weightTokens}
            caption="Weight tokens"
            labelPrefix="--primitives-typography-font-weight"
          />
        </Stack>
      </Section>

      <Section
        title="Line heights, letter spacing and paragraph spacing"
        lead="Unitless pixels. Letter and paragraph spacing reach iOS and Android too; line heights are the web’s, where the native libraries use the platform’s own text styles."
      >
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={3}>Line height</Heading>
            <TokenTable
              entries={tokensWithPrefix("--primitives-typography-line-height-")}
              caption="Line-height tokens"
              labelPrefix="--primitives-typography-line-height"
            />
          </Stack>
          <Stack gap={2}>
            <Heading level={3}>Letter spacing</Heading>
            <TokenTable
              entries={tokensWithPrefix(
                "--primitives-typography-letter-spacing-",
              )}
              caption="Letter-spacing tokens"
              labelPrefix="--primitives-typography-letter-spacing"
            />
          </Stack>
          <Stack gap={2}>
            <Heading level={3}>Paragraph spacing</Heading>
            <TokenTable
              entries={tokensWithPrefix(
                "--primitives-typography-paragraph-spacing-",
              )}
              caption="Paragraph-spacing tokens"
              labelPrefix="--primitives-typography-paragraph-spacing"
            />
          </Stack>
        </Stack>
      </Section>

      <Section title="Sizes as a table">
        <Table aria-label="Font-size tokens">
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Pixels</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokensWithPrefix("--primitives-typography-font-size-").map(
              (entry) => (
                <TableRow key={entry.name}>
                  <TableCell>
                    <Text as="span" size="sm" className="site-mono">
                      {entry.name.replace(
                        "--primitives-typography-font-size-",
                        "",
                      )}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text as="span" size="sm" className="site-mono">
                      {Number(entry.light).toFixed(1).replace(/\.0$/, "")}
                    </Text>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </Section>
    </DocsPage>
  );
}
