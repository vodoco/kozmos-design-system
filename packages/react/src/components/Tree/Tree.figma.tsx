import figma from "@figma/code-connect";
import { Tree, TreeChildItemRow, TreeItemRow, TreeParentItemRow } from "./Tree";

const treeUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=662-5094";

figma.connect(Tree, treeUrl, {
  props: {
    density: figma.enum("Density", {
      Default: "default",
      Compact: "compact",
    }),
    children: figma.slot("Content Slot"),
  },
  example: ({ children, density }) => (
    <Tree ariaLabel="Map content" density={density}>
      {children}
    </Tree>
  ),
});

// The rows a designer puts in Tree's Content Slot (GAP-201, GAP-204): each
// set's row, so Tree's snippet shows the rows as drawn, Divided among them.
// Selected is the State; Hover and Focus are a pointer's and a keyboard's,
// not props. Count shows on the Count content, as the set draws it.
const parentUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=684-6080";
const childUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=687-6789";
const itemUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=723-8776";

figma.connect(TreeParentItemRow, parentUrl, {
  props: {
    name: figma.string("Label Text"),
    count: figma.enum("Content", {
      Basic: undefined,
      Count: figma.string("Count Text"),
      Actions: undefined,
    }),
    depth: figma.enum("Depth", { "0": 0, "1": 1, "2": 2 }),
    density: figma.enum("Density", {
      Default: undefined,
      Compact: "compact",
    }),
    selected: figma.enum("State", {
      Idle: undefined,
      Hover: undefined,
      Selected: true,
      Focus: undefined,
    }),
    divided: figma.boolean("Divided"),
    // GAP-107: Meta Below draws Meta Text on a line under the name.
    meta: figma.boolean("Meta Below", {
      true: figma.string("Meta Text"),
      false: undefined,
    }),
    metaPlacement: figma.boolean("Meta Below", {
      true: "below",
      false: undefined,
    }),
    // GAP-277: Checkable draws the box, and Checked is its check. Mixed
    // (decision 211, GAP-279) is checked="mixed", Checkbox's dash.
    checked: figma.boolean("Checkable", {
      true: figma.boolean<"mixed", boolean>("Mixed", {
        true: "mixed",
        false: figma.boolean("Checked"),
      }),
      false: undefined,
    }),
    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width. Inset, the default, names no fill.
    rowFill: figma.enum("RowFill", { Inset: undefined, Band: "band" }),
    disclosurePosition: figma.boolean("Disclosure End", {
      true: "end",
      false: undefined,
    }),
    expanded: figma.enum("Expanded", { True: true, False: undefined }),
  },
  example: ({
    checked,
    count,
    density,
    depth,
    disclosurePosition,
    divided,
    expanded,
    meta,
    metaPlacement,
    name,
    rowFill,
    selected,
  }) => (
    <TreeParentItemRow
      name={name}
      count={count}
      meta={meta}
      metaPlacement={metaPlacement}
      checked={checked}
      disclosurePosition={disclosurePosition}
      depth={depth}
      density={density}
      expanded={expanded}
      selected={selected}
      divided={divided}
      rowFill={rowFill}
    />
  ),
});

figma.connect(TreeChildItemRow, childUrl, {
  props: {
    name: figma.string("Label Text"),
    count: figma.enum("Content", {
      Basic: undefined,
      Count: figma.string("Count Text"),
      Actions: undefined,
    }),
    depth: figma.enum("Depth", { "0": 0, "1": 1, "2": 2 }),
    density: figma.enum("Density", {
      Default: undefined,
      Compact: "compact",
    }),
    selected: figma.enum("State", {
      Idle: undefined,
      Hover: undefined,
      Selected: true,
      Focus: undefined,
    }),
    divided: figma.boolean("Divided"),
    // GAP-107: Meta Below draws Meta Text on a line under the name.
    meta: figma.boolean("Meta Below", {
      true: figma.string("Meta Text"),
      false: undefined,
    }),
    metaPlacement: figma.boolean("Meta Below", {
      true: "below",
      false: undefined,
    }),
    // GAP-277: Checkable draws the box, and Checked is its check. Mixed
    // (decision 211, GAP-279) is checked="mixed", Checkbox's dash.
    checked: figma.boolean("Checkable", {
      true: figma.boolean<"mixed", boolean>("Mixed", {
        true: "mixed",
        false: figma.boolean("Checked"),
      }),
      false: undefined,
    }),
    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width. Inset, the default, names no fill.
    rowFill: figma.enum("RowFill", { Inset: undefined, Band: "band" }),
    disclosurePosition: figma.boolean("Disclosure End", {
      true: "end",
      false: undefined,
    }),
  },
  example: ({
    checked,
    count,
    density,
    depth,
    disclosurePosition,
    divided,
    meta,
    metaPlacement,
    name,
    rowFill,
    selected,
  }) => (
    <TreeChildItemRow
      name={name}
      count={count}
      meta={meta}
      metaPlacement={metaPlacement}
      checked={checked}
      disclosurePosition={disclosurePosition}
      depth={depth}
      density={density}
      selected={selected}
      divided={divided}
      rowFill={rowFill}
    />
  ),
});

figma.connect(TreeItemRow, itemUrl, {
  props: {
    name: figma.string("Label Text"),
    count: figma.enum("Content", {
      Basic: undefined,
      Count: figma.string("Count Text"),
      Actions: undefined,
    }),
    depth: figma.enum("Depth", { "0": 0, "1": 1, "2": 2 }),
    density: figma.enum("Density", {
      Default: undefined,
      Compact: "compact",
    }),
    selected: figma.enum("State", {
      Idle: undefined,
      Hover: undefined,
      Selected: true,
      Focus: undefined,
    }),
    divided: figma.boolean("Divided"),
    // GAP-107: Meta Below draws Meta Text on a line under the name.
    meta: figma.boolean("Meta Below", {
      true: figma.string("Meta Text"),
      false: undefined,
    }),
    metaPlacement: figma.boolean("Meta Below", {
      true: "below",
      false: undefined,
    }),
    // GAP-277: Checkable draws the box, and Checked is its check. Mixed
    // (decision 211, GAP-279) is checked="mixed", Checkbox's dash.
    checked: figma.boolean("Checkable", {
      true: figma.boolean<"mixed", boolean>("Mixed", {
        true: "mixed",
        false: figma.boolean("Checked"),
      }),
      false: undefined,
    }),
    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width. Inset, the default, names no fill.
    rowFill: figma.enum("RowFill", { Inset: undefined, Band: "band" }),
    disclosurePosition: figma.boolean("Disclosure End", {
      true: "end",
      false: undefined,
    }),
    expanded: figma.enum("Expanded", { True: true, False: undefined }),
    hasChildren: figma.enum("Type", { Parent: true, Child: undefined }),
  },
  example: ({
    checked,
    count,
    density,
    depth,
    disclosurePosition,
    divided,
    expanded,
    hasChildren,
    meta,
    metaPlacement,
    name,
    rowFill,
    selected,
  }) => (
    <TreeItemRow
      name={name}
      count={count}
      meta={meta}
      metaPlacement={metaPlacement}
      checked={checked}
      disclosurePosition={disclosurePosition}
      depth={depth}
      density={density}
      hasChildren={hasChildren}
      expanded={expanded}
      selected={selected}
      divided={divided}
      rowFill={rowFill}
    />
  ),
});
