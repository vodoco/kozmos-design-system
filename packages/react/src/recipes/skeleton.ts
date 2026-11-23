/**
 * Skeleton's recipe: the placeholder's classes and the box it holds, by
 * shape, for every framework that draws one. React's `Skeleton` and Vue's
 * `KozmosSkeleton` both build their element from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { clsx } from "clsx";

/** `line`, `block` or `circle`: what the placeholder stands in for. */
export type SkeletonShapeName = "line" | "block" | "circle";

/** A length as CSS takes it: a number is pixels, a string any CSS length. */
export const skeletonLength = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

/**
 * The placeholder's classes. The pulse is `.kozmos-skeleton` rather than
 * `animate-pulse` so one owned rule can rest it under the reduced-motion
 * preference and under the design config's `motion: reduced`, together with
 * the spinner and the assistant's ring (GAP-50). The grey is in that rule
 * too. A line stands in for text, so it takes a text-sized height unless it
 * is told otherwise. A block has no such default: it is whatever it
 * replaces, and guessing would be worse than asking.
 */
export function skeletonClasses(
  shape: SkeletonShapeName,
  height: number | string | undefined,
): string {
  return clsx(
    "kozmos-skeleton",
    shape === "circle" ? "shrink-0 rounded-pill" : "w-full rounded-control",
    shape === "line" && height === undefined && "h-4",
  );
}

/**
 * The box it holds, before the caller's own style: a circle takes `width` as
 * its diameter, 40 unless told, and needs nothing else.
 */
export function skeletonBox(
  shape: SkeletonShapeName,
  width: number | string | undefined,
  height: number | string | undefined,
): { width: string | undefined; height: string | undefined } {
  const size = skeletonLength(width);
  return shape === "circle"
    ? {
        width: size ?? "2.5rem",
        height: skeletonLength(height) ?? size ?? "2.5rem",
      }
    : { width: size, height: skeletonLength(height) };
}
