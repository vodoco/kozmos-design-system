import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  Tree,
  TreeChildItemRow,
  TreeItemRow,
  TreeParentItemRow,
  type TreeItem,
} from "./Tree";
import { describe, expect, it, vi } from "vitest";

const sampleData: TreeItem[] = [
  {
    id: "1",
    name: "Root",
    count: 2,
    children: [{ id: "2", name: "Child" }],
  },
];

describe("Tree", () => {
  it("renders with tree semantics", () => {
    render(<Tree data={sampleData} />);

    expect(screen.getByRole("tree", { name: "Tree" })).toBeInTheDocument();
    expect(screen.getByText("Root")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /root/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands and collapses from pointer activation", () => {
    render(<Tree data={sampleData} />);

    const root = screen.getByRole("treeitem", { name: /root/i });
    fireEvent.click(root);

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(root).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(root);
    expect(screen.queryByText("Child")).not.toBeInTheDocument();
  });

  it("supports keyboard expansion and selection callbacks", () => {
    const onSelectionChange = vi.fn();

    render(<Tree data={sampleData} onSelectionChange={onSelectionChange} />);

    const root = screen.getByRole("treeitem", { name: /root/i });
    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(screen.getByText("Child")).toBeInTheDocument();

    const child = screen.getByRole("treeitem", { name: /child/i });
    fireEvent.keyDown(child, { key: "Enter" });

    expect(onSelectionChange).toHaveBeenCalledWith(sampleData[0].children?.[0]);
    expect(child).toHaveAttribute("aria-selected", "true");
  });

  it("renders row metadata without changing tree semantics", () => {
    render(<Tree data={sampleData} />);

    const count = screen.getByText("2");
    expect(count).toBeInTheDocument();
    expect(count.parentElement).toContainElement(screen.getByText("Root"));
    expect(
      screen.getByRole("treeitem", { name: /root/i }),
    ).toHaveAccessibleName(/root/i);
  });

  it("allows nested row actions without selecting or toggling the row", () => {
    const onSelectionChange = vi.fn();
    const onEdit = vi.fn();
    const data: TreeItem[] = [
      {
        id: "root",
        name: "Root",
        actions: (
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        ),
        children: [{ id: "child", name: "Child" }],
      },
    ];

    render(<Tree data={data} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Child")).not.toBeInTheDocument();
  });

  it("lets action renderers select without toggling branch rows", () => {
    const onSelectionChange = vi.fn();
    const data: TreeItem[] = [
      {
        id: "root",
        name: "Root",
        actions: ({ select }) => (
          <button type="button" onClick={select}>
            Select root
          </button>
        ),
        children: [{ id: "child", name: "Child" }],
      },
    ];

    render(<Tree data={data} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Select root" }));

    expect(onSelectionChange).toHaveBeenCalledWith(data[0]);
    expect(screen.queryByText("Child")).not.toBeInTheDocument();
  });

  it("moves focus through visible items with arrow keys", () => {
    render(<Tree data={sampleData} defaultExpandedIds={["1"]} />);

    const root = screen.getByRole("treeitem", { name: /root/i });
    const child = screen.getByRole("treeitem", { name: /child/i });

    root.focus();
    fireEvent.keyDown(root, { key: "ArrowDown" });

    expect(child).toHaveFocus();
  });

  it("exports a reusable row primitive for composed tree layouts", () => {
    render(
      <TreeItemRow
        name="Place item"
        count={4}
        depth={2}
        focusVisible
        actions={<button type="button">Edit</button>}
      />,
    );

    expect(screen.getByText("Place item")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.getByText("Place item").closest('[data-depth="2"]'),
    ).toHaveAttribute("data-focus-visible", "true");
  });

  it("exports parent and child row primitives with the right disclosure contract", () => {
    render(
      <>
        <TreeParentItemRow name="Content group" expanded />
        <TreeChildItemRow name="Place item" />
      </>,
    );

    expect(
      screen.getByText("Content group").closest('[data-expanded="true"]'),
    ).toBeTruthy();
    expect(
      screen.getByText("Place item").closest("[data-expanded]"),
    ).toBeNull();
  });

  it("can act as a semantic shell for composed row primitives", () => {
    render(
      <Tree ariaLabel="Composed tree">
        <TreeParentItemRow
          aria-expanded="true"
          count={23}
          name="Map content"
          role="treeitem"
        />
        <TreeChildItemRow
          count={4}
          depth={1}
          name="Place item"
          role="treeitem"
          selected
        />
      </Tree>,
    );

    expect(
      screen.getByRole("tree", { name: "Composed tree" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("treeitem", { name: /map content/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("treeitem", { name: /place item/i }),
    ).toHaveAttribute("data-selected", "true");
  });

  it("divided draws a stroke under every row and an open parent on a surface, reaching the bleed past the tree (GAP-201)", () => {
    const data: TreeItem[] = [
      {
        id: "a",
        name: "Terminal A",
        children: [{ id: "a1", name: "Level 1" }],
      },
      {
        id: "b",
        name: "Terminal B",
        children: [{ id: "b1", name: "Level 1" }],
      },
      { id: "c", name: "Car park" },
    ];
    const surface = "bg-[var(--primitives-colors-background-50)]";
    const { rerender } = render(
      <Tree data={data} divided bleed={20} defaultExpandedIds={["a", "b"]} />,
    );
    const row = (name: string, index = 0) =>
      screen.getAllByRole("treeitem", { name: new RegExp(name) })[index];
    const divider = (name: string, index = 0) =>
      row(name, index).parentElement as HTMLElement;

    expect(screen.getByRole("tree")).toHaveStyle({
      "--kozmos-tree-bleed": "20px",
    });
    for (const item of screen.getAllByRole("treeitem")) {
      // The row keeps its corners and its height; the stroke is on the box
      // round it, which reaches the bleed past the tree on each side.
      expect(item).toHaveClass("rounded-control", "focus-visible:ring-inset");
      expect(item).not.toHaveClass("border-b", "rounded-none");
      const box = item.parentElement as HTMLElement;
      expect(box).toHaveAttribute("data-tree-divider");
      expect(box).toHaveClass("border-b", "border-border");
      expect(box.style.marginInline).toBe(
        "calc(var(--kozmos-tree-bleed, 0px) * -1)",
      );
      expect(box.style.paddingInline).toBe("var(--kozmos-tree-bleed, 0px)");
    }
    // Open parents on the surface; a leaf and a child do not take it.
    expect(divider("Terminal A")).toHaveClass(surface);
    expect(divider("Car park")).not.toHaveClass(surface);
    expect(divider("Level 1")).not.toHaveClass(surface);

    // Closed, a parent leaves the surface.
    fireEvent.click(row("Terminal B"));
    expect(row("Terminal B")).toHaveAttribute("aria-expanded", "false");
    expect(divider("Terminal B")).not.toHaveClass(surface);

    // A selected open parent: its rounded fill over the surface.
    rerender(
      <Tree data={data} divided defaultExpandedIds={["a"]} selectedId="a" />,
    );
    expect(row("Terminal A")).toHaveAttribute("aria-expanded", "true");
    expect(row("Terminal A")).toHaveClass("bg-muted", "rounded-control");
    expect(divider("Terminal A")).toHaveClass(surface);

    // Not divided, the tree as it was drawn, with no box round its rows.
    rerender(<Tree data={data} defaultExpandedIds={["a"]} />);
    expect(row("Terminal A")).toHaveClass(
      "rounded-control",
      "focus-visible:ring-offset-2",
    );
    expect(row("Terminal A")).not.toHaveClass("focus-visible:ring-inset");
    expect(
      screen.getByRole("tree").querySelector("[data-tree-divider]"),
    ).toBeNull();
  });

  it("gives composed rows the divided look, from the Tree or their own prop", () => {
    const { rerender } = render(
      <Tree divided>
        <TreeParentItemRow
          role="treeitem"
          aria-expanded
          name="Terminal A"
          expanded
        />
        <TreeChildItemRow role="treeitem" name="Level 1" depth={1} />
      </Tree>,
    );
    const surface = "bg-[var(--primitives-colors-background-50)]";
    let [parent, child] = screen.getAllByRole("treeitem");
    expect(parent.parentElement).toHaveClass("border-b", surface);
    expect(child.parentElement).toHaveClass("border-b");
    expect(child.parentElement).not.toHaveClass(surface);
    // A row's own divided={false} wins over the Tree's.
    rerender(
      <Tree divided>
        <TreeChildItemRow role="treeitem" name="Level 1" divided={false} />
      </Tree>,
    );
    [child] = screen.getAllByRole("treeitem");
    expect(child.parentElement).toHaveAttribute("role", "tree");
    // And a row's own divided works in a Tree that is not.
    rerender(
      <Tree>
        <TreeChildItemRow role="treeitem" name="Level 1" divided />
      </Tree>,
    );
    [parent] = screen.getAllByRole("treeitem");
    expect(parent.parentElement).toHaveAttribute("data-tree-divider");
  });
});
