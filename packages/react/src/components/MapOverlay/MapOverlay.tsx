import React from "react";
import type { MapCollisionInsets } from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";

export interface MapOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use start/end corners to mirror with interface direction; left/right stay physical. */
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "top-center"
    | "bottom-center";
  width?: "auto" | "sm" | "md" | "lg" | "full";
  /** Extra renderer/attribution clearance supplied by the map adapter. */
  collisionInsets?: Partial<MapCollisionInsets>;
}

const positionClasses: Record<
  NonNullable<MapOverlayProps["position"]>,
  string
> = {
  "top-left": "left-[var(--map-overlay-left)] top-[var(--map-overlay-top)]",
  "top-right": "right-[var(--map-overlay-right)] top-[var(--map-overlay-top)]",
  "bottom-left":
    "bottom-[var(--map-overlay-bottom)] left-[var(--map-overlay-left)]",
  "bottom-right":
    "bottom-[var(--map-overlay-bottom)] right-[var(--map-overlay-right)]",
  "top-start": "kozmos-map-overlay-start top-[var(--map-overlay-top)]",
  "top-end": "kozmos-map-overlay-end top-[var(--map-overlay-top)]",
  "bottom-start": "kozmos-map-overlay-start bottom-[var(--map-overlay-bottom)]",
  "bottom-end": "kozmos-map-overlay-end bottom-[var(--map-overlay-bottom)]",
  "top-center": "left-1/2 top-[var(--map-overlay-top)] -translate-x-1/2",
  "bottom-center":
    "bottom-[var(--map-overlay-bottom)] left-1/2 -translate-x-1/2",
};

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Marks the stack `data-scrolls` while what it holds overflows it, and only
 * then does the stack take presses (.kozmos-map-overlay-stack[data-scrolls]).
 * Its room is for the shadows, so a press there reaches the map (decision 46),
 * but Linux WebKit, as CI runs it, scrolls a box from a wheel only if the box
 * takes presses itself: with none, a wheel over what the stack holds scrolled
 * nothing. The mark follows the stack's size and what it holds: their sizes,
 * and a part added or taken away. Setting it changes no layout.
 */
function useScrollsMark(stack: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const node = stack.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const mark = () =>
      node.toggleAttribute(
        "data-scrolls",
        node.scrollHeight > node.clientHeight + 1 ||
          node.scrollWidth > node.clientWidth + 1,
      );
    const sizes = new ResizeObserver(mark);
    const observe = () => {
      sizes.disconnect();
      sizes.observe(node);
      for (const child of Array.from(node.children)) sizes.observe(child);
    };
    const parts = new MutationObserver(() => {
      observe();
      mark();
    });
    observe();
    parts.observe(node, { childList: true });
    mark();
    return () => {
      sizes.disconnect();
      parts.disconnect();
    };
  }, [stack]);
}

const widthClasses: Record<NonNullable<MapOverlayProps["width"]>, string> = {
  auto: "w-auto max-w-[calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right))]",
  sm: "w-[min(20rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  md: "w-[min(24rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  lg: "w-[min(32rem,calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right)))]",
  full: "w-[calc(100%_-_var(--map-overlay-left)_-_var(--map-overlay-right))]",
};

const MapOverlay = React.forwardRef<HTMLDivElement, MapOverlayProps>(
  (
    {
      className,
      position = "top-left",
      width = "auto",
      collisionInsets,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const stack = React.useRef<HTMLDivElement>(null);
    useScrollsMark(stack);
    const insetStyle = {
      "--map-overlay-top": `calc(env(safe-area-inset-top) + 1rem + ${collisionInsets?.top ?? 0}px)`,
      "--map-overlay-right": `calc(env(safe-area-inset-right) + 1rem + ${collisionInsets?.right ?? 0}px)`,
      "--map-overlay-bottom": `calc(env(safe-area-inset-bottom) + 1rem + ${collisionInsets?.bottom ?? 0}px)`,
      "--map-overlay-left": `calc(env(safe-area-inset-left) + 1rem + ${collisionInsets?.left ?? 0}px)`,
      ...style,
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-none absolute z-50 flex flex-col gap-4",
          positionClasses[position],
          widthClasses[width],
          className,
        )}
        style={insetStyle}
        {...props}
      >
        {/* The stack scrolls when it is taller than the map leaves room for.
            Its rule keeps the floating shadow's reach clear around what it
            holds, so the scroll box's clip no longer cuts a control's shadow
            and edge (GAP-082); see .kozmos-map-overlay-stack. */}
        <div ref={stack} className="kozmos-reset kozmos-map-overlay-stack">
          {children}
        </div>
      </div>
    );
  },
);

MapOverlay.displayName = "MapOverlay";

export { MapOverlay };
