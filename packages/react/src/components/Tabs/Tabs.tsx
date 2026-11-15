import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useComposedRefs } from "@radix-ui/react-compose-refs";

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

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Scrolls a list that is wider than its track (GAP-254, decision 182) so a
 * tab is inside it, by the least distance ("nearest"): a tab already in view
 * leaves the list where it is. Only the list scrolls, never the page, and
 * the track's scroll-padding stays between the tab and its edge. The offset
 * is physical, so it holds right to left, where scrollLeft runs negative.
 */
function revealTab(list: HTMLElement, tab: Element, animate: boolean) {
  if (list.scrollWidth <= list.clientWidth) return;
  const style = getComputedStyle(list);
  const frame = list.getBoundingClientRect();
  const start = frame.left + list.clientLeft;
  const left = start + (parseFloat(style.scrollPaddingLeft) || 0);
  const right =
    start + list.clientWidth - (parseFloat(style.scrollPaddingRight) || 0);
  const box = tab.getBoundingClientRect();
  // Past the start edge, the start goes to it; past the end edge, the end,
  // unless that would push the start out: a tab wider than the track shows
  // its start.
  const toLeft = box.left - left;
  const toRight = box.right - right;
  let distance = 0;
  if (style.direction === "rtl") {
    if (toRight > 0) distance = toRight;
    else if (toLeft < 0) distance = Math.max(toLeft, toRight);
  } else if (toLeft < 0) distance = toLeft;
  else if (toRight > 0) distance = Math.min(toRight, toLeft);
  // Whole pixels, rounded outwards: WebKit keeps scrollLeft whole, and a
  // fraction left behind would leave the tab's edge just out of view.
  if (Math.abs(distance) < 0.05) return;
  distance = distance > 0 ? Math.ceil(distance) : Math.floor(distance);
  const reduced =
    !animate ||
    list.closest('[data-kozmos-motion="reduced"]') !== null ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  const to = list.scrollLeft + distance;
  if (typeof list.scrollTo === "function")
    list.scrollTo({ left: to, behavior: reduced ? "auto" : "smooth" });
  else list.scrollLeft = to;
}

const ACTIVE_TAB = '[role="tab"][data-state="active"]';

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, onFocus, ...props }, forwardedRef) => {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const ref = useComposedRefs(forwardedRef, listRef);
  // A list wider than its space is marked data-scrollable, and its owned
  // CSS makes the track a scrollport; one that fits is left as it was. The
  // selected tab is in view when the list is first shown or starts to
  // overflow, at once, and again, animated unless motion is reduced,
  // whenever the selection moves. The list watches its tabs' state rather
  // than the root's value, so it holds under any Tabs root, controlled or
  // not. A list first laid out at no width (in a closed sheet, say) is
  // measured when it gets one.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reveal = (animate: boolean) => {
      const tab = list.querySelector(ACTIVE_TAB);
      if (tab) revealTab(list, tab, animate);
    };
    const measure = () => {
      if (list.clientWidth === 0) return;
      const overflows = list.scrollWidth > list.clientWidth;
      if (overflows === list.hasAttribute("data-scrollable")) return;
      if (overflows) {
        list.setAttribute("data-scrollable", "");
        reveal(false);
      } else list.removeAttribute("data-scrollable");
    };
    measure();
    // The list's own size, and each tab's: a tab's words can change, or
    // its font arrive, while the list stays as wide as its space.
    const resize =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    const observeTabs = () => {
      if (!resize) return;
      resize.disconnect();
      resize.observe(list);
      for (const child of Array.from(list.children)) resize.observe(child);
    };
    observeTabs();
    const changes =
      typeof MutationObserver === "function"
        ? new MutationObserver((records) => {
            if (records.some((record) => record.type === "childList")) {
              observeTabs();
              measure();
            }
            if (
              records.some(
                (record) =>
                  record.type === "attributes" &&
                  record.target instanceof Element &&
                  record.target.matches(ACTIVE_TAB),
              )
            )
              reveal(true);
          })
        : null;
    changes?.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => {
      resize?.disconnect();
      changes?.disconnect();
    };
  }, []);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // A tab with an icon stacks it over its words (GAP-152). Then every
        // tab in the list takes the stacked height, so the raised segment
        // fills the track whichever tab is active, and a tab of words alone
        // centres them (the tabs stretch, flex's default); a list of words
        // alone stays 40 with its tabs centred. Both rules are in :where(),
        // so a caller's own height or alignment class wins over them.
        // kozmos-tabs-list (owned CSS) keeps the track inside its space and
        // centres the tabs, and scrolls a list wider than it.
        "kozmos-tabs-list inline-flex rounded-control bg-muted p-1 text-muted-foreground [:where(&:not(:has([data-slot=tabs-trigger-icon])))]:h-10 [:where(&:not(:has([data-slot=tabs-trigger-icon])))]:items-center",
        className,
      )}
      // Focus moving to a tab out of view brings it in, as the browser's own
      // focus scroll would, without moving the page (a tab focused with
      // preventScroll included).
      onFocus={(event) => {
        onFocus?.(event);
        const list = listRef.current;
        if (list && event.target instanceof Element && event.target !== list)
          revealTab(list, event.target, true);
      }}
      {...props}
    />
  );
});
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
