import { KozmosPOICard, KozmosMapOverlay } from "../../react-bridge";

export default {
  title: "Vue/POICard",
  component: KozmosPOICard,
  tags: ["autodocs"],
};

export const Default = {
  render: (args: any) => ({
    components: { KozmosPOICard },
    setup() {
      return { args };
    },
    template: `
            <KozmosPOICard v-bind="args">
                <template #badges>
                    <span style="background: blue; color: white; padding: 4px; border-radius: 4px; font-size: 12px; font-weight: bold;">Verified</span>
                </template>
                <template #description>
                    <p style="color: #4b5563; margin-bottom: 8px;">Located on the 2nd Floor, near the central escalator.</p>
                </template>
                <template #actions>
                    <button style="background: black; color: white; padding: 8px 16px; border-radius: 8px;">Navigate</button>
                    <button style="border: 1px solid black; padding: 8px 16px; border-radius: 8px; margin-left: 8px;">Share</button>
                </template>
            </KozmosPOICard>
        `,
  }),
  args: {
    title: "Starbucks Reserve",
    subtitle: "Coffee Shop · Level 2",
    imageUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8",
  },
};

export const InsideMapOverlay = {
  render: (args: any) => ({
    components: { KozmosPOICard, KozmosMapOverlay },
    setup() {
      return { args };
    },
    template: `
            <div style="position: relative; width: 100%; min-width: 800px; height: 500px; background: #f1f5f9; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-family: monospace;">
                <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #64748b;">Simulated Map Environment</span>
                <KozmosMapOverlay position="bottom-left">
                    <KozmosPOICard v-bind="args">
                        <template #badges>
                            <span style="background: blue; color: white; padding: 4px; border-radius: 4px; font-size: 12px; font-weight: bold;">Verified</span>
                        </template>
                        <template #description>
                            <p style="color: #4b5563; margin-bottom: 8px;">Located on the 2nd Floor, near the central escalator.</p>
                        </template>
                        <template #actions>
                            <button style="background: black; color: white; padding: 8px 16px; border-radius: 8px;">Navigate</button>
                        </template>
                    </KozmosPOICard>
                </KozmosMapOverlay>
            </div>
        `,
  }),
  args: Default.args,
};
