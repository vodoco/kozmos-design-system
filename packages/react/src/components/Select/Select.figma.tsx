import figma from "@figma/code-connect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

figma.connect(
  SelectTrigger,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432",
  {
    props: {
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
        Mixed: false,
      }),
      autoFocus: figma.enum("State", {
        Default: false,
        Focus: true,
        Disabled: false,
        Mixed: false,
      }),
      // GAP-153: a field of a multi-selection whose values differ, and its
      // way back once chosen. Both are the root's: it holds the value.
      mixed: figma.enum("State", { Mixed: true }),
      onResetMixed: figma.boolean("Reset Mixed", {
        true: () => {},
        false: undefined,
      }),
      mixedLabel: figma.string("Mixed Text"),
      resetMixedLabel: figma.string("Reset Mixed Text"),
      error: figma.enum("Status", {
        Default: false,
        Error: true,
      }),
      placeholder: figma.string("Placeholder Text"),
      open: figma.enum("Content", {
        Closed: undefined,
        Open: true,
      }),
      option1: figma.string("Option 1 Text"),
      option2: figma.string("Option 2 Text"),
      option3: figma.string("Option 3 Text"),
      // GAP-164: each option's count, beside its words, outside the item
      // text the closed select repeats.
      count1: figma.boolean("Show Counts", {
        true: figma.string("Option 1 Count"),
        false: undefined,
      }),
      count2: figma.boolean("Show Counts", {
        true: figma.string("Option 2 Count"),
        false: undefined,
      }),
      count3: figma.boolean("Show Counts", {
        true: figma.string("Option 3 Count"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      count1,
      count2,
      count3,
      disabled,
      error,
      mixed,
      mixedLabel,
      onResetMixed,
      open,
      option1,
      option2,
      option3,
      placeholder,
      resetMixedLabel,
    }) => (
      <Select
        mixed={mixed}
        mixedLabel={mixedLabel}
        onResetMixed={onResetMixed}
        open={open}
        resetMixedLabel={resetMixedLabel}
      >
        <SelectTrigger autoFocus={autoFocus} disabled={disabled} error={error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem count={count1} value="option-1">
            {option1}
          </SelectItem>
          <SelectItem count={count2} value="option-2">
            {option2}
          </SelectItem>
          <SelectItem count={count3} value="option-3">
            {option3}
          </SelectItem>
        </SelectContent>
      </Select>
    ),
  },
);
