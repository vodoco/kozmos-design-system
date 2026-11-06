import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect } from "../MultiSelect";
import { Combobox } from "./Combobox";

/**
 * "No results found" is said aloud when typing empties a field's list.
 *
 * Before this fix, the text arrived inside a live region that was mounted with
 * it. Typing a query that matched nothing mounted a `role="status"` box that
 * already held the text, or turned the listbox into one. Screen readers read
 * only a change inside a live region that is already in the page. VoiceOver on
 * Safari (5 Nov) said nothing.
 *
 * The status is now in the field from the first render, outside the popup and
 * its portal, and only its words change.
 */
const options = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
];

const fields = [
  [
    "Combobox",
    (props: { emptyText?: string }) => (
      <Combobox label="Section" options={options} emptyText={props.emptyText} />
    ),
  ],
  [
    "MultiSelect",
    (props: { emptyText?: string }) => (
      <MultiSelect
        label="Section"
        options={options}
        emptyText={props.emptyText}
      />
    ),
  ],
] as const;

describe.each(fields)("%s's empty list", (_name, Field) => {
  it("is announced by a status that is in the field before the list empties", async () => {
    const user = userEvent.setup();
    render(<Field />);
    // In the page from the first render, saying nothing.
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();

    const input = screen.getByRole("combobox");
    await user.type(input, "zz");
    // The same node, now with the words, and the only status.
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("No results found");

    // Matches again: it falls silent.
    await user.clear(input);
    await user.type(input, "Over");
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByRole("option", { name: "Overview" })).toBeVisible();

    // An empty list again, then closed: it falls silent with the popup.
    await user.type(input, "zz");
    expect(status).toHaveTextContent("No results found");
    await user.keyboard("{Escape}");
    expect(status).toBeEmptyDOMElement();
  });

  it("says the field's own empty text, and the popup's copy is no live region", async () => {
    const user = userEvent.setup();
    render(<Field emptyText="No sections match" />);
    const status = screen.getByRole("status");
    await user.type(screen.getByRole("combobox"), "zz");
    expect(status).toHaveTextContent("No sections match");
    // The visible copy stays for the eye, and a screen reader reaching it
    // reads it, but it is no second live region to announce it twice.
    const copies = screen.getAllByText("No sections match");
    expect(copies).toHaveLength(2);
    const visible = copies.find((node) => node !== status);
    expect(visible).toBeVisible();
    expect(visible?.closest("[aria-live]")).toBeNull();
    expect(visible?.closest('[role="status"]')).toBeNull();
  });
});

describe("Combobox's empty list beside its commands", () => {
  it("is announced while the commands stay in the listbox", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Origin"
        options={options}
        popupActions={[
          { id: "map", label: "Select from map", onAction: vi.fn() },
        ]}
      />,
    );
    const status = screen.getByRole("status");
    await user.type(screen.getByRole("combobox"), "zz");
    expect(screen.getAllByRole("status")).toEqual([status]);
    expect(status).toHaveTextContent("No results found");
    const listbox = screen.getByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Select from map" }),
    ).toBeVisible();
  });

  it("says nothing when the field's supporting text already says it", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Origin"
        options={[]}
        helperText="Locations unavailable"
        emptyText="Locations unavailable"
        // A command keeps the popup open with no option, so only the
        // supporting-text check keeps the status silent.
        popupActions={[
          { id: "map", label: "Select from map", onAction: vi.fn() },
        ]}
      />,
    );
    const status = screen.getByRole("status");
    await user.click(screen.getByRole("combobox"));
    expect(
      screen.getByRole("option", { name: "Select from map" }),
    ).toBeVisible();
    // The description already reads it, and the popup draws it once, below.
    expect(status).toBeEmptyDOMElement();
    expect(screen.getAllByText("Locations unavailable")).toHaveLength(1);
  });

  it("speaks when the list opens with nothing to show, as the popup shows it", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Origin"
        options={[]}
        popupActions={[
          { id: "map", label: "Select from map", onAction: vi.fn() },
        ]}
      />,
    );
    const status = screen.getByRole("status");
    await user.click(screen.getByRole("combobox"));
    expect(status).toHaveTextContent("No results found");
  });
});
