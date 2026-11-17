import * as React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../ThemeProvider";
import { MultiSelect } from "../MultiSelect";
import { TimePicker } from "../TimePicker";
import { DatePicker, DateRangePicker } from "../DatePicker";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// GAP-255, decision 188: MultiSelect, TimePicker, DatePicker and
// DateRangePicker take GAP-153's mixed state, as Input, NumberInput, Select
// and Combobox do.

const inProvider = (ui: React.ReactElement) =>
  render(<ThemeProvider theme="light">{ui}</ThemeProvider>);

/** Chromium's answer: the browser's own picker button can give way. */
const chromium = () =>
  vi.stubGlobal("CSS", {
    supports: (query: string) =>
      [
        "selector(::-webkit-calendar-picker-indicator)",
        "selector(::-webkit-datetime-edit)",
      ].includes(query),
  });

const options = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "toilets", label: "Toilets" },
  { value: "lift", label: "Lift" },
];

/**
 * An array property's MultiSelect across a multi-selection, as Pointr
 * Cloud's property editor holds it: mixed while the features' choices
 * differ and the visitor has not chosen, the reset offered after.
 */
function EditedFacilities({
  onValueChange,
  onReset,
}: {
  onValueChange?: (value: string[]) => void;
  onReset?: () => void;
}) {
  const [edit, setEdit] = React.useState<string[] | undefined>(undefined);
  return (
    <MultiSelect
      label="Facilities"
      options={options}
      // While mixed, the first feature's choices, which the field must not
      // show.
      value={edit ?? ["wifi", "lift"]}
      mixed={edit === undefined}
      onValueChange={(next) => {
        setEdit(next);
        onValueChange?.(next);
      }}
      onResetMixed={() => {
        setEdit(undefined);
        onReset?.();
      }}
    />
  );
}

const facilities = () => screen.getByRole("combobox", { name: "Facilities" });
const reset = () =>
  screen.queryByRole("button", { name: "Reset to multiple values" });

