import type { Meta, StoryObj } from "@storybook/vue3";
import { SearchMd as Search } from "@kozmos-ds/icons/vue";
import { KozmosButton, KozmosEmptyState } from "../../index";

/**
 * Vue's EmptyState: the stories React's has, with the same names, its icon
 * and action given as slots, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. test/parity/empty-state.parity.spec.ts draws
 * each in both and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosEmptyState> = {
  title: "Vue/Core/Feedback/EmptyState",
  component: KozmosEmptyState,
  parameters: { layout: "centered" },
  args: { title: "No results found" },
};

export default meta;
type Story = StoryObj<typeof KozmosEmptyState>;

const components = { KozmosButton, KozmosEmptyState, Search };

export const Default: Story = {
  args: {
    title: "No results found",
    description:
      "We couldn't find any places matching your search. Please check your spelling or try another term.",
  },
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <div class="w-[360px] h-[400px] border rounded-container bg-card flex">
        <KozmosEmptyState v-bind="args">
          <template #icon><Search class="h-8 w-8 text-muted-foreground" /></template>
          <template #action><KozmosButton variant="outline">Clear Search</KozmosButton></template>
        </KozmosEmptyState>
      </div>`,
  }),
};

/**
 * `compact`, for a slot that already draws a box (GAP-009): the same
 * content at both sizes.
 */
export const Compact: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    components,
    setup: () => ({ sizes: ["default", "compact"] }),
    template: `
      <div class="flex flex-wrap items-start gap-6">
        <div v-for="size in sizes" :key="size" class="w-[320px] max-w-full rounded-container border border-dashed">
          <KozmosEmptyState
            description="Nothing at this airport serves Korean food."
            :size="size"
            title="No Korean restaurants found"
          >
            <template #icon><Search class="h-8 w-8 text-muted-foreground" /></template>
          </KozmosEmptyState>
        </div>
      </div>`,
  }),
};

/**
 * GAP-115: a long wait it explains, such as the assistant's download, says
 * how far it has got under the description.
 */
export const DownloadProgress: Story = {
  render: () => ({
    components,
    setup: () => ({
      progress: {
        value: 40,
        label: "Downloading the assistant",
        valueText: "12 of 30 MB",
      },
    }),
    template: `
      <div class="w-[360px] h-[400px] border rounded-container bg-card flex">
        <KozmosEmptyState
          title="The assistant isn't downloaded yet"
          description="It works offline once it's on this device."
          :progress="progress"
        >
          <template #action><KozmosButton variant="outline">Back to search</KozmosButton></template>
        </KozmosEmptyState>
      </div>`,
  }),
};

/**
 * GAP-165: Map Content's "No Map Content Found" lists what to try under its
 * description, read in order before the action.
 */
export const WithList: Story = {
  render: () => ({
    components,
    setup: () => ({
      list: [
        "Check the building and level",
        "Clear the type filters",
        "Search by another name or an ID",
      ],
    }),
    template: `
      <div class="w-[360px] h-[440px] border rounded-container bg-card flex">
        <KozmosEmptyState
          title="No Map Content Found"
          description="Nothing on this level matches your search."
          list-label="What to try"
          :list="list"
        >
          <template #icon><Search class="h-8 w-8 text-muted-foreground" /></template>
          <template #action><KozmosButton variant="outline">Clear filters</KozmosButton></template>
        </KozmosEmptyState>
      </div>`,
  }),
};
