import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import type { NavigationItemProps } from "../NavigationItem/NavigationItem";

export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    badge?: React.ReactNode;
    disabled?: boolean;
    href?: string;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
  }[];
  density?: NavigationItemProps["density"];
}

// The bar's own items (decision 42). They were NavigationItem's compact rail
// tiles until the rail took the dashboard side menu's design; the bar keeps
// the tile it had: an icon over an 11px label on 14px lines, sharing the
// bar's width, 6px in from its edges (8px at the default density), a selected
// one on the muted fill.
const bottomNavigationItemVariants = cva(
  "relative inline-flex h-full w-auto min-w-0 flex-1 select-none flex-col items-center justify-center gap-1 rounded-control text-center text-[11px] font-medium outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      density: {
        default: "min-h-[72px] px-2 py-2",
        compact: "min-h-16 px-1.5 py-1.5",
      },
      selected: {
        true: "bg-muted text-primary",
        false:
          "text-foreground hover:bg-muted/70 hover:text-foreground active:bg-muted",
      },
    },
    defaultVariants: {
      density: "compact",
      selected: false,
    },
  },
);

const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  (
    {
      "aria-label": ariaLabel = "Bottom navigation",
      className,
      density = "compact",
      items,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        data-slot="bottom-navigation"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around gap-1 border-t bg-background px-2 pb-safe",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => {
          const disabled = Boolean(item.disabled);
          const selected = Boolean(item.active);
          const Item: React.ElementType = item.href ? "a" : "button";
          return (
            <Item
              key={index}
              aria-current={selected ? "page" : undefined}
              aria-disabled={disabled || undefined}
              className={bottomNavigationItemVariants({
                density: density ?? "compact",
                selected,
              })}
              data-disabled={disabled || undefined}
              data-selected={selected || undefined}
              data-slot="bottom-navigation-item"
              disabled={item.href ? undefined : disabled}
              href={item.href}
              onClick={(event: React.MouseEvent<HTMLElement>) => {
                if (disabled) {
                  event.preventDefault();
                  return;
                }
                trackEvent("BottomNavigation", "bottom_nav_item_clicked", {
                  label: item.label,
                });
                item.onClick?.();
              }}
              tabIndex={disabled ? -1 : undefined}
              type={item.href ? undefined : "button"}
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center text-current"
              >
                {item.icon}
              </span>
              <span className="line-clamp-2 min-w-0 max-w-full text-balance leading-[14px]">
                {item.label}
              </span>
              {item.badge ? (
                <span className="inline-flex shrink-0 items-center justify-center rounded-pill border border-border bg-background px-1.5 text-xs leading-5 text-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Item>
          );
        })}
      </nav>
    );
  },
);
BottomNavigation.displayName = "BottomNavigation";

export { BottomNavigation };
