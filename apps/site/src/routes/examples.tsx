import { useState } from "react";
import {
  Box,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  SegmentedControl,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";
import {
  examples,
  exampleKindLabel,
  type ExampleKind,
} from "../examples/manifest";
import { pageTitle } from "../lib/site";
import { SiteLink } from "../site/links";
import { PageHeader, Section } from "../site/Section";

export function meta() {
  return [
    { title: pageTitle("Examples") },
    {
      name: "description",
      content:
        "Pages and apps built from Kozmos components only, each with its source; where they found Kozmos short is on the roadmap.",
    },
  ];
}

type Filter = "all" | ExampleKind;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "page", label: "Pages" },
  { value: "app", label: "Apps" },
];

function isFilter(value: string | undefined): value is Filter {
  return filters.some((filter) => filter.value === value);
}

export default function Examples() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = examples.filter(
    (example) => filter === "all" || example.kind === filter,
  );

  return (
    <Container className="site-page">
      <PageHeader
        title="Examples"
        lead={
          <>
            Pages and apps built from Kozmos components and nothing else, each
            with its source. Where they found Kozmos short is on the{" "}
            <SiteLink to="/roadmap">roadmap</SiteLink>.
          </>
        }
      />
      {/* CardTitle is always an h3 (GAPS.md, GAP-14), so the cards sit under
          an h2 of their own. */}
      <Section title="Pages and apps">
        <Stack
          direction="row"
          wrap="wrap"
          align="end"
          justify="between"
          gap={4}
        >
          <SegmentedControl
            label="Show"
            size="sm"
            items={filters}
            value={filter}
            onValueChange={(next) => {
              if (isFilter(next)) setFilter(next);
            }}
          />
          <Text size="sm" color="muted" aria-live="polite">
            {shown.length === 1 ? "1 example" : `${shown.length} examples`}
          </Text>
        </Stack>
        <Box className="site-grid site-grid-wide">
          {shown.map((example) => (
            <Card key={example.slug} className="site-card-fill">
              <CardHeader>
                <Stack direction="row" align="center" justify="between" gap={2}>
                  <CardTitle>{example.title}</CardTitle>
                  <Tag variant="secondary">
                    {exampleKindLabel[example.kind]}
                  </Tag>
                </Stack>
                <CardDescription>{example.summary}</CardDescription>
                <Text size="sm">
                  <SiteLink to={`/examples/${example.slug}`}>
                    Open {example.title}
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
