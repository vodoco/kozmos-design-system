import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Listbox } from "./Listbox";

const options = [
  { value: "alpha", label: "Alpha" },
  { value: "beta", label: "Beta" },
  { value: "gamma", label: "Gamma" },
];

describe("Listbox", () => {
  it("selects a single option", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(<Listbox options={options} onValueChange={handleValueChange} />);

    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(handleValueChange).toHaveBeenCalledWith("beta", options[1]);
  });

  it("supports multiple selected values", async () => {
    render(<Listbox multiple options={options} value={["alpha", "gamma"]} />);

    expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Gamma" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("exposes the active option through aria-activedescendant", async () => {
    const user = userEvent.setup();

    render(<Listbox id="route-listbox" options={options} />);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      "route-listbox-option-0",
    );

    listbox.focus();
    await user.keyboard("{ArrowDown}");
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      "route-listbox-option-1",
    );
  });

  it("starts on the chosen option, as the WAI-ARIA listbox does", () => {
    // TimePicker's list opens on the field's time; with nothing chosen, on
    // the first option.
    render(<Listbox id="times" options={options} value="gamma" />);
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      "times-option-2",
    );
  });
});
