import React from "react";
import { Minus, Plus } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper, type MixedValueProps } from "../FieldWrapper";
import { mixedFieldValue, useMixedField } from "../FieldWrapper/mixedValue";
import { inputVariants, type InputStatus } from "../Input/inputVariants";
import { fieldDescribedBy } from "../../recipes/field";
import { FIELD_ACTION_ICON_CLASS } from "../../recipes/input";
import {
  NUMBER_CONTROL_CLASS,
  NUMBER_DECREMENT_CLASS,
  NUMBER_FIELD_CLASS,
  NUMBER_INCREMENT_CLASS,
  NUMBER_INPUT_CLASS,
  NUMBER_STEP_TONE_CLASSES,
  NUMBER_UNIT_CLASS,
  NUMBER_UNIT_FIELD_CLASS,
  NUMBER_WITH_STEPPERS_CLASS,
  NUMBER_WITH_UNIT_CLASS,
  numberUnitWidth,
  numericValueFromInput,
  stepValue,
} from "../../recipes/number-input";

export interface NumberInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    MixedValueProps {
  error?: boolean | string;
  helperText?: string;
  label?: string;
  onValueChange?: (value: number | null) => void;
  showSteppers?: boolean;
  status?: InputStatus;
  wrapperClassName?: string;
  /**
   * A unit drawn inside the field after the value, "m" or "%" (GAP-098). It
   * is never part of the value, and it is read after the value, as
   * `unitLabel` when one is given.
   */
  unit?: string;
  /** The unit's spoken name, in the page's language: "metres" for "m". */
  unitLabel?: string;
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      disabled,
      error,
      helperText,
      label,
      onChange,
      onValueChange,
      readOnly,
      showSteppers = true,
      status = "default",
      wrapperClassName,
      mixed = false,
      mixedLabel = "Multiple values",
      onResetMixed,
      resetMixedLabel,
      unit,
      unitLabel,
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const unitRef = React.useRef<HTMLSpanElement | null>(null);
    const unitId = React.useId();
    const hasUnit = Boolean(unit);
    // The text keeps clear of the unit, whatever its length: the room is the
    // unit's own width, measured, so "m" and "km/h" each get theirs.
    const [unitWidth, setUnitWidth] = React.useState<number | null>(null);
    useIsomorphicLayoutEffect(() => {
      const node = unitRef.current;
      if (!node) return undefined;
      const measure = () => setUnitWidth(node.getBoundingClientRect().width);
      measure();
      if (typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [unit]);
    const errorId = React.useId();
    const helperId = React.useId();
    const defaultInputId = React.useId();
    const inputId = props.id || defaultInputId;
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const isInvalid = resolvedStatus === "error";
    const describedBy = fieldDescribedBy({
      error,
      errorId,
      helperText,
      helperId,
    });
    // Mixed, a step would start from nothing and write that number over
    // every selected feature's own: the steppers wait for a typed edit.
    // What the visitor types into a mixed field, kept as typed until the
    // field loses focus (GAP-153). The field stays a text field meanwhile:
    // turned into a number field by the product's first value, it would
    // drop a "-" or a "-0." the visitor is still typing ("-5" became 5).
    const [draft, setDraft] = React.useState<string | null>(null);
    const [wasMixed, setWasMixed] = React.useState(mixed);
    if (wasMixed !== mixed) {
      setWasMixed(mixed);
      // Back to mixed (a reset): the typed text is gone.
      if (mixed) setDraft(null);
    }
    const asText = mixed || draft !== null;
    const stepperDisabled = disabled || readOnly || asText;
    const mixedField = useMixedField(mixed, props.value);
    const stepperToneClass = NUMBER_STEP_TONE_CLASSES[resolvedStatus];

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        mixedField.field.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, mixedField.field],
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      if (asText) {
        // A mixed field reports a value only once the text is a number:
        // "-", "." or "-." report nothing, so the product keeps every
        // feature's own value until there is one to write over it.
        const text = event.currentTarget.value;
        setDraft(text);
        const typed =
          text.trim() === ""
            ? null
            : numericValueFromInput(event.currentTarget);
        if (typed !== null) onValueChange?.(typed);
        return;
      }
      onValueChange?.(numericValueFromInput(event.currentTarget));
    };

