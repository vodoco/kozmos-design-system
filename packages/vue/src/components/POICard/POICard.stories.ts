import { KozmosButton } from "../../";
import {
  KozmosBadge,
  KozmosMapOverlay,
  KozmosPOICard,
  KozmosTag,
  KozmosText,
} from "../../react-bridge";

// React's POICard through the bridge, drawn as React's stories draw it: its
// badges, description and actions are Kozmos parts, on the classes React's
// stories use, so nothing in the story paints a colour of its own. Default
// passes the description through the #description slot, which the bridge
// hands React as the `description` prop; InsideMapOverlay passes the prop.
export default {
  title: "Vue/POICard",
  component: KozmosPOICard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

const description = "Located on the 2nd Floor, near the central escalator.";

const card = (descriptionSlot = "") => `
  <KozmosPOICard v-bind="args">
    <template #badges>
      <KozmosTag emotion="success">Open Now</KozmosTag>
      <KozmosBadge variant="secondary">Café</KozmosBadge>
    </template>${descriptionSlot}
    <template #actions>
      <KozmosButton class="flex-1" size="sm">Navigate</KozmosButton>
      <KozmosButton variant="outline" size="sm">Share</KozmosButton>
    </template>
  </KozmosPOICard>`;

export const Default = {
  render: (args: any) => ({
    components: {
      KozmosBadge,
      KozmosButton,
      KozmosPOICard,
      KozmosTag,
      KozmosText,
    },
    setup() {
      return { args, description };
    },
    // A div, not Text's default p: the bridge hands React a slot inside a
    // div of its own, and a p holds no div.
    template: card(`
    <template #description>
      <KozmosText as="div" size="sm" color="muted">{{ description }}</KozmosText>
    </template>`),
  }),
  args: {
    title: "Starbucks Reserve",
    subtitle: "Coffee Shop · Level 2",
    imageUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8",
    class: "w-[380px] max-w-full",
  },
};

export const InsideMapOverlay = {
  render: (args: any) => ({
    components: {
      KozmosBadge,
      KozmosButton,
      KozmosMapOverlay,
      KozmosPOICard,
      KozmosTag,
    },
    setup() {
      return { args };
    },
    template: `
      <div class="relative w-full min-w-0 h-[500px] bg-muted rounded-panel overflow-hidden border" style="width: 800px; max-width: 100%">
        <span class="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">Simulated Map Environment</span>
        <KozmosMapOverlay position="bottom-left">${card()}</KozmosMapOverlay>
      </div>`,
  }),
  args: { ...Default.args, description, class: "w-full shrink-0" },
};
