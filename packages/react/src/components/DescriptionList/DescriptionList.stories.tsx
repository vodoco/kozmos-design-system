import type { Meta, StoryObj } from "@storybook/react";
import { DescriptionList, DescriptionListItem } from "./DescriptionList";
import { Badge } from "../Badge";

const meta: Meta<typeof DescriptionList> = {
  id: "data-display-descriptionlist",
  title: "Core/Data display/DescriptionList",
  component: DescriptionList,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DescriptionList>;

/**
 * A unit's record, read-only (GAP-221, decision 199): words, tags, a yes and
 * a no, each value under its label with no field chrome.
 */
export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <DescriptionList aria-label="Unit">
        <DescriptionListItem label="Name" value="Bean & Leaf Café" />
        <DescriptionListItem label="Categories">
          <Badge variant="secondary">Café</Badge>
          <Badge variant="secondary">Food</Badge>
        </DescriptionListItem>
        <DescriptionListItem label="Featured" value={true} />
        <DescriptionListItem label="Hidden from visitors" value={false} />
      </DescriptionList>
    </div>
  ),
};