describe("mixed value (GAP-255)", () => {
  describe("MultiSelect", () => {
    it("shows no chips and the mixed placeholder, said once by it, with nothing to clear", () => {
      render(
        <MultiSelect
          label="Facilities"
          options={options}
          value={["wifi", "lift"]}
          mixed
        />,
      );
      const field = facilities();
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveAttribute("data-mixed", "");
      expect(field).not.toHaveAccessibleDescription();
      // No chip of the features' own, drawn or said.
      expect(screen.queryByText("Wi-Fi")).not.toBeInTheDocument();
      expect(screen.queryByText("Lift")).not.toBeInTheDocument();
      expect(document.body.textContent).not.toContain("Multiple values");
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).not.toBeInTheDocument();
      expect(reset()).not.toBeInTheDocument();
    });

    it("opens with no option chosen, and a choice is that option alone", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditedFacilities onValueChange={onValueChange} />);
      await user.click(facilities());
      const list = await screen.findByRole("listbox");
      for (const option of within(list).getAllByRole("option"))
        expect(option).toHaveAttribute("aria-selected", "false");
      await user.click(within(list).getByRole("option", { name: "Toilets" }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenLastCalledWith(["toilets"]);
      // The product ended the mixed state: the choice shows.
      expect(facilities()).not.toHaveAttribute("data-mixed");
      expect(facilities()).toHaveAttribute("placeholder", "");
      expect(
        screen.getByRole("button", { name: "Remove Toilets" }),
      ).toBeInTheDocument();
    });

    it("removes nothing with Backspace while mixed", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <MultiSelect
          label="Facilities"
          options={options}
          defaultValue={["wifi"]}
          mixed
          onValueChange={onValueChange}
        />,
      );
      await user.click(facilities());
      await user.keyboard("{Backspace}");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("offers the reset once chosen, which brings the mixed state back and focus to the field", async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();
      render(<EditedFacilities onReset={onReset} />);
      expect(reset()).not.toBeInTheDocument();
      await user.click(facilities());
      await user.click(await screen.findByRole("option", { name: "Lift" }));
      await user.click(reset()!);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(facilities()).toHaveAttribute("placeholder", "Multiple values");
      expect(facilities()).toHaveFocus();
      expect(screen.queryByText("Lift")).not.toBeInTheDocument();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(reset()).not.toBeInTheDocument();
    });

    it("names the reset in the product's words, and offers none while disabled or read-only", () => {
      const { rerender } = render(
        <MultiSelect
          label="Facilities"
          options={options}
          value={["wifi"]}
          mixed={false}
          onResetMixed={() => {}}
          resetMixedLabel="Back to several"
          mixedLabel="Several"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Back to several" }),
      ).toBeInTheDocument();
      for (const locked of [{ disabled: true }, { readOnly: true }]) {
        rerender(
          <MultiSelect
            label="Facilities"
            options={options}
            value={["wifi"]}
            onResetMixed={() => {}}
            {...locked}
          />,
        );
        expect(reset()).not.toBeInTheDocument();
      }
    });

    it("drops an uncontrolled choice as it turns mixed, never showing it again", () => {
      const { rerender } = render(
        <MultiSelect
          label="Facilities"
          options={options}
          defaultValue={["wifi"]}
        />,
      );
      expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
      rerender(
        <MultiSelect
          label="Facilities"
          options={options}
          defaultValue={["wifi"]}
          mixed
        />,
      );
      expect(screen.queryByText("Wi-Fi")).not.toBeInTheDocument();
      rerender(
        <MultiSelect
          label="Facilities"
          options={options}
          defaultValue={["wifi"]}
          mixed={false}
        />,
      );
      expect(screen.queryByText("Wi-Fi")).not.toBeInTheDocument();
    });
  });

  describe("TimePicker", () => {
    function EditedTime({ onReset }: { onReset?: () => void }) {
      const [edit, setEdit] = React.useState<string | undefined>(undefined);
      return (
        <TimePicker
          label="Opens"
          locale="en-GB"
          value={edit ?? "09:30"}
          mixed={edit === undefined}
          onChange={(event) => setEdit(event.target.value)}
          onResetMixed={() => {
            setEdit(undefined);
            onReset?.();
          }}
        />
      );
    }
    const field = () => screen.getByLabelText("Opens", { selector: "input" });

    it("shows no time, the mixed label drawn over the empty field and said once, as its description", () => {
      const { container } = inProvider(
        <TimePicker label="Opens" value="09:30" onChange={() => {}} mixed />,
      );
      expect(field()).toHaveValue("");
      expect(field()).toHaveAttribute("data-mixed", "");
      expect(field()).toHaveAccessibleDescription("Multiple values");
      expect(field()).not.toHaveAttribute("placeholder");
      const drawn = container.querySelector(".kozmos-temporal-mixed");
      expect(drawn).toHaveTextContent("Multiple values");
      expect(drawn).toHaveAttribute("aria-hidden", "true");
    });

    it("opens its list on no time, and a chosen time is the edit", async () => {
      const user = userEvent.setup();
      inProvider(<EditedTime />);
      await user.click(screen.getByRole("button", { name: "Choose time" }));
      const list = await screen.findByRole("listbox");
      expect(
        within(list).queryByRole("option", { selected: true }),
      ).not.toBeInTheDocument();
      await user.click(within(list).getByRole("option", { name: "10:00" }));
      expect(field()).toHaveValue("10:00");
      expect(field()).not.toHaveAttribute("data-mixed");
      expect(field()).not.toHaveAccessibleDescription();
      expect(
        document.querySelector(".kozmos-temporal-mixed"),
      ).not.toBeInTheDocument();
    });

    it("offers the reset once edited, which brings the mixed state back and focus to the field", async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();
      inProvider(<EditedTime onReset={onReset} />);
      expect(reset()).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Choose time" }));
      await user.click(await screen.findByRole("option", { name: "10:00" }));
      await vi.waitFor(() =>
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
      );
      await user.click(reset()!);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(field()).toHaveValue("");
      expect(field()).toHaveAccessibleDescription("Multiple values");
      expect(field()).toHaveFocus();
      expect(reset()).not.toBeInTheDocument();
    });

    it("empties an uncontrolled field as it turns mixed, and offers no reset while disabled or read-only", () => {
      const { rerender } = inProvider(
        <TimePicker label="Opens" defaultValue="09:30" />,
      );
      expect(field()).toHaveValue("09:30");
      rerender(
        <ThemeProvider theme="light">
          <TimePicker label="Opens" defaultValue="09:30" mixed />
        </ThemeProvider>,
      );
      expect(field()).toHaveValue("");
      rerender(
        <ThemeProvider theme="light">
          <TimePicker
            label="Opens"
            value="09:30"
            onChange={() => {}}
            onResetMixed={() => {}}
          />
        </ThemeProvider>,
      );
      expect(reset()).toBeInTheDocument();
      for (const locked of [{ disabled: true }, { readOnly: true }]) {
        rerender(
          <ThemeProvider theme="light">
            <TimePicker
              label="Opens"
              value="09:30"
              onChange={() => {}}
              onResetMixed={() => {}}
              {...locked}
            />
          </ThemeProvider>,
        );
        expect(reset()).not.toBeInTheDocument();
      }
    });
  });

  describe("DatePicker", () => {
    function EditedDate({ onReset }: { onReset?: () => void }) {
      const [edit, setEdit] = React.useState<string | undefined>(undefined);
      return (
        <DatePicker
          label="Opens on"
          locale="en-US"
          today="2026-05-22"
          value={edit ?? "2026-05-25"}
          mixed={edit === undefined}
          onChange={(event) => setEdit(event.target.value)}
          onResetMixed={() => {
            setEdit(undefined);
            onReset?.();
          }}
        />
      );
    }
    const field = () =>
      screen.getByLabelText("Opens on", { selector: "input" });

    it("shows no date, the mixed label drawn over the empty field and said once, as its description", () => {
      chromium();
      const { container } = inProvider(
        <DatePicker
          label="Opens on"
          value="2026-05-25"
          onChange={() => {}}
          mixed
          mixedLabel="Several dates"
        />,
      );
      expect(field()).toHaveValue("");
      expect(field()).toHaveAttribute("data-mixed", "");
      expect(field()).toHaveAccessibleDescription("Several dates");
      const drawn = container.querySelector(".kozmos-temporal-mixed");
      expect(drawn).toHaveTextContent("Several dates");
      expect(drawn).toHaveAttribute("aria-hidden", "true");
    });

    it("opens its calendar on no day, a chosen day is the edit, and the reset brings the mixed state back", async () => {
      chromium();
      const user = userEvent.setup();
      const onReset = vi.fn();
      inProvider(<EditedDate onReset={onReset} />);
      await user.click(
        screen.getByRole("button", { name: "Choose date", hidden: true }),
      );
      const dialog = await screen.findByRole("dialog", { name: "Opens on" });
      expect(
        dialog.querySelector('[aria-selected="true"]'),
      ).not.toBeInTheDocument();
      // Focus is on today, the calendar's own stop with no day chosen.
      expect(document.activeElement).toHaveAccessibleName(
        "Friday, May 22, 2026",
      );
      await user.keyboard("{ArrowRight}{Enter}");
      expect(field()).toHaveValue("2026-05-23");
      expect(field()).not.toHaveAttribute("data-mixed");
      await vi.waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      await user.click(reset()!);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(field()).toHaveValue("");
      expect(field()).toHaveAccessibleDescription("Multiple values");
      expect(field()).toHaveFocus();
    });

    it("offers the reset only while it is not mixed, disabled or read-only", () => {
      const { rerender } = inProvider(
        <DatePicker label="Opens on" onResetMixed={() => {}} />,
      );
      expect(reset()).toBeInTheDocument();
      rerender(
        <ThemeProvider theme="light">
          <DatePicker label="Opens on" mixed onResetMixed={() => {}} />
        </ThemeProvider>,
      );
      expect(reset()).not.toBeInTheDocument();
      for (const locked of [{ disabled: true }, { readOnly: true }]) {
        rerender(
          <ThemeProvider theme="light">
            <DatePicker
              label="Opens on"
              defaultValue="2026-05-25"
              onResetMixed={() => {}}
              {...locked}
            />
          </ThemeProvider>,
        );
        expect(reset()).not.toBeInTheDocument();
      }
    });
  });

  describe("DateRangePicker", () => {
    it("shows neither end, each said mixed once, and one reset for the range that hands focus to the start", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onReset = vi.fn();
      function EditedClosure() {
        const [edit, setEdit] = React.useState<
          { start?: string; end?: string } | undefined
        >(undefined);
        return (
          <DateRangePicker
            label="Closed"
            value={edit ?? { start: "2026-05-21", end: "2026-05-25" }}
            mixed={edit === undefined}
            onValueChange={(next) => {
              setEdit(next);
              onValueChange(next);
            }}
            onResetMixed={() => {
              setEdit(undefined);
              onReset();
            }}
          />
        );
      }
      const { container } = inProvider(<EditedClosure />);
      const [start, end] = container.querySelectorAll("input");
      expect(start).toHaveAccessibleName("Start date");
      expect(end).toHaveAccessibleName("End date");
      for (const field of [start, end]) {
        expect(field).toHaveValue("");
        expect(field).toHaveAttribute("data-mixed", "");
        expect(field).toHaveAccessibleDescription("Multiple values");
      }
      expect(container.querySelectorAll(".kozmos-temporal-mixed")).toHaveLength(
        2,
      );
      expect(reset()).not.toBeInTheDocument();

      await user.type(start, "2026-05-21");
      expect(onValueChange).toHaveBeenLastCalledWith({
        start: "2026-05-21",
        end: "",
      });
      expect(end).not.toHaveAttribute("data-mixed");
      expect(
        screen.getAllByRole("button", { name: "Reset to multiple values" }),
      ).toHaveLength(1);
      await user.click(reset()!);
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(start).toHaveValue("");
      expect(start).toHaveAttribute("data-mixed", "");
      expect(start).toHaveFocus();
    });

    it("drops an uncontrolled range as it turns mixed", () => {
      const range = { start: "2026-05-21", end: "2026-05-25" };
      const { container, rerender } = inProvider(
        <DateRangePicker label="Closed" defaultValue={range} />,
      );
      const start = () => container.querySelector("input");
      expect(start()).toHaveValue("2026-05-21");
      rerender(
        <ThemeProvider theme="light">
          <DateRangePicker label="Closed" defaultValue={range} mixed />
        </ThemeProvider>,
      );
      expect(start()).toHaveValue("");
      rerender(
        <ThemeProvider theme="light">
          <DateRangePicker label="Closed" defaultValue={range} />
        </ThemeProvider>,
      );
      expect(start()).toHaveValue("");
    });
  });
});
