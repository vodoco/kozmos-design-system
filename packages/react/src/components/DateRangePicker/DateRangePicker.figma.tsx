import figma from "@figma/code-connect";
import { DateRangePicker } from "./DateRangePicker";

figma.connect(
  DateRangePicker,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=443-10939",
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
      // GAP-255: a field of a multi-selection whose values differ, and its
      // way back once edited.
      mixed: figma.enum("State", { Mixed: true }),
      onResetMixed: figma.boolean("Reset Mixed", {
        true: () => {},
        false: undefined,
      }),
      mixedLabel: figma.string("Mixed Text"),
      resetMixedLabel: figma.string("Reset Mixed Text"),
      status: figma.enum("Status", {
        Default: "default",
        Error: "error",
        Warning: "warning",
        Success: "success",
      }),
      // The open range calendar, where the browser's own button gives way
      // (decision 105); Firefox keeps the browser's.
      defaultOpen: figma.enum("Content", {
        Closed: false,
        Open: true,
      }),
      label: figma.string("Label Text"),
      // Start Value Text and End Value Text are the dates as a locale shows
      // them ("May 21, 2026"); the value is ISO. Code Connect runs no code
      // between a property and the snippet, so the snippet gives the set's
      // dates as ISO, as DatePicker's does.
      startLabel: figma.string("Start Label Text"),
      endLabel: figma.string("End Label Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      mixed,
      mixedLabel,
      onResetMixed,
      resetMixedLabel,
      autoFocus,
      defaultOpen,
      disabled,
      endLabel,
      helperText,
      label,
      readOnly,
      startLabel,
      status,
    }) => (
      <DateRangePicker
        autoFocus={autoFocus}
        defaultOpen={defaultOpen}
        defaultValue={{ end: "2026-05-25", start: "2026-05-21" }}
        disabled={disabled}
        endLabel={endLabel}
        helperText={helperText}
        label={label}
        readOnly={readOnly}
        startLabel={startLabel}
        status={status}
        mixed={mixed}
        mixedLabel={mixedLabel}
        onResetMixed={onResetMixed}
        resetMixedLabel={resetMixedLabel}
      />
    ),
  },
);
