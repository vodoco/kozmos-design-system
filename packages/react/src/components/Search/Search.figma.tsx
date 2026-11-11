import figma from "@figma/code-connect";
import { Search } from "./Search";

/**
 * Figma Code Connect: Search
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-391
 */
figma.connect(
  Search,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-391",
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
      error: figma.enum("Status", {
        Default: false,
        Error: true,
      }),
      label: figma.string("Label Text"),
      placeholder: figma.string("Placeholder Text"),
      clearable: figma.boolean("Show Clear"),
    },
    example: ({
      autoFocus,
      clearable,
      disabled,
      error,
      label,
      placeholder,
      readOnly,
    }) => (
      <Search
        autoFocus={autoFocus}
        clearable={clearable}
        disabled={disabled}
        error={error}
        label={label}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    ),
  },
);
