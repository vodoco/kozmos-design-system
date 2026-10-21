import React from "react";
import { ChevronLeft, ChevronRight } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import type { DateRangeValue } from "../DatePicker/DatePicker";
import {
  addMonths,
  firstDayOfWeek,
  firstOfMonth,
  localToday,
  monthGrid,
  monthOf,
  resolveLocale,
  toDay,
  toIso,
  toMonth,
  toMonthIso,
  weekdayOf,
} from "./calendar-dates";

interface CalendarBaseProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  /** How many months show side by side: one, or two. Defaults to one. */
  months?: 1 | 2;
  /** The first month shown, `YYYY-MM`, with `onMonthChange`. */
  month?: string;
  /** The first month shown at first: by default the value's, else today's. */
  defaultMonth?: string;
  /** Called with the first month shown, `YYYY-MM`, whenever it changes. */
  onMonthChange?: (month: string) => void;
  /** The earliest day that can be chosen, `YYYY-MM-DD`. */
  min?: string;
  /** The latest day that can be chosen, `YYYY-MM-DD`. */
  max?: string;
  /** A day this returns true for can be reached but not chosen. */
  isDateUnavailable?: (date: string) => boolean;
  /**
   * The BCP 47 locale that names the months and the days and picks the first
   * day of the week. Defaults to the document's language, then the browser's.
   */
  locale?: string;
  /** The day drawn as today, `YYYY-MM-DD`. Defaults to the reader's own. */
  today?: string;
  /** Nothing can be chosen or reached. */
  disabled?: boolean;
  /** The days can be reached and read, not chosen. */
  readOnly?: boolean;
  /** Focuses the day that takes focus, once it mounts. */
  autoFocus?: boolean;
  /** The previous-month button's name. */
  previousMonthLabel?: string;
  /** The next-month button's name. */
  nextMonthLabel?: string;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  /** One day (the default), or a range of them. */
  mode?: "single";
  /** The chosen day, `YYYY-MM-DD`, with `onValueChange`. */
  value?: string | null;
  defaultValue?: string;
  /** Called with the day each time one is chosen, the chosen one included. */
  onValueChange?: (value: string) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  /** The chosen range, `YYYY-MM-DD` at each end, with `onValueChange`. */
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  /**
   * Called with `{ start }` when a first day is chosen, and with
   * `{ start, end }`, in order, when the second is.
   */
  onValueChange?: (value: DateRangeValue) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

/** A month, a first and a last day, each as a day number, or null. */
const within = (day: number, low: number | null, high: number | null) =>
  (low === null || day >= low) && (high === null || day <= high);

