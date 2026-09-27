import type { ReactNode } from "react";
import { Container } from "@kozmos-ds/react";
import { pageTitle } from "../lib/site";
import { PageHeader } from "../site/Section";
import type { FoundationPage } from "./nav";

export function foundationMeta(page: FoundationPage) {
  return [
    { title: pageTitle(page.title) },
    { name: "description", content: page.summary },
  ];
}

/** A foundations page: its header from the navigation data, then sections. */
export function DocsPage({
  page,
  children,
}: {
  page: FoundationPage;
  children: ReactNode;
}) {
  return (
    <Container className="site-page">
      <PageHeader title={page.title} lead={page.summary} />
      {children}
    </Container>
  );
}
