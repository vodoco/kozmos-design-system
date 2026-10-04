import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./ScrollArea";
import { Card } from "../Card";

const meta = {
  id: "components-scrollarea",
  title: "Core/Layout/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HorizontalQuickAccess: Story = {
  render: () => (
    <div className="w-[360px] border rounded-container bg-card overflow-hidden">
      <ScrollArea orientation="horizontal" snap="x" className="p-4 w-full">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="snap-start shrink-0">
              <Card className="w-[200px] h-[120px] flex items-center justify-center bg-muted">
                Item {i}
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const VerticalContent: Story = {
  render: () => (
    <div className="w-[300px] h-[400px] border rounded-container bg-card">
      <ScrollArea orientation="vertical" className="p-4 h-full w-full">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="py-2 border-b last:border-b-0 text-sm">
            Scroll Item {i + 1}
          </div>
        ))}
      </ScrollArea>
    </div>
  ),
};
