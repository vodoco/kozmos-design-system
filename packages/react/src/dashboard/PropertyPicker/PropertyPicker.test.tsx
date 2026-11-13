import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { PropertyPicker, type PropertyPickerProperty } from "./PropertyPicker";
import * as dashboard from "../index";

// 58 properties in Pointr Cloud's types, as many as Cloud lists (QA, 11 Nov
// 2026). The names Cloud showed are Cloud's (the Url and Has rows, Phone
// Number, Opening Hours, Rating, Images, Logo, Capacity); the rest are
// samples. Booth's five suggested are marked where a test asks for them.
const CLOUD: Array<[string, string]> = [
  ["Access Programs", "Array"],
  ["Access Restrictions", "Enum"],
  ["Accessibility Notes", "Text"],
  ["Address", "Text"],
  ["Alternative Names", "Array"],
  ["Amenities", "Array"],
  ["Booking Url", "Hyperlink"],
  ["Brand", "Text"],
  ["Capacity", "Integer"],
  ["Category", "Enum"],
  ["Contact Email", "Email"],
  ["Cover Image", "Image"],
  ["Currency", "Enum"],
  ["Description", "Text"],
  ["Dress Code", "Text"],
  ["External Id", "Text"],
  ["Facebook Url", "Hyperlink"],
  ["Floor Area", "Integer"],
  ["Gate Number", "Text"],
  ["Has Assistance", "Boolean"],
  ["Has Baby Changing", "Boolean"],
  ["Has Charging Points", "Boolean"],
  ["Has Parking", "Boolean"],
  ["Has Wifi", "Boolean"],
  ["Images", "Image"],
  ["Instagram Url", "Hyperlink"],
  ["Is Accessible Toilet", "Boolean"],
  ["Is Gender Neutral", "Boolean"],
  ["Is Pet Friendly", "Boolean"],
  ["Is Smoking Area", "Boolean"],
  ["Is Wheelchair Accessible", "Boolean"],
  ["Keywords", "Array"],
  ["Languages Spoken", "Array"],
  ["Logo", "Image"],
  ["Max Occupancy", "Integer"],
  ["Menu Url", "Hyperlink"],
  ["Occupancy Status", "Enum"],
  ["Opening Hours", "Object"],
  ["Order Url", "Hyperlink"],
  ["Payment Methods", "Array"],
  ["Phone Number", "Hyperlink"],
  ["Price Range", "Enum"],
  ["Rating", "Object"],
  ["Reservation Email", "Email"],
  ["Room Number", "Text"],
  ["Seating", "Integer"],
  ["Security Level", "Enum"],
  ["Short Name", "Text"],
  ["Social Links", "Object"],
  ["Support Email", "Email"],
  ["Tags", "Array"],
  ["Terminal", "Text"],
  ["Ticket Required", "Boolean"],
  ["Twitter Url", "Hyperlink"],
  ["Vendor Code", "Text"],
  ["Video Tour", "Hyperlink"],
  ["Website Url", "Hyperlink"],
  ["Zone", "Enum"],
];
const BOOTH = new Set([
  "Access Restrictions",
  "Description",
  "Has Assistance",
  "Has Wifi",
  "Occupancy Status",
]);

function properties(suggest = false): PropertyPickerProperty[] {
  return CLOUD.map(([name, type]) => ({
    id: name.toLowerCase().replace(/ /g, "-"),
    name,
    type,
    description:
      name === "Access Programs" ? "Named access program accepted" : undefined,
    suggested: suggest && BOOTH.has(name) ? true : undefined,
  }));
}

async function openPicker(
  props: Partial<React.ComponentProps<typeof PropertyPicker>> = {},
) {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const view = render(
    <PropertyPicker properties={properties()} onSelect={onSelect} {...props} />,
  );
  const trigger = screen.getByRole("button", { name: "Add additional field" });
  await user.click(trigger);
  const search = await screen.findByRole("searchbox", {
    name: "Search properties",
  });
  return { user, onSelect, trigger, search, ...view };
}

