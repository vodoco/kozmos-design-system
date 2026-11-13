import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { List, ListItem, ListItemStatus } from "./List";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Tag } from "../Tag";

afterEach(cleanup);

const OWNED = readFileSync(
  resolve(__dirname, "../../../../styles/src/styles/owned-components.css"),
  "utf8",
);

// GAP-195, decision 135: the checklist row is ListItem's slots.
describe("ListItem slots", () => {
  it("draws the Get started checklist row: status, title and tag, description, meta, one action", () => {
    render(
      <List>
        <ListItem
          leading={<ListItemStatus status="done" />}
          title="Explore the map"
          titleAddon={<Tag variant="secondary">Editor</Tag>}
          description="Pan, zoom and change levels."
          meta="2 min"
          trailing={<Button size="sm">Replay</Button>}
        />
      </List>,
    );
    const row = screen.getByRole("listitem");
    expect(row).toHaveClass("kozmos-list-item-slotted");
    const slots = [...row.querySelectorAll("[data-slot]")].map((node) =>
      node.getAttribute("data-slot"),
    );
    expect(slots).toEqual([
      "leading",
      "title",
      "title-addon",
      "description",
      "meta",
      "trailing",
    ]);
    // The status is read first, then the name: one row, its status heard
    // with its title.
    expect(row.textContent).toBe(
      "DoneExplore the mapEditorPan, zoom and change levels.2 minReplay",
    );
    expect(
      within(row).getByRole("button", { name: "Replay" }),
    ).toBeInTheDocument();
  });

  it("speaks each status in English by default, and a product's own words", () => {
    render(
      <>
        <ListItemStatus status="todo" data-testid="todo" />
        <ListItemStatus status="inProgress" data-testid="progress" />
        <ListItemStatus status="done" data-testid="done" />
        <ListItemStatus status="done" label="Terminé" data-testid="fr" />
      </>,
    );
    expect(screen.getByTestId("todo")).toHaveTextContent("Not started");
    expect(screen.getByTestId("progress")).toHaveTextContent("In progress");
    expect(screen.getByTestId("done")).toHaveTextContent("Done");
    expect(screen.getByTestId("fr")).toHaveTextContent("Terminé");
    expect(screen.getByTestId("done")).toHaveAttribute("data-status", "done");
    // The drawn mark is never read.
    expect(screen.getByTestId("done").querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("todo").querySelector("svg")).toBeNull();
  });

  it("draws Map Persona Visibility's row: a mark, a name, an info button, a checkbox, tinted when ticked", () => {
    render(
      <List>
        <ListItem
          selected
          leading={<span data-testid="mark" />}
          title="Visitor"
          titleAddon={<button type="button" aria-label="About Visitor" />}
          trailing={<Checkbox aria-label="Show to Visitor" checked />}
        />
        <ListItem
          leading={<span />}
          title="Staff"
          trailing={<Checkbox aria-label="Show to Staff" />}
        />
      </List>,
    );
    const [ticked, plain] = screen.getAllByRole("listitem");
    expect(ticked).toHaveAttribute("data-selected");
    expect(ticked).toHaveClass("kozmos-list-item-selected");
    expect(plain).not.toHaveAttribute("data-selected");
    expect(plain).not.toHaveClass("kozmos-list-item-selected");
    expect(
      within(ticked).getByRole("checkbox", { name: "Show to Visitor" }),
    ).toBeChecked();
  });

  it("keeps a row with no slots its children, as it was", () => {
    render(
      <List>
        <ListItem>Reception</ListItem>
      </List>,
    );
    const row = screen.getByRole("listitem");
    expect(row).not.toHaveClass("kozmos-list-item-slotted");
    expect(row.querySelector("[data-slot]")).toBeNull();
    expect(row).toHaveTextContent("Reception");
  });

  it("owns the slots' layout and the tint in the stylesheet", () => {
    for (const rule of [
      ".kozmos-list-item-slotted",
      ".kozmos-list-item-selected {\n    background-color: var(--primitives-colors-theme-0);",
      ".kozmos-list-item-leading",
      ".kozmos-list-item-trailing",
      '.kozmos-list-item-status[data-status="done"]',
    ]) {
      expect(OWNED).toContain(rule);
    }
  });
});
