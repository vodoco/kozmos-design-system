import figma from "@figma/code-connect";
import { DirectionStep } from "./DirectionStep";

const directionStepUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6763";

figma.connect(DirectionStep, directionStepUrl, {
  props: {
    // The nineteen cases: the four turns, the six level changes by lift,
    // escalator and stairs, a plain level change, a transition between
    // buildings, turning back, walking, entry, exit and the two ramps.
    type: figma.enum("Type", {
      Straight: "straight",
      Left: "left",
      Right: "right",
      Destination: "destination",
      LiftUp: "lift-up",
      LiftDown: "lift-down",
      EscalatorUp: "escalator-up",
      EscalatorDown: "escalator-down",
      StairsUp: "stairs-up",
      StairsDown: "stairs-down",
      LevelUp: "level-up",
      LevelDown: "level-down",
      Transition: "transition",
      TurnBack: "turn-back",
      Walking: "walking",
      Enter: "enter",
      Exit: "exit",
      RampUp: "ramp-up",
      RampDown: "ramp-down",
    }),
    instruction: figma.string("Instruction Text"),
    distance: figma.string("Distance Text"),
    duration: figma.string("Duration Text"),
  },
  example: ({ type, instruction, distance, duration }) => (
    <DirectionStep
      type={type}
      instruction={instruction}
      distance={distance}
      duration={duration}
    />
  ),
});
