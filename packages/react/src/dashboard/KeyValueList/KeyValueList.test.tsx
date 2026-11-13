import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom/vitest";
import { KeyValueList, type KeyValueRow } from "./KeyValueList";
import * as dashboard from "../index";

beforeAll(() => {
  // Radix Select scrolls its chosen row into view; jsdom draws no layout.
  Element.prototype.scrollIntoView ??= () => {};
});

const named = (name: string) => screen.getByRole("textbox", { name });
const rows: KeyValueRow[] = [
  { id: "a", name: "vendor", type: "text", value: "Acme" },
  { id: "b", name: "floors", type: "number", value: 3 },
  { id: "c", name: "public", type: "boolean", value: true },
];
let next = 0;
const createId = () => `new-${next++}`;

describe("KeyValueList", () => {
  it("is exported from the ./dashboard entry", () => {
    expect(dashboard.KeyValueList).toBe(KeyValueList);
  });

  it("names every control for its row", () => {
    render(<KeyValueList defaultValue={rows} />);
    expect(screen.getByRole("group", { name: "Field 1" })).toBeInTheDocument();
    expect(named("Field 1 name")).toHaveValue("vendor");
    expect(
      screen.getByRole("combobox", { name: "Field 1 type" }),
    ).toHaveTextContent("Text");
    expect(named("Field 1 value")).toHaveValue("Acme");
    // A number is a number field (Cloud's was text), a boolean a switch.
    expect(
      screen.getByRole("spinbutton", { name: "Field 2 value" }),
    ).toHaveValue(3);
    expect(screen.getByRole("switch", { name: "Field 3 value" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Remove Field 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add field" }),
    ).toBeInTheDocument();
  });

  it("adds a row by keyboard, with focus in its name", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<KeyValueList createId={createId} onValueChange={onValueChange} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Add field" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(named("Field 1 name")).toHaveFocus();
    await user.keyboard("vendor");
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "vendor", type: "text", value: "" }),
    ]);
    await user.tab();
    await user.tab();
    expect(named("Field 1 value")).toHaveFocus();
    await user.keyboard("Acme");
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "vendor", value: "Acme" }),
    ]);
  });

  it("deletes a row by keyboard, with focus on the next row's name, or on Add after the last", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<KeyValueList defaultValue={rows} onValueChange={onValueChange} />);
    screen.getByRole("button", { name: "Remove Field 1" }).focus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(rows.slice(1));
    expect(named("Field 1 name")).toHaveValue("floors");
    expect(named("Field 1 name")).toHaveFocus();
    screen.getByRole("button", { name: "Remove Field 2" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Add field" })).toHaveFocus();
  });

  it("changes a row's type by keyboard, carrying its value over", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <KeyValueList
        defaultValue={[{ id: "a", name: "floors", type: "text", value: "12" }]}
        onValueChange={onValueChange}
      />,
    );
    screen.getByRole("combobox", { name: "Field 1 type" }).focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("option", { name: "Number" });
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ type: "number", value: 12 }),
    ]);
    expect(
      screen.getByRole("spinbutton", { name: "Field 1 value" }),
    ).toHaveValue(12);
  });

  it("says when a JSON value does not parse", () => {
    const { rerender } = render(
      <KeyValueList
        value={[{ id: "a", name: "meta", type: "json", value: "{oops" }]}
      />,
    );
    expect(named("Field 1 value")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Not valid JSON.")).toBeInTheDocument();
    rerender(
      <KeyValueList
        value={[{ id: "a", name: "meta", type: "json", value: '{"a":1}' }]}
      />,
    );
    expect(named("Field 1 value")).not.toHaveAttribute("aria-invalid");
  });

  it("shows a mixed value's label and no value, and offers the row's reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const { rerender } = render(
      <KeyValueList
        value={[
          { id: "a", name: "vendor", type: "text", value: "", mixed: true },
        ]}
      />,
    );
    expect(named("Field 1 value")).toHaveAttribute(
      "placeholder",
      "Multiple values",
    );
    rerender(
      <KeyValueList
        value={[{ id: "a", name: "vendor", type: "text", value: "Acme" }]}
        onResetMixed={{ a: reset }}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Reset to multiple values" }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<KeyValueList defaultValue={rows} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