    const handleStep = (direction: "decrement" | "increment") => {
      const input = internalRef.current;
      if (!input || stepperDisabled) return;

      const previousValue = input.value;
      let value: number | null;
      try {
        value = stepValue(input, direction);
      } catch {
        value = numericValueFromInput(input);
      } finally {
        // Native stepping mutates the DOM. A controlled field only displays a
        // new value when the parent accepts it, just like native typing in React.
        if (props.value !== undefined) input.value = previousValue;
      }
      // Consumer exceptions must not be mistaken for native stepping failures.
      onValueChange?.(value);
    };

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        label={label}
        inputId={inputId}
        status={resolvedStatus}
        className={wrapperClassName}
        mixed={mixed}
        onResetMixed={
          onResetMixed && !disabled && !readOnly
            ? () => {
                mixedField.clear();
                onResetMixed();
              }
            : undefined
        }
        resetMixedLabel={resetMixedLabel}
      >
        <div className={NUMBER_FIELD_CLASS}>
          {showSteppers && (
            <button
              type="button"
              aria-label="Decrease value"
              className={cn(NUMBER_DECREMENT_CLASS, stepperToneClass)}
              disabled={stepperDisabled}
              onClick={() => handleStep("decrement")}
            >
              <Minus className={FIELD_ACTION_ICON_CLASS} aria-hidden="true" />
            </button>
          )}
          {/* One wrapper, with a unit or without, so the input keeps its
              place in the tree as a unit comes and goes (a new parent would
              draw a new input, losing the focus and a typed value). Without
              a unit it draws no box of its own. */}
          <div
            className={hasUnit ? NUMBER_UNIT_FIELD_CLASS : NUMBER_CONTROL_CLASS}
            style={
              hasUnit
                ? ({
                    // Before it is measured (a server render, the first
                    // paint), the room is the unit's length in the font's
                    // "0" widths, a wide character two, so a long unit is not run under; then its
                    // measured width.
                    "--kozmos-number-unit-width": numberUnitWidth(
                      unit ?? "",
                      unitWidth,
                    ),
                  } as React.CSSProperties)
                : undefined
            }
          >
            <input
              // Mixed (GAP-153), a text field with the numeric keyboard, not
              // a spinbutton: the arrow keys, Page Up and Down, the wheel and
              // a screen reader's increment would each step it from nothing
              // and write that number over every selected feature's own.
              // Typing a number is the edit; the product then clears
              // `mixed`. The unit stays drawn: it says what to type.
              type={asText ? "text" : "number"}
              inputMode={asText ? "decimal" : undefined}
              id={inputId}
              className={cn(
                inputVariants({ status: resolvedStatus }),
                NUMBER_INPUT_CLASS,
                showSteppers && NUMBER_WITH_STEPPERS_CLASS,
                hasUnit && NUMBER_WITH_UNIT_CLASS,
                className,
              )}
              ref={setRefs}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={isInvalid ? true : callerInvalid}
              // The unit is read after the value, first among the
              // descriptions; the drawn unit is hidden, so it is read once.
              aria-describedby={mergeAriaIds(
                hasUnit ? unitId : undefined,
                callerDescribedBy,
                describedBy,
              )}
              onChange={handleChange}
              {...props}
              {...mixedFieldValue(mixed, mixedLabel, props)}
              {...(draft !== null && props.value !== undefined
                ? { value: draft }
                : null)}
              onBlur={(event) => {
                setDraft(null);
                props.onBlur?.(event);
              }}
            />
            {hasUnit ? (
              <>
                <span
                  ref={unitRef}
                  aria-hidden="true"
                  className={NUMBER_UNIT_CLASS}
                  data-disabled={disabled ? "" : undefined}
                >
                  {unit}
                </span>
                <span id={unitId} hidden>
                  {unitLabel ?? unit}
                </span>
              </>
            ) : null}
          </div>
          {showSteppers && (
            <button
              type="button"
              aria-label="Increase value"
              className={cn(NUMBER_INCREMENT_CLASS, stepperToneClass)}
              disabled={stepperDisabled}
              onClick={() => handleStep("increment")}
            >
              <Plus className={FIELD_ACTION_ICON_CLASS} aria-hidden="true" />
            </button>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

NumberInput.displayName = "NumberInput";
