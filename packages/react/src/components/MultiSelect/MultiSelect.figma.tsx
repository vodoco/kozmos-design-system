import figma from "@figma/code-connect";
import { MultiSelect } from "./MultiSelect";

figma.connect(
  MultiSelect,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9365",
  {
    variant: { "Show Group Labels": false },
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
      // Decision 215, GAP-282: Show Media is each option's Sm Avatar, its
      // initials the label's. GAP-260: Show Trailing is each option's muted
      // words at its end, before the check.
      media: figma.boolean("Show Media", { true: {}, false: undefined }),
      option1Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 1 Trailing"),
        false: undefined,
      }),
      option2Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 2 Trailing"),
        false: undefined,
      }),
      option3Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 3 Trailing"),
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
      media,
      option1Trailing,
      option2Trailing,
      option3Trailing,
      mixed,
      mixedLabel,
      onResetMixed,
      resetMixedLabel,
      defaultSearchValue,
      defaultValue,
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
      <MultiSelect
        defaultSearchValue={defaultSearchValue}
        defaultValue={defaultValue}
        disabled={disabled}
        helperText={helperText}
        label={label}
        options={[
          {
            label: option1,
            media,
            trailing: option1Trailing,
            value: "metro-station",
          },
          {
            label: option2,
            media,
            trailing: option2Trailing,
            value: "bus-stop",
          },
          {
            label: option3,
            media,
            trailing: option3Trailing,
            value: "bike-parking",
          },
        ]}
        placeholder={placeholder}
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

// GAP-192: with Show Group Labels on, Group 1 heads options 1 and 2 and
// Group 2 option 3; with it off, the options carry no group at all.

figma.connect(
  MultiSelect,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9365",
  {
    variant: { "Show Group Labels": true },
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
      group1: figma.string("Group 1 Text"),
      group2: figma.string("Group 2 Text"),
      // Decision 215, GAP-282: Show Media is each option's Sm Avatar, its
      // initials the label's. GAP-260: Show Trailing is each option's muted
      // words at its end, before the check.
      media: figma.boolean("Show Media", { true: {}, false: undefined }),
      option1Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 1 Trailing"),
        false: undefined,
      }),
      option2Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 2 Trailing"),
        false: undefined,
      }),
      option3Trailing: figma.boolean("Show Trailing", {
        true: figma.string("Option 3 Trailing"),
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
      media,
      option1Trailing,
      option2Trailing,
      option3Trailing,
      mixed,
      mixedLabel,
      onResetMixed,
      resetMixedLabel,
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
          {
            group: group1,
            label: option1,
            media,
            trailing: option1Trailing,
            value: "metro-station",
          },
          {
            group: group1,
            label: option2,
            media,
            trailing: option2Trailing,
            value: "bus-stop",
          },
          {
            group: group2,
            label: option3,
            media,
            trailing: option3Trailing,
            value: "bike-parking",
          },
        ]}
        placeholder={placeholder}
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
