import figma from "@figma/code-connect";
import { ActionCard } from "./ActionCard";

/**
 * Figma Code Connect: ActionCard (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18496
 *
 * Content is title: Titled gives it (Title Text), Basic leaves it out.
 * Content Slot is children, the turn's rich content.
 */
figma.connect(
  ActionCard,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18496",
  {
    props: {
      title: figma.enum("Content", {
        Titled: figma.string("Title Text"),
        Basic: undefined,
      }),
      children: figma.slot("Content Slot"),
    },
    example: ({ title, children }) => (
      <ActionCard title={title}>{children}</ActionCard>
    ),
  },
);
