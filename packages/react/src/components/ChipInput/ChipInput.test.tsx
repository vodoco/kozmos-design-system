import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChipInput } from "./ChipInput";

function chipsIn(field: HTMLElement) {
  return Array.from(field.querySelectorAll("[data-slot=chip-label]")).map(
    (chip) => chip.textContent,
  );
}

// GAP-222, decision 216: a field that takes free text and holds each entry
// as a removable Chip inside it.
describe("ChipInput (GAP-222)", () => {
  it("adds the typed text as a chip on Enter and on a comma, trimmed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChipInput label="Keywords" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Keywords");
    const field = input.closest("[data-slot=chip-input]") as HTMLElement;

    await user.type(input, "  coffee {Enter}");
    expect(chipsIn(field)).toEqual(["coffee"]);
    expect(input).toHaveValue("");

    await user.type(input, "tea,");
    expect(chipsIn(field)).toEqual(["coffee", "tea"]);
    expect(input).toHaveValue("");
    expect(onValueChange).toHaveBeenLastCalledWith(["coffee", "tea"]);
  });

  it("removes the last chip on Backspace in the empty field, and none while text is typed", async () => {
    const user = userEvent.setup();
    render(<ChipInput label="Keywords" defaultValue={["coffee", "tea"]} />);
    const input = screen.getByLabelText("Keywords");
    const field = input.closest("[data-slot=chip-input]") as HTMLElement;

    await user.type(input, "x{Backspace}");
    expect(chipsIn(field)).toEqual(["coffee", "tea"]);
    await user.type(input, "{Backspace}");
    expect(chipsIn(field)).toEqual(["coffee"]);
  });

  it("names each chip's remove from removeLabel, and removing one keeps focus in the field", async () => {
    const user = userEvent.setup();
    render(
      <ChipInput
        label="Anahtar kelimeler"
        defaultValue={["kahve", "çay"]}
        removeLabel={(entry) => `${entry} kaldır`}
      />,
    );
    const input = screen.getByLabelText("Anahtar kelimeler");
    await user.click(screen.getByRole("button", { name: "kahve kaldır" }));
    const field = input.closest("[data-slot=chip-input]") as HTMLElement;
    expect(chipsIn(field)).toEqual(["çay"]);
    expect(input).toHaveFocus();
    expect(
      within(field).getByRole("button", { name: "çay kaldır" }),
    ).toBeInTheDocument();
  });

  it("says what was added and removed, in the product's words, through a polite status", async () => {
    const user = userEvent.setup();
    render(
      <ChipInput
        label="Keywords"
        addedLabel={(entry) => `Added ${entry}`}
        removedLabel={(entry) => `Removed ${entry}`}
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    const input = screen.getByLabelText("Keywords");
    await user.type(input, "coffee{Enter}");
    expect(status.textContent?.trim()).toBe("Added coffee");
    await user.type(input, "{Backspace}");
    expect(status.textContent?.trim()).toBe("Removed coffee");
    // The same words twice in a row still change the region, so a screen
    // reader reads them again.
    await user.type(input, "coffee{Enter}");
    await user.type(input, "coffee{Enter}");
    const first = status.textContent;
    expect(first?.trim()).toBe("coffee is already added");
    await user.type(input, "{Enter}");
    expect(status.textContent?.trim()).toBe("coffee is already added");
    expect(status.textContent).not.toBe(first);
  });

  it("keeps a duplicate's text, adds nothing and says so", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ChipInput
        label="Keywords"
        defaultValue={["coffee"]}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByLabelText("Keywords");
    await user.type(input, "coffee{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("coffee");
    expect(screen.getByRole("status").textContent?.trim()).toBe(
      "coffee is already added",
    );
  });

  it("splits pasted text at commas and line breaks", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ChipInput label="Keywords" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Keywords");
    await user.click(input);
    await user.paste("coffee, tea\nwater");
    expect(onValueChange).toHaveBeenLastCalledWith(["coffee", "tea"]);
    expect(input).toHaveValue("water");
  });

  it("leaves Enter in an empty field to the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ChipInput label="Keywords" />
      </form>,
    );
    await user.type(screen.getByLabelText("Keywords"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("is controlled by value and inputValue", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState(["coffee"]);
      const [text, setText] = React.useState("");
      return (
        <ChipInput
          label="Keywords"
          value={value}
          onValueChange={setValue}
          inputValue={text}
          onInputValueChange={setText}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByLabelText("Keywords");
    const field = input.closest("[data-slot=chip-input]") as HTMLElement;
    await user.type(input, "tea{Enter}");
    expect(chipsIn(field)).toEqual(["coffee", "tea"]);
    expect(input).toHaveValue("");
  });

  it("adds and removes nothing while disabled or read-only", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <ChipInput
        label="Keywords"
        readOnly
        defaultValue={["coffee"]}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByLabelText("Keywords");
    await user.type(input, "tea{Enter}{Backspace}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Remove coffee" }),
    ).toBeDisabled();
    rerender(
      <ChipInput
        label="Keywords"
        disabled
        defaultValue={["coffee"]}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByLabelText("Keywords")).toBeDisabled();
  });

  it("ties its helper text and error to the input", () => {
    render(<ChipInput label="Keywords" error="Add at least one keyword" />);
    const input = screen.getByLabelText("Keywords");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Add at least one keyword");
  });
});
