import React from "react";
import { Anchor as PopoverAnchor } from "@radix-ui/react-popover";
import { Calendar, ChevronDown, ChevronUp } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Calendar as MonthCalendar } from "../Calendar/Calendar";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";
import { typeInto, useCanReplaceDatePicker } from "./date-picker-engine";

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
  /**
   * Whether Kozmos's calendar is open, with `onOpenChange`. It opens from the
   * field's button, or Alt+Down Arrow or F4 in the field, where the browser's
   * own picker button can be hidden (Chromium, Edge, Safari). Where it cannot
   * (Firefox 146), the field is the browser's, its picker with it, and these
   * do nothing; once it can, the same props open Kozmos's.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Names the button that opens the calendar, and the calendar. */
  chooseDateLabel?: string;
  /** The calendar's locale; the browser's still formats the typed date. */
  locale?: string;
  /** Days the calendar shows but cannot choose. Typing is the caller's to check. */
  isDateUnavailable?: (date: string) => boolean;
  /** The day the calendar draws as today, `YYYY-MM-DD`. */
  today?: string;
  /** The calendar's previous-month button's name. */
  previousMonthLabel?: string;
  /** The calendar's next-month button's name. */
  nextMonthLabel?: string;
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
      chooseDateLabel = "Choose date",
      className,
      defaultOpen,
      description,
      disabled,
      error,
      helperText,
      id,
      isDateUnavailable,
      label,
      locale,
      nextMonthLabel,
      onChange,
      onKeyDown,
      onOpenChange,
      open: openProp,
      previousMonthLabel,
      readOnly,
      required,
      status = "default",
      today,
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
    const kozmos = useCanReplaceDatePicker();
    const input = React.useRef<HTMLInputElement | null>(null);
    const content = React.useRef<HTMLDivElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] =
      React.useState(!!defaultOpen);
    const locked = disabled || readOnly;
    const open = kozmos && !locked && (openProp ?? uncontrolledOpen);
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    const setRef = (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const field = (
      <div className="kozmos-reset kozmos-temporal-field">
        <Calendar
          aria-hidden="true"
          className="kozmos-reset kozmos-temporal-icon"
        />
        <input
          ref={setRef}
          id={inputId}
          type="date"
          aria-describedby={mergeAriaIds(ariaDescribedBy, describedBy)}
          aria-invalid={resolvedStatus === "error" ? true : ariaInvalid}
          className={cn(
            inputVariants({ status: resolvedStatus }),
            "kozmos-temporal-input",
            // Room for the button, as PasswordInput keeps for its toggle.
            kozmos &&
              "kozmos-date-input pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]",
            className,
          )}
          data-picker={kozmos ? "kozmos" : undefined}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={(event) => {
            trackEvent("DatePicker", "date_selected", {
              value: event.target.value,
            });
            onChange?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            // Chromium opens its own picker on these, button hidden or not.
            if (
              kozmos &&
              !locked &&
              !event.defaultPrevented &&
              ((event.altKey && event.key === "ArrowDown") ||
                event.key === "F4")
            ) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          {...props}
        />
        {kozmos && (
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={chooseDateLabel}
              className="kozmos-reset kozmos-field-action kozmos-date-picker-trigger"
              disabled={locked}
            >
              {open ? (
                <ChevronUp
                  aria-hidden="true"
                  className="kozmos-reset kozmos-field-action-icon"
                />
              ) : (
                <ChevronDown
                  aria-hidden="true"
                  className="kozmos-reset kozmos-field-action-icon"
                />
              )}
            </button>
          </PopoverTrigger>
        )}
      </div>
    );
    const current =
      input.current?.value ?? String(props.value ?? props.defaultValue ?? "");

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
        {kozmos ? (
          // A modal dialog, as the WAI-ARIA date picker dialog is: focus goes
          // to the chosen day, or today, stays in the calendar, and returns
          // to the button on Escape or a choice.
          <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverAnchor asChild>{field}</PopoverAnchor>
            <PopoverContent
              ref={content}
              align="start"
              sideOffset={6}
              aria-label={label || chooseDateLabel}
              aria-modal="true"
              className="kozmos-date-picker-panel"
              onOpenAutoFocus={(event) => {
                const day = content.current?.querySelector<HTMLElement>(
                  '[data-day][tabindex="0"]',
                );
                if (!day) return;
                event.preventDefault();
                day.focus();
              }}
            >
              <MonthCalendar
                value={current || null}
                min={typeof props.min === "string" ? props.min : undefined}
                max={typeof props.max === "string" ? props.max : undefined}
                isDateUnavailable={isDateUnavailable}
                locale={locale}
                today={today}
                previousMonthLabel={previousMonthLabel}
                nextMonthLabel={nextMonthLabel}
                onValueChange={(value) => {
                  if (input.current) typeInto(input.current, value);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        ) : (
          field
        )}
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
