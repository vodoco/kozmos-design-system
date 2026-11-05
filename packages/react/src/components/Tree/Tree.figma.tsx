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
    children: figma.slot("Content Slot") ?? figma.children(["Content Slot"]),
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
    expanded: figma.enum("Expanded", { True: true, False: undefined }),
  },
  example: ({ count, density, depth, divided, expanded, name, selected }) => (
    <TreeParentItemRow
      name={name}
      count={count}
      depth={depth}
      density={density}
      expanded={expanded}
      selected={selected}
      divided={divided}
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
  },
  example: ({ count, density, depth, divided, name, selected }) => (
    <TreeChildItemRow
      name={name}
      count={count}
      depth={depth}
      density={density}
      selected={selected}
      divided={divided}
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
    expanded: figma.enum("Expanded", { True: true, False: undefined }),
    hasChildren: figma.enum("Type", { Parent: true, Child: undefined }),
  },
  example: ({
    count,
    density,
    depth,
    divided,
    expanded,
    hasChildren,
    name,
    selected,
  }) => (
    <TreeItemRow
      name={name}
      count={count}
      depth={depth}
      density={density}
      hasChildren={hasChildren}
      expanded={expanded}
      selected={selected}
      divided={divided}
    />
  ),
});
