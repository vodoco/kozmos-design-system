import figma from "@figma/code-connect";
import { DescriptionList, DescriptionListItem } from "./DescriptionList";

// GAP-221, decision 199: the DescriptionList set. Its node id is a
// placeholder until the set is built in the live file, so this file stays
// out of figma.linked.config.json. Layout is how the items go: Stack, one
// under another; Row, side by side.
figma.connect(
  DescriptionList,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD",
  {
    props: {
      layout: figma.enum("Layout", {
        Stack: "stack",
        Row: "row",
      }),
    },
    example: ({ layout }) => (
      <DescriptionList layout={layout} aria-label="Unit">
        <DescriptionListItem label="Name" value="Gate A12" />
        <DescriptionListItem label="Featured" value={true} />
      </DescriptionList>
    ),
  },
);
