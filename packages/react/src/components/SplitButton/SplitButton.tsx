import React from "react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button/Button";
import { ChevronDown } from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../Menu";
import { WithoutGenericClick } from "../../utils/generic-click";
import {
  SPLIT_BUTTON_CHEVRON_CLASS,
  SPLIT_BUTTON_CLASS,
  SPLIT_BUTTON_ITEM_ICON_CLASS,
  SPLIT_BUTTON_ITEM_WITH_ICON_CLASS,
  SPLIT_BUTTON_MAIN_CLASS,
  SPLIT_BUTTON_MENU_CLASS,
  splitButtonSeamClass,
} from "../../recipes/menu";

/** An action in a SplitButton's menu (GAP-168). */
export interface SplitButtonMenuAction {
  type?: "item";
  /** What the item says, and its name. */
  label: React.ReactNode;
  /** Runs when the item is chosen, by pointer, Enter or Space. */
  onClick?: () => void;
  /** An icon before the words, at 16, hidden from the item's name. */
  icon?: React.ReactNode;
  /** Said disabled, drawn at half and skipped by the arrow keys. */
  disabled?: boolean;
  /**
   * The words type-ahead matches when `label` is not a string: Menu's
   * `textValue`.
   */
  textValue?: string;
}

/** A line between groups of items in a SplitButton's menu (GAP-168). */
export interface SplitButtonMenuSeparator {
  type: "separator";
}

export type SplitButtonMenuItem =
  | SplitButtonMenuAction
  | SplitButtonMenuSeparator;

export interface SplitButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onMainClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The menu's items, in order: actions, each with words and optionally an
   * icon or `disabled`, and `{ type: "separator" }` lines between groups
   * (GAP-168). `{ label, onClick }` items are as they were.
   */
  menuItems?: SplitButtonMenuItem[];
  /**
   * Custom content, drawn after `menuItems`: Menu's own parts, such as
   * `MenuLabel`, `MenuItem`, `MenuCheckboxItem` and `MenuSeparator`.
   */
  menuContent?: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  children?: React.ReactNode;
  /**
   * The menu half's accessible name: it shows only a chevron. "More options"
   * by default; a product that translates passes its own.
   */
  menuLabel?: string;
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      className,
      children,
      onMainClick,
      menuItems = [],
      menuContent,
      variant = "default",
      size = "default",
      disabled,
      menuLabel = "More options",
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    return (
      <div ref={ref} className={cn(SPLIT_BUTTON_CLASS, className)} {...props}>
        <WithoutGenericClick>
          {/* The seam tints the inline-end side alone (site GAP-73, GAP-200:
              recipes/menu.ts). */}
          <Button
            className={cn(
              SPLIT_BUTTON_MAIN_CLASS,
              splitButtonSeamClass(variant),
            )}
            onClick={(e) => {
              trackEvent("SplitButton", "split_button_main_clicked");
              onMainClick?.(e);
            }}
            variant={variant}
            size={size}
            disabled={disabled}
          >
            {children}
          </Button>
        </WithoutGenericClick>
        <Menu>
          <MenuTrigger asChild>
            <Button
              className={SPLIT_BUTTON_MENU_CLASS}
              variant={variant}
              size={size}
              disabled={disabled}
              aria-label={menuLabel}
            >
              <ChevronDown className={SPLIT_BUTTON_CHEVRON_CLASS} />
            </Button>
          </MenuTrigger>
          <MenuContent align="end">
            {menuItems.map((item, index) =>
              item.type === "separator" ? (
                <MenuSeparator key={index} />
              ) : (
                <MenuItem
                  key={index}
                  disabled={item.disabled}
                  textValue={item.textValue}
                  className={
                    item.icon ? SPLIT_BUTTON_ITEM_WITH_ICON_CLASS : undefined
                  }
                  // onSelect, not onClick: Radix never selects a disabled
                  // item, where a click still reached onClick.
                  onSelect={() => {
                    trackEvent(
                      "SplitButton",
                      "split_button_menu_item_clicked",
                      {
                        label:
                          typeof item.label === "string"
                            ? item.label
                            : (item.textValue ?? ""),
                      },
                    );
                    item.onClick?.();
                  }}
                >
                  {item.icon && (
                    <span
                      aria-hidden="true"
                      className={SPLIT_BUTTON_ITEM_ICON_CLASS}
                    >
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </MenuItem>
              ),
            )}
            {menuContent}
          </MenuContent>
        </Menu>
      </div>
    );
  },
);
SplitButton.displayName = "SplitButton";

export { SplitButton };
