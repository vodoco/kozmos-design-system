import React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../utils";

export interface AvatarProps extends React.ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Root
> {
  /**
   * `default`, 40, or `sm`, 24 (decision 221), its initials at 12/16: for a
   * row that keeps its own height, such as an option's media (decision
   * 215).
   */
  size?: "default" | "sm";
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = "default", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    data-size={size === "sm" ? "sm" : undefined}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-pill",
      size === "sm" ? "h-6 w-6 text-xs" : "h-10 w-10",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-pill bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
