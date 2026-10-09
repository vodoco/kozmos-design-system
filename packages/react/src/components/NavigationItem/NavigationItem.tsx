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
        // Decision 42: the dashboard side menu's item. It fills its rail, a
        // 96px one, and grows with its label: 16px by 8px of padding, a 24px
        // icon 6px above an 11px regular label on 14px lines, up to two (76px
        // tall, 90 with two lines). It is square, so its selected bar runs the
        // whole height of its inline end, and it rings its focus inside
        // itself, because a rail scrolls and would clip a ring drawn outside.
        // It has no compact size: `density` sizes top and side items only.
        rail: "flex w-full flex-col items-center justify-center gap-1.5 rounded-none px-2 py-4 text-center text-[11px] font-normal focus-visible:ring-inset focus-visible:ring-offset-0",
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
      // A rail item at rest is the muted foreground. Selected, it is primary
      // on theme/0, the lightest theme step (the dashboard's tint, a pair the
      // contrast contract holds at 4.5:1 in both themes), with no grey fill;
      // its bar is drawn by the item itself.
      {
        placement: "rail",
        state: "default",
        className: "text-muted-foreground",
      },
      {
        placement: "rail",
        state: "selected",
        className: "bg-[var(--primitives-colors-theme-0)]",
      },
      {
        placement: "rail",
        state: "focus",
        className: "text-muted-foreground ring-inset ring-offset-0",
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
  /**
   * How roomy a top or side item is. A rail item has one size and draws the
   * same with `compact` as without it: the 64px compact tile is retired, and
   * a rail item fills its rail (decision 42).
   */
  density?: VariantProps<typeof navigationItemVariants>["density"];
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
    // With `asChild`, the one child (a router's link) becomes the item: it
    // takes the item's props, and the icon, label and badge go inside it.
    // Slot takes a single element, so they cannot be its siblings.
    const slotChild =
      asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
        ? children
        : null;
    const labelContent =
      label ?? (slotChild ? slotChild.props.children : children);
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

    const inner = (
      <>
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
              // word rather than shortening it: "Overvi…", "Wayfin…". A label
              // wraps to two lines instead, as the Cloud Dashboard wraps "SDK
              // Configuration", and the item grows to hold them. Elsewhere the
              // row is wide and a single truncated line is the right
              // compromise.
              isRail
                ? "line-clamp-2 max-w-full text-balance leading-[14px]"
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
        {isRail && visualState === "selected" ? (
          // The selected rail item's 2px bar, down its inline end: the right
          // in LTR, the left in RTL.
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 w-0.5 bg-primary"
            data-slot="navigation-item-indicator"
          />
        ) : null}
      </>
    );

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
        {slotChild ? React.cloneElement(slotChild, undefined, inner) : inner}
      </Comp>
    );
  },
);

NavigationItem.displayName = "NavigationItem";

export { NavigationItem, navigationItemVariants };
