import React from "react";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils";
import { textVariants, textWeight } from "../../recipes/text";
import type { BoxProps } from "../Box/Box";

// The recipe is shared with Vue's KozmosText (recipes/text.ts).

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
          textVariants({
            size,
            // The display size carries its own weight, bold, unless one is
            // given: no weight class, so the size's own decides.
            weight: textWeight(size, weight),
            align,
            color,
            truncate,
            className,
          }),
        )}
        ref={ref as React.Ref<HTMLElement>}
      />
    );
  },
);

Text.displayName = "Text";
export { Text };
