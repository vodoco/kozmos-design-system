/**
 * Text's recipe: the classes a Kozmos run of text draws with, for every
 * framework that draws one. React's `Text` and `Heading` and Vue's
 * `KozmosText` and `KozmosHeading` all build their element from it, so the
 * type scale cannot drift between them. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const textVariants = cva("kozmos-reset kozmos-text", {
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
      /**
       * The one display size (decision 203, GAP-272): 48 on 54 lines, bold
       * unless a weight is given, from the display type tokens, for a
       * marketing-style headline such as a sign-in hero.
       */
      display: "kozmos-text-display",
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

type TextVariants = VariantProps<typeof textVariants>;
/** The recipe's sizes, weights, alignments and colours, as a framework's props name them. */
export type TextSize = NonNullable<TextVariants["size"]>;
export type TextWeight = NonNullable<TextVariants["weight"]>;
export type TextAlign = NonNullable<TextVariants["align"]>;
export type TextColor = NonNullable<TextVariants["color"]>;

/** The tags a Text may draw as; `p` by default. */
export type TextTag =
  | "span"
  | "p"
  | "div"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

/**
 * The weight a Text draws with: the display size carries its own weight,
 * bold, unless one is given, so it gets no weight class and the size's own
 * decides.
 */
export function textWeight(
  size: TextVariants["size"],
  weight: TextVariants["weight"],
): TextVariants["weight"] {
  return size === "display" && weight == null ? null : weight;
}
