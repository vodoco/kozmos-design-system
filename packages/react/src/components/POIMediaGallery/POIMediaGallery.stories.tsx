import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { POIMediaGallery } from "./POIMediaGallery";

const image = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="${color}"/><text x="320" y="240" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="28" fill="#17191c">${label}</text></svg>`,
  )}`;

const meta = {
  id: "product-sdk-poimediagallery",
  title: "SDK/Place details/POIMediaGallery",
  component: POIMediaGallery,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    className: "w-full max-w-[26rem]",
    label: "Place photos",
    media: [
      {
        id: "entrance",
        src: image("Entrance", "#dff3ef"),
        alt: "Main entrance",
      },
      {
        id: "counter",
        src: image("Counter", "#f4e6ff"),
        alt: "Service counter",
      },
    ],
    onActiveIndexChange: fn(),
    positionLabel: (current, total) => `Image ${current} of ${total}`,
  },
} satisfies Meta<typeof POIMediaGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
