import { Suspense } from "react";
import { data } from "react-router";
import {
  Alert,
  AlertDescription,
  Box,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Heading,
  ScrollArea,
  Separator,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Text,
} from "@kozmos-ds/react";
import type { Route } from "./+types/component";
import { pageTitle } from "../../lib/site";
import { loadComponentData } from "../../reference/data";
import { laneTitle, neighbours } from "../../reference/nav";
import { hasDemos, lazyDemos, lazyDemoSource } from "../../reference/registry";
import type { ComponentPart, Demo } from "../../reference/types";
import { CodeBlock } from "../../site/CodeBlock";
import { SiteLink } from "../../site/links";
import { PageHeader, Section } from "../../site/Section";
import { withCode, withoutCode } from "../../site/inline-code";

/**
 * The component a page is for: the last part of its address. The request for
 * the page's data, React Router's `<address>.data`, names the same one.
 */
function slugOf(url: string) {
  const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/\.data$/, "");
}

export async function loader({ request }: Route.LoaderArgs) {
  const component = await loadComponentData(slugOf(request.url));
  if (!component) throw data(null, { status: 404 });
  return component;
}

export function meta({ data: component }: Route.MetaArgs) {
  return [
    { title: pageTitle(component.name) },
    {
      name: "description",
      content:
        withoutCode(component.description) ||
        `${component.name}, a Kozmos component.`,
    },
  ];
}

/** The demos module, as a lazy component list: one Suspense for all of them. */
function Demos({ slug }: { slug: string }) {
  const Loaded = lazyDemos(slug);
  return (
    <Suspense fallback={<Skeleton className="site-demo-loading" />}>
      <Loaded>
        {(demos) => (
          <Box className="site-demos">
            {demos.map((demo) => (
              <DemoCard key={demo.title} demo={demo} />
            ))}
          </Box>
        )}
      </Loaded>
    </Suspense>
  );
}

function DemoCard({ demo }: { demo: Demo }) {
  const { Component } = demo;
  return (
    <Card className="site-demo-card">
      <CardHeader>
        <CardTitle>{demo.title}</CardTitle>
        {demo.description ? (
          <CardDescription>{demo.description}</CardDescription>
        ) : null}
      </CardHeader>
      <Separator />
      <Box
        className={
          demo.tall ? "site-demo-stage site-demo-stage-tall" : "site-demo-stage"
        }
      >
        <Component />
      </Box>
    </Card>
  );
}

/** The demo file's own source, lazily. */
function DemoSource({ slug }: { slug: string }) {
  const Loaded = lazyDemoSource(slug);
  return (
    <Suspense fallback={<Skeleton className="site-demo-loading" />}>
      <Loaded>
        {(source) => <CodeBlock label={`${slug}.tsx`} code={source} />}
      </Loaded>
    </Suspense>
  );
}

function PropsTable({ part }: { part: ComponentPart }) {
  if (part.props.length === 0) {
    return (
      <Text size="sm" color="muted">
        No props of its own; it takes the element’s attributes.
      </Text>
    );
  }
  return (
    <Table aria-label={`${part.name} props`}>
      <TableHeader>
        <TableRow>
          <TableHead>Prop</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Default</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {part.props.map((prop) => (
          <TableRow key={prop.name}>
            <TableCell>
              <Stack direction="row" align="center" gap={2}>
                <Text as="span" size="sm" weight="medium" className="site-mono">
                  {prop.name}
                </Text>
                {prop.required ? (
                  <Tag variant="outline" emotion="informative">
                    required
                  </Tag>
                ) : null}
                {/* A Radix primitive's own prop, which Kozmos passes through. */}
                {prop.source ? <Tag variant="secondary">Radix</Tag> : null}
              </Stack>
            </TableCell>
            <TableCell>
              <Text as="span" size="xs" className="site-mono">
                {prop.type}
              </Text>
            </TableCell>
            <TableCell>
              <Text as="span" size="xs" className="site-mono">
                {prop.defaultValue ?? "—"}
              </Text>
            </TableCell>
            <TableCell>
              <Text as="span" size="sm" color="muted">
                {prop.description
                  ? withCode(prop.description)
                  : prop.source
                    ? `From ${prop.source}.`
                    : ""}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const platforms = [
  { key: "react", label: "React", file: (name: string) => `${name}.tsx` },
  { key: "swift", label: "SwiftUI", file: (name: string) => `${name}.swift` },
  { key: "kotlin", label: "Compose", file: (name: string) => `${name}.kt` },
] as const;

export default function ComponentPage({
  loaderData: component,
}: Route.ComponentProps) {
  const { previous, next } = neighbours(component.slug);
  const demos = hasDemos(component.slug);

  return (
    <Container className="site-page">
      <PageHeader title={component.name} lead={withCode(component.description)}>
        <Stack direction="row" wrap="wrap" align="center" gap={2}>
          <Tag variant="secondary">{laneTitle(component.lane)}</Tag>
          {component.parts.map((part) => (
            <Tag key={part.name} variant="outline">
              {part.name}
            </Tag>
          ))}
        </Stack>
      </PageHeader>

      <Section
        title="Examples"
        lead={demos ? "Live, and interactive where the part is." : undefined}
      >
        {demos ? (
          <Demos slug={component.slug} />
        ) : (
          <Alert variant="info" role="note">
            <AlertDescription>
              No live example is written for {component.name} yet; its props and
              its code on each platform are below.
            </AlertDescription>
          </Alert>
        )}
      </Section>

      <Section
        title="Code"
        lead="The examples' own source, and the component as its documentation shows it on each platform."
      >
        <Tabs defaultValue={demos ? "demo" : "react"}>
          {/* Four tabs are wider than a 320px phone, and TabsList neither
              wraps nor scrolls (GAP-16): a horizontal ScrollArea carries it. */}
          <ScrollArea orientation="horizontal">
            <TabsList aria-label="Code">
              {demos ? <TabsTrigger value="demo">Examples</TabsTrigger> : null}
              {platforms.map((platform) => (
                <TabsTrigger key={platform.key} value={platform.key}>
                  {platform.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          {demos ? (
            <TabsContent value="demo">
              <DemoSource slug={component.slug} />
            </TabsContent>
          ) : null}
          {platforms.map((platform) => (
            <TabsContent key={platform.key} value={platform.key}>
              {component.snippets[platform.key] ? (
                <CodeBlock
                  label={platform.file(component.name)}
                  code={component.snippets[platform.key] ?? ""}
                />
              ) : (
                <Text size="sm" color="muted">
                  The documentation carries no {platform.label} snippet for{" "}
                  {component.name}.
                </Text>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <Section
        title="Props"
        lead="Read from the TypeScript source. Attributes every element takes are left out."
      >
        <Stack gap={8}>
          {component.parts.map((part) => (
            <Stack key={part.name} gap={3}>
              <Stack gap={1}>
                <Heading level={3} className="site-part-name">
                  {part.name}
                </Heading>
                {part.description ? (
                  <Text size="sm" color="muted">
                    {withCode(part.description)}
                  </Text>
                ) : null}
              </Stack>
              <PropsTable part={part} />
            </Stack>
          ))}
        </Stack>
      </Section>

      <nav aria-label="Neighbouring components" className="site-prev-next">
        <Text size="sm">
          {previous ? (
            <SiteLink to={`/components/${previous.slug}`}>
              ← {previous.name}
            </SiteLink>
          ) : null}
        </Text>
        <Text size="sm">
          {next ? (
            <SiteLink to={`/components/${next.slug}`}>{next.name} →</SiteLink>
          ) : null}
        </Text>
      </nav>
    </Container>
  );
}
