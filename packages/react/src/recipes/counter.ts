/**
 * Counter's recipe: the pill a count is drawn in, for every framework that
 * draws one. React's `Counter` builds its `<span>` from it, and so does the
 * count inside Vue's `KozmosBadge`, so the two cannot drift. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const counterVariants = cva(
  "inline-flex items-center justify-center rounded-pill font-semibold leading-none tabular-nums",
  {
    variants: {
      tone: {
        neutral: "bg-secondary text-secondary-foreground",
        // The theme fill and the theme foreground, white in both themes:
        // foreground/1000 turned black on it in the dark (decision 59).
        brand: "bg-theme-fill text-theme-fill-foreground",
        destructive:
          "bg-destructive text-[var(--primitives-colors-foreground-1000)]",
        inverse: "bg-background text-foreground",
      },
      size: {
        sm: "h-[18px] min-w-[18px] px-[5px] text-[11px]",
        default: "h-5 min-w-5 px-1.5 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "default",
    },
  },
);

type CounterVariants = VariantProps<typeof counterVariants>;
/** Counter's tones, as the recipe draws them. */
export type CounterTone = NonNullable<CounterVariants["tone"]>;
/** Counter's sizes, as the recipe draws them. */
export type CounterSize = NonNullable<CounterVariants["size"]>;

/**
 * A count as a counter writes it: trimmed, without the parentheses a caller
 * may wrap it in (`(3)` is `3`). Each framework hands it the count when it
 * is a string or a number, and draws anything else as it is.
 */
export function formatCounterText(value: string | number): string {
  const text = String(value).trim();
  if (text.startsWith("(") && text.endsWith(")"))
    return text.slice(1, -1).trim();
  return text;
}
