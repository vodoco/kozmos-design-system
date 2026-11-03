import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button/Button";
import { Navbar } from "../Navbar/Navbar";
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

// GAP-198: a panel floating in the region under a fixed header, which it
// leaves usable (decision 139). Opened from the start here, by the page, so
// it takes no focus on the docs page.
export const Inline: Story = {
  render: ({ side }) => (
    <div className="flex h-[480px] flex-col overflow-hidden border">
      <Navbar
        logo={<div className="font-bold text-xl">Kozmos</div>}
        actions={<Button variant="outline">Help</Button>}
      />
      <div className="relative min-h-0 flex-1 p-4 bg-muted/20">
        <Drawer placement="inline" defaultOpen>
          <DrawerTrigger asChild>
            <Button variant="outline">Get started</Button>
          </DrawerTrigger>
          <DrawerContent side={side}>
            <DrawerHeader>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>
                Tours for this page. The header above stays usable.
              </DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  ),
};
