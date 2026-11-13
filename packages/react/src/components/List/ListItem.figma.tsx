import figma from "@figma/code-connect";
import { ListItem, ListItemStatus } from "./List";
import { Button } from "../Button";
import { Tag } from "../Tag";

// GAP-195, decision 135: the ListItem set is a new Figma set. Its node id is
// a placeholder until the plugin's Build gives it one; this file stays out of
// figma.linked.config.json until then.
const listItemUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

figma.connect(ListItem, listItemUrl, {
  props: {
    selected: figma.enum("Selected", { False: false, True: true }),
    title: figma.string("Title Text"),
    leading: figma.boolean("Show Leading", {
      true: <ListItemStatus status="done" />,
      false: undefined,
    }),
    titleAddon: figma.boolean("Show Title Addon", {
      true: figma.string("Addon Text"),
      false: undefined,
    }),
    description: figma.boolean("Show Description", {
      true: figma.string("Description Text"),
      false: undefined,
    }),
    meta: figma.boolean("Show Meta", {
      true: figma.string("Meta Text"),
      false: undefined,
    }),
    action: figma.boolean("Show Trailing", {
      true: figma.string("Action Text"),
      false: undefined,
    }),
  },
  example: (props) => (
    <ListItem
      selected={props.selected}
      leading={props.leading}
      title={props.title}
      titleAddon={<Tag variant="secondary">{props.titleAddon}</Tag>}
      description={props.description}
      meta={props.meta}
      trailing={
        <Button size="sm" variant="outline">
          {props.action}
        </Button>
      }
    />
  ),
});
