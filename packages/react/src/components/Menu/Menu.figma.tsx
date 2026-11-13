import figma from "@figma/code-connect";
import { Button } from "../Button/Button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "./Menu";

const menuUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170";

figma.connect(MenuContent, menuUrl, {
  variant: { Content: "Basic" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
    // Decision 152: External shows the new-tab icon on the second item.
    external: figma.boolean("External", { true: true, false: undefined }),
    shortcut: figma.string("Shortcut Text"),
  },
  example: ({ external, item1, item2, item3, label, shortcut }) => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>{label}</MenuLabel>
        <MenuSeparator />
        <MenuItem>
          {item1}
          <MenuShortcut>{shortcut}</MenuShortcut>
        </MenuItem>
        <MenuItem external={external}>{item2}</MenuItem>
        <MenuItem>{item3}</MenuItem>
      </MenuContent>
    </Menu>
  ),
});

figma.connect(MenuContent, menuUrl, {
  variant: { Content: "Checkbox" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
  },
  example: ({ item1, item2, item3, label }) => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Map layers</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>{label}</MenuLabel>
        <MenuSeparator />
        <MenuCheckboxItem checked>{item1}</MenuCheckboxItem>
        <MenuCheckboxItem>{item2}</MenuCheckboxItem>
        <MenuCheckboxItem checked>{item3}</MenuCheckboxItem>
      </MenuContent>
    </Menu>
  ),
});

figma.connect(MenuContent, menuUrl, {
  variant: { Content: "Radio" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
  },
  example: ({ item1, item2, item3, label }) => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Route preference</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>{label}</MenuLabel>
        <MenuSeparator />
        <MenuRadioGroup value="fastest">
          <MenuRadioItem value="fastest">{item1}</MenuRadioItem>
          <MenuRadioItem value="accessible">{item2}</MenuRadioItem>
          <MenuRadioItem value="transfers">{item3}</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  ),
});

figma.connect(MenuContent, menuUrl, {
  variant: { Content: "Submenu" },
  props: {
    label: figma.string("Label Text"),
    item1: figma.string("Item 1 Text"),
    item2: figma.string("Item 2 Text"),
    item3: figma.string("Item 3 Text"),
    // Decision 152: External shows the new-tab icon on the second item.
    external: figma.boolean("External", { true: true, false: undefined }),
  },
  example: ({ external, item1, item2, item3, label }) => (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Workspace</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>{label}</MenuLabel>
        <MenuSeparator />
        <MenuItem>{item1}</MenuItem>
        <MenuItem external={external}>{item2}</MenuItem>
        <MenuSub>
          <MenuSubTrigger>{item3}</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Invite people</MenuItem>
            <MenuItem>Export</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  ),
});
