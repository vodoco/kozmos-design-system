/**
 * Icon's recipe: the box and the colour a Kozmos icon draws with, for every
 * framework that draws one. React's `Icon` and Vue's `KozmosIcon` both size
 * and colour the glyph `@kozmos-ds/icons` draws (its React entry, its Vue
 * entry) from it. Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const iconVariants = cva("", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    },
    color: {
      default: "text-current",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive-text",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
  },
});

type IconVariants = VariantProps<typeof iconVariants>;
/** The recipe's sizes and colours, as a framework's props name them. */
export type IconSize = NonNullable<IconVariants["size"]>;
export type IconColor = NonNullable<IconVariants["color"]>;

/**
 * An icon is decoration, hidden from assistive technology, unless the app
 * names it: `aria-label` or `aria-labelledby` makes it an image that is read.
 */
export function iconAriaHidden(
  label: unknown,
  labelledBy: unknown,
): "true" | undefined {
  return label || labelledBy ? undefined : "true";
}
