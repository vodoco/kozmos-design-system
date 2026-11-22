import figma from "@figma/code-connect";
import { Grid } from "./Grid";

const cellSlots = [
  "Cell 1 Slot",
  "Cell 2 Slot",
  "Cell 3 Slot",
  "Cell 4 Slot",
  "Cell 5 Slot",
  "Cell 6 Slot",
  "Cell 7 Slot",
  "Cell 8 Slot",
];

figma.connect(
  Grid,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=359-1574",
  {
    props: {
      children: figma.children(cellSlots),
      cols: figma.enum("Columns", {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
      }),
      gap: figma.enum("Gap", {
        "2": 2,
        "4": 4,
        "6": 6,
      }),
    },
    example: ({ children, ...props }) => <Grid {...props}>{children}</Grid>,
  },
);
