import { createThemePortal } from "../../theme/ThemePortal";
import * as React from "react";
import { useComposedRefs } from "@radix-ui/react-compose-refs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DismissableLayer } from "@radix-ui/react-dismissable-layer";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { Presence } from "@radix-ui/react-presence";
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
   * right one floats there (decisions 139 and 148): 16 from its side and the
   * top, 420 wide at most, as tall as its content up to 32 short of the
   * region, which leaves 16 under it, with its border and the container's
   * corners all round. It is not modal unless `modal` says so, and then it is
   * a panel beside the page, not a dialog: it takes focus only when its
   * DrawerTrigger opens it, Tab and Shift+Tab leave it, a press or focus
   * outside leaves it open (close it in `onInteractOutside`, which a press on
   * its trigger doesn't reach), and Escape closes it only from inside: Escape
   * in the page is the page's. Closing gives focus back only if it was inside.
   */
  placement?: DrawerPlacement;
};

interface DrawerState {
  placement: DrawerPlacement;
  modal: boolean;
  /** Inline and not modal: a panel beside the page, not a dialog. */
  panel: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** A panel's ids: Radix's own are only for its Content, which a panel isn't. */
  panelId: string;
  /** The trigger, and whether a press on it is what is opening the panel. */
  trigger: { element: HTMLElement | null; opening: boolean };
}

const DrawerContext = React.createContext<DrawerState>({
  placement: "fixed",
  modal: true,
  panel: false,
  open: false,
  setOpen: () => {},
  panelId: "",
  trigger: { element: null, opening: false },
});

export type DrawerContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  /** The close's accessible name, "Close drawer" by default, as Dialog's. */
  closeLabel?: string;
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
// panel (decisions 139 and 148): 16 from every edge it reaches; 420 wide, or
// the region less 16 each side; as tall as its content up to the region less
// 16 top and bottom; the container's corners and its border all round. A top
// or bottom one, BottomSheet's, stays at its edge across the region.
const drawerInlineSideClasses: Partial<Record<DrawerSide, string>> = {
  left: "left-4 top-4 max-h-[calc(100%-2rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "right-4 top-4 max-h-[calc(100%-2rem)] w-[min(26.25rem,calc(100%-2rem))] rounded-container border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
};

type OutsideEvent = Parameters<
  NonNullable<DrawerContentProps["onInteractOutside"]>
>[0];

/**
 * A panel's name: Radix's warning for a title lives in its Content, which a
 * panel isn't. Warns once a panel, in development.
 */
function useWarnUnnamed(
  panel: HTMLElement | null,
  titleId: string,
  labelled: boolean,
) {
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === "production" ||
      !panel ||
      labelled ||
      panel.ownerDocument.getElementById(titleId)
    )
      return;
    console.warn(
      "Drawer: an inline panel has no DrawerTitle, so nothing names it to a screen reader. Render a DrawerTitle in it, or pass aria-label.",
    );
  }, [panel, titleId, labelled]);
}

/** Focuses `element` if it is still there to take it; says whether it did. */
function focusIfFocusable(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  element.focus({ preventScroll: true });
  return element.ownerDocument.activeElement === element;
}

