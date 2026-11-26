import type { Meta, StoryObj } from "@storybook/vue3";
import { Bell01, HelpCircle } from "@kozmos-ds/icons/vue";
import { KozmosIcon, KozmosIconButton } from "../../index";

/**
 * Vue's IconButton: the stories React's has, with the same names and args,
 * each drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity/icon-button.parity.spec.ts
 * draws each in both and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosIconButton> = {
  title: "Vue/Core/Actions/IconButton",
  component: KozmosIconButton,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "glass",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof KozmosIconButton>;

export const Default: Story = {
  args: {
    "aria-label": "Search",
    variant: "ghost",
    size: "icon",
  },
  // React's `children` is an Icon: Vue's is the default slot.
  render: (args) => ({
    components: { KozmosIcon, KozmosIconButton },
    setup: () => ({ args }),
    template: `<KozmosIconButton v-bind="args"><KozmosIcon name="search-md" size="sm" /></KozmosIconButton>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: { KozmosIcon, KozmosIconButton },
    setup: () => ({
      variants: [
        ["default", "Default"],
        ["secondary", "Secondary"],
        ["outline", "Outline"],
        ["ghost", "Ghost"],
        ["destructive", "Destructive"],
      ],
    }),
    template: `<div class="flex items-center gap-4"><KozmosIconButton v-for="[variant, label] in variants" :key="variant" :variant="variant" :aria-label="label"><KozmosIcon name="search-md" size="sm" /></KozmosIconButton></div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { KozmosIcon, KozmosIconButton },
    setup: () => ({
      sizes: [
        ["sm", "Small", "xs"],
        ["default", "Default", "sm"],
        ["lg", "Large", "md"],
      ],
    }),
    template: `<div class="flex items-center gap-4"><KozmosIconButton v-for="[size, label, icon] in sizes" :key="size" :size="size" variant="outline" :aria-label="label"><KozmosIcon name="search-md" :size="icon" /></KozmosIconButton></div>`,
  }),
};

// GAP-197: the count of tours left on a help button, read with its name
// ("Help, 3 tours left"), at every size.
export const Counter: Story = {
  render: () => ({
    components: { Bell01, HelpCircle, KozmosIconButton },
    setup: () => ({
      sizes: ["sm", "icon", "lg"],
      toursLeft: (count: number) => `${count} tours left`,
    }),
    template: `<div class="flex items-center gap-4"><KozmosIconButton v-for="size in sizes" :key="size" aria-label="Help" :counter="3" :counter-label="toursLeft" :size="size" variant="outline"><HelpCircle aria-hidden="true" class="h-5 w-5" /></KozmosIconButton><KozmosIconButton aria-label="Notices" :counter="12" variant="ghost"><Bell01 aria-hidden="true" class="h-5 w-5" /></KozmosIconButton></div>`,
  }),
};
