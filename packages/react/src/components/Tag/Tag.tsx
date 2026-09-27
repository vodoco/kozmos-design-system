import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { X } from "@kozmos-ds/icons";
import {
  EMOTION_FILLED_CLASSES,
  EMOTION_OUTLINE_CLASSES,
  emotionSurfaceProperties,
  type Emotion,
} from "../../utils/emotion";
import { useKozmosAnalytics } from "../../utils/analytics";

const tagVariants = cva(
  // Four between a Tag's parts, the spacing scale's 50, as SwiftUI's
  // `HStack(spacing: spacing50)` draws it. A Tag takes arbitrary children on
  // React alone, so an icon beside its text touched — the pill scale's gap,
  // not the control scale's 8, and not `Chip`'s 6, which Figma binds to
  // `Layout/spacing/75` for a larger pill.
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
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

export interface TagProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void;
  /**
   * What the tag means. Leave it unset and the variant renders exactly as it
   * always has. Set it and the emotion decides the colour: `outline` becomes
   * the emotion as text with a matching edge, and every other variant becomes
   * the emotion's filled pair.
   *
   * The product drives this axis on 33,988 tag instances across 10 surfaces
   * and Kozmos could express none of it before now.
   */
  emotion?: Emotion;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  (
    { className, variant, emotion, onRemove, children, style, ...props },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const emotionClasses = emotion
      ? variant === "outline"
        ? EMOTION_OUTLINE_CLASSES
        : EMOTION_FILLED_CLASSES
      : undefined;

    return (
      <div
        ref={ref}
        className={cn(tagVariants({ variant }), emotionClasses, className)}
        // The caller's own style wins: these are a default the emotion sets,
        // not something the component insists on.
        style={
          emotion ? { ...emotionSurfaceProperties(emotion), ...style } : style
        }
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={() => {
              if (typeof children === "string") {
                trackEvent("Tag", "tag_removed", { label: children });
              } else {
                trackEvent("Tag", "tag_removed");
              }
              onRemove();
            }}
            // No margin of its own: the row's gap spaces it. With both it
            // sat 8 from the label where the rest of the Tag spaces 4 — the
            // same compensating margin GAP-56 took off the Button's loader,
            // reintroduced here the moment the gap arrived.
            className="rounded-pill p-0.5 hover:bg-accent focus:outline-none"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </button>
        )}
      </div>
    );
  },
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
