import type { Meta, StoryObj } from "@storybook/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./ContextMenu";
import { Text } from "../Text/Text";

const meta: Meta<typeof ContextMenu> = {
  id: "navigation-contextmenu",
  title: "Core/Layout/ContextMenu",
  component: ContextMenu,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

/**
 * Right click the area, long press it on touch, or focus it and press the
 * context-menu key or Shift+F10.
 */
export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          tabIndex={0}
          aria-label="Gate A12, map feature"
          className="flex h-40 w-72 items-center justify-center rounded-control border border-dashed border-border focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Text size="sm" color="muted">
            Right click, or long press, here
          </Text>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Feature actions</ContextMenuLabel>
        <ContextMenuItem>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to level</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Level 1</ContextMenuItem>
            <ContextMenuItem>Level 2</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem external asChild>
          <a href="https://docs.pointr.tech">Documentation</a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
