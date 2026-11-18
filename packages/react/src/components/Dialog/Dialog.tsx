import { createThemePortal } from "../../theme/ThemePortal";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@kozmos-ds/icons";

import { cn } from "../../utils";
import {
  OverlayContainerContext,
  useOverlayContainer,
} from "../../theme/overlay-container";
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
      "kozmos-modal-overlay fixed inset-0 z-50 bg-overlay-scrim data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/** How large a dialog is. */
export type DialogContentSize = "default" | "full";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Localized name of the persistent dismiss control. */
    closeLabel?: string;
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof DialogPrimitive.Portal
    >["container"];
    /**
     * `default`: at most 512 wide and as tall as its content, 16 from the
     * window's edges. `full`: the window less 16 on each side (decision 202,
     * GAP-259), for media shown large; the first child (the header) keeps its
     * height, the second takes the rest, and a footer after it keeps its own.
     */
    size?: DialogContentSize;
  }
>(
  (
    {
      className,
      children,
      portalContainer,
      closeLabel = "Close",
      size = "default",
      ...props
    },
    ref,
  ) => {
    // A Backdrop rendered inside is drawn in this content, not beside it,
    // where the modal would make it inert (OverlayContainerContext).
    const [contentRef, container] = useOverlayContainer(ref);
    return (
      <DialogPortal container={portalContainer}>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={contentRef}
          data-size={size}
          className={cn(
            "kozmos-dialog-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 gap-6 border bg-background p-6 shadow-overlay transition-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-container",
            size === "full"
              ? "max-w-none h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]"
              : "max-w-lg",
            className,
          )}
          {...props}
        >
          <OverlayContainerContext.Provider value={container}>
            {children}
          </OverlayContainerContext.Provider>
          {/* The close centres on the title's first line, 44 tall, at any
            density (decision 82): 24 from the top at 44, 30 at 32. */}
          <WithoutGenericClick>
            <DialogPrimitive.Close asChild>
              <IconButton
                type="button"
                variant="outline"
                className="kozmos-dialog-close absolute end-6 top-[calc(1.5rem_+_(2.75rem_-_var(--density-icon-control-size-md,2.75rem))_/_2)]"
                aria-label={closeLabel}
              >
                <X aria-hidden="true" />
              </IconButton>
            </DialogPrimitive.Close>
          </WithoutGenericClick>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * An illustration or a photo above the title (decision 195, GAP-214), 16
   * over it. Decorative, hidden from assistive technology, unless
   * `mediaLabel` names it.
   */
  media?: React.ReactNode;
  /** The media's name, read as one image. Without it the media is decorative. */
  mediaLabel?: string;
  /**
   * The media reaches the dialog's edges and top corners, past its padding,
   * clipped by the dialog's corner; the header must then be the dialog's
   * first child. The close button keeps its place in the corner, over the
   * media. Defaults to false: inside the padding.
   */
  mediaBleed?: boolean;
}

const DialogHeader = ({
  className,
  media,
  mediaLabel,
  mediaBleed = false,
  children,
  ...props
}: DialogHeaderProps) => (
  <div
    className={cn("flex min-w-0 flex-col gap-2 text-start", className)}
    {...props}
  >
    {media !== undefined && media !== null && media !== false ? (
      <div
        className="kozmos-dialog-media"
        data-bleed={mediaBleed ? "" : undefined}
        {...(mediaLabel
          ? { role: "img", "aria-label": mediaLabel }
          : { "aria-hidden": true })}
      >
        {media}
      </div>
    ) : null}
    {children}
  </div>
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
      // Room for the close, the icon button's size, and 12 (decision 82).
      // GAP-275: 8 over the words, so the first line centres on the close,
      // and none under them, so a description sits 8 under a one-line title;
      // 36 tall at least, so the description starts where the close's 44
      // target ends (24 + 44 = 68 = 24 + 36 + the header's 8).
      "min-h-9 min-w-0 pt-2 pe-[calc(var(--density-icon-control-size-md,2.75rem)_+_0.75rem)] text-xl font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]",
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
