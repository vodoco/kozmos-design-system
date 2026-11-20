import figma from "@figma/code-connect";
import { Copy01 } from "@kozmos-ds/icons";
import { IconButton } from "../IconButton/IconButton";
import { DescriptionList, DescriptionListItem } from "./DescriptionList";

/**
 * Figma Code Connect: DescriptionList (GAP-221, decision 199)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68523
 *
 * Layout is layout. Each Label N Text and Value N Text is an item's label
 * and value; Action is the third item's copy IconButton, its `action`.
 */
figma.connect(
  DescriptionList,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68523",
  {
    props: {
      layout: figma.enum("Layout", {
        Stack: "stack",
        Row: "row",
      }),
      label1: figma.string("Label 1 Text"),
      value1: figma.string("Value 1 Text"),
      label2: figma.string("Label 2 Text"),
      value2: figma.string("Value 2 Text"),
      label3: figma.string("Label 3 Text"),
      value3: figma.string("Value 3 Text"),
      action: figma.boolean("Action", {
        true: (
          <IconButton aria-label="Copy" size="sm" variant="ghost">
            <Copy01 aria-hidden="true" />
          </IconButton>
        ),
        false: undefined,
      }),
    },
    example: ({
      action,
      label1,
      label2,
      label3,
      layout,
      value1,
      value2,
      value3,
    }) => (
      <DescriptionList layout={layout}>
        <DescriptionListItem label={label1} value={value1} />
        <DescriptionListItem label={label2} value={value2} />
        <DescriptionListItem action={action} label={label3} value={value3} />
      </DescriptionList>
    ),
  },
);
