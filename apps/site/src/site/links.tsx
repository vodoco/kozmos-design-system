import { useRef, type MouseEvent, type ReactNode } from "react";
import {
  Link as RouterLink,
  useHref,
  useLinkClickHandler,
  useLocation,
  useMatch,
  useNavigate,
  useResolvedPath,
} from "react-router";
import {
  buttonVariants,
  Link,
  NavigationItem,
  type LinkProps,
} from "@kozmos-ds/react";

/**
 * Client-side navigation for Kozmos's own anchors.
 *
 * Kozmos's Link and NavigationItem render a real `<a href>`. React Router's
 * `useLinkClickHandler` is the hook it provides for exactly this — custom
 * link components with its own click behaviour — so a plain click navigates
 * in the app, and a modified click, a middle click or a click with JavaScript
 * off still behaves like any link. NavigationItem's `asChild` cannot wrap a
 * router link instead: it throws (GAPS.md, GAP-01).
 */
function useRouterClick<E extends HTMLElement>(
  to: string,
  onClick?: (event: MouseEvent<E>) => void,
) {
  const handleClick = useLinkClickHandler<E>(to);
  return (event: MouseEvent<E>) => {
    onClick?.(event);
    if (!event.defaultPrevented) handleClick(event);
  };
}

export interface SiteLinkProps extends Omit<LinkProps, "href"> {
  to: string;
}

/** A Kozmos Link to a page of this site. */
export function SiteLink({ to, onClick, ...props }: SiteLinkProps) {
  const href = useHref(to);
  const handleClick = useRouterClick(to, onClick);
  return <Link {...props} href={href} onClick={handleClick} />;
}

export interface SiteNavItemProps {
  to: string;
  children: ReactNode;
  /** Whether nested paths also select the item. */
  end?: boolean;
  placement?: "top" | "side";
  icon?: ReactNode;
  /**
   * Takes over a plain click, for an item inside a drawer: the drawer closes
   * first and the page changes once it has (`useNavigateAfterClose`). A
   * modified click still opens the page in a new tab or window.
   */
  onChoose?: (to: string) => void;
}

/** A click the app should handle: the main button, no modifier keys. */
function isPlainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

/** A navigation item that marks itself selected on its own pages. */
export function SiteNavItem({
  to,
  children,
  end = false,
  placement = "top",
  icon,
  onChoose,
}: SiteNavItemProps) {
  const href = useHref(to);
  const resolved = useResolvedPath(to);
  const selected = useMatch({ path: resolved.pathname, end }) !== null;
  const handleClick = useRouterClick<HTMLElement>(to, (event) => {
    if (onChoose && isPlainClick(event)) {
      event.preventDefault();
      onChoose(to);
    }
  });
  return (
    <NavigationItem
      href={href}
      placement={placement}
      selected={selected}
      icon={icon}
      onClick={handleClick}
    >
      {children}
    </NavigationItem>
  );
}

export interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

/**
 * A router link styled as a button — the pattern the React package's README
 * gives for navigation, since Button always renders a <button>. Its label is
 * underlined: the button classes do not reset an anchor's text decoration
 * (GAPS.md, GAP-09). Left visible on purpose; the fix belongs in Kozmos.
 */
export function ButtonLink({
  to,
  children,
  variant = "default",
  size = "default",
}: ButtonLinkProps) {
  return (
    <RouterLink to={to} className={buttonVariants({ variant, size })}>
      {children}
    </RouterLink>
  );
}

/**
 * Navigation from inside a drawer or a dialog. Radix returns focus to the
 * button that opened it once its closing animation ends — after the new
 * page has already moved focus to its content, so a keyboard or screen
 * reader user would land back on the menu button. So the page changes only
 * when the drawer has closed: `choose` records where to go, and
 * `onCloseAutoFocus`, given to the drawer's content, goes there instead of
 * returning focus. The site search does the same (SiteSearch.tsx).
 */
export function useNavigateAfterClose() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pending = useRef<string>(undefined);
  return {
    choose(to: string) {
      pending.current = to;
    },
    onCloseAutoFocus(event: Event) {
      const to = pending.current;
      pending.current = undefined;
      // The page the visitor is on: nothing changes, so focus goes back to
      // the button that opened the drawer, as it would for Escape.
      if (!to || to === pathname) return;
      event.preventDefault();
      navigate(to);
    },
  };
}
