import figma from "@figma/code-connect";
import { OTPInput } from "./OTPInput";

figma.connect(
  OTPInput,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=475-38745",
  {
    props: {
      length: figma.enum("Length", {
        "4": 4,
        "6": 6,
      }),
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
        Readonly: false,
      }),
      readOnly: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: false,
        Readonly: true,
      }),
      autoFocus: figma.enum("State", {
        Default: false,
        Focus: true,
        Disabled: false,
        Readonly: false,
      }),
      status: figma.enum("Status", {
        Default: "default",
        Error: "error",
        Warning: "warning",
        Success: "success",
      }),
      label: figma.string("Label Text"),
      // Digit 1 Text through Digit 6 Text are the code a person types, not
      // mapped: Code Connect substitutes a property only where the example
      // uses it, so the six can never be joined into its one value.
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      disabled,
      helperText,
      label,
      length,
      readOnly,
      status,
    }) => (
      <OTPInput
        autoFocus={autoFocus}
        disabled={disabled}
        helperText={helperText}
        label={label}
        length={length}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);
