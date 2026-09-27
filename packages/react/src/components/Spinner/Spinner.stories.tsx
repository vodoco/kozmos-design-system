import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";
import { Button } from "../Button";

const meta: Meta<typeof Spinner> = {
  title: "Feedback/Spinner",
  component: Spinner,
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  render: () => <Spinner />,
};

export const Small: Story = {
  render: () => <Spinner size="sm" />,
};

export const Large: Story = {
  render: () => <Spinner size="lg" />,
};

/** The four sizes: 16, 24, 32 and 48, as iOS, Android and Figma draw them. */
export const EverySize: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Spinner size="sm" label="Loading, small" />
      <Spinner size="md" label="Loading, medium" />
      <Spinner size="lg" label="Loading, large" />
      <Spinner size="xl" label="Loading, extra large" />
    </div>
  ),
};

/**
 * The same arc inside a control that already says it is busy. `Button` draws it
 * directly rather than nesting a `Spinner`: the button is disabled and named,
 * and a second live region for one wait is a defect.
 */
export const InAButton: Story = {
  render: () => <Button isLoading>Saving</Button>,
};
