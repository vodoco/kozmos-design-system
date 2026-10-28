import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox, type ComboboxOption } from "../Combobox";
import { Listbox } from "./Listbox";
import { MultiSelect } from "../MultiSelect";

// GAP-192: options under their groups, as MAP-64's type picker draws them.
// The list is given out of order on purpose: options with no group come
// first, unlabelled; then the groups, in the order they first appear, each
// group's options together.
const types: ComboboxOption[] = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "lift", label: "Lift" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
];
const VISUAL_ORDER = [
  "Lift",
  "Office Desk",
  "Hot Desk",
  "Standing Desk",
  "Reception Desk",
];

/** Each group's accessible name and the names of the options in it. */
function groupsIn(list: HTMLElement) {
  return within(list)
    .queryAllByRole("group")
    .map((group) => {
      const labelId = group.getAttribute("aria-labelledby");
      const label = labelId ? document.getElementById(labelId) : null;
      return {
        name: label?.textContent,
        // The label is in the group, and is not one of its options.
        labelInside: Boolean(label && group.contains(label)),
        labelIsOption: label?.getAttribute("role") === "option",
        options: within(group)
          .getAllByRole("option")
          .map((option) => option.textContent),
      };
    });
}

function optionNames(list: HTMLElement) {
  return within(list)
    .getAllByRole("option")
    .map((option) => option.textContent);
}

function activeName(owner: HTMLElement) {
  const id = owner.getAttribute("aria-activedescendant");
  const active = id ? document.getElementById(id) : null;
  expect(active).toHaveAttribute("role", "option");
  return active?.textContent;
}

describe("Option groups (GAP-192)", () => {
  describe("Combobox", () => {
    it("draws each group under its label, in the order groups first appear", async () => {
      const user = userEvent.setup();
      render(<Combobox label="Type" options={types} />);
      await user.click(screen.getByRole("combobox"));
      const listbox = screen.getByRole("listbox");
      expect(groupsIn(listbox)).toEqual([
        {
          name: "Interior Asset",
          labelInside: true,
          labelIsOption: false,
          options: ["Office Desk", "Hot Desk", "Standing Desk"],
        },
        {
          name: "POI",
          labelInside: true,
          labelIsOption: false,
          options: ["Reception Desk"],
        },
      ]);
      expect(
        within(listbox).getByRole("group", { name: "Interior Asset" }),
      ).toBeInTheDocument();
      // Five options and no more: a label is not an option.
      expect(optionNames(listbox)).toEqual(VISUAL_ORDER);
    });

    it("keeps a group's label while any of its options match, and drops it when none do", async () => {
      const user = userEvent.setup();
      render(<Combobox label="Type" options={types} />);
      const input = screen.getByRole("combobox");
      await user.type(input, "desk");
      expect(groupsIn(screen.getByRole("listbox")).map((g) => g.name)).toEqual([
        "Interior Asset",
        "POI",
      ]);
      await user.clear(input);
      await user.type(input, "hot");
      const listbox = screen.getByRole("listbox");
      expect(groupsIn(listbox)).toEqual([
        {
          name: "Interior Asset",
          labelInside: true,
          labelIsOption: false,
          options: ["Hot Desk"],
        },
      ]);
      expect(within(listbox).queryByText("POI")).toBeNull();
      await user.clear(input);
      await user.type(input, "lift");
      expect(groupsIn(screen.getByRole("listbox"))).toEqual([]);
      expect(optionNames(screen.getByRole("listbox"))).toEqual(["Lift"]);
    });

    it("moves through the options in the order they are drawn, never onto a label", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <Combobox label="Type" options={types} onValueChange={onValueChange} />,
      );
      const input = screen.getByRole("combobox");
      await user.click(input);
      // The first option drawn is active as the list opens, as before.
      const seen = [activeName(input)];
      for (let step = 0; step < VISUAL_ORDER.length; step += 1) {
        await user.keyboard("{ArrowDown}");
        seen.push(activeName(input));
      }
      expect(seen).toEqual([...VISUAL_ORDER, VISUAL_ORDER[0]]);
      await user.keyboard("{ArrowUp}");
      expect(activeName(input)).toBe("Reception Desk");
      await user.keyboard("{Home}");
      expect(activeName(input)).toBe("Lift");
      await user.keyboard("{End}");
      expect(activeName(input)).toBe("Reception Desk");
      await user.keyboard("{ArrowUp}{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("standing-desk", types[4]);
    });

    it("types to filter as before: the first match drawn is active", async () => {
      const user = userEvent.setup();
      render(<Combobox label="Type" options={types} />);
      const input = screen.getByRole("combobox");
      await user.type(input, "desk");
      expect(activeName(input)).toBe("Office Desk");
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
      expect(activeName(input)).toBe("Reception Desk");
    });

    it("draws no group for options with none", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          label="Type"
          options={types.map(({ group: _group, ...option }) => option)}
        />,
      );
      await user.click(screen.getByRole("combobox"));
      expect(
        within(screen.getByRole("listbox")).queryAllByRole("group"),
      ).toEqual([]);
    });
  });

  describe("Listbox", () => {
    it("draws its groups, and moves through them in that order", async () => {
      const user = userEvent.setup();
      render(<Listbox aria-label="Type" options={types} />);
      const listbox = screen.getByRole("listbox");
      expect(groupsIn(listbox).map((g) => [g.name, g.options])).toEqual([
        ["Interior Asset", ["Office Desk", "Hot Desk", "Standing Desk"]],
        ["POI", ["Reception Desk"]],
      ]);
      expect(optionNames(listbox)).toEqual(VISUAL_ORDER);
      listbox.focus();
      const seen = [activeName(listbox)];
      for (let step = 0; step < VISUAL_ORDER.length - 1; step += 1) {
        await user.keyboard("{ArrowDown}");
        seen.push(activeName(listbox));
      }
      expect(seen).toEqual(VISUAL_ORDER);
    });

    it("keeps focus on the list when an option in a group is pressed", async () => {
      const onValueChange = vi.fn();
      render(
        <Listbox
          aria-label="Type"
          options={types}
          onValueChange={onValueChange}
        />,
      );
      // A click alone, with no pointerdown before it: a pointerdown focuses
      // the list by itself, and would pass with the row focusing its group.
      fireEvent.click(screen.getByRole("option", { name: "Hot Desk" }));
      expect(screen.getByRole("listbox")).toHaveFocus();
      expect(onValueChange).toHaveBeenCalledWith("hot-desk", types[2]);
      expect(activeName(screen.getByRole("listbox"))).toBe("Hot Desk");
    });
  });

  describe("MultiSelect", () => {
    it("draws its groups, filters them, and moves through them in that order", async () => {
      const user = userEvent.setup();
      render(<MultiSelect label="Types" options={types} />);
      const input = screen.getByRole("combobox");
      await user.click(input);
      const listbox = screen.getByRole("listbox");
      expect(groupsIn(listbox).map((g) => [g.name, g.options])).toEqual([
        ["Interior Asset", ["Office Desk", "Hot Desk", "Standing Desk"]],
        ["POI", ["Reception Desk"]],
      ]);
      expect(optionNames(listbox)).toEqual(VISUAL_ORDER);
      const seen = [activeName(input)];
      for (let step = 0; step < VISUAL_ORDER.length - 1; step += 1) {
        await user.keyboard("{ArrowDown}");
        seen.push(activeName(input));
      }
      expect(seen).toEqual(VISUAL_ORDER);
      await user.type(input, "reception");
      expect(
        groupsIn(screen.getByRole("listbox")).map((g) => [g.name, g.options]),
      ).toEqual([["POI", ["Reception Desk"]]]);
    });
  });
});

