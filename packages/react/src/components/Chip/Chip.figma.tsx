import figma from "@figma/code-connect";
import { Chip } from "./Chip";

const chipUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=227-1329";

const chipProps = {
  variant: figma.enum("Variant", {
    Neutral: "neutral",
    Brand: "brand",
    Destructive: "destructive",
  }),
  size: figma.enum("Size", {
    Small: "sm",
    Default: "default",
    Large: "lg",
  }),
  children: figma.string("Label Text"),
  selected: figma.enum("State", {
    Default: false,
    Selected: true,
    Disabled: false,
  }),
  disabled: figma.enum("State", {
    Default: false,
    Selected: false,
    Disabled: true,
  }),
  // GAP-170, decision 200: one of Tag's six emotions, deciding the colour
  // whatever the Variant. None is a chip in its variant's colours.
  emotion: figma.enum("Emotion", {
    None: undefined,
    Themed: "themed",
    Neutral: "neutral",
    Success: "success",
    Danger: "danger",
    Informative: "informative",
    Alert: "alert",
  }),
};

figma.connect(Chip, chipUrl, {
  variant: { Removable: "False" },
  props: chipProps,
  example: ({ children, disabled, emotion, selected, size, variant }) => (
    <Chip
      disabled={disabled}
      emotion={emotion}
      selected={selected}
      size={size}
      variant={variant}
    >
      {children}
    </Chip>
  ),
});

figma.connect(Chip, chipUrl, {
  variant: { Removable: "True" },
  props: chipProps,
  example: ({ children, disabled, emotion, selected, size, variant }) => (
    <Chip
      disabled={disabled}
      emotion={emotion}
      onRemove={() => {}}
      selected={selected}
      size={size}
      variant={variant}
    >
      {children}
    </Chip>
  ),
});
