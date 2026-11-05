import { h, type FunctionalComponent } from "vue";

import { kozmosIconPropsOptions, type KozmosIconProps } from "../iconProps";

/**
 * One path of an icon from the Pointr Icon Library, as createPointrIcon.tsx
 * declares it: the generated data is shared, so the shape is the same.
 */
export interface PointrIconPath {
  d: string;
  fillRule?: "evenodd" | "nonzero";
  clipRule?: "evenodd" | "nonzero";
}

/**
 * The Vue build's createPointrIcon: the same `<svg>` the React factory draws,
 * as a functional component. 24×24, stroke 2, round caps and joins; `size`,
 * `color`, `strokeWidth` and `absoluteStrokeWidth` as in React, with the
 * stroke held to `strokeWidth × 24 / size` when `absoluteStrokeWidth` is set.
 *
 * The Vue entry is built with `.vue.ts` resolved first, so the generated
 * outlines, which import `./createPointrIcon`, call this one there.
 */
export function createPointrIcon(
  iconName: string,
  paths: readonly PointrIconPath[],
): FunctionalComponent<KozmosIconProps> {
  const Component: FunctionalComponent<KozmosIconProps> = ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
  }) =>
    h(
      "svg",
      {
        fill: "none",
        height: size,
        stroke: color,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": absoluteStrokeWidth
          ? (Number(strokeWidth) * 24) / Number(size)
          : strokeWidth,
        viewBox: "0 0 24 24",
        width: size,
        xmlns: "http://www.w3.org/2000/svg",
      },
      paths.map((path) =>
        h("path", {
          "clip-rule": path.clipRule,
          d: path.d,
          "fill-rule": path.fillRule,
        }),
      ),
    );
  Component.props = kozmosIconPropsOptions;
  Component.displayName = iconName;
  return Component;
}
