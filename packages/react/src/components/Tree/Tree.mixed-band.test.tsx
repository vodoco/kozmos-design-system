import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tree, TreeChildItemRow, TreeItemRow, type TreeItem } from "./Tree";

// GAP-279 (decision 211, owner, 17 Nov): under checkRule="independent", a
// parent some but not all of whose rows are checked is mixed.
// GAP-217 (decision 196): rowFill="band" draws the selected and hover fills
// as full-width bands with no corners.

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
        id: "globex-places",
        name: "Places",
        section: true,
        children: [
          { id: "globex-east", name: "Globex East" },
          { id: "globex-west", name: "Globex West" },
        ],
      },
    ],
  },
  { id: "initech", name: "Initech" },
];

const row = (name: string) =>
  screen.getByRole("treeitem", { name: new RegExp(`^${name}$`) });
const checks = () =>
  Object.fromEntries(
    screen
      .getAllByRole("treeitem")
      .map((item) => [item.textContent, item.getAttribute("aria-checked")]),
  );

describe("Tree mixed parents (GAP-279, decision 211)", () => {
  it("draws a parent with some but not all of its enabled rows checked as mixed, open or closed", () => {
    render(
      <Tree
        data={clients}
        checkable
        checkRule="independent"
        defaultExpandedIds={["acme"]}
        defaultSelectedIds={["acme-hq", "globex-east"]}
      />,
    );
    expect(row("Acme")).toHaveAttribute("aria-checked", "mixed");
    expect(row("Acme").querySelector("[data-tree-check]")).toHaveAttribute(
      "data-tree-check",
      "mixed",
    );
    // Closed, and through a section.
    expect(row("Globex")).toHaveAttribute("aria-checked", "mixed");
    expect(row("Acme HQ")).toHaveAttribute("aria-checked", "true");
    expect(row("Acme Lab")).toHaveAttribute("aria-checked", "false");
    expect(row("Initech")).toHaveAttribute("aria-checked", "false");
  });

  it("checking a mixed parent checks it and all its enabled rows; clearing a checked parent clears them", () => {
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
    expect(checks()).toMatchObject({
      Acme: "true",
      "Acme HQ": "true",
      "Acme Lab": "true",
      // A disabled row never checks.
      "Acme Old": "false",
    });
    fireEvent.click(row("Acme"));
    expect(checks()).toMatchObject({
      Acme: "false",
      "Acme HQ": "false",
      "Acme Lab": "false",
    });
  });

  it("checking a parent that is not mixed checks it alone, and Space does what a click does", () => {
    const changes: string[][] = [];
    render(
      <Tree
        data={clients}
        checkable
        checkRule="independent"
        defaultExpandedIds={["acme"]}
        onSelectedIdsChange={(ids) => changes.push(ids)}
      />,
    );
    fireEvent.click(row("Acme"));
    expect(changes.at(-1)).toEqual(["acme"]);
    // A site cleared under a checked client makes it mixed.
    fireEvent.click(row("Acme HQ"));
    fireEvent.click(row("Acme Lab"));
    fireEvent.click(row("Acme HQ"));
    expect(row("Acme")).toHaveAttribute("aria-checked", "mixed");
    row("Acme").focus();
    fireEvent.keyDown(row("Acme"), { key: " " });
    expect([...(changes.at(-1) ?? [])].sort()).toEqual([
      "acme",
      "acme-hq",
      "acme-lab",
    ]);
  });

  it("gives a row's slots mixed, and never draws mixed under the exclusive rule", () => {
    const seen: Record<string, [boolean, boolean]> = {};
    const { rerender } = render(
      <Tree
        data={clients}
        checkable
        checkRule="independent"
        defaultSelectedIds={["acme", "acme-hq"]}
        renderMeta={({ item, checked, mixed }) => {
          seen[item.id] = [checked, mixed];
          return null;
        }}
      />,
    );
    expect(seen.acme).toEqual([false, true]);
    rerender(
      <Tree
        data={clients}
        checkable
        defaultSelectedIds={["acme-hq"]}
        defaultExpandedIds={["acme"]}
      />,
    );
    expect(
      screen
        .getAllByRole("treeitem")
        .some((item) => item.getAttribute("aria-checked") === "mixed"),
    ).toBe(false);
  });

  it('a composed row takes checked="mixed"', () => {
    render(
      <Tree ariaLabel="Clients">
        <TreeItemRow name="Acme" hasChildren expanded checked="mixed" />
      </Tree>,
    );
    expect(row("Acme")).toHaveAttribute("aria-checked", "mixed");
    expect(row("Acme")).not.toHaveAttribute("data-checked");
  });
});

describe('Tree rowFill="band" (GAP-217, decision 196)', () => {
  const data: TreeItem[] = [
    { id: "a", name: "Building A" },
    { id: "b", name: "Building B" },
  ];

  it("draws the selected and hover fills on a full-width box with no corners, reaching the bleed", () => {
    render(
      <Tree data={data} rowFill="band" bleed={16} defaultSelectedId="a" />,
    );
    const selected = row("Building A");
    const band = selected.parentElement!;
    expect(band).toHaveAttribute("data-tree-band");
    expect(band.className).toContain("bg-hover-fill");
    expect(band.style.marginInline).toBe(
      "calc(var(--kozmos-tree-bleed, 0px) * -1)",
    );
    expect(selected.className).not.toContain("rounded-control");
    expect(selected.className).not.toMatch(/(^|\s)bg-hover-fill/);
    const other = row("Building B").parentElement!;
    expect(other.className).toContain("hover:bg-hover-fill/50");
    expect(row("Building B").className).not.toContain("hover:bg-hover-fill");
    // The ring is drawn inside the band.
    expect(selected.className).toContain("focus-visible:ring-inset");
  });

  it("works with divided: the stroke, and the band over the open row's surface", () => {
    render(
      <Tree
        data={[{ id: "l", name: "Level 1", children: [data[0]] }]}
        rowFill="band"
        divided
        defaultExpandedIds={["l"]}
        defaultSelectedId="l"
      />,
    );
    const box = row("Level 1").parentElement!;
    expect(box).toHaveAttribute("data-tree-divider");
    expect(box).toHaveAttribute("data-tree-band");
    expect(box.className).toContain("border-b");
    expect(box.className).toContain("bg-hover-fill");
    expect(box.className).not.toContain("background-50");
  });

  it("is the inset pill by default, and composed rows take it from the Tree", () => {
    const { unmount } = render(<Tree data={data} defaultSelectedId="a" />);
    expect(row("Building A").className).toContain("rounded-control");
    expect(row("Building A").className).toMatch(/(^|\s)bg-hover-fill/);
    expect(row("Building A").parentElement).not.toHaveAttribute(
      "data-tree-band",
    );
    unmount();
    render(
      <Tree ariaLabel="Buildings" rowFill="band">
        <TreeChildItemRow name="Building A" selected />
      </Tree>,
    );
    expect(row("Building A").parentElement).toHaveAttribute("data-tree-band");
  });
});
