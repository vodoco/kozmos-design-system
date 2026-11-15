import React from "react";
import { cn } from "../../utils";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface ToggleButtonProps extends React.ComponentPropsWithoutRef<
  typeof TogglePrimitive.Root
> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

const ToggleButton = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      onPressedChange,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    return (
      <TogglePrimitive.Root
        ref={ref}
        className={cn(
          // Its look is owned CSS, kozmos-toggle-button (GAP-262), so the
          // pressed fill, the focus ring and the disabled half-strength hold
          // in a host where no @scope rule applies. Pressed is read from
          // aria-pressed, never data-state (GAP-261): a trigger this button
          // is the child of (TooltipTrigger asChild) writes its own
          // data-state over Toggle's "on", and the pressed fill was lost.
          // The sizes stay utilities.
          "kozmos-toggle-button",
          variant === "outline" && "kozmos-toggle-button-outline",
          size === "default" && "h-9 px-3",
          size === "sm" && "h-8 px-2",
          size === "lg" && "h-10 px-3",
          className,
        )}
        onPressedChange={(pressed) => {
          trackEvent("ToggleButton", "toggle_pressed", { pressed });
          onPressedChange?.(pressed);
        }}
        {...props}
      />
    );
  },
);
ToggleButton.displayName = TogglePrimitive.Root.displayName;

export { ToggleButton };
