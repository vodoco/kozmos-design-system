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
        Mixed: false,
      }),
      readOnly: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: false,
        Readonly: true,
        Mixed: false,
      }),
      autoFocus: figma.enum("State", {
        Default: false,
        Focus: true,
        Disabled: false,
        Readonly: false,
        Mixed: false,
      }),
      // GAP-255: a field of a multi-selection whose values differ. Reset
      // Mixed, Mixed Text and Reset Mixed Text are mapped once the owner's
      // plugin Update has put them in the library: the dry run reads the
      // live file, which has none of them before it.
      mixed: figma.enum("State", { Mixed: true }),
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
      mixed,
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
        mixed={mixed}
      />
    ),
  },
);
