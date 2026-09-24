import { useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Icon,
  Sidebar,
  Stack,
  Text,
} from "@kozmos/react";
import { SiteNavItem, useNavigateAfterClose } from "./links";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { useFocusMainOnNavigate } from "./SiteShell";

export interface DocsPageLink {
  to: string;
  title: string;
  end?: boolean;
}

export interface DocsSection {
  title: string;
  /** One line under the title in the navigation. */
  summary: string;
  /** Pages before any group. */
  pages: readonly DocsPageLink[];
  /** Pages under a small heading each, for a long section. */
  groups?: readonly { title: string; pages: readonly DocsPageLink[] }[];
}

/**
 * The frame for reference pages: the site header, a section sidebar beside
 * the content, the footer. The sidebar is Kozmos's, an <aside> kept outside
 * <main> so it stays a top-level landmark. On a narrow screen it gives way
 * to a Drawer opened from a button above the content.
 */
export function DocsShell({
  section,
  children,
}: {
  section: DocsSection;
  children: ReactNode;
}) {
  const main = useRef<HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerNavigation = useNavigateAfterClose();
  useFocusMainOnNavigate(main);

  const items = (
    pages: readonly DocsPageLink[],
    onChoose?: (to: string) => void,
  ) =>
    pages.map((page) => (
      <SiteNavItem
        key={page.to}
        to={page.to}
        end={page.end ?? true}
        placement="side"
        onChoose={onChoose}
      >
        {page.title}
      </SiteNavItem>
    ));

  const navigation = (onChoose?: (to: string) => void) => (
    <Stack gap={4}>
      <Stack gap={1}>{items(section.pages, onChoose)}</Stack>
      {section.groups?.map((group) => (
        <Stack key={group.title} gap={1}>
          <Text
            as="span"
            size="xs"
            weight="semibold"
            color="muted"
            className="site-docs-group"
          >
            {group.title}
          </Text>
          {items(group.pages, onChoose)}
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Box className="site-shell">
      <SiteHeader />
      <Box className="site-docs">
        <Box className="site-docs-aside">
          <Sidebar
            aria-label={section.title}
            header={
              <Stack gap={1}>
                <Text as="span" weight="semibold">
                  {section.title}
                </Text>
                <Text as="span" size="sm" color="muted">
                  {section.summary}
                </Text>
              </Stack>
            }
            navigation={navigation()}
          />
        </Box>
        <Box className="site-docs-body">
          <Box className="site-docs-toolbar">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <Icon name="menu-01" size="sm" />
                  {section.title}
                </Button>
              </DrawerTrigger>
              <DrawerContent
                side="left"
                onCloseAutoFocus={drawerNavigation.onCloseAutoFocus}
              >
                <DrawerHeader>
                  <DrawerTitle>{section.title}</DrawerTitle>
                  <DrawerDescription>{section.summary}</DrawerDescription>
                </DrawerHeader>
                <nav
                  aria-label={section.title}
                  className="site-docs-drawer-nav"
                >
                  {navigation((to) => {
                    drawerNavigation.choose(to);
                    setDrawerOpen(false);
                  })}
                </nav>
              </DrawerContent>
            </Drawer>
          </Box>
          <main id="main" ref={main} tabIndex={-1} className="site-main">
            {children}
          </main>
        </Box>
      </Box>
      <SiteFooter />
    </Box>
  );
}
