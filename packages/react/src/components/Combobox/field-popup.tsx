import * as React from "react";
import * as PopperPrimitive from "@radix-ui/react-popper";
import { Portal } from "@radix-ui/react-portal";
import { createThemePortal } from "../../theme/ThemePortal";
import { cn } from "../../utils";

const FieldPopupPortal = createThemePortal(Portal);

/**
 * A text field's popup (Combobox, MultiSelect), drawn in the theme's portal
 * under the field, so a panel, a sheet or a card that clips its overflow
 * never cuts the list off. Positioned only: no dialog, no focus scope and no
 * dismiss layer of its own, so the field keeps its keyboard, its Escape (IME
 * and host vetoes included) and its outside-press handling. Internal.
 */
export const FieldPopupRoot = PopperPrimitive.Root;

/**
 * The list's height: 16rem, or the room the window leaves on the side it
 * opens to. In its portal the list is fixed, so the page cannot scroll it
 * into view: on a phone on its side (568 by 320) it ran off the window.
 * Inline, outside the popper, the variable is unset and 16rem holds.
 */
export const FIELD_POPUP_MAX_HEIGHT =
  "min(16rem, var(--radix-popper-available-height, 16rem))";
export const FieldPopupAnchor = PopperPrimitive.Anchor;

export const FieldPopupContent = React.forwardRef<
  React.ElementRef<typeof PopperPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopperPrimitive.Content>
>(({ className, style, ...props }, ref) => (
  <FieldPopupPortal>
    <PopperPrimitive.Content
      ref={ref}
      side="bottom"
      align="start"
      sideOffset={4}
      collisionPadding={8}
      className={cn("kozmos-reset z-50", className)}
      style={{ width: "var(--radix-popper-anchor-width)", ...style }}
      {...props}
    />
  </FieldPopupPortal>
));
FieldPopupContent.displayName = "FieldPopupContent";

/**
 * What a field's popup says aloud: its empty text when typing empties the
 * list, and nothing otherwise. Internal.
 *
 * It is in the field from the first render, outside the popup and its portal,
 * and only its words change. A screen reader reads a change inside a live
 * region that is already in the page. A region that arrives holding its words
 * is often not read at all: the popup's own empty box was one, and VoiceOver on
 * Safari said nothing (5 Nov). The popup's visible copy is plain text, so
 * nothing announces the message twice.
 *
 * Polite, and said as well as implied by the role: an open modal popup hides
 * every box not marked `aria-live` (GAP-193). A block, not a span, so WebKit
 * does not run its words into the text after it.
 */
export function FieldPopupStatus({ message }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

/**
 * The popup frame's mousedown: a press on a group's label, the frame's
 * padding or the gap between rows takes no focus from the field, so its
 * list stays open (the rows prevent their own). A press on a scroll box's
 * scrollbar, outside its client area, is the browser's to drag.
 */
export function keepFieldFocus(event: React.MouseEvent<HTMLElement>) {
  const target = event.target;
  if (target instanceof HTMLElement) {
    const style = target.ownerDocument.defaultView?.getComputedStyle(target);
    const border = (side: string) =>
      parseFloat(style?.getPropertyValue(`border-${side}-width`) ?? "") || 0;
    // Room a classic scrollbar takes: the box less its client area and borders.
    const across =
      target.offsetWidth -
      target.clientWidth -
      border("left") -
      border("right");
    const down =
      target.offsetHeight -
      target.clientHeight -
      border("top") -
      border("bottom");
    const { offsetX, offsetY } = event.nativeEvent;
    if (
      (across > 0 && (offsetX < 0 || offsetX >= target.clientWidth)) ||
      (down > 0 && (offsetY < 0 || offsetY >= target.clientHeight))
    )
      return;
  }
  event.preventDefault();
}
