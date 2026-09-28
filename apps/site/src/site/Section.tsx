import { useId, type ReactNode } from "react";
import { Heading, Text } from "@kozmos-ds/react";

/** A titled section of a page: an h2, an optional lead, and its content. */
export function Section({
  id,
  title,
  lead,
  actions,
  level = 2,
  children,
}: {
  /** An anchor for links to this section. */
  id?: string;
  title: string;
  lead?: ReactNode;
  /** Controls beside the title: a switch, a filter. */
  actions?: ReactNode;
  level?: 2 | 3;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      // A link to the section moves focus to it (SiteShell), so the next Tab
      // continues from here, not from the top of the page.
      tabIndex={id ? -1 : undefined}
      aria-labelledby={headingId}
      className="site-section"
    >
      <header className="site-section-header">
        <Heading
          level={level}
          id={headingId}
          className={level === 2 ? "site-headline" : undefined}
        >
          {title}
        </Heading>
        {lead ? <Text color="muted">{lead}</Text> : null}
        {actions}
      </header>
      {children}
    </section>
  );
}

/** The top of a page: its h1 and a lead paragraph. */
export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="site-page-header">
      <Heading level={1} className="site-title">
        {title}
      </Heading>
      {lead ? (
        <Text size="lg" color="muted">
          {lead}
        </Text>
      ) : null}
      {children}
    </header>
  );
}
