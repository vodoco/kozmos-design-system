/**
 * Stack's recipe: the classes a Kozmos stack draws with, for every framework
 * that draws one. React's `Stack` and Vue's `KozmosStack` both build their
 * element from it, so the two cannot drift. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    wrap: {
      nowrap: "flex-nowrap",
      wrap: "flex-wrap",
      "wrap-reverse": "flex-wrap-reverse",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    },
  },
  defaultVariants: {
    direction: "column",
    align: "stretch",
    justify: "start",
    wrap: "nowrap",
    gap: 2,
  },
});

type StackVariant<K extends keyof VariantProps<typeof stackVariants>> =
  NonNullable<VariantProps<typeof stackVariants>[K]>;

export type StackDirection = StackVariant<"direction">;
export type StackAlign = StackVariant<"align">;
export type StackJustify = StackVariant<"justify">;
export type StackWrap = StackVariant<"wrap">;
export type StackGap = StackVariant<"gap">;
