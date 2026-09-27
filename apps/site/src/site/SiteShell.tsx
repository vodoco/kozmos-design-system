import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useLocation } from "react-router";
import { Box } from "@kozmos-ds/react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * The address the last frame saw. Kept outside any component: a navigation
 * between the site's two frames (the reference's sidebar layout and the plain
 * one) mounts a new frame, and a new frame must still know that the page has
 * just changed — or focus would stay wherever it was, on the link or on the
 * body, for every header link between sections.
 */
let lastLocation: string | undefined;

/**
 * After a client-side navigation, focus moves to the new content, so a
 * screen reader lands there instead of staying on the link that was pressed:
 * to the part a link names (`/get-started#checks`), or else to the main
 * region. The first render is left alone; the browser handles a hash in the
 * address it was opened with.
 */
export function useFocusMainOnNavigate(main: RefObject<HTMLElement | null>) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const location = `${pathname}${hash}`;
    if (lastLocation === undefined) {
      lastLocation = location;
      return;
    }
    if (lastLocation === location) return;
    lastLocation = location;
    const target = hash
      ? document.getElementById(decodeURIComponent(hash.slice(1)))
      : null;
    target?.focus({ preventScroll: true });
    // A target that cannot take focus leaves it where it was: then main.
    if (!target || document.activeElement !== target) {
      main.current?.focus({ preventScroll: true });
    }
  }, [main, pathname, hash]);
}

/** The page frame: header (with the skip link), main and footer. */
export function SiteShell({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  useFocusMainOnNavigate(main);

  return (
    <Box className="site-shell">
      <SiteHeader />
      <main id="main" ref={main} tabIndex={-1} className="site-main">
        {children}
      </main>
      <SiteFooter />
    </Box>
  );
}
