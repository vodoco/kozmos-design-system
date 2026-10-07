import type { Meta, StoryObj } from "@storybook/react";
import { MapAttribution } from "./MapAttribution";

const meta = {
  id: "product-sdk-mapattribution",
  title: "SDK/Map controls/MapAttribution",
  component: MapAttribution,
  parameters: { layout: "centered" },
  args: {
    credits: [
      { id: "indoor", label: "© Example indoor data" },
      {
        id: "outdoor",
        label: "Outdoor contributors",
        href: "https://example.com/credits",
      },
    ],
  },
} satisfies Meta<typeof MapAttribution>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Surface: Story = { args: { appearance: "surface" } };
export const OverMap: Story = {
  render: (args) => (
    <div
      style={{
        padding: 24,
        backgroundImage:
          "repeating-linear-gradient(35deg, var(--primitives-colors-background-300) 0 30px, var(--primitives-colors-background-700) 30px 36px, var(--primitives-colors-background-100) 36px 70px)",
      }}
    >
      <MapAttribution {...args} />
    </div>
  ),
};
// Text-only sample brand content, not a substitute Pointr logo. Products pass their approved asset.
export const Branded: Story = { args: { brand: <span>Example venue</span> } };
export const WhiteLabel: Story = {
  args: { brand: <span>Example venue</span>, showBrand: false },
};
export const Narrow: Story = {
  render: (args) => <MapAttribution {...args} style={{ width: 240 }} />,
};
export const LongCredit: Story = {
  args: {
    credits: [
      {
        id: "long",
        label:
          "Indoor and outdoor map data supplied by the venue and its contributing mapping partners",
        href: "https://example.com",
      },
    ],
  },
  render: (args) => <MapAttribution {...args} style={{ width: 240 }} />,
};
export const RightToLeft: Story = {
  args: {
    label: "إسناد الخريطة",
    credits: [
      { id: "indoor", label: "بيانات الخرائط الداخلية" },
      { id: "outdoor", label: "مساهمو الخرائط", href: "https://example.com" },
    ],
  },
  render: (args) => (
    <MapAttribution {...args} dir="rtl" style={{ width: 240 }} />
  ),
};
