import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../utils";
import { createThemePortal } from "../../theme/ThemePortal";
import { ThemeProviderContext } from "../../theme/theme-context";

const TooltipPortal = createThemePortal(TooltipPrimitive.Portal);

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

/**
 * Wrap the trigger when it is a disabled control, so the tooltip still works.
 *
 * A disabled `<button>` fires no pointer events and cannot take focus, so a
 * tooltip attached directly to one is silently dead — and the tooltip that
 * matters most is the one saying *why* a control is unavailable. Pass
 * `disabled` and the trigger becomes a focusable wrapper around the control,
 * which is the element Radix then listens on.
 *
 * `tabIndex={0}` is the part that is easy to miss. Adding pointer handlers to a
 * plain wrapper looks like it works, because hovering does; but focus never
 * arrives, since the disabled child cannot emit it and a bare `<span>` cannot
 * receive it. A reason a keyboard user cannot reach is not a reason. The
 * wrapper deliberately takes a tab stop the disabled control gave up.
 */
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> & {
    disabled?: boolean;
  }
>(({ disabled = false, children, className, ...props }, ref) => {
  if (!disabled) {
    return (
      <TooltipPrimitive.Trigger ref={ref} className={className} {...props}>
        {children}
      </TooltipPrimitive.Trigger>
    );
  }

  return (
    <TooltipPrimitive.Trigger ref={ref} asChild {...props}>
      <span
        className={cn("inline-flex", className)}
        data-disabled-trigger=""
        tabIndex={0}
      >
        {children}
      </span>
    </TooltipPrimitive.Trigger>
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    /** Defaults to the owning ThemeProvider; without a provider, remains inline. */
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof TooltipPrimitive.Portal
    >["container"];
  }
>(({ className, sideOffset = 4, children, portalContainer, ...props }, ref) => {
  const theme = React.useContext(ThemeProviderContext);
  const content = (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-visible rounded-control border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-overlay animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
      {/* The tip, 8 by 4, overlaps the body by 1px, as Figma's Tooltip tip
          does: it covers the body's border where the two meet, so no line
          runs across the tail (site GAP-74). Radix turns the tip to each
          side, so "up" in its own frame is always into the body, and its
          box, which places the tooltip, keeps its size. */}
      <TooltipPrimitive.Arrow
        width={8}
        height={4}
        className="-translate-y-px fill-popover"
      />
    </TooltipPrimitive.Content>
  );
  return portalContainer === undefined && !theme ? (
    content
  ) : (
    <TooltipPortal container={portalContainer}>{content}</TooltipPortal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
