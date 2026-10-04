import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  id: "foundations-heading",
  title: "Foundations/Typography/Heading",
  component: Heading,
  argTypes: {
    level: { control: "select", options: [1, 2, 3, 4, 5, 6] },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    children: "Heading 1",
    level: 1,
  },
};

export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>
      <Heading level={5}>Heading 5</Heading>
      <Heading level={6}>Heading 6</Heading>
    </div>
  ),
};
