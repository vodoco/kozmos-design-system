import * as React from "react";
import * as PopperPrimitive from "@radix-ui/react-popper";
import { Portal } from "@radix-ui/react-portal";
import { createThemePortal } from "../../theme/ThemePortal";
import { cn } from "../../utils";
import {
  FIELD_POPUP_CONTENT_CLASS,
  FIELD_POPUP_MAX_HEIGHT,
  FIELD_POPUP_PLACEMENT,
  keepsFieldFocus,
} from "../../recipes/combobox";

const FieldPopupPortal = createThemePortal(Portal);

/**
 * A text field's popup (Combobox, MultiSelect), drawn in the theme's portal
 * under the field, so a panel, a sheet or a card that clips its overflow
 * never cuts the list off. Positioned only: no dialog, no focus scope and no
 * dismiss layer of its own, so the field keeps its keyboard, its Escape (IME
 * and host vetoes included) and its outside-press handling. Internal.
 */
export const FieldPopupRoot = PopperPrimitive.Root;

// The list's height, in recipes/combobox.ts with Vue's KozmosCombobox.
export { FIELD_POPUP_MAX_HEIGHT };
export const FieldPopupAnchor = PopperPrimitive.Anchor;

export const FieldPopupContent = React.forwardRef<
  React.ElementRef<typeof PopperPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopperPrimitive.Content>
>(({ className, style, ...props }, ref) => (
  <FieldPopupPortal>
    <PopperPrimitive.Content
      ref={ref}
      side={FIELD_POPUP_PLACEMENT.side}
      align={FIELD_POPUP_PLACEMENT.align}
      sideOffset={FIELD_POPUP_PLACEMENT.sideOffset}
      collisionPadding={FIELD_POPUP_PLACEMENT.collisionPadding}
      className={cn(FIELD_POPUP_CONTENT_CLASS, className)}
      style={{ width: "var(--radix-popper-anchor-width)", ...style }}
      {...props}
    />
  </FieldPopupPortal>
));
FieldPopupContent.displayName = "FieldPopupContent";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Says when a field's popup list is in the page: true as it mounts, false as
 * it goes, in the commit that draws or removes it. Internal. A field names an
 * active option only while its list is drawn, and its portal draws the list a
 * commit after the field opens (GAP-231).
 *
 * A layout effect of its own, not a callback ref: under `asChild` Radix's
 * Slot gives the list's ref a new identity every render, so React calls it
 * with null and the node in every commit, and a ref that set state looped on
 * React 18 ("Maximum update depth exceeded", #513). This runs only when the
 * list mounts and unmounts.
 */
export function FieldPopupDrawn({
  onDrawn,
}: {
  onDrawn: (drawn: boolean) => void;
}) {
  useIsomorphicLayoutEffect(() => {
    onDrawn(true);
    return () => onDrawn(false);
  }, [onDrawn]);
  return null;
}

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
  const { offsetX, offsetY } = event.nativeEvent;
  if (!keepsFieldFocus(event.target, offsetX, offsetY)) return;
  event.preventDefault();
}
