import * as React from "react";

import type { KozmosIconProps } from "../iconProps";

/** One path of a taxonomy symbol, as the taxonomy publishes it. */
export interface TaxonomyIconPath {
  d: string;
  fillRule?: "evenodd" | "nonzero";
  clipRule?: "evenodd" | "nonzero";
}

/**
 * Build a taxonomy symbol with lucide's contract — `size`, `color` and a
 * forwarded ref — so it is a drop-in wherever a `LucideIcon` is expected, as a
 * Pointr icon is.
 *
 * A symbol is a solid shape rather than an outline, so `color` fills it, and
 * `strokeWidth` and `absoluteStrokeWidth` are taken and dropped: an icon row
 * passes them to every icon, and there is no stroke here for them to set.
 *
 * The viewBox is the symbol's own, squared: the taxonomy draws each on its own
 * canvas (64×64, 75×64, 64×23), and the generator widens that to a square in
 * which the longer side spans 20 of 24, as an icon's live area does.
 */
export function createTaxonomyIcon(
  iconName: string,
  viewBox: string,
  paths: readonly TaxonomyIconPath[],
) {
  // `children` is omitted as it is for a Pointr icon: see createPointrIcon.
  const Component = React.forwardRef<SVGSVGElement, KozmosIconProps>(
    (
      {
        color = "currentColor",
        size = 24,
        strokeWidth: _strokeWidth,
        absoluteStrokeWidth: _absoluteStrokeWidth,
        ...rest
      },
      ref,
    ) => (
      <svg
        ref={ref}
        fill={color}
        height={size}
        viewBox={viewBox}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        {paths.map((path, index) => (
          <path
            clipRule={path.clipRule}
            d={path.d}
            fillRule={path.fillRule}
            key={index}
          />
        ))}
      </svg>
    ),
  );

  Component.displayName = iconName;
  return Component;
}
