import React from "react";
import { Minus, Plus } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

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
}

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
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);
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
          <input
            type="number"
            id={inputId}
            className={cn(
              inputVariants({ status: resolvedStatus }),
              "kozmos-number-input",
              showSteppers && "kozmos-number-with-steppers",
              className,
            )}
            ref={setRefs}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={isInvalid ? true : callerInvalid}
            aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
            onChange={handleChange}
            {...props}
          />
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
