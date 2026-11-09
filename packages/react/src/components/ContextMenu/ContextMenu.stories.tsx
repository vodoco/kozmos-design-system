import { useEffect, useRef } from "react";
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

/**
 * The menu open, as a right click 24 into the area opens it, so the visual
 * review draws the panel, a submenu row and an external item. A context
 * menu has no `defaultOpen`: the story asks for it as a right click does.
 */
export const Open: Story = {
  render: function OpenStory() {
    const area = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const box = area.current!.getBoundingClientRect();
      area.current!.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: box.left + 24,
          clientY: box.top + 24,
        }),
      );
    }, []);
    return (
      <div style={{ height: 280 }}>
        <ContextMenu modal={false}>
          <ContextMenuTrigger asChild>
            <div
              ref={area}
              tabIndex={0}
              aria-label="Gate A12, map feature"
              className="flex h-40 w-72 items-center justify-center rounded-control border border-dashed border-border"
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
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>Move to level</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Level 1</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem external asChild>
              <a href="https://docs.pointr.tech">Documentation</a>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  },
};
