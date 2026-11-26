import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h, ref, type PropType, type VNode } from "vue";
import {
  KozmosLabel,
  KozmosSelect,
  KozmosSelectContent,
  KozmosSelectGroup,
  KozmosSelectItem,
  KozmosSelectLabel,
  KozmosSelectScrollDownButton,
  KozmosSelectScrollUpButton,
  KozmosSelectSeparator,
  KozmosSelectTrigger,
  KozmosSelectValue,
} from "../../index";

/**
 * Vue's Select: the stories React's has, with the same names, each drawn as
 * React's story draws it, from Kozmos parts only, inside the
 * KozmosThemeProvider the Storybook's decorator gives every story.
 * test/parity/select.parity.spec.ts draws each of React's in both.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Inputs/Select",
  component: KozmosSelect,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<Args>;

const item = (value: string, words: string, count?: number) =>
  h(
    KozmosSelectItem,
    { value },
    count === undefined
      ? { default: () => words }
      : { default: () => words, count: () => String(count) },
  );
const trigger = (props: Record<string, unknown>, placeholder?: string): VNode =>
  h(KozmosSelectTrigger, props, () => [
    h(
      KozmosSelectValue,
      null,
      placeholder === undefined ? {} : { placeholder: () => placeholder },
    ),
  ]);
const group = (label: string, items: [string, string][]) =>
  h(KozmosSelectGroup, null, () => [
    h(KozmosSelectLabel, null, () => label),
    ...items.map(([value, words]) => item(value, words)),
  ]);

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSelect, null, () => [
        trigger({ class: "w-44", "aria-label": "Fruit" }, "Select a fruit"),
        h(KozmosSelectContent, null, () => [
          group("Fruits", [
            ["apple", "Apple"],
            ["banana", "Banana"],
            ["blueberry", "Blueberry"],
            ["grapes", "Grapes"],
            ["pineapple", "Pineapple"],
          ]),
        ]),
      ]),
  }),
};

export const WithScroll: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSelect, null, () => [
        trigger(
          { class: "w-72", "aria-label": "Timezone" },
          "Select a timezone",
        ),
        h(KozmosSelectContent, null, () => [
          h(KozmosSelectScrollUpButton),
          group("North America", [
            ["est", "Eastern Standard Time (EST)"],
            ["cst", "Central Standard Time (CST)"],
            ["mst", "Mountain Standard Time (MST)"],
            ["pst", "Pacific Standard Time (PST)"],
            ["akst", "Alaska Standard Time (AKST)"],
            ["hst", "Hawaii-Aleutian Standard Time (HST)"],
          ]),
          h(KozmosSelectSeparator),
          group("Europe", [
            ["gmt", "Greenwich Mean Time (GMT)"],
            ["cet", "Central European Time (CET)"],
            ["eest", "Eastern European Standard Time (EEST)"],
            ["west", "Western European Summer Time (WEST)"],
            ["cat", "Central Africa Time (CAT)"],
            ["eat", "East Africa Time (EAT)"],
          ]),
          h(KozmosSelectSeparator),
          group("Asia", [
            ["msk", "Moscow Time (MSK)"],
            ["ist", "India Standard Time (IST)"],
            ["cst_china", "China Standard Time (CST)"],
            ["jst", "Japan Standard Time (JST)"],
            ["kst", "Korea Standard Time (KST)"],
            ["ist_indonesia", "Indonesia Central Standard Time (WITA)"],
          ]),
          h(KozmosSelectSeparator),
          group("Australia", [
            ["awst", "Australian Western Standard Time (AWST)"],
            ["acst", "Australian Central Standard Time (ACST)"],
            ["aest", "Australian Eastern Standard Time (AEST)"],
            ["nzst", "New Zealand Standard Time (NZST)"],
            ["fjt", "Fiji Time (FJT)"],
          ]),
          group("South America", [
            ["art", "Argentina Time (ART)"],
            ["bot", "Bolivia Time (BOT)"],
            ["brt", "Brasilia Time (BRT)"],
            ["clt", "Chile Standard Time (CLT)"],
          ]),
          h(KozmosSelectScrollDownButton),
        ]),
      ]),
  }),
};

export const Disabled: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSelect, { disabled: true }, () => [
        trigger({ class: "w-44", "aria-label": "Fruit" }, "Select a fruit"),
        h(KozmosSelectContent, null, () => [
          item("apple", "Apple"),
          item("banana", "Banana"),
        ]),
      ]),
  }),
};

export const WithError: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosSelect, null, () => [
        trigger(
          {
            class: "w-44",
            "aria-label": "Fruit",
            error: "Please select a fruit.",
          },
          "Select a fruit",
        ),
        h(KozmosSelectContent, null, () => [
          item("apple", "Apple"),
          item("banana", "Banana"),
        ]),
      ]),
  }),
};

// GAP-164: a count in each option, at its end before the check. It is read
// with the option's words, and the closed select shows the words alone.
export const OptionCounts: Story = {
  name: "Option counts",
  render: () => ({
    setup: () => () =>
      h(KozmosSelect, { defaultValue: "everything" }, () => [
        trigger({ class: "w-56", "aria-label": "Content" }),
        h(KozmosSelectContent, null, () => [
          item("everything", "All Content", 128),
          item("poi", "POI", 96),
          item("featured", "Featured POIs", 12),
          item("interior", "Interior asset", 32),
        ]),
      ]),
  }),
};

// The same list open, so the visual review draws the counts' column and
// the check's 16px place every row keeps (decision 1). Not on the docs
// page: an open Select holds the page's focus.
export const OptionCountsOpen: Story = {
  name: "Option counts, open",
  render: () => ({
    setup: () => () =>
      h("div", { style: { height: "280px" } }, [
        h(KozmosSelect, { defaultOpen: true, defaultValue: "poi" }, () => [
          trigger({ class: "w-56", "aria-label": "Content" }),
          h(KozmosSelectContent, null, () => [
            item("everything", "All Content", 1284),
            item("poi", "POI", 96),
            item("featured", "Featured POIs", 12),
            item("interior", "Interior asset", 32),
          ]),
        ]),
      ]),
  }),
};

/** One property of the selection, as React's MixedValue story's Field. */
const MixedField = defineComponent({
  props: {
    label: { type: String, required: true },
    edited: { type: String as PropType<string>, default: undefined },
  },
  setup(props) {
    const edit = ref<string | undefined>(props.edited);
    return () =>
      h("div", { class: "grid gap-1.5" }, [
        h(KozmosLabel, { for: props.label }, () => props.label),
        h(
          KozmosSelect,
          {
            mixed: edit.value === undefined,
            modelValue: edit.value,
            "onUpdate:modelValue": (value: string) => (edit.value = value),
            onResetMixed: () => (edit.value = undefined),
          },
          () => [
            trigger({ id: props.label }, "Choose a type"),
            h(KozmosSelectContent, null, () => [
              item("poi", "POI"),
              item("interior-asset", "Interior asset"),
              item("structural", "Structural"),
            ]),
          ],
        ),
      ]);
  },
});

/**
 * GAP-153: the selected features have different types. Mixed, the trigger
 * shows "Multiple values" and no option is checked; once chosen, "Reset to
 * multiple values" takes it back.
 */
export const MixedValue: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { class: "grid w-80 gap-4" }, [
        h(MixedField, { label: "Type" }),
        h(MixedField, { label: "Category", edited: "structural" }),
      ]),
  }),
};
