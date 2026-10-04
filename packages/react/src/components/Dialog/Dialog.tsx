import { createThemePortal } from "../../theme/ThemePortal";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@kozmos-ds/icons";

import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { IconButton } from "../IconButton";
import { WithoutGenericClick } from "../../utils/generic-click";

const Dialog: React.FC<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
> = ({ onOpenChange, ...props }) => {
  const { trackEvent } = useKozmosAnalytics();
  return (
    <DialogPrimitive.Root
      onOpenChange={(open) => {
        trackEvent("Dialog", open ? "dialog_opened" : "dialog_closed");
        onOpenChange?.(open);
      }}
      {...props}
    />
  );
};
Dialog.displayName = "Dialog";

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = createThemePortal(DialogPrimitive.Portal);

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-overlay-scrim  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Localized name of the persistent dismiss control. */
    closeLabel?: string;
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof DialogPrimitive.Portal
    >["container"];
  }
>(
  (
    { className, children, portalContainer, closeLabel = "Close", ...props },
    ref,
  ) => (
    <DialogPortal container={portalContainer}>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 gap-6 border bg-background p-6 shadow-overlay transition-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-container",
          className,
        )}
        {...props}
      >
        {children}
        <WithoutGenericClick>
          <DialogPrimitive.Close asChild>
            <IconButton
              type="button"
              variant="outline"
              className="absolute end-6 top-6"
              aria-label={closeLabel}
            >
              <X aria-hidden="true" />
            </IconButton>
          </DialogPrimitive.Close>
        </WithoutGenericClick>
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex min-w-0 flex-col gap-2 text-start", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  layout = "responsive",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Stacked keeps DOM, reading and visual order aligned; put the recommended action first. */
  layout?: "responsive" | "stacked";
}) => (
  <div
    data-layout={layout}
    className={cn(
      "kozmos-dialog-footer flex min-w-0 gap-2 [overflow-wrap:anywhere]",
      layout === "stacked"
        ? "flex-col"
        : "flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "min-h-11 min-w-0 py-2 pe-14 text-xl font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "min-w-0 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]",
      className,
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
