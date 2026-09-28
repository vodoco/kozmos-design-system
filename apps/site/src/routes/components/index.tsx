import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  ChipGroup,
  Container,
  EmptyState,
  SearchBar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@kozmos-ds/react";
import { pageTitle } from "../../lib/site";
import {
  componentIndex,
  componentsInLane,
  countOn,
  laneOrder,
  laneTitle,
  platformLabel,
  platformOrder,
} from "../../reference/nav";
import { StatusTable, StatusTag } from "../../reference/Status";
import type { ComponentSummary, Lane } from "../../reference/types";
import { StorybookButtonLink } from "../../site/links";
import { PageHeader, Section } from "../../site/Section";

const total = componentIndex.components.length;

export function meta() {
  return [
    { title: pageTitle("Components") },
    {
      name: "description",
      content: `${total} Kozmos components in four lanes, and where each one exists: React, SwiftUI, Compose and Figma. Their docs, stories and code are in Storybook.`,
    },
  ];
}

/**
 * "React 83 of 83 · SwiftUI 74 of 83 · …": how far a set of components has
 * come on each platform, of those it could have come to (Figma is not
 * expected to have a provider).
 */
function counts(components: readonly ComponentSummary[]) {
  return platformOrder
    .map((platform) => {
      const { present, expected } = countOn(platform, components);
      return expected === 0
        ? `${platformLabel[platform]} not expected`
        : `${platformLabel[platform]} ${present} of ${expected}`;
    })
    .join(" · ");
}

/** What each mark says, and what none of them does. */
function Marks() {
  const marks = [
    {
      state: "implemented",
      means:
        "React, SwiftUI or Compose: the platform’s library has the component — its source, where that library keeps its components, and for React an export of the package.",
    },
    {
      state: "linked",
      means:
        "Figma: a Code Connect mapping ties the component to a node in the Figma library, so Dev Mode shows its code beside the design.",
    },
    {
      state: "not-yet",
      means:
        "Not on that platform yet. In Figma, not linked yet: it may be drawn, but no mapping names it.",
    },
    {
      state: "not-expected",
      means:
        "Figma only: a provider, a typography primitive or a nonvisual utility, which has no Figma component set by design.",
    },
  ] as const;
  return (
    <Stack gap={4}>
      <Table aria-label="What the marks mean">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Mark</TableHead>
            <TableHead scope="col">What it means</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {marks.map((mark) => (
            <TableRow key={mark.state}>
              <TableCell>
                <StatusTag state={mark.state} />
              </TableCell>
              <TableCell>
                <Text as="span" size="sm">
                  {mark.means}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Text size="sm">
        A mark says a file is there. The script that writes the repository’s
        status report finds it (<code>scripts/skills/check-completion.ts</code>
        ), and it proves structure only. It does not say the platforms match:
        not their variants or their API, their look, their accessibility, their
        behaviour, their tests, or whether they are ready to ship. Variant
        parity is tracked on its own, in{" "}
        <code>docs/component-variant-gap-analysis.md</code>, and each
        component’s docs in Storybook show its code on every platform.
      </Text>
    </Stack>
  );
}

export default function Components() {
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<Lane>();

  // Word by word, as the site's search matches: "date picker" finds
  // DatePicker, and every word must appear in the name or the description.
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return componentIndex.components.filter((component) => {
      if (lane && component.lane !== lane) return false;
      const haystack =
        `${component.name} ${component.description}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [query, lane]);

  return (
    <Container className="site-page">
      <PageHeader
        title="Components"
        lead={`${total} components in four lanes, and where each one exists: React, SwiftUI, Compose and Figma. Each one’s docs, stories and controls, and its code on every platform, are in Storybook.`}
      >
        <Stack direction="row">
          <StorybookButtonLink>Open Storybook</StorybookButtonLink>
        </Stack>
        <Text size="sm" color="muted">
          {`All ${total}: ${counts(componentIndex.components)}.`}
        </Text>
      </PageHeader>

      <Section id="marks" title="What the marks mean">
        <Marks />
      </Section>

      <Section
        title="Every component, by platform"
        actions={
          <Stack gap={3}>
            <SearchBar
              variant="inline"
              aria-label="Search components"
              placeholder="Search components"
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
            />
            {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
            <ChipGroup role="group" aria-label="Lanes">
              <Chip
                size="sm"
                selected={!lane}
                onClick={() => setLane(undefined)}
              >
                All
              </Chip>
              {laneOrder.map((entry) => (
                <Chip
                  key={entry}
                  size="sm"
                  selected={lane === entry}
                  onClick={() => setLane(lane === entry ? undefined : entry)}
                >
                  {laneTitle(entry)}
                </Chip>
              ))}
            </ChipGroup>
          </Stack>
        }
      >
        <Text size="sm" color="muted" aria-live="polite">
          {shown.length} of {total} shown
        </Text>
        {shown.length === 0 ? (
          <EmptyState
            title="No component matches"
            description="Try another word, or clear the lane."
          />
        ) : (
          <Box className="site-status-lanes">
            {laneOrder.map((entry) => {
              const rows = shown.filter(
                (component) => component.lane === entry,
              );
              if (rows.length === 0) return null;
              const all = componentsInLane(entry);
              return (
                <Section
                  key={entry}
                  level={3}
                  title={laneTitle(entry)}
                  lead={`${componentIndex.lanes[entry].description} ${all.length} components: ${counts(all)}.`}
                >
                  <StatusTable
                    label={`${laneTitle(entry)} components by platform`}
                    components={rows}
                  />
                </Section>
              );
            })}
          </Box>
        )}
      </Section>
    </Container>
  );
}
