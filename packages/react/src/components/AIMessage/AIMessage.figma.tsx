import figma from "@figma/code-connect";
import { AIMessage } from "./AIMessage";

/**
 * Figma Code Connect: AIMessage (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17989
 *
 * Status is status. Message Text is the words; Timed Out Text is
 * timedOutLabel. Show Action Card shows the Action Card Slot, actionCard.
 * trailing is the product's control and is not drawn.
 */
figma.connect(
  AIMessage,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17989",
  {
    props: {
      status: figma.enum("Status", {
        Complete: undefined,
        Streaming: "streaming",
        TimedOut: "timedOut",
      }),
      children: figma.string("Message Text"),
      timedOutLabel: figma.string("Timed Out Text"),
      actionCard: figma.boolean("Show Action Card", {
        true: figma.slot("Action Card Slot"),
        false: undefined,
      }),
    },
    example: ({ status, children, timedOutLabel, actionCard }) => (
      <AIMessage
        status={status}
        timedOutLabel={timedOutLabel}
        actionCard={actionCard}
      >
        {children}
      </AIMessage>
    ),
  },
);
