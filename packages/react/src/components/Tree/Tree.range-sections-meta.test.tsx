import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Tree,
  TreeChildItemRow,
  TreeItemRow,
  TreeSectionRow,
  type TreeItem,
} from "./Tree";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ContextMenu/ContextMenu";

// GAP-151 (decision 132): a set of selected rows with Shift and Ctrl or Cmd
// ranges, section headings, only the rows in view drawn, and a context menu
// on a row. GAP-107: a row's meta on a line under its name.

const flat: TreeItem[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Bravo" },
  { id: "c", name: "Charlie", disabled: true },
  { id: "d", name: "Delta" },
  { id: "e", name: "Echo" },
];

const row = (name: string) =>
  screen.getByRole("treeitem", { name: new RegExp(`^${name}$`) });
const selectedNames = () =>
  screen
    .getAllByRole("treeitem")
    .filter((item) => item.getAttribute("aria-selected") === "true")
    .map((item) => item.textContent);

describe("Tree selectionMode=multiple (GAP-151)", () => {
  it("is aria-multiselectable, and a click selects one row", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={flat}
        selectionMode="multiple"
        defaultSelectedIds={["a", "b"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(selectedNames()).toEqual(["Alpha", "Bravo"]);
    fireEvent.click(row("Delta"));
    expect(selectedNames()).toEqual(["Delta"]);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["d"]);
  });

  it("adds or takes away a row with Ctrl or Cmd, and selects a range with Shift past a disabled row", () => {
    render(<Tree data={flat} selectionMode="multiple" />);
    fireEvent.click(row("Alpha"));
    fireEvent.click(row("Delta"), { metaKey: true });
    expect(selectedNames()).toEqual(["Alpha", "Delta"]);
    fireEvent.click(row("Alpha"), { ctrlKey: true });
    expect(selectedNames()).toEqual(["Delta"]);
    // The range runs from the row last chosen (Alpha, by its Ctrl click).
    fireEvent.click(row("Echo"), { shiftKey: true });
    expect(selectedNames()).toEqual(["Alpha", "Bravo", "Delta", "Echo"]);
    // Ctrl+Shift adds a range to what is selected.
    fireEvent.click(row("Bravo"));
    fireEvent.click(row("Delta"), { metaKey: true });
    fireEvent.click(row("Echo"), { metaKey: true, shiftKey: true });
    expect(selectedNames()).toEqual(["Bravo", "Delta", "Echo"]);
  });

  it("selects by keyboard: Shift with the arrows, Home and End, Space, and Ctrl+A", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={flat}
        selectionMode="multiple"
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    const alpha = row("Alpha");
    alpha.focus();
    fireEvent.keyDown(alpha, { key: " " });
    expect(selectedNames()).toEqual(["Alpha"]);
    fireEvent.keyDown(alpha, { key: "ArrowDown", shiftKey: true });
    expect(row("Bravo")).toHaveFocus();
    expect(selectedNames()).toEqual(["Alpha", "Bravo"]);
    fireEvent.keyDown(row("Bravo"), { key: "End", shiftKey: true });
    expect(row("Echo")).toHaveFocus();
    expect(selectedNames()).toEqual(["Alpha", "Bravo", "Delta", "Echo"]);
    // Space takes the focused row away; plain arrows move focus only.
    fireEvent.keyDown(row("Echo"), { key: " " });
    expect(selectedNames()).toEqual(["Alpha", "Bravo", "Delta"]);
    fireEvent.keyDown(row("Echo"), { key: "ArrowUp" });
    expect(row("Delta")).toHaveFocus();
    expect(selectedNames()).toEqual(["Alpha", "Bravo", "Delta"]);
    fireEvent.keyDown(row("Delta"), { key: "a", ctrlKey: true });
    expect(selectedNames()).toEqual(["Alpha", "Bravo", "Delta", "Echo"]);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["a", "b", "d", "e"]);
  });

  it("follows selectedIds when controlled", () => {
    const { rerender } = render(
      <Tree data={flat} selectionMode="multiple" selectedIds={["b"]} />,
    );
    fireEvent.click(row("Delta"), { metaKey: true });
    expect(selectedNames()).toEqual(["Bravo"]);
    rerender(
      <Tree data={flat} selectionMode="multiple" selectedIds={["b", "d"]} />,
    );
    expect(selectedNames()).toEqual(["Bravo", "Delta"]);
  });

  it("keeps a single tree to one row, whatever is held", () => {
    render(<Tree data={flat} />);
    expect(screen.getByRole("tree")).not.toHaveAttribute(
      "aria-multiselectable",
    );
    fireEvent.click(row("Alpha"));
    fireEvent.click(row("Delta"), { metaKey: true });
    expect(selectedNames()).toEqual(["Delta"]);
    fireEvent.keyDown(row("Delta"), { key: "ArrowDown", shiftKey: true });
    expect(selectedNames()).toEqual(["Delta"]);
  });
});

