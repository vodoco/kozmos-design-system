import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import {
  KozmosButton,
  KozmosMenu,
  KozmosMenuContent,
  KozmosMenuItem,
  KozmosMenuLabel,
  KozmosMenuSeparator,
  KozmosMenuTrigger,
} from "../../index";

/**
 * Vue's Menu: the stories React's has, with the same names, each drawn as
 * React's story draws it, from Kozmos parts only, inside the
 * KozmosThemeProvider the Storybook's decorator gives every story.
 * test/parity/menu.parity.spec.ts draws them in both, closed and open.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Layout/Menu",
  component: KozmosMenu,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosMenu, null, () => [
        h(KozmosMenuTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Open Menu"),
        ),
        h(KozmosMenuContent, null, () => [
          h(KozmosMenuLabel, null, () => "My Account"),
          h(KozmosMenuSeparator),
          h(KozmosMenuItem, null, () => "Profile"),
          h(KozmosMenuItem, null, () => "Billing"),
          h(KozmosMenuItem, null, () => "Team"),
          h(KozmosMenuItem, null, () => "Subscription"),
        ]),
      ]),
  }),
};

/** The items an external item sits among. */
const accountItems = () => [
  h(KozmosMenuItem, null, () => "Settings"),
  h(KozmosMenuItem, { external: true, asChild: true }, () =>
    h("a", { href: "https://docs.pointr.tech" }, "Documentation"),
  ),
  h(KozmosMenuSeparator),
  h(KozmosMenuItem, null, () => "Sign out"),
];

/**
 * An item that opens a page in a new tab draws the new-tab icon at its end
 * and is read "Documentation opens in a new tab" (decision 152).
 */
export const ExternalItem: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosMenu, null, () => [
        h(KozmosMenuTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Account"),
        ),
        h(KozmosMenuContent, null, accountItems),
      ]),
  }),
};

/**
 * ExternalItem, open, so the visual review draws the item with its new-tab
 * icon.
 */
export const ExternalItemOpen: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { style: { height: "200px" } }, [
        h(KozmosMenu, { defaultOpen: true, modal: false }, () => [
          h(KozmosMenuTrigger, { asChild: true }, () =>
            h(KozmosButton, { variant: "outline" }, () => "Account"),
          ),
          h(KozmosMenuContent, { align: "start" }, accountItems),
        ]),
      ]),
  }),
};
