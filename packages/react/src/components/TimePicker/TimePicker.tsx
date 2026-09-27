import React from "react";
import { Clock } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

export interface TimePickerProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  description?: React.ReactNode;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  status?: InputStatus;
  wrapperClassName?: string;
}

function describedByIds({
  description,
  descriptionId,
  error,
  errorId,
  helperId,
  helperText,
}: {
  description?: React.ReactNode;
  descriptionId?: string;
  error?: boolean | string;
  errorId?: string;
  helperId?: string;
  helperText?: string;
}) {
  return [
    description ? descriptionId : null,
    error && typeof error === "string" ? errorId : helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ");
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      className,
      description,
      disabled,
      error,
      helperText,
      id,
      label,
      onChange,
      required,
      status = "default",
      wrapperClassName,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const defaultInputId = React.useId();
    const descriptionId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const inputId = id || defaultInputId;
    const resolvedStatus: InputStatus = error ? "error" : status;
    const describedBy = describedByIds({
      description,
      descriptionId,
      error,
      errorId,
      helperId,
      helperText,
    });

    return (
      <FieldWrapper
        className={wrapperClassName}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        inputId={inputId}
        label={label}
        required={required}
        status={resolvedStatus}
      >
        <div className="kozmos-reset kozmos-temporal-field">
          <Clock
            aria-hidden="true"
            className="kozmos-reset kozmos-temporal-icon"
          />
          <input
            ref={ref}
            id={inputId}
            type="time"
            aria-describedby={mergeAriaIds(ariaDescribedBy, describedBy)}
            aria-invalid={resolvedStatus === "error" ? true : ariaInvalid}
            className={cn(
              inputVariants({ status: resolvedStatus }),
              "kozmos-temporal-input kozmos-time-input",
              className,
            )}
            disabled={disabled}
            required={required}
            onChange={(event) => {
              trackEvent("TimePicker", "time_selected", {
                value: event.target.value,
              });
              onChange?.(event);
            }}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  },
);
TimePicker.displayName = "TimePicker";

export { TimePicker };
