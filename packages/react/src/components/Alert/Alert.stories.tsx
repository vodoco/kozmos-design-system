import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertTitle, AlertDescription } from "./Alert";
import { Terminal } from "@kozmos-ds/icons";

const meta: Meta<typeof Alert> = {
  title: "Feedback/Alert",
  component: Alert,
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        Your account is about to expire. Please renew your subscription.
      </AlertDescription>
    </Alert>
  ),
};

export const Info: Story = {
  render: () => (
    <Alert variant="info">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Info</AlertTitle>
      <AlertDescription>
        Scheduled maintenance is planned for tonight.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * How loudly it is announced, and what the title is.
 *
 * `live` defaults to `off`: an alert is usually part of the page, and until
 * 2026-09-25 this was a hard-coded `role="alert"` with no way out, so a static
 * notice was read over whatever the visitor was doing every time the page
 * opened (GAP-006). `polite` and `assertive` are there for a notice that has
 * actually just appeared.
 *
 * The title carries its own size now. It had none, and the reset makes every
 * heading inherit, so it rendered at the same size as the description below it
 * (GAP-007). It is a `<p>` by default, as it is on SwiftUI and Compose — an
 * alert's title labels a notice, it does not open a section — and takes a
 * `level` when the alert really is a region of the page.
 */
export const LivenessAndTitle: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex max-w-[520px] flex-col gap-4">
      <Alert variant="info">
        <AlertTitle>View only</AlertTitle>
        <AlertDescription>
          Only Dashboard admins can change these settings. Not a live region:
          nothing is announced.
        </AlertDescription>
      </Alert>
      <Alert live="polite" variant="success">
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>
          role=&quot;status&quot; — read when the screen reader next pauses.
        </AlertDescription>
      </Alert>
      <Alert live="assertive" variant="destructive">
        <AlertTitle>Publish failed</AlertTitle>
        <AlertDescription>
          role=&quot;alert&quot; — interrupts. Only for something that cannot
          wait.
        </AlertDescription>
      </Alert>
    </div>
  ),
};
