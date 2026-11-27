import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h, ref } from "vue";
import {
  MarkerPin01 as MapPin,
  ShoppingBag01 as ShoppingBag,
  Utensils as Coffee,
  Utensils,
} from "@kozmos-ds/icons/vue";
import { KozmosChip, KozmosChipGroup } from "../../index";

/**
 * Vue's Chip: the stories React's has, with the same names, each drawn as
 * React's story draws it, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. test/parity draws each of React's in both
 * and holds Vue's render to React's.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Data display/Chip",
  component: KozmosChip,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<Args>;

/** React's FilterDemo: one filter chosen at a time, and a removable chip. */
const FilterDemo = defineComponent({
  setup() {
    const active = ref("all");
    const visible = ref(true);
    const filter = (value: string, label: string, icon?: typeof Utensils) =>
      h(
        KozmosChip,
        {
          selected: active.value === value,
          onClick: () => (active.value = value),
        },
        {
          ...(icon ? { icon: () => h(icon) } : {}),
          default: () => label,
        },
      );
    return () =>
      h(KozmosChipGroup, { class: "max-w-[460px]" }, () => [
        filter("all", "All"),
        filter("food", "Food & Drink", Utensils),
        filter("coffee", "Coffee", Coffee),
        filter("shopping", "Retail", ShoppingBag),
        filter("places", "Places", MapPin),
        visible.value
          ? h(
              KozmosChip,
              { onRemove: () => (visible.value = false), variant: "brand" },
              () => "Open now",
            )
          : null,
      ]);
  },
});

export const Default: Story = {
  render: () => ({ setup: () => () => h(FilterDemo) }),
};

export const Sizes: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosChipGroup, null, () => [
        h(KozmosChip, { size: "sm" }, () => "Small"),
        h(KozmosChip, null, () => "Default"),
        h(KozmosChip, { size: "lg" }, () => "Large"),
      ]),
  }),
};

export const Variants: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosChipGroup, null, () => [
        h(KozmosChip, { variant: "neutral" }, () => "Neutral"),
        h(KozmosChip, { variant: "brand" }, () => "Brand"),
        h(KozmosChip, { variant: "destructive" }, () => "Destructive"),
        h(KozmosChip, { selected: true }, () => "Selected"),
        h(
          KozmosChip,
          { variant: "destructive", selected: true },
          () => "Selected destructive",
        ),
        h(KozmosChip, { disabled: true }, () => "Disabled"),
      ]),
  }),
};

/**
 * One choice of several: a radio group, so it is announced as one choice
 * with one Tab stop, and the arrow keys move it (row 37).
 */
export const OneChoice: Story = {
  render: () => ({
    setup() {
      const scope = ref("airport");
      return () =>
        h(
          KozmosChipGroup,
          {
            "aria-label": "Search in",
            selectionMode: "single",
            modelValue: scope.value,
            "onUpdate:modelValue": (value: string) => (scope.value = value),
          },
          () => [
            h(KozmosChip, { value: "airport" }, () => "Whole airport"),
            h(KozmosChip, { value: "t2" }, () => "Terminal 2"),
          ],
        );
    },
  }),
};
