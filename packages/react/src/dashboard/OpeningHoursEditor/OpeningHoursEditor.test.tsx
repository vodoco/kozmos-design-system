import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom/vitest";
import { ThemeProvider } from "../../components/ThemeProvider";
import {
  DEFAULT_OPENING_HOURS,
  OpeningHoursEditor,
  type OpeningHours,
} from "./OpeningHoursEditor";
import * as dashboard from "../index";

// Each day's choice is a group named by the day; its row holds the rest.
const choices = (name: string) => screen.getByRole("group", { name });
const day = (name: string) =>
  choices(name).closest(".kozmos-opening-hours-day") as HTMLElement;
const choice = (name: string, option: string) =>
  within(choices(name)).getByRole("radio", { name: option });
const time = (label: string) =>
  screen.getByLabelText(label, { selector: "input" }) as HTMLInputElement;

describe("OpeningHoursEditor", () => {
  it("is exported from the ./dashboard entry", () => {
    expect(dashboard.OpeningHoursEditor).toBe(OpeningHoursEditor);
    expect(dashboard.DEFAULT_OPENING_HOURS).toBe(DEFAULT_OPENING_HOURS);
  });

  it("starts as Cloud's new field: Monday to Friday 08:00–22:00, the weekend closed", () => {
    render(<OpeningHoursEditor locale="en-GB" />);
    const days = screen
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-labelledby"))
      .map((id) => document.getElementById(id!)!.textContent);
    expect(days).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    for (const name of ["Monday", "Friday"]) {
      expect(choice(name, "Hours")).toHaveAttribute("aria-checked", "true");
      expect(time(`${name} opening time`).value).toBe("08:00");
      expect(time(`${name} closing time`).value).toBe("22:00");
    }
    for (const name of ["Saturday", "Sunday"]) {
      expect(choice(name, "Closed")).toHaveAttribute("aria-checked", "true");
      expect(within(day(name)).queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(`${name} opening time`),
      ).not.toBeInTheDocument();
    }
  });

  it("names the days in the locale's words, from the week start asked for", () => {
    render(<OpeningHoursEditor locale="de" weekStart="sunday" />);
    const groups = screen.getAllByRole("group", { name: /tag$/ });
    expect(groups[0]).toHaveAccessibleName("Sonntag");
    expect(groups[1]).toHaveAccessibleName("Montag");
    expect(
      screen.getByLabelText("Montag opening time", { selector: "input" }),
    ).toBeInTheDocument();
  });

  it("is reached and changed by keyboard: Closed, Always open, and Hours with the day's own times back", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const week: OpeningHours = {
      ...DEFAULT_OPENING_HOURS,
      monday: { open: "09:30", close: "17:00" },
    };
    render(
      <OpeningHoursEditor
        locale="en-GB"
        defaultValue={week}
        onValueChange={onValueChange}
      />,
    );
    // The first tab stop is Monday's choice: Cloud's editor had none.
    await user.tab();
    expect(choice("Monday", "Hours")).toHaveFocus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ monday: { closed: true } }),
      "monday",
    );
    expect(
      screen.queryByLabelText("Monday opening time"),
    ).not.toBeInTheDocument();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ monday: { alwaysOpen: true } }),
      "monday",
    );
    await user.keyboard("{Home}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ monday: { open: "09:30", close: "17:00" } }),
      "monday",
    );
    // Then into the times, each a tab stop.
    await user.tab();
    expect(time("Monday opening time")).toHaveFocus();
  });

  it("steps the times by five minutes, carrying into the hour (decision 179)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ThemeProvider theme="light">
        <OpeningHoursEditor locale="en-GB" onValueChange={onValueChange} />
      </ThemeProvider>,
    );
    await user.click(
      screen.getByRole("button", { name: "Choose Monday opening time" }),
    );
    const list = await screen.findByRole("listbox", {
      name: "Choose Monday opening time",
    });
    expect(list).toHaveFocus();
    // 08:00, back one step: 07:55, not Cloud's 08:55.
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ monday: { open: "07:55", close: "22:00" } }),
      "monday",
    );
  });

  it("steps the time fields' own arrows by the step, carrying and wrapping, not the browser's one", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <OpeningHoursEditor
        locale="en-GB"
        defaultValue={{
          ...DEFAULT_OPENING_HOURS,
          tuesday: { open: "08:03", close: "23:55" },
        }}
        onValueChange={onValueChange}
      />,
    );
    const last = () => onValueChange.mock.lastCall;
    // 08:00 back one step carries into the hour: 07:55.
    await user.click(time("Monday opening time"));
    await user.keyboard("{ArrowDown}");
    expect(last()).toEqual([
      expect.objectContaining({ monday: { open: "07:55", close: "22:00" } }),
      "monday",
    ]);
    expect(time("Monday opening time")).toHaveValue("07:55");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(time("Monday opening time")).toHaveValue("08:05");
    // Off the grid, a step lands on it: 08:03 up is 08:05, down 08:00.
    await user.click(time("Tuesday opening time"));
    await user.keyboard("{ArrowUp}");
    expect(time("Tuesday opening time")).toHaveValue("08:05");
    // Round midnight: 23:55 on is 00:00 (an overnight close, so "+1 day").
    await user.click(time("Tuesday closing time"));
    await user.keyboard("{ArrowUp}");
    expect(last()).toEqual([
      expect.objectContaining({ tuesday: { open: "08:05", close: "00:00" } }),
      "tuesday",
    ]);
    expect(within(day("Tuesday")).getByText("+1 day")).toBeInTheDocument();
    // The arrows are the editor's: the browser's default is prevented.
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    time("Wednesday opening time").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    // Alt+Down Arrow still opens the list.
    await user.click(time("Thursday opening time"));
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(
      await screen.findByRole("listbox", {
        name: "Choose Thursday opening time",
      }),
    ).toBeInTheDocument();
    expect(time("Thursday opening time")).toHaveValue("08:00");
  });

  it('does not say "+1 day" for a cleared or partial closing time', () => {
    render(
      <OpeningHoursEditor
        locale="en-GB"
        value={{
          ...DEFAULT_OPENING_HOURS,
          monday: { open: "08:00", close: "" },
          tuesday: { open: "", close: "02:00" },
        }}
      />,
    );
    expect(screen.queryByText("+1 day")).toBeNull();
    expect(time("Monday closing time")).not.toHaveAttribute("aria-describedby");
  });

  it('allows overnight hours, and says "+1 day" beside the close, to the field too', () => {
    const { rerender } = render(
      <OpeningHoursEditor
        locale="en-GB"
        value={{
          ...DEFAULT_OPENING_HOURS,
          friday: { open: "18:00", close: "02:00" },
        }}
      />,
    );
    const next = within(day("Friday")).getByText("+1 day");
    expect(time("Friday closing time")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(next.id),
    );
    expect(within(day("Thursday")).queryByText("+1 day")).toBeNull();
    rerender(
      <OpeningHoursEditor locale="en-GB" value={DEFAULT_OPENING_HOURS} />,
    );
    expect(screen.queryByText("+1 day")).toBeNull();
    expect(time("Friday closing time")).not.toHaveAttribute("aria-describedby");
  });

  it("shows a mixed day as no choice and its label, until one is chosen, and offers the reset", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const reset = vi.fn();
    const { rerender } = render(
      <OpeningHoursEditor
        locale="en-GB"
        value={DEFAULT_OPENING_HOURS}
        mixedDays={["monday"]}
        onValueChange={onValueChange}
      />,
    );
    for (const option of ["Hours", "Closed", "Always open"])
      expect(choice("Monday", option)).toHaveAttribute("aria-checked", "false");
    expect(within(day("Monday")).getByText("Multiple values")).toBeVisible();
    expect(screen.queryByLabelText("Monday opening time")).toBeNull();
    await user.click(choice("Monday", "Hours"));
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ monday: { open: "08:00", close: "22:00" } }),
      "monday",
    );
    rerender(
      <OpeningHoursEditor
        locale="en-GB"
        value={DEFAULT_OPENING_HOURS}
        onResetMixed={{ monday: reset }}
      />,
    );
    await user.click(
      within(day("Monday")).getByRole("button", {
        name: "Reset to multiple values",
      }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
    expect(
      within(day("Tuesday")).queryByRole("button", {
        name: "Reset to multiple values",
      }),
    ).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <OpeningHoursEditor
        locale="en-GB"
        value={{
          ...DEFAULT_OPENING_HOURS,
          friday: { open: "18:00", close: "02:00" },
        }}
        mixedDays={["sunday"]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
