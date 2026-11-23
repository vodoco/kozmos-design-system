import type { Meta, StoryObj } from "@storybook/vue3";
import {
  KozmosBadge,
  KozmosDescriptionList,
  KozmosDescriptionListItem,
} from "../../index";

/**
 * Vue's DescriptionList: the story React's has, with the same name, inside
 * the KozmosThemeProvider the Storybook's decorator gives every story,
 * drawn by its own render as React's is;
 * test/parity/description-list.parity.spec.ts draws it in both and holds
 * Vue's render to React's.
 */
const meta: Meta = {
  title: "Vue/Core/Data display/DescriptionList",
  component: KozmosDescriptionList,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

/**
 * A unit's record, read-only (GAP-221, decision 199): words, tags, a yes and
 * a no, each value under its label with no field chrome.
 */
export const Default: Story = {
  render: () => ({
    components: {
      KozmosBadge,
      KozmosDescriptionList,
      KozmosDescriptionListItem,
    },
    template: `
      <div style="max-width: 480px">
        <KozmosDescriptionList aria-label="Unit">
          <KozmosDescriptionListItem>
            <template #label>Name</template>
            <template #value>Bean &amp; Leaf Café</template>
          </KozmosDescriptionListItem>
          <KozmosDescriptionListItem>
            <template #label>Categories</template>
            <KozmosBadge variant="secondary">Café</KozmosBadge>
            <KozmosBadge variant="secondary">Food</KozmosBadge>
          </KozmosDescriptionListItem>
          <KozmosDescriptionListItem :value="true">
            <template #label>Featured</template>
          </KozmosDescriptionListItem>
          <KozmosDescriptionListItem :value="false">
            <template #label>Hidden from visitors</template>
          </KozmosDescriptionListItem>
        </KozmosDescriptionList>
      </div>
    `,
  }),
};
