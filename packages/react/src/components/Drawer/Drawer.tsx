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

export type DrawerSide = "left" | "right" | "top" | "bottom";

export type DrawerPlacement = "fixed" | "inline";

export type DrawerProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Root
> & {
  /**
   * Where the drawer is drawn (GAP-198), as Backdrop's `placement`.
   * `"fixed"`, the default, slides over the window from its edge, in the
   * theme's portal, and is modal unless `modal={false}`. `"inline"` draws it
   * in place, `absolute` against the nearest positioned box, so a panel can
   * sit in the region under a fixed header instead of covering it. A left or
   * right one floats there (decision 139): 16 from its side and the top, 420
   * wide at most, as tall as its content up to 48 short of the region, with
   * the container's corners all round. It is not modal unless `modal` says
   * so, and then it is a panel beside the page, not a dialog: it takes focus
   * only when its DrawerTrigger opens it, Tab and Shift+Tab leave it, a press
   * or focus outside leaves it open, and Escape closes it only from inside.
   */
  placement?: DrawerPlacement;
};

interface DrawerState {
  placement: DrawerPlacement;
  modal: boolean;
  /** Its DrawerTrigger opened it: focus follows into an inline panel. */
  fromTrigger: { current: boolean };
}

const DrawerContext = React.createContext<DrawerState>({
  placement: "fixed",
  modal: true,
  fromTrigger: { current: false },
});

export type DrawerContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  portalContainer?: React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Portal
  >["container"];
  showClose?: boolean;
  side?: DrawerSide;
};

const drawerSideClasses: Record<DrawerSide, string> = {
  bottom:
    "inset-x-0 bottom-0 max-h-[80vh] rounded-t-container border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  left: "inset-y-0 left-0 h-full w-[min(100vw,24rem)] rounded-r-container border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "inset-y-0 right-0 h-full w-[min(100vw,24rem)] rounded-l-container border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  top: "inset-x-0 top-0 max-h-[80vh] rounded-b-container border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
};

