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
      // A tab with an icon stacks it over its words (GAP-152). Then every
      // tab in the list takes the stacked height, so the raised segment
      // fills the track whichever tab is active, and a tab of words alone
      // centres them (the tabs stretch, flex's default); a list of words
      // alone stays 40 with its tabs centred. Both rules are in :where(),
      // so a caller's own height or alignment class wins over them.
      "inline-flex justify-center rounded-control bg-muted p-1 text-muted-foreground [:where(&:not(:has([data-slot=tabs-trigger-icon])))]:h-10 [:where(&:not(:has([data-slot=tabs-trigger-icon])))]:items-center",
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
>(({ className, icon, children, asChild, ...props }, ref) => {
  const hasIcon = icon !== undefined && icon !== null && icon !== false;
  const iconSlot = hasIcon ? (
    <span
      aria-hidden="true"
      data-slot="tabs-trigger-icon"
      className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
    >
      {icon}
    </span>
  ) : null;
  // An `asChild` tab is the caller's element: with an icon, the icon goes
  // inside it, before its words, and the element stays the one child Radix
  // makes the tab. Without an icon the children pass through untouched.
  const content =
    hasIcon &&
    asChild &&
    React.isValidElement<{ children?: React.ReactNode }>(children) ? (
      React.cloneElement(children, undefined, iconSlot, children.props.children)
    ) : hasIcon && !asChild ? (
      <>
        {iconSlot}
        {children}
      </>
    ) : (
      children
    );
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[calc(var(--semantics-radius-control)_*_1px_-_4px)] px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-raised",
        hasIcon && "flex-col gap-1",
        className,
      )}
      {...props}
    >
      {content}
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
