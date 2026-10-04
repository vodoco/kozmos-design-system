import type { Meta, StoryObj } from "@storybook/react";
import { NumberInput } from "./NumberInput";
import { ThemeProvider } from "../ThemeProvider";

const meta = {
  id: "components-numberinput",
  title: "Core/Inputs/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["default", "error", "warning", "success"],
    },
    showSteppers: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 3,
    label: "Floors",
    min: 0,
    step: 1,
  },
  render: (args) => (
    <div className="w-80">
      <NumberInput {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: (args) => (
    <div className="w-80">
      <NumberInput
        defaultValue={12}
        helperText="Use a whole number."
        label="Capacity"
        min={0}
        {...args}
      />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <NumberInput
        defaultValue={8}
        helperText="Default numeric field."
        label="Default"
      />
      <NumberInput
        defaultValue={2}
        helperText="Check the selected value."
        label="Warning"
        status="warning"
      />
      <NumberInput
        defaultValue={16}
        helperText="Value is available."
        label="Success"
        status="success"
      />
      <NumberInput
        error="Enter a value between 1 and 10."
        label="Error"
        min={1}
        max={10}
      />
    </div>
  ),
};

export const WithoutSteppers: Story = {
  render: (args) => (
    <div className="w-80">
      <NumberInput
        defaultValue={24}
        label="Radius"
        showSteppers={false}
        {...args}
      />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: function RightToLeftStory(_args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <div style={{ width: 220 }}>
          <NumberInput
            label="Floors"
            defaultValue={3}
            status="warning"
            helperText="Narrow RTL field"
          />
        </div>
      </ThemeProvider>
    );
  },
};

export const ReadOnly: Story = {
  args: { label: "Floors", value: 3, readOnly: true },
};
