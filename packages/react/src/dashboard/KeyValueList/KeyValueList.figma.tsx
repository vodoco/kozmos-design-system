import figma from "@figma/code-connect";
import { KeyValueList } from "./KeyValueList";

const keyValueListUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12109";

/**
 * Figma Code Connect: KeyValueList, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12109
 */
figma.connect(KeyValueList, keyValueListUrl, {
  variant: { State: "Default" },
  example: () => (
    <KeyValueList
      defaultValue={[
        { id: "vendor", name: "vendor", type: "text", value: "Acme" },
        { id: "floors", name: "floors", type: "number", value: 3 },
      ]}
    />
  ),
});

figma.connect(KeyValueList, keyValueListUrl, {
  variant: { State: "Empty" },
  example: () => <KeyValueList defaultValue={[]} />,
});

// GAP-153: a row whose value differs across a multi-selection.
figma.connect(KeyValueList, keyValueListUrl, {
  variant: { State: "Mixed" },
  example: () => (
    <KeyValueList
      defaultValue={[
        { id: "vendor", name: "vendor", type: "text", value: "", mixed: true },
      ]}
    />
  ),
});
