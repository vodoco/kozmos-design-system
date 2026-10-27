import { createThemePortal } from "../../theme/ThemePortal";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../utils";

const PopoverPortal = createThemePortal(PopoverPrimitive.Portal);

// The element a popover is anchored to, which PopoverContent gives focus to
// when it closes with focus lost and what opened it gone: set by
// PopoverAnchor, one per Popover.
const AnchorElementContext =
  React.createContext<React.MutableRefObject<HTMLElement | null> | null>(null);

function Popover(props: PopoverPrimitive.PopoverProps) {
  const anchor = React.useRef<HTMLElement | null>(null);
  return (
    <AnchorElementContext.Provider value={anchor}>
      <PopoverPrimitive.Root {...props} />
    </AnchorElementContext.Provider>
  );
}
Popover.displayName = "Popover";

const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * What a popover sits beside when no trigger opens it (GAP-190): any element,
 * or a rect.
 *
 * With `asChild` it anchors to its child, a button, link or field the product
 * already draws, and adds nothing to it: no `aria-haspopup`, no
 * `aria-expanded`, no click that toggles. The control keeps its own role, and
 * the product opens the popover itself, as a tour opens its step: a
 * controlled `<Popover open={open} onOpenChange={setOpen}>` holding
 * `<PopoverAnchor asChild>` around the control and a `PopoverContent`, with
 * no `PopoverTrigger`. Escape, a press outside and Tab out of a non-modal
 * popover still ask to close it, through `onOpenChange(false)`;
 * `onInteractOutside` with `event.preventDefault()` keeps it open instead.
 *
 * With `virtualRef`, a ref to anything with a `getBoundingClientRect()` (a
 * point on a map, a text selection), it draws no element at all, and
 * `PopoverContent` places itself by that rect. Give the rect a
 * `contextElement`, the element it is drawn in (the map's canvas): the
 * popover then follows it when a box the canvas sits in scrolls, and
 * `hideWhenDetached` hides it when the rect is scrolled out of that box. Pass
 * `updatePositionStrategy="always"` when the rect moves with nothing else on
 * the page, as a map's point does while the map pans.
 *
 * Closing with focus lost, as when Escape or a button in it closes it,
 * `PopoverContent` gives focus back to what had it when it opened, or, when
 * that is gone or had none, to the anchor's element. A rect has nothing to
 * focus: give focus back to what drew it, the map, through
 * `onCloseAutoFocus` with `event.preventDefault()`.
 */
const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>(({ virtualRef, ...props }, ref) => {
  const anchor = React.useContext(AnchorElementContext);
  const own = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      own.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  React.useEffect(() => {
    if (!anchor) return undefined;
    // A rect has nothing to focus, unless the rect is an element (the Vue
    // harness passes one from outside React's tree).
    const virtual = virtualRef?.current;
    anchor.current = virtualRef
      ? virtual instanceof HTMLElement
        ? virtual
        : null
      : own.current;
    return () => {
      anchor.current = null;
    };
  });
  return (
    <PopoverPrimitive.Anchor ref={setRef} virtualRef={virtualRef} {...props} />
  );
});
PopoverAnchor.displayName = PopoverPrimitive.Anchor.displayName;

/** Focuses `element` if it can take focus there and then; says whether it did. */
function focusIfFocusable(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  const document = element.ownerDocument;
  if (element === document.body || element === document.documentElement)
    return false;
  element.focus({ preventScroll: true });
  return document.activeElement === element;
}

/**
 * The popover's panel, in the theme's portal.
 *
 * Closed with focus lost (Escape, or a button in it that closes it), it gives
 * focus back to what had focus as it opened, or, when that is gone or nothing
 * had focus, to its `PopoverAnchor`'s element. It acts only when focus was
 * lost: a `PopoverTrigger` gets its own focus back as before, a next popover
 * that took focus keeps it, and a press outside leaves focus where it landed.
 * `onCloseAutoFocus` with `event.preventDefault()` takes it over.
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof PopoverPrimitive.Portal
    >["container"];
  }
>(
  (
    {
      className,
      align = "center",
      sideOffset = 4,
      portalContainer,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const anchor = React.useContext(AnchorElementContext);
    // What had focus as it opened, before Radix moved it in.
    const invoker = React.useRef<Element | null>(null);
    // Radix leaves focus where a press outside put it (non-modal), and so
    // does this: only a close that loses focus gives it back.
    const pressedOutside = React.useRef(false);
    return (
      <PopoverPortal container={portalContainer}>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn("kozmos-reset kozmos-popover", className)}
          onOpenAutoFocus={(event) => {
            invoker.current =
              (event.currentTarget as Node | null)?.ownerDocument
                ?.activeElement ?? null;
            pressedOutside.current = false;
            onOpenAutoFocus?.(event);
          }}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            if (
              !event.defaultPrevented &&
              event.detail.originalEvent.type === "pointerdown"
            )
              pressedOutside.current = true;
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            const document = (event.currentTarget as Node | null)
              ?.ownerDocument;
            // After Radix's own handler, which gives a trigger its focus.
            queueMicrotask(() => {
              if (!document || pressedOutside.current) return;
              const active = document.activeElement;
              // Only lost focus: a next step that took it keeps it.
              if (active && active !== document.body) return;
              if (!focusIfFocusable(invoker.current))
                focusIfFocusable(anchor?.current);
            });
          }}
          {...props}
        />
      </PopoverPortal>
    );
  },
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/**
 * The pointer tying a popover to what opened it.
 *
 * Radix ships it and this surface used to hide it, so a popover hanging centred
 * below its anchor had nothing connecting the two. Opt-in rather than baked
 * into `PopoverContent` the way `Tooltip` bakes its own: a tooltip is always
 * about the thing it points at, while plenty of popovers are panels that read
 * better square.
 *
 * Defaults match `TooltipContent`'s arrow so the two agree on screen. Note it
 * inherits no border — `PopoverContent` is bordered and Radix's arrow is a
 * plain filled triangle, which is the same compromise `Tooltip` already makes.
 */
const PopoverArrow = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>
>(({ className, width = 8, height = 4, ...props }, ref) => (
  <PopoverPrimitive.Arrow
    ref={ref}
    width={width}
    height={height}
    className={cn("kozmos-reset kozmos-popover-arrow", className)}
    {...props}
  />
));
PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent, PopoverArrow };
