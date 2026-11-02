import React from "react";
import { cn } from "../../utils";

import { surfaceClass } from "./surface-class";

/**
 * What a surface is made of. Solid — the background colour with the subtle
 * border — is the default everywhere; glass, the glass surface role composed
 * from `Semantics.Effect.glass`, is a choice a product makes per surface.
 */
export type SurfaceVariant = "solid" | "glass";

export { SURFACE_CLASSES, surfaceClass } from "./surface-class";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

/**
 * A surface: solid by default — the background colour with the subtle border
 * — or glass, the theme's glass colour at the token's opacity with what shows
 * through blurred and saturated by the token's numbers and a light edge. The
 * shape is the caller's (`rounded-container`, `rounded-panel`); the variant
 * is the material. With transparency reduced — the design config's setting
 * or the system's — glass is the plain colour.
 */
const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "solid", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceClass(variant), className)}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

export { Surface };
