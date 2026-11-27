import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import {
  KozmosButton,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogFooter,
  KozmosDialogHeader,
  KozmosDialogTitle,
  KozmosDialogTrigger,
  KozmosInput,
} from "../../index";

/**
 * Vue's Dialog: the story React's has, with its name, drawn as React's story
 * draws it, from Kozmos parts only, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity/dialog.parity.spec.ts
 * draws it in both, closed and open.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/Dialog",
  component: KozmosDialog,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosDialog, null, () => [
        h(KozmosDialogTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Edit Profile"),
        ),
        h(KozmosDialogContent, { class: "sm:max-w-md" }, () => [
          h(KozmosDialogHeader, null, () => [
            h(KozmosDialogTitle, null, () => "Edit profile"),
            h(
              KozmosDialogDescription,
              null,
              () =>
                "Make changes to your profile here. Click save when you're done.",
            ),
          ]),
          h("div", { class: "flex flex-col gap-4 py-4" }, [
            h(KozmosInput, {
              id: "name",
              label: "Name",
              defaultValue: "Pedro Duarte",
            }),
            h(KozmosInput, {
              id: "username",
              label: "Username",
              defaultValue: "@peduarte",
            }),
          ]),
          h(KozmosDialogFooter, null, () => [
            h(
              KozmosButton,
              { variant: "outline", type: "button" },
              () => "Cancel",
            ),
            h(KozmosButton, { type: "submit" }, () => "Save changes"),
          ]),
        ]),
      ]),
  }),
};
