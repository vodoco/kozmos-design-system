import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { PairSample, type ContrastPair } from "../../foundations/PairSample";
import { Ramp, SwatchList, TokenTable } from "../../foundations/parts";
import { foundationPage } from "../../foundations/nav";
import contract from "../../generated/contrast-contract.json";
import { contrastRatio, formatRatio, parseColour } from "../../lib/contrast";
import { token, tokensWithPrefix } from "../../lib/tokens";
import { Section } from "../../site/Section";

const page = foundationPage("colour");

export function meta() {
  return foundationMeta(page);
}

const ramps = [
  { prefix: "--primitives-colors-background", title: "Background" },
  { prefix: "--primitives-colors-foreground", title: "Foreground" },
  { prefix: "--primitives-colors-theme", title: "Theme" },
  { prefix: "--primitives-colors-theme-variant-1", title: "Theme variant 1" },
  { prefix: "--primitives-colors-theme-variant-2", title: "Theme variant 2" },
  { prefix: "--primitives-colors-accent", title: "Accent" },
  { prefix: "--primitives-colors-emotional-success", title: "Success" },
  { prefix: "--primitives-colors-emotional-info", title: "Information" },
  { prefix: "--primitives-colors-emotional-danger", title: "Danger" },
  { prefix: "--primitives-colors-emotional-alert", title: "Alert" },
  { prefix: "--primitives-colors-transparent", title: "Transparent" },
  {
    prefix: "--primitives-colors-transparent-inverted",
    title: "Transparent, inverted",
  },
];

const semanticGroups = [
  {
    prefix: "--semantics-surface",
    title: "Surface",
    lead: "The page and the layers on it.",
  },
  {
    prefix: "--semantics-border",
    title: "Border",
    lead: "Two edges: the subtle one containers wear, and the one things you interact with wear, held to 3:1.",
  },
  {
    prefix: "--semantics-emotion",
    title: "Emotion",
    lead: "Six meanings — themed, neutral, success, danger, informative, alert — each as a surface, the ink on it, and text on the page.",
  },
  {
    prefix: "--semantics-accent",
    title: "Accent",
    lead: "What is featured: the accent’s fill and the ink on it. A featured pin and POIResultCard’s Featured tab and edge wear it. Amber unless a product sets its own (decision 68).",
  },
  {
    prefix: "--semantics-category",
    title: "Category",
    lead: "The taxonomy’s eight quick-access colours: an accent, a fill, and the ink that reads on the fill at 4.5:1.",
  },
  {
    prefix: "--semantics-data",
    title: "Data",
    lead: "Six colours for series and markers.",
  },
  {
    prefix: "--semantics-diff",
    title: "Diff",
    lead: "What changed: new, updated, deleted, overridden.",
  },
  {
    prefix: "--semantics-overlay",
    title: "Overlay",
    lead: "The scrim behind a dialog, a drawer and a backdrop, and a lighter dim that no component uses yet.",
  },
  {
    prefix: "--semantics-result",
    title: "Result",
    lead: "A search result’s surface when it is selected, and when a pointer is over it.",
  },
  {
    prefix: "--semantics-map",
    title: "Map",
    lead: "Fixed for what sits on a map, so they are the same in both themes: the credit line’s text and the halo, one unit wide, around it; the user-location marker’s dot and its ring.",
  },
];

/** One contract pair measured in one theme. */
function measure(
  background: string,
  foreground: string,
  theme: "light" | "dark",
) {
  const bg = token(`--${background}`);
  const fg = token(`--${foreground}`);
  const bgColour = bg && parseColour(bg[theme]);
  const fgColour = fg && parseColour(fg[theme]);
  if (!bgColour || !fgColour) return undefined;
  return contrastRatio(fgColour, bgColour);
}

