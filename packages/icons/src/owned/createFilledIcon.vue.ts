import { h, type FunctionalComponent } from "vue";

import { kozmosIconPropsOptions, type KozmosIconProps } from "../iconProps";

/**
 * The Vue build's createFilledIcon: a solid glyph on the 24-unit canvas,
 * filled with `color`, as the React factory draws it. `strokeWidth` and
 * `absoluteStrokeWidth` are taken and ignored there, so they are here.
 */
export function createFilledIcon(
  iconName: string,
  paths: readonly string[],
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
        viewBox: "0 0 24 24",
        width: size,
        xmlns: "http://www.w3.org/2000/svg",
      },
      paths.map((d) => h("path", { d })),
    );
  Component.props = kozmosIconPropsOptions;
  Component.displayName = iconName;
  return Component;
}
