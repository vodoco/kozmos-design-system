import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface SliderProps extends React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  thumbCount?: number;
  /**
   * Each thumb's accessible name, in order, in the product's language. Unset,
   * a single thumb takes `aria-label` or `label`, and a range's thumbs are
   * named in English: "Minimum value", "Value 2"… "Maximum value".
   */
  thumbLabels?: string[];
  wrapperClassName?: string;
  /**
   * Show the current value in a bubble on the thumb.
   *
   * The bubble is rendered *inside* `SliderPrimitive.Thumb`, which is what makes
   * it track the knob. Composing a `Tooltip` around the slider anchors to the
   * track instead, so the bubble sits still while the knob moves under it —
   * close enough to look intentional and wrong enough to be useless.
   */
  showValueTooltip?: boolean;
  /** Render the value — e.g. `(v) => `${v}%``. Defaults to the number. */
  formatValue?: (value: number) => React.ReactNode;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      label,
      error,
      thumbCount,
      thumbLabels,
      wrapperClassName,
      showValueTooltip = false,
      formatValue,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const errorId = React.useId();
    const generatedInputId = React.useId();
    const hasError = !!error;
    const isStringError = typeof error === "string";
    const inputId = props.id || generatedInputId;
    const { trackEvent } = useKozmosAnalytics();
    const inferredThumbCount = Math.max(
      1,
      thumbCount ??
        (Array.isArray(props.value) ? props.value.length : undefined) ??
        (Array.isArray(props.defaultValue)
          ? props.defaultValue.length
          : undefined) ??
        1,
    );
    const thumbs = Array.from({ length: inferredThumbCount });

    const min = typeof props.min === "number" ? props.min : 0;
    const max = typeof props.max === "number" ? props.max : 100;
    const fallbackDefaultValue =
      thumbCount &&
      !Array.isArray(props.value) &&
      !Array.isArray(props.defaultValue)
        ? Array.from({ length: inferredThumbCount }, (_, index) =>
            inferredThumbCount === 1
              ? min
              : min + ((max - min) * index) / (inferredThumbCount - 1),
          )
        : undefined;

    // Which thumb should show its bubble, and why. Hover and focus are the easy
    // half; the drag is the half that matters, because the pointer leaves the
    // thumb the moment you move faster than it does. Dragging is tracked to the
    // document so the bubble survives that, and so releasing outside the slider
    // still puts it away.
    const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null);
    const [draggingThumb, setDraggingThumb] = React.useState<number | null>(
      null,
    );

    React.useEffect(() => {
      if (draggingThumb === null) return;
      const end = () => setDraggingThumb(null);
      document.addEventListener("pointerup", end);
      document.addEventListener("pointercancel", end);
      return () => {
        document.removeEventListener("pointerup", end);
        document.removeEventListener("pointercancel", end);
      };
    }, [draggingThumb]);

    // Radix reports the value on change but never hands it back, so an
    // uncontrolled slider has to keep its own copy for the bubble to read.
    const asArray = (value: unknown): number[] | undefined =>
      Array.isArray(value)
        ? (value as number[])
        : typeof value === "number"
          ? [value]
          : undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<number[]>(
      () =>
        asArray(props.defaultValue) ?? asArray(fallbackDefaultValue) ?? [min],
    );
    const liveValue = asArray(props.value) ?? uncontrolledValue;

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        label={label}
        inputId={inputId}
        className={wrapperClassName}
      >
        <SliderPrimitive.Root
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={hasError && isStringError ? errorId : undefined}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            hasError && "ring-1 ring-destructive rounded-pill",
            className,
          )}
          {...props}
          defaultValue={props.defaultValue ?? fallbackDefaultValue}
          onValueChange={(value) => {
            setUncontrolledValue(value);
            props.onValueChange?.(value);
          }}
          onValueCommit={(value) => {
            trackEvent("Slider", "slider_value_changed", { value });
            props.onValueCommit?.(value);
          }}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-pill border border-input bg-secondary">
            <SliderPrimitive.Range
              className={cn(
                "absolute h-full bg-primary",
                hasError && "bg-destructive",
              )}
            />
          </SliderPrimitive.Track>
          {thumbs.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              aria-labelledby={
                thumbLabels?.[index] ? undefined : ariaLabelledBy
              }
              aria-describedby={mergeAriaIds(
                ariaDescribedBy,
                hasError && isStringError ? errorId : undefined,
              )}
              aria-invalid={hasError || ariaInvalid}
              aria-label={
                thumbLabels?.[index] ??
                (inferredThumbCount > 1
                  ? index === 0
                    ? "Minimum value"
                    : index === inferredThumbCount - 1
                      ? "Maximum value"
                      : `Value ${index + 1}`
                  : (ariaLabel ?? label))
              }
              className={cn(
                "relative block h-5 w-5 rounded-pill border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                hasError && "border-destructive",
              )}
              onBlur={() => setHoveredThumb(null)}
              onFocus={() => setHoveredThumb(index)}
              onPointerDown={() => setDraggingThumb(index)}
              onPointerEnter={() => setHoveredThumb(index)}
              onPointerLeave={() => setHoveredThumb(null)}
            >
              {showValueTooltip &&
              (hoveredThumb === index || draggingThumb === index) ? (
                <span
                  // pointer-events-none matters: the bubble sits directly above
                  // the knob, and a bubble that eats the pointer ends the drag
                  // the moment it appears.
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-control border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-overlay"
                  role="tooltip"
                >
                  {formatValue
                    ? formatValue(liveValue[index] ?? min)
                    : (liveValue[index] ?? min)}
                </span>
              ) : null}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>
      </FieldWrapper>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
