import type * as React from "react";

/**
 * The props every icon in this package takes.
 *
 * This is lucide's own `LucideProps` contract, written out rather than
 * imported. Both icon factories imported it until 2026-09-23, which kept
 * `lucide-react` a dependency of a package that had stopped drawing a single
 * lucide outline. Keeping the shape identical is deliberate: an icon from this
 * package is still a drop-in wherever a lucide icon was expected.
 *
 * `children` is omitted deliberately. An icon has no children, and taking them
 * dragged React's `ReactNode` in, which broke the build wherever a second
 * `@types/react` resolved, as CI's does.
 */
export type KozmosIconProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "ref" | "children"
> & {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
};
