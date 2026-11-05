import { h, type FunctionalComponent } from "vue";

import { kozmosIconPropsOptions, type KozmosIconProps } from "../iconProps";

/** One path of a taxonomy symbol, as createTaxonomyIcon.tsx declares it. */
export interface TaxonomyIconPath {
  d: string;
  fillRule?: "evenodd" | "nonzero";
  clipRule?: "evenodd" | "nonzero";
}

/**
 * The Vue build's createTaxonomyIcon: a solid symbol on its own squared
 * canvas, filled with `color`, as the React factory draws it. `strokeWidth`
 * and `absoluteStrokeWidth` are taken and ignored: there is no stroke.
 */
export function createTaxonomyIcon(
  iconName: string,
  viewBox: string,
  paths: readonly TaxonomyIconPath[],
): FunctionalComponent<KozmosIconProps> {
  const Component: FunctionalComponent<KozmosIconProps> = ({
    color = "currentColor",
    size = 24,
  }) =>
    h(
      "svg",
      {
        fill: color,
        height: size,
        viewBox,
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
