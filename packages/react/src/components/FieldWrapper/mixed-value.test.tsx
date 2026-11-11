import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../Input";
import { NumberInput } from "../NumberInput";
import { Combobox } from "../Combobox/Combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select/Select";

afterEach(cleanup);

// GAP-153: a field of a multi-selection whose values differ.

/**
 * A property editor's field across a multi-selection, as Pointr Cloud's
 * holds it: mixed while the values differ and nothing is typed, the reset
 * offered once the visitor has edited it.
 */
function EditedText({ onReset }: { onReset?: () => void }) {
  const [edit, setEdit] = React.useState<string | undefined>(undefined);
  return (
    <Input
      label="Name"
      placeholder="Name"
      mixed={edit === undefined}
      value={edit ?? ""}
      onChange={(event) => setEdit(event.target.value)}
      onResetMixed={() => {
        setEdit(undefined);
        onReset?.();
      }}
    />
  );
}

describe("mixed value (GAP-153)", () => {
  describe("Input", () => {
    it("shows no value, the mixed placeholder, and is described as mixed", () => {
      render(
        <Input
          label="Name"
          mixed
          value="Gate A1"
          placeholder="Name"
          readOnly
        />,
      );
      const field = screen.getByRole("textbox", { name: "Name" });
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveAccessibleDescription("Multiple values");
      expect(field).toHaveAttribute("data-mixed", "");
    });

    it("takes its own words, and keeps a caller's description", () => {
      render(
        <>
          <p id="hint">Shown to visitors</p>
          <Input
            aria-describedby="hint"
            label="Name"
            mixed
            mixedLabel="Mehrere Werte"
            defaultValue="Gate A1"
          />
        </>,
      );
      const field = screen.getByRole("textbox", { name: "Name" });
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Mehrere Werte");
      expect(field).toHaveAccessibleDescription(
        "Shown to visitors Mehrere Werte",
      );
    });

    it("offers no reset while it is mixed", () => {
      const { rerender } = render(
        <Input label="Name" mixed onResetMixed={() => {}} />,
      );
      expect(
        screen.queryByRole("button", { name: "Reset to multiple values" }),
      ).toBeNull();
      rerender(<Input label="Name" onResetMixed={() => {}} />);
      expect(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      ).toBeInTheDocument();
    });

    it("keeps the mixed state until edited, then offers the reset", async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();
      render(<EditedText onReset={onReset} />);
      const field = screen.getByRole("textbox", { name: "Name" });
      expect(field).toHaveAttribute("placeholder", "Multiple values");

      await user.type(field, "B2");
      expect(field).toHaveValue("B2");
      expect(field).toHaveAttribute("placeholder", "Name");
      expect(field).not.toHaveAccessibleDescription("Multiple values");

      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveFocus();
      expect(
        screen.queryByRole("button", { name: "Reset to multiple values" }),
      ).toBeNull();
    });

    it("names the reset in the product's words", () => {
      render(
        <Input
          label="Name"
          value="B2"
          onChange={() => {}}
          onResetMixed={() => {}}
          resetMixedLabel="Back to every value"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Back to every value" }),
      ).toBeInTheDocument();
    });

    it("offers no reset while disabled or read-only", () => {
      const { rerender } = render(
        <Input label="Name" value="B2" readOnly onResetMixed={() => {}} />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      rerender(
        <Input
          label="Name"
          value="B2"
          onChange={() => {}}
          onResetMixed={() => {}}
        />,
      );
      expect(screen.getByRole("button")).toHaveTextContent(
        "Reset to multiple values",
      );
      rerender(
        <Input label="Name" value="B2" disabled onResetMixed={() => {}} />,
      );
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("empties an uncontrolled field's typed text on reset", () => {
      function Uncontrolled() {
        const [mixed, setMixed] = React.useState(false);
        return (
          <Input
            label="Name"
            mixed={mixed}
            onResetMixed={() => setMixed(true)}
          />
        );
      }
      render(<Uncontrolled />);
      const field = screen.getByRole("textbox", { name: "Name" });
      fireEvent.change(field, { target: { value: "B2" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
    });
  });

  describe("NumberInput", () => {
    it("shows no value and is described as mixed until edited", async () => {
      const user = userEvent.setup();
      function Edited() {
        const [edit, setEdit] = React.useState<number | null | undefined>(
          undefined,
        );
        return (
          <NumberInput
            label="Height"
            mixed={edit === undefined}
            value={edit ?? ""}
            onValueChange={setEdit}
            onResetMixed={() => setEdit(undefined)}
          />
        );
      }
      render(<Edited />);
      const field = screen.getByRole("spinbutton", { name: "Height" });
      expect(field).toHaveValue(null);
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveAccessibleDescription("Multiple values");

      await user.click(screen.getByRole("button", { name: "Increase value" }));
      expect(field).toHaveValue(1);
      expect(field).not.toHaveAttribute("data-mixed");

      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(field).toHaveValue(null);
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveFocus();
    });

    it("hides a controlled value while mixed", () => {
      render(
        <NumberInput label="Height" mixed value={4} onChange={() => {}} />,
      );
      expect(screen.getByRole("spinbutton", { name: "Height" })).toHaveValue(
        null,
      );
    });
  });

  describe("Select", () => {
    it("shows the mixed placeholder, checks no option and is described as mixed", () => {
      render(
        <Select mixed value="poi" onValueChange={() => {}}>
          <SelectTrigger aria-label="Type">
            <SelectValue placeholder="Choose a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="poi">POI</SelectItem>
          </SelectContent>
        </Select>,
      );
      const trigger = screen.getByRole("combobox", { name: "Type" });
      expect(trigger).toHaveTextContent("Multiple values");
      expect(trigger).not.toHaveTextContent("POI");
      expect(trigger).toHaveAttribute("data-placeholder");
      expect(trigger).toHaveAttribute("data-mixed", "");
      expect(trigger).toHaveAccessibleDescription("Multiple values");
      expect(
        screen.queryByRole("button", { name: "Reset to multiple values" }),
      ).toBeNull();
    });

    it("offers the reset once chosen, and goes back to mixed", async () => {
      const user = userEvent.setup();
      function Edited() {
        const [edit, setEdit] = React.useState<string | undefined>("poi");
        return (
          <Select
            mixed={edit === undefined}
            value={edit}
            onValueChange={setEdit}
            onResetMixed={() => setEdit(undefined)}
          >
            <SelectTrigger aria-label="Type">
              <SelectValue placeholder="Choose a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poi">POI</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      render(<Edited />);
      const trigger = screen.getByRole("combobox", { name: "Type" });
      expect(trigger).toHaveTextContent("POI");
      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(trigger).toHaveTextContent("Multiple values");
      expect(trigger).toHaveFocus();
    });

    it("offers no reset while disabled", () => {
      const field = (disabled: boolean) => (
        <Select value="poi" onResetMixed={() => {}}>
          <SelectTrigger aria-label="Type" disabled={disabled}>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const { rerender } = render(field(false));
      expect(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      ).toBeInTheDocument();
      rerender(field(true));
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("Combobox", () => {
    const options = [
      { value: "a1", label: "Gate A1" },
      { value: "b2", label: "Gate B2" },
    ];

    it("shows no choice and the mixed placeholder, described as mixed", () => {
      render(
        <Combobox
          label="Gate"
          mixed
          options={options}
          value="a1"
          onValueChange={() => {}}
        />,
      );
      const field = screen.getByRole("combobox", { name: "Gate" });
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveAccessibleDescription("Multiple values");
      expect(field).toHaveAttribute("data-mixed", "");
    });

    it("keeps the mixed state until a choice, then resets to it", async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();
      function Edited() {
        const [edit, setEdit] = React.useState<string | undefined>(undefined);
        return (
          <Combobox
            label="Gate"
            mixed={edit === undefined}
            options={options}
            value={edit ?? ""}
            onValueChange={(value) => setEdit(value)}
            onResetMixed={() => {
              setEdit(undefined);
              onReset();
            }}
          />
        );
      }
      render(<Edited />);
      const field = screen.getByRole("combobox", { name: "Gate" });
      await user.type(field, "B2");
      // A query is not an edit: still mixed.
      expect(field).toHaveValue("B2");
      expect(field).toHaveAttribute("data-mixed", "");
      await user.click(screen.getByRole("option", { name: "Gate B2" }));
      expect(field).toHaveValue("Gate B2");
      expect(field).not.toHaveAttribute("data-mixed");

      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveFocus();
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});
