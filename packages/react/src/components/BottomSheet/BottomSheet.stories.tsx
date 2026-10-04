import type { Meta, StoryObj } from "@storybook/react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "./BottomSheet";
import { Button } from "../Button";

const meta: Meta<typeof BottomSheet> = {
  id: "overlay-bottomsheet",
  title: "Core/Overlays/BottomSheet",
  component: BottomSheet,
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

export const Default: Story = {
  render: () => (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Edit profile</BottomSheetTitle>
          <BottomSheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <div className="p-4 pb-0">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-medium">
              Profile Details Goal Here
            </span>
          </div>
        </div>
        <div className="p-4">
          <Button className="w-full">Save Changes</Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  ),
};
