import figma from "@figma/code-connect";
import { TimePicker } from "./TimePicker";

figma.connect(
  TimePicker,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12011",
  {
    props: {
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
      // The open list of times (decision 104), in every engine.
      defaultOpen: figma.enum("Content", {
        Closed: false,
        Open: true,
      }),
      label: figma.string("Label Text"),
      value: figma.string("Value Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      defaultOpen,
      disabled,
      helperText,
      label,
      readOnly,
      status,
      value,
    }) => (
      <TimePicker
        autoFocus={autoFocus}
        defaultOpen={defaultOpen}
        defaultValue={value}
        disabled={disabled}
        helperText={helperText}
        label={label}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);
