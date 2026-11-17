import React from "react";
import { Text, type TextProps } from "../Text/Text";

export interface HeadingProps extends Omit<
  TextProps,
  "size" | "weight" | "as"
> {
  level?: 1 | 2 | 3 | 4 | 5 | 6 | null;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /**
   * `display` draws the heading at the one display size, 48 on 54 lines
   * (decision 203, GAP-272), for a marketing-style headline such as a sign-in
   * hero; `level` stays its rank. Left out, the level's own size.
   */
  size?: "display";
}
const sizes = {
  1: "4xl",
  2: "3xl",
  3: "2xl",
  4: "xl",
  5: "lg",
  6: "base",
} as const;
const tags = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 1, as, size, children, ...props }, ref) => (
    <Text
      as={as ?? tags[level ?? 1]}
      size={size ?? (level === null ? "base" : sizes[level])}
      weight="bold"
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </Text>
  ),
);
Heading.displayName = "Heading";
export { Heading };
