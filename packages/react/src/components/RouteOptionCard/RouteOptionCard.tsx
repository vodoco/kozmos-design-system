import React from "react";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";
import {
  Clock as Clock3,
  Sliders01 as SlidersHorizontal,
} from "@kozmos-ds/icons";
import { Accessibility } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface RouteOptionCardProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onSelect"
> {
  option: RouteOptionPresentation;
  onSelect: (routeId: string) => void;
  icon?: React.ReactNode;
}

const preferenceIcons = {
  quickest: <Clock3 className="h-4 w-4" />,
  "step-free": <Accessibility className="h-4 w-4" />,
  custom: <SlidersHorizontal className="h-4 w-4" />,
};

const RouteOptionCard = React.forwardRef<
  HTMLButtonElement,
  RouteOptionCardProps
>(
  (
    {
      className,
      option,
      onSelect,
      icon = preferenceIcons[option.preference],
      type = "button",
      disabled: disabledProp,
      ...props
    },
    ref,
  ) => {
    const disabled = !option.available || disabledProp;
    const warningId = option.warning ? `route-${option.id}-warning` : undefined;

    return (
      <button
        ref={ref}
        aria-describedby={warningId}
        aria-pressed={option.selected}
        className={cn(
          "flex min-h-24 w-full min-w-52 flex-col justify-between rounded-container border bg-background p-3 text-left text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          option.selected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border hover:bg-muted/60",
          className,
        )}
        data-route-id={option.id}
        disabled={disabled}
        onClick={() => onSelect(option.id)}
        type={type}
        {...props}
      >
        <span className="flex w-full items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className="text-primary">
            {icon}
          </span>
          <span className="truncate">{option.label}</span>
        </span>
        <span className="mt-3 flex w-full items-end justify-between gap-3">
          <span className="text-xl font-semibold leading-none">
            {option.durationLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            {option.distanceLabel}
          </span>
        </span>
        {option.warning && (
          <span
            className="mt-2 block text-xs text-warning-foreground"
            id={warningId}
          >
            {option.warning}
          </span>
        )}
      </button>
    );
  },
);

RouteOptionCard.displayName = "RouteOptionCard";

export { RouteOptionCard };
