import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Container,
  Heading,
  ScrollArea,
  Separator,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Text,
} from "@kozmos/react";
import { exampleKindLabel, type ExampleEntry } from "../examples/manifest";
import { kozmosImports } from "../lib/kozmos-imports";
import { CodeBlock } from "./CodeBlock";
import { SiteLink } from "./links";
import { Section } from "./Section";

export interface ExampleFile {
  name: string;
  code: string;
}

/**
 * The frame every example is shown in: where it sits, what it is, the
 * example itself edge to edge, then the Kozmos parts it uses, a link to the
 * roadmap where it found Kozmos short, and its source.
 */
export function ExamplePage({
  example,
  files,
  children,
}: {
  example: ExampleEntry;
  files: readonly ExampleFile[];
  children: ReactNode;
}) {
  const components = kozmosImports(files.map((file) => file.code).join("\n"));

  return (
    <>
      <Container className="site-example-intro">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <RouterLink to="/examples">Examples</RouterLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{example.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Stack direction="row" align="center" wrap="wrap" gap={3}>
          <Heading level={1} className="site-title">
            {example.title}
          </Heading>
          <Tag variant="secondary">{exampleKindLabel[example.kind]}</Tag>
        </Stack>
        <Text size="lg" color="muted">
          {example.summary}
        </Text>
      </Container>

      {/* The canvas's edges: in the dark theme its tint is 1.1:1 against the
          page, and the provider's preflight zeroes a box's own border
          (GAP-52). */}
      <Separator />
      <section
        aria-label={`${example.title} example`}
        className="site-example-canvas"
        data-kind={example.kind}
      >
        {children}
      </section>
      <Separator />

      <Container className="site-example-details">
        <Section
          title="Built with"
          lead="Every Kozmos component the example imports. There is nothing else on the canvas."
        >
          <Stack direction="row" wrap="wrap" gap={2}>
            {components.map((name) => (
              <Tag key={name} variant="outline">
                {name}
              </Tag>
            ))}
          </Stack>
          {/* What the example found Kozmos cannot do is on the roadmap,
              with where each item stands; the example's notes
              (manifest.ts) say where it shows. */}
          {example.gaps.length > 0 ? (
            <Text color="muted">
              Where Kozmos fell short here is on the{" "}
              <SiteLink to="/roadmap">roadmap</SiteLink>, with where each fix
              stands.
            </Text>
          ) : null}
        </Section>

        <Section title="Source" lead="The example’s own files, as they are.">
          <Tabs defaultValue={files[0]?.name}>
            {/* TabsList neither wraps nor scrolls (GAPS.md, GAP-16): three
                file names overflow a phone, so the list scrolls sideways in a
                ScrollArea. */}
            <ScrollArea orientation="horizontal">
              <TabsList aria-label="Source files">
                {files.map((file) => (
                  <TabsTrigger key={file.name} value={file.name}>
                    {file.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            {files.map((file) => (
              <TabsContent key={file.name} value={file.name}>
                <CodeBlock label={file.name} code={file.code} />
              </TabsContent>
            ))}
          </Tabs>
        </Section>
      </Container>
    </>
  );
}
