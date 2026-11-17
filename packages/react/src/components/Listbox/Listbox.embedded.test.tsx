import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Listbox } from "./Listbox";

// GAP-271 (decision 186): Switch client lists the user's clients inside a
// Dialog, so the list draws no panel of its own.
const clients = [
  { value: "acme", label: "Acme" },
  { value: "globex", label: "Globex" },
];

describe("Listbox embedded (GAP-271)", () => {
  it("marks itself embedded, keeping the listbox's role, rows and keyboard", () => {
    const onValueChange = vi.fn();
    render(
      <Listbox
        aria-label="Clients"
        embedded
        options={clients}
        onValueChange={onValueChange}
      />,
    );
    const list = screen.getByRole("listbox", { name: "Clients" });
    expect(list).toHaveAttribute("data-embedded", "true");
    expect(list).toHaveClass("kozmos-listbox", "kozmos-listbox-embedded");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith(
      "globex",
      expect.objectContaining({ value: "globex" }),
    );
  });

  it("draws its own panel by default", () => {
    render(<Listbox aria-label="Clients" options={clients} />);
    const list = screen.getByRole("listbox", { name: "Clients" });
    expect(list).not.toHaveAttribute("data-embedded");
    expect(list).not.toHaveClass("kozmos-listbox-embedded");
  });
});
