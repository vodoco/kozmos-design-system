import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { KozmosButton } from "../../index";

/**
 * Vue's Button: the stories React's has, with the same names, args, layouts
 * and renders, each inside the KozmosThemeProvider the Storybook's decorator
 * gives every story at the toolbar's theme and density. test/parity draws
 * each of React's in both and holds Vue's render to React's, and
 * button.parity.spec.ts holds every button to React's server render.
 */
type Args = Record<string, unknown>;

const EMOTIONS = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

const meta: Meta<Args> = {
  title: "Vue/Core/Actions/Button",
  component: KozmosButton,
  parameters: { layout: "centered" },
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
        "subtle",
      ],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    emotion: { control: "select", options: [undefined, ...EMOTIONS] },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
  // React's `children` is Vue's default slot: the story's text, never an
  // attribute of the <button>.
  render: (args) => ({
    setup: () => () => {
      const { children, ...props } = args;
      return h(KozmosButton, props, {
        default: () => (children == null ? "" : String(children)),
      });
    },
  }),
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: "default", children: "Button" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Link: Story = {
  args: { variant: "link", children: "Link" },
};

export const Glass: Story = {
  args: { variant: "glass", children: "Glass" },
};

/**
 * The subtle variant (GAP-200, decision 135): a pale theme fill, theme 0,
 * under the theme's words, theme 600, with its own token tier. Pointr
 * Cloud's "+ Add additional field" is one, the width of its form through
 * `class="w-full"`.
 */
export const Subtle: Story = {
  parameters: { layout: "padded" },
  args: { variant: "subtle", children: "+ Add additional field" },
  render: (args) => ({
    setup: () => () => {
      const { children, ...props } = args;
      return h("div", { style: { inlineSize: "360px" } }, [
        h(KozmosButton, { ...props, class: "w-full" }, () => String(children)),
      ]);
    },
  }),
};

/**
 * The subtle Button in a destructive tone (decision 139): Pointr Cloud's
 * Delete Feature and Delete Beacon, a rose fill under red words. Every
 * emotion has its own pale fill in the subtle tier.
 */
export const SubtleEmotions: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    setup: () => () =>
      h(
        "div",
        { class: "flex flex-col gap-4", style: { inlineSize: "360px" } },
        [
          h(
            KozmosButton,
            { variant: "subtle", emotion: "danger", class: "w-full" },
            () => "Delete feature",
          ),
          h(
            "div",
            { class: "flex flex-wrap items-center gap-2" },
            EMOTIONS.map((emotion) =>
              h(
                KozmosButton,
                { key: emotion, variant: "subtle", emotion },
                () => emotion,
              ),
            ),
          ),
        ],
      ),
  }),
};

export const Loading: Story = {
  args: { isLoading: true, children: "Please wait" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

/**
 * What the button means, across the weights that carry a colour. `glass` is an
 * effect rather than a weight and takes no emotion, so it is not shown here.
 */
export const Emotions: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    setup: () => () =>
      h(
        "div",
        { class: "flex flex-col gap-4" },
        (["default", "outline", "ghost"] as const).map((variant) =>
          h(
            "div",
            { key: variant, class: "flex flex-wrap items-center gap-2" },
            [
              h(
                "span",
                { class: "w-20 text-xs text-muted-foreground" },
                variant,
              ),
              ...EMOTIONS.map((emotion) =>
                h(
                  KozmosButton,
                  { key: emotion, variant, emotion },
                  () => emotion,
                ),
              ),
            ],
          ),
        ),
      ),
  }),
};
