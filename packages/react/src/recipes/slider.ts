/**
 * Slider's recipe: the slider, its track, range, thumbs, value bubble and
 * readout (GAP-163), how many thumbs it draws and what each is named, for
 * every framework that draws one. React's `Slider` (on Radix) and Vue's
 * `KozmosSlider` build the same elements from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";

/**
 * The slider. With a readout, the caller's class sizes the row, and the
 * slider takes what the readout leaves; without one, it is the slider's.
 */
export function sliderClass({
  hasError,
  showValue,
  className,
}: {
  hasError: boolean;
  showValue: boolean;
  className?: string;
}) {
  return cn(
    "relative flex w-full touch-none select-none items-center",
    hasError && "ring-1 ring-destructive rounded-pill",
    showValue ? "min-w-0 flex-1" : className,
  );
}

/**
 * The row the readout lies in, beside the track at the slider's end, so the
 * thumbs keep their places on the track: inside the slider it would shorten
 * the range the thumbs are placed against.
 */
export function sliderRowClass(className?: string) {
  return cn("kozmos-reset kozmos-slider-row", className);
}

/** The readout: the value at rest, for the eye only. */
export const SLIDER_READOUT_CLASS = "kozmos-reset kozmos-slider-readout";

/** Between a range's two ends in the readout: "20 – 80". */
export const SLIDER_READOUT_SEPARATOR = " – ";

/** The track the range fills. */
export const SLIDER_TRACK_CLASS =
  "relative h-2 w-full grow overflow-hidden rounded-pill border border-input bg-secondary";

/** The range: the track filled from the start, or between a range's thumbs. */
export function sliderRangeClass(hasError: boolean) {
  return cn("absolute h-full bg-primary", hasError && "bg-destructive");
}

/** A thumb. */
export function sliderThumbClass(hasError: boolean) {
  return cn(
    "relative block h-5 w-5 rounded-pill border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    hasError && "border-destructive",
  );
}

/**
 * The value bubble on a thumb, drawn inside it so it tracks the knob.
 * pointer-events-none matters: the bubble sits directly above the knob, and
 * a bubble that eats the pointer ends the drag the moment it appears.
 */
export const SLIDER_TOOLTIP_CLASS =
  "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-control border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-overlay";

/**
 * How many thumbs the slider draws: `thumbCount`, else as many as the value
 * or the default value holds, and at least one.
 */
export function sliderThumbCount({
  thumbCount,
  value,
  defaultValue,
}: {
  thumbCount?: number;
  value?: unknown;
  defaultValue?: unknown;
}) {
  return Math.max(
    1,
    thumbCount ??
      (Array.isArray(value) ? value.length : undefined) ??
      (Array.isArray(defaultValue) ? defaultValue.length : undefined) ??
      1,
  );
}

/**
 * Where a slider given `thumbCount` and no value starts: its thumbs spread
 * evenly from `min` to `max` (one thumb at `min`). Undefined otherwise.
 */
export function sliderFallbackValue({
  thumbCount,
  count,
  value,
  defaultValue,
  min,
  max,
}: {
  thumbCount?: number;
  count: number;
  value?: unknown;
  defaultValue?: unknown;
  min: number;
  max: number;
}) {
  return thumbCount && !Array.isArray(value) && !Array.isArray(defaultValue)
    ? Array.from({ length: count }, (_, index) =>
        count === 1 ? min : min + ((max - min) * index) / (count - 1),
      )
    : undefined;
}

/**
 * A thumb's accessible name: the product's own (`thumbLabels`), else a
 * single thumb's `aria-label` or label, and a range's thumbs named in
 * English: "Minimum value", "Value 2"… "Maximum value".
 */
export function sliderThumbLabel({
  index,
  count,
  thumbLabels,
  single,
}: {
  index: number;
  count: number;
  thumbLabels?: string[];
  single?: string;
}) {
  return (
    thumbLabels?.[index] ??
    (count > 1
      ? index === 0
        ? "Minimum value"
        : index === count - 1
          ? "Maximum value"
          : `Value ${index + 1}`
      : single)
  );
}
