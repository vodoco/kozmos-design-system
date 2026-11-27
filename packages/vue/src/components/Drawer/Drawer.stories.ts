import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import {
  KozmosButton,
  KozmosDrawer,
  KozmosDrawerContent,
  KozmosDrawerDescription,
  KozmosDrawerFooter,
  KozmosDrawerHeader,
  KozmosDrawerTitle,
  KozmosDrawerTrigger,
  type KozmosDrawerSide,
} from "../../index";
import { KozmosNavbar } from "../../react-bridge";

/**
 * Vue's Drawer: the stories React's has, with the same names and args, each
 * drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. test/parity/drawer.parity.spec.ts
 * draws each in both, closed and open. Inline draws React's Navbar above the
 * panel, as React's story does: Navbar has no Vue port yet, so it is the
 * bridge's (the panel is native).
 */
type Args = Record<string, unknown>;
const sides: KozmosDrawerSide[] = ["right", "left", "top", "bottom"];

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/Drawer",
  component: KozmosDrawerContent,
  argTypes: {
    side: {
      control: "select",
      options: sides,
    },
  },
  args: {
    side: "right",
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: ({ side }) => ({
    setup: () => () =>
      h(KozmosDrawer, null, () => [
        h(KozmosDrawerTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Open drawer"),
        ),
        h(KozmosDrawerContent, { side: side as KozmosDrawerSide }, () => [
          h(KozmosDrawerHeader, null, () => [
            h(KozmosDrawerTitle, null, () => "Manage venue layers"),
            h(
              KozmosDrawerDescription,
              null,
              () =>
                "Review visibility, routing, and publishing settings for this map.",
            ),
          ]),
          h(
            "div",
            {
              class:
                "rounded-control border border-border bg-muted/40 p-4 text-sm",
            },
            "Drawer body content stays generic in Core. Product-specific content belongs in composed dashboard, SDK, or CMS components.",
          ),
          h(KozmosDrawerFooter, null, () => [
            h(KozmosButton, { variant: "outline" }, () => "Cancel"),
            h(KozmosButton, null, () => "Save changes"),
          ]),
        ]),
      ]),
  }),
};

// GAP-198: a panel floating in the region under a fixed header, which it
// leaves usable (decision 139). Opened from the start here, by the page, so
// it takes no focus on the docs page.
export const Inline: Story = {
  render: ({ side }) => ({
    setup: () => () =>
      h("div", { class: "flex h-[480px] flex-col overflow-hidden border" }, [
        h(KozmosNavbar, null, {
          logo: () => h("div", { class: "font-bold text-xl" }, "Kozmos"),
          actions: () => h(KozmosButton, { variant: "outline" }, () => "Help"),
        }),
        h("div", { class: "relative min-h-0 flex-1 p-4 bg-muted/20" }, [
          h(KozmosDrawer, { placement: "inline", defaultOpen: true }, () => [
            h(KozmosDrawerTrigger, { asChild: true }, () =>
              h(KozmosButton, { variant: "outline" }, () => "Get started"),
            ),
            h(KozmosDrawerContent, { side: side as KozmosDrawerSide }, () => [
              h(KozmosDrawerHeader, null, () => [
                h(KozmosDrawerTitle, null, () => "Get started"),
                h(
                  KozmosDrawerDescription,
                  null,
                  () => "Tours for this page. The header above stays usable.",
                ),
              ]),
            ]),
          ]),
        ]),
      ]),
  }),
};
