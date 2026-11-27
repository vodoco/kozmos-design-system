import type { Meta, StoryObj } from "@storybook/vue3";
import { KozmosSegmentedControl } from "../../index";

/**
 * Vue's SegmentedControl: the stories React's has, with the same names and
 * args, inside the KozmosThemeProvider the Storybook's decorator gives every
 * story. React's `value` is Vue's `v-model` (`model-value`).
 * test/parity/segmented-control.parity.spec.ts draws each in both and holds
 * Vue's render to React's.
 */
const items = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];

const meta: Meta<typeof KozmosSegmentedControl> = {
  title: "Vue/Core/Inputs/SegmentedControl",
  component: KozmosSegmentedControl,
  args: {
    defaultValue: "overview",
    items,
  },
  render: (args) => ({
    components: { KozmosSegmentedControl },
    setup: () => ({ args }),
    template: `<KozmosSegmentedControl v-bind="args" />`,
  }),
};

export default meta;
type Story = StoryObj<typeof KozmosSegmentedControl>;

export const Default: Story = {};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

export const Error: Story = {
  args: {
    error: "Choose a section before continuing.",
    modelValue: "details",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: "overview",
  },
};
