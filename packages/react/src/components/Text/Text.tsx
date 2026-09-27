import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils";
import type { BoxProps } from "../Box/Box";

const textVariants = cva("kozmos-reset kozmos-text", {
  variants: {
    size: {
      xs: "kozmos-text-xs",
      sm: "kozmos-text-sm",
      base: "kozmos-text-base",
      lg: "kozmos-text-lg",
      xl: "kozmos-text-xl",
      "2xl": "kozmos-text-2xl",
      "3xl": "kozmos-text-3xl",
      "4xl": "kozmos-text-4xl",
    },
    weight: {
      normal: "kozmos-text-normal",
      medium: "kozmos-text-medium",
      semibold: "kozmos-text-semibold",
      bold: "kozmos-text-bold",
    },
    align: {
      /** The side reading starts on: left in English, right in Arabic. */
      start: "kozmos-text-start",
      end: "kozmos-text-end",
      left: "kozmos-text-left",
      center: "kozmos-text-center",
      right: "kozmos-text-right",
      justify: "kozmos-text-justify",
    },
    color: {
      default: "kozmos-text-default",
      muted: "kozmos-text-muted",
      primary: "kozmos-text-primary",
      destructive: "kozmos-text-destructive",
      white: "kozmos-text-white",
    },
    truncate: {
      true: "kozmos-text-truncate",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    // start, not left: Story 2 reads this interface in Arabic, and text that
    // insists on the left there is text pinned to the wrong edge.
    align: "start",
    color: "default",
  },
});

// Omit 'color' from BoxProps to avoid conflict with variant 'color'
export interface TextProps
  extends Omit<BoxProps, "color">, VariantProps<typeof textVariants> {
  as?: "span" | "p" | "div" | "label" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      size,
      weight,
      align,
      color,
      truncate,
      as: Tag = "p",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = (asChild ? Slot : Tag) as React.ElementType;
    return (
      <Comp
        {...props}
        className={cn(
          textVariants({ size, weight, align, color, truncate, className }),
        )}
        ref={ref as React.Ref<HTMLElement>}
      />
    );
  },
);

Text.displayName = "Text";
export { Text };
