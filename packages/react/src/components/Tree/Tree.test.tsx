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

  // GAP-204: composed rows were plain divs, so a tree built from them had no
  // items.
  it("makes each composed row a treeitem with its level and state", () => {
    render(
      <Tree ariaLabel="Map content">
        <TreeParentItemRow name="Outdoor map content" expanded />
        <div role="group">
          <TreeParentItemRow name="Terminal C" depth={1} />
          <TreeChildItemRow name="Burger King" depth={1} selected />
        </div>
        <TreeChildItemRow name="Archived content" disabled />
      </Tree>,
    );

    const rows = screen.getAllByRole("treeitem");
    expect(rows).toHaveLength(4);
    const [outdoor, terminal, burger, archived] = rows;

    expect(outdoor).toHaveAccessibleName(/outdoor map content/i);
    expect(outdoor).toHaveAttribute("aria-level", "1");
    expect(outdoor).toHaveAttribute("aria-expanded", "true");
    expect(outdoor).toHaveAttribute("aria-selected", "false");
    expect(outdoor).not.toHaveAttribute("aria-disabled");

    expect(terminal).toHaveAttribute("aria-level", "2");
    expect(terminal).toHaveAttribute("aria-expanded", "false");

    expect(burger).toHaveAttribute("aria-level", "2");
    expect(burger).toHaveAttribute("aria-selected", "true");
    expect(burger).not.toHaveAttribute("aria-expanded");

    expect(archived).toHaveAttribute("aria-level", "1");
    expect(archived).toHaveAttribute("aria-disabled", "true");
    expect(archived).not.toHaveAttribute("aria-expanded");
  });

  it("lets a caller's own role and aria props win on a composed row", () => {
    render(
      <Tree ariaLabel="Map content">
        <TreeParentItemRow
          name="Overridden"
          aria-level={4}
          aria-selected="true"
          aria-expanded="true"
        />
        <div role="treeitem" aria-level={1} aria-selected="false">
          <TreeChildItemRow
            name="Inside the caller's own treeitem"
            role="none"
            selected
            disabled
          />
        </div>
      </Tree>,
    );

    const overridden = screen.getByRole("treeitem", { name: /overridden/i });
    expect(overridden).toHaveAttribute("aria-level", "4");
    expect(overridden).toHaveAttribute("aria-selected", "true");
    expect(overridden).toHaveAttribute("aria-expanded", "true");

    // With another role, the row adds no tree state to it.
    const inner = screen
      .getByText("Inside the caller's own treeitem")
      .closest("[data-depth]");
    expect(inner).toHaveAttribute("role", "none");
    for (const attribute of [
      "aria-level",
      "aria-expanded",
      "aria-selected",
      "aria-disabled",
    ])
      expect(inner).not.toHaveAttribute(attribute);
    expect(screen.getAllByRole("treeitem")).toHaveLength(2);
  });

  it("gives each row of the data-driven Tree one treeitem role and its level", () => {
    const data: TreeItem[] = [
      {
        id: "root",
        name: "Root",
        children: [
          {
            id: "branch",
            name: "Branch",
            children: [{ id: "leaf", name: "Leaf", disabled: true }],
          },
        ],
      },
    ];
    const { container } = render(
      <Tree
        data={data}
        defaultExpandedIds={["root", "branch"]}
        defaultSelectedId="branch"
      />,
    );

    const rows = Array.from(container.querySelectorAll("[data-depth]"));
    const items = screen.getAllByRole("treeitem");
    expect(items).toEqual(rows);
    expect(
      container.querySelectorAll('[role="treeitem"] [role="treeitem"]'),
    ).toHaveLength(0);
    expect(items.map((item) => item.getAttribute("aria-level"))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(items.map((item) => item.getAttribute("aria-expanded"))).toEqual([
      "true",
      "true",
      null,
    ]);
    expect(items.map((item) => item.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(items.map((item) => item.getAttribute("aria-disabled"))).toEqual([
      null,
      null,
      "true",
    ]);
    expect(container.querySelectorAll('[role="group"]')).toHaveLength(2);
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
});
