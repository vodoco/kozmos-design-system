import type { Meta, StoryObj } from "@storybook/react";
import { POICard } from "./POICard";
import { MapOverlay } from "../MapOverlay";
import { Badge } from "../Badge/Badge";
import { Tag } from "../Tag/Tag";
import { Button } from "../Button/Button";
import { Navigation, Share2, Star } from "lucide-react";

const meta = {
  title: "Components/POICard",
  component: POICard,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof POICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Starbucks Coffee",
    subtitle: "Floor 1 • Terminal A",
    className: "w-[380px] max-w-full",
    description:
      "Cozy Seattle-based coffeehouse chain known for its signature roasts, light bites, and free WiFi availability.",
    badges: (
      <>
        <Tag emotion="success">Open Now</Tag>
        <Badge variant="secondary">Café</Badge>
      </>
    ),
    actions: (
      <>
        <Button className="flex-1" size="sm">
          <Navigation className="w-4 h-4" /> Navigate
        </Button>
        <Button variant="outline" size="sm" aria-label="Share location">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" aria-label="Save location">
          <Star className="w-4 h-4" />
        </Button>
      </>
    ),
  },
};

export const WithHeroImage: Story = {
  args: {
    ...Default.args,
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2000&auto=format&fit=crop",
  },
};

export const InsideMapOverlay: Story = {
  render: (args) => (
    <div
      className="relative w-full min-w-0 h-[500px] bg-muted rounded-panel overflow-hidden border"
      style={{ width: 800, maxWidth: "100%" }}
    >
      <span className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
        Simulated Map Environment
      </span>
      <MapOverlay
        position="top-left"
        width="md"
        style={{ maxHeight: "calc(100% - 2rem)" }}
      >
        <POICard {...args} className="w-full shrink-0" />
        <POICard
          {...args}
          title="Secondary result"
          className="w-full shrink-0"
        />
      </MapOverlay>
    </div>
  ),
  args: Default.args,
};
