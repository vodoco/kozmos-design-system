import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect } from "./MultiSelect";

const options = [
  { value: "filters", label: "Filters" },
  { value: "layers", label: "Layers" },
  { value: "routes", label: "Routes" },
];

describe("MultiSelect", () => {
  it("selects and removes multiple options", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <MultiSelect
        label="Tools"
        options={options}
        onValueChange={handleValueChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Tools" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Filters" }));
    await user.click(screen.getByRole("option", { name: "Layers" }));

    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Layers").length).toBeGreaterThan(0);
    expect(handleValueChange).toHaveBeenLastCalledWith(
      ["filters", "layers"],
      [options[0], options[1]],
    );

    await user.click(screen.getByRole("button", { name: "Remove Filters" }));
    expect(handleValueChange).toHaveBeenLastCalledWith(
      ["layers"],
      [options[1]],
    );
  });

  it("marks selected listbox options", async () => {
    const user = userEvent.setup();

    render(<MultiSelect options={options} defaultValue={["routes"]} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Routes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("uses stable active option ids independent of option values", async () => {
    const user = userEvent.setup();

    render(
      <MultiSelect
        id="tool-select"
        options={[{ value: "route planning", label: "Route planning" }]}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "tool-select-option-0",
    );
    expect(screen.getByRole("option")).toHaveAttribute(
      "id",
      "tool-select-option-0",
    );
  });

  describe("clearing every choice (R3)", () => {
    // The clear button goes with the choices it clears, and focus went down
    // with it, to the page: a keyboard had to find its way back to the field.
    // The field takes focus now, with its list closed — the visitor cleared
    // the choice, and did not ask for options — until they type or press an
    // arrow key.
    const field = () => screen.getByRole("combobox", { name: "Tools" });
    const clear = () =>
      screen.getByRole("button", { name: "Clear selected options" });

    it("hands focus to the field, with its list closed", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <MultiSelect
          defaultValue={["filters", "layers"]}
          label="Tools"
          onValueChange={onValueChange}
          options={options}
        />,
      );
      clear().focus();
      await user.keyboard("{Enter}");

      expect(onValueChange).toHaveBeenLastCalledWith([], []);
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("lets the visitor type straight away, or open the list with an arrow key", async () => {
      const user = userEvent.setup();
      render(
        <MultiSelect
          defaultValue={["filters"]}
          label="Tools"
          options={options}
        />,
      );
      clear().focus();
      await user.keyboard(" ");
      expect(field()).toHaveFocus();
      expect(screen.queryByRole("listbox")).toBeNull();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("listbox")).toBeVisible();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();

      await user.keyboard("lay");
      expect(field()).toHaveValue("lay");
      expect(screen.getByRole("listbox")).toBeVisible();
      expect(screen.getByRole("option", { name: "Layers" })).toBeVisible();

      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("button", { name: "Remove Layers" }),
      ).toBeInTheDocument();
    });

    it("hands focus to the field when the product holds the choices", async () => {
      const user = userEvent.setup();
      function Held({ refuse = false }: { refuse?: boolean }) {
        const [value, setValue] = React.useState(["routes"]);
        return (
          <MultiSelect
            label="Tools"
            onValueChange={(next) => {
              if (!refuse) setValue(next);
            }}
            options={options}
            value={value}
          />
        );
      }
      const { unmount } = render(<Held />);
      clear().focus();
      await user.keyboard("{Enter}");
      expect(
        screen.queryByRole("button", { name: "Remove Routes" }),
      ).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      unmount();

      // A product that keeps its choices: the button stays, and focus still
      // goes to the field, which is where the keyboard goes on from.
      render(<Held refuse />);
      clear().focus();
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("button", { name: "Remove Routes" }),
      ).toBeInTheDocument();
      expect(field()).toHaveFocus();
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("offers nothing to clear while disabled or read-only", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <MultiSelect
          defaultValue={["filters"]}
          disabled
          label="Tools"
          onValueChange={onValueChange}
          options={options}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      rerender(
        <MultiSelect
          defaultValue={["filters"]}
          label="Tools"
          onValueChange={onValueChange}
          options={options}
          readOnly
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      const user = userEvent.setup();
      await user.click(field());
      await user.keyboard("{Backspace}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("still hands focus to the field when one choice is removed", async () => {
      const user = userEvent.setup();
      render(
        <MultiSelect
          defaultValue={["filters", "layers"]}
          label="Tools"
          options={options}
        />,
      );
      screen.getByRole("button", { name: "Remove Filters" }).focus();
      await user.keyboard("{Enter}");
      expect(field()).toHaveFocus();
      expect(
        screen.getByRole("button", { name: "Remove Layers" }),
      ).toBeInTheDocument();
    });
  });
});
