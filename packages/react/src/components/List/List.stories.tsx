import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HelpCircle } from "@kozmos-ds/icons";
import { List, ListItem, ListItemStatus } from "./List";
import { Button } from "../Button/Button";
import { Checkbox } from "../Checkbox/Checkbox";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { Tag } from "../Tag/Tag";

const meta: Meta<typeof List> = {
  id: "data-display-list",
  title: "Core/Data display/List",
  component: List,
};

export default meta;
type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: () => (
    <List>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Compact: Story = {
  render: () => (
    <List density="compact">
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

/**
 * The Get started checklist (GAP-195, decision 135): each tour is a ListItem
 * filled in. A status mark at the start, read before the name; the title
 * with its role tag; a description; a meta line; one action at the end.
 */
export const Checklist: Story = {
  render: () => (
    <List className="w-mobile">
      <ListItem
        leading={<ListItemStatus status="done" />}
        title="Explore the map"
        titleAddon={<Tag variant="secondary">Viewer</Tag>}
        description="Pan, zoom and change levels."
        meta="2 min"
        trailing={
          <Button size="sm" variant="outline">
            Replay
          </Button>
        }
      />
      <ListItem
        leading={<ListItemStatus status="inProgress" />}
        title="Add a point of interest"
        titleAddon={<Tag variant="secondary">Editor</Tag>}
        description="Place it, name it and choose its type."
        meta="Step 2 of 4 · 3 min"
        trailing={<Button size="sm">Resume</Button>}
      />
      <ListItem
        leading={<ListItemStatus status="todo" />}
        title="Publish your changes"
        titleAddon={<Tag variant="secondary">Admin</Tag>}
        description="Review what changed and make it live."
        meta="4 min"
        trailing={<Button size="sm">Start</Button>}
      />
    </List>
  ),
};

/**
 * Pointr Cloud's Map Persona Visibility list: a persona's mark (here a
 * stand-in; the mark is GAP-106's), its name, an info button and a checkbox
 * at the end, the row tinted while it is ticked.
 */
export const PersonaVisibility: Story = {
  render: function PersonaVisibilityStory() {
    const [shown, setShown] = React.useState<Record<string, boolean>>({
      Visitor: true,
      Staff: false,
      Contractor: true,
    });
    return (
      <List density="compact" className="w-mobile">
        {Object.keys(shown).map((persona) => (
          <ListItem
            key={persona}
            selected={shown[persona]}
            leading={<Icon name="user" size="sm" color="muted" />}
            title={persona}
            titleAddon={
              <IconButton
                aria-label={`About ${persona}`}
                size="sm"
                variant="ghost"
              >
                <HelpCircle aria-hidden="true" className="h-4 w-4" />
              </IconButton>
            }
            trailing={
              <Checkbox
                aria-label={`Show to ${persona}`}
                checked={shown[persona]}
                onCheckedChange={(checked) =>
                  setShown((current) => ({
                    ...current,
                    [persona]: checked === true,
                  }))
                }
              />
            }
          />
        ))}
      </List>
    );
  },
};
