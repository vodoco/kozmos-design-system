import type { Meta, StoryObj } from "@storybook/react";
import { MapBrowseFlow } from "./MapBrowseFlow";
const meta = {
  id: "examples-map-browse-flow",
  title: "Examples/Map browsing/Browse and select",
  component: MapBrowseFlow,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MapBrowseFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Information: Story = { args: { infoOpen: true } };
export const PhoneInformation: Story = {
  tags: ["viewport-phone"],
  args: { width: 390, height: 720, infoOpen: true },
};
export const InformationRightToLeft: Story = {
  args: { infoOpen: true, dir: "rtl" },
};
export const Phone: Story = { args: { width: 390, height: 720 } };
export const SelectedPlace: Story = { args: { selected: true } };
export const PhoneSelectedPlace: Story = {
  args: { width: 390, height: 720, selected: true },
};
export const RightToLeft: Story = {
  args: { width: 390, height: 720, dir: "rtl" },
};
