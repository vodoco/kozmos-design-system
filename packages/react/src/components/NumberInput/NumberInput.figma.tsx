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
      unit: figma.boolean("Show Unit", {
        true: figma.string("Unit Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      disabled,
      helperText,
      label,
      placeholder,
      readOnly,
      showSteppers,
      status,
      unit,
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
          placeholder={placeholder}
          readOnly={readOnly}
          showSteppers={showSteppers}
          status={status}
          unit={unit}
        />
      );
    },
  },
);
