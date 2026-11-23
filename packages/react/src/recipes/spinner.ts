/**
 * Spinner's recipe: the status box a spinner draws, its four sizes and when
 * its label is put in, for every framework that draws one. React's `Spinner`
 * and Vue's `KozmosSpinner` both build their element from it, around the arc
 * in `spinner-arc.ts`. Framework-free (`recipes.framework-free.test.ts`).
 */

/**
 * The `Spinner/size/*` tokens: 16, 24, 32, 48. Both forms are set — the
 * attribute so the arc has an intrinsic size wherever the stylesheet does
 * not reach, the class so a caller can still size it with one.
 */
export const SPINNER_SIZES = {
  sm: { pixels: 16, className: "h-4 w-4" },
  md: { pixels: 24, className: "h-6 w-6" },
  lg: { pixels: 32, className: "h-8 w-8" },
  xl: { pixels: 48, className: "h-12 w-12" },
} as const;

export type SpinnerSizeName = keyof typeof SPINNER_SIZES;

/** The status box the arc is centred in. */
export const SPINNER_CLASS = "flex items-center justify-center";

/**
 * How long after it mounts a spinner's region is given its label. A spinner
 * is mounted when a wait starts, so its status region cannot be there before
 * it: it is mounted empty, and its label is put into it a moment later
 * (GAP-226), as a screen reader may say nothing for a region inserted
 * together with its words. The label is visually hidden, so nothing seen
 * waits for it.
 */
export const SPINNER_LABEL_DELAY_MS = 100;
