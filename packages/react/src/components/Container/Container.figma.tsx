import figma from "@figma/code-connect";
import { Container } from "./Container";

figma.connect(
  Container,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1034",
  {
    props: {
      centered: figma.enum("Centered", {
        True: true,
        False: false,
      }),
      inset: figma.enum("Inset", {
        Window: "window",
        Panel: "panel",
      }),
      block: figma.enum("Block", {
        None: undefined,
        Small: "sm",
        Medium: "md",
        Large: "lg",
      }),
      children: figma.slot("Content Slot") ?? figma.children(["Content Slot"]),
    },
    example: ({ centered, inset, block, children }) => (
      <Container centered={centered} inset={inset} block={block}>
        {children}
      </Container>
    ),
  },
);
