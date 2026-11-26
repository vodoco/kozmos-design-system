import type { Meta, StoryObj } from "@storybook/vue3";
import { h, ref } from "vue";
import { KozmosRating } from "../../index";

/**
 * Vue's Rating: the stories React's has, with the same names and args, each
 * drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. React's `value` is Vue's
 * `v-model` (`model-value`). test/parity/rating.parity.spec.ts draws each in
 * both and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosRating> = {
  title: "Vue/Core/Inputs/Rating",
  component: KozmosRating,
  render: (args) => ({
    components: { KozmosRating },
    setup: () => ({ args }),
    template: `<KozmosRating v-bind="args" />`,
  }),
};

export default meta;
type Story = StoryObj<typeof KozmosRating>;

export const Default: Story = {
  args: {
    modelValue: 3,
  },
};

/**
 * `thumbs`, the two-option scale the Express Maps prompt uses: "Are you
 * enjoying this?" is a yes or a no, not a mark out of five. Exactly the one
 * chosen fills, but the value is still a number: **0 unanswered, 1 down,
 * 2 up**.
 */
export const Thumbs: Story = {
  // A render function, so the words are React's text nodes: a template
  // joins them into one.
  render: () => ({
    setup() {
      const value = ref(0);
      return () =>
        h("div", { class: "flex flex-col items-start gap-4" }, [
          h(KozmosRating, {
            modelValue: value.value,
            "onUpdate:modelValue": (next: number) => (value.value = next),
            variant: "thumbs",
          }),
          h("p", { class: "text-sm text-muted-foreground" }, [
            "value: ",
            String(value.value),
            " ",
            value.value === 0
              ? "(unanswered)"
              : value.value === 1
                ? "(down)"
                : "(up)",
          ]),
        ]);
    },
  }),
};

/**
 * Read-only is not a control: one image, with the rating as its label.
 */
export const ReadOnly: Story = {
  render: () => ({
    components: { KozmosRating },
    template: `<div class="flex flex-col items-start gap-3"><KozmosRating read-only :model-value="4" /><KozmosRating read-only :model-value="2" variant="thumbs" /><KozmosRating read-only :model-value="0" /></div>`,
  }),
};

/**
 * A read-only star rating shows a score to the nearest half (decision 181):
 * 4.3 draws as 4.5, 4.2 as 4 and 4.25 as 4.5, and the label says what is
 * drawn. The half is the filled star clipped to its inline start: the right
 * half in a right-to-left page.
 */
export const ReadOnlyHalves: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { class: "flex flex-col items-start gap-3" }, [
        ...[4.3, 4.2, 4.25, 0.5, 2.75].map((value) =>
          h("div", { key: value, class: "flex items-center gap-3" }, [
            h(KozmosRating, { readOnly: true, modelValue: value }),
            h("p", { class: "text-sm text-muted-foreground" }, [
              "value: ",
              String(value),
            ]),
          ]),
        ),
        h("div", { dir: "rtl" }, [
          h(KozmosRating, { readOnly: true, modelValue: 3.5 }),
        ]),
      ]),
  }),
};
