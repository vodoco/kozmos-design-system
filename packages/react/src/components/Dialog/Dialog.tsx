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
import {
  DIALOG_CLOSE_CLASS,
  DIALOG_CONTENT_CLASS,
  DIALOG_DESCRIPTION_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_MEDIA_CLASS,
  DIALOG_OVERLAY_CLASS,
  DIALOG_TITLE_CLASS,
  dialogContentSizeClass,
  dialogFooterLayoutClass,
} from "../../recipes/dialog";

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
    className={cn(DIALOG_OVERLAY_CLASS, className)}
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
            DIALOG_CONTENT_CLASS,
            dialogContentSizeClass(size),
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
                className={DIALOG_CLOSE_CLASS}
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
  <div className={cn(DIALOG_HEADER_CLASS, className)} {...props}>
    {media !== undefined && media !== null && media !== false ? (
      <div
        className={DIALOG_MEDIA_CLASS}
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
      DIALOG_FOOTER_CLASS,
      dialogFooterLayoutClass(layout),
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
    className={cn(DIALOG_TITLE_CLASS, className)}
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
    className={cn(DIALOG_DESCRIPTION_CLASS, className)}
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
