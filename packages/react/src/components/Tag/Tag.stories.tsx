import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  id: "data-display-tag",
  title: "Core/Data display/Tag",
  component: Tag,
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  render: () => <Tag>Tag</Tag>,
};

export const Removable: Story = {
  render: () => <Tag onRemove={() => alert("Removed")}>Removable Tag</Tag>,
};

/**
 * The six emotions, filled and outlined. The product drives this axis on
 * 33,988 tag instances across ten surfaces; before `Semantics.Emotion` existed
 * the only six-emotion colours in the system were named for buttons.
 */
export const Emotions: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag emotion="neutral">Neutral</Tag>
        <Tag emotion="themed">Themed</Tag>
        <Tag emotion="success">Open</Tag>
        <Tag emotion="danger">Closed</Tag>
        <Tag emotion="informative">Info</Tag>
        <Tag emotion="alert">Delayed</Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag emotion="neutral" variant="outline">
          Neutral
        </Tag>
        <Tag emotion="themed" variant="outline">
          Themed
        </Tag>
        <Tag emotion="success" variant="outline">
          Open
        </Tag>
        <Tag emotion="danger" variant="outline">
          Closed
        </Tag>
        <Tag emotion="informative" variant="outline">
          Info
        </Tag>
        <Tag emotion="alert" variant="outline">
          Delayed
        </Tag>
      </div>
    </div>
  ),
};