const Drawer = ({
  defaultOpen = false,
  onOpenChange,
  open: openProp,
  placement = "fixed",
  modal = placement === "fixed",
  ...props
}: DrawerProps) => {
  const { trackEvent } = useKozmosAnalytics();
  const [trigger] = React.useState<DrawerState["trigger"]>(() => ({
    element: null,
    opening: false,
  }));
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    trackEvent("Drawer", next ? "drawer_opened" : "drawer_closed");
    onOpenChange?.(next);
  };
  const panelId = React.useId();
  const panel = placement === "inline" && !modal;

  return (
    <DrawerContext.Provider
      value={{ placement, modal, panel, open, setOpen, panelId, trigger }}
    >
      <DialogPrimitive.Root
        modal={modal}
        open={open}
        onOpenChange={setOpen}
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
  const { panel, panelId, trigger } = React.useContext(DrawerContext);
  const setElement = React.useCallback(
    (node: HTMLButtonElement | null) => {
      trigger.element = node;
    },
    [trigger],
  );
  const triggerRef = useComposedRefs(ref, setElement);
  return (
    <DialogPrimitive.Trigger
      ref={triggerRef}
      // Radix names the dialog's Content here; a panel is neither.
      {...(panel && {
        "aria-controls": `${panelId}-content`,
        "aria-haspopup": undefined,
      })}
      onClick={(event) => {
        trigger.opening =
          event.currentTarget.getAttribute("data-state") === "closed";
        onClick?.(event);
        // The opening is done by now, or it isn't coming: a press the product
        // refused, or one during the exit, says nothing of the next opening.
        if (panel)
          setTimeout(() => {
            trigger.opening = false;
          });
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
      closeLabel = "Close drawer",
      forceMount,
      showClose = true,
      side = "right",
      portalContainer,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      ...props
    },
    ref,
  ) => {
    // A Backdrop rendered inside is drawn in this content, not beside it,
    // where the modal would make it inert (OverlayContainerContext). A panel
    // is no modal: its Backdrop goes to the portal, and reaches over the header.
    const [contentRef, container] = useOverlayContainer(ref);
    const drawer = React.useContext(DrawerContext);
    // Inline, drawn in place over the nearest positioned box, its scrim (when
    // modal) with it.
    const inline = drawer.placement === "inline";
    // Whether focus is in the panel: closing gives back only focus it took.
    const focusInside = React.useRef(false);
    useWarnUnnamed(
      drawer.panel ? container : null,
      `${drawer.panelId}-title`,
      !!(props["aria-label"] || props["aria-labelledby"]),
    );
    const body = (
      <>
        {drawer.panel ? (
          children
        ) : (
          <OverlayContainerContext.Provider value={container}>
            {children}
          </OverlayContainerContext.Provider>
        )}
        {showClose ? (
          // The icon button's size, its centre where touch's 44 puts it, on
          // the title (decision 82): 16 from the top at 44, 22 at 32.
          <DialogPrimitive.Close className="absolute end-4 top-[calc(1rem_+_(2.75rem_-_var(--density-icon-control-size-md,2.75rem))_/_2)] inline-flex h-icon-control w-icon-control items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-hover-fill hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        ) : null}
      </>
    );
    const shape = cn(
      inline ? "absolute" : "fixed",
      "z-50 flex flex-col gap-4 overflow-auto bg-background p-6 text-foreground shadow-overlay outline-none transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=open]:duration-300",
      "border-border",
      (inline && drawerInlineSideClasses[side]) || drawerSideClasses[side],
      // At its edge, inline, the region is a limit too: past it is the header.
      inline &&
        (side === "top" || side === "bottom") &&
        "max-h-[min(100%,80vh)]",
      className,
    );
    // A panel beside the page, not a dialog: Dialog.Content's parts, with what
    // makes it a dialog left out. Its focus guards would be two invisible Tab
    // stops at the ends of the page, its loop would hold Tab inside, and its
    // layer would prevent every Escape it did not close on, in the capture
    // phase, before the page sees it. With no `onDismiss` the layer closes
    // nothing and prevents nothing.
    if (drawer.panel) {
      // A press on the trigger isn't outside: it toggles the panel on its
      // `click`, so a panel closed at `pointerdown` would open again. WebKit
      // focuses no button for a mouse, and the focusable box round it takes it.
      const skippingTrigger =
        <E extends OutsideEvent>(handler?: (event: E) => void) =>
        (event: E) => {
          const trigger = drawer.trigger.element;
          const target = event.target as Node;
          if (
            trigger?.contains(target) ||
            (trigger &&
              event.detail.originalEvent.type === "focusin" &&
              target.contains(trigger))
          )
            return;
          handler?.(event);
        };
      return (
        <Presence present={forceMount || drawer.open}>
          <FocusScope
            asChild
            onMountAutoFocus={(event) => {
              onOpenAutoFocus?.(event);
              // A panel the product opens takes no focus; one its trigger
              // opens does. To move focus in yourself, focus it in
              // onOpenAutoFocus.
              if (!drawer.trigger.opening) event.preventDefault();
              drawer.trigger.opening = false;
            }}
            onUnmountAutoFocus={(event) => {
              onCloseAutoFocus?.(event);
              const wasInside = focusInside.current;
              focusInside.current = false;
              if (event.defaultPrevented) return;
              const doc = (event.currentTarget as Node).ownerDocument;
              // Focus that was never in the panel isn't the panel's to give
              // back, and focus put elsewhere on the page stays there. Focus
              // that left with it goes to the trigger; with no trigger, to
              // what had it as the panel opened, as the scope does by default.
              if (
                !wasInside ||
                (doc?.activeElement && doc.activeElement !== doc.body) ||
                focusIfFocusable(drawer.trigger.element)
              )
                event.preventDefault();
            }}
          >
            <DismissableLayer
              ref={contentRef}
              id={`${drawer.panelId}-content`}
              // A labelled landmark beside the page; a caller's role wins.
              role="complementary"
              aria-labelledby={`${drawer.panelId}-title`}
              aria-describedby={`${drawer.panelId}-description`}
              className={shape}
              data-side={side}
              data-state={drawer.open ? "open" : "closed"}
              {...props}
              // In the bubble phase, from inside, not the layer's Escape: that
              // reaches only the highest layer, so of two panels only the
              // newer would hear it, and Escape in the page is the page's. A
              // layer inside this panel has prevented its own by now.
              onKeyDown={(event) => {
                props.onKeyDown?.(event);
                if (
                  event.key !== "Escape" ||
                  !drawer.open ||
                  event.nativeEvent.defaultPrevented
                )
                  return;
                onEscapeKeyDown?.(event.nativeEvent);
                if (event.nativeEvent.defaultPrevented) return;
                event.preventDefault();
                drawer.setOpen(false);
              }}
              onFocusCapture={(event) => {
                props.onFocusCapture?.(event);
                focusInside.current = true;
              }}
              onBlurCapture={(event) => {
                props.onBlurCapture?.(event);
                focusInside.current = false;
              }}
              onPointerDownOutside={skippingTrigger(props.onPointerDownOutside)}
              onFocusOutside={skippingTrigger(props.onFocusOutside)}
              onInteractOutside={skippingTrigger((event: OutsideEvent) => {
                props.onInteractOutside?.(event);
                // Closed by this press with no exit to run, it goes before the
                // press can move focus: this isn't focus to give back.
                if (!event.defaultPrevented) focusInside.current = false;
              })}
            >
              {body}
            </DismissableLayer>
          </FocusScope>
        </Presence>
      );
    }
    const overlay = (
      <DrawerOverlay className={inline ? "absolute" : undefined} />
    );
    const content = (
      <DialogPrimitive.Content
        ref={contentRef}
        className={shape}
        data-side={side}
        forceMount={forceMount}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={onEscapeKeyDown}
        {...props}
      >
        {body}
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
      "flex flex-col gap-2 pe-[calc(var(--density-icon-control-size-md,2.75rem)_+_0.25rem)] text-start",
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
>(({ className, ...props }, ref) => {
  const { panel, panelId } = React.useContext(DrawerContext);
  return (
    <DialogPrimitive.Title
      ref={ref}
      {...(panel && { id: `${panelId}-title` })}
      className={cn(
        "text-lg font-semibold leading-6 text-foreground",
        className,
      )}
      {...props}
    />
  );
});
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { panel, panelId } = React.useContext(DrawerContext);
  return (
    <DialogPrimitive.Description
      ref={ref}
      {...(panel && { id: `${panelId}-description` })}
      className={cn("text-sm leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
});
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
