import React from "react";
import { Plus } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button/Button";

export interface FloatingActionButtonProps extends ButtonProps {
  placement?: "inline" | "fixed";
}

const floatingActionButtonSizeClass = {
  sm: "h-12 w-12",
  default: "h-14 w-14",
  lg: "h-16 w-16",
  icon: "h-14 w-14",
} as const;

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(
  (
    {
      className,
      size = "icon",
      variant = "default",
      placement = "inline",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "rounded-pill p-0 shadow-lg",
          floatingActionButtonSizeClass[
            size as keyof typeof floatingActionButtonSizeClass
          ] || floatingActionButtonSizeClass.icon,
          placement === "fixed" && "fixed bottom-6 right-6 z-50",
          className,
        )}
        {...props}
      >
        {children || <Plus className="h-6 w-6" />}
      </Button>
    );
  },
);
FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton };
