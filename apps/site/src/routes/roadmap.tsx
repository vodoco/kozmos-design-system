import {
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
  type TagProps,
} from "@kozmos-ds/react";
import { examples } from "../examples/manifest";
import roadmap from "../generated/roadmap.json";
import { pageTitle } from "../lib/site";
import { withCode } from "../site/inline-code";
import { SiteLink } from "../site/links";
import { PageHeader, Section } from "../site/Section";

export function meta() {
  return [
    { title: pageTitle("Roadmap") },
    {
      name: "description",
      content:
        "What Kozmos cannot do yet, found by building this site from Kozmos alone: every item, its priority, and where it stands.",
    },
  ];
}

type Status = keyof typeof roadmap.counts;

/**
 * What each status in GAPS.md means to a reader: the design system's side
 * (every item is open work for it until fixed) and what the site does
 * meanwhile.
 */
const statuses: Record<
  Status,
  { label: string; emotion: NonNullable<TagProps["emotion"]>; means: string }
> = {
  open: {
    label: "Open",
    emotion: "alert",
    means:
      "Kozmos cannot do it and nothing stands in: the part is left out where it would go.",
  },
  composed: {
    label: "Worked around",
    emotion: "informative",
    means: "The site builds it from other Kozmos parts until Kozmos can.",
  },
  "left visible": {
    label: "Shown as is",
    emotion: "neutral",
    means:
      "The site shows what Kozmos draws today, so the defect can be seen and measured.",
  },
  fixed: {
    label: "Fixed",
    emotion: "success",
    means: "Fixed in Kozmos, and the site's check that pinned it turned over.",
  },
};

const order = Object.keys(statuses) as Status[];

/** The examples whose notes name an item: where to see it in one. */
function seenIn(id: string) {
  return examples.filter((example) =>
    example.gaps.some((gap) => gap.startsWith(`${id} `)),
  );
}

/** "9 open, 31 worked around, 16 shown as is, none fixed yet". */
function tally() {
  return order
    .map((status) => {
      const count = roadmap.counts[status];
      const label = statuses[status].label.toLowerCase();
      if (status === "fixed" && count === 0) return "none fixed yet";
      return `${count} ${label}`;
    })
    .join(", ");
}

/**
 * The roadmap: everything the site found Kozmos cannot do yet, as work for
 * the design system in the order the handoff gives it, and where each item
 * stands. The data is GAPS.md's table and DS-HANDOFF.md's priorities, read
 * at build time (scripts/generate-roadmap.mjs), so the page says what they
 * say.
 */
export default function Roadmap() {
  return (
    <Container className="site-page">
      <PageHeader
        title="Roadmap"
        lead={`What Kozmos cannot do yet, found by building this site from Kozmos alone, in the order it should be fixed. ${roadmap.total} items: ${tally()}.`}
      />

      <Section
        title="What the statuses mean"
        lead="Every item is work for the design system itself. Until it is done, the site does one of these."
      >
        <Stack gap={3}>
          {order.map((status) => (
            <Stack key={status} direction="row" align="center" gap={3}>
              <Tag
                emotion={statuses[status].emotion}
                className="site-roadmap-status"
              >
                {statuses[status].label}
              </Tag>
              <Text size="sm" color="muted">
                {statuses[status].means}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Section>

      {roadmap.groups.map((group) => (
        <Section
          key={group.id ?? "later"}
          title={group.id ? `${group.id} · ${group.title}` : group.title}
          lead={`${group.items.length} ${group.items.length === 1 ? "item" : "items"}.`}
        >
          <Table
            aria-label={group.id ?? group.title}
            className="site-roadmap-table"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="site-roadmap-item">Item</TableHead>
                <TableHead className="site-roadmap-state">Status</TableHead>
                <TableHead className="site-roadmap-lane">Lane</TableHead>
                <TableHead className="site-roadmap-where">
                  In examples
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((item) => {
                const status = statuses[item.status as Status];
                const where = seenIn(item.id);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Stack gap={0}>
                        <Text as="span" weight="medium">
                          {withCode(item.title)}
                        </Text>
                        <Text
                          as="span"
                          size="xs"
                          color="muted"
                          className="site-mono"
                        >
                          {item.id}
                        </Text>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tag
                        emotion={status.emotion}
                        className="site-roadmap-status"
                      >
                        {status.label}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Text as="span" size="sm">
                        {item.lane}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {where.length > 0 ? (
                        <Stack gap={1}>
                          {where.map((example) => (
                            <Text key={example.slug} as="span" size="sm">
                              <SiteLink to={`/examples/${example.slug}`}>
                                {example.title}
                              </SiteLink>
                            </Text>
                          ))}
                        </Stack>
                      ) : (
                        // It shows on a component's page or the site's own
                        // pages, or is a part not built yet.
                        <Text as="span" size="sm" color="muted">
                          None
                        </Text>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Section>
      ))}
    </Container>
  );
}
