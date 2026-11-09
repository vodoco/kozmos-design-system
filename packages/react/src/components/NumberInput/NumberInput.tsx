import React from "react";
import { Minus, Plus } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/inputVariants";

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
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

function numericValueFromInput(input: HTMLInputElement) {
  if (input.value === "") return null;
  return Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber;
}

function stepValue(
  input: HTMLInputElement,
  direction: "decrement" | "increment",
) {
  if (direction === "increment") {
    input.stepUp();
  } else {
    input.stepDown();
  }

  return numericValueFromInput(input);
}

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
    const describedBy =
      hasError && typeof error === "string"
        ? errorId
        : helperText
          ? helperId
          : undefined;
    const stepperDisabled = disabled || readOnly;
    const stepperToneClass = {
      default: "",
      error: "kozmos-number-step-error",
      warning: "kozmos-number-step-warning",
      success: "kozmos-number-step-success",
    }[resolvedStatus];

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
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
      >
        <div className="kozmos-reset kozmos-number-field">
          {showSteppers && (
            <button
              type="button"
              aria-label="Decrease value"
              className={cn(
                "kozmos-reset kozmos-field-action kozmos-number-step kozmos-number-decrement",
                stepperToneClass,
              )}
              disabled={stepperDisabled}
              onClick={() => handleStep("decrement")}
            >
              <Minus
                className="kozmos-reset kozmos-field-action-icon"
                aria-hidden="true"
              />
            </button>
          )}
          {/* One wrapper, with a unit or without, so the input keeps its
              place in the tree as a unit comes and goes (a new parent would
              draw a new input, losing the focus and a typed value). Without
              a unit it draws no box of its own. */}
          <div
            className={
              hasUnit
                ? "kozmos-reset kozmos-number-unit-field"
                : "kozmos-number-control"
            }
            style={
              hasUnit && unitWidth !== null
                ? ({
                    "--kozmos-number-unit-width": `${unitWidth}px`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <input
              type="number"
              id={inputId}
              className={cn(
                inputVariants({ status: resolvedStatus }),
                "kozmos-number-input",
                showSteppers && "kozmos-number-with-steppers",
                hasUnit &&
                  "kozmos-number-with-unit pe-[calc(var(--kozmos-number-unit-width,1rem)_+_1rem_-_1px)]",
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
            />
            {hasUnit ? (
              <>
                <span
                  ref={unitRef}
                  aria-hidden="true"
                  className="kozmos-reset kozmos-number-unit"
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
              className={cn(
                "kozmos-reset kozmos-field-action kozmos-number-step kozmos-number-increment",
                stepperToneClass,
              )}
              disabled={stepperDisabled}
              onClick={() => handleStep("increment")}
            >
              <Plus
                className="kozmos-reset kozmos-field-action-icon"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

NumberInput.displayName = "NumberInput";
