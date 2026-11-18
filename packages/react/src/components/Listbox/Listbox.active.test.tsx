import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type ComboboxOption } from "../Combobox";
import { Listbox, listboxOptionId } from "./Listbox";

const properties: ComboboxOption[] = [
  { value: "name", label: "Name", trailing: "Text" },
  { value: "floor", label: "Floor", trailing: "Number", disabled: true },
  { value: "open", label: "Opening hours", trailing: "Hours" },
  { value: "logo", label: "Logo", trailing: "Image", group: "Media" },
];

/**
 * PropertyPicker's shape (CLOUD-UI-003): a search field that drives the
 * list as a combobox, focus staying in it.
 */
function Picker({ onPick }: { onPick?: (value: string) => void }) {
  const [active, setActive] = React.useState<string | null>("name");
  const enabled = properties.filter((option) => !option.disabled);
  const move = (by: 1 | -1) => {
    const at = enabled.findIndex((option) => option.value === active);
    setActive(enabled[(at + by + enabled.length) % enabled.length].value);
  };
  return (
    <>
      <input
        aria-label="Search properties"
        role="combobox"
        aria-expanded="true"
        aria-controls="properties"
        aria-activedescendant={listboxOptionId(
          "properties",
          properties,
          active,
        )}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") move(1);
          if (event.key === "ArrowUp") move(-1);
          if (event.key === "Enter" && active) onPick?.(active);
        }}
      />
      <Listbox
        id="properties"
        aria-label="Properties"
        options={properties}
        activeValue={active}
        onActiveValueChange={setActive}
      />
    </>
  );
}

const activeOf = (element: HTMLElement) =>
  document.getElementById(element.getAttribute("aria-activedescendant") ?? "");

describe("Listbox: a controlled active option (GAP-260)", () => {
  it("is driven by a search field through aria-activedescendant, focus staying in the field", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Picker onPick={onPick} />);
    const field = screen.getByRole("combobox", { name: "Search properties" });
    await user.click(field);

    expect(activeOf(field)).toHaveAttribute("role", "option");
    expect(activeOf(field)).toHaveAttribute("data-active", "true");
    expect(activeOf(field)).toHaveTextContent("Name");

    await user.keyboard("{ArrowDown}");
    // The disabled Floor is skipped by the product.
    expect(activeOf(field)).toHaveTextContent("Opening hours");
    expect(activeOf(field)).toHaveAttribute("data-active", "true");
    expect(
      screen
        .getAllByRole("option")
        .filter((option) => option.getAttribute("data-active") === "true"),
    ).toHaveLength(1);
    await user.keyboard("{ArrowDown}");
    expect(activeOf(field)).toHaveTextContent("Logo");
    expect(field).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("logo");
  });

  it("asks for a move by the keyboard and the pointer, and moves only when the product says", async () => {
    const user = userEvent.setup();
    const onActiveValueChange = vi.fn();
    const { rerender } = render(
      <Listbox
        aria-label="Properties"
        options={properties}
        activeValue="name"
        onActiveValueChange={onActiveValueChange}
      />,
    );
    const list = screen.getByRole("listbox");
    list.focus();
    await user.keyboard("{ArrowDown}");
    expect(onActiveValueChange).toHaveBeenLastCalledWith("open");
    expect(activeOf(list)).toHaveTextContent("Name");
    await user.hover(screen.getByRole("option", { name: /Logo/ }));
    expect(onActiveValueChange).toHaveBeenLastCalledWith("logo");
    rerender(
      <Listbox
        aria-label="Properties"
        options={properties}
        activeValue="logo"
        onActiveValueChange={onActiveValueChange}
      />,
    );
    expect(activeOf(list)).toHaveTextContent("Logo");
  });

  it("marks no option for a null active value", () => {
    render(
      <Listbox
        aria-label="Properties"
        options={properties}
        activeValue={null}
      />,
    );
    expect(screen.getByRole("listbox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
    expect(document.querySelector('[data-active="true"]')).toBeNull();
  });

  it("gives each option's id in drawn order, under its group", () => {
    render(<Listbox id="list" aria-label="Properties" options={properties} />);
    for (const option of properties)
      expect(
        document.getElementById(
          listboxOptionId("list", properties, option.value)!,
        ),
      ).toHaveTextContent(option.label);
    expect(listboxOptionId("list", properties, "nothing")).toBeUndefined();
    expect(listboxOptionId("list", properties, null)).toBeUndefined();
  });
});

describe("an option's trailing slot (GAP-260)", () => {
  it("shows at the option's end, after its words and before the check", () => {
    render(
      <Listbox aria-label="Properties" options={properties} value="name" />,
    );
    // Its words are the option's description: its name stays the label.
    const name = screen.getByRole("option", {
      name: "Name",
      description: "Text",
    });
    const trailing = within(name).getByText("Text");
    expect(trailing).toHaveClass("kozmos-option-trailing");
    const parts = Array.from(name.children);
    expect(parts.indexOf(trailing)).toBe(
      parts.findIndex((part) =>
        part.classList.contains("kozmos-option-content"),
      ) + 1,
    );
    expect(parts.at(-1)).toHaveClass("kozmos-option-check");
  });
});

describe("an option's media (decision 215, GAP-282)", () => {
  const clients: ComboboxOption[] = [
    { value: "acme", label: "Acme Airport", media: { src: "/acme.png" } },
    { value: "pointr", label: "Pointr Cloud", media: {} },
    { value: "zed", label: "Zed", media: { initials: "ZD" } },
    { value: "plain", label: "Plain" },
  ];

  it("draws an Avatar before the label, its initials when there is no image, the label still the name", () => {
    render(<Listbox aria-label="Switch client" options={clients} />);
    for (const label of ["Acme Airport", "Pointr Cloud", "Zed", "Plain"])
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    const pointr = screen.getByRole("option", { name: "Pointr Cloud" });
    const media = pointr.querySelector(".kozmos-option-media");
    expect(media).toHaveAttribute("aria-hidden", "true");
    expect(pointr.firstElementChild).toBe(media);
    expect(media).toHaveTextContent("PC");
    expect(
      screen
        .getByRole("option", { name: "Zed" })
        .querySelector(".kozmos-option-media"),
    ).toHaveTextContent("ZD");
    // jsdom loads no image: the initials stand in, as while one loads.
    expect(
      screen
        .getByRole("option", { name: "Acme Airport" })
        .querySelector(".kozmos-option-media"),
    ).toHaveTextContent("AA");
    expect(
      screen
        .getByRole("option", { name: "Plain" })
        .querySelector(".kozmos-option-media"),
    ).toBeNull();
  });
});
