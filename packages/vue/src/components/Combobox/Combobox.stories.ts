import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h, ref, type PropType } from "vue";
import { KozmosCombobox } from "../../index";

/**
 * Vue's Combobox: the stories React's has, with the same names and args,
 * each drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity draws each of
 * React's in both and holds Vue's render to React's.
 */
type Args = Record<string, unknown>;

const options = [
  {
    value: "overview",
    label: "Overview",
    description: "Summary and key signals",
  },
  {
    value: "details",
    label: "Details",
    description: "Full record information",
  },
  {
    value: "activity",
    label: "Activity",
    description: "Recent changes and updates",
  },
];

// GAP-192: MAP-64's Map Content type picker, its types under their families.
// Given in any order: the groups come in the order they first appear.
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
  { value: "meeting-room", label: "Meeting Room", group: "POI" },
];

const meta: Meta<Args> = {
  title: "Vue/Core/Inputs/Combobox",
  component: KozmosCombobox,
  parameters: { layout: "centered" },
  args: { label: "View", options },
  render: (args) => ({
    setup: () => () => h("div", { class: "w-80" }, [h(KozmosCombobox, args)]),
  }),
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithValidation: Story = {
  args: { label: "Project", error: "Choose a project before continuing." },
};

/**
 * Options under their groups (GAP-192), filtered by what is typed, as
 * MAP-64's "Find and select office desk type" step shows them: "desk" keeps
 * Interior Asset's three desks and POI's Reception Desk, each under its
 * group's label. It opens focused, so the list shows, except on the docs
 * page, where the open list would sit over its text.
 */
export const Grouped: Story = {
  parameters: { layout: "padded" },
  args: {
    label: "Content type",
    options: contentTypes,
    defaultInputValue: "desk",
  },
  render: (args, { viewMode }) => ({
    setup: () => () =>
      h("div", { class: "w-80" }, [
        h(KozmosCombobox, {
          ...args,
          ...(viewMode !== "docs" ? { autofocus: true } : {}),
        }),
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
      h(KozmosCombobox, {
        label: props.label,
        options: contentTypes,
        mixed: edit.value === undefined,
        modelValue: edit.value ?? "",
        "onUpdate:modelValue": (value: string) => (edit.value = value),
        onResetMixed: () => (edit.value = undefined),
      });
  },
});

/**
 * GAP-153: the selected features have different values. Mixed, the field
 * shows "Multiple values" and no option is checked; a typed query keeps it
 * mixed, a choice edits it, and "Reset to multiple values" takes it back.
 */
export const MixedValue: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { class: "grid w-80 gap-4" }, [
        h(MixedField, { label: "Content type" }),
        h(MixedField, { label: "Replaced by", edited: "meeting-room" }),
      ]),
  }),
};