function ContrastContract() {
  const pairs = contract.pairs as ContrastPair[];
  const results = pairs.map((pair) => ({
    ...pair,
    light: measure(pair.background, pair.foreground, "light"),
    dark: measure(pair.background, pair.foreground, "dark"),
  }));
  const failing = results.filter(
    (r) =>
      r.light === undefined ||
      r.dark === undefined ||
      r.light < r.minimum ||
      r.dark < r.minimum,
  );
  return (
    <Stack gap={4}>
      <Stack direction="row" wrap="wrap" align="center" gap={2}>
        <Tag emotion={failing.length ? "danger" : "success"} variant="outline">
          {failing.length
            ? `${failing.length} pairs below their minimum`
            : `All ${results.length} pairs pass in both themes`}
        </Tag>
        <Text size="sm" color="muted">
          Ratios computed here from the token values, the same files CI reads.
        </Text>
      </Stack>
      <Table aria-label="Contrast contract">
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead>Sample</TableHead>
            <TableHead>Minimum</TableHead>
            <TableHead>Light</TableHead>
            <TableHead>Dark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((pair) => (
            <TableRow key={pair.name}>
              <TableCell>
                <Stack gap={0}>
                  <Text as="span" size="sm" weight="medium">
                    {pair.name}
                  </Text>
                  <Text as="span" size="xs" color="muted" className="site-mono">
                    {pair.foreground} on {pair.background}
                  </Text>
                </Stack>
              </TableCell>
              <TableCell>
                <PairSample pair={pair} />
              </TableCell>
              <TableCell>
                <Text as="span" size="sm">
                  {pair.minimum}:1
                </Text>
              </TableCell>
              {(["light", "dark"] as const).map((theme) => {
                const ratio = pair[theme];
                const ok = ratio !== undefined && ratio >= pair.minimum;
                return (
                  <TableCell key={theme}>
                    <Tag emotion={ok ? "success" : "danger"} variant="outline">
                      {ratio === undefined
                        ? "unresolved"
                        : `${formatRatio(ratio)} · ${ok ? "Pass" : "Fail"}`}
                    </Tag>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}

function ComponentLayer() {
  const entries = tokensWithPrefix("--components-");
  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    // --components-primary-buttons-… → "Primary buttons"
    const [kind = "", part = ""] = entry.name
      .replace(/^--components-/, "")
      .split("-");
    const group = `${kind.charAt(0).toUpperCase()}${kind.slice(1)} ${part}`;
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  const references = entries.filter((entry) => entry.references).length;
  return (
    <Stack gap={3}>
      <Text color="muted">
        {entries.length} variables: for each kind of button, each of the six
        emotions’ idle, hover, pressed and focus colours, and thirteen for the
        HTML headings. {references} are references to a ramp in one theme or
        both, every themed button colour on the theme ramp among them, so an
        override of the ramp reaches them (GAP-23); the rest are values. Today
        the Button’s themed and danger variants and the category field read a
        few of them, and every part with a prominent fill reads the themed
        button’s foreground, white on the theme fill in both themes (decision
        59); no component reads the rest.
      </Text>
      <Accordion type="multiple">
        {[...groups].map(([group, list]) => (
          <AccordionItem key={group} value={group}>
            <AccordionTrigger>
              {group} · {list.length}
            </AccordionTrigger>
            <AccordionContent>
              <TokenTable
                entries={list}
                caption={`${group} tokens`}
                labelPrefix="--components"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Stack>
  );
}

export default function Colour() {
  return (
    <DocsPage page={page}>
      <Section
        title="Primitive ramps"
        lead={`${ramps.length} ramps. Background and foreground run in opposite directions, and each ramp turns over in the dark theme, so a step number means the same in both. The two transparent ramps are opacity steps instead, the same in either theme. Each swatch shows its light and dark values.`}
      >
        <Stack gap={8}>
          {ramps.map((entry) => (
            <Ramp
              key={entry.prefix}
              prefix={entry.prefix}
              title={entry.title}
            />
          ))}
        </Stack>
      </Section>

      <Section
        title="Semantic roles"
        lead="Named for what they do, not what they look like. Kozmos’s web components read the border and overlay roles, the category and data colours, and the emotion roles in a few parts (Tag, Counter, the route preview). Most of their colour still comes from the primitive ramps, through the Tailwind theme, so a changed role does not yet reach every part."
      >
        <Stack gap={8}>
          {semanticGroups.map((group) => (
            <Section
              key={group.prefix}
              level={3}
              title={group.title}
              lead={group.lead}
            >
              <SwatchList
                entries={tokensWithPrefix(`${group.prefix}-`).filter(
                  (entry) => parseColour(entry.light) !== undefined,
                )}
                prefix={group.prefix}
              />
            </Section>
          ))}
        </Stack>
      </Section>

      <Section
        title="The contrast contract"
        lead={`The ${contract.pairs.length} colour pairs the tokens package holds to WCAG AA: text on the page and its surfaces, the selected and tinted states, the five filled actions and the buttons, the map’s credit line and the user-location marker, measured here from the stylesheet in both themes. A pair held to 3:1 is a shape or an edge, not text, so its sample is a dot. CI measures the same pairs on every pull request, with every button emotion and state and the category inks besides, and fails when one drops below its minimum.`}
      >
        <ContrastContract />
      </Section>

      <Section
        title="The component layer"
        lead="Below the roles sits a third layer: one variable per state of a part, so far for the buttons and the HTML headings."
      >
        <ComponentLayer />
      </Section>
    </DocsPage>
  );
}
