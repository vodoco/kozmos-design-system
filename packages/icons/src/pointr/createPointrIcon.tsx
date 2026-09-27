import * as React from "react";

import type { KozmosIconProps } from "../iconProps";

/**
 * One path of a Pointr icon, as exported from the Pointr Icon Library.
 *
 * The library draws every icon on the same grid as lucide — 24×24, stroke 2,
 * round caps and joins — so only the outline itself is carried here; the
 * wrapper below supplies the rest, which is what lets a Pointr icon and a
 * lucide icon sit in the same row without either looking out of place.
 */
export interface PointrIconPath {
  d: string;
  fillRule?: "evenodd" | "nonzero";
  clipRule?: "evenodd" | "nonzero";
}

/**
 * Build a component with lucide's own contract — `size`, `color`,
 * `strokeWidth`, `absoluteStrokeWidth` and a forwarded ref — so a Pointr icon
 * is a drop-in wherever a `LucideIcon` is expected, `Icon` included.
 *
 * `absoluteStrokeWidth` follows lucide's implementation exactly: it holds the
 * stroke to a fixed on-screen width as the icon scales, rather than letting it
 * scale with the box.
 */
export function createPointrIcon(
  iconName: string,
  paths: readonly PointrIconPath[],
) {
  // `children` is omitted deliberately. An icon has no children, and taking
  // them from `KozmosIconProps` dragged React's `ReactNode` into this file —
  // which broke the build wherever `lucide-react`'s types resolve to a
  // different `@types/react` than this package's, as CI's does.
  const Component = React.forwardRef<SVGSVGElement, KozmosIconProps>(
    (
      {
        color = "currentColor",
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth,
        ...rest
      },
      ref,
    ) => (
      <svg
        ref={ref}
        fill="none"
        height={size}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={
          absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth
        }
        viewBox="0 0 24 24"
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
