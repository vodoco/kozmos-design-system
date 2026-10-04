import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ArrivalPanel } from "./ArrivalPanel";

const meta = {
  id: "map-arrivalpanel",
  title: "SDK/Navigation/ArrivalPanel",
  component: ArrivalPanel,
  parameters: { layout: "padded" },
  args: {
    destination: "Northfield Bakery",
    locationText: "Level 2 · Terminal 2",
    onDone: fn(),
  },
} satisfies Meta<typeof ArrivalPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Hosted: Story = {};
export const LongAction: Story = {
  tags: ["viewport-phone"],
  args: {
    doneLabel: "Finish navigation and return to the selected destination",
  },
};
export const ActualMetrics: Story = {
  args: { actualDurationText: "6 min", actualDistanceText: "202 m" },
};
export const Standalone: Story = {
  args: { ...ActualMetrics.args, presentation: "standalone" },
};
export const Pending: Story = {
  args: { ...ActualMetrics.args, pending: true },
};
export const ZeroDuration: Story = { args: { actualDurationText: "0 min" } };
export const LongDestination: Story = {
  args: {
    destination:
      "International departures assistance and accessible transport meeting point",
    locationText: "Upper departures level · International Terminal East",
    message: "Your destination is on this level.",
  },
};
export const MissingImage: Story = {
  args: { destinationImage: "/missing-destination-photo.png" },
};
export const Arabic: Story = {
  args: {
    dir: "rtl",
    title: "لقد وصلت",
    destination: "نقطة المساعدة في صالة المغادرة",
    locationText: "الطابق الثاني",
    actualDurationText: "٦ دقائق",
    actualDistanceText: "٢٠٢ م",
    durationLabel: "وقت الرحلة",
    distanceLabel: "المسافة المقطوعة",
    doneLabel: "تم",
  },
};
