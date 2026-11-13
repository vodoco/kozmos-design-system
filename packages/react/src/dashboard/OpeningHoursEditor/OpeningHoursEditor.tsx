import React from "react";
import { clsx } from "clsx";
import { Button } from "../../components/Button/Button";
import { SegmentedControl } from "../../components/SegmentedControl/SegmentedControl";
import { Text } from "../../components/Text/Text";
import { TimePicker } from "../../components/TimePicker/TimePicker";

/** The days of the week, Monday first, as the value names them. */
export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/**
 * One day's hours: closed all day, open all day, or open from `open` to
 * `close`, each `HH:MM` on the 24-hour clock. A `close` before `open` is
 * the next day's (decision 179): 18:00 to 02:00 closes at 2 in the night.
 */
export type OpeningHoursDay =
  | { closed: true }
  | { alwaysOpen: true }
  | { open: string; close: string };

/** A week's hours, one entry per day. */
export type OpeningHours = Record<Weekday, OpeningHoursDay>;

const HOURS: OpeningHoursDay = { open: "08:00", close: "22:00" };
const CLOSED: OpeningHoursDay = { closed: true };

/**
 * A new Opening Hours property's week, Pointr Cloud's: Monday to Friday
 * 08:00 to 22:00, Saturday and Sunday closed.
 */
export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: HOURS,
  tuesday: HOURS,
  wednesday: HOURS,
  thursday: HOURS,
  friday: HOURS,
  saturday: CLOSED,
  sunday: CLOSED,
};

type Mode = "hours" | "closed" | "alwaysOpen";
const modeOf = (day: OpeningHoursDay): Mode =>
  "closed" in day ? "closed" : "alwaysOpen" in day ? "alwaysOpen" : "hours";

export interface OpeningHoursEditorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  /** The week, for a product that holds it. */
  value?: OpeningHours;
  /** The week an editor that holds its own starts with. Cloud's default. */
  defaultValue?: OpeningHours;
  /** Called with the whole week after each edit, and the day edited. */
  onValueChange?: (value: OpeningHours, day: Weekday) => void;
  /** Names the days, through Intl; by default the browser's language. */
  locale?: string;
  /** The day listed first. Default Monday, the value's own order. */
  weekStart?: Weekday;
  /**
   * The minutes between the times the list of times offers, and the step
   * its arrow keys take, carrying into the hour: 5 from 08:00 back is 07:55.
   * Default 5, Cloud's.
   */
  stepMinutes?: number;
  /**
   * Days whose hours differ across a multi-selection (GAP-153): no choice
   * is drawn, and `mixedLabel` says so, until the visitor chooses one.
   */
  mixedDays?: readonly Weekday[];
  /** Default "Multiple values". */
  mixedLabel?: string;
  /**
   * Per day, going back to the multi-selection's several hours: drawn
   * under the day while it is not mixed. Give it for a day that was.
   */
  onResetMixed?: Partial<Record<Weekday, () => void>>;
  /** Default "Reset to multiple values". */
  resetMixedLabel?: string;
  /** The choices' words. Defaults "Hours", "Closed", "Always open". */
  hoursLabel?: string;
  closedLabel?: string;
  alwaysOpenLabel?: string;
  /** Drawn beside a close time before the open time. Default "+1 day". */
  nextDayLabel?: string;
  /** Names a time field. Default `<day> opening time`, `<day> closing time`. */
  timeLabel?: (day: string, edge: "open" | "close") => string;
  /** Names a time field's list button. Default `Choose <time field>`. */
  chooseTimeLabel?: (field: string) => string;
  disabled?: boolean;
}

/**
 * The Opening Hours property's editor (CLOUD-UI-004): the seven days, each
 * Hours, Closed or Always open, and for Hours its opening and closing time.
 * Every control is reached by Tab (Cloud's had no tab stop). Overnight hours
 * are allowed (decision 179): a closing time before the opening time is the
 * next day's, and "+1 day" says so beside it, and to a screen reader with
 * the field.
 *
 * Built from SegmentedControl, for the three states a day can be in, one at
 * a time (two switches, Cloud's, can both be on), and TimePicker, typed or
 * chosen from its list. A Dashboard module (decision 183).
 */
const OpeningHoursEditor = React.forwardRef<
  HTMLDivElement,
  OpeningHoursEditorProps
