import * as React from "react";
import type { ThemeDensity } from "../components/ThemeProvider/ThemeProvider";
import { DensityContext } from "./density-context";
import { ThemeProviderContext } from "./theme-context";

type PortalProps = {
  children?: React.ReactNode;
  container?: Element | DocumentFragment | null;
  forceMount?: true;
};

/**
 * Each element a portal renders carries the density where it opened, so the
 * popovers of a part held at touch on a compact page (an SDK part), or of a
 * compact region on a touch one, open at the part's density rather than at
 * the provider's. The mark goes on the elements themselves: a wrapper would
 * hide their exit animations from Radix's presence.
 */
function markDensity(child: React.ReactNode, density: ThemeDensity) {
  if (!React.isValidElement(child) || child.type === React.Fragment)
    return child;
  return React.cloneElement(
    child as React.ReactElement<{ "data-kozmos-density"?: ThemeDensity }>,
    { "data-kozmos-density": density },
  );
}

/** Keep Radix presence/focus behavior; only choose the default destination. */
export function createThemePortal(Primitive: React.ComponentType<PortalProps>) {
  function ThemePortal({ children, ...props }: PortalProps) {
    const theme = React.useContext(ThemeProviderContext);
    const density = React.useContext(DensityContext);
    // Do not mount in body briefly and then remount once the owned root exists.
    if (props.container === undefined && theme && !theme.portalContainer)
      return null;
    // One child stays one child: a Radix portal that slots its content takes
    // a single element, not a list of one.
    const marked =
      density === undefined
        ? children
        : Array.isArray(children)
          ? React.Children.map(children, (child) => markDensity(child, density))
          : markDensity(children, density);
    return (
      <Primitive
        {...props}
        container={
          props.container === undefined
            ? theme?.portalContainer
            : props.container
        }
      >
        {marked}
      </Primitive>
    );
  }
  ThemePortal.displayName = "KozmosThemePortal";
  return ThemePortal;
}
