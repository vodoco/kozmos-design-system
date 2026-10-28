import React from "react";
import { cn } from "../../utils";

export interface SidebarProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "content"
> {
  collapsed?: boolean;
  collapsible?: boolean;
  header?: React.ReactNode;
  navigation?: React.ReactNode;
  content?: React.ReactNode;
  tools?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * The room above the first slot (GAP-199). `"default"` pads the top as the
   * bottom is padded: 24, and 16 more above the navigation. `"flush"` drops
   * the 24, and on a rail with no header the 16 too: its first item flush
   * under a fixed header, as Pointr Cloud draws its side menu.
   * An expanded sidebar keeps the 16, room for the ring its items draw
   * outside themselves. The bottom keeps its room either way.
   */
  inset?: "default" | "flush";
  variant?: "expanded" | "rail";
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      className,
      collapsed = false,
      collapsible,
      header,
      navigation,
      content,
      tools,
      footer,
      inset = "default",
      variant = collapsed ? "rail" : "expanded",
      children,
      ...props
    },
    ref,
  ) => {
    const navigationContent = navigation ?? content ?? children;

    return (
      <aside
        ref={ref}
        data-slot="sidebar"
        data-collapsed={variant === "rail" ? "true" : undefined}
        data-collapsible={collapsible ? "true" : undefined}
        className={cn(
          // On the surface, its edge at the inline end: the right in LTR,
          // the left in RTL.
          "flex h-full flex-col border-e bg-surface-0 py-6",
          inset === "flush" && "pt-0",
          // The rail is 96px and its NavigationItems fill it (decision 42),
          // so it has no inline padding; its header and footer stay centred.
          variant === "rail" ? "w-24 items-center" : "w-64 px-4",
          collapsible && "transition-[width]",
          className,
        )}
        {...props}
      >
        {header ? (
          <div data-slot="sidebar-header" className="shrink-0">
            {header}
          </div>
        ) : null}
        {navigationContent ? (
          <nav
            data-slot="sidebar-navigation"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto py-4",
              // A flush rail's first item at the edge: rail items ring their
              // focus inside themselves, where this scroller cannot clip it.
              // An expanded sidebar's items ring outside, so it keeps 16.
              inset === "flush" && !header && variant === "rail" && "pt-0",
              variant === "rail" && "self-stretch",
            )}
          >
            {navigationContent}
          </nav>
        ) : null}
        {tools ? (
          <div data-slot="sidebar-tools" className="shrink-0 border-t py-3">
            {tools}
          </div>
        ) : null}
        {footer ? (
          <div data-slot="sidebar-footer" className="shrink-0 border-t pt-3">
            {footer}
          </div>
        ) : null}
      </aside>
    );
  },
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
