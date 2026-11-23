import type { Meta, StoryObj } from "@storybook/vue3";
import { Terminal } from "@kozmos-ds/icons/vue";
import {
  KozmosAlert,
  KozmosAlertDescription,
  KozmosAlertTitle,
} from "../../index";

/**
 * Vue's Alert: the stories React's has, with the same names, each inside
 * the KozmosThemeProvider the Storybook's decorator gives every story,
 * drawn by its own render as React's is; test/parity/alert.parity.spec.ts
 * draws each in both and holds Vue's render to React's.
 */
const meta: Meta = {
  title: "Vue/Core/Feedback/Alert",
  component: KozmosAlert,
};

export default meta;
type Story = StoryObj;

const parts = {
  KozmosAlert,
  KozmosAlertDescription,
  KozmosAlertTitle,
  Terminal,
};

/** An icon, a title and a description, in one variant. */
const variant = (name: string | null, title: string, words: string): Story => ({
  render: () => ({
    components: parts,
    setup: () => ({ name, title, words }),
    template: `
      <KozmosAlert :variant="name ?? undefined">
        <Terminal class="h-4 w-4" />
        <KozmosAlertTitle>{{ title }}</KozmosAlertTitle>
        <KozmosAlertDescription>{{ words }}</KozmosAlertDescription>
      </KozmosAlert>
    `,
  }),
});

export const Default = variant(
  null,
  "Heads up!",
  "You can add components to your app using the cli.",
);

export const Destructive = variant(
  "destructive",
  "Error",
  "Your session has expired. Please log in again.",
);

export const Success = variant(
  "success",
  "Success",
  "Your changes have been saved successfully.",
);

export const Warning = variant(
  "warning",
  "Warning",
  "Your account is about to expire. Please renew your subscription.",
);

export const Info = variant(
  "info",
  "Info",
  "Scheduled maintenance is planned for tonight.",
);

/**
 * An icon and a description, no title: the words are centred on the icon,
 * with as much space below them as above, on one line or several (GAP-269).
 */
export const WithoutTitle: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    components: parts,
    template: `
      <div class="flex flex-col gap-4" style="max-width: 520px">
        <KozmosAlert variant="info">
          <Terminal class="h-4 w-4" />
          <KozmosAlertDescription>The merge is saved as a draft.</KozmosAlertDescription>
        </KozmosAlert>
        <KozmosAlert variant="warning">
          <Terminal class="h-4 w-4" />
          <KozmosAlertDescription>
            The merged unit keeps the first unit’s name, its category and its
            opening hours; the other units’ are kept in the merge history.
          </KozmosAlertDescription>
        </KozmosAlert>
      </div>
    `,
  }),
};

/**
 * How loudly it is announced, and what the title is. `live` defaults to
 * `off`: an alert is usually part of the page (GAP-006). The title is a
 * `<p>` by default and takes a `level` when the alert really is a region of
 * the page (GAP-007).
 */
export const LivenessAndTitle: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    components: parts,
    template: `
      <div class="flex flex-col gap-4" style="max-width: 520px">
        <KozmosAlert variant="info">
          <KozmosAlertTitle>View only</KozmosAlertTitle>
          <KozmosAlertDescription>
            Only Dashboard admins can change these settings. Not a live region:
            nothing is announced.
          </KozmosAlertDescription>
        </KozmosAlert>
        <KozmosAlert live="polite" variant="success">
          <KozmosAlertTitle>Saved</KozmosAlertTitle>
          <KozmosAlertDescription>
            role=&quot;status&quot; — read when the screen reader next pauses.
          </KozmosAlertDescription>
        </KozmosAlert>
        <KozmosAlert live="assertive" variant="destructive">
          <KozmosAlertTitle>Publish failed</KozmosAlertTitle>
          <KozmosAlertDescription>
            role=&quot;alert&quot; — interrupts. Only for something that cannot
            wait.
          </KozmosAlertDescription>
        </KozmosAlert>
      </div>
    `,
  }),
};
