import React from "react";
import { Anchor as PopoverAnchor } from "@radix-ui/react-popover";
import { Calendar, ChevronDown, ChevronUp } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Calendar as MonthCalendar } from "../Calendar/Calendar";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/inputVariants";
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
  /**
   * The start and end fields' labels are read, not shown: the range's one
   * `label` names it, for a one-line filter bar (GAP-051).
   */
  hideFieldLabels?: boolean;
  /**
   * Whether Kozmos's range calendar is open, with `onOpenChange`. Each
   * field's button opens it, as Alt+Down Arrow or F4 in a field do, where the
   * browser's own picker button can give way (Chromium, Edge, Safari); where
   * it cannot (Firefox 146), the fields are the browser's and these do
   * nothing.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Names each field's button, which the field's label describes. */
  chooseDatesLabel?: string;
  /** Two months side by side, or one; by default two where the window has room. */
  months?: 1 | 2;
  /** The calendar's locale; the browser's still formats the typed dates. */
  locale?: string;
  /** Days the calendar shows but cannot start or end the range on. */
  isDateUnavailable?: (date: string) => boolean;
  /** The day the calendar draws as today, `YYYY-MM-DD`. */
  today?: string;
  /** The calendar's previous-month button's name. */
  previousMonthLabel?: string;
  /** The calendar's next-month button's name. */
  nextMonthLabel?: string;
}

