import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Tree,
  TreeChildItemRow,
  TreeItemRow,
  TreeParentItemRow,
  type TreeItem,
} from "./Tree";

// GAP-277 (MAP-32 row 4): Add New Access picks several clients, or some of a
// client's sites, with a checkbox on each row; checking a client clears its
// sites and checking a site clears its client; the chevron at the row's end.

const clients: TreeItem[] = [
  {
    id: "acme",
    name: "Acme",
    children: [
      { id: "acme-hq", name: "Acme HQ" },
      { id: "acme-lab", name: "Acme Lab" },
      { id: "acme-old", name: "Acme Old", disabled: true },
    ],
  },
  {
    id: "globex",
    name: "Globex",
    children: [
      {
        id: "globex-poi",
        name: "Places",
        section: true,
        children: [{ id: "globex-east", name: "Globex East" }],
      },
    ],
  },
  { id: "initech", name: "Initech" },
];

const row = (name: string) =>
  screen.getByRole("treeitem", { name: new RegExp(`^${name}$`) });
const checkedNames = () =>
  screen
    .getAllByRole("treeitem")
    .filter((item) => item.getAttribute("aria-checked") === "true")
    .map((item) => item.textContent);

describe("Tree checkable (GAP-277)", () => {
  it("is aria-multiselectable, every row is aria-checked and none aria-selected, and each draws a box", () => {
    render(
      <Tree
        data={clients}
        checkable
        defaultExpandedIds={["acme"]}
        defaultSelectedIds={["acme-hq"]}
      />,
    );
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    for (const item of screen.getAllByRole("treeitem")) {
      expect(item).toHaveAttribute("aria-checked");
      expect(item).not.toHaveAttribute("aria-selected");
    }
    expect(row("Acme HQ")).toHaveAttribute("aria-checked", "true");
    expect(row("Acme")).toHaveAttribute("aria-checked", "false");
    const box = row("Acme HQ").querySelector("[data-tree-check]");
    expect(box).toHaveAttribute("data-tree-check", "checked");
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(row("Acme").querySelector("[data-tree-check]")).toHaveAttribute(
      "data-tree-check",
      "unchecked",
    );
  });

  it("a click checks or clears a row, and opens nothing; the disclosure opens it", () => {
    const onSelectedIdsChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Tree
        data={clients}
        checkable
        onSelectedIdsChange={onSelectedIdsChange}
        onSelectionChange={onSelectionChange}
      />,
    );
    fireEvent.click(row("Acme"));
    expect(checkedNames()).toEqual(["Acme"]);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["acme"]);
    expect(row("Acme")).toHaveAttribute("aria-expanded", "false");
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(row("Initech"));
    expect(checkedNames()).toEqual(["Acme", "Initech"]);
    fireEvent.click(row("Acme"));
    expect(checkedNames()).toEqual(["Initech"]);
    fireEvent.click(row("Acme").querySelector("[data-tree-disclosure]")!);
    expect(row("Acme")).toHaveAttribute("aria-expanded", "true");
    expect(checkedNames()).toEqual(["Initech"]);
  });

  it("checking a client clears its sites, and checking a site clears its client (exclusive)", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <Tree
        data={clients}
        checkable
        defaultExpandedIds={["acme", "globex"]}
        defaultSelectedIds={["acme-hq", "acme-lab", "globex-east"]}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    fireEvent.click(row("Acme"));
    expect(checkedNames()).toEqual(["Acme", "Globex East"]);
    fireEvent.click(row("Acme Lab"));
    expect(checkedNames()).toEqual(["Acme Lab", "Globex East"]);
    // Past a section: Globex East's parent row is Globex.
    fireEvent.click(row("Globex"));
    expect(checkedNames()).toEqual(["Acme Lab", "Globex"]);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([
      "acme-lab",
      "globex",
    ]);
  });

  it("clears a closed client's checked sites too, and keeps them checked through a collapse", () => {
    render(
      <Tree
        data={clients}
        checkable
        defaultExpandedIds={["acme"]}
        defaultSelectedIds={["acme-hq"]}
      />,
    );
    // Closing Acme hides its checked site and leaves its check alone.
    fireEvent.keyDown(row("Acme"), { key: "ArrowLeft" });
    expect(screen.queryByRole("treeitem", { name: "Acme HQ" })).toBeNull();
    fireEvent.keyDown(row("Acme"), { key: "ArrowRight" });
    expect(row("Acme HQ")).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(row("Acme"), { key: "ArrowLeft" });
    fireEvent.click(row("Acme"));
    fireEvent.keyDown(row("Acme"), { key: "ArrowRight" });
    expect(checkedNames()).toEqual(["Acme"]);
  });

  it('checkRule="independent" leaves every other row as it is', () => {
    render(
      <Tree
        data={clients}
        checkable
        checkRule="independent"
        defaultExpandedIds={["acme"]}
        defaultSelectedIds={["acme-hq"]}
      />,
    );
    fireEvent.click(row("Acme"));
    expect(checkedNames()).toEqual(["Acme", "Acme HQ"]);
  });

  it("Space and Enter check or clear the focused row; arrows move; a disabled row never checks", () => {
    render(<Tree data={clients} checkable defaultExpandedIds={["acme"]} />);
    const acme = row("Acme");
    acme.focus();
    fireEvent.keyDown(acme, { key: " " });
    expect(checkedNames()).toEqual(["Acme"]);
    fireEvent.keyDown(acme, { key: "ArrowDown" });
    expect(row("Acme HQ")).toHaveFocus();
    fireEvent.keyDown(row("Acme HQ"), { key: "Enter" });
    expect(checkedNames()).toEqual(["Acme HQ"]);
    fireEvent.keyDown(row("Acme HQ"), { key: " " });
    expect(checkedNames()).toEqual([]);
    fireEvent.click(row("Acme Old"));
    expect(checkedNames()).toEqual([]);
  });

  it("is controlled by selectedIds, a multiple tree's set", () => {
    const Controlled = () => {
      const [ids, setIds] = React.useState<string[]>(["initech"]);
      return (
        <>
          <Tree
            data={clients}
            checkable
            selectedIds={ids}
            onSelectedIdsChange={setIds}
          />
          <output>{ids.join(",")}</output>
        </>
      );
    };
    render(<Controlled />);
    expect(checkedNames()).toEqual(["Initech"]);
    fireEvent.click(row("Globex"));
    expect(screen.getByText("initech,globex")).toBeInTheDocument();
    expect(checkedNames()).toEqual(["Globex", "Initech"]);
  });

  it("takes no Shift range and no Ctrl+A, which would break the rule", () => {
    render(<Tree data={clients} checkable defaultExpandedIds={["acme"]} />);
    fireEvent.click(row("Acme"));
    fireEvent.click(row("Acme Lab"), { shiftKey: true });
    expect(checkedNames()).toEqual(["Acme Lab"]);
    fireEvent.keyDown(row("Acme Lab"), { key: "ArrowDown", shiftKey: true });
    expect(checkedNames()).toEqual(["Acme Lab"]);
    fireEvent.keyDown(row("Acme Lab"), { key: "a", ctrlKey: true });
    expect(checkedNames()).toEqual(["Acme Lab"]);
  });

  it("the first checked row is the tab stop", () => {
    render(<Tree data={clients} checkable defaultSelectedIds={["initech"]} />);
    expect(row("Initech")).toHaveAttribute("tabindex", "0");
    expect(row("Acme")).toHaveAttribute("tabindex", "-1");
  });

  it("gives a row's slots its check", () => {
    const meta = vi.fn(({ checked }: { checked: boolean }) =>
      checked ? "on" : "off",
    );
    render(
      <Tree
        data={[{ id: "a", name: "Alpha" }]}
        checkable
        defaultSelectedIds={["a"]}
        renderMeta={meta}
      />,
    );
    expect(meta).toHaveBeenLastCalledWith(
      expect.objectContaining({ checked: true }),
    );
  });
});

