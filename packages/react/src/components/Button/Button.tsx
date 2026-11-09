import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { SpinnerArc } from "../Spinner/SpinnerArc";
import { useKozmosAnalytics } from "../../utils/analytics";
import { GenericClickTracking } from "../../utils/generic-click";
import {
  buttonEmotionTokens,
  buttonVariants,
  emotionCustomProperties,
  TREATMENT_CLASSES,
  type ButtonEmotion,
  type ButtonVariant,
} from "../../recipes/button";

// The recipe is shared with Vue's KozmosButton (recipes/button.ts); these stay
// exported from here, where they always were.
export {
  BUTTON_EMOTIONS,
  buttonVariants,
  type ButtonEmotion,
} from "../../recipes/button";

/** Native button props and ref. For navigation use Link or buttonVariants on an
 * anchor/router link; Button does not reparent children or emulate disabled links. */
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /**
   * What the button means. Leave it unset and the variant keeps its own
   * colours: `secondary` draws the `neutral` Primary Buttons tokens and
   * `destructive` the `danger` ones, in every state (decision 61). Set it
   * and the emotion decides the colour, whatever the variant.
   *
   * `subtle` (GAP-200) is a pale fill of its own tier, theme 0 under the
   * theme's words unset; with an emotion it is that emotion's pale fill
   * under its words, and `emotion="danger"` is the destructive tone of
   * Pointr Cloud's Delete Feature (decision 139).
   *
   * `glass` takes no emotion.
   */
  emotion?: ButtonEmotion;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      children,
      onClick,
      disabled,
      emotion,
      style,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    // Off where a component reports this press with its own event.
    const genericClick = React.useContext(GenericClickTracking);

    const emotional = buttonEmotionTokens(variant as ButtonVariant, emotion);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (genericClick)
        trackEvent("Button", "button_clicked", {
          variant: variant || "default",
          emotion: emotion || null,
          disabled,
        });
      onClick?.(e);
    };

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          emotional && TREATMENT_CLASSES[emotional.treatment],
          className,
        )}
        style={
          emotional
            ? {
                ...(emotionCustomProperties(
                  emotional.tier,
                  emotional.emotion,
                ) as React.CSSProperties),
                ...style,
              }
            : style
        }
        ref={ref}
        disabled={isLoading || disabled}
        onClick={handleClick}
        {...props}
      >
        {isLoading && (
          <SpinnerArc className="kozmos-reset kozmos-button-loader" size={16} />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
