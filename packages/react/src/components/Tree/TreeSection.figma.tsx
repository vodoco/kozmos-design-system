import figma from "@figma/code-connect";
import { TreeSectionRow } from "./Tree";

// GAP-151: a section's heading. The TreeSection set is new: its node id is
// TBD until the plugin builds it, so this file stays out of
// figma.linked.config.json until then, and is never published or verified.
const sectionUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

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
