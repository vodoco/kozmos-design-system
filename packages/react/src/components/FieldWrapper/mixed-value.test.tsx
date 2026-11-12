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
    it("shows no value and the mixed placeholder, said once: by the placeholder, with no description of it", () => {
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
      expect(field).not.toHaveAttribute("aria-describedby");
      expect(document.body.textContent).not.toContain("Multiple values");
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
      expect(field).toHaveAccessibleDescription("Shown to visitors");
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

    it("keeps its action while mixed, its copy disabled: nothing is copied or said copied", async () => {
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
      const onCopy = vi.fn();
      render(
        <Input
          label="Feature ID"
          mixed
          value="FID-1"
          onChange={() => {}}
          action={{ kind: "copy", onCopy }}
        />,
      );
      const field = screen.getByRole("textbox", { name: "Feature ID" });
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveClass("kozmos-input-with-action");
      const copy = screen.getByRole("button", { name: "Copy" });
      expect(copy).toBeDisabled();
      await user.click(copy);
      expect(writeText).not.toHaveBeenCalled();
      expect(onCopy).not.toHaveBeenCalled();
      expect(screen.queryByText("Copied")).toBeNull();
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

    it("empties an uncontrolled field's text as it turns mixed after it is drawn", () => {
      const { rerender } = render(
        <Input label="Name" defaultValue="Gate A1" mixed={false} />,
      );
      const field = screen.getByRole("textbox", { name: "Name" });
      expect(field).toHaveValue("Gate A1");
      rerender(<Input label="Name" defaultValue="Gate A1" mixed />);
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
    });

    it("empties its character count with the text as it turns mixed", () => {
      const { rerender } = render(
        <Input
          label="Code"
          defaultValue="ABCDEFGH"
          count={{ limit: 5 }}
          mixed={false}
        />,
      );
      const field = screen.getByRole("textbox", { name: "Code" });
      expect(field).toHaveAttribute("aria-invalid", "true");
      rerender(
        <Input
          label="Code"
          defaultValue="ABCDEFGH"
          count={{ limit: 5 }}
          mixed
        />,
      );
      expect(field).toHaveValue("");
      expect(field).not.toHaveAttribute("aria-invalid");
      expect(screen.getByText("0/5")).toBeInTheDocument();
      expect(screen.queryByText(/limit exceeded/i)).toBeNull();
    });

    it("empties its own field, not another with the same id", () => {
      render(
        <>
          <input id="name" defaultValue="Other form" aria-label="Other" />
          <Input id="name" label="Name" defaultValue="Gate A1" mixed />
        </>,
      );
      expect(screen.getByRole("textbox", { name: "Other" })).toHaveValue(
        "Other form",
      );
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
    it("shows no value and the mixed placeholder until a typed edit", async () => {
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
      const field = screen.getByLabelText("Height");
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).not.toHaveAttribute("aria-describedby");

      await user.type(field, "4");
      expect(field).toHaveValue("4");
      expect(field).not.toHaveAttribute("data-mixed");
      // The same field, a spinbutton again once it is left holding a number.
      await user.tab();
      expect(screen.getByRole("spinbutton", { name: "Height" })).toBe(field);
      expect(field).toHaveValue(4);

      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveFocus();
    });

    it("disables its steppers while mixed, and only then", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(
        <NumberInput
          label="Height"
          mixed
          value=""
          onValueChange={onValueChange}
        />,
      );
      const more = screen.getByRole("button", { name: "Increase value" });
      const less = screen.getByRole("button", { name: "Decrease value" });
      expect(more).toBeDisabled();
      expect(less).toBeDisabled();
      await user.click(more);
      expect(onValueChange).not.toHaveBeenCalled();
      rerender(
        <NumberInput label="Height" value={4} onValueChange={onValueChange} />,
      );
      expect(more).toBeEnabled();
      expect(less).toBeEnabled();
    });

    it("is no spinbutton while mixed: nothing can step it from nothing", () => {
      const { rerender } = render(
        <NumberInput label="Height" mixed value="" onValueChange={() => {}} />,
      );
      expect(screen.queryByRole("spinbutton")).toBeNull();
      const field = screen.getByRole("textbox", { name: "Height" });
      expect(field).toHaveAttribute("type", "text");
      expect(field).toHaveAttribute("inputmode", "decimal");
      rerender(
        <NumberInput label="Height" value={4} onValueChange={() => {}} />,
      );
      expect(screen.getByRole("spinbutton", { name: "Height" })).toBe(field);
    });

    it("empties an uncontrolled field as it turns mixed", () => {
      const { rerender } = render(
        <NumberInput label="Height" defaultValue={4} mixed={false} />,
      );
      const field = screen.getByRole("spinbutton", { name: "Height" });
      expect(field).toHaveValue(4);
      rerender(<NumberInput label="Height" defaultValue={4} mixed />);
      expect(field).toHaveValue("");
    });

    it("keeps its unit drawn and said while mixed, in the unit's room", () => {
      render(
        <NumberInput
          label="Height"
          unit="m"
          unitLabel="metres"
          mixed
          value={4}
          onValueChange={() => {}}
        />,
      );
      const field = screen.getByRole("textbox", { name: "Height" });
      expect(field).toHaveValue("");
      expect(field).toHaveAttribute("type", "text");
      expect(field).toHaveAttribute("placeholder", "Multiple values");
      expect(field).toHaveClass("kozmos-number-with-unit");
      expect(field).toHaveAccessibleDescription("metres");
      expect(screen.getByText("m")).toHaveClass("kozmos-number-unit");
      expect(
        screen.getByRole("button", { name: "Increase value" }),
      ).toBeDisabled();
    });

    it("reports nothing for a sign or a point alone, and keeps a typed negative", async () => {
      const user = userEvent.setup();
      const reported: (number | null)[] = [];
      function Editor() {
        const [edit, setEdit] = React.useState<number | null | undefined>(
          undefined,
        );
        return (
          <NumberInput
            label="Offset"
            mixed={edit === undefined}
            value={edit ?? ""}
            onValueChange={(value) => {
              reported.push(value);
              setEdit(value);
            }}
          />
        );
      }
      render(<Editor />);
      const field = screen.getByLabelText("Offset");
      await user.type(field, "-");
      expect(reported).toEqual([]);
      expect(field).toHaveValue("-");
      await user.type(field, "0.5");
      expect(field).toHaveValue("-0.5");
      expect(reported.at(-1)).toBe(-0.5);
      expect(reported).not.toContain(null);
      await user.tab();
      expect(field).toHaveValue(-0.5);
    });

    it("hides a controlled value while mixed", () => {
      render(
        <NumberInput label="Height" mixed value={4} onChange={() => {}} />,
      );
      expect(screen.getByLabelText("Height")).toHaveValue("");
    });
  });

  describe("Select", () => {
    it("shows the mixed placeholder, checks no option and says it once, as the trigger's description", () => {
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
      // The drawn words are kept from screen readers: one route, not two.
      const drawn = [...trigger.querySelectorAll("span")].find(
        (span) => span.textContent === "Multiple values",
      );
      expect(drawn?.closest("[aria-hidden='true']")).toBeTruthy();
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

    it("offers no reset while the root is disabled", () => {
      const field = (disabled: boolean) => (
        <Select value="poi" disabled={disabled} onResetMixed={() => {}}>
          <SelectTrigger aria-label="Type">
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

    it("with defaultValue, holds the choice controlled: no stale default after mixed, and no switch", async () => {
      const user = userEvent.setup();
      // jsdom has no scrollIntoView, which Radix Select calls as it opens.
      Element.prototype.scrollIntoView ??= () => {};
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnings = vi.spyOn(console, "warn").mockImplementation(() => {});
      const field = (mixed: boolean) => (
        <Select defaultValue="poi" mixed={mixed} onResetMixed={() => {}}>
          <SelectTrigger aria-label="Type">
            <SelectValue placeholder="Choose a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="poi">POI</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
          </SelectContent>
        </Select>
      );
      const { rerender } = render(field(false));
      const trigger = screen.getByRole("combobox", { name: "Type" });
      expect(trigger).toHaveTextContent("POI");
      rerender(field(true));
      expect(trigger).toHaveTextContent("Multiple values");
      // No longer mixed without a choice: the old default does not return.
      rerender(field(false));
      expect(trigger).toHaveTextContent("Choose a type");
      expect(trigger).not.toHaveTextContent("POI");
      // A choice made while mixed, which ends it, is what shows.
      function Editor() {
        const [mixed, setMixed] = React.useState(true);
        return (
          <Select
            defaultValue="poi"
            mixed={mixed}
            onValueChange={() => setMixed(false)}
          >
            <SelectTrigger aria-label="Kind">
              <SelectValue placeholder="Choose a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poi">POI</SelectItem>
              <SelectItem value="structural">Structural</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      rerender(<Editor />);
      const kind = screen.getByRole("combobox", { name: "Kind" });
      expect(kind).toHaveTextContent("Multiple values");
      await user.click(kind);
      await user.click(screen.getByRole("option", { name: "Structural" }));
      expect(kind).toHaveTextContent("Structural");
      const said = [...errors.mock.calls, ...warnings.mock.calls]
        .flat()
        .join(" ");
      errors.mockRestore();
      warnings.mockRestore();
      expect(said).not.toMatch(/controlled|uncontrolled/i);
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

    it("shows no choice and the mixed placeholder, said once by it", () => {
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
      expect(field).not.toHaveAttribute("aria-describedby");
      expect(field).toHaveAttribute("data-mixed", "");
    });

    it("clears only the typed query while mixed: no empty choice is reported", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onInputValueChange = vi.fn();
      render(
        <Combobox
          label="Gate"
          mixed
          options={options}
          value=""
          onValueChange={onValueChange}
          onInputValueChange={onInputValueChange}
        />,
      );
      const field = screen.getByRole("combobox", { name: "Gate" });
      await user.type(field, "B");
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(field).toHaveValue("");
      expect(onInputValueChange).toHaveBeenLastCalledWith("");
      expect(onValueChange).not.toHaveBeenCalled();
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
