import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../Input";
import { FieldWrapper } from "./FieldWrapper";

const meta = {
  id: "components-fieldwrapper",
  title: "Core/Inputs/FieldWrapper",
  component: FieldWrapper,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["default", "error", "warning", "success"],
    },
  },
} satisfies Meta<typeof FieldWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: "Use supporting guidance when the field needs it.",
    helperText: "Helper text",
    label: "Label",
    required: true,
    status: "default",
  },
  render: (args) => (
    <FieldWrapper {...args} className="w-80">
      <Input placeholder="Placeholder" />
    </FieldWrapper>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-80 gap-5">
      <FieldWrapper label="Default" helperText="Helper text" status="default">
        <Input placeholder="Placeholder" />
      </FieldWrapper>
      <FieldWrapper label="Error" error="This field is required.">
        <Input placeholder="Placeholder" />
      </FieldWrapper>
      <FieldWrapper
        label="Warning"
        helperText="Check this value."
        status="warning"
      >
        <Input placeholder="Placeholder" />
      </FieldWrapper>
      <FieldWrapper label="Success" helperText="Looks good." status="success">
        <Input placeholder="Placeholder" />
      </FieldWrapper>
    </div>
  ),
};
