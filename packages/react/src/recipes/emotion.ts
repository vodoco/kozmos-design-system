/**
 * The emotion axis's recipe: the six emotions, the custom properties an
 * emotion sets and the classes that read them, for every framework that
 * draws one (React's `Tag` and `Progress` ring, Vue's `KozmosTag` and
 * `KozmosProgress`). `utils/emotion` re-exports it for React's parts, and
 * keeps React's own typing of the properties. Framework-free
 * (`recipes.framework-free.test.ts`).
 */

/**
 * What a thing means, as opposed to how much it weighs.
 *
 * The product drives this axis on `Button`, `Tag` and `Counter` and uses all
 * six values; measured 2026-09-14, it covers 80% of its mapped control
 * instances. `Button` reads the six-emotion colours named for buttons; `Tag`
 * and `Counter` read `Semantics.Emotion`, which exists so they do not have to
 * borrow a Button's tokens (§5.1).
 */
export const EMOTIONS = [
  "neutral",
  "themed",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

/**
 * The three roles an emotion carries, as custom properties, by name: React
 * spreads them into a `style`, Vue binds them as one.
 *
 * One indirection rather than a class per emotion-and-treatment pair: Tailwind
 * only ever sees the literal `var(--kz-emotion-*)` names, so the JIT has
 * nothing to miss, and `cn` is tailwind-merge, so a treatment's classes win
 * over whatever colour the variant already carried.
 *
 * `surface` and `onSurface` are a filled pair — 4.5:1 or better in both modes.
 * `text` is the emotion on the page itself, at the first step of each ramp that
 * reaches 4.5:1, which is not the same step for every emotion.
 */
export function emotionSurfaceVariables(
  emotion: Emotion,
): Record<string, string> {
  const prefix = `--semantics-emotion-${emotion}`;
  return {
    "--kz-emotion-surface": `var(${prefix}-surface)`,
    "--kz-emotion-on-surface": `var(${prefix}-on-surface)`,
    "--kz-emotion-text": `var(${prefix}-text)`,
  };
}

/** A filled treatment: the emotion's own field, with its ink on top. */
export const EMOTION_FILLED_CLASSES =
  "border-transparent bg-[var(--kz-emotion-surface)] text-[var(--kz-emotion-on-surface)]";

/** An outline treatment: the emotion as text, with a matching edge. */
export const EMOTION_OUTLINE_CLASSES =
  "bg-transparent border-[var(--kz-emotion-text)] text-[var(--kz-emotion-text)]";
