import React from "react";
import { Text, type TextProps } from "../Text/Text";
import { headingSizes, headingTags } from "../../recipes/heading";

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
// The level's sizes and tags are shared with Vue's KozmosHeading
// (recipes/heading.ts).
const sizes = headingSizes;
const tags = headingTags;

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
