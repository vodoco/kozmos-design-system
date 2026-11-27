import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosChipInput } from "../../index";

/**
 * Vue's ChipInput: the stories React's has, with the same names and args,
 * each drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity draws each of
 * React's in both and holds Vue's render to React's.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Inputs/ChipInput",
  component: KozmosChipInput,
  parameters: { layout: "centered" },
  args: {
    label: "Keywords",
    placeholder: "Add a keyword",
    helperText: "Press Enter or type a comma to add one.",
    defaultValue: ["coffee", "breakfast", "wifi"],
  },
  render: (args) => ({
    setup: () => () => h("div", { class: "w-96" }, [h(KozmosChipInput, args)]),
  }),
};

export default meta;
type Story = StoryObj<Args>;

/**
 * The POI editor's keywords (GAP-222, decision 216): each entry a removable
 * chip inside the field, and the visitor's own words, not a list's options.
 */
export const Default: Story = {};
