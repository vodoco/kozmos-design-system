import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../utils";
import { createThemePortal } from "../../theme/ThemePortal";
import { ThemeProviderContext } from "../../theme/theme-context";
import {
  TOOLTIP_ARROW_CLASSES,
  TOOLTIP_ARROW_SIZE,
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_CONTENT_MOTION_CLASS,
  TOOLTIP_DISABLED_TRIGGER_CLASS,
  TOOLTIP_TONE_CLASSES,
  tooltipTone,
} from "../../recipes/tooltip";

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
        className={cn(TOOLTIP_DISABLED_TRIGGER_CLASS, className)}
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
    /**
     * The tooltip's surface, and its arrow's (decision 192, GAP-210).
     * `default` is the popover surface with its border, light on a light
     * page. `inverse` is the inverse surface: dark under white words on a
     * light page (#2E3138, Pointr Cloud's tooltip, 13.0:1) and light under
     * black words on a dark one (#D1CEC7, 13.4:1), from the
     * `Semantics.Inverse` roles, so a client's theme carries it. The same
     * size in both tones.
     */
    tone?: "default" | "inverse";
  }
>(
  (
    {
      className,
      sideOffset = 4,
      children,
      portalContainer,
      tone = "default",
      ...props
    },
    ref,
  ) => {
    const theme = React.useContext(ThemeProviderContext);
    const surface = tooltipTone(tone);
    const content = (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        data-tone={surface === "inverse" ? "inverse" : undefined}
        className={cn(
          TOOLTIP_CONTENT_CLASS,
          TOOLTIP_TONE_CLASSES[surface],
          TOOLTIP_CONTENT_MOTION_CLASS,
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
          width={TOOLTIP_ARROW_SIZE.width}
          height={TOOLTIP_ARROW_SIZE.height}
          className={TOOLTIP_ARROW_CLASSES[surface]}
        />
      </TooltipPrimitive.Content>
    );
    return portalContainer === undefined && !theme ? (
      content
    ) : (
      <TooltipPortal container={portalContainer}>{content}</TooltipPortal>
    );
  },
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