/**
 * A month grid, one or two months side by side, to choose a day or a range
 * in (decision 104). Days are `YYYY-MM-DD` strings, as DatePicker's are. The
 * keyboard follows the WAI-ARIA date picker dialog's grid: the arrows move a
 * day or a week, Home and End to the week's ends, Page Up and Page Down a
 * month, with Shift a year, and Enter or Space chooses. Right to left, the
 * arrows follow the page. It draws no surface of its own: DatePicker opens
 * it in a Popover, and a page can set it on a Card.
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (props, ref) => {
    const {
      autoFocus,
      className,
      defaultMonth,
      defaultValue,
      disabled,
      isDateUnavailable,
      locale: localeProp,
      max,
      min,
      mode = "single",
      month: monthProp,
      months = 1,
      nextMonthLabel = "Next month",
      onMonthChange,
      onValueChange,
      previousMonthLabel = "Previous month",
      readOnly,
      today: todayProp,
      value: valueProp,
      ...rest
    } = props;
    const { trackEvent } = useKozmosAnalytics();
    const range = mode === "range";
    const id = React.useId();
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current as HTMLDivElement);

    const locale = resolveLocale(localeProp);
    const names = React.useMemo(() => {
      const format = (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, {
          calendar: "gregory",
          timeZone: "UTC",
          ...options,
        });
      const firstDay = firstDayOfWeek(locale);
      const weekday = format({ weekday: "short" });
      return {
        firstDay,
        title: format({ month: "long", year: "numeric" }),
        full: format({ dateStyle: "full" }),
        number: new Intl.NumberFormat(locale, { useGrouping: false }),
        // 1970-01-04 was a Sunday: day 3.
        weekdays: Array.from({ length: 7 }, (_, index) =>
          weekday.format(
            ((firstDay + index) % 7) * 86_400_000 + 3 * 86_400_000,
          ),
        ),
      };
    }, [locale]);

    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue as CalendarProps["value"],
    );
    const value = valueProp !== undefined ? valueProp : uncontrolledValue;
    const single = range ? null : toDay(value as string | null | undefined);
    const start = range ? toDay((value as DateRangeValue)?.start) : null;
    const end = range ? toDay((value as DateRangeValue)?.end) : null;

    const lowest = toDay(min);
    const highest = toDay(max);
    const today = toDay(todayProp) ?? localToday();
    const unavailable = (day: number) =>
      !within(day, lowest, highest) || !!isDateUnavailable?.(toIso(day));

    // The first month shown can be no later than leaves the last one on the
    // latest day's month.
    const lowMonth = lowest === null ? null : monthOf(lowest);
    const highMonth = highest === null ? null : monthOf(highest) - months + 1;
    const clampMonth = (month: number) =>
      Math.max(lowMonth ?? month, Math.min(highMonth ?? month, month));
    const [uncontrolledMonth, setUncontrolledMonth] = React.useState(() =>
      clampMonth(
        toMonth(defaultMonth) ?? monthOf(single ?? start ?? end ?? today),
      ),
    );
    const first = toMonth(monthProp) ?? uncontrolledMonth;
    const firstShown = firstOfMonth(first);
    const lastShown = firstOfMonth(first + months) - 1;
    const setFirstMonth = (month: number) => {
      const next = clampMonth(month);
      if (next === first) return;
      setUncontrolledMonth(next);
      onMonthChange?.(toMonthIso(next));
    };

    // The day that takes focus: the one the keyboard last reached, while it
    // is shown; else the chosen day, today, or the first month's first day.
    const [focusedDay, setFocusedDay] = React.useState<number | null>(null);
    const shown = (day: number | null): day is number =>
      day !== null && day >= firstShown && day <= lastShown;
    const preferred = [focusedDay, single, start, today].find(shown);
    const activeDay = Math.max(
      lowest ?? -Infinity,
      Math.min(highest ?? Infinity, preferred ?? firstShown),
    );

    // While a range has a start and no end, the day under the pointer or the
    // focus shows where it would end.
    const [pointerDay, setPointerDay] = React.useState<number | null>(null);
    const [gridFocused, setGridFocused] = React.useState(false);
    const previewEnd =
      range && start !== null && end === null
        ? (pointerDay ?? (gridFocused ? activeDay : null))
        : null;
    const rangeLow =
      start === null ? null : Math.min(start, end ?? previewEnd ?? start);
    const rangeHigh =
      start === null ? null : Math.max(start, end ?? previewEnd ?? start);

    const moveFocus = React.useRef(false);
    React.useLayoutEffect(() => {
      if (!moveFocus.current) return;
      moveFocus.current = false;
      root.current
        ?.querySelector<HTMLElement>(`[data-day="${toIso(activeDay)}"]`)
        ?.focus();
    });
    React.useEffect(() => {
      if (autoFocus)
        root.current
          ?.querySelector<HTMLElement>('[data-day][tabindex="0"]')
          ?.focus();
      // Only on mounting, as an input's autoFocus.
    }, []);

    /** The day a cell event happened on, or null outside the month. */
    const dayFrom = (event: React.SyntheticEvent) => {
      const day = (event.target as HTMLElement)
        .closest<HTMLElement>("[data-day]")
        ?.getAttribute("data-day");
      return toDay(day);
    };

    const choose = (day: number) => {
      if (disabled || readOnly || unavailable(day)) return;
      if (range) {
        const next: DateRangeValue =
          start === null || end !== null
            ? { start: toIso(day) }
            : {
                start: toIso(Math.min(start, day)),
                end: toIso(Math.max(start, day)),
              };
        if (valueProp === undefined) setUncontrolledValue(next);
        trackEvent("Calendar", "date_range_changed", next);
        (onValueChange as CalendarRangeProps["onValueChange"])?.(next);
      } else {
        const next = toIso(day);
        if (valueProp === undefined) setUncontrolledValue(next);
        trackEvent("Calendar", "date_selected", { value: next });
        (onValueChange as CalendarSingleProps["onValueChange"])?.(next);
      }
    };

    const focusDay = (day: number) => {
      const target = Math.max(
        lowest ?? -Infinity,
        Math.min(highest ?? Infinity, day),
      );
      if (target < firstShown) setFirstMonth(monthOf(target));
      else if (target > lastShown) setFirstMonth(monthOf(target) - months + 1);
      setFocusedDay(target);
      // The keyboard moved last, so its day shows where a range would end.
      setPointerDay(null);
      moveFocus.current = true;
    };

    const onGridKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
      const { key, shiftKey } = event;
      // From the day that has focus: a reader's cursor can put it on any.
      const from = dayFrom(event) ?? activeDay;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        choose(from);
        return;
      }
      if (!NAVIGATION_KEYS.has(key)) return;
      event.preventDefault();
      const back =
        getComputedStyle(event.currentTarget).direction === "rtl" ? 1 : -1;
      const weekStart = from - ((weekdayOf(from) - names.firstDay + 7) % 7);
      const target =
        key === "ArrowLeft"
          ? from + back
          : key === "ArrowRight"
            ? from - back
            : key === "ArrowUp"
              ? from - 7
              : key === "ArrowDown"
                ? from + 7
                : key === "Home"
                  ? weekStart
                  : key === "End"
                    ? weekStart + 6
                    : addMonths(
                        from,
                        (key === "PageUp" ? -1 : 1) * (shiftKey ? 12 : 1),
                      );
      focusDay(target);
    };

    const step = (by: number) => {
      setFirstMonth(first + by);
      // Focus stays on the button; the day that takes focus moves with it.
      setFocusedDay(addMonths(activeDay, by));
    };
    const canGoBack = lowMonth === null || first > lowMonth;
    const canGoForward = highMonth === null || first < highMonth;

    return (
      <div
        ref={root}
        className={cn("kozmos-reset kozmos-calendar", className)}
        data-mode={mode}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {Array.from({ length: months }, (_, offset) => {
          const month = first + offset;
          const grid = monthGrid(month, names.firstDay);
          const titleId = `${id}-${offset}`;
          return (
            <div key={month} className="kozmos-reset kozmos-calendar-month">
              <div className="kozmos-reset kozmos-calendar-header">
                <div
                  id={titleId}
                  className="kozmos-reset kozmos-calendar-title"
                  aria-live="polite"
                >
                  {names.title.format(firstOfMonth(month) * 86_400_000)}
                </div>
                {offset === months - 1 && (
                  <div className="kozmos-reset kozmos-calendar-nav">
                    {(
                      [
                        [-1, previousMonthLabel, ChevronLeft, canGoBack],
                        [1, nextMonthLabel, ChevronRight, canGoForward],
                      ] as const
                    ).map(([by, label, Chevron, can]) => (
                      <button
                        key={by}
                        type="button"
                        className="kozmos-reset kozmos-calendar-nav-button"
                        aria-label={label}
                        disabled={disabled || !can}
                        onClick={() => step(by)}
                      >
                        <Chevron
                          aria-hidden="true"
                          className="kozmos-rtl-mirror kozmos-calendar-nav-icon"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <table
                role="grid"
                aria-labelledby={titleId}
                aria-multiselectable={range || undefined}
                aria-readonly={readOnly || undefined}
                aria-disabled={disabled || undefined}
                className="kozmos-reset kozmos-calendar-grid"
                onKeyDown={onGridKeyDown}
                onClick={(event) => {
                  const day = dayFrom(event);
                  if (day === null || disabled) return;
                  setFocusedDay(day);
                  choose(day);
                }}
                onMouseOver={
                  range ? (event) => setPointerDay(dayFrom(event)) : undefined
                }
                onMouseLeave={range ? () => setPointerDay(null) : undefined}
                onFocus={(event) => {
                  // The tab stop follows focus, wherever it was put.
                  const day = dayFrom(event);
                  if (day !== null) setFocusedDay(day);
                  if (range) setGridFocused(true);
                }}
                onBlur={range ? () => setGridFocused(false) : undefined}
              >
                {/* Every day's name says its weekday, so a reader hears the
                    columns' names once, there. */}
                <thead aria-hidden="true">
                  <tr>
                    {names.weekdays.map((weekday, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="kozmos-reset kozmos-calendar-weekday"
                      >
                        {weekday}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, week) => (
                    <tr key={week}>
                      {grid.slice(week * 7, week * 7 + 7).map((day) => {
                        const number = names.number.format(
                          new Date(day * 86_400_000).getUTCDate(),
                        );
                        if (monthOf(day) !== month)
                          return (
                            <td
                              key={day}
                              role="gridcell"
                              className="kozmos-reset kozmos-calendar-day"
                              data-outside=""
                            >
                              <span aria-hidden="true">{number}</span>
                            </td>
                          );
                        const ends = range
                          ? day === start || day === end
                          : day === single;
                        const inRange =
                          range &&
                          rangeLow !== null &&
                          rangeHigh !== null &&
                          day >= rangeLow &&
                          day <= rangeHigh;
                        const chosen = range
                          ? start !== null &&
                            end !== null &&
                            day >= start &&
                            day <= end
                          : ends;
                        const closed = !disabled && unavailable(day);
                        return (
                          <td
                            key={day}
                            role="gridcell"
                            className="kozmos-reset kozmos-calendar-day"
                            data-day={toIso(day)}
                            // Disabled, no day takes focus, by key or pointer.
                            tabIndex={
                              disabled ? undefined : day === activeDay ? 0 : -1
                            }
                            aria-label={names.full.format(day * 86_400_000)}
                            aria-selected={chosen || ends}
                            aria-current={day === today ? "date" : undefined}
                            aria-disabled={closed || undefined}
                            data-selected={ends || undefined}
                            data-in-range={(inRange && !ends) || undefined}
                            data-today={day === today || undefined}
                          >
                            {number}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  },
);

Calendar.displayName = "Calendar";

export { Calendar };
