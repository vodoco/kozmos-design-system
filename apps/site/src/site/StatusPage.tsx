import type { ReactNode } from "react";
import { Container, Heading, Stack, Text } from "@kozmos-ds/react";
import { ButtonLink } from "./links";

/**
 * A full-page message: not found, failed, loading. Not EmptyState, whose
 * title is a paragraph with no heading level (GAPS.md, GAP-11), and a page
 * needs its h1.
 */
export function StatusPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <Container className="site-status">
      <Stack align="center" gap={4}>
        <Heading level={1} align="center">
          {title}
        </Heading>
        {description ? (
          <Text align="center" color="muted">
            {description}
          </Text>
        ) : null}
        {children}
        <ButtonLink to="/" variant="outline">
          Go to the home page
        </ButtonLink>
      </Stack>
    </Container>
  );
}
