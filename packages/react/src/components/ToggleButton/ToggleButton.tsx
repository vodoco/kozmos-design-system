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
          // GAP-75: eight between an icon and its label, the spacing scale's
          // 100 — as SwiftUI's `HStack(spacing: spacing100)` and Compose's
          // spacer between the icon and the text already draw it, and as
          // `Button` does since GAP-56. This is a Radix Toggle styled on its
          // own, so fixing `.kozmos-button` left it at zero.
          "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
          variant === "outline" &&
            "border border-input bg-transparent shadow-raised hover:bg-accent hover:text-accent-foreground",
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
