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
          // own, so fixing `.kozmos-button` left it at zero. On, it is a
          // prominent fill: the theme fill and the theme foreground, the same
          // in both themes (decision 59), and hovered the themed Button's
          // hover token; the muted hover never showed on it. Focused from
          // the keyboard it draws Button's offset ring, a band of the page's
          // colour and then the theme's 600, 3:1 on the fill and the page:
          // the 1px 600 ring it had read 1.11:1 on the fill.
          "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-theme-fill data-[state=on]:text-theme-fill-foreground data-[state=on]:hover:bg-[var(--components-primary-buttons-themed-button-background-hover)]",
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
