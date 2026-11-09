/**
 * Button's recipe: the classes and custom properties a Kozmos button draws
 * with, for every framework that draws one. React's `Button` and Vue's
 * `KozmosButton` both build their element from it, so the two cannot drift
 * (Vue 3 Phase 0). Framework-free: it imports `class-variance-authority` and
 * nothing that renders (`recipes.framework-free.test.ts`).
 */
import { cva } from "class-variance-authority";

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

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "glass"
  | "subtle";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

/**
 * `variant` says how much the button weighs and what shape it takes;
 * `emotion` says what it means. The token tiers already split the same way —
 * Primary is filled, Secondary is bordered, Tertiary is text — so a variant
 * maps to a tier and a treatment, and the emotion picks the colour within it.
 *
 * `subtle` is a fill of its own tier (GAP-200, decision 135): the emotion's
 * palest step under its words, theme 0 under theme 600 unset, and the
 * destructive tone's rose under red with `emotion="danger"` (decision 139).
 *
 * `glass` is an effect rather than a weight and takes no emotion.
 */
export type ButtonTier = "primary" | "secondary" | "subtle";

export const VARIANT_TOKENS: Record<
  ButtonVariant,
  {
    tier: ButtonTier;
    treatment: "filled" | "outline" | "text";
  } | null
> = {
  default: { tier: "primary", treatment: "filled" },
  secondary: { tier: "primary", treatment: "filled" },
  destructive: { tier: "primary", treatment: "filled" },
  outline: { tier: "secondary", treatment: "outline" },
  ghost: { tier: "secondary", treatment: "text" },
  link: { tier: "secondary", treatment: "text" },
  subtle: { tier: "subtle", treatment: "filled" },
  glass: null,
};

/**
 * One indirection, set as a custom property, rather than a class per
 * tier-and-emotion pair. The owned CSS recipes are emitted after the base
 * variants so explicit emotions win without runtime CSS generation.
 */
export const TREATMENT_CLASSES = {
  filled: "kozmos-button-emotion-filled",
  outline: "kozmos-button-emotion-outline",
  text: "kozmos-button-emotion-text",
} as const;

/** The custom properties an emotion sets on a button, in the order it sets them. */
export function emotionCustomProperties(
  tier: ButtonTier,
  emotion: ButtonEmotion,
): Record<`--${string}`, string> {
  const prefix = `--components-${tier}-buttons-${emotion}`;
  return {
    "--kz-button-bg": `var(${prefix}-button-background-idle)`,
    "--kz-button-bg-hover": `var(${prefix}-button-background-hover)`,
    "--kz-button-bg-focus": `var(${prefix}-button-background-focus)`,
    "--kz-button-bg-pressed": `var(${prefix}-button-background-pressed)`,
    "--kz-button-fg": `var(${prefix}-button-foreground-content-idle)`,
    "--kz-button-fg-hover": `var(${prefix}-button-foreground-content-hover)`,
    // The subtle tier's words step with its fill (GAP-200); the Primary
    // tier's are one colour in every state, so these change nothing there.
    "--kz-button-fg-focus": `var(${prefix}-button-foreground-content-focus)`,
    "--kz-button-fg-pressed": `var(${prefix}-button-foreground-content-pressed)`,
  };
}

/**
 * The tier, treatment and emotion a variant draws with through the emotion's
 * custom properties, or null when it draws the variant's own colours: no
 * emotion given, or `glass`. The subtle variant always draws this way, as
 * `themed` with no emotion given, so its colours are its tier's tokens alone
 * and the stylesheet carries no rule of its own for them (GAP-200).
 */
export function buttonEmotionTokens(
  variant: ButtonVariant | null | undefined,
  emotion: ButtonEmotion | null | undefined,
) {
  const tokens = VARIANT_TOKENS[variant ?? "default"];
  const drawn = emotion || (variant === "subtle" ? "themed" : null);
  return drawn && tokens ? { ...tokens, emotion: drawn } : null;
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
      subtle: "kozmos-button-subtle",
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
