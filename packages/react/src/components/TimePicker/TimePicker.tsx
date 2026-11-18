import React from "react";
import { Anchor as PopoverAnchor } from "@radix-ui/react-popover";
import { ChevronDown, ChevronUp, Clock } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { resolveLocale } from "../Calendar/calendar-dates";
import { FieldWrapper, type MixedValueProps } from "../FieldWrapper";
import { useFieldRef, useMixedField } from "../FieldWrapper/mixedValue";
import { mixedTemporalValue, typeInto } from "../DatePicker/date-picker-engine";
import { inputVariants, type InputStatus } from "../Input/inputVariants";
import { Listbox } from "../Listbox/Listbox";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";

export interface TimePickerProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    MixedValueProps {
  description?: React.ReactNode;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  status?: InputStatus;
  wrapperClassName?: string;
  /**
   * Whether Kozmos's list of times is open, with `onOpenChange`. The field's
   * button opens it, as Alt+Down Arrow or F4 in the field do, in every
   * engine: none draws a time picker button a page cannot hide.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Names the button that opens the list, and the list. */
  chooseTimeLabel?: string;
  /** The list's clock, 12 or 24 hours; by default the locale's. */
  hourCycle?: "h12" | "h23";
  /** The list's locale; the browser's still formats the typed time. */
  locale?: string;
}

/** `HH:MM` as minutes after midnight, or null. */
const toMinutes = (value: unknown) => {
  const match = typeof value === "string" && /^(\d{2}):(\d{2})/.exec(value);
  return match ? +match[1] * 60 + +match[2] : null;
};
const pad = (n: number) => String(n).padStart(2, "0");
const DAY = 24 * 60;

/**
 * The time `every` minutes on or back from `time` (GAP-256), on the step's
 * grid from `first`, carrying into the hour: 08:00 back by 5 is 07:55, 08:03
 * on is 08:05. It stays between `first` and `last` when the field has a
 * `min` or `max`, and otherwise goes round midnight: 23:55 on is 00:00. An
 * empty field starts at the first time going on, at the last going back.
 */
