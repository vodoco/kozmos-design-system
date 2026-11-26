import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { useKozmosAnalytics } from "../../utils/analytics";
// The recipe is shared with Vue's KozmosSlider (recipes/slider.ts).
import {
  SLIDER_READOUT_CLASS,
  SLIDER_READOUT_SEPARATOR,
  SLIDER_TOOLTIP_CLASS,
  SLIDER_TRACK_CLASS,
  sliderClass,
  sliderFallbackValue,
  sliderRangeClass,
  sliderRowClass,
  sliderThumbClass,
  sliderThumbCount,
  sliderThumbLabel,
} from "../../recipes/slider";

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
  /**
   * Show the current value as a readout at the slider's end, at rest as well
   * as while it moves (GAP-163). A range shows its two ends, "20 – 80". The
   * readout is drawn for the eye only: the thumb says the value, as
   * `formatValue` words it when that returns text.
   */
  showValue?: boolean;
  /**
   * Render the value: `(v) => v + "%"` shows a percentage. Defaults to the
   * number. When it returns a string or a number, the thumb says that to a
   * screen reader in place of the bare number (`aria-valuetext`).
   */
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
      showValue = false,
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
    const inferredThumbCount = sliderThumbCount({
      thumbCount,
      value: props.value,
      defaultValue: props.defaultValue,
    });
    const thumbs = Array.from({ length: inferredThumbCount });

    const min = typeof props.min === "number" ? props.min : 0;
    const max = typeof props.max === "number" ? props.max : 100;
    const fallbackDefaultValue = sliderFallbackValue({
      thumbCount,
      count: inferredThumbCount,
      value: props.value,
      defaultValue: props.defaultValue,
      min,
      max,
    });

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
    const shown = (index: number) => {
      const value = liveValue[index] ?? min;
      return formatValue ? formatValue(value) : value;
    };
    // What the thumb says: the words the readout and the bubble show, when
    // they are words. A node cannot be said, so the bare number stays.
    const spoken = (index: number) => {
      if (!formatValue) return undefined;
      const text = formatValue(liveValue[index] ?? min);
      return typeof text === "string" || typeof text === "number"
        ? String(text)
        : undefined;
    };

    // The readout lies beside the track, at the row's end, so the thumbs keep
    // their places on the track: inside the slider it would shorten the
    // range the thumbs are placed against. Hidden from screen readers, which
    // hear the value from the thumb, so it is not said twice.
    const wrapWithReadout = (slider: React.ReactElement) =>
      showValue ? (
        <div className={sliderRowClass(className)}>
          {slider}
          <span
            aria-hidden="true"
            className={SLIDER_READOUT_CLASS}
            data-disabled={props.disabled ? "" : undefined}
          >
            {thumbs.map((_, index) => (
              <React.Fragment key={index}>
                {index > 0 ? SLIDER_READOUT_SEPARATOR : null}
                {shown(index)}
              </React.Fragment>
            ))}
          </span>
        </div>
      ) : (
        slider
      );

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        label={label}
        inputId={inputId}
        className={wrapperClassName}
      >
        {wrapWithReadout(
          <SliderPrimitive.Root
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={hasError && isStringError ? errorId : undefined}
            // With a readout, the caller's class sizes the row, and the
            // slider takes what the readout leaves.
            className={sliderClass({ hasError, showValue, className })}
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
            <SliderPrimitive.Track className={SLIDER_TRACK_CLASS}>
              <SliderPrimitive.Range className={sliderRangeClass(hasError)} />
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
                aria-valuetext={spoken(index)}
                aria-label={sliderThumbLabel({
                  index,
                  count: inferredThumbCount,
                  thumbLabels,
                  single: ariaLabel ?? label,
                })}
                className={sliderThumbClass(hasError)}
                onBlur={() => setHoveredThumb(null)}
                onFocus={() => setHoveredThumb(index)}
                onPointerDown={() => setDraggingThumb(index)}
                onPointerEnter={() => setHoveredThumb(index)}
                onPointerLeave={() => setHoveredThumb(null)}
              >
                {showValueTooltip &&
                (hoveredThumb === index || draggingThumb === index) ? (
                  <span
                    // pointer-events-none: a bubble that eats the pointer
                    // ends the drag the moment it appears.
                    className={SLIDER_TOOLTIP_CLASS}
                    role="tooltip"
                  >
                    {shown(index)}
                  </span>
                ) : null}
              </SliderPrimitive.Thumb>
            ))}
          </SliderPrimitive.Root>,
        )}
      </FieldWrapper>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
