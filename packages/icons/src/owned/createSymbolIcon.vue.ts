import { h, type FunctionalComponent } from "vue";

import { kozmosIconPropsOptions, type KozmosIconProps } from "../iconProps";

/** One mark of a symbol, as createSymbolIcon.tsx declares it. */
export type SymbolIconPath =
  | { d: string; paint: "fill" }
  | { d: string; paint: "stroke"; width: number; dashes?: string };

/** A group of marks drawn at one strength, as createSymbolIcon.tsx declares it. */
export interface SymbolIconLayer {
  opacity?: number;
  paths: readonly SymbolIconPath[];
}

/**
 * The Vue build's createSymbolIcon: a multi-tone symbol in `color`, its tones
 * strengths of it, on its own canvas, 36 by default, as the React factory
 * draws it. `strokeWidth` and `absoluteStrokeWidth` are taken and ignored: a
 * symbol's lines are drawn at their own weight.
 */
export function createSymbolIcon(
  iconName: string,
  viewBox: string,
  layers: readonly SymbolIconLayer[],
): FunctionalComponent<KozmosIconProps> {
  const Component: FunctionalComponent<KozmosIconProps> = ({
    color = "currentColor",
    size = 36,
  }) =>
    h(
      "svg",
      {
        fill: "none",
        height: size,
        // A line's round cap can reach half its width past the canvas edge,
        // which the SVG default would clip.
        overflow: "visible",
        viewBox,
        width: size,
        xmlns: "http://www.w3.org/2000/svg",
      },
      layers.map((layer) =>
        h(
          "g",
          { opacity: layer.opacity },
          layer.paths.map((path) =>
            path.paint === "fill"
              ? h("path", { d: path.d, fill: color })
              : h("path", {
                  d: path.d,
                  stroke: color,
                  "stroke-dasharray": path.dashes,
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": path.width,
                }),
          ),
        ),
      ),
    );
  Component.props = kozmosIconPropsOptions;
  Component.displayName = iconName;
  return Component;
}
