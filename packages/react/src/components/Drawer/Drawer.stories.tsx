import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerSide,
} from "./Drawer";

const sides: DrawerSide[] = ["right", "left", "top", "bottom"];

const meta: Meta<typeof DrawerContent> = {
  id: "overlay-drawer",
  title: "Core/Overlays/Drawer",
  component: DrawerContent,
  argTypes: {
    side: {
      control: "select",
      options: sides,
    },
  },
  args: {
    side: "right",
  },
};

export default meta;
type Story = StoryObj<typeof DrawerContent>;

export const Default: Story = {
  render: ({ side }) => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent side={side}>
        <DrawerHeader>
          <DrawerTitle>Manage venue layers</DrawerTitle>
          <DrawerDescription>
            Review visibility, routing, and publishing settings for this map.
          </DrawerDescription>
        </DrawerHeader>
        <div className="rounded-control border border-border bg-muted/40 p-4 text-sm">
          Drawer body content stays generic in Core. Product-specific content
          belongs in composed dashboard, SDK, or CMS components.
        </div>
        <DrawerFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
