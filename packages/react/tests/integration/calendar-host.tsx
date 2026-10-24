import { createRoot, type Root } from "react-dom/client";
import { Calendar, ThemeProvider, type CalendarProps } from "@kozmos-ds/react";

/**
 * Calendar in the built package, for scripts/check-calendar.mjs: one
 * calendar per mount, in a provider of the given theme and direction, with
 * every value and month it reports kept on window.calendar.
 */
interface Mount {
  props: Record<string, unknown>;
  theme?: "light" | "dark";
  dir?: "ltr" | "rtl";
  /** Close the weekends, as the Unavailable story does. */
  weekends?: boolean;
}

let root: Root | null = null;
const state = {
  values: [] as unknown[],
  months: [] as string[],
  mount({ props, theme = "light", dir = "ltr", weekends }: Mount) {
    root?.unmount();
    state.values = [];
    state.months = [];
    root = createRoot(document.getElementById("fixture")!);
    const calendarProps = {
      ...props,
      isDateUnavailable: weekends
        ? (date: string) =>
            [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())
        : undefined,
      onValueChange: (value: unknown) => state.values.push(value),
      onMonthChange: (month: string) => state.months.push(month),
    } as CalendarProps;
    root.render(
      <ThemeProvider theme={theme} dir={dir}>
        <button type="button">before</button>
        <div
          data-testid="panel"
          style={{ display: "inline-block", padding: 12 }}
        >
          <Calendar data-testid="calendar" {...calendarProps} />
        </div>
        <button type="button">after</button>
      </ThemeProvider>,
    );
  },
};

declare global {
  interface Window {
    calendar: typeof state;
  }
}
window.calendar = state;
