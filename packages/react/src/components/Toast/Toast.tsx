import React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "../../utils";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  InfoCircle,
  X,
} from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import type { ToastTone } from "./toast-store";

// Each tone's icon, the Alert set's for it in Figma, in the tone's text
// colour, which holds 3:1 on the toast's background in both themes.
const TONES = {
  success: [Check, "text-success-text"],
  info: [InfoCircle, "text-info-text"],
  warning: [AlertTriangle, "text-warning-text"],
  critical: [AlertCircle, "text-destructive-text"],
} as const;

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-toast flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    /**
     * toast()'s tones (GAP-167), Notice's with success. A tone draws its
     * icon at the inline start, in the tone's text colour; the surface stays
     * the background. None, or `neutral`, draws no icon. It says nothing to
     * a screen reader: `type` does that (Radix's `foreground`, assertive, or
     * `background`, polite), which the Toaster sets from the tone.
     */
    tone?: ToastTone;
  }
>(({ className, onOpenChange, tone, children, ...props }, ref) => {
  const { trackEvent } = useKozmosAnalytics();
  const [Icon, ink] = (tone && tone !== "neutral" && TONES[tone]) || [];

  return (
    <ToastPrimitive.Root
      ref={ref}
      onOpenChange={(open) => {
        if (open) trackEvent("Toast", "toast_shown");
        onOpenChange?.(open);
      }}
      // The room for the close and the space between the words and the
      // action follow the reading direction. In a right-to-left toast, pr-8
      // and the close's right-2 put both at the inline start, where the
      // words begin, and space-x-4's left margin put the space outside the
      // action, which then touched the words.
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-control border bg-background p-6 pe-8 text-foreground shadow-floating transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        // The icon sits in the start padding, 16 from the words, so a toast's
        // own layout is the same with a tone and without.
        Icon && "ps-14",
        className,
      )}
      data-tone={tone}
      {...props}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          className={cn(
            "absolute start-6 top-1/2 h-4 w-4 -translate-y-1/2",
            ink,
          )}
        />
      )}
      {children}
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-control border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

type ToastCloseProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Close
> & {
  /**
   * The close button's accessible name: it shows only a cross. "Dismiss
   * notification" by default, as SwiftUI's and Compose's `closeLabel`; a
   * product that translates passes its own.
   */
  "aria-label"?: string;
};

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  ToastCloseProps
>(
  (
    { className, "aria-label": ariaLabel = "Dismiss notification", ...props },
    ref,
  ) => (
    <ToastPrimitive.Close
      ref={ref}
      aria-label={ariaLabel}
      // At the inline end, and on a toast the caller marks `destructive` (and
      // paints with the destructive fill, as ToastAction's hooks assume), the
      // fill's own ink and the fill, never Tailwind's red-300 to red-600 — fixed
      // colours a re-themed product never reached.
      className={cn(
        "absolute end-2 top-2 rounded-control p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-destructive-foreground/70 group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive-foreground group-[.destructive]:focus:ring-offset-destructive",
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  ),
);
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
export type { ToastProps, ToastActionElement };
