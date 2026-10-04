import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RoutePreviewPanel } from "./RoutePreviewPanel";

const meta = {
  id: "product-sdk-routepreviewpanel",
  title: "SDK/Navigation/RoutePreviewPanel",
  component: RoutePreviewPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    backLabel: "Back",
    className: "h-[23rem] w-full max-w-[25rem]",
    continueLabel: "Continue",
    destinationName: "Burger King",
    onBack: fn(),
    onContinue: fn(),
    onOptionSelect: fn(),
    optionsCountLabel: "2 route options",
    options: [
      {
        id: "quickest",
        label: "Quickest",
        durationSeconds: 240,
        durationLabel: "4 min",
        distanceMetres: 150,
        distanceLabel: "150 m",
        preference: "quickest",
        selected: true,
        available: true,
      },
      {
        id: "step-free",
        label: "Step-free",
        durationSeconds: 360,
        durationLabel: "6 min",
        distanceMetres: 173,
        distanceLabel: "173 m",
        preference: "step-free",
        selected: false,
        available: true,
      },
    ],
    selectedRouteAnnouncement: "Quickest route selected, 4 minutes.",
    status: "ready",
  },
} satisfies Meta<typeof RoutePreviewPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: { alert: "Busy area near the food court." },
};

export const Calculating: Story = {
  args: {
    options: [],
    status: "calculating",
    statusContent: "Calculating routes…",
  },
};