describe("Tree disclosurePosition (GAP-277)", () => {
  // A row by its id: its actions are in its name.
  const byId = (id: string) =>
    document.querySelector<HTMLElement>(`[data-tree-id="${id}"]`)!;
  const disclosureIndex = (id: string) => {
    const children = Array.from(byId(id).children);
    return children.findIndex((child) =>
      child.hasAttribute("data-tree-disclosure"),
    );
  };

  it("puts the disclosure first by default, and last at the end", () => {
    const { rerender } = render(
      <Tree
        data={clients}
        renderActions={() => <button type="button">Edit</button>}
      />,
    );
    expect(disclosureIndex("acme")).toBe(0);
    rerender(
      <Tree
        data={clients}
        disclosurePosition="end"
        renderActions={() => <button type="button">Edit</button>}
      />,
    );
    const children = Array.from(byId("acme").children);
    expect(disclosureIndex("acme")).toBe(children.length - 1);
    expect(children.at(-1)).toHaveAttribute("data-tree-disclosure", "end");
    fireEvent.click(children.at(-1)!);
    expect(byId("acme")).toHaveAttribute("aria-expanded", "true");
  });

  it("composed rows take it from the Tree, or their own", () => {
    render(
      <Tree disclosurePosition="end">
        <TreeParentItemRow name="Acme" />
        <TreeChildItemRow name="Initech" disclosurePosition="start" />
      </Tree>,
    );
    const acme = Array.from(row("Acme").children);
    expect(acme.at(-1)).toHaveAttribute("data-tree-disclosure", "end");
    expect(row("Initech").children[0]).toHaveAttribute(
      "data-tree-disclosure",
      "start",
    );
  });

  it("a composed row's checked is its aria-checked, with no aria-selected", () => {
    render(
      <Tree>
        <TreeItemRow name="Acme" checked />
        <TreeItemRow name="Initech" checked={false} selected />
        <TreeItemRow name="Globex" selected />
      </Tree>,
    );
    expect(row("Acme")).toHaveAttribute("aria-checked", "true");
    expect(row("Acme")).not.toHaveAttribute("aria-selected");
    expect(row("Initech")).toHaveAttribute("aria-checked", "false");
    expect(row("Initech")).not.toHaveAttribute("aria-selected");
    expect(row("Globex")).toHaveAttribute("aria-selected", "true");
    expect(row("Globex")).not.toHaveAttribute("aria-checked");
  });
});
