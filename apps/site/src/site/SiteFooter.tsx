import { Container, Link, Separator, Stack, Text } from "@kozmos-ds/react";
import { PACKAGES_PUBLISHED } from "../lib/site";
import { SiteLink } from "./links";
import { primaryNavigation, storybookNavigation } from "./SiteHeader";

/**
 * The header's pages, and the roadmap, which the header has no room for;
 * then Storybook, which is a plain link (src/lib/storybook.ts).
 */
const footerNavigation = [
  ...primaryNavigation,
  { to: "/roadmap", label: "Roadmap" },
] as const;

/** GAP-08: Kozmos has no footer, so this one is composed from its parts. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <Stack gap={4}>
          <Separator />
          <Stack
            direction="row"
            wrap="wrap"
            justify="between"
            align="center"
            gap={4}
          >
            <Text size="sm" color="muted">
              Kozmos design system. MIT licence.
              {PACKAGES_PUBLISHED ? null : " Pre-release."}
            </Text>
            <nav aria-label="Footer" className="site-footer-nav">
              {footerNavigation.map((item) => (
                <Text key={item.to} as="span" size="sm">
                  <SiteLink to={item.to} variant="subtle">
                    {item.label}
                  </SiteLink>
                </Text>
              ))}
              <Text as="span" size="sm">
                <Link href={storybookNavigation.href} variant="subtle">
                  {storybookNavigation.label}
                </Link>
              </Text>
            </nav>
          </Stack>
        </Stack>
      </Container>
    </footer>
  );
}
