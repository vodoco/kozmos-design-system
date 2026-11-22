import figma from "@figma/code-connect";
import { UserMessage } from "./UserMessage";

/**
 * Figma Code Connect: UserMessage (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17960
 *
 * Message Text is the words. speakerLabel is read before them and draws
 * nothing.
 */
figma.connect(
  UserMessage,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17960",
  {
    props: { children: figma.string("Message Text") },
    example: ({ children }) => <UserMessage>{children}</UserMessage>,
  },
);
