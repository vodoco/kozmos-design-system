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
