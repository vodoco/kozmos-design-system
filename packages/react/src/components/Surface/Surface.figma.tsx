import figma from "@figma/code-connect";
import { Surface } from "./Surface";

/**
 * Figma Code Connect: Surface (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18490
 *
 * Variant is variant: Solid is solid, the default; Glass is glass. Content
 * Slot is children.
 */
figma.connect(
  Surface,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18490",
  {
    props: {
      variant: figma.enum("Variant", { Solid: undefined, Glass: "glass" }),
      children: figma.slot("Content Slot"),
    },
    example: ({ variant, children }) => (
      <Surface variant={variant}>{children}</Surface>
    ),
  },
);