/** The two months the range panel shows side by side, 12 apart, 12 inside. */
const TWO_MONTHS_WIDTH = 2 * (7 * 40 + 6 * 4) + 12 + 2 * 12 + 2;

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
      chooseDatesLabel = "Choose dates",
      defaultOpen,
      defaultValue,
      description,
      disabled,
      endLabel = "End date",
      endName,
      endPlaceholder,
      endValue,
      error,
      helperText,
      hideFieldLabels,
      id,
      isDateUnavailable,
      label,
      locale,
      max,
      min,
      months: monthsProp,
      nextMonthLabel,
      onOpenChange,
      onRangeChange,
      onValueChange,
      open: openProp,
      previousMonthLabel,
      readOnly,
      required,
      startLabel = "Start date",
      startName,
      startPlaceholder,
      startValue,
      status = "default",
      today,
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
    const labelIds = { start: React.useId(), end: React.useId() };
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

    const kozmos = useCanReplaceDatePicker();
    const group = React.useRef<HTMLDivElement | null>(null);
    const content = React.useRef<HTMLDivElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] =
      React.useState(!!defaultOpen);
    // The field whose button or keys opened it, which focus returns to.
    const [from, setFrom] = React.useState<"start" | "end">("start");
    const [roomy, setRoomy] = React.useState(true);
    const locked = disabled || readOnly;
    const open = kozmos && !locked && (openProp ?? uncontrolledOpen);
    const setOpen = (next: boolean) => {
      if (next)
        setRoomy(
          (group.current?.ownerDocument.defaultView?.innerWidth ?? Infinity) >=
            TWO_MONTHS_WIDTH + 16,
        );
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    const months = monthsProp ?? (roomy ? 2 : 1);
    const setRefs = (node: HTMLDivElement | null) => {
      group.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const field = (end: boolean) => {
      const which = end ? "end" : "start";
      const fieldLabel = end ? endLabel : startLabel;
      const inputId = end ? endId : startId;
      const input = (
        <input
          id={inputId}
          type="date"
          aria-describedby={describedBy || undefined}
          aria-invalid={resolvedStatus === "error" || undefined}
          className={cn(
            inputVariants({ status: resolvedStatus }),
            "kozmos-temporal-input",
            kozmos &&
              "kozmos-date-input pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]",
          )}
          data-picker={kozmos ? "kozmos" : undefined}
          disabled={disabled}
          max={
            end
              ? max
              : range.end && max
                ? range.end < max
                  ? range.end
                  : max
                : range.end || max
          }
          min={
            end
              ? range.start && min
                ? range.start > min
                  ? range.start
                  : min
                : range.start || min
              : min
          }
          name={end ? endName : startName}
          placeholder={end ? endPlaceholder : startPlaceholder}
          readOnly={readOnly}
          required={required}
          autoFocus={end ? undefined : autoFocus}
          value={end ? range.end : range.start}
          onChange={(event) =>
            setRange({ ...range, [which]: event.target.value })
          }
          onKeyDown={(event) => {
            // Chromium opens its own picker on these, button hidden or not.
            if (
              kozmos &&
              !locked &&
              ((event.altKey && event.key === "ArrowDown") ||
                event.key === "F4")
            ) {
              event.preventDefault();
              setFrom(which);
              setOpen(true);
            }
          }}
        />
      );
      const box = (
        <div className="kozmos-reset kozmos-temporal-field">
          <Calendar
            aria-hidden="true"
            className="kozmos-reset kozmos-temporal-icon"
          />
          {input}
          {kozmos && (
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={chooseDatesLabel}
                aria-describedby={labelIds[which]}
                className="kozmos-reset kozmos-field-action kozmos-date-picker-trigger"
                disabled={locked}
                // Radix toggles on click; the field it opened from is the
                // one focus returns to.
                onPointerDown={() => setFrom(which)}
                onKeyDown={() => setFrom(which)}
              >
                {open && from === which ? (
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
      // Hidden, the label is out of the grid's rows, so no gap stays above
      // the field. The browser's fields (Firefox) keep the markup they
      // always had; a button cannot sit inside a <label>, so Kozmos's fields
      // label their input beside it.
      const hidden = cn("kozmos-reset", hideFieldLabels && "sr-only");
      return kozmos ? (
        <div className="kozmos-reset kozmos-date-range-label">
          <label id={labelIds[which]} className={hidden} htmlFor={inputId}>
            {fieldLabel}
          </label>
          {box}
        </div>
      ) : (
        <label
          className="kozmos-reset kozmos-date-range-label"
          htmlFor={inputId}
        >
          <span id={labelIds[which]} className={hidden}>
            {fieldLabel}
          </span>
          {box}
        </label>
      );
    };

    const fields = (
      <div
        ref={setRefs}
        id={fieldId}
        className={cn("kozmos-reset kozmos-date-range", className)}
        {...props}
      >
        {field(false)}
        {field(true)}
      </div>
    );
    const opened = from === "end" ? range.end : range.start;

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
        {kozmos ? (
          <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverAnchor asChild>{fields}</PopoverAnchor>
            <PopoverContent
              ref={content}
              align="start"
              sideOffset={6}
              aria-label={label || chooseDatesLabel}
              aria-modal="true"
              className="kozmos-date-picker-panel"
              onOpenAutoFocus={(event) => {
                // The day of the field it opened from, else the range's
                // tab stop.
                const day =
                  content.current?.querySelector<HTMLElement>(
                    `[data-day="${opened}"]`,
                  ) ??
                  content.current?.querySelector<HTMLElement>(
                    '[data-day][tabindex="0"]',
                  );
                if (!day) return;
                event.preventDefault();
                day.focus();
              }}
              onCloseAutoFocus={(event) => {
                // Back to the button of the field it opened from.
                const button = group.current?.querySelectorAll<HTMLElement>(
                  ".kozmos-date-picker-trigger",
                )[from === "end" ? 1 : 0];
                if (!button) return;
                event.preventDefault();
                button.focus();
              }}
            >
              <MonthCalendar
                mode="range"
                months={months}
                value={{
                  start: range.start || undefined,
                  end: range.end || undefined,
                }}
                defaultMonth={
                  months === 1 && opened ? opened.slice(0, 7) : undefined
                }
                min={min}
                max={max}
                isDateUnavailable={isDateUnavailable}
                locale={locale}
                today={today}
                previousMonthLabel={previousMonthLabel}
                nextMonthLabel={nextMonthLabel}
                onValueChange={(next) => {
                  setRange({ start: next.start ?? "", end: next.end ?? "" });
                  if (next.end) setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        ) : (
          fields
        )}
      </FieldWrapper>
    );
  },
);

DateRangePicker.displayName = "DateRangePicker";

export { DatePicker, DateRangePicker };
