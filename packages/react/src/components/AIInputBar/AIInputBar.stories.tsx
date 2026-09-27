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
  // The render holds its own state; the args only satisfy the required props,
  // which `StoryObj<typeof meta>` asks every story to state.
  args: { onSubmit: fn(), onValueChange: fn(), value: "" },
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

/** Offline (Story 3 AC1): the field says so, not only the send button. */
export const Disabled: Story = {
  args: { disabled: true, onSubmit: fn(), onValueChange: fn(), value: "" },
  render: (args) => (
    <div className="w-80 rounded-container border border-border">
      <AIInputBar {...args} />
    </div>
  ),
};
