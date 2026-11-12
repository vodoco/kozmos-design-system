import figma from "@figma/code-connect";
import { Slider } from "./Slider";

/**
 * Figma Code Connect: Slider
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-473
 */
figma.connect(
  Slider,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-473",
  {
    props: {
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
      }),
      error: figma.enum("Status", {
        Default: false,
        Error: true,
      }),
      label: figma.string("Label Text"),
      defaultValue: figma.enum("Type", {
        Single: [50],
        Range: [20, 80],
      }),
      thumbCount: figma.enum("Type", {
        Single: 1,
        Range: 2,
      }),
      showValue: figma.boolean("Show Value"),
    },
    example: ({
      disabled,
      error,
      label,
      defaultValue,
      showValue,
      thumbCount,
    }) => (
      <Slider
        defaultValue={defaultValue}
        showValue={showValue}
        disabled={disabled}
        error={error}
        label={label}
        thumbCount={thumbCount}
      />
    ),
  },
);
