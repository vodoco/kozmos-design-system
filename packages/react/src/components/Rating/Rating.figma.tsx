import figma from "@figma/code-connect";
import { Rating } from "./Rating";

figma.connect(
  Rating,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39747",
  {
    props: {
      // The halves are read-only stars only (decision 181): the set draws
      // them on Scale=Stars, State=Readonly and nowhere else.
      value: figma.enum("Value", {
        "0": 0,
        "0.5": 0.5,
        "1": 1,
        "1.5": 1.5,
        "2": 2,
        "2.5": 2.5,
        "3": 3,
        "3.5": 3.5,
        "4": 4,
        "4.5": 4.5,
        "5": 5,
      }),
      readOnly: figma.enum("State", {
        Default: false,
        Readonly: true,
      }),
    },
    example: ({ readOnly, value }) => (
      <Rating max={5} readOnly={readOnly} value={value} />
    ),
  },
);
