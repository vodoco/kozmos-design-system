import figma from "@figma/code-connect";
import { RatingEditor } from "./RatingEditor";

const ratingEditorUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD";

/**
 * Figma Code Connect: RatingEditor, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD
 */
figma.connect(RatingEditor, ratingEditorUrl, {
  variant: { State: "Default" },
  example: () => (
    <RatingEditor defaultValue={{ rating: 4.3, max: 5, count: 120 }} />
  ),
});

// Decision 180: a rating above its max is an error on both fields.
figma.connect(RatingEditor, ratingEditorUrl, {
  variant: { State: "Error" },
  example: () => (
    <RatingEditor defaultValue={{ rating: 7, max: 5, count: -3 }} />
  ),
});

// GAP-153: a multi-selection whose ratings differ.
figma.connect(RatingEditor, ratingEditorUrl, {
  variant: { State: "Mixed" },
  example: () => (
    <RatingEditor
      defaultValue={{ rating: null, max: 5, count: null }}
      mixed={{ rating: true, count: true }}
    />
  ),
});
