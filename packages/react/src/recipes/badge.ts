/**
 * Badge's recipe: the classes a Kozmos badge draws with, for every framework
 * that draws one. React's `Badge` and Vue's `KozmosBadge` both build their
 * element from it, so the two cannot drift. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-control text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // A status, not a control (decision 93): nothing changes under the
      // pointer, so no variant has a hover state.
      variant: {
        // The theme fill and the theme foreground, the same in both themes
        // (decision 59).
        default: "bg-theme-fill text-theme-fill-foreground",
        destructive:
          "bg-destructive text-[var(--primitives-colors-foreground-1000)]",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "",
        link: "text-primary underline-offset-4",
      },
      // Chip's scale (decision 93, GAP-147): 28, 32 and 36 at touch, 20, 24
      // and 28 compact, from the density's Badge tokens. An icon Badge is
      // the default height, square.
      size: {
        default: "h-badge px-4",
        sm: "h-badge-sm px-3",
        lg: "h-badge-lg px-8",
        icon: "h-badge w-badge",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;
/** The recipe's variants and sizes, as a framework's props name them. */
export type BadgeVariant = NonNullable<BadgeVariants["variant"]>;
export type BadgeSize = NonNullable<BadgeVariants["size"]>;

/** The box a Badge's icon is drawn in, hidden from assistive technology. */
export const BADGE_ICON_CLASS =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4";

/**
 * The tone of a Badge's counter: inverse on the filled variants, neutral on
 * the rest.
 */
export function badgeCounterTone(
  variant: BadgeVariant | null | undefined,
): "inverse" | "neutral" {
  return variant === "default" || variant === "destructive" || !variant
    ? "inverse"
    : "neutral";
}

/**
 * On the default Badge, itself the theme fill, the counter inverts: the
 * theme foreground with the fill's number, in both themes, as the selected
 * level's count does (Olcay, 2026-10-07). `inverse` was the surface, black
 * in the dark.
 */
export function badgeCounterClass(
  variant: BadgeVariant | null | undefined,
): string | undefined {
  return (variant ?? "default") === "default"
    ? "bg-theme-fill-foreground text-theme-fill"
    : undefined;
}

/** Whether a Badge draws its counter: opted in, with a count, and not an icon. */
export function badgeShowsCounter(
  size: BadgeSize | null | undefined,
  showCounter: boolean | undefined,
  counter: unknown,
): boolean {
  return (
    size !== "icon" &&
    !!showCounter &&
    counter !== undefined &&
    counter !== null &&
    counter !== false
  );
}
