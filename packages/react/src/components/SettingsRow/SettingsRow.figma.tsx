import figma from "@figma/code-connect";
import { SettingsRow } from "./SettingsRow";
import { Switch } from "../Switch";

// GAP-040, decision 135: the SettingsRow set is a new Figma set. Its node id
// is a placeholder until the plugin's Build gives it one; this file stays
// out of figma.linked.config.json until then.
const settingsRowUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

figma.connect(SettingsRow, settingsRowUrl, {
  props: {
    label: figma.string("Label Text"),
    description: figma.boolean("Show Description", {
      true: figma.string("Description Text"),
      false: undefined,
    }),
    state: figma.enum("State", {
      None: undefined,
      Inherited: "inherited",
      Overridden: "overridden",
    }),
    disabled: figma.enum("Disabled", { False: false, True: true }),
    disabledReason: figma.enum("Disabled", {
      False: undefined,
      True: figma.string("Reason Text"),
    }),
  },
  example: (props) => (
    <SettingsRow
      label={props.label}
      description={props.description}
      state={props.state}
      onReset={() => {}}
      disabled={props.disabled}
      disabledReason={props.disabledReason}
      control={<Switch checked />}
    />
  ),
});
