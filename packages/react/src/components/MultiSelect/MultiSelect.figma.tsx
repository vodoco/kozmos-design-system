import figma from "@figma/code-connect";
import { MultiSelect } from "./MultiSelect";

figma.connect(
  MultiSelect,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9365",
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
      status: figma.enum("Status", {
        Default: "default",
        Error: "error",
        Warning: "warning",
        Success: "success",
      }),
      defaultValue: figma.enum("Content", {
        Empty: [],
        Selected: ["metro-station", "bus-stop"],
        Open: ["metro-station", "bus-stop"],
      }),
      defaultSearchValue: figma.enum("Content", {
        Empty: "",
        Selected: "",
        // The filled states carry "Filter Text", not "Placeholder Text": one
        // property could not serve both a 278px empty row and an 81px row
        // holding two chips, a clear button and a chevron.
        Open: figma.string("Filter Text"),
      }),
      label: figma.string("Label Text"),
      placeholder: figma.string("Placeholder Text"),
      // GAP-192: Show Group Labels draws Group 1 over options 1 and 2 and
      // Group 2 over option 3; off, the options have no group.
      group1: figma.boolean("Show Group Labels", {
        true: figma.string("Group 1 Text"),
        false: undefined,
      }),
      group2: figma.boolean("Show Group Labels", {
        true: figma.string("Group 2 Text"),
        false: undefined,
      }),
      option1: figma.string("Option 1 Text"),
      option2: figma.string("Option 2 Text"),
      option3: figma.string("Option 3 Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      defaultSearchValue,
      defaultValue,
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
      <MultiSelect
        defaultSearchValue={defaultSearchValue}
        defaultValue={defaultValue}
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
