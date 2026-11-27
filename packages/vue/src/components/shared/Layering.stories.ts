import type { Meta, StoryObj } from "@storybook/vue3";
import { h, ref, type Component, type VNode } from "vue";
import {
  KozmosBottomSheet,
  KozmosBottomSheetContent,
  KozmosBottomSheetDescription,
  KozmosBottomSheetTitle,
  KozmosBottomSheetTrigger,
  KozmosButton,
  KozmosCombobox,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogTitle,
  KozmosDialogTrigger,
  KozmosDrawer,
  KozmosDrawerContent,
  KozmosDrawerDescription,
  KozmosDrawerTitle,
  KozmosDrawerTrigger,
  KozmosPopover,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
  KozmosSelect,
  KozmosSelectContent,
  KozmosSelectItem,
  KozmosSelectTrigger,
  KozmosSelectValue,
  KozmosTooltip,
  KozmosTooltipContent,
  KozmosTooltipProvider,
  KozmosTooltipTrigger,
} from "../../index";

/**
 * Vue's own stories, React has none of them: a native field or tooltip
 * inside a native overlay, which wave V2 ported together so they work as
 * React's do inside React's (shared/layers.ts). Each opens closed, from
 * "Open"; scripts/check-vue-interactions.mjs opens the overlay, uses the
 * field in it with a real pointer and keyboard, and holds that the overlay
 * stays open until Escape reaches it, after the field's own Escape.
 * test/parity/overlay-layers.parity.spec.ts runs the same steps in React
 * and Vue in jsdom.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/Layering",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<Args>;

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

/** A Select whose value the story holds, named Fruit. */
const select = () => {
  const value = ref<string>();
  return () =>
    h(
      KozmosSelect,
      {
        modelValue: value.value,
        "onUpdate:modelValue": (next: string) => (value.value = next),
      },
      () => [
        h(KozmosSelectTrigger, { class: "w-56", "aria-label": "Fruit" }, () =>
          h(KozmosSelectValue, null, { placeholder: () => "Pick a fruit" }),
        ),
        h(KozmosSelectContent, null, () =>
          fruit.map((option) =>
            h(KozmosSelectItem, { value: option.value }, () => option.label),
          ),
        ),
      ],
    );
};

/** A Combobox whose value the story holds, labelled Fruit. */
const combobox = () => {
  const value = ref("");
  return () =>
    h(KozmosCombobox, {
      class: "w-56",
      label: "Fruit",
      options: fruit,
      modelValue: value.value,
      "onUpdate:modelValue": (next: string) => (value.value = next),
    });
};

/** A tooltip on a button. */
const tooltip = () => () =>
  h(KozmosTooltipProvider, { delayDuration: 0 }, () =>
    h(KozmosTooltip, null, () => [
      h(KozmosTooltipTrigger, { asChild: true }, () =>
        h(KozmosButton, { variant: "outline" }, () => "Add to library"),
      ),
      h(KozmosTooltipContent, null, () => "Saves it for later"),
    ]),
  );

type Host = "dialog" | "drawer" | "bottom sheet" | "popover";

/** The overlay, opened from "Open", holding the field. */
function host(kind: Host, field: () => VNode) {
  const trigger = () => h(KozmosButton, null, () => "Open");
  if (kind === "popover")
    return h(KozmosPopover, null, () => [
      h(KozmosPopoverTrigger, { asChild: true }, trigger),
      h(KozmosPopoverContent, { "aria-label": "Choose a fruit" }, field),
    ]);
  const [Root, Trigger, Content, Title, Description] = (
    kind === "dialog"
      ? [
          KozmosDialog,
          KozmosDialogTrigger,
          KozmosDialogContent,
          KozmosDialogTitle,
          KozmosDialogDescription,
        ]
      : kind === "drawer"
        ? [
            KozmosDrawer,
            KozmosDrawerTrigger,
            KozmosDrawerContent,
            KozmosDrawerTitle,
            KozmosDrawerDescription,
          ]
        : [
            KozmosBottomSheet,
            KozmosBottomSheetTrigger,
            KozmosBottomSheetContent,
            KozmosBottomSheetTitle,
            KozmosBottomSheetDescription,
          ]
  ) as Component[];
  return h(Root, null, () => [
    h(Trigger, { asChild: true }, trigger),
    h(Content, null, () => [
      h(Title, null, () => "Choose a fruit"),
      h(Description, null, () => "The list opens above the overlay."),
      h("div", { class: "py-4" }, [field()]),
    ]),
  ]);
}

const story = (kind: Host, field: () => () => VNode): Story => ({
  render: () => ({
    setup: () => {
      const draw = field();
      return () => host(kind, draw);
    },
  }),
});

export const SelectInDialog = story("dialog", select);
export const ComboboxInDialog = story("dialog", combobox);
export const TooltipInDialog = story("dialog", tooltip);
export const SelectInDrawer = story("drawer", select);
export const ComboboxInDrawer = story("drawer", combobox);
export const SelectInBottomSheet = story("bottom sheet", select);
export const SelectInPopover = story("popover", select);
export const ComboboxInPopover = story("popover", combobox);
