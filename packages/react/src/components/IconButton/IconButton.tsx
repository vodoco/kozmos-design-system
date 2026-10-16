import React from "react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button/Button";

export type IconButtonProps = ButtonProps;

function iconButtonSizeClass(size: ButtonProps["size"]) {
  // The density's sizes (decision 82): 44, 44 and 48 in touch; 28, 32 and 40
  // in compact.
  if (size === "sm") return "h-icon-control-sm w-icon-control-sm px-0";
  // The large size is the prototype's 48: Filters and the AI search beside a 44 field.
  if (size === "lg")
    return "h-icon-control-lg w-icon-control-lg px-0 [&>svg]:h-5 [&>svg]:w-5";
  return "h-icon-control w-icon-control px-0";
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "icon", variant = "ghost", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        className={cn(iconButtonSizeClass(size), className)}
        {...props}
      />
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
