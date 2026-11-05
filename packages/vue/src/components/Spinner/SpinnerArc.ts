import { h } from "vue";
import { cn, SPINNER_ARC } from "#kozmos-recipes";

/**
 * The system's loading mark, as React's SpinnerArc draws it: one arc, three
 * quarters of a circle in the icons' 24 box, in `currentColor`. Internal, as
 * React's is: `Button` draws it inside a control that already says it is busy,
 * so it is hidden from assistive technology. The size is an attribute as well
 * as a class, so a browser without `@scope` still draws it at its size.
 */
export function spinnerArc({
  className,
  size = SPINNER_ARC.defaultSize,
}: {
  className?: string;
  size?: number;
}) {
  return h(
    "svg",
    {
      "aria-hidden": "true",
      class: cn(SPINNER_ARC.className, className),
      fill: "none",
      height: size,
      viewBox: SPINNER_ARC.viewBox,
      width: size,
      xmlns: "http://www.w3.org/2000/svg",
    },
    [
      h("path", {
        d: SPINNER_ARC.path,
        stroke: "currentColor",
        "stroke-linecap": SPINNER_ARC.strokeLinecap,
        "stroke-width": SPINNER_ARC.strokeWidth,
      }),
    ],
  );
}
