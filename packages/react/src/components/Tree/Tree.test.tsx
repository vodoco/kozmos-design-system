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

  it("divided draws a stroke under every row and an open parent on a surface (GAP-201)", () => {
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
      <Tree data={data} divided defaultExpandedIds={["a", "b"]} />,
    );
    const row = (name: string, index = 0) =>
      screen.getAllByRole("treeitem", { name: new RegExp(name) })[index];

    for (const item of screen.getAllByRole("treeitem")) {
      expect(item).toHaveClass("border-b", "border-border", "rounded-none");
      expect(item).not.toHaveClass("rounded-control");
    }
    // Open parents on the surface; a leaf and a child do not take it.
    expect(row("Terminal A")).toHaveClass(surface);
    expect(row("Car park")).not.toHaveClass(surface);
    expect(row("Level 1")).not.toHaveClass(surface);

    // Closed, a parent leaves the surface.
    fireEvent.click(row("Terminal B"));
    expect(row("Terminal B")).toHaveAttribute("aria-expanded", "false");
    expect(row("Terminal B")).not.toHaveClass(surface);

    // A selected open parent keeps the selected fill, not the surface.
    rerender(
      <Tree data={data} divided defaultExpandedIds={["a"]} selectedId="a" />,
    );
    expect(row("Terminal A")).toHaveAttribute("aria-expanded", "true");
    expect(row("Terminal A")).toHaveClass("bg-muted");
    expect(row("Terminal A")).not.toHaveClass(surface);

    // Not divided, the tree as it was drawn.
    rerender(<Tree data={data} defaultExpandedIds={["a"]} />);
    expect(row("Terminal A")).toHaveClass("rounded-control");
    expect(row("Terminal A")).not.toHaveClass("border-b", surface);
  });

  it("gives composed rows the divided look too", () => {
    render(
      <Tree>
        <TreeParentItemRow
          role="treeitem"
          aria-expanded
          name="Terminal A"
          expanded
          divided
        />
        <TreeChildItemRow role="treeitem" name="Level 1" depth={1} divided />
      </Tree>,
    );
    const [parent, child] = screen.getAllByRole("treeitem");
    expect(parent).toHaveClass(
      "border-b",
      "bg-[var(--primitives-colors-background-50)]",
    );
    expect(child).toHaveClass("border-b");
    expect(child).not.toHaveClass(
      "bg-[var(--primitives-colors-background-50)]",
    );
  });
});
