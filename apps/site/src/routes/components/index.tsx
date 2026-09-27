import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  ChipGroup,
  Container,
  EmptyState,
  SearchBar,
  Skeleton,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { pageTitle } from "../../lib/site";
import { componentIndex, laneOrder, laneTitle } from "../../reference/nav";
import { hasDemos, lazyDemos } from "../../reference/registry";
import type { ComponentSummary, Lane } from "../../reference/types";
import { SiteLink } from "../../site/links";
import { PageHeader, Section } from "../../site/Section";
import { withCode } from "../../site/inline-code";

export function meta() {
  return [
    { title: pageTitle("Components") },
    {
      name: "description",
      content: `${componentIndex.components.length} Kozmos components, each shown live with its props, and with its React, SwiftUI and Compose code where its docs carry it.`,
    },
  ];
}

/** How many components' docs carry their code on all three platforms. */
const withAllCode = componentIndex.components.filter(
  (component) => component.code.length === 3,
).length;

/** A component's first demo, mounted once it is near the viewport. */
function Preview({ slug }: { slug: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = frame.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const Demos = lazyDemos(slug);
  return (
    <Box ref={frame} className="site-preview" aria-hidden="true" inert>
      {near ? (
        <Suspense fallback={<Skeleton className="site-demo-loading" />}>
          <Demos>
            {(demos) => {
              const First = demos[0]?.Component;
              return First ? <First /> : null;
            }}
          </Demos>
        </Suspense>
      ) : null}
    </Box>
  );
}

function ComponentCard({ component }: { component: ComponentSummary }) {
  return (
    <Card className="site-example-card">
      {hasDemos(component.slug) ? <Preview slug={component.slug} /> : null}
      <CardHeader>
        <Stack direction="row" align="center" justify="between" gap={2}>
          <CardTitle>{component.name}</CardTitle>
          <Tag variant="secondary">{laneTitle(component.lane)}</Tag>
        </Stack>
        <CardDescription>
          {component.description
            ? withCode(component.description)
            : "No description in its docs yet."}
        </CardDescription>
        <Text size="sm">
          <SiteLink to={`/components/${component.slug}`}>
            Open {component.name}
          </SiteLink>
        </Text>
      </CardHeader>
    </Card>
  );
}

export default function Components() {
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<Lane>();

  // Word by word, as the site's search matches: "date picker" finds
  // DatePicker, and every word must appear in the name, the description or
  // a part's name.
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return componentIndex.components.filter((component) => {
      if (lane && component.lane !== lane) return false;
      const haystack = [
        component.name,
        component.description,
        ...component.exports,
      ]
        .join(" ")
        .toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [query, lane]);

  return (
    <Container className="site-page">
      <PageHeader
        title="Components"
        lead={`${componentIndex.components.length} components in four lanes, each with live examples and its props read from the source. ${withAllCode} also show their React, SwiftUI and Compose code from their docs; the other ${componentIndex.components.length - withAllCode} docs do not carry all three yet.`}
      />
      <Section
        title="Every component"
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
          {shown.length} of {componentIndex.components.length} shown
        </Text>
        {shown.length === 0 ? (
          <EmptyState
            title="No component matches"
            description="Try another word, or clear the lane."
          />
        ) : (
          <Box className="site-grid site-grid-wide">
            {shown.map((component) => (
              <ComponentCard key={component.slug} component={component} />
            ))}
          </Box>
        )}
      </Section>
    </Container>
  );
}
