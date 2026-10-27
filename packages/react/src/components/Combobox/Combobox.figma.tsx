import figma from "@figma/code-connect";
import { Combobox } from "./Combobox";

figma.connect(
  Combobox,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=398-8298",
  {
    variant: { "Show Group Labels": false },
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
      defaultInputValue: figma.enum("Content", {
        Closed: undefined,
        Open: figma.string("Option 1 Text"),
      }),
      label: figma.string("Label Text"),
      placeholder: figma.string("Placeholder Text"),
      option1: figma.string("Option 1 Text"),
      option2: figma.string("Option 2 Text"),
      option3: figma.string("Option 3 Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      defaultInputValue,
      disabled,
      helperText,
      label,
      option1,
      option2,
      option3,
      placeholder,
      readOnly,
      status,
    }) => (
      <Combobox
        autoFocus={autoFocus}
        defaultInputValue={defaultInputValue}
        disabled={disabled}
        helperText={helperText}
        label={label}
        options={[
          { label: option1, value: "metro-station" },
          { label: option2, value: "bus-stop" },
          { label: option3, value: "bike-parking" },
        ]}
        placeholder={placeholder}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);

// GAP-192: with Show Group Labels on, Group 1 heads options 1 and 2 and
// Group 2 option 3; with it off, the options carry no group at all.

figma.connect(
  Combobox,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=398-8298",
  {
    variant: { "Show Group Labels": true },
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
      defaultInputValue: figma.enum("Content", {
        Closed: undefined,
        Open: figma.string("Option 1 Text"),
      }),
      label: figma.string("Label Text"),
      placeholder: figma.string("Placeholder Text"),
      group1: figma.string("Group 1 Text"),
      group2: figma.string("Group 2 Text"),
      option1: figma.string("Option 1 Text"),
      option2: figma.string("Option 2 Text"),
      option3: figma.string("Option 3 Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      defaultInputValue,
      disabled,
      group1,
      group2,
      helperText,
      label,
      option1,
      option2,
      option3,
      placeholder,
      readOnly,
      status,
    }) => (
      <Combobox
        autoFocus={autoFocus}
        defaultInputValue={defaultInputValue}
        disabled={disabled}
        helperText={helperText}
        label={label}
        options={[
          { group: group1, label: option1, value: "metro-station" },
          { group: group1, label: option2, value: "bus-stop" },
          { group: group2, label: option3, value: "bike-parking" },
        ]}
        placeholder={placeholder}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);
