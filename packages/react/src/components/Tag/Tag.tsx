import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { X } from "@kozmos-ds/icons";
import { emotionSurfaceProperties, type Emotion } from "../../utils/emotion";
import { useKozmosAnalytics } from "../../utils/analytics";
import {
  TAG_REMOVE_ICON_CLASS,
  tagParts,
  tagVariants,
} from "../../recipes/tag";

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
  /**
   * The remove button's accessible name. English by default; a product that
   * translates passes its own.
   */
  removeLabel?: string;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  (
    {
      className,
      variant,
      emotion,
      onRemove,
      removeLabel = "Remove",
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const [emotionClasses, removeClasses] = tagParts(variant, emotion);

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
            // The recipe says why each class is there (recipes/tag.ts).
            className={removeClasses}
          >
            <X className={TAG_REMOVE_ICON_CLASS} />
            <span className="sr-only">{removeLabel}</span>
          </button>
        )}
      </div>
    );
  },
);
Tag.displayName = "Tag";

export { Tag };
// The recipe Vue's KozmosTag draws from too, exported here as it always was.
export { tagVariants } from "../../recipes/tag";
