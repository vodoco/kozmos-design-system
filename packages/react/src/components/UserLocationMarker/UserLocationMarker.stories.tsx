import type { Meta, StoryObj } from "@storybook/react";
import { UserLocationMarker } from "./UserLocationMarker";
import { useState } from "react";
import { Button } from "../Button/Button";

const meta = {
  id: "components-userlocationmarker",
  title: "SDK/Map controls/UserLocationMarker",
  component: UserLocationMarker,
  parameters: { layout: "centered" },
} satisfies Meta<typeof UserLocationMarker>;
export default meta;
type Story = StoryObj<typeof meta>;

const DynamicCompass = () => {
  const [heading, setHeading] = useState(45);

  return (
    <div style={{ width: 300, maxWidth: "100%" }}>
      <div className="h-[300px] bg-muted/30 border rounded-container flex items-center justify-center relative overflow-hidden">
        {/* Grid background simulation */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(var(--primitives-colors-background-200) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <UserLocationMarker heading={heading} showHeading={true} />
      </div>
      <Button
        variant="outline"
        onClick={() => setHeading((value) => (value + 45) % 360)}
      >
        Rotate simulated heading
      </Button>
      <p role="status">Simulated heading: {heading}°</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <DynamicCompass />,
};

export const StaticNoHeading: Story = {
  args: {
    showHeading: false,
  },
  render: (args) => (
    <div className="w-[100px] h-[100px] flex items-center justify-center">
      <UserLocationMarker {...args} />
    </div>
  ),
};
