import { useState } from "react";
import {
  Box,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Icon,
  IconButton,
  Link,
  NavigationItem,
  Navbar,
  Stack,
} from "@kozmos-ds/react";
import { LOGO_TEXT, SITE_NAME } from "../lib/site";
import { storybookHref } from "../lib/storybook";
import { SiteLink, SiteNavItem, useNavigateAfterClose } from "./links";
import { SiteSearch } from "./SiteSearch";
import { ThemeMenu } from "./ThemeMenu";

export const primaryNavigation = [
  { to: "/foundations", label: "Foundations" },
  { to: "/components", label: "Components" },
  { to: "/examples", label: "Examples" },
  { to: "/get-started", label: "Get started" },
] as const;

/**
 * Storybook, the component reference, last among the site's pages: it is
 * published beside them but is not one of them, so its link is a plain
 * link that leaves the app (src/lib/storybook.ts).
 */
export const storybookNavigation = {
  href: storybookHref(),
  label: "Storybook",
} as const;

/**
 * One row from 360px up. Kozmos's Navbar gives its leading group a 32rem
 * basis, so anything in its trailing slot drops to a second row on a phone
 * (GAPS.md, GAP-41). Everything therefore goes in the navigation slot: the
 * page links, which a screen narrower than 64rem moves into a drawer, and
 * the three small tools — theme, search, and the drawer's button. That slot
 * keeps a 16rem basis of its own, so beside it the logo is the full logo
 * from 48rem and its K below; at 320px nothing fits beside it and the tools
 * wrap.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerNavigation = useNavigateAfterClose();
  return (
    <Navbar
      navigationLabel="Site"
      logo={
        <>
          {/* The first stop for the keyboard, shown over the logo when it has
              focus. It lives inside the header because the sticky header is
              drawn at Kozmos's top layer: a link before it, on the same
              layer, would be painted under it (GAP-06: no skip link). */}
          <Link href="#main" className="site-skip-link">
            Skip to content
          </Link>
          {/* Kozmos draws no image or brand mark (GAPS.md, GAP-10): the logo
              is a Box the site's stylesheet paints through the logo's shape. */}
          <SiteLink to="/" variant="subtle" className="site-logo-link">
            <Box role="img" aria-label={LOGO_TEXT} className="site-logo" />
          </SiteLink>
        </>
      }
      navigation={
        <Box className="site-header-bar">
          <Box className="site-header-links">
            {primaryNavigation.map((item) => (
              <SiteNavItem key={item.to} to={item.to}>
                {item.label}
              </SiteNavItem>
            ))}
            <NavigationItem href={storybookNavigation.href} placement="top">
              {storybookNavigation.label}
            </NavigationItem>
          </Box>
          <Box className="site-header-tools">
            <ThemeMenu />
            <SiteSearch />
            <Box className="site-header-menu">
              <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                <DrawerTrigger asChild>
                  <IconButton variant="ghost" aria-label="Site menu">
                    <Icon name="menu-01" size="sm" />
                  </IconButton>
                </DrawerTrigger>
                <DrawerContent
                  side="right"
                  onCloseAutoFocus={drawerNavigation.onCloseAutoFocus}
                >
                  <DrawerHeader>
                    <DrawerTitle>{SITE_NAME}</DrawerTitle>
                    <DrawerDescription>
                      The design system for the Pointr SDK.
                    </DrawerDescription>
                  </DrawerHeader>
                  <nav aria-label="Site" className="site-header-drawer-nav">
                    <Stack gap={1}>
                      {primaryNavigation.map((item) => (
                        <SiteNavItem
                          key={item.to}
                          to={item.to}
                          placement="side"
                          onChoose={(to) => {
                            drawerNavigation.choose(to);
                            setMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </SiteNavItem>
                      ))}
                      {/* A plain link: it leaves the app, so nothing waits
                          for the drawer to close. */}
                      <NavigationItem
                        href={storybookNavigation.href}
                        placement="side"
                      >
                        {storybookNavigation.label}
                      </NavigationItem>
                    </Stack>
                  </nav>
                </DrawerContent>
              </Drawer>
            </Box>
          </Box>
        </Box>
      }
    />
  );
}