describe("PropertyPicker", () => {
  it("ships from the dashboard entry", () => {
    expect(dashboard).toHaveProperty("PropertyPicker", PropertyPicker);
  });

  it("is a full-width subtle Button that opens a named popup with the search focused", async () => {
    const { trigger, search } = await openPicker();
    expect(trigger).toHaveClass("kozmos-property-picker-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("dialog", { name: "Add additional field" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(search).toHaveFocus());
  });

  it("lists every one of the 58 properties, each with its type and description", async () => {
    await openPicker();
    const list = screen.getByRole("listbox", { name: "Properties" });
    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(58);
    expect(options[0]).toHaveTextContent(
      "Access ProgramsArray · Named access program accepted",
    );
    expect(
      within(list).getByRole("option", { name: /^Has Wifi/ }),
    ).toHaveTextContent("Boolean");
    // Nothing suggested: no tabs, no group labels.
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(within(list).queryByRole("group")).toBeNull();
  });

  it("finds each of the 58 properties by its name, in any case, and adds it", async () => {
    const all = properties();
    const { onSelect } = await openPicker();
    for (const property of all) {
      // The picker closes on a choice; open it again for the next.
      if (!screen.queryByRole("searchbox"))
        fireEvent.click(
          screen.getByRole("button", { name: "Add additional field" }),
        );
      fireEvent.change(await screen.findByRole("searchbox"), {
        target: { value: property.name.toUpperCase() },
      });
      fireEvent.click(
        screen.getByRole("option", {
          name: new RegExp(`^${property.name}${property.type}`),
        }),
      );
      expect(onSelect).toHaveBeenLastCalledWith(property);
    }
    expect(onSelect).toHaveBeenCalledTimes(58);
  }, 30_000);

  it("searches the name only, never the description or type", async () => {
    const { user, search } = await openPicker();
    await user.type(search, "url");
    const names = screen
      .getAllByRole("option")
      .map(
        (option) => option.querySelector(".kozmos-option-label")?.textContent,
      );
    expect(names).toEqual([
      "Booking Url",
      "Facebook Url",
      "Instagram Url",
      "Menu Url",
      "Order Url",
      "Twitter Url",
      "Website Url",
    ]);
    await user.clear(search);
    await user.type(search, "named");
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("shows and announces an empty state when nothing matches", async () => {
    const { user, search } = await openPicker({ onCustomField: vi.fn() });
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await user.type(search, "zzzz");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(status).toHaveTextContent("No properties match");
    // The custom field action stays.
    expect(
      screen.getByRole("button", { name: "Custom field" }),
    ).toBeInTheDocument();
  });

  it("puts the suggested under a Suggested tab and every other under Others, never twice", async () => {
    const { user } = await openPicker({ properties: properties(true) });
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Suggested", "Others"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    const suggested = screen.getByRole("listbox", { name: "Suggested" });
    expect(
      within(suggested)
        .getAllByRole("option")
        .map((o) => o.querySelector(".kozmos-option-label")?.textContent),
    ).toEqual([...BOOTH]);
    await user.click(tabs[1]);
    const others = screen.getByRole("listbox", { name: "Others" });
    const otherNames = within(others)
      .getAllByRole("option")
      .map((o) => o.querySelector(".kozmos-option-label")?.textContent);
    expect(otherNames).toHaveLength(53);
    for (const name of BOOTH) expect(otherNames).not.toContain(name);
  });

  it("searches across both while typing, under Suggested and Others groups", async () => {
    const { user, search } = await openPicker({
      properties: properties(true),
    });
    await user.type(search, "has");
    expect(screen.queryByRole("tablist")).toBeNull();
    const list = screen.getByRole("listbox", { name: "Properties" });
    const suggested = within(list).getByRole("group", { name: "Suggested" });
    const others = within(list).getByRole("group", { name: "Others" });
    expect(within(suggested).getAllByRole("option")).toHaveLength(2);
    expect(within(others).getAllByRole("option")).toHaveLength(3);
  });

  it("moves from the search into the list with ArrowDown, and back with ArrowUp", async () => {
    const { user, search } = await openPicker();
    await waitFor(() => expect(search).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    const list = screen.getByRole("listbox");
    expect(list).toHaveFocus();
    expect(list).toHaveAttribute(
      "aria-activedescendant",
      `${list.id}-option-0`,
    );
    await user.keyboard("{ArrowDown}");
    expect(list).toHaveAttribute(
      "aria-activedescendant",
      `${list.id}-option-1`,
    );
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(search).toHaveFocus();
  });

  it("types into the search from the list", async () => {
    const { user, search } = await openPicker();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveFocus();
    await user.keyboard("w");
    expect(search).toHaveFocus();
  });

  it("chooses with Enter in the list, closes and gives the focus back to the button", async () => {
    const { user, search, onSelect, trigger } = await openPicker();
    await user.type(search, "wheel");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "is-wheelchair-accessible" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes on Escape, one layer at a time, and gives the focus back to the button", async () => {
    const { user, search, trigger } = await openPicker();
    await user.type(search, "url");
    // The first Escape empties the search, the next closes the picker.
    await user.keyboard("{Escape}");
    expect(search).toHaveValue("");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("starts afresh each time it opens", async () => {
    const { user, search } = await openPicker({
      properties: properties(true),
    });
    await user.click(screen.getByRole("tab", { name: "Others" }));
    await user.type(search, "has");
    await user.keyboard("{Escape}{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Add additional field" }),
    );
    expect(await screen.findByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("tab", { name: "Suggested" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("drops the tabs once nothing is suggested", async () => {
    const { rerender } = await openPicker({ properties: properties(true) });
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    rerender(
      <PropertyPicker
        properties={properties(true).filter((p) => !p.suggested)}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(53);
  });

  it("calls the custom field action and closes", async () => {
    const onCustomField = vi.fn();
    const { user, trigger } = await openPicker({ onCustomField });
    await user.click(screen.getByRole("button", { name: "Custom field" }));
    expect(onCustomField).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("draws no custom field action without onCustomField", async () => {
    await openPicker();
    expect(screen.queryByRole("button", { name: "Custom field" })).toBeNull();
  });

  it("takes the product's words", async () => {
    const user = userEvent.setup();
    render(
      <PropertyPicker
        properties={properties(true)}
        onSelect={vi.fn()}
        onCustomField={vi.fn()}
        label="Alan ekle"
        searchLabel="Özellik ara"
        suggestedLabel="Önerilen"
        othersLabel="Diğer"
        customFieldLabel="Özel alan"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Alan ekle" }));
    expect(
      await screen.findByRole("searchbox", { name: "Özellik ara" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Alan ekle" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Önerilen" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Diğer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Özel alan" })).toBeTruthy();
  });

  it("is controlled through open and onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <PropertyPicker
        properties={properties()}
        onSelect={vi.fn()}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Add additional field" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <PropertyPicker
        properties={properties()}
        onSelect={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("does not open while disabled", async () => {
    const user = userEvent.setup();
    render(
      <PropertyPicker properties={properties()} onSelect={vi.fn()} disabled />,
    );
    const trigger = screen.getByRole("button", {
      name: "Add additional field",
    });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