function stepTime(
  time: string,
  every: number,
  direction: 1 | -1,
  first: number,
  last: number,
  bounded: boolean,
) {
  const now = toMinutes(time);
  const lastOnGrid = first + Math.floor((last - first) / every) * every;
  let minutes =
    now === null
      ? direction === 1
        ? first
        : lastOnGrid
      : direction === 1
        ? first + (Math.floor((now - first) / every) + 1) * every
        : first + (Math.ceil((now - first) / every) - 1) * every;
  if (bounded) minutes = Math.min(Math.max(minutes, first), lastOnGrid);
  else minutes = ((minutes % DAY) + DAY) % DAY;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
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
      chooseTimeLabel = "Choose time",
      className,
      defaultOpen,
      description,
      disabled,
      error,
      helperText,
      hourCycle,
      id,
      label,
      locale,
      mixed = false,
      mixedLabel = "Multiple values",
      onChange,
      onKeyDown,
      onOpenChange,
      onResetMixed,
      open: openProp,
      readOnly,
      required,
      resetMixedLabel,
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
    const mixedId = React.useId();
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
    // Mixed (GAP-255), the field holds no time: a controlled one is given
    // "", an uncontrolled one is emptied as it turns mixed, and on reset.
    const mixedField = useMixedField(mixed, props.value);
    const input = mixedField.field;
    const list = React.useRef<HTMLDivElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] =
      React.useState(!!defaultOpen);
    const locked = disabled || readOnly;
    const open = !locked && (openProp ?? uncontrolledOpen);
    const setOpen = (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    const setRef = useFieldRef(input, ref);

    // Every `step` seconds from `min` to `max` (the input's own), 30 minutes
    // apart when it asks for none, in the locale's clock.
    const resolvedLocale = resolveLocale(locale);
    const step = Number(props.step);
    const every = step >= 60 ? Math.round(step / 60) : 30;
    const first = toMinutes(props.min) ?? 0;
    const last = toMinutes(props.max) ?? 24 * 60 - 1;
    // The arrows' step, in minutes: a `step` of whole minutes only.
    const arrowStep =
      Number.isFinite(step) && step >= 60 && step % 60 === 0 ? step / 60 : null;
    const options = React.useMemo(() => {
      // The locale's own short time (09:30, 9:30 AM), in the clock asked for.
      const format = new Intl.DateTimeFormat(resolvedLocale, {
        timeStyle: "short",
        hourCycle,
        timeZone: "UTC",
      });
      const times = [];
      for (let at = first; at <= last; at += every)
        times.push({
          value: `${pad(Math.floor(at / 60))}:${pad(at % 60)}`,
          label: format.format(at * 60_000),
        });
      return times;
    }, [resolvedLocale, hourCycle, first, last, every]);
    // Mixed, the list opens on no time.
    const current = mixed
      ? ""
      : String(
          input.current?.value ?? props.value ?? props.defaultValue ?? "",
        ).slice(0, 5);

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
        mixed={mixed}
        mixedLabel={mixedLabel}
        mixedId={mixedId}
        onResetMixed={
          onResetMixed && !locked
            ? () => {
                mixedField.clear();
                onResetMixed();
              }
            : undefined
        }
        resetMixedLabel={resetMixedLabel}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div
              className="kozmos-reset kozmos-temporal-field"
              data-mixed={mixed ? "" : undefined}
            >
              <Clock
                aria-hidden="true"
                className="kozmos-reset kozmos-temporal-icon"
              />
              <input
                ref={setRef}
                id={inputId}
                type="time"
                aria-describedby={mergeAriaIds(
                  ariaDescribedBy,
                  describedBy,
                  mixed ? mixedId : undefined,
                )}
                aria-invalid={resolvedStatus === "error" ? true : ariaInvalid}
                className={cn(
                  inputVariants({ status: resolvedStatus }),
                  "kozmos-temporal-input kozmos-time-input",
                  // Room for the button, as PasswordInput keeps for its toggle.
                  "pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]",
                  className,
                )}
                data-picker="kozmos"
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                onChange={(event) => {
                  trackEvent("TimePicker", "time_selected", {
                    value: event.target.value,
                  });
                  onChange?.(event);
                }}
                onKeyDown={(event) => {
                  onKeyDown?.(event);
                  // Up and Down Arrow step the time by `step`, whichever
                  // part is focused, carrying into the hour (GAP-256): the
                  // browser's own step one segment by one. Only a step of
                  // whole minutes is Kozmos's; a field with none, or one in
                  // seconds, keeps the browser's arrows.
                  if (
                    !locked &&
                    !event.defaultPrevented &&
                    arrowStep !== null &&
                    (event.key === "ArrowUp" || event.key === "ArrowDown") &&
                    !event.altKey &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    typeInto(
                      event.currentTarget,
                      stepTime(
                        event.currentTarget.value,
                        arrowStep,
                        event.key === "ArrowUp" ? 1 : -1,
                        first,
                        last,
                        props.min != null || props.max != null,
                      ),
                    );
                    return;
                  }
                  // Chromium opens its own picker on these.
                  if (
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
                {...mixedTemporalValue(mixed, props)}
              />
              {mixed ? (
                <span aria-hidden="true" className="kozmos-temporal-mixed">
                  {mixedLabel}
                </span>
              ) : null}
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={chooseTimeLabel}
                  aria-haspopup="listbox"
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
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="kozmos-time-picker-panel"
            onOpenAutoFocus={(event) => {
              // Into the list, on the field's time, in view.
              event.preventDefault();
              list.current?.focus();
              list.current
                ?.querySelector('[data-active="true"]')
                ?.scrollIntoView?.({ block: "nearest" });
            }}
          >
            <Listbox
              ref={list}
              aria-label={label || chooseTimeLabel}
              options={options}
              value={current}
              onValueChange={(value) => {
                if (input.current) typeInto(input.current, String(value));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </FieldWrapper>
    );
  },
);
TimePicker.displayName = "TimePicker";

export { TimePicker };
