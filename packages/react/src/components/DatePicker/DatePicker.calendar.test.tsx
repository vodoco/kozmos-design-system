import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider } from "../ThemeProvider";
import { DatePicker } from "./DatePicker";
import { canReplaceDatePicker } from "./date-picker-engine";

// What each engine's CSS answers, measured in Playwright on 21 Oct 2026:
// Chromium 145 has both pseudo-elements, WebKit 26.0 only WebKit's editor,
// Firefox 146 neither.
const ENGINES = {
  chromium: [
    "selector(::-webkit-calendar-picker-indicator)",
    "selector(::-webkit-datetime-edit)",
  ],
  webkit: ["selector(::-webkit-datetime-edit)"],
  firefox: [],
} as const;
const engine = (name: keyof typeof ENGINES) =>
  vi.stubGlobal("CSS", {
    supports: (query: string) =>
      (ENGINES[name] as readonly string[]).includes(query),
  });

afterEach(() => vi.unstubAllGlobals());

const props = {
  label: "Visit date",
  locale: "en-US",
  today: "2026-05-22",
} as const;
const field = () => screen.getByLabelText("Visit date", { selector: "input" });
// While the calendar is open it is modal: the page under it, the button
// included, is hidden from readers.
const button = () =>
  screen.getByRole("button", { name: "Choose date", hidden: true });
const inProvider = (ui: React.ReactElement) =>
  render(<ThemeProvider theme="light">{ui}</ThemeProvider>);

describe("DatePicker's calendar", () => {
  it("knows which engines can give the browser's button way, from their CSS", () => {
    engine("chromium");
    expect(canReplaceDatePicker()).toBe(true);
    engine("webkit");
    expect(canReplaceDatePicker()).toBe(true);
    engine("firefox");
    expect(canReplaceDatePicker()).toBe(false);
    vi.unstubAllGlobals();
    vi.stubGlobal("CSS", undefined);
    expect(canReplaceDatePicker()).toBe(false);
  });

  it("keeps the browser's field, untouched, where its button cannot be hidden", () => {
    engine("firefox");
    const { container } = inProvider(
      <DatePicker {...props} defaultValue="2026-05-25" defaultOpen />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(field()).not.toHaveAttribute("data-picker");
    expect(field()).not.toHaveClass("kozmos-date-input");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("opens the calendar from its button, on the field's day, and closes on a choice", async () => {
    engine("chromium");
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    inProvider(
      <DatePicker
        {...props}
        defaultValue="2026-05-25"
        onChange={onChange}
        onOpenChange={onOpenChange}
      />,
    );
    expect(field()).toHaveAttribute("data-picker", "kozmos");
    // A form's own listeners, outside React, hear a choice as typing.
    const heard: string[] = [];
    for (const type of ["input", "change"])
      field().addEventListener(type, () => heard.push(type));
    expect(button()).toHaveAttribute("aria-haspopup", "dialog");
    expect(button()).toHaveAttribute("aria-expanded", "false");
    await user.click(button());
    const dialog = await screen.findByRole("dialog", { name: "Visit date" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(button()).toHaveAttribute("aria-expanded", "true");
    expect(field().closest("[aria-hidden]")).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus is on the field's day.
    expect(document.activeElement).toHaveAccessibleName("Monday, May 25, 2026");
    await user.keyboard("{ArrowRight}{Enter}");
    expect(field()).toHaveValue("2026-05-26");
    expect(heard).toEqual(["input", "change"]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("2026-05-26");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(button());
  });

  it("opens on today when the field is empty, and Escape closes it, changing nothing", async () => {
    engine("webkit");
    const user = userEvent.setup();
    const onChange = vi.fn();
    inProvider(<DatePicker {...props} onChange={onChange} />);
    await user.click(button());
    await screen.findByRole("dialog");
    expect(document.activeElement).toHaveAccessibleName("Friday, May 22, 2026");
    await user.keyboard("{Escape}");
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(button());
    expect(field()).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("opens on Alt+Down Arrow and F4 in the field, instead of the browser's picker", async () => {
    engine("chromium");
    const onKeyDown = vi.fn();
    inProvider(<DatePicker {...props} onKeyDown={onKeyDown} />);
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
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      await vi.waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    }
    // The caller's handler still hears them, and can keep them.
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it("leaves the keys alone when the caller has taken them", () => {
    engine("chromium");
    inProvider(
      <DatePicker {...props} onKeyDown={(event) => event.preventDefault()} />,
    );
    fireEvent.keyDown(field(), { key: "F4" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("takes its bounds, closed days and labels to the calendar", async () => {
    engine("chromium");
    inProvider(
      <DatePicker
        {...props}
        defaultValue="2026-05-25"
        min="2026-05-10"
        isDateUnavailable={(date) => date === "2026-05-27"}
        chooseDateLabel="Datum wählen"
        previousMonthLabel="Vorheriger Monat"
        nextMonthLabel="Nächster Monat"
        defaultOpen
      />,
    );
    expect(
      await screen.findByRole("dialog", { name: "Visit date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Datum wählen", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Vorheriger Monat" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("gridcell", { name: "Saturday, May 9, 2026" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("gridcell", { name: "Wednesday, May 27, 2026" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("is a controlled field's: the caller's value, and its open state", async () => {
    engine("chromium");
    function Form() {
      const [value, setValue] = React.useState("2026-05-25");
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <DatePicker
            {...props}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            open={open}
            onOpenChange={setOpen}
          />
          <output>{value}</output>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    inProvider(<Form />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(
      await screen.findByRole("gridcell", { name: "Thursday, May 14, 2026" }),
    );
    expect(field()).toHaveValue("2026-05-14");
    expect(document.querySelector("output")).toHaveTextContent("2026-05-14");
  });

  it("cannot open disabled or read only", async () => {
    engine("chromium");
    const { rerender } = inProvider(<DatePicker {...props} disabled />);
    expect(button()).toBeDisabled();
    rerender(
      <ThemeProvider theme="light">
        <DatePicker {...props} readOnly defaultOpen />
      </ThemeProvider>,
    );
    expect(button()).toBeDisabled();
    expect(field()).toHaveAttribute("readonly");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no axe violations, closed and open", async () => {
    engine("chromium");
    const { container } = inProvider(
      <DatePicker {...props} defaultValue="2026-05-25" helperText="Any day." />,
    );
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(button());
    const dialog = await screen.findByRole("dialog");
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
