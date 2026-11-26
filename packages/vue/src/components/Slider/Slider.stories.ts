import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosSlider } from "../../index";

/**
 * Vue's Slider: the stories React's has, with the same names, each drawn as
 * React's story draws it, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. React's `formatValue` is Vue's
 * `#formatValue` slot. test/parity/slider.parity.spec.ts draws each in both
 * and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosSlider> = {
  title: "Vue/Core/Inputs/Slider",
  component: KozmosSlider,
};

export default meta;
type Story = StoryObj<typeof KozmosSlider>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSlider, {
        label: "Volume",
        defaultValue: [50],
        max: 100,
        step: 1,
        class: "w-3/5",
      }),
  }),
};

export const Range: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSlider, {
        defaultValue: [20, 80],
        max: 100,
        step: 1,
        class: "w-3/5",
      }),
  }),
};

// A readout that stays (GAP-163): the value at the slider's end, at rest
// too, as the #formatValue slot words it. The thumb says it; the readout is
// not read.
export const WithReadout: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { class: "grid w-3/5 gap-6" }, [
        h(
          KozmosSlider,
          {
            label: "Floor-plan opacity",
            defaultValue: [60],
            max: 100,
            step: 5,
            showValue: true,
          },
          { formatValue: ({ value }: { value: number }) => `${value}%` },
        ),
        h(KozmosSlider, {
          label: "Price",
          defaultValue: [20, 80],
          max: 100,
          showValue: true,
          thumbLabels: ["Lowest price", "Highest price"],
        }),
      ]),
  }),
};
