import type { Meta, StoryObj } from "@storybook/vue3";
import { h, onMounted, ref } from "vue";
import { KozmosMultiSelect } from "../../index";

/**
 * Vue's MultiSelect: the stories React's has, with the same names and args,
 * each drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity draws each of
 * React's in both and holds Vue's render to React's.
 */
type Args = Record<string, unknown>;

const options = [
  { value: "filters", label: "Filters", description: "Show saved filters" },
  { value: "layers", label: "Layers", description: "Map and data layers" },
  { value: "routes", label: "Routes", description: "Route overlays" },
  { value: "alerts", label: "Alerts", description: "Operational notices" },
];

// GAP-192: MAP-64's Map Content type picker, its types under their families.
// Given in any order: the groups come in the order they first appear.
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
  { value: "meeting-room", label: "Meeting Room", group: "POI" },
];

const meta: Meta<Args> = {
  title: "Vue/Core/Inputs/MultiSelect",
  component: KozmosMultiSelect,
  parameters: { layout: "centered" },
  args: { label: "Tools", options },
  render: (args) => ({
    setup: () => () =>
      h("div", { class: "w-96" }, [h(KozmosMultiSelect, args)]),
  }),
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithSelectedValues: Story = {
  args: {
    label: "Visible layers",
    defaultValue: ["filters", "routes"],
    helperText: "Choose up to three layers.",
    maxSelected: 3,
  },
};

/**
 * Options under their groups (GAP-192), the chosen ones as chips. It opens
 * with its field focused, so the list shows, except on the docs page, where
 * the open list would sit over its text.
 */
export const Grouped: Story = {
  parameters: { layout: "padded" },
  args: {
    label: "Content types",
    options: contentTypes,
    defaultValue: ["office-desk"],
  },
  render: (args, { viewMode }) => ({
    setup() {
      const box = ref<HTMLElement | null>(null);
      onMounted(() => {
        if (viewMode !== "docs") box.value?.querySelector("input")?.focus();
      });
      return () =>
        h("div", { ref: box, class: "w-96" }, [h(KozmosMultiSelect, args)]);
    },
  }),
};
