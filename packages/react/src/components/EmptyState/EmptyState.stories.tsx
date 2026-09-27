import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "../Button";
import { SearchMd as Search } from "@kozmos-ds/icons";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Search className="h-8 w-8 text-muted-foreground" />,
    title: "No results found",
    description:
      "We couldn't find any places matching your search. Please check your spelling or try another term.",
    action: <Button variant="outline">Clear Search</Button>,
  },
  render: (args) => (
    <div className="w-[360px] h-[400px] border rounded-container bg-card flex">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * `compact`, for a slot that already draws a box. Measured on the MAP-474
 * boards: this content came to 258px inside `POIResultList` — 48 the slot's
 * own padding, 64 this component's — and to about 128 compact (GAP-009).
 *
 * A product does not have to ask for it. `POIResultList`'s empty slot draws
 * the box, so it says so itself, and an explicit `size` here still wins.
 */
export const Compact: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {(["default", "compact"] as const).map((size) => (
        <div
          key={size}
          className="w-[320px] max-w-full rounded-container border border-dashed"
        >
          <EmptyState
            description="Nothing at this airport serves Korean food."
            icon={<Search className="h-8 w-8 text-muted-foreground" />}
            size={size}
            title="No Korean restaurants found"
          />
        </div>
      ))}
    </div>
  ),
};
