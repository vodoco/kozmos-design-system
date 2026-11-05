import React from "react";
import { cn } from "../../utils";
import { SPINNER_ARC } from "../../recipes/spinner-arc";

/**
 * The system's loading mark: one arc, drawn the same everywhere.
 *
 * Before 2026-09-22 the spinner was four different drawings — lucide's
 * `Loader2` in React, `ProgressView` tinted a hard-coded SwiftUI blue on iOS,
 * material3's `CircularProgressIndicator` on Android, and in Figma an ellipse
 * with `dashPattern: [8, 4]`, a dashed ring standing in for motion a static
 * node cannot show. None of them matched another.
 *
 * This is the drawing: three quarters of a circle, radius 9 in the icons' own
 * 24 box, round caps, stroke 2 — so it scales with its size exactly as every
 * Kozmos icon does, and carries the icon scale's medium weight at 24. The
 * quarter that is missing is what reads as motion; a full ring turning shows
 * nothing at all.
 *
 * It takes its colour from `currentColor`, so it follows the text it sits in
 * — a button's foreground, a panel's ink — and needs no colour of its own.
 *
 * It is not exported from the package: `Spinner` is the component with the
 * status role, and `Button` draws the same arc inside a control that already
 * says it is busy. Two live regions for one wait is a defect, not a feature.
 */
export function SpinnerArc({
  className,
  size = SPINNER_ARC.defaultSize,
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, "size"> & { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(SPINNER_ARC.className, className)}
      fill="none"
      // The size is an attribute as well as a class. An `svg` with neither is
      // a replaced element with no intrinsic size, and stretches to whatever
      // holds it — which is what happened the moment lucide's icon, whose own
      // `width`/`height` attributes had been carrying this, was replaced. A
      // browser without `@scope`, where the utility layer does not reach,
      // would have drawn a spinner as wide as the panel around it.
      height={size}
      viewBox={SPINNER_ARC.viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* From the top, three quarters of the way round. The large-arc flag is
          set because the sweep is over half a turn. */}
      <path
        d={SPINNER_ARC.path}
        stroke="currentColor"
        strokeLinecap={SPINNER_ARC.strokeLinecap}
        strokeWidth={SPINNER_ARC.strokeWidth}
      />
    </svg>
  );
}
