import figma from "@figma/code-connect";
import { Input } from "./Input";

/**
 * Figma Code Connect: Input
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558
 */
const inputUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558";

const inputProps = {
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
  placeholder: figma.string("Placeholder Text"),
  helperText: figma.boolean("Show Helper Text", {
    true: figma.string("Helper Text"),
    false: undefined,
  }),
};

figma.connect(Input, inputUrl, {
  variant: { Action: "None" },
  props: inputProps,
  example: ({
    autoFocus,
    disabled,
    helperText,
    label,
    placeholder,
    readOnly,
    status,
  }) => (
    <Input
      autoFocus={autoFocus}
      disabled={disabled}
      helperText={helperText}
      label={label}
      placeholder={placeholder}
      readOnly={readOnly}
      status={status}
    />
  ),
});

// GAP-154: a copy button at the field's end, for a value the product shows,
// such as a feature's ID.
figma.connect(Input, inputUrl, {
  variant: { Action: "Copy" },
  props: inputProps,
  example: ({
    autoFocus,
    disabled,
    helperText,
    label,
    placeholder,
    readOnly,
    status,
  }) => (
    <Input
      autoFocus={autoFocus}
      disabled={disabled}
      helperText={helperText}
      label={label}
      placeholder={placeholder}
      readOnly={readOnly}
      status={status}
      action={{ kind: "copy" }}
    />
  ),
});

// GAP-154: a toggle at the field's end, the Featured star by default.
figma.connect(Input, inputUrl, {
  variant: { Action: "Toggle" },
  props: { ...inputProps, actionIcon: figma.instance("Action Icon") },
  example: ({
    actionIcon,
    autoFocus,
    disabled,
    helperText,
    label,
    placeholder,
    readOnly,
    status,
  }) => (
    <Input
      autoFocus={autoFocus}
      disabled={disabled}
      helperText={helperText}
      label={label}
      placeholder={placeholder}
      readOnly={readOnly}
      status={status}
      action={{
        kind: "toggle",
        label: "Featured",
        icon: actionIcon,
        pressed: false,
        onPressedChange: () => {},
      }}
    />
  ),
});

figma.connect(Input, inputUrl, {
  variant: { Action: "TogglePressed" },
  props: { ...inputProps, actionIcon: figma.instance("Action Icon") },
  example: ({
    actionIcon,
    autoFocus,
    disabled,
    helperText,
    label,
    placeholder,
    readOnly,
    status,
  }) => (
    <Input
      autoFocus={autoFocus}
      disabled={disabled}
      helperText={helperText}
      label={label}
      placeholder={placeholder}
      readOnly={readOnly}
      status={status}
      action={{
        kind: "toggle",
        label: "Featured",
        icon: actionIcon,
        pressed: true,
        onPressedChange: () => {},
      }}
    />
  ),
});
