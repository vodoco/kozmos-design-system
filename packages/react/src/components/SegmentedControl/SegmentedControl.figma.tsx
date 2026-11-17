import figma from "@figma/code-connect";
import { SegmentedControl } from "./SegmentedControl";

figma.connect(
  SegmentedControl,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=309-5165",
  {
    props: {
      size: figma.enum("Size", {
        Small: "sm",
        Default: "default",
        Large: "lg",
      }),
      defaultValue: figma.enum("Active", {
        One: "one",
        Two: "two",
        Three: "three",
      }),
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
        Error: false,
        Mixed: false,
      }),
      error: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: false,
        Error: true,
        Mixed: false,
      }),
      // Decision 191: no option chosen, whatever Active says, and the
      // "Multiple values" line under the track. Mixed Text is mapped once the
      // owner's plugin Update has put it in the library: the dry run reads
      // the live file, which has none before it.
      mixed: figma.enum("State", { Mixed: true }),
      item1Text: figma.string("Item 1 Text"),
      item2Text: figma.string("Item 2 Text"),
      item3Text: figma.string("Item 3 Text"),
    },
    example: ({
      defaultValue,
      disabled,
      error,
      item1Text,
      item2Text,
      item3Text,
      mixed,
      size,
    }) => (
      <SegmentedControl
        defaultValue={defaultValue}
        disabled={disabled}
        error={error}
        mixed={mixed}
        items={[
          { value: "one", label: item1Text },
          { value: "two", label: item2Text },
          { value: "three", label: item3Text },
        ]}
        size={size}
      />
    ),
  },
);
