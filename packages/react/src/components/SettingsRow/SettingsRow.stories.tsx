import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SettingsRow, type SettingsRowState } from "./SettingsRow";
import { List } from "../List/List";
import { Switch } from "../Switch/Switch";
import { Input } from "../Input/Input";

const meta: Meta<typeof SettingsRow> = {
  id: "data-display-settingsrow",
  title: "Core/Data display/SettingsRow",
  component: SettingsRow,
  parameters: { layout: "padded" },
  args: {
    label: "Show the floor selector",
    description: "Lets visitors change levels on the map.",
    state: "inherited",
  },
  render: (args) => (
    <List style={{ maxInlineSize: 640 }}>
      <SettingsRow {...args} control={<Switch checked />} />
    </List>
  ),
};

export default meta;
type Story = StoryObj<typeof SettingsRow>;

export const Default: Story = {};

/**
 * Pointr Cloud's SDK Configuration (GAP-040): each parameter is a row, its
 * value inherited from the system until the site changes it. Overridden, the
 * row offers Reset to default; a row that cannot change says why.
 */
export const SdkConfiguration: Story = {
  render: function SdkConfigurationStory() {
    const [banner, setBanner] = React.useState(true);
    const [bannerState, setBannerState] =
      React.useState<SettingsRowState>("overridden");
    return (
      <List style={{ maxInlineSize: 640 }}>
        <SettingsRow
          label="Analytics"
          description="Send anonymous usage events to Pointr."
          state="inherited"
          control={<Switch checked />}
        />
        <SettingsRow
          label="Show the banner"
          description="A message above the map. Effective once published."
          state={bannerState}
          onReset={() => {
            setBanner(false);
            setBannerState("inherited");
          }}
          control={
            <Switch
              checked={banner}
              onCheckedChange={(next) => {
                setBanner(next);
                setBannerState("overridden");
              }}
            />
          }
        />
        <SettingsRow
          label="Location refresh (seconds)"
          description="How often the blue dot is updated."
          state="inherited"
          control={
            <Input type="number" defaultValue={5} style={{ inlineSize: 96 }} />
          }
        />
        <SettingsRow
          label="Geofencing"
          description="Notify visitors as they enter a zone."
          state="overridden"
          onReset={() => {}}
          disabled
          disabledReason="Turn on Positioning first."
          control={<Switch />}
        />
      </List>
    );
  },
};

/** In the compact density, as Pointr Cloud's dashboard draws it. */
export const Compact: Story = {
  render: () => (
    <List density="compact" style={{ maxInlineSize: 640 }}>
      <SettingsRow
        label="Analytics"
        description="Send anonymous usage events to Pointr."
        state="inherited"
        control={<Switch checked />}
      />
      <SettingsRow
        label="Show the banner"
        state="overridden"
        onReset={() => {}}
        control={<Switch checked />}
      />
    </List>
  ),
};
