import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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
    // The group's name is the section's words and its count (review 8).
    const poi = screen.getByRole("group", { name: "POI, 2" });
    expect(within(poi).getAllByRole("treeitem")).toHaveLength(2);
    expect(
      screen.getByRole("group", { name: "Structural, 1" }),
    ).toContainElement(row("North wall"));
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
  const scroller = () =>
    screen
      .getByRole("tree")
      .querySelector<HTMLElement>("[data-tree-scroller]")!;

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
    // It scrolls itself, in a scroller inside the tree, so the product's
    // own width and margin classes stay on the tree.
    expect(scroller()).toHaveClass("overflow-y-auto");
    const rows = drawnRows();
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(40);
    expect(row("POI 1")).toHaveAttribute("aria-setsize", "9000");
    expect(row("POI 1")).toHaveAttribute("aria-posinset", "1");
    expect(row("POI 1")).toHaveAttribute("aria-level", "2");
    expect(screen.getByRole("group", { name: "POI, 9,000" })).toContainElement(
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
    expect(screen.getByRole("group", { name: "Virtual, 31" })).toContainElement(
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
    for (const top of [200, 1000, 6000, 0]) {
      act(() => {
        scroller().scrollTop = top;
        fireEvent.scroll(scroller());
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
    act(() => {
      scroller().scrollTop = 4000;
      fireEvent.scroll(scroller());
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

describe("Tree review fixes (#524)", () => {
  const nested: TreeItem[] = [
    {
      id: "terminal",
      name: "Terminal",
      children: [
        { id: "gate-1", name: "Gate 1" },
        { id: "gate-2", name: "Gate 2" },
      ],
    },
    {
      id: "car-park",
      name: "Car park",
      children: [{ id: "bay", name: "Bay" }],
    },
    { id: "apron", name: "Apron" },
  ];

  it("names a section's group by its words and its count, formatted", () => {
    render(
      <Tree
        data={[
          {
            id: "poi",
            name: "POI",
            section: true,
            count: 3257,
            children: [{ id: "cafe", name: "Café" }],
          },
          {
            id: "virtual",
            name: "Virtual",
            section: true,
            children: [{ id: "zone", name: "Zone" }],
          },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "POI, 3,257" })).toContainElement(
      row("Café"),
    );
    expect(screen.getByRole("group", { name: "Virtual" })).toContainElement(
      row("Zone"),
    );
  });

  it("lets go of the rows a collapse hides, in one change", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={nested}
        selectionMode="multiple"
        defaultExpandedIds={["terminal"]}
        defaultSelectedIds={["gate-1", "gate-2", "apron"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    const terminal = row("Terminal");
    terminal.focus();
    fireEvent.keyDown(terminal, { key: "ArrowLeft" });
    expect(onSelectedIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["apron"]);
    expect(selectedNames()).toEqual(["Apron"]);
    // Ctrl+A takes the rows in view and enabled only.
    fireEvent.keyDown(terminal, { key: "a", ctrlKey: true });
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([
      "terminal",
      "car-park",
      "apron",
    ]);
  });

  it("lets a click that selects and closes a parent keep the parent selected", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={nested}
        selectionMode="multiple"
        defaultExpandedIds={["terminal"]}
        defaultSelectedIds={["gate-1"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    fireEvent.click(row("Terminal"));
    expect(row("Terminal")).toHaveAttribute("aria-expanded", "false");
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["terminal"]);
    expect(selectedNames()).toEqual(["Terminal"]);
  });

  it("opens every row beside the focused one with *", () => {
    render(<Tree data={nested} />);
    const apron = row("Apron");
    apron.focus();
    fireEvent.keyDown(apron, { key: "*" });
    expect(row("Terminal")).toHaveAttribute("aria-expanded", "true");
    expect(row("Car park")).toHaveAttribute("aria-expanded", "true");
    expect(row("Apron")).toHaveFocus();
  });

  it("moves by a page of rows with PageDown and PageUp, and Shift takes the range", () => {
    const many: TreeItem[] = Array.from({ length: 60 }, (_, index) => ({
      id: `r${index + 1}`,
      name: `Row ${index + 1}`,
    }));
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={many}
        virtualized
        selectionMode="multiple"
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    const first = row("Row 1");
    first.focus();
    // No layout here: a view of 400, ten rows of 40, a page of nine.
    fireEvent.keyDown(first, { key: "PageDown" });
    expect(row("Row 10")).toHaveFocus();
    fireEvent.keyDown(row("Row 10"), { key: "PageDown", shiftKey: true });
    expect(row("Row 19")).toHaveFocus();
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(
      Array.from({ length: 10 }, (_, index) => `r${index + 10}`),
    );
    fireEvent.keyDown(row("Row 19"), { key: "PageUp" });
    expect(row("Row 10")).toHaveFocus();
  });

  it("types ahead only after the product's own onKeyDown, and takes no key it does not use", () => {
    const own = vi.fn((event: React.KeyboardEvent) => {
      if (event.key === "c") event.preventDefault();
    });
    render(<Tree data={nested} onKeyDown={own} />);
    const terminal = row("Terminal");
    terminal.focus();
    // The product's handler took "c": the tree does nothing with it.
    fireEvent.keyDown(terminal, { key: "c" });
    expect(own).toHaveBeenCalledTimes(1);
    expect(terminal).toHaveFocus();
    // Ctrl or Cmd with a letter, and + and -, are not type-ahead.
    for (const init of [
      { key: "a", ctrlKey: true },
      { key: "a", metaKey: true },
      { key: "+" },
      { key: "-" },
    ]) {
      const event = fireEvent.keyDown(terminal, init);
      expect(event).toBe(true);
      expect(terminal).toHaveFocus();
    }
    // A key that moves focus is the tree's; one that then finds no row
    // ("az") is left alone.
    expect(fireEvent.keyDown(terminal, { key: "a" })).toBe(false);
    expect(row("Apron")).toHaveFocus();
    expect(fireEvent.keyDown(row("Apron"), { key: "z" })).toBe(true);
    expect(row("Apron")).toHaveFocus();
  });

  it("cycles through the rows that start with a letter typed again", () => {
    vi.useFakeTimers();
    try {
      const gates: TreeItem[] = [
        { id: "g1", name: "Gate 1" },
        { id: "x", name: "Exit" },
        { id: "g2", name: "Gate 2" },
        { id: "g3", name: "Gate 3" },
      ];
      render(<Tree data={gates} />);
      const exit = row("Exit");
      exit.focus();
      fireEvent.keyDown(exit, { key: "g" });
      expect(row("Gate 2")).toHaveFocus();
      fireEvent.keyDown(row("Gate 2"), { key: "g" });
      expect(row("Gate 3")).toHaveFocus();
      fireEvent.keyDown(row("Gate 3"), { key: "g" });
      expect(row("Gate 1")).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  describe("a virtualized tree with no height of its own", () => {
    const stubs: (() => void)[] = [];
    const stub = (property: "clientHeight" | "scrollHeight", value: number) => {
      const own =
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, property) ??
        Object.getOwnPropertyDescriptor(Element.prototype, property)!;
      Object.defineProperty(HTMLElement.prototype, property, {
        configurable: true,
        get: () => value,
      });
      stubs.push(() =>
        Object.defineProperty(HTMLElement.prototype, property, own),
      );
    };
    afterEach(() => {
      while (stubs.length) stubs.pop()!();
      vi.restoreAllMocks();
    });
    const many: TreeItem[] = Array.from({ length: 500 }, (_, index) => ({
      id: `r${index}`,
      name: `Row ${index}`,
    }));

    it("warns once, saying how to give it one", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      stub("clientHeight", 20000);
      stub("scrollHeight", 20000);
      const { rerender } = render(<Tree data={many} virtualized />);
      rerender(<Tree data={many} virtualized overscan={4} />);
      const mine = warn.mock.calls.filter(([message]) =>
        String(message).startsWith("Tree: a virtualized tree"),
      );
      expect(mine).toHaveLength(1);
      expect(mine[0][0]).toMatch(/500 rows/);
      expect(mine[0][0]).toMatch(/height/);
      expect(mine[0][0]).toMatch(/min-h-0/);
    });

    it("says nothing when it scrolls itself", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      stub("clientHeight", 400);
      stub("scrollHeight", 20000);
      render(<Tree data={many} virtualized />);
      expect(
        warn.mock.calls.some(([message]) =>
          String(message).startsWith("Tree: a virtualized tree"),
        ),
      ).toBe(false);
    });
  });
});

describe("Tree second review fixes (#524)", () => {
  const nested: TreeItem[] = [
    {
      id: "terminal",
      name: "Terminal",
      children: [
        { id: "gate-1", name: "Gate 1" },
        { id: "gate-2", name: "Gate 2" },
      ],
    },
    { id: "apron", name: "Apron" },
  ];

  it("keeps the selection when a controlled tree refuses the collapse, and lets go once it takes effect", () => {
    const onSelectedIdsChange = vi.fn();
    const props = {
      data: nested,
      selectionMode: "multiple" as const,
      defaultSelectedIds: ["gate-1", "apron"],
      onSelectedIdsChange,
    };
    const { rerender } = render(
      <Tree
        {...props}
        expandedIds={["terminal"]}
        onExpandedChange={() => {}}
      />,
    );
    const terminal = row("Terminal");
    terminal.focus();
    fireEvent.keyDown(terminal, { key: "ArrowLeft" });
    // Refused: the rows are still drawn, and still selected.
    expect(row("Gate 1")).toHaveAttribute("aria-selected", "true");
    expect(onSelectedIdsChange).not.toHaveBeenCalled();
    // Applied by the product: now they go, in one change.
    rerender(<Tree {...props} expandedIds={[]} onExpandedChange={() => {}} />);
    expect(onSelectedIdsChange).toHaveBeenCalledTimes(1);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["apron"]);
  });

  it("keeps a single tree's selected row when its parent closes", () => {
    const onSelectionChange = vi.fn();
    render(
      <Tree
        data={nested}
        defaultExpandedIds={["terminal"]}
        defaultSelectedId="gate-1"
        onSelectionChange={onSelectionChange}
      />,
    );
    const terminal = row("Terminal");
    terminal.focus();
    fireEvent.keyDown(terminal, { key: "ArrowLeft" });
    fireEvent.keyDown(terminal, { key: "ArrowRight" });
    expect(row("Gate 1")).toHaveAttribute("aria-selected", "true");
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("takes a Space typed inside a word, even when focus stays where it is", () => {
    render(
      <Tree
        data={[
          { id: "a", name: "Gate A" },
          { id: "h", name: "Hall" },
        ]}
      />,
    );
    const gate = row("Gate A");
    gate.focus();
    for (const key of ["g", "a", "t", "e"]) fireEvent.keyDown(gate, { key });
    expect(gate).toHaveFocus();
    expect(fireEvent.keyDown(gate, { key: " " })).toBe(false);
    expect(gate).toHaveFocus();
  });

  it("pages by the rows that fit, less one, at the row's height with a divided stroke", () => {
    const many: TreeItem[] = Array.from({ length: 60 }, (_, index) => ({
      id: `r${index + 1}`,
      name: `Row ${index + 1}`,
    }));
    const { unmount } = render(<Tree data={many} virtualized divided />);
    // A view of 400: 41 a divided row, nine rows, a page of eight.
    row("Row 1").focus();
    fireEvent.keyDown(row("Row 1"), { key: "PageDown" });
    expect(row("Row 9")).toHaveFocus();
    unmount();
    // Compact: 32 a row, twelve, a page of eleven.
    render(<Tree data={many} virtualized density="compact" />);
    row("Row 1").focus();
    fireEvent.keyDown(row("Row 1"), { key: "PageDown" });
    expect(row("Row 12")).toHaveFocus();
  });

  it("writes a section's count in the tree's locale, and reads a count given as a slot", () => {
    render(
      <Tree
        locale="de-DE"
        data={[
          {
            id: "poi",
            name: "POI",
            section: true,
            count: 3257,
            children: [{ id: "cafe", name: "Café" }],
          },
          {
            id: "virtual",
            name: "Virtual",
            section: true,
            count: ({ item }) => item.children?.length ?? 0,
            children: [{ id: "zone", name: "Zone" }],
          },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "POI, 3.257" })).toContainElement(
      row("Café"),
    );
    expect(screen.getByRole("group", { name: "Virtual, 1" })).toContainElement(
      row("Zone"),
    );
  });
});

describe("Tree third review (#524)", () => {
  const sections: TreeItem[] = [
    {
      id: "poi",
      name: "POI",
      section: true,
      count: 3257,
      children: [{ id: "cafe", name: "Café" }],
    },
  ];

  it("writes a section's count as a server would until it mounts, then in the page's language", () => {
    const html = document.documentElement;
    const before = html.lang;
    html.lang = "de-DE";
    try {
      // A server render, and so the client's first: en-US, whatever the
      // page's language, so hydration finds the same words.
      expect(renderToString(<Tree data={sections} />)).toContain(
        'aria-label="POI, 3,257"',
      );
      // Mounted, the page's language.
      render(<Tree data={sections} />);
      expect(
        screen.getByRole("group", { name: "POI, 3.257" }),
      ).toBeInTheDocument();
    } finally {
      html.lang = before;
    }
  });

  it("hands a virtualized tree's scroller to scrollerRef, and scrolling it moves the rows", () => {
    const many: TreeItem[] = Array.from({ length: 500 }, (_, index) => ({
      id: `r${index + 1}`,
      name: `Row ${index + 1}`,
    }));
    const scroller = React.createRef<HTMLDivElement>();
    const tree = React.createRef<HTMLDivElement>();
    render(<Tree data={many} virtualized ref={tree} scrollerRef={scroller} />);
    // ref stays the tree; scrollerRef is the box that scrolls.
    expect(tree.current).toHaveAttribute("role", "tree");
    expect(scroller.current).toHaveAttribute("data-tree-scroller");
    expect(tree.current).toContainElement(scroller.current);
    expect(row("Row 1")).toBeInTheDocument();
    act(() => {
      scroller.current!.scrollTop = 8000;
      fireEvent.scroll(scroller.current!);
    });
    expect(row("Row 200")).toBeInTheDocument();
    expect(
      screen.queryByRole("treeitem", { name: /^Row 2$/ }),
    ).not.toBeInTheDocument();
  });
});