describe("Option groups (GAP-192), the edges", () => {
  afterEach(() => {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("lists options with no group first, unlabelled, before every group", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Type" options={types} />);
    await user.click(screen.getByRole("combobox"));
    const listbox = screen.getByRole("listbox");
    const lift = within(listbox).getByRole("option", { name: "Lift" });
    // Not under a group's label: in no group, and before the first label.
    expect(lift.closest('[role="group"]')).toBeNull();
    const firstGroup = within(listbox).getAllByRole("group")[0];
    expect(
      lift.compareDocumentPosition(firstGroup) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("trims a group's name, and a blank one is no group", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Type"
        options={[
          { value: "a", label: "Reception Desk", group: " POI " },
          { value: "b", label: "Meeting Room", group: "POI" },
          { value: "c", label: "Lift", group: "   " },
        ]}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    const listbox = screen.getByRole("listbox");
    expect(groupsIn(listbox).map((g) => [g.name, g.options])).toEqual([
      ["POI", ["Reception Desk", "Meeting Room"]],
    ]);
    expect(
      within(listbox)
        .getByRole("option", { name: "Lift" })
        .closest('[role="group"]'),
    ).toBeNull();
  });

  it("keeps a group's element and label id while filtering moves it", async () => {
    const user = userEvent.setup();
    render(<Combobox label="Type" options={types} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    const poi = within(screen.getByRole("listbox")).getByRole("group", {
      name: "POI",
    });
    const labelId = poi.getAttribute("aria-labelledby");
    // "recep" leaves POI first in the list, where Lift and Interior Asset
    // were before it.
    await user.type(input, "recep");
    const after = within(screen.getByRole("listbox")).getByRole("group", {
      name: "POI",
    });
    expect(after).toBe(poi);
    expect(after.getAttribute("aria-labelledby")).toBe(labelId);
  });

  it.each([
    ["Combobox", () => <Combobox label="Type" options={types} />],
    ["MultiSelect", () => <MultiSelect label="Types" options={types} />],
  ])(
    "%s keeps its list open when a group's label is pressed",
    async (_, part) => {
      const user = userEvent.setup();
      render(part());
      await user.click(screen.getByRole("combobox"));
      const listbox = screen.getByRole("listbox");
      const label = within(listbox).getByText("POI");
      // The press takes no focus from the field, so its list stays open.
      expect(fireEvent.mouseDown(label)).toBe(false);
      expect(fireEvent.mouseDown(listbox)).toBe(false);
    },
  );

  it.each([
    ["Combobox", () => <Combobox label="Type" options={types} />],
    ["MultiSelect", () => <MultiSelect label="Types" options={types} />],
    ["Listbox", () => <Listbox aria-label="Type" options={types} />],
  ])(
    "%s brings a group's label into view with the group's first option",
    async (name, part) => {
      const scrolled: string[] = [];
      Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
        scrolled.push(this.textContent ?? "");
      });
      const user = userEvent.setup();
      render(part());
      if (name === "Listbox") screen.getByRole("listbox").focus();
      else await user.click(screen.getByRole("combobox"));
      scrolled.length = 0;
      // Lift, with no group, then Office Desk, the first of Interior Asset.
      await user.keyboard(name === "Listbox" ? "{ArrowDown}" : "{ArrowDown}");
      const label = scrolled.indexOf("Interior Asset");
      const option = scrolled.indexOf("Office Desk");
      expect(label).toBeGreaterThanOrEqual(0);
      expect(option).toBeGreaterThan(label);
    },
  );
});
