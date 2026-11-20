import figma from "@figma/code-connect";
import { DatePicker } from "./DatePicker";

figma.connect(
  DatePicker,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=438-4292",
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
      // The open calendar, where the browser's own button gives way
      // (decision 105); Firefox keeps the browser's.
      defaultOpen: figma.enum("Content", {
        Closed: false,
        Open: true,
      }),
      label: figma.string("Label Text"),
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
      helperText,
      label,
      readOnly,
      status,
    }) => (
      <DatePicker
        autoFocus={autoFocus}
        defaultOpen={defaultOpen}
        defaultValue="2026-05-25"
        disabled={disabled}
        helperText={helperText}
        label={label}
        readOnly={readOnly}
        status={status}
        mixed={mixed}
        mixedLabel={mixedLabel}
        onResetMixed={onResetMixed}
        resetMixedLabel={resetMixedLabel}
      />
    ),
  },
);