const level: TreeItem[] = [
  {
    id: "level",
    name: "Level 1",
    children: [
      {
        id: "poi",
        name: "POI",
        section: true,
        count: 2,
        children: [
          { id: "cafe", name: "Bean & Leaf Café" },
          { id: "gate", name: "Gate A12" },
        ],
      },
      {
        id: "structural",
        name: <span>Structural</span>,
        textValue: "Structural",
        section: true,
        count: 1,
        children: [{ id: "wall", name: "North wall" }],
      },
    ],
  },
  { id: "outdoor", name: "Outdoor" },
];

describe("Tree sections (GAP-151)", () => {
  it("draws a heading over a section's items, in a group named by it, at the section's own depth", () => {
    const { container } = render(
      <Tree data={level} defaultExpandedIds={["level"]} />,
    );
    const headings = container.querySelectorAll("[data-tree-section]");
    expect(Array.from(headings, (heading) => heading.textContent)).toEqual([
      "POI2",
      "Structural1",
    ]);
    for (const heading of headings) {
      expect(heading).toHaveAttribute("aria-hidden", "true");
      expect(heading).toHaveClass("text-[11px]", "text-primary");
      expect(heading).not.toHaveAttribute("role", "treeitem");
    }
    const poi = screen.getByRole("group", { name: "POI" });
    expect(within(poi).getAllByRole("treeitem")).toHaveLength(2);
    expect(screen.getByRole("group", { name: "Structural" })).toContainElement(
      row("North wall"),
    );
    // Its items are level 2, under Level 1, each set its own.
    expect(row("Bean & Leaf Café")).toHaveAttribute("aria-level", "2");
    expect(row("Bean & Leaf Café")).toHaveAttribute("aria-setsize", "2");
    expect(row("Gate A12")).toHaveAttribute("aria-posinset", "2");
    expect(row("North wall")).toHaveAttribute("aria-setsize", "1");
    expect(row("North wall")).toHaveAttribute("aria-posinset", "1");
    expect(row("Outdoor")).toHaveAttribute("aria-posinset", "2");
    expect(row("Outdoor")).toHaveAttribute("aria-setsize", "2");
  });

  it("passes over headings by keyboard and in a range, and never selects one", () => {
    render(
      <Tree
        data={level}
        defaultExpandedIds={["level"]}
        selectionMode="multiple"
      />,
    );
    const levelRow = row("Level 1");
    levelRow.focus();
    fireEvent.keyDown(levelRow, { key: "ArrowRight" });
    expect(row("Bean & Leaf Café")).toHaveFocus();
    fireEvent.keyDown(row("Bean & Leaf Café"), { key: "ArrowDown" });
    fireEvent.keyDown(row("Gate A12"), { key: "ArrowDown" });
    expect(row("North wall")).toHaveFocus();
    fireEvent.keyDown(row("North wall"), { key: "ArrowLeft" });
    expect(levelRow).toHaveFocus();
    fireEvent.click(row("Bean & Leaf Café"));
    fireEvent.click(row("Outdoor"), { shiftKey: true });
    expect(selectedNames()).toEqual([
      "Bean & Leaf Café",
      "Gate A12",
      "North wall",
      "Outdoor",
    ]);
  });

  it("composes: TreeSectionRow is a hidden heading with the row's count", () => {
    render(<TreeSectionRow name="Virtual" count={12} depth={1} />);
    const heading = screen.getByText("Virtual").parentElement as HTMLElement;
    expect(heading).toHaveAttribute("aria-hidden", "true");
    expect(heading.style.paddingInlineStart).toBe("28px");
    expect(screen.getByText("12")).toHaveClass("rounded-pill");
  });
});

