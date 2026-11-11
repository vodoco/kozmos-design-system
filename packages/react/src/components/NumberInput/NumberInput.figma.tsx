import figma from "@figma/code-connect";
import { NumberInput } from "./NumberInput";

figma.connect(
  NumberInput,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=338-1796",
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
      // GAP-153: a field of a multi-selection whose values differ, and its
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
      showSteppers: figma.enum("Steppers", {
        True: true,
        False: false,
      }),
      label: figma.string("Label Text"),
      valueText: figma.string("Value Text"),
      placeholder: figma.string("Placeholder Text"),
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
      mixed,
      mixedLabel,
      onResetMixed,
      resetMixedLabel,
      placeholder,
      readOnly,
      showSteppers,
      status,
      valueText,
    }) => {
      const defaultValue = Number(valueText);

      return (
        <NumberInput
          autoFocus={autoFocus}
          defaultValue={
            Number.isFinite(defaultValue) ? defaultValue : undefined
          }
          disabled={disabled}
          helperText={helperText}
          label={label}
          mixed={mixed}
          onResetMixed={onResetMixed}
          mixedLabel={mixedLabel}
          resetMixedLabel={resetMixedLabel}
          placeholder={placeholder}
          readOnly={readOnly}
          showSteppers={showSteppers}
          status={status}
        />
      );
    },
  },
);
