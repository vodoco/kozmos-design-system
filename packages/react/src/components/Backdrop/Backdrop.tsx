import React from "react";
import { Portal } from "@radix-ui/react-portal";
import { createThemePortal } from "../../theme/ThemePortal";
import { OverlayContainerContext } from "../../theme/overlay-container";
import { cn } from "../../utils";
import { createCutout, type BackdropTarget } from "./cutout";

export type {
  BackdropRect,
  BackdropTarget,
  BackdropTargetItem,
  BackdropVirtualElement,
} from "./cutout";

export interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the scrim is drawn. Hidden, it renders nothing. */
  visible?: boolean;
  /**
   * What to light (GAP-189): an element, a ref to one, a virtual element
   * (anything with `getBoundingClientRect()`), a rect in the viewport's
   * coordinates, or a list of them lit as the one box round them all. The
   * dim covers everything else, the cut-out is ringed in the focus colour,
   * and pointer events pass through it to what it shows. The target is never
   * moved or re-stacked; the cut-out follows it as it scrolls, resizes or
   * moves, read every frame while it is lit. A 0 by 0 virtual element or
   * rect is lit as a point. With no target, or one that is not there, the
   * whole page is dimmed.
   */
  target?: BackdropTarget;
  /** Room between the target and the cut-out's edge, in pixels. Defaults to layout.spacing.100 (8). */
  targetPadding?: number;
  /** The cut-out's corner radius, in pixels. Defaults to radius.control (16). */
  targetRadius?: number;
  /**
   * Where the dim is drawn. `"fixed"`, the default, covers the window and is
   * drawn in the theme's portal, as Popover and Dialog are, so no box it is
   * rendered in (a map, a panel that clips, transforms or isolates its
   * stacking) can cut it off or stack it under the page; inside a modal
   * (Dialog, Drawer, BottomSheet) it is drawn in the modal's content, which
   * makes everything outside it inert. Not in the server's HTML: it is drawn
   * once the provider's portal exists. `"inline"` covers the nearest
   * positioned box it is rendered in, `absolute`, in place: one region's dim
   * (site GAP-34). A fixed backdrop given a position by its class warns in
   * development.
   */
  placement?: "fixed" | "inline";
}

/**
 * The theme's portal, holding the backdrop's own element and adding none: a
 * product's styles and attributes stay on the element it renders.
 */
const BackdropPortal = createThemePortal(function BackdropPortalRoot({
  children,
  container,
}: {
  children?: React.ReactNode;
  container?: Element | DocumentFragment | null;
}) {
  return (
    <Portal asChild container={container}>
      {children}
    </Portal>
  );
});

// A class that positions it: the way a backdrop was kept to one box before
// it was portalled (className="absolute"), which, drawn in the portal,
// positions it against the document instead.
const POSITIONING = /(?:^|\s)(?:absolute|relative|static|sticky)(?:\s|$)/;

/** Warns once, in development, when a fixed backdrop is given a position. */
function useWarnPositioned(placement: string, className: string | undefined) {
  const warned = React.useRef(false);
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === "production" ||
      warned.current ||
      placement !== "fixed" ||
      !className ||
      !POSITIONING.test(className)
    )
      return;
    warned.current = true;
    console.warn(
      `Backdrop: className "${className}" positions a backdrop drawn in the theme's portal, against the document. To dim one box, pass placement="inline".`,
    );
  }, [placement, className]);
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const Backdrop = React.forwardRef<HTMLDivElement, BackdropProps>(
  (
    {
      className,
      visible = true,
      target,
      targetPadding,
      targetRadius,
      placement = "fixed",
      children,
      ...props
    },
    ref,
  ) => {
    // The root as state: in the portal, it arrives a render later than the
    // backdrop (once the provider's portal exists), and the cut-out is
    // drawn again when it does.
    const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
    const scrim = React.useRef<HTMLDivElement | null>(null);
    const ring = React.useRef<HTMLDivElement | null>(null);
    const [cutout] = React.useState(createCutout);
    // The forwarded ref is set with the element, in the commit it arrives
    // in, as it was before the backdrop was portalled.
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        setRoot(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    // Inside a modal (Dialog, Drawer, BottomSheet), drawn in its content:
    // beside it, the modal would make it inert.
    const overlay = React.useContext(OverlayContainerContext);
    useWarnPositioned(placement, className);
    // After every render, and every frame while a target is lit.
    useIsomorphicLayoutEffect(() => {
      cutout.sync(
        root,
        scrim.current,
        ring.current,
        target,
        targetPadding,
        targetRadius,
      );
    });
    useIsomorphicLayoutEffect(() => cutout.release, [cutout]);

    if (!visible) return null;
    const position = placement === "inline" ? "absolute" : "fixed";
    // With no target, the one scrim it always was, its children inside.
    // With one, the dim is an inner scrim that the cut-out is cut from and
    // that takes the pointer outside it; the backdrop's own children sit
    // beside it, never clipped, and take the pointer as they always did.
    const element =
      target === undefined ? (
        <div
          ref={setRef}
          className={cn(position, "inset-0 z-50 bg-overlay-scrim", className)}
          {...props}
        >
          {children}
        </div>
      ) : (
        <div
          ref={setRef}
          className={cn("kozmos-backdrop", position, "inset-0 z-50", className)}
          {...props}
        >
          <div ref={scrim} aria-hidden="true" className="kozmos-backdrop-scrim">
            <div ref={ring} className="kozmos-backdrop-ring" />
          </div>
          {children}
        </div>
      );
    if (placement === "inline") return element;
    // A modal whose content is still mounting: drawn there once it is.
    if (overlay === null) return null;
    return <BackdropPortal container={overlay}>{element}</BackdropPortal>;
  },
);
Backdrop.displayName = "Backdrop";

export { Backdrop };
