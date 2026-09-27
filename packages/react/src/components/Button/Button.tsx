import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import { SpinnerArc } from "../Spinner/SpinnerArc";
import { useKozmosAnalytics } from "../../utils/analytics";

/**
 * The six emotions the product drives, and which `Components.{Primary,
 * Secondary,Tertiary} Buttons` have carried in the tokens since before this
 * prop existed. Measured 2026-09-14, the product uses all six across its
 * surfaces; until now only `danger` was reachable, spelled `destructive`.
 */
export const BUTTON_EMOTIONS = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

export type ButtonEmotion = (typeof BUTTON_EMOTIONS)[number];

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "glass";

/**
 * `variant` says how much the button weighs and what shape it takes;
 * `emotion` says what it means. The token tiers already split the same way —
 * Primary is filled, Secondary is bordered, Tertiary is text — so a variant
 * maps to a tier and a treatment, and the emotion picks the colour within it.
 *
 * `glass` is an effect rather than a weight and takes no emotion.
 */
const VARIANT_TOKENS: Record<
  ButtonVariant,
  {
    tier: "primary" | "secondary";
    treatment: "filled" | "outline" | "text";
  } | null
> = {
  default: { tier: "primary", treatment: "filled" },
  secondary: { tier: "primary", treatment: "filled" },
  destructive: { tier: "primary", treatment: "filled" },
  outline: { tier: "secondary", treatment: "outline" },
  ghost: { tier: "secondary", treatment: "text" },
  link: { tier: "secondary", treatment: "text" },
  glass: null,
};

/**
 * One indirection, set as a custom property, rather than a class per
 * tier-and-emotion pair. The owned CSS recipes are emitted after the base
 * variants so explicit emotions win without runtime CSS generation.
 */
const TREATMENT_CLASSES = {
  filled: "kozmos-button-emotion-filled",
  outline: "kozmos-button-emotion-outline",
  text: "kozmos-button-emotion-text",
} as const;

function emotionCustomProperties(
  tier: "primary" | "secondary",
  emotion: ButtonEmotion,
): React.CSSProperties {
  const prefix = `--components-${tier}-buttons-${emotion}`;
  return {
    "--kz-button-bg": `var(${prefix}-button-background-idle)`,
    "--kz-button-bg-hover": `var(${prefix}-button-background-hover)`,
    "--kz-button-fg": `var(${prefix}-button-foreground-content-idle)`,
    "--kz-button-fg-hover": `var(${prefix}-button-foreground-content-hover)`,
  } as React.CSSProperties;
}

export const buttonVariants = cva("kozmos-reset kozmos-button", {
  variants: {
    variant: {
      default: "kozmos-button-default",
      destructive: "kozmos-button-destructive",
      outline: "kozmos-button-outline",
      secondary: "kozmos-button-secondary",
      ghost: "kozmos-button-ghost",
      link: "kozmos-button-link",
      glass: "kozmos-button-glass",
    },
    size: {
      default: "kozmos-button-size-default",
      sm: "kozmos-button-size-sm",
      lg: "kozmos-button-size-lg",
      icon: "kozmos-button-size-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

/** Native button props and ref. For navigation use Link or buttonVariants on an
 * anchor/router link; Button does not reparent children or emulate disabled links. */
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /**
   * What the button means. Leave it unset and the variant renders exactly as
   * it always has: `secondary` is `neutral` and `destructive` is `danger`
   * already, by the values in the tokens. Set it and the emotion decides the
   * colour, whatever the variant.
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

    const tokens = VARIANT_TOKENS[(variant ?? "default") as ButtonVariant];
    const emotional = emotion && tokens ? tokens : null;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
                ...emotionCustomProperties(emotional.tier, emotion!),
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
