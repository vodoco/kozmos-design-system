import React from "react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button/Button";
import { ChevronDown } from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../Menu";

// Simplified version relying on basic composition if dropdown-menu is not strictly available in this context
// For this system, we'll simulate the structure or use a simple HTML select if needed,
// strictly we should use the Radix primitive we have.
// However, to avoid complex dependency assumptions in this single file generation, I will implement a visual split button generic.

interface SplitButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onMainClick?: React.MouseEventHandler<HTMLButtonElement>;
  menuItems?: { label: string; onClick: () => void }[];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  children?: React.ReactNode;
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      className,
      children,
      onMainClick,
      menuItems = [],
      variant = "default",
      size = "default",
      disabled,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    return (
      <div
        ref={ref}
        className={cn("inline-flex rounded-control shadow-raised", className)}
        {...props}
      >
        <Button
          className="rounded-r-none border-r border-primary-foreground/20 focus:z-10"
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
        <Menu>
          <MenuTrigger asChild>
            <Button
              className="rounded-l-none px-2 focus:z-10"
              variant={variant}
              size={size}
              disabled={disabled}
              aria-label="More options"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </MenuTrigger>
          <MenuContent align="end">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  trackEvent("SplitButton", "split_button_menu_item_clicked", {
                    label: item.label,
                  });
                  item.onClick();
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
    );
  },
);
SplitButton.displayName = "SplitButton";

export { SplitButton };