describe("Tree type-ahead", () => {
  it("moves focus to the next row whose words start with what is typed", () => {
    vi.useFakeTimers();
    try {
      render(<Tree data={level} defaultExpandedIds={["level"]} />);
      const levelRow = row("Level 1");
      levelRow.focus();
      fireEvent.keyDown(levelRow, { key: "g" });
      expect(row("Gate A12")).toHaveFocus();
      act(() => vi.advanceTimersByTime(600));
      // A section's words, through textValue, are not a row to land on.
      fireEvent.keyDown(row("Gate A12"), { key: "o" });
      expect(row("Outdoor")).toHaveFocus();
      act(() => vi.advanceTimersByTime(600));
      fireEvent.keyDown(row("Outdoor"), { key: "n" });
      fireEvent.keyDown(row("North wall"), { key: "o" });
      expect(row("North wall")).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Tree metaPlacement (GAP-107)", () => {
  const cafe: TreeItem[] = [
    {
      id: "cafe",
      name: "Bean & Leaf Café",
      count: 3,
      meta: "Changes Awaiting Publish",
    },
  ];

  it("draws meta on a line of its own under the name with below", () => {
    const { rerender } = render(<Tree data={cafe} metaPlacement="below" />);
    const meta = screen.getByText("Changes Awaiting Publish");
    const column = meta.parentElement as HTMLElement;
    expect(column).toHaveAttribute("data-tree-meta-placement", "below");
    expect(column).toHaveClass("flex-col", "flex-1", "min-w-0");
    // The name and its count are the first line; the meta the second.
    expect(column.firstElementChild).toContainElement(
      screen.getByText("Bean & Leaf Café"),
    );
    expect(column.firstElementChild).toContainElement(screen.getByText("3"));
    expect(column.lastElementChild).toBe(meta);
    expect(meta).toHaveClass("truncate", "text-xs");

    // Inline, as before: the meta after the name's column, which it shares
    // the row with.
    rerender(<Tree data={cafe} />);
    const inline = screen.getByText("Changes Awaiting Publish");
    expect(inline).toHaveClass("shrink-0");
    expect(
      screen.getByRole("treeitem").querySelector("[data-tree-meta-placement]"),
    ).toBeNull();
  });

  it("is a TreeItemRow prop, and composed rows take the Tree's", () => {
    render(
      <>
        <TreeItemRow name="Own" meta="Draft" metaPlacement="below" />
        <Tree metaPlacement="below">
          <TreeChildItemRow name="Composed" meta="Published" />
          <TreeChildItemRow
            name="Own inline"
            meta="Archived"
            metaPlacement="inline"
          />
        </Tree>
      </>,
    );
    expect(screen.getByText("Draft").parentElement).toHaveAttribute(
      "data-tree-meta-placement",
      "below",
    );
    expect(screen.getByText("Published").parentElement).toHaveAttribute(
      "data-tree-meta-placement",
      "below",
    );
    expect(screen.getByText("Archived").parentElement).not.toHaveAttribute(
      "data-tree-meta-placement",
    );
  });
});

describe("Tree virtualized (GAP-151)", () => {
  // Map Content's tree: 13,031 items under one level, in four sections.
  const SIZES = {
    POI: 9000,
    "Interior asset": 3000,
    Structural: 1000,
    Virtual: 31,
  };
  const mapContent: TreeItem[] = [
    {
      id: "level",
      name: "Level 1",
      children: Object.entries(SIZES).map(([section, size]) => ({
        id: section,
        name: section,
        section: true,
        count: size,
        children: Array.from({ length: size }, (_, index) => ({
          id: `${section}-${index}`,
          name: `${section} ${index + 1}`,
        })),
      })),
    },
  ];
  const drawnRows = () => screen.getAllByRole("treeitem");

  afterEach(() => {
    vi.useRealTimers();
  });

  it("draws only the rows in view of 13,031, each with its true place in its set", () => {
    render(
      <Tree
        data={mapContent}
        defaultExpandedIds={["level"]}
        virtualized
        style={{ height: 400 }}
      />,
    );
    const tree = screen.getByRole("tree");
    expect(tree).toHaveAttribute("data-virtualized", "true");
    expect(tree).toHaveClass("overflow-y-auto");
    const rows = drawnRows();
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(40);
    expect(row("POI 1")).toHaveAttribute("aria-setsize", "9000");
    expect(row("POI 1")).toHaveAttribute("aria-posinset", "1");
    expect(row("POI 1")).toHaveAttribute("aria-level", "2");
    expect(screen.getByRole("group", { name: "POI" })).toContainElement(
      row("POI 1"),
    );
    // The spacer after the rows drawn holds the rest of the tree's height.
    const spacers = tree.querySelectorAll<HTMLElement>("[data-tree-spacer]");
    const end = spacers[spacers.length - 1];
    expect(parseFloat(end.style.height)).toBeGreaterThan(13000 * 40 - 2000);
  });

  it("reaches a row out of view by End and by type-ahead, and draws it focused", () => {
    render(
      <Tree
        data={mapContent}
        defaultExpandedIds={["level"]}
        virtualized
        style={{ height: 400 }}
      />,
    );
    const levelRow = row("Level 1");
    levelRow.focus();
    fireEvent.keyDown(levelRow, { key: "End" });
    const last = row("Virtual 31");
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute("tabindex", "0");
    expect(last).toHaveAttribute("aria-posinset", "31");
    expect(last).toHaveAttribute("aria-setsize", "31");
    expect(screen.getByRole("group", { name: "Virtual" })).toContainElement(
      last,
    );
    expect(drawnRows().length).toBeLessThan(40);

    fireEvent.keyDown(last, { key: "Home" });
    expect(row("Level 1")).toHaveFocus();
    fireEvent.keyDown(row("Level 1"), { key: "s" });
    const structural = row("Structural 1");
    expect(structural).toHaveFocus();
    expect(structural).toHaveAttribute("aria-setsize", "1000");
    // One tab stop, on the focused row.
    expect(
      drawnRows().filter((item) => item.getAttribute("tabindex") === "0"),
    ).toEqual([structural]);
  });

  it("keeps the focused row's element, and its focus, as the view scrolls past it", () => {
    render(
      <Tree
        data={mapContent}
        defaultExpandedIds={["level"]}
        virtualized
        style={{ height: 400 }}
      />,
    );
    const focused = row("POI 12");
    act(() => focused.focus());
    const tree = screen.getByRole("tree");
    for (const top of [200, 1000, 6000, 0]) {
      act(() => {
        tree.scrollTop = top;
        fireEvent.scroll(tree);
      });
      expect(row("POI 12")).toBe(focused);
      expect(focused).toHaveFocus();
    }
  });

  it("moves the rows drawn as the tree scrolls, and selects a range across rows out of view", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={mapContent}
        defaultExpandedIds={["level"]}
        virtualized
        selectionMode="multiple"
        onSelectedIdsChange={onSelectedIdsChange}
        style={{ height: 400 }}
      />,
    );
    fireEvent.click(row("POI 1"));
    const tree = screen.getByRole("tree");
    act(() => {
      tree.scrollTop = 4000;
      fireEvent.scroll(tree);
    });
    // 4000 down, at 40 a row, POI 100 is in view and POI 2 is not.
    expect(row("POI 100")).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: /^POI 2$/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(row("POI 100"), { shiftKey: true });
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(
      Array.from({ length: 100 }, (_, index) => `POI-${index}`),
    );
  });
});

describe("Tree onItemContextMenu (GAP-151, GAP-155)", () => {
  it("focuses and selects the row it opens on, unless it is already selected", () => {
    const onItemContextMenu = vi.fn();
    render(
      <Tree
        data={flat}
        selectionMode="multiple"
        defaultSelectedIds={["a", "b"]}
        onItemContextMenu={onItemContextMenu}
      />,
    );
    fireEvent.contextMenu(row("Bravo"));
    expect(selectedNames()).toEqual(["Alpha", "Bravo"]);
    expect(onItemContextMenu).toHaveBeenLastCalledWith(
      flat[1],
      expect.anything(),
    );
    fireEvent.contextMenu(row("Echo"));
    expect(selectedNames()).toEqual(["Echo"]);
    expect(row("Echo")).toHaveAttribute("tabindex", "0");
    expect(onItemContextMenu).toHaveBeenLastCalledWith(
      flat[4],
      expect.anything(),
    );
  });

  it("leaves the selection alone with no onItemContextMenu", () => {
    render(<Tree data={flat} defaultSelectedId="a" />);
    fireEvent.contextMenu(row("Bravo"));
    expect(selectedNames()).toEqual(["Alpha"]);
  });

  it("opens Kozmos's ContextMenu wrapped round the tree, for the row", () => {
    const Host = () => {
      const [target, setTarget] = React.useState<string>();
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Tree
              data={flat}
              onItemContextMenu={(item) => setTarget(item.id)}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Rename {target}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    };
    render(<Host />);
    fireEvent.contextMenu(row("Delta"));
    expect(
      screen.getByRole("menuitem", { name: "Rename d" }),
    ).toBeInTheDocument();
    // The open menu is modal: the tree is hidden from the accessibility
    // tree under it, so the row is found by its words.
    expect(
      screen.getByText("Delta").closest('[role="treeitem"]'),
    ).toHaveAttribute("aria-selected", "true");
  });
});