>(
  (
    {
      className,
      value: valueProp,
      defaultValue = DEFAULT_OPENING_HOURS,
      onValueChange,
      locale,
      weekStart = "monday",
      stepMinutes = 5,
      mixedDays = [],
      mixedLabel = "Multiple values",
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      hoursLabel = "Hours",
      closedLabel = "Closed",
      alwaysOpenLabel = "Always open",
      nextDayLabel = "+1 day",
      timeLabel = (day, edge) =>
        `${day} ${edge === "open" ? "opening" : "closing"} time`,
      chooseTimeLabel = (field) => `Choose ${field}`,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [held, setHeld] = React.useState(defaultValue);
    const value = valueProp ?? held;
    // The hours a day had before it was closed, given back when it opens.
    const last = React.useRef<Partial<Record<Weekday, OpeningHoursDay>>>({});
    const id = React.useId();
    const names = React.useMemo(() => {
      const format = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "UTC",
      });
      // 1 January 2024 was a Monday.
      return WEEKDAYS.map((_, index) =>
        format.format(Date.UTC(2024, 0, 1 + index)),
      );
    }, [locale]);
    const first = WEEKDAYS.indexOf(weekStart);
    const items = [
      { value: "hours", label: hoursLabel },
      { value: "closed", label: closedLabel },
      { value: "alwaysOpen", label: alwaysOpenLabel },
    ];

    const set = (day: Weekday, next: OpeningHoursDay) => {
      const week = { ...value, [day]: next };
      if (valueProp === undefined) setHeld(week);
      onValueChange?.(week, day);
    };

    return (
      <div
        ref={ref}
        className={clsx("kozmos-opening-hours", className)}
        {...props}
      >
        {WEEKDAYS.map((_, offset) => {
          const index = (first + offset) % 7;
          const day = WEEKDAYS[index];
          const name = names[index];
          const hours = value[day];
          const mixed = mixedDays.includes(day);
          const mode = modeOf(hours);
          const nameId = `${id}-${day}`;
          const nextDayId = `${id}-${day}-next`;
          const reset = onResetMixed?.[day];
          const open = "open" in hours ? hours.open : "";
          const close = "close" in hours ? hours.close : "";
          return (
            // The day's choice is named by the day, and its times carry the
            // day in theirs: a group round them would say the day twice.
            <div key={day} className="kozmos-opening-hours-day">
              <Text id={nameId} as="span" size="sm" weight="medium">
                {name}
              </Text>
              <SegmentedControl
                size="sm"
                aria-labelledby={nameId}
                items={items}
                value={mixed ? null : mode}
                disabled={disabled}
                onValueChange={(next) => {
                  if (!next || (next === mode && !mixed)) return;
                  if (mode === "hours") last.current[day] = hours;
                  set(
                    day,
                    next === "hours"
                      ? (last.current[day] ?? HOURS)
                      : next === "closed"
                        ? CLOSED
                        : { alwaysOpen: true },
                  );
                }}
              />
              {mixed ? (
                <Text size="sm" color="muted">
                  {mixedLabel}
                </Text>
              ) : mode === "hours" ? (
                <div className="kozmos-opening-hours-times">
                  <TimePicker
                    aria-label={timeLabel(name, "open")}
                    chooseTimeLabel={chooseTimeLabel(timeLabel(name, "open"))}
                    locale={locale}
                    step={stepMinutes * 60}
                    value={open}
                    disabled={disabled}
                    onChange={(event) =>
                      set(day, { open: event.target.value, close })
                    }
                  />
                  <TimePicker
                    aria-label={timeLabel(name, "close")}
                    chooseTimeLabel={chooseTimeLabel(timeLabel(name, "close"))}
                    aria-describedby={close < open ? nextDayId : undefined}
                    locale={locale}
                    step={stepMinutes * 60}
                    value={close}
                    disabled={disabled}
                    onChange={(event) =>
                      set(day, { open, close: event.target.value })
                    }
                  />
                  {close < open ? (
                    <Text id={nextDayId} as="span" size="xs" color="muted">
                      {nextDayLabel}
                    </Text>
                  ) : null}
                </div>
              ) : null}
              {reset && !mixed && !disabled ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="kozmos-opening-hours-reset"
                  onClick={reset}
                >
                  {resetMixedLabel}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  },
);
OpeningHoursEditor.displayName = "OpeningHoursEditor";

export { OpeningHoursEditor };
