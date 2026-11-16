import { act, render, screen } from "@testing-library/react";
import React from "react";
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

  it("places the value and the delete button by class, inside a form too", () => {
    // In a <form> Radix Select adds a hidden native select after its
    // trigger: the value is no longer the row's third child, nor the delete
    // button its fourth, so the sheet must not place them by position.
    const { container } = render(
      <form>
        <KeyValueList defaultValue={rows} />
      </form>,
    );
    const row = screen.getByRole("group", { name: "Field 1" });
    expect(row.querySelector("select")).not.toBeNull();
    const children = Array.from(row.children);
    const value = row.querySelector(":scope > .kozmos-key-value-value");
    const remove = row.querySelector(":scope > .kozmos-key-value-remove");
    expect(value).toContainElement(named("Field 1 value"));
    expect(remove).toBe(screen.getByRole("button", { name: "Remove Field 1" }));
    // The order a :nth-child sheet would have misread.
    expect(children.indexOf(value!)).toBe(3);
    expect(children.indexOf(remove!)).toBe(4);
    expect(container.querySelectorAll(".kozmos-key-value-value")).toHaveLength(
      3,
    );
  });

  it("takes a decimal Number value without blocking the form", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <KeyValueList
          defaultValue={[{ id: "a", name: "ratio", type: "number", value: 1 }]}
        />
      </form>,
    );
    const field = screen.getByRole("spinbutton", { name: "Field 1 value" });
    await user.clear(field);
    await user.type(field, "2.5");
    expect(field).toHaveValue(2.5);
    expect((field as HTMLInputElement).validity.valid).toBe(true);
    expect((field as HTMLInputElement).form!.checkValidity()).toBe(true);
    // No steppers that a step of "any" would leave dead.
    expect(
      screen.queryByRole("button", { name: /increase|decrease/i }),
    ).toBeNull();
  });

  it("says a mixed Boolean is mixed, beside its switch", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <KeyValueList
        defaultValue={[
          {
            id: "a",
            name: "public",
            type: "boolean",
            value: false,
            mixed: true,
          },
        ]}
        mixedLabel="Several values"
        onValueChange={onValueChange}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Field 1 value" });
    expect(screen.getByText("Several values")).toBeInTheDocument();
    expect(toggle).toHaveAccessibleDescription("Several values");
    await user.click(toggle);
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ value: true, mixed: false }),
    ]);
    expect(screen.queryByText("Several values")).toBeNull();
  });

  it("keeps focus for a new row a product commits a tick later", async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = React.useState<KeyValueRow[]>([]);
      return (
        <KeyValueList
          value={value}
          createId={createId}
          onValueChange={(next) => setTimeout(() => setValue(next), 0)}
        />
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(named("Field 1 name")).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(<KeyValueList defaultValue={rows} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
