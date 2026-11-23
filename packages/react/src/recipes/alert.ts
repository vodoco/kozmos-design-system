/**
 * Alert's recipe: the classes a Kozmos alert, its title and its description
 * draw with, for every framework that draws them. React's `Alert`,
 * `AlertTitle` and `AlertDescription` and Vue's `KozmosAlert`,
 * `KozmosAlertTitle` and `KozmosAlertDescription` build their elements from
 * it; its `live` is `LIVE_ROLES` (`live-region.ts`). Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const alertVariants = cva(
  // A description straight after the icon, with no title, is centred on the
  // icon by a margin of -2 above and below it: its 20 line then runs 14 to 34,
  // around the 16 icon's 16 to 32, and the alert's space is 14 above the words
  // and 14 below them. It was lifted 3 with a transform, which moves the
  // drawing but not the box, so the words had 13 above and 19 below (GAP-269).
  // The icon and the room for it are at the inline start: they were left-4
  // and pl-7, so right to left the icon stayed at the left.
  "relative w-full rounded-container border p-4 [&>svg~*]:ps-7 [&>svg+div]:-my-0.5 [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive-text dark:border-destructive [&>svg]:text-destructive-text",
        success:
          "border-success/50 text-success-text dark:border-success [&>svg]:text-success-text",
        warning:
          "border-warning/50 text-warning-text dark:border-warning [&>svg]:text-warning-text",
        info: "border-info/50 text-info-text dark:border-info [&>svg]:text-info-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** The recipe's variants, as a framework's props name them. */
export type AlertVariant = NonNullable<
  VariantProps<typeof alertVariants>["variant"]
>;

/**
 * Whether a screen reader should interrupt for this alert, and how hard.
 *
 * `off` is no live region at all, which is right for a notice that is simply
 * part of the page — "View only. Only Dashboard admins can change these
 * settings." That is the default because it is what this component is used
 * for, and because it is what SwiftUI and Compose already do: neither native
 * Alert announces anything.
 *
 * `polite` is `role="status"`: a notice that appeared in response to something
 * the visitor did, read when the reader next pauses.
 *
 * `assertive` is `role="alert"`, which interrupts whatever is being read. Only
 * for something that has just gone wrong and cannot wait.
 */
export type AlertLiveness = "off" | "polite" | "assertive";

/**
 * The title's heading level, or `none` for a `<p>`: an alert's title labels
 * a notice, it does not open a section of the document.
 */
export type AlertTitleLevel = 2 | 3 | 4 | 5 | 6 | "none";

// `text-base` explicitly. The reset makes every heading `font-size:
// inherit`, and this carried no size at all, so the title came out the size
// of the surrounding text — and the description below it is `text-sm`.
// Title and description rendered at the same size, separated only by
// weight (GAP-007). 16 is what Compose already uses here (titleMedium).
export const ALERT_TITLE_CLASS =
  "mb-1 text-base font-medium leading-none tracking-tight";

export const ALERT_DESCRIPTION_CLASS = "text-sm [&_p]:leading-relaxed";
