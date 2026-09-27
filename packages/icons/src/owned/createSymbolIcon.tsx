import * as React from "react";

import type { KozmosIconProps } from "../iconProps";

/**
 * One mark of a symbol: a solid shape, or a line drawn at its own weight.
 *
 * A symbol's lines are part of its artwork rather than an outline at the icon
 * set's stroke, so each carries its width, and a dashed line its dashes.
 */
export type SymbolIconPath =
  | { d: string; paint: "fill" }
  | { d: string; paint: "stroke"; width: number; dashes?: string };

/**
 * A group of marks drawn at one strength. The strength belongs to the group,
 * not to each mark, so where two marks overlap — an arrowhead over the end of
 * its arc — they composite once and the overlap does not read darker.
 */
export interface SymbolIconLayer {
  opacity?: number;
  paths: readonly SymbolIconPath[];
}

/**
 * Build a multi-tone symbol with lucide's contract — `size`, `color` and a
 * forwarded ref — as the package's other factories do.
 *
 * Everything is drawn in `color` (`currentColor` unless set), and the tones
 * are strengths of it, so a symbol themes with whatever colours the text it
 * sits in: the revamp's own theming note gives each mark as "Theme 600" at an
 * opacity, never as a second colour. `strokeWidth` and `absoluteStrokeWidth`
 * are taken and dropped, as a taxonomy symbol drops them: an icon row passes
 * them to every icon, and a symbol's lines are drawn at their own weight.
 *
 * The canvas is the symbol's own, and it is wider than the icon grid: a mark
 * like the heading cone is drawn around the pointer, so the pointer occupies
 * the middle 24 of 36. Render a symbol at one and a half times the size of
 * the icons beside it and its pointer lines up with theirs.
 */
export function createSymbolIcon(
  iconName: string,
  viewBox: string,
  layers: readonly SymbolIconLayer[],
) {
  // `children` is omitted as it is for a Pointr icon: see createPointrIcon.
  const Component = React.forwardRef<SVGSVGElement, KozmosIconProps>(
    (
      {
        color = "currentColor",
        size = 36,
        strokeWidth: _strokeWidth,
        absoluteStrokeWidth: _absoluteStrokeWidth,
        ...rest
      },
      ref,
    ) => (
      <svg
        ref={ref}
        fill="none"
        height={size}
        // A line's round cap can reach half its width past the canvas edge,
        // which the SVG default would clip.
        overflow="visible"
        viewBox={viewBox}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        {layers.map((layer, layerIndex) => (
          <g key={layerIndex} opacity={layer.opacity}>
            {layer.paths.map((path, pathIndex) =>
              path.paint === "fill" ? (
                <path d={path.d} fill={color} key={pathIndex} />
              ) : (
                <path
                  d={path.d}
                  key={pathIndex}
                  stroke={color}
                  strokeDasharray={path.dashes}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={path.width}
                />
              ),
            )}
          </g>
        ))}
      </svg>
    ),
  );

  Component.displayName = iconName;
  return Component;
}
