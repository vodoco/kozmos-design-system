import figma from "@figma/code-connect";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./ContextMenu";

const contextMenuUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998";

// GAP-155: the set's panel and properties are Menu's; what differs is the
// trigger, an area a right click, a long press or the context-menu key opens
// the menu on. External draws the new-tab icon on Item 2, which only Basic
// and Submenu paint; off, the prop is left out.

figma.connect(ContextMenuContent, contextMenuUrl, {
  variant: { Content: "Basic" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
    shortcut: figma.string("Shortcut Text"),
    external: figma.boolean("External", {
      true: true,
      false: undefined,
    }),
  },
  example: ({ external, item1, item2, item3, label, shortcut }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0}>Map feature</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{label}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>
          {item1}
          <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem external={external}>{item2}</ContextMenuItem>
        <ContextMenuItem>{item3}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
});

figma.connect(ContextMenuContent, contextMenuUrl, {
  variant: { Content: "Checkbox" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
  },
  example: ({ item1, item2, item3, label }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0}>Map</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{label}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>{item1}</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>{item2}</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked>{item3}</ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
});

figma.connect(ContextMenuContent, contextMenuUrl, {
  variant: { Content: "Radio" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
  },
  example: ({ item1, item2, item3, label }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0}>Route</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{label}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="fastest">
          <ContextMenuRadioItem value="fastest">{item1}</ContextMenuRadioItem>
          <ContextMenuRadioItem value="accessible">
            {item2}
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="transfers">{item3}</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
});

figma.connect(ContextMenuContent, contextMenuUrl, {
  variant: { Content: "Submenu" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
    external: figma.boolean("External", {
      true: true,
      false: undefined,
    }),
  },
  example: ({ external, item1, item2, item3, label }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0}>Map feature</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{label}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>{item1}</ContextMenuItem>
        <ContextMenuItem external={external}>{item2}</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>{item3}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Level 1</ContextMenuItem>
            <ContextMenuItem>Level 2</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
});
