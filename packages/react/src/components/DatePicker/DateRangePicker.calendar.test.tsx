import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider } from "../ThemeProvider";
import { DateRangePicker, type DateRangeValue } from "./DatePicker";

// Chromium's CSS answer (DatePicker.calendar.test.tsx has each engine's).
const kozmos = () =>
  vi.stubGlobal("CSS", {
    supports: (query: string) =>
      query === "selector(::-webkit-calendar-picker-indicator)",
  });
const firefox = () => vi.stubGlobal("CSS", { supports: () => false });
afterEach(() => vi.unstubAllGlobals());

const props = {
  label: "Stay",
  locale: "en-US",
  today: "2026-05-22",
} as const;
const start = () => screen.getByLabelText("Start date", { selector: "input" });
const end = () => screen.getByLabelText("End date", { selector: "input" });
// Modal while open: the page under it, the buttons included, is hidden.
const buttons = () =>
  screen.getAllByRole("button", { name: "Choose dates", hidden: true });
const inProvider = (ui: React.ReactElement) =>
  render(<ThemeProvider theme="light">{ui}</ThemeProvider>);
const gone = () =>
  vi.waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );

describe("DateRangePicker's calendar", () => {
  it("keeps the browser's fields, as they were, where its button cannot be hidden", () => {
    firefox();
    const { container } = inProvider(
      <DateRangePicker
        {...props}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        defaultOpen
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    for (const field of [start(), end()]) {
      expect(field).not.toHaveAttribute("data-picker");
      // Each field sits in its <label>, as on main.
      expect(field.closest("label")).toHaveClass("kozmos-date-range-label");
    }
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("opens two months from either field's button, each named and described by its field", async () => {
    kozmos();
    const user = userEvent.setup();
    inProvider(
      <DateRangePicker
        {...props}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
      />,
    );
    const [startButton, endButton] = buttons();
    expect(startButton).toHaveAccessibleDescription("Start date");
    expect(endButton).toHaveAccessibleDescription("End date");
    expect(start()).toHaveAttribute("data-picker", "kozmos");
    await user.click(endButton);
    const dialog = await screen.findByRole("dialog", { name: "Stay" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getAllByRole("grid")).toHaveLength(2);
    // Opened from the end field: focus on its day.
    expect(document.activeElement).toHaveAccessibleName("Monday, May 25, 2026");
    await user.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(endButton);
    await user.click(startButton);
    await screen.findByRole("dialog");
    expect(document.activeElement).toHaveAccessibleName(
      "Thursday, May 21, 2026",
    );
  });

  it("chooses a start, then an end, filling both fields, and closes on the end", async () => {
    kozmos();
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    inProvider(
      <DateRangePicker
        {...props}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        onValueChange={onValueChange}
      />,
    );
    await user.click(buttons()[0]);
    await user.click(
      await screen.findByRole("gridcell", { name: "Monday, May 18, 2026" }),
    );
    // A new start clears the end, and the calendar stays open for it.
    expect(onValueChange).toHaveBeenLastCalledWith({
      start: "2026-05-18",
      end: "",
    });
    expect(start()).toHaveValue("2026-05-18");
    expect(end()).toHaveValue("");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(
      screen.getByRole("gridcell", { name: "Wednesday, June 3, 2026" }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith({
      start: "2026-05-18",
      end: "2026-06-03",
    });
    expect(end()).toHaveValue("2026-06-03");
    await gone();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it("puts a range chosen backwards in order", async () => {
    kozmos();
    const onValueChange = vi.fn();
    inProvider(
      <DateRangePicker {...props} onValueChange={onValueChange} defaultOpen />,
    );
    fireEvent.click(
      await screen.findByRole("gridcell", { name: "Friday, May 29, 2026" }),
    );
    fireEvent.click(
      screen.getByRole("gridcell", { name: "Monday, May 11, 2026" }),
    );
    expect(onValueChange).toHaveBeenLastCalledWith({
      start: "2026-05-11",
      end: "2026-05-29",
    });
  });

  it("shows one month where the window has no room for two, or as asked", async () => {
    kozmos();
    const width = vi.spyOn(window, "innerWidth", "get").mockReturnValue(390);
    const user = userEvent.setup();
    const { unmount } = inProvider(<DateRangePicker {...props} />);
    await user.click(buttons()[0]);
    expect(
      within(await screen.findByRole("dialog")).getAllByRole("grid"),
    ).toHaveLength(1);
    unmount();
    width.mockReturnValue(1280);
    inProvider(<DateRangePicker {...props} months={1} defaultOpen />);
    expect(
      within(await screen.findByRole("dialog")).getAllByRole("grid"),
    ).toHaveLength(1);
  });

  it("opens on Alt+Down Arrow and F4 in either field", async () => {
    kozmos();
    inProvider(<DateRangePicker {...props} />);
    for (const [field, init] of [
      [start(), { key: "ArrowDown", altKey: true }],
      [end(), { key: "F4" }],
    ] as const) {
      const event = new KeyboardEvent("keydown", {
        ...init,
        bubbles: true,
        cancelable: true,
      });
      React.act(() => {
        field.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(true);
      await screen.findByRole("dialog");
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      await gone();
    }
  });

  it("names the range once, its fields' labels read only (GAP-051)", () => {
    kozmos();
    inProvider(<DateRangePicker {...props} hideFieldLabels />);
    for (const name of ["Start date", "End date"]) {
      const text = screen.getByText(name);
      expect(text).toHaveClass("sr-only");
      expect(screen.getByLabelText(name, { selector: "input" })).toBeVisible();
    }
    expect(screen.getByText("Stay")).not.toHaveClass("sr-only");
  });

  it("is a controlled range's, and cannot open disabled or read only", async () => {
    kozmos();
    function Filter() {
      const [value, setValue] = React.useState<DateRangeValue>({
        start: "2026-05-21",
        end: "2026-05-25",
      });
      return (
        <DateRangePicker
          {...props}
          value={value}
          onValueChange={setValue}
          defaultOpen
        />
      );
    }
    const { unmount } = inProvider(<Filter />);
    fireEvent.click(
      await screen.findByRole("gridcell", { name: "Sunday, May 10, 2026" }),
    );
    fireEvent.click(
      screen.getByRole("gridcell", { name: "Tuesday, May 12, 2026" }),
    );
    expect(start()).toHaveValue("2026-05-10");
    expect(end()).toHaveValue("2026-05-12");
    unmount();
    inProvider(<DateRangePicker {...props} readOnly defaultOpen />);
    for (const button of buttons()) expect(button).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no axe violations, closed and open", async () => {
    kozmos();
    const { container } = inProvider(
      <DateRangePicker
        {...props}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        helperText="Up to a month."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(buttons()[0]);
    expect(await axe(await screen.findByRole("dialog"))).toHaveNoViolations();
  });
});
