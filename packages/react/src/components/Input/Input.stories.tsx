import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Star01 } from "@kozmos-ds/icons";
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

// GAP-154: Pointr Cloud's POI editor, a feature's ID read-only with a copy
// action that says it copied, and the Featured star as a toggle at a field's
// end.
function ActionsExample() {
  const [featured, setFeatured] = useState(true);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Input
        label="FID"
        readOnly
        defaultValue="5f0c2a7e-91d4-4b1e-a0f3-6c8e2d1b9a47"
        action={{ kind: "copy", label: "Copy FID" }}
      />
      <Input
        label="Name"
        defaultValue="Gate B12"
        action={{
          kind: "toggle",
          label: "Featured",
          icon: <Star01 aria-hidden="true" />,
          pressed: featured,
          onPressedChange: setFeatured,
        }}
      />
    </div>
  );
}

export const Actions: Story = {
  render: () => <ActionsExample />,
};

/**
 * GAP-153: a property of a multi-selection whose features differ. The field
 * shows "Multiple values" and is described with it until it is edited; then
 * it offers "Reset to multiple values", which takes it back. Type in the
 * first field to see the reset; the second has been edited already.
 */
export const MixedValue: Story = {
  render: () => {
    function Field({ label, edited }: { label: string; edited?: string }) {
      const [edit, setEdit] = useState<string | undefined>(edited);
      return (
        <Input
          label={label}
          mixed={edit === undefined}
          value={edit ?? ""}
          onChange={(event) => setEdit(event.target.value)}
          onResetMixed={() => setEdit(undefined)}
        />
      );
    }
    return (
      <div className="grid w-80 gap-4">
        <Field label="Name" />
        <Field label="Description" edited="Gate seating" />
      </div>
    );
  },
};
