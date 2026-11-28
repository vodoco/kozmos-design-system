import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosSearch } from "../../index";

/**
 * Vue's Search: the stories React's has, with the same names, each drawn as
 * React's story draws it, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. test/parity/search.parity.spec.ts draws them
 * in both.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Inputs/Search",
  component: KozmosSearch,
};

export default meta;
type Story = StoryObj<Args>;

// The width is the wrapper's: a class on the field itself never lands in
// Safari 26.0 to 26.3, which apply no @scope rule to an <input> (GAP-174).
export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSearch, { placeholder: "Search...", wrapperClassName: "w-72" }),
  }),
};

// A clear at the field's end while it holds text (GAP-161): it empties the
// field, says so to the product and puts the focus back in the field. Escape
// clears too.
export const Clearable: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSearch, {
        label: "Find a place",
        defaultValue: "Gate B12",
        clearable: true,
        wrapperClassName: "w-72",
      }),
  }),
};
