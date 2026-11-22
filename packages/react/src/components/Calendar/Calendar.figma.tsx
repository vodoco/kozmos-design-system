import figma from "@figma/code-connect";
import {
  Calendar,
  type CalendarRangeProps,
  type CalendarSingleProps,
} from "./Calendar";

const calendarUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19149";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const date: CalendarSingleProps["value"];
declare const setDate: NonNullable<CalendarSingleProps["onValueChange"]>;
declare const range: CalendarRangeProps["value"];
declare const setRange: NonNullable<CalendarRangeProps["onValueChange"]>;

/**
 * Figma Code Connect: Calendar (decision 104, GAP-206)
 *
 * Mode is mode, one connect each, as single and range take different
 * values. Months is months: One, the default, or Two. The days drawn are an
 * example: in code they follow value, month, min, max and locale.
 */
figma.connect(Calendar, calendarUrl, {
  variant: { Mode: "Single" },
  props: { months: figma.enum("Months", { One: undefined, Two: 2 }) },
  example: ({ months }) => (
    <Calendar
      value={date}
      onValueChange={(next) => setDate(next)}
      months={months}
    />
  ),
});

figma.connect(Calendar, calendarUrl, {
  variant: { Mode: "Range" },
  props: { months: figma.enum("Months", { One: undefined, Two: 2 }) },
  example: ({ months }) => (
    <Calendar
      mode="range"
      value={range}
      onValueChange={(next) => setRange(next)}
      months={months}
    />
  ),
});
