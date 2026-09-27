import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

export type NavigationItemState =
  | "default"
  | "hover"
  | "selected"
  | "focus"
  | "disabled";

const navigationItemVariants = cva(
  "group/navigation-item relative min-w-0 select-none rounded-control font-medium outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      placement: {
        top: "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        side: "flex w-full items-center justify-start gap-2 text-left",
        rail: "inline-flex flex-col items-center justify-center gap-1 text-center",
      },
      density: {
        default: "",
        compact: "",
      },
      state: {
        default:
          "text-foreground hover:bg-muted/70 hover:text-foreground active:bg-muted",
        hover: "bg-muted/70 text-foreground",
        selected: "bg-muted text-primary",
        focus: "text-foreground ring-2 ring-ring ring-offset-2",
        disabled:
          "pointer-events-none cursor-not-allowed text-muted-foreground opacity-50",
      },
    },
    compoundVariants: [
      {
        placement: "top",
        density: "default",
        className: "min-h-11 px-3 py-2 text-sm",
      },
      {
        placement: "top",
        density: "compact",
        className: "min-h-11 px-2.5 py-1.5 text-sm",
      },
      {
        placement: "side",
        density: "default",
        className: "min-h-11 px-3 py-2 text-sm",
      },
      {
        placement: "side",
        density: "compact",
        className: "min-h-11 px-2.5 py-1.5 text-sm",
      },
      {
        placement: "rail",
        density: "default",
        className: "min-h-[72px] w-[72px] px-2 py-2 text-xs",
      },
      {
        placement: "rail",
        density: "compact",
        className: "min-h-16 w-16 px-1.5 py-1.5 text-xs",
      },
    ],
    defaultVariants: {
      placement: "side",
      density: "default",
      state: "default",
    },
  },
);

export type NavigationItemContent =
  | "label"
  | "icon-label"
  | "icon-only"
  | "badge"
  | "trailing";

export interface NavigationItemProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "children">,
    Omit<VariantProps<typeof navigationItemVariants>, "state"> {
  asChild?: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  content?: NavigationItemContent;
  disabled?: boolean;
  focusVisible?: boolean;
  href?: string;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  selected?: boolean;
  state?: NavigationItemState;
  trailing?: React.ReactNode;
}

const NavigationItem = React.forwardRef<HTMLElement, NavigationItemProps>(
  (
    {
      "aria-current": ariaCurrent,
      asChild = false,
      badge,
      children,
      className,
      content: contentProp,
      density = "default",
      disabled = false,
      focusVisible = false,
      href,
      icon,
      label,
      onClick,
      placement = "side",
      selected = false,
      state = "default",
      tabIndex,
      trailing,
      ...props
    },
    ref,
  ) => {
    const forcedSelected = state === "selected";
    const forcedDisabled = state === "disabled";
    const forcedFocus = state === "focus";
    const visualState = forcedDisabled
      ? "disabled"
      : forcedSelected || selected
        ? "selected"
        : forcedFocus || focusVisible
          ? "focus"
          : state === "hover"
            ? "hover"
            : "default";
    const isDisabled = disabled || forcedDisabled;
    const isSelected = selected || forcedSelected;
    const content =
      contentProp ??
      (trailing ? "trailing" : badge ? "badge" : icon ? "icon-label" : "label");
    const isRail = placement === "rail";
    const isIconOnly = content === "icon-only";
    const labelContent = label ?? children;
    const shouldRenderIcon = content !== "label" && Boolean(icon);
    const shouldRenderBadge = content === "badge" && Boolean(badge);
    const shouldRenderTrailing = content === "trailing" && Boolean(trailing);
    const Comp: React.ElementType = asChild ? Slot : href ? "a" : "button";

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <Comp
        ref={ref}
        aria-current={isSelected ? (ariaCurrent ?? "page") : ariaCurrent}
        aria-disabled={isDisabled || undefined}
        className={cn(
          navigationItemVariants({
            density,
            placement,
            state: visualState,
          }),
          className,
        )}
        data-disabled={isDisabled || undefined}
        data-content={content}
        data-placement={placement}
        data-selected={isSelected || undefined}
        disabled={!asChild && !href ? isDisabled : undefined}
        href={href}
        onClick={handleClick}
        tabIndex={isDisabled ? -1 : tabIndex}
        type={!asChild && !href ? "button" : undefined}
        {...props}
      >
        {shouldRenderIcon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex shrink-0 items-center justify-center text-current",
              isRail ? "h-6 w-6" : "h-5 w-5",
            )}
          >
            {icon}
          </span>
        ) : null}
        {!isIconOnly && labelContent ? (
          <span
            className={cn(
              "min-w-0",
              // A rail is narrow on purpose, and truncating there loses the
              // word rather than shortening it: "Overvi…", "Wayfin…". Two
              // lines fit the 72px tile and the Cloud Dashboard already wraps
              // "SDK Configuration" this way. Elsewhere the row is wide and a
              // single truncated line is the right compromise.
              isRail
                ? "line-clamp-2 max-w-full text-balance leading-4"
                : "flex-1 truncate",
            )}
          >
            {labelContent}
          </span>
        ) : null}
        {shouldRenderBadge && !isIconOnly ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-pill border border-border bg-background px-1.5 text-xs leading-5 text-foreground",
              isRail ? "" : "ml-auto",
            )}
          >
            {badge}
          </span>
        ) : null}
        {shouldRenderTrailing && !isIconOnly ? (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center text-muted-foreground",
              isRail ? "" : "ml-auto",
            )}
          >
            {trailing}
          </span>
        ) : null}
      </Comp>
    );
  },
);

NavigationItem.displayName = "NavigationItem";

export { NavigationItem, navigationItemVariants };
