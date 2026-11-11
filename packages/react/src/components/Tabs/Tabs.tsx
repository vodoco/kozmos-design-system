import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

const Tabs: React.FC<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
> = ({ onValueChange, ...props }) => {
  const { trackEvent } = useKozmosAnalytics();
  return (
    <TabsPrimitive.Root
      onValueChange={(value) => {
        trackEvent("Tabs", "tab_switched", { value });
        onValueChange?.(value);
      }}
      {...props}
    />
  );
};
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // A tab with an icon stacks it over its words (GAP-152), so the track
      // grows to hold it; a list of words alone stays 40.
      "inline-flex h-10 items-center justify-center rounded-control bg-muted p-1 text-muted-foreground has-[[data-slot=tabs-trigger-icon]]:h-auto",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> {
  /**
   * An icon over the tab's words (GAP-152): 20px, 4px above them, in their
   * colour. It is drawn only; the tab is named by its words. The active tab
   * stays decision 65's raised segment, and the list grows to hold it.
   */
  icon?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, icon, children, ...props }, ref) => {
  const hasIcon = icon !== undefined && icon !== null && icon !== false;
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[calc(var(--semantics-radius-control)_*_1px_-_4px)] px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-raised",
        hasIcon && "flex-col gap-1",
        className,
      )}
      {...props}
    >
      {/* Without an icon the children pass through untouched, so `asChild`
          keeps its one child. */}
      {hasIcon ? (
        <>
          <span
            aria-hidden="true"
            data-slot="tabs-trigger-icon"
            className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
          >
            {icon}
          </span>
          {children}
        </>
      ) : (
        children
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
