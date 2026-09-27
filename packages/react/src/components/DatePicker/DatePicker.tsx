import React from "react";
import { Calendar } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

export interface DatePickerProps extends Omit<
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

export interface DateRangeValue {
  end?: string;
  start?: string;
}

export interface DateRangePickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  defaultValue?: DateRangeValue;
  description?: React.ReactNode;
  disabled?: boolean;
  endLabel?: string;
  endName?: string;
  endPlaceholder?: string;
  endValue?: string;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  max?: string;
  min?: string;
  onRangeChange?: (value: DateRangeValue) => void;
  onValueChange?: (value: DateRangeValue) => void;
  readOnly?: boolean;
  required?: boolean;
  startLabel?: string;
  startName?: string;
  startPlaceholder?: string;
  startValue?: string;
  status?: InputStatus;
  value?: DateRangeValue;
  wrapperClassName?: string;
}

function fieldDescriptionIds({
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

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
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
    const hasError = !!error;
    const resolvedStatus: InputStatus = hasError ? "error" : status;
    const describedBy = fieldDescriptionIds({
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
          <Calendar
            aria-hidden="true"
            className="kozmos-reset kozmos-temporal-icon"
          />
          <input
            ref={ref}
            id={inputId}
            type="date"
            aria-describedby={mergeAriaIds(ariaDescribedBy, describedBy)}
            aria-invalid={resolvedStatus === "error" ? true : ariaInvalid}
            className={cn(
              inputVariants({ status: resolvedStatus }),
              "kozmos-temporal-input",
              className,
            )}
            disabled={disabled}
            required={required}
            onChange={(event) => {
              trackEvent("DatePicker", "date_selected", {
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

DatePicker.displayName = "DatePicker";

const DateRangePicker = React.forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      className,
      autoFocus,
      defaultValue,
      description,
      disabled,
      endLabel = "End date",
      endName,
      endPlaceholder,
      endValue,
      error,
      helperText,
      id,
      label,
      max,
      min,
      onRangeChange,
      onValueChange,
      readOnly,
      required,
      startLabel = "Start date",
      startName,
      startPlaceholder,
      startValue,
      status = "default",
      value,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const defaultFieldId = React.useId();
    const descriptionId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const startId = React.useId();
    const endId = React.useId();
    const fieldId = id || defaultFieldId;
    const resolvedStatus: InputStatus = error ? "error" : status;
    const describedBy = fieldDescriptionIds({
      description,
      descriptionId,
      error,
      errorId,
      helperId,
      helperText,
    });
    const isStartControlled =
      value?.start !== undefined || startValue !== undefined;
    const isEndControlled = value?.end !== undefined || endValue !== undefined;
    const [uncontrolledRange, setUncontrolledRange] =
      React.useState<DateRangeValue>(
        defaultValue || { end: endValue, start: startValue },
      );
    const range = {
      end: value?.end ?? endValue ?? uncontrolledRange.end ?? "",
      start: value?.start ?? startValue ?? uncontrolledRange.start ?? "",
    };

    const setRange = (next: DateRangeValue) => {
      setUncontrolledRange((current) => ({
        end: isEndControlled ? current.end : next.end,
        start: isStartControlled ? current.start : next.start,
      }));
      trackEvent("DateRangePicker", "date_range_changed", next);
      onValueChange?.(next);
      onRangeChange?.(next);
    };

    return (
      <FieldWrapper
        className={wrapperClassName}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        group
        label={label}
        required={required}
        status={resolvedStatus}
      >
        <div
          ref={ref}
          id={fieldId}
          className={cn("kozmos-reset kozmos-date-range", className)}
          {...props}
        >
          <label
            className="kozmos-reset kozmos-date-range-label"
            htmlFor={startId}
          >
            <span className="kozmos-reset">{startLabel}</span>
            <div className="kozmos-reset kozmos-temporal-field">
              <Calendar
                aria-hidden="true"
                className="kozmos-reset kozmos-temporal-icon"
              />
              <input
                id={startId}
                type="date"
                aria-describedby={describedBy || undefined}
                aria-invalid={resolvedStatus === "error" || undefined}
                className={cn(
                  inputVariants({ status: resolvedStatus }),
                  "kozmos-temporal-input",
                )}
                disabled={disabled}
                max={
                  range.end && max
                    ? range.end < max
                      ? range.end
                      : max
                    : range.end || max
                }
                min={min}
                name={startName}
                placeholder={startPlaceholder}
                readOnly={readOnly}
                required={required}
                autoFocus={autoFocus}
                value={range.start}
                onChange={(event) =>
                  setRange({ ...range, start: event.target.value })
                }
              />
            </div>
          </label>
          <label
            className="kozmos-reset kozmos-date-range-label"
            htmlFor={endId}
          >
            <span className="kozmos-reset">{endLabel}</span>
            <div className="kozmos-reset kozmos-temporal-field">
              <Calendar
                aria-hidden="true"
                className="kozmos-reset kozmos-temporal-icon"
              />
              <input
                id={endId}
                type="date"
                aria-describedby={describedBy || undefined}
                aria-invalid={resolvedStatus === "error" || undefined}
                className={cn(
                  inputVariants({ status: resolvedStatus }),
                  "kozmos-temporal-input",
                )}
                disabled={disabled}
                max={max}
                min={
                  range.start && min
                    ? range.start > min
                      ? range.start
                      : min
                    : range.start || min
                }
                name={endName}
                placeholder={endPlaceholder}
                readOnly={readOnly}
                required={required}
                value={range.end}
                onChange={(event) =>
                  setRange({ ...range, end: event.target.value })
                }
              />
            </div>
          </label>
        </div>
      </FieldWrapper>
    );
  },
);

DateRangePicker.displayName = "DateRangePicker";

export { DatePicker, DateRangePicker };
