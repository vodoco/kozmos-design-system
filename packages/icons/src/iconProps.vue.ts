import type { ComponentPropsOptions } from "vue";

/**
 * The props every icon in `@kozmos-ds/icons/vue` takes: the React entry's,
 * as Vue props. `size` sets the width and height, `color` the stroke or fill
 * (`currentColor` by default), `strokeWidth` an outline's weight, and
 * `absoluteStrokeWidth` holds that weight on screen as the icon scales.
 *
 * Everything else a caller sets (`class`, `style`, `aria-*`, `role`, a
 * listener) falls through to the `<svg>`, as React's entry spreads the rest of
 * its props onto it; a fallen-through attribute wins over the icon's own, as
 * React's spread does.
 *
 * This file stands in for `iconProps.ts` in the Vue build only: the Vue entry
 * is built and declared with `moduleSuffixes: [".vue", ""]`, so every module
 * that imports `./iconProps` gets this one there.
 */
export interface KozmosIconProps {
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
  absoluteStrokeWidth?: boolean;
}

/** The Vue props declaration every icon factory shares. */
export const kozmosIconPropsOptions: ComponentPropsOptions<KozmosIconProps> = {
  size: [String, Number],
  color: String,
  strokeWidth: [String, Number],
  absoluteStrokeWidth: Boolean,
};
