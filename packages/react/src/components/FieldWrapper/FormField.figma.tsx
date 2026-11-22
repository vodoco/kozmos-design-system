import figma from "@figma/code-connect";
import { FormField } from "./FieldWrapper";

figma.connect(
  FormField,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=431-5810",
  {
    props: {
      status: figma.enum("Status", {
        Default: "default",
        Error: "error",
        Warning: "warning",
        Success: "success",
      }),
      required: figma.enum("Required", {
        False: false,
        True: true,
      }),
      description: figma.enum("Content", {
        Basic: undefined,
        Description: figma.string("Description Text"),
        Helper: undefined,
        Full: figma.string("Description Text"),
      }),
      helperText: figma.enum("Content", {
        Basic: undefined,
        Description: undefined,
        Helper: figma.string("Helper Text"),
        Full: figma.string("Helper Text"),
      }),
      label: figma.string("Label Text"),
      optionalText: figma.string("Optional Text"),
      children: figma.slot("Content Slot"),
    },
    example: ({
      children,
      description,
      helperText,
      label,
      optionalText,
      required,
      status,
    }) => (
      <FormField
        description={description}
        helperText={helperText}
        label={label}
        optionalText={optionalText}
        required={required}
        status={status}
      >
        {children}
      </FormField>
    ),
  },
);
