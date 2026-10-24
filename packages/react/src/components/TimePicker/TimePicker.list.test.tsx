import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider } from "../ThemeProvider";
import { TimePicker } from "./TimePicker";

const props = { label: "Opening time", locale: "en-GB" } as const;
const field = () =>
  screen.getByLabelText("Opening time", { selector: "input" });
const button = () => screen.getByRole("button", { name: "Choose time" });
const list = () => screen.getByRole("listbox", { name: "Opening time" });
const labels = () =>
  screen.getAllByRole("option").map((option) => option.textContent);
const active = () =>
  document.getElementById(list().getAttribute("aria-activedescendant")!)
    ?.textContent;
const inProvider = (ui: React.ReactElement) =>
  render(<ThemeProvider theme="light">{ui}</ThemeProvider>);
const gone = () =>
  vi.waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
  );

describe("TimePicker's list", () => {
  it("opens a list of times from its button, on the field's time", async () => {
    const user = userEvent.setup();
    inProvider(<TimePicker {...props} defaultValue="09:30" />);
    expect(field()).toHaveAttribute("data-picker", "kozmos");
    expect(button()).toHaveAttribute("aria-haspopup", "listbox");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    await user.click(button());
    await screen.findByRole("listbox");
    expect(button()).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(list());
    expect(active()).toBe("09:30");
    // Every 30 minutes through the day, in the locale's clock.
    expect(labels()).toHaveLength(48);
    expect(labels().slice(0, 3)).toEqual(["00:00", "00:30", "01:00"]);
    expect(labels().at(-1)).toBe("23:30");
    expect(screen.getByRole("option", { name: "09:30" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("types the time chosen into the field, closes, and returns focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    inProvider(
      <TimePicker {...props} defaultValue="09:30" onChange={onChange} />,
    );
    const heard: string[] = [];
    for (const type of ["input", "change"])
      field().addEventListener(type, () => heard.push(type));
    await user.click(button());
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(field()).toHaveValue("10:00");
    expect(heard).toEqual(["input", "change"]);
    expect(onChange).toHaveBeenCalledTimes(1);
    await gone();
    expect(document.activeElement).toBe(button());
    // The pointer too.
    await user.click(button());
    await user.click(await screen.findByRole("option", { name: "12:00" }));
    expect(field()).toHaveValue("12:00");
  });

  it("closes on Escape with nothing changed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    inProvider(<TimePicker {...props} onChange={onChange} />);
    await user.click(button());
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await gone();
    expect(document.activeElement).toBe(button());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps to min, max and step, the field's own", async () => {
    inProvider(
      <TimePicker {...props} min="08:00" max="10:00" step={900} defaultOpen />,
    );
    await screen.findByRole("listbox");
    expect(labels()).toEqual([
      "08:00",
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "09:45",
      "10:00",
    ]);
    // Nothing chosen: the list starts on its first time.
    expect(active()).toBe("08:00");
  });

  it("draws the list in 12 or 24 hours, the locale's by default", async () => {
    const { unmount } = inProvider(
      <TimePicker
        {...props}
        locale="en-US"
        min="09:00"
        max="09:30"
        defaultOpen
      />,
    );
    await screen.findByRole("listbox");
    expect(labels()).toEqual(["9:00 AM", "9:30 AM"]);
    unmount();
    inProvider(
      <TimePicker
        {...props}
        locale="en-US"
        hourCycle="h23"
        min="13:00"
        max="13:30"
        defaultOpen
      />,
    );
    await screen.findByRole("listbox");
    expect(labels()).toEqual(["13:00", "13:30"]);
  });

  it("opens on Alt+Down Arrow and F4, unless the caller has taken them", async () => {
    const onKeyDown = vi.fn();
    const { unmount } = inProvider(
      <TimePicker {...props} onKeyDown={onKeyDown} />,
    );
    for (const init of [{ key: "ArrowDown", altKey: true }, { key: "F4" }]) {
      const event = new KeyboardEvent("keydown", {
        ...init,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        field().dispatchEvent(event);
      });
      expect(event.defaultPrevented, init.key).toBe(true);
      await screen.findByRole("listbox");
      fireEvent.keyDown(list(), { key: "Escape" });
      await gone();
    }
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    unmount();
    inProvider(
      <TimePicker {...props} onKeyDown={(event) => event.preventDefault()} />,
    );
    fireEvent.keyDown(field(), { key: "F4" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("is a controlled field's, and cannot open disabled or read only", async () => {
    function Form() {
      const [value, setValue] = React.useState("09:00");
      return (
        <TimePicker
          {...props}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          defaultOpen
        />
      );
    }
    const { unmount } = inProvider(<Form />);
    fireEvent.click(await screen.findByRole("option", { name: "17:30" }));
    expect(field()).toHaveValue("17:30");
    unmount();
    const { rerender } = inProvider(<TimePicker {...props} disabled />);
    expect(button()).toBeDisabled();
    rerender(
      <ThemeProvider theme="light">
        <TimePicker {...props} readOnly defaultOpen />
      </ThemeProvider>,
    );
    expect(button()).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("has no axe violations, closed and open", async () => {
    const { container } = inProvider(
      <TimePicker {...props} defaultValue="09:30" helperText="Local time." />,
    );
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(button());
    expect(await axe(await screen.findByRole("listbox"))).toHaveNoViolations();
  });
});
