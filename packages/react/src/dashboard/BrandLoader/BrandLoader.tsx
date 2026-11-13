import React from "react";
import { clsx } from "clsx";
import { MarkerPin01 } from "@kozmos-ds/icons";
import { Backdrop } from "../../components/Backdrop/Backdrop";

export interface BrandLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * What assistive technology hears, once, when the loader appears: the
   * wait, in the product's words ("Loading Pointr Cloud"). Never shown.
   */
  label?: string;
  /**
   * Covers the page while it loads, as Pointr Cloud's loader does: the
   * theme's scrim (Backdrop's) over the whole window, the loader in its
   * middle. The scrim takes every pointer event, and everything else on the
   * page is inert and marked busy until the loader goes; focus is not moved
   * to it, and goes back where it was when it does. Left unset, the loader
   * draws in place, in a box of its own.
   */
  overlay?: boolean;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Whether the reader asks for reduced motion, kept current. */
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION);
    if (!query) return;
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

const SKIPPED = /^(?:SCRIPT|STYLE|LINK|META|TEMPLATE|NOSCRIPT)$/;

/**
 * Makes everything on the page but `keep` inert and busy, as a modal hides
 * the page: each sibling of `keep` and of each of its ancestors up to the
 * body. Returns the undo, which restores what it changed and only that, and
 * gives focus back to what had it when the page took it away.
 */
function coverPage(keep: Element) {
  const document = keep.ownerDocument;
  const focused = document.activeElement as HTMLElement | null;
  const changed: Array<[Element, string | null]> = [];
  for (
    let node: Element | null = keep;
    node?.parentElement && node !== document.body;
    node = node.parentElement
  ) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (
        sibling === node ||
        SKIPPED.test(sibling.tagName) ||
        sibling.hasAttribute("inert")
      )
        continue;
      changed.push([sibling, sibling.getAttribute("aria-busy")]);
      sibling.setAttribute("inert", "");
      sibling.setAttribute("aria-busy", "true");
    }
  }
  return () => {
    for (const [element, busy] of changed) {
      element.removeAttribute("inert");
      if (busy === null) element.removeAttribute("aria-busy");
      else element.setAttribute("aria-busy", busy);
    }
    const now = document.activeElement;
    if (
      focused?.isConnected &&
      focused !== now &&
      (now === null || now === document.body)
    )
      focused.focus({ preventScroll: true });
  };
}

/**
 * Pointer events the overlay keeps to itself. Drawn in the theme's portal,
 * it is still inside the React tree it was rendered in, and React bubbles a
 * portal's events up that tree: without this, a click on the scrim would
 * reach the page's own handlers.
 */
const stop = (event: React.SyntheticEvent) => event.stopPropagation();
const SWALLOWED = {
  onClick: stop,
  onDoubleClick: stop,
  onContextMenu: stop,
  onPointerDown: stop,
  onPointerUp: stop,
  onMouseDown: stop,
  onMouseUp: stop,
  onTouchStart: stop,
  onTouchEnd: stop,
};

/**
 * Pointr Cloud's brand loader (CLOUD-UI-008): the pin, with two rings
 * rippling out from it in the theme's prominent colour (decision 176, theme
 * 500, as every prominent fill is: decision 59), while the product loads.
 *
 * It is said once: a status region, mounted empty, whose words arrive after
 * it, so a screen reader announces the change, and nothing that moves is in
 * it, so the loop says nothing more. Under reduced motion, the system's or
 * DesignConfigProvider's, the rings and the pin stand still: one ring, at
 * rest round the pin. The loop is Cloud's: 3 s, the second ring half a
 * second ahead, the pin wobbling for the first third of each.
 *
 * A Dashboard module (decision 183): import it from
 * `@kozmos-ds/react/dashboard`, with `@kozmos-ds/react/dashboard.css` after
 * the package's style.css.
 */
const BrandLoader = React.forwardRef<HTMLDivElement, BrandLoaderProps>(
  ({ className, label = "Loading", overlay = false, ...props }, ref) => {
    const reduced = useReducedMotion();
    const [said, setSaid] = React.useState<string | null>(null);
    React.useEffect(() => {
      setSaid(label);
    }, [label]);

    const [scrim, setScrim] = React.useState<HTMLDivElement | null>(null);
    React.useEffect(() => {
      if (!overlay || !scrim) return;
      return coverPage(scrim);
    }, [overlay, scrim]);

    const loader = (
      <div
        ref={ref}
        role="status"
        // Said as well as implied: an open Select or Menu hides every box
        // not marked aria-live (GAP-193).
        aria-live="polite"
        data-motion={reduced ? "reduced" : undefined}
        className={clsx("kozmos-brand-loader", className)}
        {...props}
      >
        <span aria-hidden="true" className="kozmos-brand-loader-ring" />
        <span
          aria-hidden="true"
          className="kozmos-brand-loader-ring"
          data-ring="second"
        />
        <MarkerPin01
          aria-hidden="true"
          focusable="false"
          width={32}
          height={32}
          className="kozmos-brand-loader-pin"
        />
        <span className="kozmos-brand-loader-label">{said}</span>
      </div>
    );

    if (!overlay) return loader;
    return (
      <Backdrop
        ref={setScrim}
        className="kozmos-brand-loader-overlay"
        {...SWALLOWED}
      >
        {loader}
      </Backdrop>
    );
  },
);
BrandLoader.displayName = "BrandLoader";

export { BrandLoader };
