import type { Meta, StoryObj } from "@storybook/vue3";
import { computed } from "vue";
import {
  KozmosButton,
  KozmosDensityScope,
  KozmosThemeProvider,
} from "../../index";

/**
 * Vue's Button, the real port (Vue 3 Phase 0): the stories React's Button has,
 * with the same args, each inside a KozmosThemeProvider.
 * test/parity/button.parity.spec.ts holds every one to React's server render.
 */
const meta: Meta<typeof KozmosButton> = {
  title: "Vue/Core/Actions/Button",
  component: KozmosButton,
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
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    emotion: {
      control: "select",
      options: [
        undefined,
        "themed",
        "neutral",
        "success",
        "danger",
        "informative",
        "alert",
      ],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
  // `label` is the story's text: Button is given its own props only, so the
  // label never becomes an attribute of the <button>.
  render: (args) => ({
    components: { KozmosButton, KozmosThemeProvider },
    setup: () => ({
      label: computed(() => (args as { label?: string }).label),
      buttonProps: computed(() => {
        const { label: _label, ...props } = args as Record<string, unknown>;
        return props;
      }),
    }),
    template: `<KozmosThemeProvider><KozmosButton v-bind="buttonProps">{{ label }}</KozmosButton></KozmosThemeProvider>`,
  }),
};

export default meta;
type Story = StoryObj<typeof KozmosButton & { label?: string }>;

const story = (args: Record<string, unknown>): Story => ({
  args: args as Story["args"],
});

export const Default = story({ variant: "default", label: "Button" });
export const Destructive = story({
  variant: "destructive",
  label: "Destructive",
});
export const Outline = story({ variant: "outline", label: "Outline" });
export const Secondary = story({ variant: "secondary", label: "Secondary" });
export const Ghost = story({ variant: "ghost", label: "Ghost" });
export const Link = story({ variant: "link", label: "Link" });
export const Glass = story({ variant: "glass", label: "Glass" });
export const Loading = story({ isLoading: true, label: "Please wait" });
export const Disabled = story({ disabled: true, label: "Disabled" });

/** Each emotion on the three variants that take one, as React's Emotions story. */
export const Emotions: Story = {
  render: () => ({
    components: { KozmosButton, KozmosThemeProvider },
    setup: () => ({
      variants: ["default", "outline", "ghost"],
      emotions: [
        "themed",
        "neutral",
        "success",
        "danger",
        "informative",
        "alert",
      ],
    }),
    template: `
      <KozmosThemeProvider>
        <div style="display: grid; gap: 12px">
          <div v-for="variant in variants" :key="variant" style="display: flex; flex-wrap: wrap; gap: 8px">
            <KozmosButton v-for="emotion in emotions" :key="emotion" :variant="variant" :emotion="emotion">{{ emotion }}</KozmosButton>
          </div>
        </div>
      </KozmosThemeProvider>`,
  }),
};

/** A compact region inside a touch page (decision 82). */
export const CompactScope: Story = {
  render: () => ({
    components: { KozmosButton, KozmosDensityScope, KozmosThemeProvider },
    template: `
      <KozmosThemeProvider>
        <div style="display: flex; gap: 8px; align-items: center">
          <KozmosButton>Touch</KozmosButton>
          <KozmosDensityScope density="compact">
            <KozmosButton>Compact</KozmosButton>
          </KozmosDensityScope>
        </div>
      </KozmosThemeProvider>`,
  }),
};
