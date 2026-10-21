import { act, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Calendar, type CalendarProps } from "./Calendar";

// Figma's example: May 2026, today the 22nd, the 25th chosen. Every test
// names its today, so none of them depends on the day it runs.
const TODAY = "2026-05-22";
const base = { locale: "en-US", today: TODAY } as const;

const day = (name: string) => screen.getByRole("gridcell", { name });
const focused = () => document.activeElement as HTMLElement;
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init });
const tabStops = () =>
  screen
    .getAllByRole("gridcell")
    .filter((cell) => cell.getAttribute("tabindex") === "0");

afterEach(() => {
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("dir");
});

describe("Calendar", () => {
  it("names the month and the days in the locale, from its first day of the week", () => {
    const { rerender } = render(
      <Calendar {...base} defaultValue="2026-05-25" />,
    );
    expect(screen.getByRole("grid", { name: "May 2026" })).toBeInTheDocument();
    const weekdays = () =>
      Array.from(document.querySelectorAll("th"), (th) => th.textContent);
    expect(weekdays()).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
    // The grid starts on the week's first day: 26 April, a Sunday.
    expect(screen.getAllByRole("gridcell")[0]).toHaveTextContent("26");

    rerender(<Calendar {...base} locale="de-DE" defaultValue="2026-05-25" />);
    expect(screen.getByRole("grid", { name: "Mai 2026" })).toBeInTheDocument();
    expect(weekdays()[0]).toBe("Mo");
    expect(screen.getAllByRole("gridcell")[0]).toHaveTextContent("27");
    expect(
      screen.getByRole("gridcell", { name: "Montag, 25. Mai 2026" }),
    ).toBeInTheDocument();

    // Egypt starts on Saturday, in Arabic-Indic digits.
    rerender(<Calendar {...base} locale="ar-EG" defaultValue="2026-05-25" />);
    expect(weekdays()[0]).toBe("السبت");
    expect(screen.getAllByRole("gridcell")[0]).toHaveTextContent("٢٥");
  });

  it("takes the document's language when it is given none", () => {
    document.documentElement.lang = "fr-FR";
    render(<Calendar today={TODAY} />);
    expect(screen.getByRole("grid", { name: "mai 2026" })).toBeInTheDocument();
  });

  it("names every day by its full date, marks today, and leaves the other months' days unnamed", () => {
    render(<Calendar {...base} />);
    const today = day("Friday, May 22, 2026");
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveTextContent("22");
    expect(day("Monday, May 25, 2026")).not.toHaveAttribute("aria-current");
    // 26 April to 30 April and 1 to 6 June draw their numbers for the eye
    // only: no name, no state, no tab stop.
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(42);
    const outside = cells.filter((cell) => cell.hasAttribute("data-outside"));
    expect(outside).toHaveLength(11);
    for (const cell of outside) {
      expect(cell).not.toHaveAttribute("aria-label");
      expect(cell).not.toHaveAttribute("tabindex");
      expect(cell.firstElementChild).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("chooses a day with the pointer, uncontrolled", () => {
    const onValueChange = vi.fn();
    render(<Calendar {...base} onValueChange={onValueChange} />);
    fireEvent.click(day("Tuesday, May 12, 2026"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-05-12");
    expect(day("Tuesday, May 12, 2026")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(day("Friday, May 22, 2026")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    // The chosen day again still says so: a picker closes on it.
    fireEvent.click(day("Tuesday, May 12, 2026"));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("draws the value it is given, controlled", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Calendar {...base} value="2026-05-25" onValueChange={onValueChange} />,
    );
    fireEvent.click(day("Tuesday, May 12, 2026"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-05-12");
    expect(day("Monday, May 25, 2026")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    rerender(
      <Calendar {...base} value="2026-05-12" onValueChange={onValueChange} />,
    );
    expect(day("Tuesday, May 12, 2026")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // A date that is not one is no value.
    rerender(<Calendar {...base} value="2026-02-31" />);
    expect(
      screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("aria-selected") === "true"),
    ).toHaveLength(0);
  });

  it("is one tab stop: the chosen day, else today, else the month's first", () => {
    const { rerender, unmount } = render(
      <Calendar {...base} value="2026-05-25" />,
    );
    expect(tabStops()).toEqual([day("Monday, May 25, 2026")]);
    rerender(<Calendar {...base} />);
    expect(tabStops()).toEqual([day("Friday, May 22, 2026")]);
    unmount();
    render(<Calendar {...base} defaultMonth="2026-07" />);
    expect(tabStops()).toEqual([day("Wednesday, July 1, 2026")]);
  });

  it("moves by day, week, the week's ends, month and year from the keyboard", () => {
    const onValueChange = vi.fn();
    const onMonthChange = vi.fn();
    render(
      <Calendar
        {...base}
        defaultValue="2026-05-25"
        autoFocus
        onValueChange={onValueChange}
        onMonthChange={onMonthChange}
      />,
    );
    expect(focused()).toBe(day("Monday, May 25, 2026"));
    const steps: Array<[string, Partial<KeyboardEventInit>, string]> = [
      ["ArrowRight", {}, "Tuesday, May 26, 2026"],
      ["ArrowLeft", {}, "Monday, May 25, 2026"],
      ["ArrowDown", {}, "Monday, June 1, 2026"],
      ["ArrowUp", {}, "Monday, May 25, 2026"],
      ["End", {}, "Saturday, May 30, 2026"],
      ["Home", {}, "Sunday, May 24, 2026"],
      ["PageDown", {}, "Wednesday, June 24, 2026"],
      ["PageUp", {}, "Sunday, May 24, 2026"],
      ["PageDown", { shiftKey: true }, "Monday, May 24, 2027"],
      ["PageUp", { shiftKey: true }, "Sunday, May 24, 2026"],
    ];
    for (const [key, init, name] of steps) {
      press(key, init);
      expect(focused(), `${key} lands on ${name}`).toBe(day(name));
      expect(tabStops(), `${key} keeps one tab stop`).toEqual([day(name)]);
    }
    // Leaving the month showed June, then May 2027, then May again.
    expect(onMonthChange.mock.calls.map(([month]) => month)).toEqual([
      "2026-06",
      "2026-05",
      "2026-06",
      "2026-05",
      "2027-05",
      "2026-05",
    ]);
    expect(screen.getByRole("grid", { name: "May 2026" })).toBeInTheDocument();
    press("Enter");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-05-24");
    press("ArrowRight");
    press(" ");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-05-25");
  });

  it("keeps the date in a shorter month on the month's last day", () => {
    render(<Calendar {...base} defaultValue="2026-01-31" autoFocus />);
    press("PageDown");
    expect(focused()).toBe(day("Saturday, February 28, 2026"));
    render(<Calendar {...base} defaultValue="2028-02-29" autoFocus />, {
      container: document.body.appendChild(document.createElement("div")),
    });
    press("PageDown", { shiftKey: true });
    expect(focused()).toBe(day("Wednesday, February 28, 2029"));
  });

  it("starts the week where the locale does for Home and End", () => {
    render(
      <Calendar {...base} locale="de-DE" defaultValue="2026-05-27" autoFocus />,
    );
    press("Home");
    expect(focused()).toBe(day("Montag, 25. Mai 2026"));
    press("End");
    expect(focused()).toBe(day("Sonntag, 31. Mai 2026"));
  });

  it("follows the page's direction with the arrows, right to left", () => {
    render(
      <div dir="rtl" style={{ direction: "rtl" }}>
        <Calendar {...base} defaultValue="2026-05-25" autoFocus />
      </div>,
    );
    // jsdom inherits no direction: the grid is told, as a browser would.
    screen.getByRole("grid").style.direction = "rtl";
    press("ArrowLeft");
    expect(focused()).toBe(day("Tuesday, May 26, 2026"));
    press("ArrowRight");
    expect(focused()).toBe(day("Monday, May 25, 2026"));
  });

  it("goes to the previous and next month from its buttons, named in English by default", () => {
    const onMonthChange = vi.fn();
    const { rerender } = render(
      <Calendar
        {...base}
        defaultValue="2026-05-25"
        onMonthChange={onMonthChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "June 2026" })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-06");
    // The day that takes focus moves with the month.
    expect(tabStops()).toEqual([day("Thursday, June 25, 2026")]);
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(
      screen.getByRole("grid", { name: "April 2026" }),
    ).toBeInTheDocument();
    rerender(
      <Calendar
        {...base}
        previousMonthLabel="Vorheriger Monat"
        nextMonthLabel="Nächster Monat"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Vorheriger Monat" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nächster Monat" }),
    ).toBeInTheDocument();
  });

  it("shows a controlled month and reports the next one", () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar {...base} month="2026-09" onMonthChange={onMonthChange} />,
    );
    expect(
      screen.getByRole("grid", { name: "September 2026" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-10");
    // The caller has not moved it.
    expect(
      screen.getByRole("grid", { name: "September 2026" }),
    ).toBeInTheDocument();
  });

  it("keeps to its bounds", () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        {...base}
        min="2026-05-10"
        max="2026-06-20"
        defaultValue="2026-05-11"
        autoFocus
        onValueChange={onValueChange}
      />,
    );
    expect(day("Saturday, May 9, 2026")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(day("Sunday, May 10, 2026")).not.toHaveAttribute("aria-disabled");
    fireEvent.click(day("Saturday, May 9, 2026"));
    expect(onValueChange).not.toHaveBeenCalled();
    // The keyboard stops at the first day; the earlier month is out of reach.
    press("ArrowUp");
    expect(focused()).toBe(day("Sunday, May 10, 2026"));
    press("PageUp");
    expect(focused()).toBe(day("Sunday, May 10, 2026"));
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(day("Sunday, June 21, 2026")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("reaches a day the product closes, and does not choose it", () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        {...base}
        defaultValue="2026-05-22"
        autoFocus
        isDateUnavailable={(date) => date === "2026-05-23"}
        onValueChange={onValueChange}
      />,
    );
    press("ArrowRight");
    expect(focused()).toBe(day("Saturday, May 23, 2026"));
    expect(focused()).toHaveAttribute("aria-disabled", "true");
    press("Enter");
    fireEvent.click(focused());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("chooses a range: a start, then an end, in order, and starts again", () => {
    const onValueChange = vi.fn();
    render(<Calendar {...base} mode="range" onValueChange={onValueChange} />);
    expect(screen.getByRole("grid")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    fireEvent.click(day("Monday, May 25, 2026"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-05-25" });
    // The day under the pointer shows where the range would end.
    fireEvent.mouseOver(day("Thursday, May 21, 2026"));
    expect(day("Saturday, May 23, 2026")).toHaveAttribute("data-in-range");
    expect(day("Saturday, May 23, 2026")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    fireEvent.click(day("Thursday, May 21, 2026"));
    expect(onValueChange).toHaveBeenLastCalledWith({
      start: "2026-05-21",
      end: "2026-05-25",
    });
    const selected = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("aria-selected") === "true")
      .map((cell) => cell.textContent);
    expect(selected).toEqual(["21", "22", "23", "24", "25"]);
    expect(day("Thursday, May 21, 2026")).toHaveAttribute("data-selected");
    expect(day("Monday, May 25, 2026")).toHaveAttribute("data-selected");
    expect(day("Friday, May 22, 2026")).toHaveAttribute("data-in-range");
    fireEvent.click(day("Friday, May 29, 2026"));
    expect(onValueChange).toHaveBeenLastCalledWith({ start: "2026-05-29" });
  });

  it("shows two months, each its own grid, with one pair of buttons", () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar
        {...base}
        mode="range"
        months={2}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        onMonthChange={onMonthChange}
      />,
    );
    const [may, june] = screen.getAllByRole("grid");
    expect(may).toHaveAccessibleName("May 2026");
    expect(june).toHaveAccessibleName("June 2026");
    expect(screen.getAllByRole("button")).toHaveLength(2);
    // Moving into the second month moves nothing; past it, one month.
    act(() =>
      within(may)
        .getByRole("gridcell", { name: "Sunday, May 31, 2026" })
        .focus(),
    );
    // Wherever focus is put (a reader's cursor can put it on any day), the
    // tab stop follows it.
    expect(tabStops()).toEqual([day("Sunday, May 31, 2026")]);
    press("ArrowRight");
    expect(focused()).toBe(day("Monday, June 1, 2026"));
    expect(onMonthChange).not.toHaveBeenCalled();
    press("PageDown");
    expect(focused()).toBe(day("Wednesday, July 1, 2026"));
    expect(onMonthChange).toHaveBeenLastCalledWith("2026-06");
    expect(
      screen
        .getAllByRole("grid")
        .map((grid) => grid.getAttribute("aria-labelledby")),
    ).toHaveLength(2);
    expect(screen.getAllByRole("grid")[0]).toHaveAccessibleName("June 2026");
  });

  it("disabled: no tab stop and nothing to press", () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        {...base}
        disabled
        defaultValue="2026-05-25"
        onValueChange={onValueChange}
      />,
    );
    expect(tabStops()).toEqual([]);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-disabled", "true");
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
    fireEvent.click(day("Tuesday, May 12, 2026"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("read only: reached and read, not chosen", () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        {...base}
        readOnly
        defaultValue="2026-05-25"
        autoFocus
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
    press("ArrowRight");
    expect(focused()).toBe(day("Tuesday, May 26, 2026"));
    press("Enter");
    fireEvent.click(focused());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("forwards its ref and its own attributes", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Calendar {...base} ref={ref} className="extra" aria-label="Visit" />,
    );
    expect(ref.current).toHaveClass("kozmos-calendar", "extra");
    expect(ref.current).toHaveAttribute("aria-label", "Visit");
  });

  it.each<[string, CalendarProps]>([
    ["a day", { ...base, defaultValue: "2026-05-25" }],
    [
      "a range across two months",
      {
        ...base,
        mode: "range",
        months: 2,
        defaultValue: { start: "2026-05-21", end: "2026-06-03" },
      },
    ],
    [
      "bounds and closed days",
      {
        ...base,
        min: "2026-05-10",
        max: "2026-05-28",
        isDateUnavailable: (date) => date.endsWith("-16"),
      },
    ],
  ])("has no axe violations: %s", async (_name, props) => {
    const { container } = render(<Calendar {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
