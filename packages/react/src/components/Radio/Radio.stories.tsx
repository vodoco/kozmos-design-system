import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./Radio";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <RadioGroupItem value="option-one" id="option-one" label="Option One" />
      <RadioGroupItem value="option-two" id="option-two" label="Option Two" />
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" disabled>
      <RadioGroupItem
        value="option-one"
        id="option-disabled-one"
        label="Option One"
      />
      <RadioGroupItem
        value="option-two"
        id="option-disabled-two"
        label="Option Two"
      />
    </RadioGroup>
  ),
};

export const Error: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" error="Selection required">
      <RadioGroupItem
        value="option-one"
        id="option-error-one"
        label="Option One"
        error
      />
      <RadioGroupItem
        value="option-two"
        id="option-error-two"
        label="Option Two"
        error
      />
    </RadioGroup>
  ),
};
