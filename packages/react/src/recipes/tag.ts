/**
 * Tag's recipe: the pill a tag draws, its emotion's treatment and its remove
 * button, for every framework that draws one. React's `Tag` and Vue's
 * `KozmosTag` both build their element from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import {
  EMOTION_FILLED_CLASSES,
  EMOTION_OUTLINE_CLASSES,
  type Emotion,
} from "./emotion";

export const tagVariants = cva(
  // Four between a Tag's parts, the spacing scale's 50, as SwiftUI's
  // `HStack(spacing: spacing50)` draws it. A Tag takes arbitrary children on
  // React alone, so an icon beside its text touched — the pill scale's gap,
  // not the control scale's 8, and not `Chip`'s 6, which Figma binds to
  // `Layout/spacing/75` for a larger pill.
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // The theme fill and the theme foreground, the same in both themes
        // (decision 59). Hovered, the themed Button's hover token, opaque,
        // 6.24:1 under its white text: /90 of the fill let the page
        // through, lighter in the light and darker in the dark.
        default:
          "border-transparent bg-theme-fill text-theme-fill-foreground hover:bg-[var(--components-primary-buttons-themed-button-background-hover)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type TagVariant = NonNullable<
  VariantProps<typeof tagVariants>["variant"]
>;

/**
 * What a Tag adds to `tagVariants`, given its variant and emotion: the
 * emotion's treatment (`outline` becomes the emotion as text with a matching
 * edge, every other variant the emotion's filled pair; none without an
 * emotion), and its remove button's classes. One call, so React's bundle
 * pays for one.
 *
 * The remove button has no margin of its own: the row's gap spaces it. With
 * both it sat 8 from the label where the rest of the Tag spaces 4 — the same
 * compensating margin GAP-56 took off the Button's loader, reintroduced here
 * the moment the gap arrived. Focused from the keyboard it draws Button's
 * offset ring, a band of the page's colour and then the theme's 600, 3:1 on
 * the fill and on the page; it drew none. On the theme fill (no emotion, the
 * default variant) its hover is the theme foreground at a fifth: the 600 it
 * took read 1.11:1 there. Drawn 16, its target is 24 wide and the Tag's own
 * height (WCAG 2.2's 2.5.8, with its spacing), from owned CSS on
 * kozmos-tag-remove, so the Tag is no larger for it.
 */
export function tagParts(
  variant: TagVariant | null | undefined,
  emotion: Emotion | undefined,
): [emotionClasses: string | undefined, removeClasses: string] {
  return [
    emotion
      ? variant === "outline"
        ? EMOTION_OUTLINE_CLASSES
        : EMOTION_FILLED_CLASSES
      : undefined,
    cn(
      "kozmos-tag-remove rounded-pill p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      !emotion &&
        (variant ?? "default") === "default" &&
        "hover:bg-theme-fill-foreground/20",
    ),
  ];
}

/** The remove button's glyph, `X`, at 12. */
export const TAG_REMOVE_ICON_CLASS = "h-3 w-3";
