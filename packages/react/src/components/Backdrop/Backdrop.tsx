import React from "react";
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
   * and pointer events pass through it to what it shows. The target stays
   * where it is, in the DOM and in its stacking context, and the cut-out
   * follows it as it scrolls and resizes. With no target, or one that is not
   * there, the whole page is dimmed.
   */
  target?: BackdropTarget;
  /** Room between the target and the cut-out's edge, in pixels. Defaults to layout.spacing.100 (8). */
  targetPadding?: number;
  /** The cut-out's corner radius, in pixels. Defaults to radius.control (16). */
  targetRadius?: number;
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
      children,
      ...props
    },
    ref,
  ) => {
    const root = React.useRef<HTMLDivElement | null>(null);
    const ring = React.useRef<HTMLDivElement | null>(null);
    const [cutout] = React.useState(createCutout);
    React.useImperativeHandle(ref, () => root.current as HTMLDivElement, [
      visible,
    ]);
    // After every render: a ref is read as it stands, so one filled later is
    // lit, and a target that moved is drawn where it is.
    useIsomorphicLayoutEffect(() => {
      cutout.sync(
        root.current,
        ring.current,
        target,
        targetPadding,
        targetRadius,
      );
    });
    useIsomorphicLayoutEffect(() => cutout.release, [cutout]);

    if (!visible) return null;
    return (
      <div
        ref={root}
        className={cn(
          "kozmos-backdrop fixed inset-0 z-50 bg-overlay-scrim",
          className,
        )}
        {...props}
      >
        {target !== undefined && (
          <div ref={ring} aria-hidden="true" className="kozmos-backdrop-ring" />
        )}
        {children}
      </div>
    );
  },
);
Backdrop.displayName = "Backdrop";

export { Backdrop };
