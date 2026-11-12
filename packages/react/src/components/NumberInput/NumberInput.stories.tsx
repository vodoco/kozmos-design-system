import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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

// A unit inside the field after the value (GAP-098): never part of the
// value, and read after it by its spoken name.
export const WithUnit: Story = {
  render: () => (
    <div className="grid w-80 gap-4">
      <NumberInput
        defaultValue={15}
        label="Width"
        min={0}
        unit="m"
        unitLabel="metres"
      />
      <NumberInput
        defaultValue={20}
        label="Height"
        min={0}
        showSteppers={false}
        unit="m"
        unitLabel="metres"
      />
    </div>
  ),
};

export const WithUnitRightToLeft: Story = {
  render: function WithUnitRightToLeftStory(_args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <div className="grid gap-4" style={{ width: 220 }}>
          <NumberInput label="Width" defaultValue={15} unit="m" />
          <NumberInput
            label="Height"
            defaultValue={20}
            showSteppers={false}
            unit="m"
          />
        </div>
      </ThemeProvider>
    );
  },
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

/**
 * GAP-153: a value the selected features do not share. Mixed, the field is
 * empty with "Multiple values" and its steppers disabled; a typed number edits it, and
 * "Reset to multiple values" takes it back.
 */
export const MixedValue: Story = {
  render: () => {
    function Field({ label, edited }: { label: string; edited?: number }) {
      const [edit, setEdit] = useState<number | null | undefined>(edited);
      return (
        <NumberInput
          label={label}
          min={0}
          mixed={edit === undefined}
          value={edit ?? ""}
          onValueChange={setEdit}
          onResetMixed={() => setEdit(undefined)}
        />
      );
    }
    return (
      <div className="grid w-80 gap-4">
        <Field label="Height (m)" />
        <Field label="Capacity" edited={12} />
      </div>
    );
  },
};
