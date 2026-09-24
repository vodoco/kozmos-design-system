import { useState } from "react";
import {
  Button,
  Icon,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
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
} from "@kozmos/react";
import type { DemoModule } from "../types";

function Actions() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">
          Actions
          <Icon name="chevron-down" size="sm" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Bookshop</MenuLabel>
        <MenuGroup>
          <MenuItem>
            <Icon name="navigation-pointer-01" size="sm" />
            Directions
            <MenuShortcut>⌘D</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <Icon name="heart" size="sm" />
            Favourite
          </MenuItem>
          <MenuItem>
            <Icon name="share-01" size="sm" />
            Share
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>Report a problem</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Wrong location</MenuItem>
            <MenuItem>Closed permanently</MenuItem>
            <MenuItem>Something else</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}

function Choices() {
  const [openOnly, setOpenOnly] = useState(true);
  const [sort, setSort] = useState("distance");
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">
          View
          <Icon name="chevron-down" size="sm" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem
          checked={openOnly}
          onCheckedChange={(checked) => setOpenOnly(checked === true)}
        >
          Open places only
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuLabel>Sort by</MenuLabel>
        <MenuRadioGroup value={sort} onValueChange={setSort}>
          <MenuRadioItem value="distance">Distance</MenuRadioItem>
          <MenuRadioItem value="name">Name</MenuRadioItem>
          <MenuRadioItem value="floor">Floor</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Actions, with a submenu",
    description:
      "A dropdown on a trigger: items with icons and shortcuts, a label, a separator, a submenu.",
    Component: Actions,
  },
  {
    title: "Checkbox and radio items",
    description: "Choices that stay in the menu.",
    Component: Choices,
  },
];
