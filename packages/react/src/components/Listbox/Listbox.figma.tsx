import figma from "@figma/code-connect";
import { Listbox } from "./Listbox";

figma.connect(
  Listbox,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9475",
  {
    variant: { "Show Group Labels": false },
    props: {
      multiple: figma.enum("Selection", {
        Single: false,
        Multiple: true,
      }),
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
      }),
      defaultValue: figma.enum("Selection", {
        Single: "metro-station",
        Multiple: ["metro-station", "bus-stop"],
      }),
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
      option1Description: figma.string("Option 1 Description"),
      option2: figma.string("Option 2 Text"),
      option2Description: figma.string("Option 2 Description"),
      option3: figma.string("Option 3 Text"),
      option3Description: figma.string("Option 3 Description"),
    },
    example: ({
      media,
      option1Trailing,
      option2Trailing,
      option3Trailing,
      defaultValue,
      disabled,
      multiple,
      option1,
      option1Description,
      option2,
      option2Description,
      option3,
      option3Description,
    }) => (
      <Listbox
        defaultValue={defaultValue}
        disabled={disabled}
        multiple={multiple}
        options={[
          {
            description: option1Description,
            label: option1,
            media,
            trailing: option1Trailing,
            value: "metro-station",
          },
          {
            description: option2Description,
            label: option2,
            media,
            trailing: option2Trailing,
            value: "bus-stop",
          },
          {
            description: option3Description,
            label: option3,
            media,
            trailing: option3Trailing,
            value: "bike-parking",
          },
        ]}
      />
    ),
  },
);

// GAP-192: with Show Group Labels on, Group 1 heads options 1 and 2 and
// Group 2 option 3; with it off, the options carry no group at all.

figma.connect(
  Listbox,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9475",
  {
    variant: { "Show Group Labels": true },
    props: {
      multiple: figma.enum("Selection", {
        Single: false,
        Multiple: true,
      }),
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
      }),
      defaultValue: figma.enum("Selection", {
        Single: "metro-station",
        Multiple: ["metro-station", "bus-stop"],
      }),
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
      option1Description: figma.string("Option 1 Description"),
      option2: figma.string("Option 2 Text"),
      option2Description: figma.string("Option 2 Description"),
      option3: figma.string("Option 3 Text"),
      option3Description: figma.string("Option 3 Description"),
    },
    example: ({
      media,
      option1Trailing,
      option2Trailing,
      option3Trailing,
      defaultValue,
      disabled,
      group1,
      group2,
      multiple,
      option1,
      option1Description,
      option2,
      option2Description,
      option3,
      option3Description,
    }) => (
      <Listbox
        defaultValue={defaultValue}
        disabled={disabled}
        multiple={multiple}
        options={[
          {
            description: option1Description,
            group: group1,
            label: option1,
            media,
            trailing: option1Trailing,
            value: "metro-station",
          },
          {
            description: option2Description,
            group: group1,
            label: option2,
            media,
            trailing: option2Trailing,
            value: "bus-stop",
          },
          {
            description: option3Description,
            group: group2,
            label: option3,
            media,
            trailing: option3Trailing,
            value: "bike-parking",
          },
        ]}
      />
    ),
  },
);
