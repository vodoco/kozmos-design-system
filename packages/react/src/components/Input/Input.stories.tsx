import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta = {
  id: "components-input",
  title: "Core/Inputs/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },

  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "tel", "url"],
    },
    status: {
      control: "select",
      options: ["default", "error", "warning", "success"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5 align-middle">
      <Input
        type="email"
        id="email"
        label="Email"
        placeholder="Email"
        {...args}
      />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5 align-middle">
      <Input
        type="email"
        id="email-helper"
        label="Email"
        placeholder="Email"
        helperText="Use your work email address."
        {...args}
      />
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5 align-middle">
      <Input
        type="email"
        id="email-error"
        label="Email"
        placeholder="Email"
        error="Invalid email address."
        {...args}
      />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-4 align-middle">
      <Input
        label="Default"
        placeholder="Placeholder"
        helperText="Helper text"
      />
      <Input
        label="Warning"
        placeholder="Placeholder"
        status="warning"
        helperText="Check this value."
      />
      <Input
        label="Success"
        placeholder="Placeholder"
        status="success"
        helperText="Looks good."
      />
      <Input
        label="Readonly"
        placeholder="Placeholder"
        readOnly
        helperText="This value cannot be edited."
      />
    </div>
  ),
};
