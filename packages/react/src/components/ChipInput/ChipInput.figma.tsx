import figma from "@figma/code-connect";
import { ChipInput } from "./ChipInput";

/**
 * Figma Code Connect: ChipInput (GAP-222, decision 216)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68659
 *
 * Content=Filled is the set's two entries, coffee and wifi, as chips;
 * Empty is the placeholder alone. Focus is the keyboard's ring, not a prop.
 */
figma.connect(
  ChipInput,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68659",
  {
    props: {
      label: figma.string("Label Text"),
      placeholder: figma.string("Placeholder Text"),
      helperText: figma.string("Helper Text"),
      defaultValue: figma.enum("Content", {
        Filled: ["coffee", "wifi"],
        Empty: undefined,
      }),
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
        Readonly: false,
        Error: false,
      }),
      readOnly: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: false,
        Readonly: true,
        Error: false,
      }),
      // Error is `error` with its message, Error Text.
      error: figma.enum("State", {
        Error: figma.string("Error Text"),
      }),
    },
    example: ({
      defaultValue,
      disabled,
      error,
      helperText,
      label,
      placeholder,
      readOnly,
    }) => (
      <ChipInput
        defaultValue={defaultValue}
        disabled={disabled}
        error={error}
        helperText={helperText}
        label={label}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    ),
  },
);
