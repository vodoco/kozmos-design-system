import figma from "@figma/code-connect";
import { ImageField } from "./ImageField";

/**
 * Figma Code Connect: ImageField, a Dashboard module (decision 183).
 * The set is not in the live file yet: its node id is a placeholder.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12692
 */
figma.connect(
  ImageField,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12692",
  {
    props: {
      label: figma.string("Label"),
      disabled: figma.enum("State", {
        Default: false,
        Full: false,
        Disabled: true,
      }),
    },
    example: (props) => (
      <ImageField
        label={props.label}
        max={7}
        maxSize={2 * 1024 * 1024}
        aspectRatio={16 / 9}
        disabled={props.disabled}
      />
    ),
  },
);
