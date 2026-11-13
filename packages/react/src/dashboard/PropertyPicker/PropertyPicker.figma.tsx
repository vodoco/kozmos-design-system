import figma from "@figma/code-connect";
import { PropertyPicker } from "./PropertyPicker";

/**
 * Figma Code Connect: PropertyPicker, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD
 */
figma.connect(
  PropertyPicker,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD",
  {
    props: {
      label: figma.string("Label"),
      defaultOpen: figma.enum("State", {
        Closed: false,
        Open: true,
        Suggested: true,
        Empty: true,
      }),
    },
    example: (props) => (
      <PropertyPicker
        label={props.label}
        defaultOpen={props.defaultOpen}
        properties={[]}
        onSelect={() => {}}
        onCustomField={() => {}}
      />
    ),
  },
);
