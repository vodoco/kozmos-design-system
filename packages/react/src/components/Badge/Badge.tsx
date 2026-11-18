import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { Counter, type CounterProps } from "../Counter";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-control text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // A status, not a control (decision 93): nothing changes under the
      // pointer, so no variant has a hover state.
      variant: {
        // The theme fill and the theme foreground, the same in both themes
        // (decision 59).
        default: "bg-theme-fill text-theme-fill-foreground",
        destructive:
          "bg-destructive text-[var(--primitives-colors-foreground-1000)]",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "",
        link: "text-primary underline-offset-4",
      },
      // Chip's scale (decision 93, GAP-147): 28, 32 and 36 at touch, 20, 24
      // and 28 compact, from the density's Badge tokens. An icon Badge is
      // the default height, square.
      size: {
        default: "h-badge px-4",
        sm: "h-badge-sm px-3",
        lg: "h-badge-lg px-8",
        icon: "h-badge w-badge",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  counter?: React.ReactNode;
  icon?: React.ReactNode;
  showCounter?: boolean;
}

function badgeCounterTone(
  variant: BadgeProps["variant"],
): CounterProps["tone"] {
  if (variant === "default" || variant === "destructive" || !variant) {
    return "inverse";
  }

  return "neutral";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      asChild: _asChild,
      children,
      className,
      counter,
      icon,
      showCounter = false,
      size,
      variant,
      ...props
    },
    ref,
  ) => {
    const isIconOnly = size === "icon";
    const hasCounter =
      !isIconOnly &&
      showCounter &&
      counter !== undefined &&
      counter !== null &&
      counter !== false;

    return (
      <div
        ref={ref}
        role={isIconOnly ? "img" : undefined}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {icon ? (
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4"
            data-slot="badge-icon"
          >
            {icon}
          </span>
        ) : isIconOnly ? (
          children
        ) : null}
        {!isIconOnly ? children : null}
        {hasCounter ? (
          <Counter
            tone={badgeCounterTone(variant)}
            // On the default Badge, itself the theme fill, the counter
            // inverts: the theme foreground with the fill's number, in both
            // themes, as the selected level's count does (Olcay, 2026-10-07).
            // `inverse` was the surface, black in the dark.
            className={
              (variant ?? "default") === "default"
                ? "bg-theme-fill-foreground text-theme-fill"
                : undefined
            }
            data-slot="badge-counter"
          >
            {counter}
          </Counter>
        ) : null}
      </div>
    );
  },
);

Badge.displayName = "Badge";
