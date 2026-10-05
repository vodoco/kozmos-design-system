import * as React from "react";

import type { KozmosIconProps } from "../iconProps";

/**
 * A filled glyph on the 24-unit canvas, painted in `color` (the current
 * colour by default). The wayfinding artwork from Pointr Maps - Express is
 * drawn as solid shapes, not outlines, so a stroke width means nothing to it:
 * `strokeWidth` and `absoluteStrokeWidth` are accepted, as every icon in this
 * package takes them, and ignored.
 */
export function createFilledIcon(iconName: string, paths: readonly string[]) {
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
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        {paths.map((d, index) => (
          <path d={d} key={index} />
        ))}
      </svg>
    ),
  );

  Component.displayName = iconName;
  return Component;
}
