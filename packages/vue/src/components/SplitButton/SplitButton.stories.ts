import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosSplitButton } from "../../index";

/**
 * Vue's SplitButton: the stories React's has, with the same names and
 * args, inside the KozmosThemeProvider the Storybook's decorator gives every
 * story. test/parity/split-button.parity.spec.ts draws them in both.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Actions/SplitButton",
  component: KozmosSplitButton,
  // React's `children` is the default slot.
  render: ({ children, ...props }) => ({
    setup: () => () =>
      h(KozmosSplitButton, props, () =>
        children === undefined ? undefined : String(children),
      ),
  }),
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    children: "Save",
    menuItems: [
      { label: "Save as Draft", onClick: () => console.log("Draft") },
      { label: "Save and Publish", onClick: () => console.log("Publish") },
    ],
  },
};