// Inline, a side drawer floats in its region, as Pointr Cloud's Get started
// panel (decision 139): 16 from its side and the top; 420 wide, or the region
// less 16 each side; as tall as its content up to 48 short of the region,
// which leaves 32 under it; the container's corners all round, and the border
// on its inner side, as the fixed one's. A top or bottom one, BottomSheet's,
// stays at its edge across the region.
const drawerInlineSideClasses: Partial<Record<DrawerSide, string>> = {
  left: "left-4 top-4 max-h-[calc(100%-3rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "right-4 top-4 max-h-[calc(100%-3rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
};

/** Focuses `element` if it is still there to take it; says whether it did. */
function focusIfFocusable(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  element.focus({ preventScroll: true });
  return element.ownerDocument.activeElement === element;
}

const Drawer = ({
  onOpenChange,
  placement = "fixed",
  modal = placement === "fixed",
  ...props
}: DrawerProps) => {
  const { trackEvent } = useKozmosAnalytics();
  const [fromTrigger] = React.useState(() => ({ current: false }));

  return (
    <DrawerContext.Provider value={{ placement, modal, fromTrigger }}>
      <DialogPrimitive.Root
        modal={modal}
        onOpenChange={(open) => {
          trackEvent("Drawer", open ? "drawer_opened" : "drawer_closed");
          onOpenChange?.(open);
        }}
        {...props}
      />
    </DrawerContext.Provider>
  );
};
Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ onClick, ...props }, ref) => {
  const { fromTrigger } = React.useContext(DrawerContext);
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      onClick={(event) => {
        fromTrigger.current =
          event.currentTarget.getAttribute("data-state") === "closed";
        onClick?.(event);
      }}
      {...props}
    />
  );
});
DrawerTrigger.displayName = DialogPrimitive.Trigger.displayName;
const DrawerClose = DialogPrimitive.Close;
const DrawerPortal = createThemePortal(DialogPrimitive.Portal);

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-overlay-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      children,
      className,
      showClose = true,
      side = "right",
      portalContainer,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    // A Backdrop rendered inside is drawn in this content, not beside it,
    // where the modal would make it inert (OverlayContainerContext).
    const [contentRef, container] = useOverlayContainer(ref);
    const drawer = React.useContext(DrawerContext);
    // Inline, drawn in place over the nearest positioned box, its scrim (when
    // modal) with it.
    const inline = drawer.placement === "inline";
    // Inline and not modal, a panel beside the page rather than a dialog.
    const panel = inline && !drawer.modal;
    // What had focus as it opened, to give it back to if closing loses it.
    const invoker = React.useRef<Element | null>(null);
    const overlay = (
      <DrawerOverlay className={inline ? "absolute" : undefined} />
    );
    const body = (
      <>
        <OverlayContainerContext.Provider value={container}>
          {children}
        </OverlayContainerContext.Provider>
        {showClose ? (
          // The icon button's size, its centre where touch's 44 puts it, on
          // the title (decision 82): 16 from the top at 44, 22 at 32.
          <DialogPrimitive.Close className="absolute right-4 top-[calc(1rem_+_(2.75rem_-_var(--density-icon-control-size-md,2.75rem))_/_2)] inline-flex h-icon-control w-icon-control items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">Close drawer</span>
          </DialogPrimitive.Close>
        ) : null}
      </>
    );
    const content = (
      <DialogPrimitive.Content
        ref={contentRef}
        // A panel is a labelled landmark beside the page; a caller's role
        // wins. (A role of undefined would take Radix's "dialog" away.)
        {...(panel && { role: "complementary" })}
        className={cn(
          inline ? "absolute" : "fixed",
          "z-50 flex flex-col gap-4 overflow-auto bg-background p-6 text-foreground shadow-overlay outline-none transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=open]:duration-300",
          "border-border",
          (inline && drawerInlineSideClasses[side]) || drawerSideClasses[side],
          className,
        )}
        data-side={side}
        onOpenAutoFocus={(event) => {
          invoker.current =
            (event.currentTarget as Node | null)?.ownerDocument
              ?.activeElement ?? null;
          onOpenAutoFocus?.(event);
          // A panel the product opens takes no focus; one its trigger opens
          // does. To move focus in yourself, focus it in onOpenAutoFocus.
          if (panel && !drawer.fromTrigger.current) event.preventDefault();
          drawer.fromTrigger.current = false;
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!panel || event.defaultPrevented) return;
          const doc = (event.currentTarget as Node | null)?.ownerDocument;
          if (!doc) return;
          // Focus the user has put elsewhere on the page stays there.
          if (doc.activeElement && doc.activeElement !== doc.body) {
            event.preventDefault();
            return;
          }
          // After Radix's own, which gives a trigger its focus: with none,
          // what had focus as it opened.
          queueMicrotask(() => {
            if (doc.activeElement === doc.body)
              focusIfFocusable(invoker.current);
          });
        }}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          // Escape from the page is the page's.
          if (
            panel &&
            !container?.contains(container.ownerDocument.activeElement)
          )
            event.preventDefault();
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          // A press or focus outside a panel is the page being used.
          if (panel) event.preventDefault();
        }}
        {...props}
      >
        {panel ? (
          // Radix's focus scope loops Tab inside its content, modal or not.
          // Tab and Shift+Tab leave a panel: the key stops here, after
          // whatever inside handles it and before the scope's handler on the
          // content, and the browser moves focus on.
          <div
            className="contents"
            onKeyDown={(event) => {
              if (event.key === "Tab") event.stopPropagation();
            }}
          >
            {body}
          </div>
        ) : (
          body
        )}
      </DialogPrimitive.Content>
    );
    return inline ? (
      <>
        {overlay}
        {content}
      </>
    ) : (
      <DrawerPortal container={portalContainer}>
        {overlay}
        {content}
      </DrawerPortal>
    );
  },
);
DrawerContent.displayName = DialogPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Room for the close, the icon button's size (decision 82).
      "flex flex-col gap-2 pr-[calc(var(--density-icon-control-size-md,2.75rem)_+_0.25rem)] text-left",
      className,
    )}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-6 text-foreground", className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-5 text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
