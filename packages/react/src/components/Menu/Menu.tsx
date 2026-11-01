import { createThemePortal } from "../../theme/ThemePortal";
import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../utils";
import { Check, ChevronRight, Circle } from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import { inertOutside } from "../../utils/modal-inert";

// Whether the menu is modal, as Radix's `modal` says (true unless set false).
// False outside Kozmos's Menu: a MenuContent under some other root makes
// nothing inert.
const MenuModalContext = React.createContext(false);

const Menu = ({
  modal = true,
  ...props
}: DropdownMenuPrimitive.DropdownMenuProps) => (
  <MenuModalContext.Provider value={modal}>
    <DropdownMenuPrimitive.Root modal={modal} {...props} />
  </MenuModalContext.Provider>
);
Menu.displayName = DropdownMenuPrimitive.Root.displayName;
const MenuTrigger = DropdownMenuPrimitive.Trigger;
const MenuGroup = DropdownMenuPrimitive.Group;
const MenuPortal = createThemePortal(DropdownMenuPrimitive.Portal);
const MenuSub = DropdownMenuPrimitive.Sub;
const MenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const MenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "ps-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="kozmos-rtl-mirror ms-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
MenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const MenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-32 overflow-hidden rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
MenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    portalContainer?: React.ComponentPropsWithoutRef<
      typeof DropdownMenuPrimitive.Portal
    >["container"];
  }
>(({ className, sideOffset = 4, portalContainer, ...props }, ref) => {
  const modal = React.useContext(MenuModalContext);
  const release = React.useRef<(() => void) | undefined>();
  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      release.current?.();
      // A modal menu hides the page with aria-hidden's hideOthers as it
      // opens, and traps focus, but left the page focusable: every control
      // behind it was hidden yet focusable (axe aria-hidden-focus), as
      // Select's page was until it made it inert. The same here, kept in
      // reach exactly where hideOthers keeps it visible, and a submenu in a
      // portal of its own with it (GAP-193). A force-mounted menu stays
      // mounted while closed, so it makes nothing inert.
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
    <MenuPortal container={portalContainer}>
      <DropdownMenuPrimitive.Content
        ref={contentRef}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-32 overflow-hidden rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </MenuPortal>
  );
});
MenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const MenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, onSelect, ...props }, ref) => {
  const { trackEvent } = useKozmosAnalytics();
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "ps-8",
        className,
      )}
      onSelect={(e) => {
        trackEvent("Menu", "menu_item_selected");
        onSelect?.(e);
      }}
      {...props}
    />
  );
});
MenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const MenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-marker py-1.5 ps-8 pe-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
MenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-marker py-1.5 ps-8 pe-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
MenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const MenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "ps-8",
      className,
    )}
    {...props}
  />
));
MenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
MenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const MenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ms-auto text-xs tracking-widest opacity-50", className)}
      {...props}
    />
  );
};
MenuShortcut.displayName = "MenuShortcut";

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuShortcut,
  MenuGroup,
  MenuPortal,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuRadioGroup,
};
