import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import {
  KozmosButton,
  KozmosTooltip,
  KozmosTooltipContent,
  KozmosTooltipProvider,
  KozmosTooltipTrigger,
} from "../../index";

/**
 * Vue's Tooltip: the story React's has, with its name, drawn as React's
 * story draws it, inside a KozmosTooltipProvider as React's meta draws its
 * stories, and the KozmosThemeProvider the Storybook's decorator gives every
 * story. test/parity/tooltip.parity.spec.ts draws it in both, closed and
 * open.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/Tooltip",
  component: KozmosTooltip,
  decorators: [
    () => ({
      components: { KozmosTooltipProvider },
      template: "<KozmosTooltipProvider><story /></KozmosTooltipProvider>",
    }),
  ],
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosTooltip, null, () => [
        h(KozmosTooltipTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Hover me"),
        ),
        h(KozmosTooltipContent, null, () => h("p", null, "Add to library")),
      ]),
  }),
};
