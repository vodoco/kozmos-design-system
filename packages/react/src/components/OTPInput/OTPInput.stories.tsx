import type { Meta, StoryObj } from "@storybook/react";
import { OTPInput } from "./OTPInput";

const meta = {
  id: "components-otpinput",
  title: "Core/Inputs/OTPInput",
  component: OTPInput,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    length: {
      control: "select",
      options: [4, 6],
    },
    status: {
      control: "select",
      options: ["default", "error", "warning", "success"],
    },
  },
} satisfies Meta<typeof OTPInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    helperText: "Enter the code we sent.",
    label: "Verification code",
    length: 6,
    value: "135826",
  },
  render: (args) => (
    <div className="w-80">
      <OTPInput {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    error: "Invalid security code.",
    label: "Verification code",
    length: 6,
    value: "135826",
  },
  render: (args) => (
    <div className="w-80">
      <OTPInput {...args} />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <OTPInput
        helperText="Use the latest code."
        label="Default"
        length={6}
        value="135826"
      />
      <OTPInput
        helperText="This code expires soon."
        label="Warning"
        length={6}
        status="warning"
        value="135826"
      />
      <OTPInput
        helperText="Code verified."
        label="Success"
        length={6}
        status="success"
        value="135826"
      />
      <OTPInput error="Invalid security code." label="Error" length={6} />
    </div>
  ),
};
