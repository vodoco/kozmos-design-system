import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { Counter } from "../Counter";
import {
  BADGE_ICON_CLASS,
  badgeCounterClass,
  badgeCounterTone,
  badgeShowsCounter,
  badgeVariants,
} from "../../recipes/badge";

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  counter?: React.ReactNode;
  icon?: React.ReactNode;
  showCounter?: boolean;
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
    const hasCounter = badgeShowsCounter(size, showCounter, counter);

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
            className={BADGE_ICON_CLASS}
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
            // On the default Badge the counter inverts (recipes/badge.ts).
            className={badgeCounterClass(variant)}
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
