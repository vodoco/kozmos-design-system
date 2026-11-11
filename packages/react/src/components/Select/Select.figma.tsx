import figma from "@figma/code-connect";
import { Select, SelectTrigger, SelectValue } from "./Select";

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
      error: figma.enum("Status", {
        Default: false,
        Error: true,
      }),
      placeholder: figma.string("Placeholder Text"),
    },
    example: ({
      autoFocus,
      disabled,
      error,
      mixed,
      onResetMixed,
      placeholder,
    }) => (
      <Select mixed={mixed} onResetMixed={onResetMixed}>
        <SelectTrigger autoFocus={autoFocus} disabled={disabled} error={error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </Select>
    ),
  },
);
