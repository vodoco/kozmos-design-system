import React from "react";
import { type VariantProps } from "class-variance-authority";
import { Box, type BoxProps } from "../Box/Box";
import { cn } from "../../utils";
import { stackVariants } from "../../recipes/stack";

export interface StackProps
  extends BoxProps, VariantProps<typeof stackVariants> {}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, align, justify, wrap, gap, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn(
          stackVariants({ direction, align, justify, wrap, gap, className }),
        )}
        {...props}
      />
    );
  },
);
Stack.displayName = "Stack";

export { Stack };
