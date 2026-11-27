import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import {
  KozmosBottomSheet,
  KozmosBottomSheetContent,
  KozmosBottomSheetDescription,
  KozmosBottomSheetHeader,
  KozmosBottomSheetTitle,
  KozmosBottomSheetTrigger,
  KozmosButton,
} from "../../index";

/**
 * Vue's BottomSheet: the story React's has, with its name, drawn as React's
 * story draws it, from Kozmos parts only, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity/drawer.parity.spec.ts
 * draws it in both, closed and open.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/BottomSheet",
  component: KozmosBottomSheet,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosBottomSheet, null, () => [
        h(KozmosBottomSheetTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Open Bottom Sheet"),
        ),
        h(KozmosBottomSheetContent, null, () => [
          h(KozmosBottomSheetHeader, null, () => [
            h(KozmosBottomSheetTitle, null, () => "Edit profile"),
            h(
              KozmosBottomSheetDescription,
              null,
              () =>
                "Make changes to your profile here. Click save when you're done.",
            ),
          ]),
          h("div", { class: "p-4 pb-0" }, [
            h("div", { class: "flex items-center justify-center space-x-2" }, [
              h(
                "span",
                { class: "text-sm font-medium" },
                "Profile Details Goal Here",
              ),
            ]),
          ]),
          h("div", { class: "p-4" }, [
            h(KozmosButton, { class: "w-full" }, () => "Save Changes"),
          ]),
        ]),
      ]),
  }),
};
