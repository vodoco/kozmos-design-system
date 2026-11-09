import { createThemePortal } from "../../theme/ThemePortal";
import React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "../../utils";
import { Check, ChevronRight, Circle } from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import { inertOutside } from "../../utils/modal-inert";
import {
  externalItemChildren,
  menuContentClass,
  menuIndicatorClass,
  menuIndicatorItemClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  menuShortcutClass,
  menuSubIconClass,
  menuSubTriggerClass,
  type MenuItemExternalProps,
} from "../Menu/menu-parts";

// A context menu (GAP-155): Menu's panel and rows, opened where it is asked
// for: a right click at the pointer, a long press on touch, and the
// keyboard's context-menu key or Shift+F10 at the focused item.

// Whether the menu is modal, as Radix's `modal` says (true unless set false),
// as Menu's is.
const ContextMenuModalContext = React.createContext(false);

const ContextMenu = ({
  modal = true,
  ...props
}: ContextMenuPrimitive.ContextMenuProps) => (
  <ContextMenuModalContext.Provider value={modal}>
    <ContextMenuPrimitive.Root modal={modal} {...props} />
  </ContextMenuModalContext.Provider>
);
ContextMenu.displayName = ContextMenuPrimitive.Root.displayName;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = createThemePortal(ContextMenuPrimitive.Portal);
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/**
 * The keyboard's context-menu key and Shift+F10 open the menu at the item
 * that has focus, at its inline start and block end, in every browser and on
 * every system: a browser that fires `contextmenu` for them places it
 * somewhere of its own, and macOS's fire none.
 */
function opensFromKeyboard(event: React.KeyboardEvent) {
  return (
    event.key === "ContextMenu" ||
    (event.key === "F10" &&
      event.shiftKey &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey)
  );
}

const ContextMenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>
>(({ onKeyDown, disabled, ...props }, ref) => (
  <ContextMenuPrimitive.Trigger
    ref={ref}
    disabled={disabled}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || !opensFromKeyboard(event))
        return;
      event.preventDefault();
      const item = event.target as HTMLElement;
      const box = item.getBoundingClientRect();
      // The reading direction the item is in: its nearest `dir`, else its
      // computed direction.
      const dir = item.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
      const rtl = dir
        ? dir === "rtl"
        : getComputedStyle(item).direction === "rtl";
      // Radix opens the menu at a contextmenu event's point.
      item.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: rtl ? box.right : box.left,
          clientY: box.bottom,
        }),
      );
    }}
    {...props}
  />
));
ContextMenuTrigger.displayName = ContextMenuPrimitive.Trigger.displayName;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(menuSubTriggerClass, inset && "ps-8", className)}
    {...props}
  >
    {children}
    <ChevronRight className={menuSubIconClass} />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(menuContentClass, className)}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> & {
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof ContextMenuPrimitive.Portal
    >["container"];
  }
>(({ className, portalContainer, ...props }, ref) => {
  const modal = React.useContext(ContextMenuModalContext);
  const release = React.useRef<(() => void) | undefined>();
  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      release.current?.();
      // As Menu's (GAP-193): a modal menu hides the page with aria-hidden as
      // it opens; the page is made inert with it, so nothing hidden behind
      // it stays focusable.
      release.current =
        node && modal && !props.forceMount
          ? inertOutside(node, {
              mirrorAriaHidden: true,
              keep: "[data-radix-menu-content]",
            })
          : undefined;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref, modal, props.forceMount],
  );
  return (
    <ContextMenuPortal container={portalContainer}>
      <ContextMenuPrimitive.Content
        ref={contentRef}
        className={cn(menuContentClass, className)}
        {...props}
      />
    </ContextMenuPortal>
  );
});
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> &
    MenuItemExternalProps & {
      inset?: boolean;
    }
>(
  (
    {
      className,
      inset,
      onSelect,
      external,
      externalLabel,
      asChild,
      children,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    return (
      <ContextMenuPrimitive.Item
        ref={ref}
        className={cn(menuItemClass, inset && "ps-8", className)}
        onSelect={(e) => {
          trackEvent("ContextMenu", "menu_item_selected");
          onSelect?.(e);
        }}
        asChild={asChild}
        {...props}
      >
        {externalItemChildren({ external, externalLabel, asChild, children })}
      </ContextMenuPrimitive.Item>
    );
  },
);
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(menuIndicatorItemClass, className)}
    checked={checked}
    {...props}
  >
    <span className={menuIndicatorClass}>
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(menuIndicatorItemClass, className)}
    {...props}
  >
    <span className={menuIndicatorClass}>
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(menuLabelClass, inset && "ps-8", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn(menuSeparatorClass, className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn(menuShortcutClass, className)} {...props} />
);
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
