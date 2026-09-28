import { data } from "react-router";
import { Container, Stack, Tag, Text } from "@kozmos-ds/react";
import type { Route } from "./+types/component";
import { pageTitle } from "../../lib/site";
import { componentBySlug, laneTitle, neighbours } from "../../reference/nav";
import { StatusTable } from "../../reference/Status";
import { SiteLink, StorybookButtonLink } from "../../site/links";
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

export function loader({ request }: Route.LoaderArgs) {
  const component = componentBySlug(slugOf(request.url));
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

/**
 * One component, briefly: what it is, where it exists, and where its
 * reference is. Its docs, stories, controls and code on each platform are
 * Storybook's (decision 44); this page keeps its address and points there.
 */
export default function ComponentPage({
  loaderData: component,
}: Route.ComponentProps) {
  const { previous, next } = neighbours(component.slug);
  const docsPage = component.storybook?.startsWith("/docs/") ?? false;

  return (
    <Container className="site-page">
      <PageHeader
        title={component.name}
        lead={
          component.description
            ? withCode(component.description)
            : "Its docs have no description yet."
        }
      >
        <Stack direction="row" wrap="wrap" align="center" gap={3}>
          {component.storybook ? (
            <StorybookButtonLink page={component.storybook}>
              Open in Storybook
            </StorybookButtonLink>
          ) : null}
          <Tag variant="secondary">{laneTitle(component.lane)}</Tag>
        </Stack>
        <Text size="sm" color="muted">
          {component.storybook
            ? docsPage
              ? "Its docs, stories and controls, and its code on each platform, are in Storybook."
              : "Its docs page is not written yet: Storybook opens on its first story."
            : "Storybook has no page for it: it has no stories yet."}
        </Text>
      </PageHeader>

      <Section
        title="Where it exists"
        lead={
          <>
            React, SwiftUI and Compose: whether that platform’s library has it.
            Figma: whether Code Connect links it to the Figma library.{" "}
            <SiteLink to="/components#marks">What a mark does not say</SiteLink>
            .
          </>
        }
      >
        <StatusTable
          label={`Where ${component.name} exists`}
          components={[component]}
          named={false}
        />
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
