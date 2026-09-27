import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { AIInputBar } from "./AIInputBar";

const meta = {
  title: "Product SDK/AIInputBar",
  component: AIInputBar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AIInputBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="w-80 rounded-container border border-border">
          <AIInputBar onSubmit={fn()} onValueChange={setValue} value={value} />
        </div>
      );
    };
    return <Demo />;
  },
};

/** Send stays disabled until there is something to ask. */
export const Empty: Story = {
  args: { onSubmit: fn(), onValueChange: fn(), value: "" },
};