import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosSwitch } from "../../index";

/**
 * Vue's Switch: the stories React's has, with the same names, each drawn as
 * React's story draws it, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. test/parity/switch.parity.spec.ts draws each
 * in both and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosSwitch> = {
  title: "Vue/Core/Inputs/Switch",
  component: KozmosSwitch,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof KozmosSwitch>;

/** One switch, drawn from props as React's story draws it. */
const drawn = (props: Record<string, unknown>) => () => ({
  setup: () => () => h(KozmosSwitch, props),
});

export const Default: Story = {
  render: drawn({ id: "airplane-mode", label: "Airplane Mode" }),
};

// On: the track is the theme fill and the thumb the theme foreground, white
// in both themes (decision 59).
export const Checked: Story = {
  render: drawn({
    id: "airplane-mode-checked",
    label: "Airplane Mode",
    defaultChecked: true,
  }),
};

export const Disabled: Story = {
  render: drawn({
    id: "airplane-mode-disabled",
    label: "Airplane Mode",
    disabled: true,
  }),
};

export const Error: Story = {
  render: drawn({
    id: "airplane-mode-error",
    label: "Airplane Mode",
    error: "Required field",
  }),
};

// GAP-162: a description under the label, read as the switch's description.
export const WithDescription: Story = {
  render: drawn({
    id: "gate-alerts",
    label: "Gate alerts",
    description: "Sends a push when your gate changes",
    defaultChecked: true,
  }),
};

// GAP-162: the state in words beside the track. The words are not read: the
// switch says on or off itself, in the reader's language.
export const StateLabel: Story = {
  render: drawn({
    id: "gate-alerts-state",
    label: "Gate alerts",
    description: "Sends a push when your gate changes",
    showStateLabel: true,
  }),
};
