import figma from "@figma/code-connect";
import { Progress } from "./Progress";

/**
 * Figma Code Connect: Progress
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252
 *
 * The set's Shape axis is Progress.shape (decision 131): the bar, and the
 * ring with its Size, Tone and Label, in the hole or beside it.
 */
figma.connect(
  Progress,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252",
  {
    variant: { Shape: "Linear" },
    props: {
      value: figma.enum("Value", {
        "0": 0,
        "25": 25,
        "50": 50,
        "75": 75,
        "100": 100,
      }),
    },
    example: (props) => <Progress value={props.value} />,
  },
);

figma.connect(
  Progress,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252",
  {
    variant: { Shape: "Circular" },
    props: {
      value: figma.enum("Value", {
        "0": 0,
        "25": 25,
        "50": 50,
        "75": 75,
        "100": 100,
      }),
      size: figma.enum("Size", {
        Small: "sm",
        Medium: "md",
        Large: "lg",
      }),
      // Themed is the default, so it names no tone.
      tone: figma.enum("Tone", {
        Neutral: "neutral",
        Success: "success",
        Danger: "danger",
        Informative: "informative",
        Alert: "alert",
      }),
      // One label, in the hole (Show Label) or beside the dial (Label
      // Beside).
      label: figma.boolean("Label Beside", {
        true: figma.string("Label"),
        false: figma.boolean("Show Label", {
          true: figma.string("Label"),
          false: undefined,
        }),
      }),
      labelPlacement: figma.boolean("Label Beside", {
        true: "end",
        false: undefined,
      }),
    },
    example: (props) => (
      <Progress
        shape="circular"
        size={props.size}
        tone={props.tone}
        value={props.value}
        labelPlacement={props.labelPlacement}
        label={props.label}
      />
    ),
  },
);
