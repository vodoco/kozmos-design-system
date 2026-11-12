import figma from "@figma/code-connect";
import { TreeSectionRow } from "./Tree";

// GAP-151: a section's heading, the TreeSection set (built 12 Nov).
const sectionUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2416-21301";

figma.connect(TreeSectionRow, sectionUrl, {
  props: {
    name: figma.string("Label Text"),
    count: figma.boolean("Show Count", {
      true: figma.string("Count Text"),
      false: undefined,
    }),
    depth: figma.enum("Depth", { "0": 0, "1": 1, "2": 2 }),
    density: figma.enum("Density", {
      Default: undefined,
      Compact: "compact",
    }),
  },
  example: ({ count, density, depth, name }) => (
    <TreeSectionRow name={name} count={count} depth={depth} density={density} />
  ),
});
