import figma from "@figma/code-connect";
import {
  DEFAULT_OPENING_HOURS,
  OpeningHoursEditor,
} from "./OpeningHoursEditor";

const openingHoursEditorUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-11989";

/**
 * Figma Code Connect: OpeningHoursEditor, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-11989
 *
 * DEFAULT_OPENING_HOURS is a value, not a component, so Code Connect collects
 * no import for it: each connection lists its imports.
 */
figma.connect(OpeningHoursEditor, openingHoursEditorUrl, {
  imports: [
    "import { DEFAULT_OPENING_HOURS, OpeningHoursEditor } from '@kozmos-ds/react/dashboard';",
  ],
  variant: { State: "Default" },
  example: () => <OpeningHoursEditor defaultValue={DEFAULT_OPENING_HOURS} />,
});

// Decision 179: a close before the open is the next day's.
figma.connect(OpeningHoursEditor, openingHoursEditorUrl, {
  imports: [
    "import { DEFAULT_OPENING_HOURS, OpeningHoursEditor } from '@kozmos-ds/react/dashboard';",
  ],
  variant: { State: "Overnight" },
  example: () => (
    <OpeningHoursEditor
      defaultValue={{
        ...DEFAULT_OPENING_HOURS,
        friday: { open: "18:00", close: "02:00" },
      }}
    />
  ),
});

// GAP-153: a multi-selection whose weekend differs.
figma.connect(OpeningHoursEditor, openingHoursEditorUrl, {
  imports: [
    "import { DEFAULT_OPENING_HOURS, OpeningHoursEditor } from '@kozmos-ds/react/dashboard';",
  ],
  variant: { State: "Mixed" },
  example: () => (
    <OpeningHoursEditor
      defaultValue={DEFAULT_OPENING_HOURS}
      mixedDays={["saturday", "sunday"]}
    />
  ),
});
